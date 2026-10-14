import { card, HAND_LIMIT } from '../content/core';
import type { Effect, ZoneId } from '../types';
import { closestVictims, distances, killVictim, moveVictim, panicVictims, placeVictims, shortestPaths, targetable, victimsIn } from './board';
import { fgDealDamage, pushKillerAction } from './combat';
import {
  answers,
  choose,
  customs,
  d6,
  frames,
  has,
  itemDef,
  K,
  L,
  log,
  pick,
  plural,
  push,
  runCustom,
  topOf,
  uid,
  zoneDef,
  zoneName,
} from './kernel';
import { itemHandlers, placeKillerOverrides } from './registry';
import type { Frame, GameState, Src, Victim } from './state';
import {
  addBloodlust,
  addHorror,
  addTime,
  damageKiller,
  healFG,
  healKiller,
  hurtFG,
  unleash,
  wrathAmount,
  wrathOp,
} from './stats';

frames.fx = {
  step(g, f: Extract<Frame, { t: 'fx' }>) {
    const e = f.list[f.i];
    if (!e) return 'done';
    f.i++;
    applyEffect(g, e, f.src);
    return 'continue';
  },
};

export function applyEffect(g: GameState, e: Effect, src: Src): void {
  if (g.outcome) return;
  switch (e.k) {
    case 'time':
      return addTime(g, e.n);
    case 'horror':
      return addHorror(g, e.n);
    case 'heal':
      return healFG(g, e.n, src);
    case 'lose':
      return hurtFG(g, e.n);
    case 'move': {
      let n = e.n;
      if (n >= 2 && has(g, 'dp.windGust')) {
        log(g, 'Gust of Wind: your move is 1 space shorter.', 'bad');
        n--;
      }
      push(g, { t: 'move', remaining: n, mode: 'walk', moved: 0, src });
      return;
    }
    case 'endAction':
      if (g.phase === 'action') {
        g.mods.actionEnding = true;
        log(g, 'Your Action Phase ends.', 'bad');
      }
      return;
    case 'damage':
      return fgDealDamage(g, e.n, src);
    case 'bonusDice':
      g.mods.bonusDice += e.n;
      log(g, `+${plural(e.n, 'die', 'dice')} on your next horror roll.`, 'good');
      return;
    case 'partials':
      if (e.scope === 'phase') {
        g.mods.partialsPhase = true;
        log(g, 'Until this Action Phase ends, 3s and 4s are successes.', 'good');
      } else {
        g.mods.partialsNext = true;
        log(g, 'On your next horror roll, 3s and 4s are successes.', 'good');
      }
      return;
    case 'search':
      return startSearch(g, e.n);
    case 'itemAny':
      return takeItemFromAnyDeck(g);
    case 'takeCard':
      return takeActionCard(g, e.card, e.maxCost);
    case 'ignoreAttack': {
      const a = topOf(g, 'attackFG');
      if (a) {
        a.damage = 0;
        log(g, 'You avoid all the damage.', 'good');
      }
      return;
    }
    case 'reduceAttack': {
      const a = topOf(g, 'attackFG');
      if (a) {
        const floor = e.min ?? 0;
        a.damage = Math.max(Math.min(floor, a.damage), a.damage - e.n);
        log(g, `The damage drops to ${a.damage}.`, 'good');
      }
      return;
    }
    case 'bloodlust':
      return addBloodlust(g, e.n);
    case 'killer':
      return pushKillerAction(g, e.a, src);
    case 'killerHeal':
      return healKiller(g, e.n);
    case 'event':
      return drawEvent(g);
    case 'terror':
      return drawTerror(g);
    case 'victims': {
      const zone = e.at === 'killerStart' ? g.killer.startZone : e.at === 'fgStart' ? g.fg.startZone : e.at;
      placeVictims(g, zone, e.n);
      return;
    }
    case 'panic': {
      const list = g.victims.filter((v) => v.role !== 'werewolf' && (e.who === 'notFG' ? v.zone !== g.fg.zone : v.zone === g.killer.zone));
      if (list.length) panicVictims(g, list, e.times);
      return;
    }
    case 'wrath': {
      const n = e.n ?? (e.by ? wrathAmount(g, e.by) : 1);
      return wrathOp(g, e.which, e.op, n);
    }
    case 'unleash':
      return unleash(g, e.which);
    case 'discardRandom':
      return discardRandomCards(g, e.n, 'Divine Wrath');
    case 'victimsStep':
      return victimsStepTowardEnemy(g);
    case 'custom':
      return runCustom(g, e.id, e.data, src);
  }
}

// ---- decks --------------------------------------------------------------------

export function drawTerror(g: GameState): void {
  const id = g.terrorDeck.shift();
  if (!id) {
    log(g, 'The Terror deck is empty.');
    return;
  }
  push(g, { t: 'terror', card: id });
}

