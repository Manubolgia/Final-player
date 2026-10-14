// The Final Girl's turn: playing action cards, moving with victims in tow,
// rescuing them at exits, items and her ultimate ability.

import { card, HAND_LIMIT, isAttackCard } from '../content/core';
import type { CardId, Effect, ZoneId } from '../types';
import { exits, moveVictim, victimName, victimsIn } from './board';
import { attackTargets, weaponRange } from './combat';
import { startRoll } from './dice';
import { deckOf } from './effects';
import {
  answers,
  choose,
  d6,
  eventDef,
  FG,
  frames,
  has,
  hooks,
  itemDef,
  K,
  L,
  log,
  plural,
  push,
  pushFx,
  RuleError,
  usable,
  zoneDef,
  zoneName,
} from './kernel';
import {
  cardGates,
  costMods,
  extraActions,
  extraUses,
  followFilters,
  itemHandlers,
  moveFilters,
  rescueFilters,
  rescueSpaces,
  ultimates,
} from './registry';
import type { Frame, GameState, ItemAction, MoveMode, Prompt, Src, Victim } from './state';
import { addTime, wrathOp } from './stats';

// ---- what can I do? -----------------------------------------------------------

/** Weapons in hand that can modify this attack card and reach something. */
export function weaponsFor(g: GameState, cardId: CardId): string[] {
  return g.fg.items
    .filter((it) => {
      const d = itemDef(g, it.id);
      if (!usable(g, it) || d.range === undefined || d.damage === undefined || d.modifies === 'none') return false;
      if (Array.isArray(d.modifies) && !d.modifies.includes(cardId)) return false;
      if (d.ability === 'item.strongmanHammer' && g.fg.health.hp < 4) return false;
      if (d.ability === 'item.charliesHammer' && g.fg.health.hp < 2) return false;
      return attackTargets(g, weaponRange(g, it.uid)).length > 0;
    })
    .map((it) => it.uid);
}

/** Ways to search away from a search space (Zappo). */
export const searchElsewhere: ((g: GameState) => boolean)[] = [];

export const canSearchHere = (g: GameState): boolean => {
  const d = deckOf(g, g.fg.zone);
  if (!d || !(g.itemDecks[d]?.length ?? 0)) return false;
  return !g.tokens.some((t) => t.zone === g.fg.zone && (t.id === 'searched' || t.id === 'mlFire'));
};

export function playable(g: GameState): { card: CardId; weapons: string[]; needsWeapon: boolean }[] {
  const out: { card: CardId; weapons: string[]; needsWeapon: boolean }[] = [];
  for (const c of new Set(g.fg.hand)) {
    const def = card(c);
    if (def.timing !== 'action') continue;
    if (!cardGates.every((fn) => fn(g, c))) continue;
    if (isAttackCard(c)) {
      const weapons = weaponsFor(g, c);
      const close = attackTargets(g, [0, 0]).length > 0;
      if (!close && !weapons.length) continue;
      out.push({ card: c, weapons, needsWeapon: !close });
      continue;
    }
    if (c === 'search' && !canSearchHere(g) && !searchElsewhere.some((fn) => fn(g))) continue;
    out.push({ card: c, weapons: [], needsWeapon: false });
  }
  return out;
}

export function itemActions(g: GameState): ItemAction[] {
  const out: ItemAction[] = [];
  for (const it of g.fg.items) {
    if (!usable(g, it)) continue;
    const d = itemDef(g, it.id);
    const h = d.ability ? itemHandlers[d.ability] : undefined;
    if (!h?.actions) continue;
    for (const a of h.actions(g, it, d)) out.push({ uid: it.uid, ...a });
  }
  for (const fn of extraActions) out.push(...fn(g));
  return out;
}

export function ultimateLabel(g: GameState): string | null {
  if (!g.fg.ultimate) return null;
  const u = ultimates[FG(g).ultimate.ability];
  return u ? u.label(g) : null;
}

export function isRescueSpace(g: GameState, zone: ZoneId): boolean {
  return !!zoneDef(g, zone).exit || rescueSpaces.some((fn) => fn(g, zone));
}

