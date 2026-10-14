// Carnage at the Carnival: Geppetto and his Puppets, the Carnival of Blood's
// traps, Asami and Charlie.

import { card, isAttackCard as isAttack } from '../content/core';
import { searchElsewhere } from '../engine/actionPhase';
import { adjacent, closestVictims, placeVictims as placeVictimsAt, distances, dist, exits, killVictim, minionsIn, moveVictim, panicVictims, shortestPaths, targetable, victimsIn } from '../engine/board';
import { damageMinions } from '../engine/combat';
import { rollDone, startRoll } from '../engine/dice';
import { discardItem, drawTerror, placeKiller } from '../engine/effects';
import { answers, cap, choose, customs, d6, has, hooks, itemDef, K, L, log, pick, plural, push, pushFx, shuffle, terrorDef, theItem, uid, usableItems, zoneName } from '../engine/kernel';
import { assignRole, eventSetups, turnEnd } from '../engine/phases';
import { afterRoll, beforeTerror, diceMods, extraActions, extraUses, itemHandlers, ultimates } from '../engine/registry';
import type { GameState, Victim } from '../engine/state';
import { addHorror, addTime, bloodlustSpace, damageKiller, healFG, horrorLevel, hurtFG } from '../engine/stats';
import { peekTerror } from './common';

const cn = (g: GameState): { byTrap?: boolean; zappoLost?: boolean } => (g.film.carnival ??= {});

// ---- traps -------------------------------------------------------------------------

type Trap = 'net' | 'acid' | 'saws';
const TRAP_TOKEN: Record<Trap, string> = { net: 'netTrap', acid: 'acidTrap', saws: 'sawTrap' };
const tokenTrap = (id: string): Trap | undefined => (Object.keys(TRAP_TOKEN) as Trap[]).find((k) => TRAP_TOKEN[k] === id);
const trapsAt = (g: GameState, zone: string): Trap[] => g.tokens.filter((t) => t.zone === zone).flatMap((t) => tokenTrap(t.id) ?? []);
const trapZones = (g: GameState): string[] => g.tokens.filter((t) => tokenTrap(t.id)).map((t) => t.zone);

function trapKill(g: GameState, v: Victim): void {
  cn(g).byTrap = true;
  killVictim(g, v, false);
  cn(g).byTrap = false;
}

/** The trap bites the Final Girl. fromCard: the Terror card's extra sting. */
function springOnYou(g: GameState, t: Trap, fromCard: boolean): void {
  if (g.outcome) return;
  if (t === 'acid') {
    log(g, 'The acid burns you: lose 1 health.', 'bad');
    return hurtFG(g, 1);
  }
  if (t === 'net') {
    if (!g.fg.hand.length) return log(g, 'The rope net catches you, but you have no cards to lose.');
    const c = pick(g, g.fg.hand);
    g.fg.hand.splice(g.fg.hand.indexOf(c), 1);
    g.actionDiscard.push(c);
    log(g, `The rope net catches you: ${card(c).name} is lost.`, 'bad');
    if (fromCard && (c === 'walk' || c === 'sprint')) {
      log(g, 'It took a Walk or Sprint card: +2 Horror.', 'bad');
      addHorror(g, 2);
    }
    return;
  }
  const dice = [d6(g), d6(g)];
  log(g, `Spinning saws: ${dice.join(' and ')}.`, 'bad', { kind: 'dice', faces: dice });
  let dodge = 0;
  for (const d of dice) {
    if (d <= 4) {
      log(g, 'A blade catches you: 1 damage.', 'bad');
      hurtFG(g, 1);
      if (fromCard && !g.outcome) addHorror(g, 1);
    } else dodge++;
  }
  if (dodge && !g.outcome) {
    log(g, `You may dodge up to ${plural(dodge, 'space')}.`, 'good');
    push(g, { t: 'move', remaining: dodge, mode: 'walk', moved: 0, src: { kind: 'system' } });
  }
}

customs['cn.trap'] = (g, t: Trap) => {
  g.tokens.push({ id: TRAP_TOKEN[t], zone: g.fg.zone });
  log(g, `A trap is set in ${zoneName(g, g.fg.zone)}.`, 'killer');
  springOnYou(g, t, true);
  for (const v of victimsIn(g, g.fg.zone)) if (!g.outcome) trapKill(g, v);
};

hooks.victimEnters.push((g, v, zone) => {
  if (trapsAt(g, zone).length) {
    log(g, 'A victim walks into a trap and dies.', 'killer');
    return trapKill(g, v);
  }
  if (g.tokens.some((t) => t.id === 'skull' && t.zone === zone) && g.activeEvents.includes('notReal')) {
    log(g, 'A victim dies in the Woods of Horrors.', 'killer');
    killVictim(g, v, false);
  }
});
hooks.fgEnters.push((g, zone) => {
  for (const t of trapsAt(g, zone)) springOnYou(g, t, false);
});