export function drawEvent(g: GameState): void {
  const id = g.eventDeck.shift();
  if (!id) {
    log(g, 'No Event cards left.');
    return;
  }
  push(g, { t: 'event', card: id });
}

customs.discardNextTerror = (g) => {
  const id = g.terrorDeck.shift();
  if (id) {
    g.terrorDiscard.push(id);
    log(g, 'The next Terror card is discarded.', 'good');
  }
};

customs.bloodlustPerKillThisPhase = (g) => {
  const n = g.mods.killedThisKillerPhase;
  if (n) addBloodlust(g, n);
};

customs.healPerDeadVictim = (g) => {
  if (g.dead.length) healKiller(g, g.dead.length);
};

customs.discardRandomCards = (g, data: { n: number; why: string }) => discardRandomCards(g, data.n, data.why);

export function discardRandomCards(g: GameState, n: number, why: string): void {
  for (let i = 0; i < n && g.fg.hand.length; i++) {
    const c = pick(g, g.fg.hand);
    g.fg.hand.splice(g.fg.hand.indexOf(c), 1);
    g.actionDiscard.push(c);
    log(g, `${why}: ${card(c).name} is discarded at random.`, 'bad');
  }
}

// ---- action cards ---------------------------------------------------------------

export function takeActionCard(g: GameState, id?: string, maxCost?: number): void {
  const options = Object.entries(g.tableau).filter(([c, n]) => n > 0 && (id ? c === id : card(c).cost <= (maxCost ?? 99)));
  if (!options.length) {
    log(g, 'There is no such action card left to take.');
    return;
  }
  if (options.length === 1) return gainCard(g, options[0][0]);
  choose(
    g,
    'Take which action card?',
    options.map(([c]) => ({ id: c, label: `${card(c).name} (cost ${card(c).cost})`, detail: card(c).text })),
    { id: 'gainCard' },
  );
}

answers.gainCard = (g, id) => gainCard(g, id);

export function gainCard(g: GameState, id: string): void {
  g.tableau[id]--;
  g.fg.hand.push(id);
  log(g, `You take ${card(id).name}.`, 'good');
  if (g.fg.hand.length > HAND_LIMIT) push(g, { t: 'discardDown' });
}

// ---- items -----------------------------------------------------------------------

export const handsUsed = (g: GameState): number =>
  g.fg.items.filter((i) => i.inHands).reduce((s, i) => s + itemDef(g, i.id).hands, 0);

/** You take an item card. */
export function gainItem(g: GameState, id: string): void {
  const d = itemDef(g, id);
  if (d.trap) {
    runCustom(g, 'cn.trapItem', { id }, { kind: 'system' });
    return;
  }
  if (d.ability === 'item.list') {
    runCustom(g, 'cm.list', { id }, { kind: 'system' });
    return;
  }
  const it = { uid: uid(g, 'i'), id, inHands: false, ...(d.uses ? { uses: d.uses } : {}) };
  const fits = d.hands > 0 && handsUsed(g) + d.hands <= 2;
  g.fg.items.push(it);
  it.inHands = fits;
  log(
    g,
    `You get the ${d.name}${d.hands === 0 ? '' : fits ? ' (in your hands)' : ' (in your backpack)'}.`,
    'good',
    { kind: 'card', deck: 'item', id },
  );
  const h = d.ability ? itemHandlers[d.ability] : undefined;
  h?.gained?.(g, it);
  if (d.hands > 0 && !fits) push(g, { t: 'arrange', optional: false });
}

/** Discard an item you hold. */
export function discardItem(g: GameState, uidv: string): void {
  const it = g.fg.items.find((i) => i.uid === uidv);
  if (!it) return;
  for (const guard of discardGuards) if (guard(g, it)) return;
  g.fg.items = g.fg.items.filter((i) => i !== it);
  g.itemDiscard.push(it.id);
  log(g, `The ${itemDef(g, it.id).name} is discarded.`);
  runCustom(g, 'itemDiscarded', { id: it.id }, { kind: 'system' });
}

customs.itemDiscarded = () => {};

/** Return true to stop (or take over) an item's discard. */
export const discardGuards: ((g: GameState, it: { uid: string; id: string }) => boolean)[] = [];

/** Use up one charge of a limited-use item. */
export function spendUse(g: GameState, uidv: string): void {
  const it = g.fg.items.find((i) => i.uid === uidv);
  if (!it || it.uses === undefined) return;
  it.uses--;
  if (it.uses <= 0) discardItem(g, uidv);
}

export function itemDeckIds(g: GameState): string[] {
  return L(g).itemDecks;
}

/** Item deck a space searches (its own id, or its house quadrant). */
export function deckOf(g: GameState, zone: ZoneId): string | undefined {
  const z = L(g).zones.find((x) => x.id === zone);
  if (!z?.search) return undefined;
  return z.deck ?? z.id;
}