export function rescuable(g: GameState): Victim[] {
  if (g.phase !== 'action' || !isRescueSpace(g, g.fg.zone)) return [];
  return victimsIn(g, g.fg.zone).filter(
    (v) =>
      v.role !== 'werewolf' &&
      (v.role !== 'cursed' || g.victims.length === 1) &&
      rescueFilters.every((fn) => fn(g, v, g.fg.zone)),
  );
}

export function mainPrompt(g: GameState): Extract<Prompt, { type: 'main' }> {
  return { type: 'main', playable: playable(g), items: itemActions(g), ultimate: ultimateLabel(g), canRescue: rescuable(g).length > 0 };
}

export function canAct(g: GameState): boolean {
  const p = mainPrompt(g);
  return g.fg.hand.length > 0 || p.items.length > 0 || !!p.ultimate || p.canRescue;
}

/** Answer the Action Phase menu. */
export function mainInput(g: GameState, inp: import('./state').Input): void {
  switch (inp.t) {
    case 'play': {
      const p = playable(g).find((x) => x.card === inp.card);
      if (!p) throw new RuleError('You can\'t play that card now');
      if (inp.weapon && !p.weapons.includes(inp.weapon)) throw new RuleError('That weapon doesn\'t work with this card');
      if (p.needsWeapon && !inp.weapon) throw new RuleError('You need a ranged weapon to attack from here');
      g.fg.hand.splice(g.fg.hand.indexOf(inp.card), 1);
      g.actionDiscard.push(inp.card);
      log(g, `${FG(g).name} plays ${card(inp.card).name}.`);
      push(g, { t: 'play', card: inp.card, step: 'roll', ...(inp.weapon ? { weapon: inp.weapon } : {}) });
      for (const fn of beforePlay) fn(g, inp.card);
      return;
    }
    case 'discardForTime': {
      if (!inp.cards.length) throw new RuleError('Pick at least one card');
      const hand = [...g.fg.hand];
      for (const c of inp.cards) {
        const i = hand.indexOf(c);
        if (i < 0) throw new RuleError('You don\'t have those cards');
        hand.splice(i, 1);
      }
      g.fg.hand = hand;
      g.actionDiscard.push(...inp.cards);
      log(g, `You discard ${plural(inp.cards.length, 'card')} for Time.`);
      addTime(g, inp.cards.length * (has(g, 'ult.sheila') ? 2 : 1));
      return;
    }
    case 'item': {
      const a = itemActions(g).find((x) => x.uid === inp.uid && x.action === inp.action);
      if (!a) throw new RuleError('You can\'t use that now');
      const ex = Object.keys(extraUses).find((k) => inp.uid.startsWith(k));
      if (ex) return extraUses[ex](g, inp.action);
      const it = g.fg.items.find((i) => i.uid === inp.uid)!;
      itemHandlers[itemDef(g, it.id).ability!].use!(g, it, inp.action);
      return;
    }
    case 'ultimate': {
      const u = ultimates[FG(g).ultimate.ability];
      if (!g.fg.ultimate || !u || !u.label(g)) throw new RuleError('You can\'t use your ultimate now');
      u.use(g);
      return;
    }
    case 'rescue':
      if (!rescuable(g).length) throw new RuleError('Nobody to save here');
      push(g, { t: 'rescue' });
      return;
    case 'endPhase':
      g.mods.actionEnding = true;
      return;
    default:
      throw new RuleError('Not now');
  }
}

// ---- a strike in someone else's phase (Creech Manor) -------------------------------

frames.strike = {
  step(g, f: Extract<Frame, { t: 'strike' }>) {
    const cards = playable(g).filter((p) => isAttackCard(p.card));
    if (f.left <= 0 || !cards.length) {
      if (g.film.creech) g.film.creech.strike = null;
      return 'done';
    }
    g.prompt = { type: 'main', playable: cards, items: [], ultimate: null, canRescue: false, strike: f.mode };
    return 'wait';
  },
  input(g, f: Extract<Frame, { t: 'strike' }>, inp) {
    if (inp.t === 'endPhase') {
      if (g.film.creech) g.film.creech.strike = null;
      return 'done';
    }
    if (inp.t !== 'play' || !isAttackCard(inp.card)) throw new RuleError('Play an action card that deals damage, or pass');
    mainInput(g, inp);
    f.left--;
    return 'continue';
  },
};