// trap items found while searching
customs['cn.trapItem'] = (g, data: { id: string }) => {
  const id = data.id;
  log(g, `It's a trap! ${itemDef(g, id).name}.`, 'bad', { kind: 'card', deck: 'item', id });
  if (has(g, 'ult.asami')) {
    g.itemDiscard.push(id);
    return log(g, 'Asami isn\'t fooled by trap items.', 'good');
  }
  const tape = usableItems(g, 'item.foundTape')[0];
  if (tape) {
    choose(
      g,
      `Discard the Found Footage to cancel ${theItem(g, id)}?`,
      [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No: it goes off' },
      ],
      { id: 'cnTapeItem', data: { card: id, uid: tape.uid } },
    );
    return;
  }
  springItem(g, id);
};
answers.cnTapeItem = (g, a, data: { card: string; uid: string }) => {
  if (a === 'yes') {
    discardItem(g, data.uid);
    g.itemDiscard.push(data.card);
    return log(g, 'The footage showed you the trap: you avoid it.', 'good');
  }
  springItem(g, data.card);
};
function springItem(g: GameState, id: string): void {
  if (id === 'steelTrap') {
    log(g, 'A bear trap snaps shut on your leg: lose 1 health, and you can\'t move until you spend 2 Time to get it off.', 'bad');
    g.fg.legTrap = true;
    return hurtFG(g, 1);
  }
  if (id === 'gasTrap') {
    log(g, 'Sleeping gas! You nod off: your Action Phase ends and Time drops to 0. The nap heals 1.', 'bad');
    g.itemDiscard.push(id);
    g.fg.time = 0;
    if (g.phase === 'action') g.mods.actionEnding = true;
    return healFG(g, 1);
  }
  if (id === 'cobraTrap') {
    log(g, 'A hidden cobra bites: lose 1 health each Upkeep until you heal.', 'bad');
    g.fg.cobra = true;
  }
}
extraActions.push((g) => (g.fg.legTrap && g.fg.time >= 2 ? [{ uid: 'cn:leg', action: 'free', label: 'Pry the trap off your leg (2 Time)' }] : []));
extraUses['cn:leg'] = (g) => {
  addTime(g, -2);
  g.fg.legTrap = false;
  g.itemDiscard.push('steelTrap');
  log(g, 'You get the trap off your leg.', 'good');
};
hooks.upkeep.push((g) => {
  if (g.fg.cobra) {
    log(g, 'The cobra bites: lose 1 health.', 'bad');
    hurtFG(g, 1);
  }
});

// The Found Footage against trap Terror cards.
beforeTerror.push((g, id) => {
  const c = terrorDef(g, id);
  const tape = usableItems(g, 'item.foundTape')[0];
  if (!c.trapCard || !tape) return false;
  choose(
    g,
    `A trap Terror card: "${c.name}". Discard the Found Footage to cancel it completely?`,
    [
      { id: 'yes', label: 'Yes: discard it with none of its effects' },
      { id: 'no', label: 'No: resolve it' },
    ],
    { id: 'cnTapeTerror', data: { card: id, uid: tape.uid } },
    c.text,
  );
  return true;
});
answers.cnTapeTerror = (g, a, data: { card: string; uid: string }) => {
  if (a === 'yes') {
    discardItem(g, data.uid);
    g.terrorDiscard.push(data.card);
    return log(g, 'The Found Footage cancels the trap.', 'good');
  }
  push(g, { t: 'terror', card: data.card, asked: true });
};

// ---- location Terror cards ------------------------------------------------------------

/** Skip the rest of the current card and resolve the next one instead. */
function nextTerror(g: GameState, why: string): void {
  log(g, why);
  drawTerror(g);
}

customs['cn.ambush'] = (g) => {
  const near = ['woods', ...exits(g, 'woods', 'enemy')];
  const vs = g.victims.filter((v) => near.includes(v.zone) && v.role !== 'werewolf');
  const before = g.mods.killedThisTurn;
  if (vs.length) {
    log(g, 'Mist rolls out of the woods: everyone near it panics, and a 1 means death.', 'killer');
    panicVictims(g, vs, 1, { deathFace: 1 });
  }
  if (g.mods.killedThisTurn > before) {
    log(g, 'Someone died: +1 Horror.', 'bad');
    addHorror(g, 1);
  } else nextTerror(g, 'Nobody died: resolve the next Terror card.');
};

customs['cn.rebuild'] = (g) => {
  const traps = g.itemDiscard.filter((id) => itemDef(g, id).trap);
  if (!traps.length) return nextTerror(g, 'No trap items in the discard: draw the next Terror card.');
  const decks = L(g).itemDecks;
  const pool: string[] = [...traps];
  for (const d of decks) {
    const deck = g.itemDecks[d] ?? [];
    pool.push(...deck.filter((c) => !c.up).map((c) => c.id));
    g.itemDecks[d] = deck.filter((c) => c.up);
  }
  g.itemDiscard = g.itemDiscard.filter((id) => !itemDef(g, id).trap);
  shuffle(g, pool).forEach((id, i) => g.itemDecks[decks[i % decks.length]].push({ id, up: false }));
  for (const d of decks) if (g.itemDecks[d][0]) g.itemDecks[d][0].up = true;
  log(g, 'The item decks are reshuffled with the traps back in.', 'killer');
  pushFx(g, [{ k: 'killer', a: { target: 'victim', moves: 1, attacks: 1 } }, { k: 'horror', n: 1 }], { kind: 'terror' });
};

customs['cn.support'] = (g) => {
  const mine = g.fg.items.filter((i) => i.id !== 'carolyn');
  if (mine.length) {
    const it = pick(g, mine);
    log(g, `It was a prop: ${theItem(g, it.id)} falls apart.`, 'bad');
    return discardItem(g, it.uid);
  }
  const d = distances(g, g.fg.zone, 'fg');
  const decks = L(g).itemDecks.filter((x) => g.itemDecks[x]?.length);
  if (!decks.length) return log(g, 'You have no items and the decks are empty.');
  const best = Math.min(...decks.map((x) => d.get(x) ?? 99));
  const near = decks.filter((x) => (d.get(x) ?? 99) === best);
  if (near.length > 1) return choose(g, 'Tie: which deck loses its top card?', near.map((x) => ({ id: x, label: zoneName(g, x), zone: x })), { id: 'cnDeckTop' });
  burnTop(g, near[0]);
};
function burnTop(g: GameState, deck: string): void {
  const c = g.itemDecks[deck].shift();
  if (!c) return;
  g.itemDiscard.push(c.id);
  if (g.itemDecks[deck][0]) g.itemDecks[deck][0].up = true;
  log(g, `${cap(theItem(g, c.id))} from ${zoneName(g, deck)} is discarded.`, 'bad');
}
answers.cnDeckTop = (g, d) => burnTop(g, d);