export function takeItemFromAnyDeck(g: GameState): void {
  const decks = itemDeckIds(g).filter((d) => g.itemDecks[d]?.length);
  if (!decks.length) {
    log(g, 'Every item deck is empty.');
    return;
  }
  choose(
    g,
    'Take the top item of which deck?',
    decks.map((d) => {
      const top = g.itemDecks[d][0];
      return { id: d, label: `${zoneName(g, d)} (${top.up ? itemDef(g, top.id).name : 'face down'})`, zone: d };
    }),
    { id: 'takeTopItem' },
  );
}

answers.takeTopItem = (g, deck) => {
  const top = g.itemDecks[deck]?.shift();
  if (top) gainItem(g, top.id);
};

export function startSearch(g: GameState, n: number, deck?: string): void {
  const d = deck ?? deckOf(g, g.fg.zone);
  const blocked = !deck && g.tokens.some((t) => t.zone === g.fg.zone && (t.id === 'searched' || t.id === 'mlFire'));
  if ((!d || blocked || !(g.itemDecks[d]?.length ?? 0)) && !deck && customs['cn.zappoSearch'] && g.fg.items.some((i) => i.id === 'zappo')) {
    return runCustom(g, 'cn.zappoSearch', n, { kind: 'item', id: 'zappo' });
  }
  if (!d) {
    log(g, 'There is nothing to search here.');
    return;
  }
  // Maple Lane: a searched house is marked and can't be searched again.
  if (!deck && zoneDef(g, g.fg.zone).house) g.tokens.push({ id: 'searched', zone: g.fg.zone });
  push(g, { t: 'search', deck: d, n, drawn: [] });
}

frames.search = {
  step(g, f: Extract<Frame, { t: 'search' }>) {
    const deck = g.itemDecks[f.deck] ?? [];
    if (!f.drawn.length) {
      if (!deck.length) {
        log(g, `No items left in ${zoneName(g, f.deck)}.`);
        return 'done';
      }
      const extra = has(g, 'ult.asami') ? 1 : 0;
      f.drawn = deck.splice(0, f.n + extra).map((c) => c.id);
      const trap = f.drawn.find((id) => itemDef(g, id).trap);
      if (trap) {
        f.drawn = f.drawn.filter((id) => id !== trap);
        if (has(g, 'ult.asami')) log(g, `Asami spots the ${itemDef(g, trap).name} and leaves it.`, 'good');
        else if (f.zappo) {
          log(g, `Zappo sets off the ${itemDef(g, trap).name} and runs off screaming. The trap does nothing.`, 'bad');
          const z = g.fg.items.find((i) => i.id === 'zappo');
          if (z) discardItem(g, z.uid);
        } else runCustom(g, 'cn.trapItem', { id: trap }, { kind: 'system' });
        if (has(g, 'ult.asami') || f.zappo) g.itemDiscard.push(trap);
        if (!f.drawn.length) return 'done';
      }
      if (f.drawn.length === 1) {
        gainItem(g, f.drawn[0]);
        return 'done';
      }
    }
    g.prompt = { type: 'search', drawn: f.drawn };
    return 'wait';
  },
  input(g, f: Extract<Frame, { t: 'search' }>, inp) {
    if (inp.t !== 'searchPick') throw new Error('Pick an item');
    const keep = f.drawn[inp.keep];
    if (!keep) throw new Error('Pick one of the items');
    const rest = f.drawn.filter((_, i) => i !== inp.keep);
    const deck = (g.itemDecks[f.deck] ??= []);
    if (inp.otherTo === 'top') deck.unshift(...rest.map((id, i) => ({ id, up: i === 0 })));
    else deck.push(...rest.map((id) => ({ id, up: false })));
    log(g, `You put the ${rest.map((id) => itemDef(g, id).name).join(' and ')} ${inp.otherTo === 'top' ? 'back on top, face up' : 'on the bottom, face down'}.`);
    gainItem(g, keep);
    return 'done';
  },
};

frames.arrange = {
  step(g, f: Extract<Frame, { t: 'arrange' }>) {
    if (!g.fg.items.some((i) => itemDef(g, i.id).hands > 0)) return 'done';
    g.prompt = { type: 'arrange', optional: f.optional };
    return 'wait';
  },
  input(g, _f, inp) {
    if (inp.t !== 'arrange') throw new Error('Arrange your items');
    const chosen = g.fg.items.filter((i) => inp.inHands.includes(i.uid));
    if (chosen.some((i) => itemDef(g, i.id).hands === 0)) throw new Error('That item doesn\'t go in your hands');
    if (chosen.reduce((s, i) => s + itemDef(g, i.id).hands, 0) > 2) throw new Error('You only have two hands');
    for (const it of [...g.fg.items]) {
      if (itemDef(g, it.id).noBackpack && !inp.inHands.includes(it.uid) && itemDef(g, it.id).hands > 0) {
        log(g, `The ${itemDef(g, it.id).name} won't fit in a backpack: it's discarded.`, 'bad');
        discardItem(g, it.uid);
      }
    }
    for (const it of g.fg.items) it.inHands = inp.inHands.includes(it.uid);
    log(g, `In your hands: ${chosen.map((i) => itemDef(g, i.id).name).join(' and ') || 'nothing'}.`);
    return 'done';
  },
};