/** Runs right after a card is played, before its roll (Psychic Confusion). */
export const beforePlay: ((g: GameState, c: CardId) => void)[] = [];

// ---- playing a card ---------------------------------------------------------------

type PF = Extract<Frame, { t: 'play' }>;

frames.play = {
  step(g, f: PF) {
    if (f.step === 'roll') {
      f.step = 'resolve';
      startRoll(g, { kind: 'action', card: f.card, ...(f.weapon ? { weapon: f.weapon } : {}) });
      return 'continue';
    }
    if (f.step === 'done') return 'done';
    const def = card(f.card);
    const s = f.successes ?? 0;
    if (f.card === 'atone' && !f.prayed && s < 3) {
      const book = g.fg.items.find((i) => itemDef(g, i.id).ability === 'item.prayerBook' && usable(g, i));
      if (book) {
        f.prayed = true;
        choose(
          g,
          `Atone: ${plural(s, 'success', 'successes')}. Use the Prayer Book (+1 success)?`,
          [
            { id: 'yes', label: `Yes (${plural(book.uses ?? 1, 'use')} left)` },
            { id: 'no', label: 'No' },
          ],
          { id: 'prayerBook', data: { uid: book.uid } },
        );
        return 'continue';
      }
    }
    const r = def.results!;
    const line = s >= 3 && r.triple ? r.triple : s >= 2 ? r.double : s === 1 ? r.single : r.fail;
    const label = s >= 3 && r.triple ? 'triple success' : s >= 2 ? 'double success' : s === 1 ? 'success' : 'failure';
    log(g, `${def.name}: ${label}.`, s ? 'good' : 'bad');
    f.step = 'done';
    resolveLine(g, line, { kind: 'action', id: f.card, ...(f.weapon ? { weapon: f.weapon } : {}) });
    return 'continue';
  },
};

answers.prayerBook = (g, id, data: { uid: string }) => {
  if (id !== 'yes') return;
  const f = [...g.stack].reverse().find((x) => x.t === 'play') as PF | undefined;
  if (!f) return;
  f.successes = (f.successes ?? 0) + 1;
  log(g, 'Prayer Book: +1 success.', 'good');
  const it = g.fg.items.find((i) => i.uid === data.uid);
  if (it?.uses !== undefined) {
    it.uses--;
    if (it.uses <= 0) {
      g.fg.items = g.fg.items.filter((i) => i !== it);
      g.itemDiscard.push(it.id);
    }
  }
};

/** A result line may offer a choice between options ("— or —"). */
export function resolveLine(g: GameState, line: Effect[][], src: Src): void {
  if (line.length > 1) {
    choose(
      g,
      'Choose the result',
      line.map((opt, i) => ({ id: String(i), label: describe(g, opt) })),
      { id: 'resultLine', data: { line, src } },
    );
    return;
  }
  pushFx(g, line[0] ?? [], src);
}

answers.resultLine = (g, id, data: { line: Effect[][]; src: Src }) => pushFx(g, data.line[Number(id)] ?? [], data.src);

export function describe(_g: GameState, list: Effect[]): string {
  if (!list.length) return 'No effect';
  const sgn = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  return list
    .map((e) => {
      switch (e.k) {
        case 'time':
          return `${sgn(e.n)} Time`;
        case 'horror':
          return `${sgn(e.n)} Horror`;
        case 'heal':
          return `heal ${e.n}`;
        case 'lose':
          return `lose ${e.n} health`;
        case 'move':
          return `move up to ${e.n}`;
        case 'endAction':
          return 'Action Phase ends';
        case 'damage':
          return `${e.n} damage`;
        case 'search':
          return e.n === 2 ? 'search (2 items, keep 1)' : 'take 1 item';
        case 'custom':
          return e.id === 'ml.enter' ? 'go into the house' : e.id === 'ml.returnCard' ? 'put the card back in the tableau' : e.id;
        default:
          return e.k;
      }
    })
    .join(', ');
}

// ---- moving -------------------------------------------------------------------------

type MF = Extract<Frame, { t: 'move' }>;