/** Every victim moves 1 space toward one of these spaces. */
export function victimsToward(g: GameState, targets: string[]): void {
  const groups = new Map<string, Victim[]>();
  for (const v of g.victims) if (!targets.includes(v.zone) && v.role !== 'werewolf') groups.set(v.zone, [...(groups.get(v.zone) ?? []), v]);
  for (const [from, vs] of groups) {
    const paths = targets.flatMap((t) => shortestPaths(g, from, t, 'victim'));
    if (!paths.length) continue;
    const len = Math.min(...paths.map((p) => p.length));
    const steps = [...new Set(paths.filter((p) => p.length === len).map((p) => p[0]))];
    if (steps.length > 1) {
      choose(g, `Tie: which way do the victims in ${zoneName(g, from)} go?`, steps.map((s) => ({ id: s, label: zoneName(g, s), zone: s })), { id: 'victimsStep', data: { from } });
      continue;
    }
    for (const v of vs) moveVictim(g, v, steps[0]);
  }
}
customs['cn.toward'] = (g, zone: string) => {
  log(g, `Every victim heads toward ${zoneName(g, zone)}.`);
  victimsToward(g, [zone]);
};
customs['cn.killerTo'] = (g, zone: string) => placeKiller(g, zone);
customs['cn.panicAll'] = (g) => {
  const vs = targetable(g);
  if (vs.length) {
    log(g, 'Every victim panics.', 'killer');
    panicVictims(g, vs);
  }
};
customs['cn.lion'] = (g) => {
  const near = ['cages', ...exits(g, 'cages', 'enemy')];
  log(g, 'The lion tears through the Animal Cages and around them.', 'killer');
  for (const v of g.victims.filter((x) => near.includes(x.zone) && x.role !== 'werewolf')) killVictim(g, v, false);
  for (const zn of near) {
    if (g.outcome) return;
    if (g.killer.zone === zn) damageKiller(g, 1);
    damageMinions(g, zn, 1);
  }
  if (!g.outcome && near.includes(g.fg.zone)) {
    log(g, 'You\'re too close to the cages: lose 1 health.', 'bad');
    hurtFG(g, 1);
  }
};

// ---- Geppetto and his Puppets ---------------------------------------------------------

customs['gp.spawn'] = (g) => {
  const mdef = K(g).minion;
  if (!mdef) return;
  const id = g.minionPool.ready.shift();
  if (id) {
    g.minions.push({ id, zone: g.killer.zone, hp: mdef.hp });
    log(g, `A ${mdef.name} drops into ${zoneName(g, g.killer.zone)}.`, 'killer', { kind: 'killerMove', path: [g.killer.zone] });
  } else log(g, `No ${mdef.plural} are ready.`);
  if (g.minionPool.exhausted.length) {
    log(g, `${plural(g.minionPool.exhausted.length, 'broken Puppet')} go${g.minionPool.exhausted.length === 1 ? 'es' : ''} back to Ready.`);
    g.minionPool.ready.push(...g.minionPool.exhausted.splice(0));
  }
};

function allPuppetsOut(g: GameState, includeExhausted: boolean): void {
  const mdef = K(g).minion;
  if (!mdef) return;
  const ids = [...g.minionPool.ready.splice(0), ...(includeExhausted ? g.minionPool.exhausted.splice(0) : [])];
  for (const id of ids) if (!g.minions.some((m) => m.id === id)) g.minions.push({ id, zone: g.killer.zone, hp: mdef.hp });
  if (ids.length) log(g, `${plural(ids.length, mdef.name, mdef.plural)} appear in ${zoneName(g, g.killer.zone)}.`, 'killer');
}
hooks.finaleRevealed.push((g, ability) => {
  if (ability === 'fin.remember') allPuppetsOut(g, false);
});

const puppetCount = (g: GameState) => K(g).minion?.count ?? 0;
hooks.killerDying.push((g) => {
  if (!has(g, 'dp.immortalMaster') || g.minions.filter((m) => !m.id.startsWith('tmp-')).length < puppetCount(g)) return false;
  g.killer.health.hp = 1;
  log(g, 'Immortal Master: with every Puppet on the board, Geppetto shrugs off the killing blow.', 'killer');
  return true;
});
customs['gp.afterMinion'] = (g) => {
  if (g.phase !== 'killer' || g.outcome || !has(g, 'dp.joinFamily')) return;
  const n = puppetCount(g);
  if (n && g.minions.filter((m) => m.zone === g.fg.zone && !m.id.startsWith('tmp-')).length >= n) {
    log(g, 'Join the Family: all three Puppets have you. You lose all your remaining health.', 'killer');
    hurtFG(g, g.fg.health.hp);
  }
};
hooks.actionPhaseStart.push((g) => {
  if (!has(g, 'mdp.amIPuppet')) return;
  if (dist(g, g.fg.zone, g.killer.zone, 'enemy') <= 2) return;
  const n = bloodlustSpace(g).attack;
  log(g, `"Am I a puppet?": you start more than 2 spaces from Geppetto and lose ${n} health.`, 'bad');
  hurtFG(g, n);
});
hooks.victimKilled.push((g, v, zone) => {
  if (v.role === 'sister') {
    log(g, 'Your sister is dead: +2 Bloodlust.', 'killer');
    pushFx(g, [{ k: 'bloodlust', n: 2 }], { kind: 'event' });
  }
  if (v.role === 'fiance' && cn(g).byTrap) {
    log(g, 'Your Fiancé died in a trap: +5 Horror.', 'bad');
    pushFx(g, [{ k: 'horror', n: 5 }], { kind: 'event' });
  }
  if (has(g, 'mdp.puppetsEverywhere') && (zone === g.fg.zone || adjacent(g, g.fg.zone).includes(zone))) {
    log(g, 'Puppets Everywhere: a death right next to you. +1 Horror.', 'bad');
    pushFx(g, [{ k: 'horror', n: 1 }], { kind: 'killer' });
  }
});
turnEnd.push((g) => {
  for (const m of g.minions) m.hit = false;
});