frames.discardDown = {
  step(g) {
    const excess = g.fg.hand.length - HAND_LIMIT;
    if (excess <= 0) return 'done';
    g.prompt = { type: 'discardDown', excess };
    return 'wait';
  },
  input(g, _f, inp) {
    if (inp.t !== 'discardDown') throw new Error('Discard down to 10');
    if (inp.cards.length !== g.fg.hand.length - HAND_LIMIT) throw new Error('Discard exactly the extra cards');
    for (const c of inp.cards) {
      const i = g.fg.hand.indexOf(c);
      if (i < 0) throw new Error('You don\'t have that card');
      g.fg.hand.splice(i, 1);
      g.actionDiscard.push(c);
    }
    return 'done';
  },
};

// ---- victims moving on their own -------------------------------------------------

/** Every victim moves 1 space toward the nearest enemy. */
export function victimsStepTowardEnemy(g: GameState): void {
  const enemies = [g.killer.zone, ...g.minions.map((m) => m.zone)];
  const groups = new Map<ZoneId, Victim[]>();
  for (const v of targetable(g)) {
    if (enemies.includes(v.zone)) continue;
    groups.set(v.zone, [...(groups.get(v.zone) ?? []), v]);
  }
  log(g, 'Every victim moves 1 space toward the nearest enemy.');
  for (const [from, vs] of groups) {
    const d = distances(g, from, 'victim');
    const best = Math.min(...enemies.map((e) => d.get(e) ?? Infinity));
    if (best === Infinity) continue;
    const firsts = new Set<ZoneId>();
    for (const e of enemies) if ((d.get(e) ?? Infinity) === best) for (const p of shortestPaths(g, from, e, 'victim')) if (p[0]) firsts.add(p[0]);
    const steps = [...firsts];
    if (!steps.length) continue;
    if (steps.length > 1) {
      choose(
        g,
        `Tie: which way do the victims in ${zoneName(g, from)} go?`,
        steps.map((s) => ({ id: s, label: zoneName(g, s), zone: s })),
        { id: 'victimsStep', data: { from } },
      );
      continue;
    }
    for (const v of vs) moveVictim(g, v, steps[0]);
  }
}

answers.victimsStep = (g, to, data: { from: ZoneId }) => {
  for (const v of victimsIn(g, data.from)) moveVictim(g, v, to);
};

/** The killer appears in a space without moving there. */
export function placeKiller(g: GameState, zone: ZoneId): void {
  if (placeKillerOverrides.some((fn) => fn(g, zone))) return;
  const from = g.killer.zone;
  g.killer.zone = zone;
  log(g, `${K(g).name} appears in ${zoneName(g, zone)}!`, 'killer', { kind: 'killerMove', path: from === zone ? [zone] : [from, zone] });
}

customs['ht.teleportFarthest'] = (g) => {
  const far = closestVictims(g, g.killer.zone, { farthest: true });
  if (!far.length) {
    log(g, 'No victims: Hans stays put.');
    return;
  }
  const zones = [...new Set(far.map((v) => v.zone))];
  if (zones.length === 1) return placeKiller(g, zones[0]);
  choose(
    g,
    'Tie: where does Hans appear?',
    zones.map((z) => ({ id: z, label: zoneName(g, z), zone: z })),
    { id: 'placeKiller' },
  );
};
answers.placeKiller = (g, z) => placeKiller(g, z);

customs['ht.fire'] = (g) => {
  const r = d6(g);
  const zone = r <= 2 ? 'cabins' : r <= 4 ? 'shed' : 'dock';
  log(g, `Fire! (${r}): ${zoneName(g, zone)} is burning.`, 'killer', { kind: 'dice', faces: [r] });
  for (const v of victimsIn(g, zone)) killVictim(g, v, false);
  const deck = g.itemDecks[zone];
  if (deck?.length) {
    g.itemDiscard.push(...deck.map((c) => c.id));
    g.itemDecks[zone] = [];
    log(g, `Every item in ${zoneName(g, zone)} burns.`, 'bad');
  }
  if (g.fg.zone === zone) hurtFG(g, 1);
  if (g.killer.zone === zone && !g.outcome) {
    log(g, `${K(g).name} is caught in the fire too.`, 'good');
    damageKiller(g, 1);
  }
};