export function followLimit(g: GameState): number {
  let n = 2;
  if (has(g, 'ev.stubbornKids')) n--;
  if (g.fg.items.some((i) => itemDef(g, i.id).ability === 'item.whistle')) n++;
  return Math.max(0, n);
}

export function canFollow(g: GameState, v: Victim, to?: ZoneId): boolean {
  if (v.role === 'holyMan' || v.role === 'werewolf') return false;
  if (v.role === 'ghostHunter' && !g.film.creech?.hunterDied) return false;
  return followFilters.every((fn) => fn(g, v, to));
}

function destinations(g: GameState, mode: MoveMode): ZoneId[] {
  if (mode === 'free') return freeTargets(g);
  if (g.fg.legTrap) return [];
  let to: ZoneId[];
  if (mode === 'boat') to = L(g).zones.filter((z) => z.water && z.id !== g.fg.zone).map((z) => z.id);
  else if (mode === 'persuade') return (persuadeTargets as (g: GameState) => ZoneId[])(g);
  else {
    to = exits(g, g.fg.zone, 'fg');
    if (mode === 'walk' && has(g, 'item.pole') && !g.mods.usedThisPhase.includes('pole')) {
      const extra = new Set<ZoneId>();
      for (const a of to) for (const b of exits(g, a, 'fg')) if (b !== g.fg.zone && !to.includes(b)) extra.add(b);
      to = [...to, ...extra];
    }
  }
  for (const fn of moveFilters) to = fn(g, mode, to);
  return to;
}

/** Reiko's lunge: enemies within 2 spaces. */
export let freeTargets: (g: GameState) => ZoneId[] = (g) => [g.killer.zone];
export function setFreeTargets(fn: (g: GameState) => ZoneId[]): void {
  freeTargets = fn;
}

/** Filled in by Maple Lane: houses you can talk your way into. */
export let persuadeTargets: (g: GameState) => ZoneId[] = () => [];
export function setPersuadeTargets(fn: (g: GameState) => ZoneId[]): void {
  persuadeTargets = fn;
}

/** Something forces this move to be a panic roll (Creech Manor). */
export const panicMoves: ((g: GameState, f: MF) => string | null)[] = [];

frames.move = {
  step(g, f: MF) {
    if (f.remaining <= 0 || g.outcome) return 'done';
    if (f.mode === 'walk') {
      for (const why of panicMoves) {
        const reason = why(g, f);
        if (!reason) continue;
        const to = destinations(g, f.mode);
        const r = d6(g);
        const arrow = zoneDef(g, g.fg.zone).panic.find((a) => a.faces.includes(r));
        const ok = !!arrow && to.includes(arrow.to);
        log(g, `${reason}: you roll ${r}${ok ? ` and bolt to ${zoneName(g, arrow!.to)}` : ` and stay in ${zoneName(g, g.fg.zone)}`}.`, 'bad', { kind: 'dice', faces: [r] });
        if (ok) return arrive(g, f, arrow!.to, []);
        f.remaining--;
        return f.remaining > 0 ? 'continue' : 'done';
      }
    }
    const to = destinations(g, f.mode);
    if (!to.length) {
      if (f.mode !== 'walk' || f.moved === 0) log(g, 'There is nowhere you can go.');
      return 'done';
    }
    const here = victimsIn(g, g.fg.zone);
    g.prompt = {
      type: 'move',
      remaining: f.remaining,
      to,
      followers: here.filter((v) => canFollow(g, v)).map((v) => v.id),
      followLimit: followLimit(g),
      mode: f.mode,
      canStop: f.mode === 'walk' || f.mode === 'persuade',
      title:
        f.mode === 'boat'
          ? 'Ride the motorboat'
          : f.mode === 'free'
            ? 'Lunge at the enemy'
            : f.mode === 'persuade'
              ? 'Which house do you talk your way into?'
              : `Move (up to ${plural(f.remaining, 'space')})`,
    };
    return 'wait';
  },
  input(g, f: MF, inp) {
    if (inp.t === 'stop') {
      if (f.mode !== 'walk' && f.mode !== 'persuade') throw new RuleError('Pick where to go');
      moveEnded(g, f);
      return 'done';
    }
    if (inp.t !== 'moveTo') throw new RuleError('Pick where to go');
    if (!destinations(g, f.mode).includes(inp.zone)) throw new RuleError('You can\'t go there');
    const here = victimsIn(g, g.fg.zone);
    let bring = here.filter((v) => inp.bring.includes(v.id));
    if (bring.length !== inp.bring.length) throw new RuleError('Those victims aren\'t with you');
    if (bring.some((v) => !canFollow(g, v, inp.zone))) throw new RuleError('That victim won\'t follow you');
    if (bring.length > followLimit(g)) throw new RuleError(`Only ${followLimit(g)} victims can follow you`);
    const jumped = f.mode === 'walk' && !exits(g, g.fg.zone, 'fg').includes(inp.zone);
    if (jumped) {
      if (bring.length) log(g, 'You vault with the pole: nobody can follow.', 'bad');
      bring = [];
      g.mods.usedThisPhase.push('pole');
      log(g, '10-foot Pole: you vault over a space.', 'good');
    }
    if (!jumped && !bring.length && has(g, 'ev.clingyVictims') && followLimit(g) > 0) {
      const v = here.find((x) => canFollow(g, x, inp.zone));
      if (v) {
        bring = [v];
        log(g, 'Clingy Victims: someone grabs on and comes with you.', 'bad');
      }
    }
    return arrive(g, f, inp.zone, bring);
  },
};