const enemyZones = (g: GameState) => [...new Set([g.killer.zone, ...g.minions.map((m) => m.zone)])];

customs['gp.laughter'] = (g) => {
  const killed = g.mods.killedThisTurn;
  const hurt = g.mods.damageTaken;
  const near = [g.fg.zone, ...exits(g, g.fg.zone, 'enemy')];
  const vs = g.victims.filter((v) => near.includes(v.zone) && v.role !== 'werewolf');
  if (vs.length) {
    log(g, 'The laughter is everywhere: victims in and around your space panic.', 'killer');
    panicVictims(g, vs);
  }
  const ez = enemyZones(g);
  for (const v of g.victims.filter((x) => ez.includes(x.zone) && x.role !== 'werewolf')) killVictim(g, v, true);
  if (!g.outcome && dist(g, g.fg.zone, g.killer.zone, 'enemy') <= 1) {
    const n = bloodlustSpace(g).attack;
    log(g, `You're close to Geppetto: lose ${n} health.`, 'bad');
    hurtFG(g, n);
  }
  if (!g.outcome && g.mods.killedThisTurn === killed && g.mods.damageTaken === hurt) nextTerror(g, 'Nobody died and you weren\'t hurt: resolve the next Terror card.');
};

customs['gp.spareParts'] = (g) => {
  const vs = closestVictims(g, g.killer.zone);
  const zs = [...new Set(vs.map((v) => v.zone))];
  if (!zs.length) return log(g, 'No victims: Geppetto stays put.');
  if (zs.length > 1) return choose(g, 'Tie: where does Geppetto appear?', zs.map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'placeKiller' });
  placeKiller(g, zs[0]);
};

customs['gp.trapped'] = (g) => {
  const mz = [...new Set(g.minions.map((m) => m.zone))];
  const near = new Set(mz);
  for (const z of mz) for (const x of exits(g, z, 'enemy')) near.add(x);
  const vs = g.victims.filter((v) => near.has(v.zone) && v.role !== 'werewolf');
  if (!vs.length) return log(g, 'No victims near the Puppets.');
  log(g, 'Victims near the Puppets panic; any who run into one die.', 'killer');
  panicVictims(g, vs, 1, { deathZones: mz });
};

customs['gp.makeOrBreak'] = (g) => {
  const r = d6(g);
  const half = Math.ceil(r / 2);
  log(g, `Make or Break: ${r}.`, 'killer', { kind: 'dice', faces: [r] });
  const enough = targetable(g).length >= r;
  choose(
    g,
    `Make or Break (${r})`,
    [{ id: 'life', label: `Lose ${half} health` }, ...(enough ? [{ id: 'kill', label: `${plural(r, 'victim')} die instead` }] : [])],
    { id: 'gpMakeOrBreak', data: { r, half } },
  );
};
answers.gpMakeOrBreak = (g, id, data: { r: number; half: number }) => {
  if (id === 'life') return hurtFG(g, data.half);
  for (let i = 0; i < data.r; i++) push(g, { t: 'custom', id: 'pickKill', step: 0 });
};

customs['gp.noExit'] = (g) => assignExits(g, ['killer', ...g.minions.map((m) => m.id)], {});
function assignExits(g: GameState, queue: string[], done: Record<string, string>): void {
  const exitsList = L(g).zones.filter((z) => z.exit).map((z) => z.id);
  if (!exitsList.length) return;
  let q = [...queue];
  const a = { ...done };
  while (q.length) {
    const load = new Map(exitsList.map((e) => [e, Object.values(a).filter((x) => x === e).length]));
    const low = Math.min(...load.values());
    const opts = exitsList.filter((e) => load.get(e) === low);
    if (opts.length > 1) {
      choose(g, `No Way Out: which exit for ${q[0] === 'killer' ? K(g).name : `a ${K(g).minion?.name ?? 'minion'}`}?`, opts.map((e) => ({ id: e, label: zoneName(g, e), zone: e })), { id: 'gpExit', data: { queue: q, done: a } });
      return;
    }
    a[q[0]] = opts[0];
    q = q.slice(1);
  }
  for (const [who, zone] of Object.entries(a)) {
    if (who === 'killer') placeKiller(g, zone);
    else {
      const m = g.minions.find((x) => x.id === who);
      if (m) m.zone = zone;
    }
  }
  log(g, 'The enemies block the exits.', 'killer');
}
answers.gpExit = (g, zone, data: { queue: string[]; done: Record<string, string> }) => assignExits(g, data.queue.slice(1), { ...data.done, [data.queue[0]]: zone });