function arrive(g: GameState, f: MF, zone: ZoneId, bring: Victim[]): 'continue' | 'done' {
  const from = g.fg.zone;
  const intoKiller = !g.film.birds && g.killer.zone === zone && !K(g).invulnerable;
  if (intoKiller && !has(g, 'ult.barbara') && !has(g, 'ev.liquidCourage') && bring.some((v) => v.role !== 'girlfriend')) {
    bring = bring.filter((v) => v.role === 'girlfriend');
    log(g, 'The victims won\'t follow you into the Killer\'s space.', 'bad');
  }
  if (bring.length && g.tokens.some((t) => t.id === 'closed' && t.zone === zone)) {
    bring = [];
    log(g, `${zoneName(g, zone)} is closed: the victims can't go in.`, 'bad');
  }
  g.fg.zone = zone;
  f.remaining--;
  f.moved++;
  if (f.mode === 'boat') {
    const boat = g.tokens.find((t) => t.id === 'motorboat');
    if (boat) boat.zone = zone;
  }
  const w = bring.length ? ` with ${bring.length === 1 ? victimName(bring[0]) : `${bring.length} victims`}` : '';
  log(g, `${FG(g).name} goes to ${zoneName(g, zone)}${w}.`, 'info', { kind: 'fgMove', path: [from, zone], ...(bring.length ? { victims: bring.map((v) => v.id) } : {}) });
  for (const v of bring) moveVictim(g, v, zone);
  for (const fn of hooks.fgEnters) fn(g, zone, from);
  if (f.mode !== 'walk') f.remaining = 0;
  if (f.remaining <= 0) moveEnded(g, f);
  if (rescuable(g).length) push(g, { t: 'rescue' });
  return f.remaining > 0 && !g.outcome ? 'continue' : 'done';
}

/** After a move (the Tour Guide's free extra step). */
export const moveEndHooks: ((g: GameState, f: MF) => void)[] = [];
function moveEnded(g: GameState, f: MF): void {
  for (const fn of moveEndHooks) fn(g, f);
}

// ---- rescuing ---------------------------------------------------------------------

frames.rescue = {
  step(g) {
    const vs = rescuable(g);
    if (!vs.length) return 'done';
    const slots = g.fg.slots.map((s, i) => (s ? -1 : i)).filter((i) => i >= 0);
    g.prompt = { type: 'rescue', victims: vs.map((v) => v.id), slots, ultimate: g.fg.ultimate };
    return 'wait';
  },
  input(g, _f, inp) {
    if (inp.t === 'rescueDone') return 'done';
    if (inp.t !== 'rescueOne') throw new RuleError('Save a victim or finish');
    const v = rescuable(g).find((x) => x.id === inp.victim);
    if (!v) throw new RuleError('You can\'t save that victim');
    if (!g.fg.ultimate && g.fg.slots[inp.slot] !== false) throw new RuleError('That slot is taken');
    saveVictim(g, v, inp.slot);
    return 'continue';
  },
};