customs['gp.bringHer'] = (g, iter?: number) => {
  const n = Number(iter ?? 0);
  if (!g.minions.length) return log(g, 'There are no Puppets on the board.');
  const d = distances(g, g.fg.zone, 'enemy');
  const m = [...g.minions].sort((a, b) => (d.get(a.zone) ?? 99) - (d.get(b.zone) ?? 99) || a.id.localeCompare(b.id))[0];
  push(g, { t: 'killer', a: { target: 'finalGirl', moves: 1, attacks: 1, actor: 'minions' }, actor: `m:${m.id}`, step: 'target', killed: 0, src: { kind: 'terror' } }, { t: 'custom', id: 'gp.bringHerAfter', data: { hurt: g.mods.damageTaken, n }, step: 0 });
};
customs['gp.bringHerAfter'] = (g, data: { hurt: number; n: number }) => {
  if (g.mods.damageTaken > data.hurt && g.fg.zone !== g.killer.zone && !g.outcome) {
    const steps = [...new Set(shortestPaths(g, g.fg.zone, g.killer.zone, 'fg').map((p) => p[0]))].filter(Boolean);
    if (steps.length) {
      choose(g, 'The Puppet drags you 1 space toward Geppetto. Which way?', steps.map((s) => ({ id: s, label: zoneName(g, s), zone: s })), { id: 'gpDrag', data: { n: data.n } });
      return;
    }
  }
  bringAgain(g, data.n);
};
answers.gpDrag = (g, z, data: { n: number }) => {
  const from = g.fg.zone;
  g.fg.zone = z;
  log(g, `You're dragged into ${zoneName(g, z)}.`, 'bad', { kind: 'fgMove', path: [from, z] });
  for (const fn of hooks.fgEnters) fn(g, z, from);
  bringAgain(g, data.n);
};
function bringAgain(g: GameState, n: number): void {
  if (g.outcome || n >= 8) return;
  if (g.fg.zone === g.killer.zone || !minionsIn(g, g.fg.zone).length) return log(g, '"Bring her to me!" is over.');
  log(g, 'A Puppet still has you and Geppetto isn\'t here: it happens again.', 'killer');
  push(g, { t: 'custom', id: `gp.bringHer:${n + 1}`, step: 0 });
}

customs['gp.showman'] = (g) => {
  placeKiller(g, g.fg.zone);
  showmanPlace(g, adjacent(g, g.fg.zone), g.minionPool.ready.length);
};
function showmanPlace(g: GameState, adj: string[], left: number): void {
  if (left <= 0 || !adj.length) return;
  const mdef = K(g).minion;
  if (!mdef) return;
  if (left >= adj.length) {
    for (const z of adj) {
      const id = g.minionPool.ready.shift();
      if (id) g.minions.push({ id, zone: z, hp: mdef.hp });
    }
    return log(g, `A ${mdef.name} appears in each adjacent space.`, 'killer');
  }
  choose(g, `Master Showman: where does a ${mdef.name} go? (${left} left)`, adj.map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'gpShowman', data: { adj, left } });
}
answers.gpShowman = (g, z, data: { adj: string[]; left: number }) => {
  const id = g.minionPool.ready.shift();
  const mdef = K(g).minion;
  if (id && mdef) g.minions.push({ id, zone: z, hp: mdef.hp });
  showmanPlace(g, data.adj.filter((x) => x !== z), data.left - 1);
};

customs['gp.dance'] = (g) => {
  log(g, '"Dance, puppet!": make a horror roll.', 'killer');
  startRoll(g, { kind: 'effect', id: 'gp.dance', label: 'Dance, puppet!' }, { id: 'gp.dance' });
};
rollDone['gp.dance'] = (g, s) => {
  if (s >= 1) {
    if (!g.minions.length) return log(g, 'Success, but there are no Puppets to move.');
    return choose(
      g,
      'Success: every Puppet moves 1 space toward…',
      [
        { id: 'fg', label: 'You' },
        { id: 'victim', label: 'The closest victim' },
      ],
      { id: 'gpDanceDir' },
    );
  }
  if (victimsIn(g, g.fg.zone).some((v) => v.role !== 'werewolf')) {
    log(g, 'Failure: a victim in your space dies.', 'killer');
    return push(g, { t: 'custom', id: 'pickKill', data: g.fg.zone, step: 0 });
  }
  log(g, 'Failure, and nobody\'s in your space: +2 Horror.', 'bad');
  addHorror(g, 2);
};
answers.gpDanceDir = (g, dir) => {
  for (const m of [...g.minions]) {
    if (dir === 'fg') stepMinion(g, m.id, g.fg.zone);
    else {
      const d = distances(g, m.zone, 'enemy');
      const vs = targetable(g);
      if (!vs.length) continue;
      const best = Math.min(...vs.map((v) => d.get(v.zone) ?? Infinity));
      const zs = [...new Set(vs.filter((v) => (d.get(v.zone) ?? Infinity) === best).map((v) => v.zone))];
      stepMinion(g, m.id, zs[0]);
    }
  }
};
function stepMinion(g: GameState, id: string, to: string): void {
  const m = g.minions.find((x) => x.id === id);
  if (!m || m.zone === to) return;
  const first = shortestPaths(g, m.zone, to)[0]?.[0];
  if (!first) return;
  const from = m.zone;
  m.zone = first;
  log(g, `A ${K(g).minion?.name ?? 'minion'} lurches to ${zoneName(g, first)}.`, 'killer', { kind: 'killerMove', path: [from, first], minion: m.id });
}

customs['gp.everywhere'] = (g) => {
  const r = d6(g);
  log(g, `Rolled ${r} (Horror level ${horrorLevel(g)}).`, 'info', { kind: 'dice', faces: [r] });
  if (r < horrorLevel(g)) allPuppetsOut(g, true);
  else log(g, 'No more Puppets turn up.');
};
customs['gp.beating'] = (g) => {
  const r = d6(g);
  const h = horrorLevel(g);
  log(g, `Rolled ${r} (Horror level ${h}).`, 'info', { kind: 'dice', faces: [r] });
  if (r < h) addTime(g, -h);
};

customs['gp.friends'] = (g) => {
  if (!g.minions.length) return;
  const mz = new Set(g.minions.map((m) => m.zone));
  const near = (z: string) => mz.has(z) || exits(g, z, 'enemy').some((x) => mz.has(x));
  for (const v of targetable(g).filter((x) => near(x.zone))) push(g, { t: 'custom', id: 'gp.friendRoll', data: v.id, step: 0 });
};
customs['gp.friendRoll'] = (g, vid: string) => {
  const v = g.victims.find((x) => x.id === vid);
  if (!v || !g.minions.length) return;
  const r = d6(g);
  log(g, `A victim in ${zoneName(g, v.zone)} rolls ${r}.`, 'info', { kind: 'dice', faces: [r] });
  const outs = exits(g, v.zone, 'victim');
  if (r === 6) {
    if (!outs.length) return;
    return choose(g, 'A 6: move the victim 1 space anywhere', [...outs.map((t) => ({ id: `${v.id}>${t}`, label: `To ${zoneName(g, t)}`, zone: t })), { id: 'none', label: 'Leave them' }], { id: 'cnVictimTo' });
  }
  const d = distances(g, v.zone, 'victim');
  const best = Math.min(...g.minions.map((m) => d.get(m.zone) ?? Infinity));
  if (!Number.isFinite(best) || best === 0) return;
  const steps = [...new Set(g.minions.filter((m) => (d.get(m.zone) ?? Infinity) === best).flatMap((m) => shortestPaths(g, v.zone, m.zone, 'victim').map((p) => p[0])))].filter(Boolean);
  if (steps.length === 1) return moveVictim(g, v, steps[0]);
  choose(g, 'The victim walks toward a Puppet: which way?', steps.map((t) => ({ id: `${v.id}>${t}`, label: `To ${zoneName(g, t)}`, zone: t })), { id: 'cnVictimTo' });
};
answers.cnVictimTo = (g, id) => {
  if (id === 'none') return;
  const [vid, to] = id.split('>');
  const v = g.victims.find((x) => x.id === vid);
  if (v) moveVictim(g, v, to);
};

customs['gp.blades'] = (g) => {
  const killed = g.mods.killedThisTurn;
  const hurt = g.mods.damageTaken;
  const near = [g.killer.zone, ...exits(g, g.killer.zone, 'enemy')];
  for (const v of g.victims.filter((x) => near.includes(x.zone) && x.role !== 'werewolf')) killVictim(g, v, true);
  pushFx(g, [{ k: 'custom', id: 'gp.bladesDamage' }, { k: 'custom', id: 'gp.bladesEnd', data: { killed, hurt } }], { kind: 'terror' });
};
customs['gp.bladesDamage'] = (g) => {
  if (g.outcome || dist(g, g.fg.zone, g.killer.zone, 'enemy') > 1) return;
  const runs = g.fg.hand.filter((c) => c === 'walk' || c === 'sprint').length;
  if (!runs) return hurtFG(g, 2);
  choose(
    g,
    'Blade Strings: you lose 2 health. Discard Walk or Sprint cards to lose less?',
    Array.from({ length: Math.min(2, runs) + 1 }, (_, i) => ({ id: String(i), label: i === 0 ? 'No: lose 2 health' : `Discard ${plural(i, 'card')}: lose ${2 - i}` })),
    { id: 'gpBlades' },
  );
};
answers.gpBlades = (g, id) => {
  const n = Number(id);
  for (let i = 0; i < n; i++) {
    const c = g.fg.hand.find((x) => x === 'walk' || x === 'sprint');
    if (!c) break;
    g.fg.hand.splice(g.fg.hand.indexOf(c), 1);
    g.actionDiscard.push(c);
  }
  hurtFG(g, 2 - n);
};
customs['gp.bladesEnd'] = (g, data: { killed: number; hurt: number }) => {
  if (!g.outcome && g.mods.killedThisTurn === data.killed && g.mods.damageTaken === data.hurt) nextTerror(g, 'Nobody died and you weren\'t hurt: resolve the next Terror card.');
};

// ---- events ---------------------------------------------------------------------------

const RING = ['entrance', 'westPlaza', 'gallery', 'woods', 'southPath', 'exit', 'ferris', 'coaster'];
eventSetups['ev.golfCart'] = (g) => {
  choose(g, 'Employee Transport: which corner does the golf cart start in?', ['entrance', 'woods', 'exit', 'ferris'].filter((z) => L(g).zones.some((x) => x.id === z)).map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'cnCartPlace' });
};
answers.cnCartPlace = (g, z) => {
  g.tokens.push({ id: 'golfCart', zone: z });
  log(g, `The golf cart is parked at ${zoneName(g, z)}.`);
};
eventSetups['ev.notReal'] = (g) => {
  if (L(g).id !== 'carnivalOfBlood') return;
  pushFx(g, [{ k: 'victims', n: 4, at: 'mirrors' }, { k: 'custom', id: 'cn.skull' }], { kind: 'event' });
};
customs['cn.skull'] = (g) => {
  g.tokens.push({ id: 'skull', zone: 'woods' });
  log(g, 'The skull marks the Woods of Horrors: any victim there or going in dies.', 'killer');
  for (const v of victimsIn(g, 'woods')) killVictim(g, v, false);
};
eventSetups['ev.sister'] = (g) => {
  const before = new Set(g.victims.map((v) => v.id));
  placeVictimsAt(g, 'bigTop', 4);
  const sis = g.victims.find((v) => !before.has(v.id));
  if (sis) {
    sis.role = 'sister';
    log(g, 'One of them is your daring little sister.', 'good');
  }
};
eventSetups['ev.fiance'] = (g) => assignRole(g, 'fiance', 'fg');
eventSetups['ev.werewolf'] = (g) => {
  const vs = closestVictims(g, g.fg.zone, { farthest: true });
  const zs = [...new Set(vs.map((v) => v.zone))];
  if (!zs.length) return;
  if (zs.length > 1) return choose(g, 'Tie: which victim is the Werewolf?', zs.map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'assignRole', data: { role: 'werewolf' } });
  const v = g.victims.find((x) => x.zone === zs[0] && !x.role);
  if (v) {
    v.role = 'werewolf';
    log(g, `A victim in ${zoneName(g, zs[0])} is a Werewolf!`, 'killer');
  }
};
eventSetups['ev.tooMuchJunk'] = (g) => {
  if (g.fg.items.some((i) => i.id === 'zappo')) return log(g, 'You already have Zappo.');
  let found = false;
  for (const d of L(g).itemDecks) {
    const deck = g.itemDecks[d] ?? [];
    const i = deck.findIndex((c) => c.id === 'zappo');
    if (i < 0) continue;
    deck.splice(i, 1);
    if (deck[0] && !deck[0].up) deck[0].up = true;
    found = true;
    break;
  }
  if (!found) {
    const i = g.itemDiscard.indexOf('zappo');
    if (i >= 0) {
      g.itemDiscard.splice(i, 1);
      found = true;
    }
  }
  if (!found) {
    if (L(g).items.some((x) => x.id === 'zappo')) found = true;
    else return log(g, 'Zappo isn\'t in this game.');
  }
  g.fg.items.push({ uid: uid(g, 'i'), id: 'zappo', inHands: false });
  log(g, 'Zappo the carnival monkey climbs into your backpack.', 'good', { kind: 'card', deck: 'item', id: 'zappo' });
};