export function saveVictim(g: GameState, v: Victim, slot: number): void {
  const fg = FG(g);
  g.victims = g.victims.filter((x) => x !== v);
  g.fg.saved++;
  g.mods.rescuedThisPhase++;
  log(g, `${fg.name} saves ${victimName(v)}!`, 'good');
  releaseRole(g, v);
  if (v.role === 'superTourist') {
    log(g, 'You saved the Super Tourist: lower a Wrath by 4.', 'good');
    wrathOp(g, 'choose', 'reduce', 4);
  }
  if (has(g, 'ev.clingyCampers') && g.mods.rescuedThisPhase > 1) {
    log(g, 'Clingy Campers: lose 1 health.', 'bad');
    pushFx(g, [{ k: 'lose', n: 1 }], { kind: 'event' });
  }
  for (const fn of onSave) fn(g, v);
  if (g.fg.ultimate) {
    log(g, `Reward: ${fg.extraText}.`, 'good');
    pushFx(g, fg.extra, { kind: 'rescue' });
    return;
  }
  g.fg.slots[slot] = true;
  const s = fg.slots[slot];
  log(g, `Reward: ${s.text}.`, 'good');
  if (g.fg.slots.every(Boolean)) {
    g.fg.ultimate = true;
    log(g, `Ultimate Ability unlocked! ${fg.ultimate.text}`, 'good');
    for (const fn of onUltimate) fn(g);
  }
  pushFx(g, s.effects, { kind: 'rescue' });
}

export const onSave: ((g: GameState, v: Victim) => void)[] = [];
export const onUltimate: ((g: GameState) => void)[] = [];

/** A special victim left play: discard its Event. */
export function releaseRole(g: GameState, v: Victim): void {
  if (!v.role) return;
  const ev = ROLE_EVENT[v.role];
  if (!ev) return;
  if ((v.role === 'ghostHunter' || v.role === 'smalley') && g.victims.some((x) => x !== v && x.role === v.role)) return;
  const id = g.activeEvents.find((e) => eventDef(g, e).ability === ev);
  if (id) {
    g.activeEvents = g.activeEvents.filter((e) => e !== id);
    g.eventDiscard.push(id);
    log(g, `${eventDef(g, id).name} is discarded.`);
  }
}

const ROLE_EVENT: Record<string, string> = {
  boyfriend: 'ev.boyfriend',
  girlfriend: 'ev.girlfriend',
  cursed: 'ev.revenge',
  superTourist: 'ev.superTourist',
  holyMan: 'ev.holyMan',
  tourGuide: 'ev.tourGuide',
  fiance: 'ev.fiance',
  sister: 'ev.sister',
  werewolf: 'ev.werewolf',
  ghostHunter: 'ev.ghostHunters',
  mlBoyfriend: 'ev.mlBoyfriend',
  smalley: 'ev.smalleys',
};

// ---- planning ---------------------------------------------------------------------

export function cost(g: GameState, c: CardId): number {
  let n = card(c).cost;
  for (const fn of costMods) n = fn(g, c, n);
  return n;
}

export function buyable(g: GameState): CardId[] {
  if (g.fg.hand.length >= HAND_LIMIT) return [];
  return Object.entries(g.tableau)
    .filter(([c, n]) => n > 0 && cost(g, c) > 0 && cost(g, c) <= g.fg.time)
    .map(([c]) => c);
}

export function planningInput(g: GameState, f: Extract<Frame, { t: 'phase' }>, inp: import('./state').Input): void {
  if (inp.t === 'endPlanning') {
    f.step = 2;
    return;
  }
  if (inp.t !== 'buy') throw new RuleError('Buy a card or finish planning');
  if (!buyable(g).includes(inp.card)) throw new RuleError('You can\'t buy that');
  const c = cost(g, inp.card);
  g.tableau[inp.card]--;
  g.fg.hand.push(inp.card);
  g.fg.time -= c;
  log(g, `You buy ${card(inp.card).name} for ${c} Time (${g.fg.time} left).`);
}