hooks.afterHorrorUp.push((g) => {
  if (!has(g, 'ev.animalPanic')) return;
  push(g, { t: 'custom', id: 'cn.animalPanic', step: 0 });
});
customs['cn.animalPanic'] = (g) => {
  const n = horrorLevel(g);
  if (n <= 0 || !targetable(g).length) return;
  const dice = Array.from({ length: n }, () => d6(g));
  const wins = dice.filter((d) => d >= 5).length;
  const deaths = Math.floor((n - wins) / 2);
  log(g, `Animal Panic! ${dice.join(' ')}: ${plural(wins, 'success', 'successes')}, ${deaths} die.`, 'killer', { kind: 'dice', faces: dice });
  const fx = [...Array.from({ length: wins }, () => ({ k: 'custom' as const, id: 'cn.animalMove' })), ...Array.from({ length: deaths }, () => ({ k: 'custom' as const, id: 'pickKill' }))];
  pushFx(g, fx, { kind: 'event' });
};
customs['cn.animalMove'] = (g) => {
  const vs = targetable(g);
  if (!vs.length) return;
  const opts = [...new Map(vs.map((v) => [v.zone, v])).values()].flatMap((v) => exits(g, v.zone, 'victim').map((t) => ({ id: `${v.id}>${t}`, label: `${zoneName(g, v.zone)} → ${zoneName(g, t)}`, zone: t })));
  if (!opts.length) return;
  choose(g, 'Animal Panic: move a victim 1 space?', [...opts, { id: 'none', label: 'Don\'t move anyone' }], { id: 'cnVictimTo' });
};

hooks.upkeep.push((g) => {
  if (g.tokens.some((t) => t.id === 'golfCart')) push(g, { t: 'custom', id: 'cn.cart', step: 0 });
});
hooks.upkeep.push((g) => {
  if (!has(g, 'ev.werewolf')) return;
  const w = g.victims.find((v) => v.role === 'werewolf');
  if (!w) return;
  panicVictims(g, [w]);
  push(g, { t: 'custom', id: 'cn.wolfBite', step: 0 });
});
customs['cn.wolfBite'] = (g) => {
  const w = g.victims.find((v) => v.role === 'werewolf');
  if (!w) return;
  const z = w.zone;
  const vs = victimsIn(g, z).filter((v) => v !== w);
  if (vs.length) {
    log(g, 'The Werewolf attacks a victim.', 'killer');
    return push(g, { t: 'custom', id: 'pickKill', data: z, step: 0 });
  }
  if (g.fg.zone === z) {
    log(g, 'The Werewolf attacks you: 2 damage.', 'killer');
    return push(g, { t: 'attackFG', damage: 2, by: 'wolf' });
  }
  if (minionsIn(g, z).length) {
    log(g, 'The Werewolf mauls a minion.', 'good');
    return damageMinions(g, z, 2);
  }
  if (g.killer.zone === z) {
    log(g, `The Werewolf attacks ${K(g).name}.`, 'good');
    damageKiller(g, 2, true);
  }
};
hooks.upkeep.push((g) => {
  if (!has(g, 'ev.soDangerous')) return;
  const tz = trapZones(g);
  if (!tz.length) return;
  log(g, 'How Dangerous Can It Be?: the victims wander toward the nearest trap.', 'killer');
  victimsToward(g, tz);
});
hooks.upkeep.push((g) => {
  if (!has(g, 'ev.clowns') || !L(g).zones.some((z) => z.id === 'bigTop')) return;
  const near = ['bigTop', ...exits(g, 'bigTop', 'enemy')];
  const vs = g.victims.filter((v) => near.includes(v.zone) && v.role !== 'werewolf');
  if (!vs.length) return;
  log(g, 'Clowns Everywhere: the victims in and around the Big Top panic.', 'killer');
  panicVictims(g, vs, 1, { deathZones: enemyZones(g) });
});

customs['cn.cart'] = (g) => {
  const cart = g.tokens.find((t) => t.id === 'golfCart');
  if (!cart) return;
  const you = g.fg.zone === cart.zone;
  const riders = targetable(g).filter((v) => v.zone === cart.zone);
  if (!you && !riders.length) return;
  const opts = [{ id: 'no', label: 'Nobody drives it' }];
  for (let n = 0; n <= Math.min(2, riders.length); n++) {
    if (you) opts.push({ id: `fg|${n}`, label: `You drive${n ? ` with ${plural(n, 'victim')}` : ''}` });
    if (n > 0) opts.push({ id: `v|${n}`, label: `${plural(n, 'victim')} drive${n === 1 ? 's' : ''} it` });
  }
  choose(g, `The golf cart at ${zoneName(g, cart.zone)}: who drives?`, opts, { id: 'cnCartRiders' });
};
answers.cnCartRiders = (g, id) => {
  if (id === 'no') return;
  const cart = g.tokens.find((t) => t.id === 'golfCart');
  if (!cart) return;
  const i = RING.indexOf(cart.zone);
  const dests = [...new Set([1, 2, -1, -2].map((d) => RING[(i + d + RING.length * 2) % RING.length]))];
  choose(g, 'Drive it where? (up to 2 spaces around the edge)', dests.map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'cnCartDest', data: { riders: id } });
};
answers.cnCartDest = (g, to, data: { riders: string }) => {
  const cart = g.tokens.find((t) => t.id === 'golfCart');
  if (!cart) return;
  const [who, n] = data.riders.split('|');
  const from = cart.zone;
  const vs = targetable(g)
    .filter((v) => v.zone === from)
    .slice(0, Number(n));
  cart.zone = to;
  log(g, `The golf cart rattles from ${zoneName(g, from)} to ${zoneName(g, to)}.`, 'info', { kind: 'fgMove', path: [from, to] });
  if (who === 'fg') {
    g.fg.zone = to;
    for (const fn of hooks.fgEnters) fn(g, to, from);
  }
  for (const v of vs) moveVictim(g, v, to);
  const hit = [...(g.killer.zone === to ? [{ id: 'killer', label: K(g).name }] : []), ...(minionsIn(g, to).length ? [{ id: 'minion', label: K(g).minion?.plural ?? 'the minions' }] : [])];
  if (hit.length && !g.outcome)
    choose(g, 'The cart reaches an enemy. Wreck it for 3 damage?', [...hit.map((h) => ({ id: h.id, label: `Yes: 3 damage to ${h.label}` })), { id: 'no', label: 'No' }], { id: 'cnCartHit', data: { zone: to } });
};
answers.cnCartHit = (g, id, data: { zone: string }) => {
  if (id === 'no') return;
  g.tokens = g.tokens.filter((t) => t.id !== 'golfCart');
  g.activeEvents = g.activeEvents.filter((e) => e !== 'golfCart');
  g.eventDiscard.push('golfCart');
  log(g, 'The golf cart slams into the enemy and is wrecked.', 'good');
  if (id === 'killer') damageKiller(g, 3);
  else damageMinions(g, data.zone, 3);
};

// Mirrors Everywhere: your own attacks cut down victims beside you.
afterRoll.push((g, dice, _s, p) => {
  if (!has(g, 'ev.mirrors') || p.kind !== 'action' || !isAttack(p.card)) return;
  const ones = dice.filter((d) => d === 1).length;
  const vs = victimsIn(g, g.fg.zone).filter((v) => v.role !== 'werewolf');
  const n = Math.min(ones, vs.length);
  if (!n) return;
  log(g, `Mirrors Everywhere: ${plural(ones, 'one')} rolled, ${plural(n, 'victim')} in your space die.`, 'killer');
  for (let i = 0; i < n; i++) push(g, { t: 'custom', id: 'pickKill', data: g.fg.zone, step: 0 });
});

// Zappo and the junk.
diceMods.push((g, p, n, notes) => {
  if (p.kind === 'action' && p.card === 'search' && has(g, 'ev.tooMuchJunk') && !g.fg.items.some((i) => i.id === 'zappo')) {
    notes.push('−1 lost Zappo');
    return n - 1;
  }
  return n;
});

/** Decks Zappo can reach (within 2 spaces). */
searchElsewhere.push((g) => zappoDecks(g).length > 0);
export function zappoDecks(g: GameState): string[] {
  if (!g.fg.items.some((i) => i.id === 'zappo')) return [];
  const d = distances(g, g.fg.zone, 'fg');
  return L(g).itemDecks.filter((x) => (g.itemDecks[x]?.length ?? 0) > 0 && (d.get(x) ?? 99) <= 2);
}
customs['cn.zappoSearch'] = (g, n: number) => {
  const decks = zappoDecks(g);
  if (!decks.length) return log(g, 'You\'re not near a search space.');
  if (decks.length === 1) return push(g, { t: 'search', deck: decks[0], n, drawn: [], zappo: true });
  choose(g, 'Zappo searches for you: which deck?', decks.map((x) => ({ id: x, label: zoneName(g, x), zone: x })), { id: 'cnZappo', data: { n } });
};
answers.cnZappo = (g, deck, data: { n: number }) => push(g, { t: 'search', deck, n: data.n, drawn: [], zappo: true });

// ---- items ----------------------------------------------------------------------------

itemHandlers['item.crystalBall'] = {
  actions: (g, it) => (!g.mods.usedThisPhase.includes(it.uid) && g.terrorDeck.length ? [{ action: 'use', label: 'Gaze into the crystal ball' }] : []),
  use(g, it) {
    g.mods.usedThisPhase.push(it.uid);
    const r = d6(g);
    log(g, `Crystal ball: ${r}.`, 'info', { kind: 'dice', faces: [r] });
    if (r < 5) return log(g, 'The ball stays cloudy.');
    peekTerror(g, 'Crystal Ball');
  },
};

ultimates['ult.charlie'] = {
  label(g) {
    if (g.mods.usedThisPhase.includes('ult.charlie') || g.fg.health.hp <= 3 || !(g.tableau.criticalBlow > 0) || g.fg.hand.length >= 10) return null;
    return 'Charlie: lose 3 health, take a Critical Blow';
  },
  use(g) {
    g.mods.usedThisPhase.push('ult.charlie');
    log(g, "Charlie's Ultimate: she grits her teeth and grabs a Critical Blow.", 'good');
    hurtFG(g, 3);
    if (!g.outcome) {
      g.tableau.criticalBlow--;
      g.fg.hand.push('criticalBlow');
    }
  },
};

