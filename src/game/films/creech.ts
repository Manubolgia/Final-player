// The Haunting of Creech Manor: the Poltergeist can't be killed — find
// Carolyn and get her out. Plus the manor's windows, ladder and helicopter,
// Alice and Selena.

import { ACTION_CARDS, card, isMoveCard } from '../content/core';
import { beforePlay, onUltimate, panicMoves, rescuable } from '../engine/actionPhase';
import { adjacent, closestVictims, distances, exits, killVictim, moveVictim, panicVictims, shortestPaths, victimsIn } from '../engine/board';
import { attackStoppers, damageMinions } from '../engine/combat';
import { discardGuards, discardItem, drawTerror, gainItem, placeKiller } from '../engine/effects';
import { answers, choose, customs, d6, endGame, FG, has, hooks, itemDef, K, L, log, pick, plural, push, pushFx, shuffle, terrorDef, theItem, usableItems, zoneDef, zoneName } from '../engine/kernel';
import { eventSetups } from '../engine/phases';
import { afterRoll, beforeTerror, costMods, diceMods, itemHandlers, moveFilters, rescueSpaces } from '../engine/registry';
import { setupHooks } from '../engine/setup';
import type { GameState, ItemInst } from '../engine/state';
import { addBloodlust, addHorror, addTime, bloodlustSpace, damageKiller, hurtFG } from '../engine/stats';
import { peekTerror } from './common';

interface CreechState {
  lock: [string, string] | null;
  panicNext: boolean;
  panicNow: boolean;
  lockNext: 'inside' | 'outside' | null;
  lockNow: 'inside' | 'outside' | null;
  heliUsed: boolean;
  fiveDice: string | null;
  hunterDied: boolean;
  strike: 'victims' | 'enemy' | null;
  psychicPaid: boolean;
}

export const cs = (g: GameState): CreechState =>
  (g.film.creech ??= {
    lock: null,
    panicNext: false,
    panicNow: false,
    lockNext: null,
    lockNow: null,
    heliUsed: false,
    fiveDice: null,
    hunterDied: false,
    strike: null,
    psychicPaid: false,
  });

setupHooks.push((g) => {
  cs(g);
});

const withCarolyn = (g: GameState) => g.fg.items.some((i) => i.id === 'carolyn');
const withFloppy = (g: GameState) => g.fg.items.some((i) => i.id === 'mrFloppy');
const dpRevealed = (g: GameState) => g.killer.darkPowers.some((d) => d.revealed);
const epicInPlay = (g: GameState) => g.killer.darkPowers.some((d) => K(g).darkPowers.find((x) => x.id === d.id)?.epic);
const floppyLocked = (g: GameState) => !dpRevealed(g) || epicInPlay(g);
const canEscape = (g: GameState) => withCarolyn(g) && (!has(g, 'dp.forgettingSomething') || withFloppy(g));

// ---- the way to win -----------------------------------------------------------------

function checkEscape(g: GameState): void {
  if (g.outcome || !withCarolyn(g) || !zoneDef(g, g.fg.zone).exit) return;
  if (!canEscape(g)) {
    log(g, 'You have Carolyn, but you still need Mr. Floppy to get out.', 'bad');
    return;
  }
  endGame(g, 'finalGirl', `${FG(g).name} escapes with Carolyn. The Poltergeist can't follow!`);
}

hooks.fgEnters.push((g, zone) => {
  if (zone === 'helicopter') {
    cs(g).heliUsed = true;
    if (canEscape(g)) return endGame(g, 'finalGirl', `${FG(g).name} climbs into the helicopter with Carolyn. They're safe!`);
    push(g, { t: 'custom', id: 'cm.heliReturn', step: 0 });
    return;
  }
  checkEscape(g);
});

customs['cm.heliReturn'] = (g) => {
  for (const v of victimsIn(g, 'helicopter')) moveVictim(g, v, 'attic');
  g.fg.zone = 'attic';
  g.tokens = g.tokens.filter((t) => t.id !== 'helicopter');
  const ev = g.activeEvents.find((e) => e === 'helicopter');
  if (ev) {
    g.activeEvents = g.activeEvents.filter((e) => e !== ev);
    g.eventDiscard.push(ev);
  }
  log(g, 'No Carolyn: you climb back down to the Attic and the helicopter takes off.', 'bad', { kind: 'fgMove', path: ['helicopter', 'attic'] });
};
rescueSpaces.push((_g, zone) => zone === 'helicopter');

itemHandlers['item.carolyn'] = {
  gained(g) {
    log(g, g.killer.minors.length ? 'Carolyn joins you: every Minor Dark Power is gone.' : 'Carolyn joins you. Now get her to an exit!', 'good');
    for (const m of g.killer.minors) g.terrorDiscard.push(m.id);
    g.killer.minors = [];
    checkEscape(g);
  },
};
itemHandlers['item.floppy'] = {
  gained(g) {
    log(g, 'You found Mr. Floppy.', 'good');
    checkEscape(g);
  },
};

discardGuards.push((g, it) => {
  if (it.id === 'carolyn') {
    log(g, 'Carolyn can\'t be discarded.', 'good');
    return true;
  }
  if (it.id === 'mrFloppy') {
    if (floppyLocked(g)) {
      log(g, 'Mr. Floppy can\'t be discarded yet.', 'good');
      return true;
    }
    g.fg.items = g.fg.items.filter((i) => i.uid !== it.uid);
    hideInNearestDeck(g, 'mrFloppy');
    return true;
  }
  return false;
});

function nearestDecks(g: GameState): string[] {
  const d = distances(g, g.fg.zone, 'fg');
  const decks = L(g).itemDecks;
  const best = Math.min(...decks.map((x) => d.get(x) ?? 99));
  return decks.filter((x) => (d.get(x) ?? 99) === best);
}

function hideInNearestDeck(g: GameState, id: string): void {
  const ds = nearestDecks(g);
  if (ds.length > 1) {
    choose(g, `Tie: which item deck does ${itemDef(g, id).name} get shuffled into?`, ds.map((d) => ({ id: d, label: zoneName(g, d), zone: d })), { id: 'cmHide', data: { card: id } });
    return;
  }
  shuffleInto(g, ds[0], id);
}
answers.cmHide = (g, deck, data: { card: string }) => shuffleInto(g, deck, data.card);

function shuffleInto(g: GameState, deck: string, id: string): void {
  const cards = shuffle(g, [...(g.itemDecks[deck] ?? []).map((c) => c.id), id]);
  g.itemDecks[deck] = cards.map((c) => ({ id: c, up: false }));
  log(g, `${itemDef(g, id).name} is shuffled into the ${zoneName(g, deck)} deck.`, 'killer');
}

customs['cm.carolynLost'] = (g) => {
  if (!withCarolyn(g)) return;
  if (withFloppy(g) && dpRevealed(g) && !epicInPlay(g)) {
    choose(
      g,
      '"Carolyn, where are you?": give up Mr. Floppy to keep her?',
      [
        { id: 'yes', label: 'Yes: remove Mr. Floppy from the game' },
        { id: 'no', label: 'No: Carolyn wanders off' },
      ],
      { id: 'cmFloppy' },
    );
    return;
  }
  loseCarolyn(g);
};
answers.cmFloppy = (g, id) => {
  if (id === 'yes') {
    g.fg.items = g.fg.items.filter((i) => i.id !== 'mrFloppy');
    log(g, 'Mr. Floppy is gone for good. Carolyn stays with you.', 'good');
    return;
  }
  loseCarolyn(g);
};
function loseCarolyn(g: GameState): void {
  g.fg.items = g.fg.items.filter((i) => i.id !== 'carolyn');
  log(g, 'Carolyn slips away from you and hides again.', 'killer');
  hideInNearestDeck(g, 'carolyn');
}

moveFilters.push((g, mode, to) => {
  let out = to;
  const lockNow = cs(g).lockNow;
  if (mode !== 'free' && g.film.creech) {
    if (lockNow === 'inside') return [];
    if (lockNow === 'outside') out = out.filter((z) => zoneDef(g, z).outside);
  }
  if (has(g, 'dp.invisibleBarrier') && withCarolyn(g) && g.fg.health.hp < g.fg.health.max) out = out.filter((z) => !zoneDef(g, z).exit);
  return out;
});

// ---- the Poltergeist's moves ----------------------------------------------------------------

customs['cm.toYou'] = (g) => placeKiller(g, g.fg.zone);
customs['cm.toVictim'] = (g) => {
  const vs = closestVictims(g, g.killer.zone);
  if (!vs.length) return placeKiller(g, g.fg.zone);
  const zs = [...new Set(vs.map((v) => v.zone))];
  if (zs.length === 1) return placeKiller(g, zs[0]);
  choose(g, 'Tie: which victim does the Poltergeist appear with?', zs.map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'placeKiller' });
};
customs['cm.mark'] = (g) => {
  g.mods.damageMark = g.mods.damageTaken;
};
customs['cm.panicIfHurt'] = (g) => {
  if (g.mods.damageTaken > g.mods.damageMark) {
    cs(g).panicNext = true;
    log(g, 'You were hurt: every move in your next Action Phase will be a panic move.', 'bad');
  }
};
customs['cm.maxHit'] = (g) => {
  log(g, 'The Poltergeist\'s Bloodlust is maxed out: it hits you for 1.', 'killer');
  push(g, { t: 'attackFG', damage: 1, by: 'killer' });
};
customs['cm.unholy'] = (g) => {
  const r = d6(g);
  const zn = r <= 2 ? 'attic' : r <= 4 ? 'closet' : 'ballroom';
  log(g, `Rolled ${r}: the Killer appears in the ${zoneName(g, zn)}.`, 'killer', { kind: 'dice', faces: [r] });
  placeKiller(g, zn);
};

customs['cm.evil'] = (g) => {
  const r = d6(g);
  log(g, `Unstoppable Evil: ${r}.`, 'killer', { kind: 'dice', faces: [r] });
  if (g.victims.filter((v) => v.role !== 'werewolf').length < r) {
    log(g, 'Not enough victims: you take the damage.', 'bad');
    push(g, { t: 'attackFG', damage: r, by: 'killer' });
    return;
  }
  choose(
    g,
    `Unstoppable Evil (${r}): which is it?`,
    [
      { id: 'dmg', label: `Take ${r} damage (you may defend)` },
      { id: 'kill', label: `${plural(r, 'victim')} of your choice die` },
    ],
    { id: 'cmEvil', data: { n: r } },
  );
};
answers.cmEvil = (g, id, data: { n: number }) => {
  if (id === 'dmg') return push(g, { t: 'attackFG', damage: data.n, by: 'killer' });
  for (let i = 0; i < data.n; i++) push(g, { t: 'custom', id: 'pickKill', step: 0 });
};

/** You choose a victim who dies (optionally in one space). */
customs.pickKill = (g, zone?: string) => {
  const vs = g.victims.filter((v) => v.role !== 'werewolf' && (!zone || v.zone === zone));
  if (!vs.length) return;
  const opts = [...new Map(vs.map((v) => [`${v.zone}|${v.role ?? ''}`, v])).entries()].map(([k, v]) => ({
    id: k,
    label: `${v.role ? 'A special victim' : 'A victim'} in ${zoneName(g, v.zone)}`,
    zone: v.zone,
  }));
  if (opts.length === 1) return killKey(g, opts[0].id);
  choose(g, 'Which victim dies?', opts, { id: 'pickKill' });
};
function killKey(g: GameState, key: string): void {
  const [z, r] = key.split('|');
  const v = g.victims.find((x) => x.zone === z && (x.role ?? '') === r);
  if (v) killVictim(g, v, true);
}
answers.pickKill = (g, id) => killKey(g, id);

customs['cm.storm'] = (g) => {
  const zones = [g.fg.zone, ...adjacent(g, g.fg.zone)];
  log(g, 'Lightning strikes your space and every one around it.', 'killer');
  for (const zn of zones) {
    const v = victimsIn(g, zn)
      .filter((x) => x.role !== 'werewolf')
      .sort((a, b) => +!!a.role - +!!b.role)[0];
    if (v) killVictim(g, v, true);
  }
  const n = bloodlustSpace(g).attack;
  log(g, `The lightning burns you: lose ${n} health.`, 'bad');
  hurtFG(g, n);
};

customs['cm.nothing'] = (g) => {
  let found = false;
  for (const d of L(g).itemDecks) {
    const deck = g.itemDecks[d] ?? [];
    if (!deck.length) continue;
    const cards = shuffle(g, deck.map((c) => c.id));
    g.itemDecks[d] = cards.map((c, i) => ({ id: c, up: i === 0 }));
    log(g, `The ${zoneName(g, d)} deck is shuffled: ${theItem(g, cards[0])} is on top.`, 'killer', { kind: 'card', deck: 'item', id: cards[0] });
    if (cards[0] === 'carolyn' || cards[0] === 'mrFloppy') found = true;
  }
  if (found) {
    log(g, 'Carolyn or Mr. Floppy turned up: +2 Bloodlust.', 'killer');
    addBloodlust(g, 2);
  }
};

// "I have to kill you!"
customs['cm.kill1'] = (g) => {
  const here = g.fg.zone;
  for (const zn of adjacent(g, here)) {
    if (!exits(g, zn, 'victim').includes(here)) continue;
    for (const v of victimsIn(g, zn).filter((x) => x.role !== 'werewolf')) moveVictim(g, v, here);
  }
  log(g, 'Every victim next to you crowds into your space.', 'killer');
};
customs['cm.kill2'] = (g) => {
  if (!victimsIn(g, g.fg.zone).some((v) => v.role !== 'werewolf')) return;
  cs(g).strike = 'victims';
  log(g, 'You may play ONE damaging action card: each point kills one of them.', 'killer');
  push(g, { t: 'strike', mode: 'victims', left: 1 });
};
customs['cm.kill3'] = (g) => {
  const n = victimsIn(g, g.fg.zone).filter((v) => v.role !== 'werewolf').length;
  if (!n) return;
  log(g, `${plural(n, 'victim')} left in your space: you take ${n} damage.`, 'killer');
  push(g, { t: 'attackFG', damage: n, by: 'killer' });
};
customs['cm.kill4'] = (g) => {
  const vs = victimsIn(g, g.fg.zone).filter((v) => v.role !== 'werewolf');
  if (!vs.length) return;
  log(g, 'The victims in your space panic.', 'killer');
  panicVictims(g, vs);
};

// The Giant and the Clown Doll.
const APPARITION = { giant: { name: 'Giant', hp: 2, bonus: 1 }, clown: { name: 'Clown Doll', hp: 1, bonus: 0 } } as const;
customs['cm.enemy'] = (g, kind: 'giant' | 'clown') => {
  const a = APPARITION[kind];
  g.minions.push({ id: `tmp-${kind}`, zone: g.fg.zone, hp: a.hp });
  log(g, `A ${a.name} appears in your space (${plural(a.hp, 'health', 'health')})!`, 'killer', { kind: 'killerMove', path: [g.fg.zone] });
  pushFx(g, [{ k: 'custom', id: 'cm.mark' }, { k: 'custom', id: 'cm.enemyStrike' }, { k: 'custom', id: `cm.enemyHit:${kind}` }, { k: 'custom', id: `cm.enemyEnd:${kind}` }], { kind: 'terror' });
};
customs['cm.enemyStrike'] = (g) => {
  cs(g).strike = 'enemy';
  push(g, { t: 'strike', mode: 'enemy', left: 99 });
};
customs['cm.enemyHit'] = (g, kind: 'giant' | 'clown') => {
  const m = g.minions.find((x) => x.id === `tmp-${kind}`);
  if (!m) return;
  const dmg = bloodlustSpace(g).attack + APPARITION[kind].bonus;
  push(g, { t: 'attackFG', damage: dmg, by: `m:${m.id}` });
};
customs['cm.enemyEnd'] = (g, kind: 'giant' | 'clown') => {
  const was = g.minions.some((x) => x.id === `tmp-${kind}`);
  g.minions = g.minions.filter((x) => x.id !== `tmp-${kind}`);
  if (!was) return;
  log(g, `The ${APPARITION[kind].name} vanishes.`, 'killer');
  if (g.mods.damageTaken <= g.mods.damageMark) return;
  if (kind === 'clown') {
    log(g, 'The Clown Doll hurt you: +1 Bloodlust.', 'killer');
    return addBloodlust(g, 1);
  }
  const its = discardable(g);
  if (its.length) choose(g, 'The Giant hurt you: discard an item', its.map((i) => ({ id: i.uid, label: itemDef(g, i.id).name })), { id: 'cmDiscardItem' });
};
answers.cmDiscardItem = (g, uid) => discardItem(g, uid);
const discardable = (g: GameState): ItemInst[] => g.fg.items.filter((i) => i.id !== 'carolyn' && !(i.id === 'mrFloppy' && floppyLocked(g)));

// ---- the manor ---------------------------------------------------------------------

customs['cm.fake'] = (g) => {
  const its = discardable(g);
  if (!its.length) {
    log(g, 'You have no items: discard this card and draw the next.');
    // skip the rest of the card
    const top = g.stack[g.stack.length - 1];
    if (top?.t === 'fx') top.i = top.list.length;
    drawTerror(g);
    return;
  }
  const it = pick(g, its);
  log(g, `It was fake: ${theItem(g, it.id)} is discarded.`, 'bad');
  discardItem(g, it.uid);
};

customs['cm.wall'] = (g) => {
  if (!g.victims.length) return;
  log(g, 'Every victim panics. Any who jump out of a window die.', 'killer');
  panicVictims(g, [...g.victims], 1, { jumpDeath: true });
};

customs['cm.doors'] = (g) => {
  const inside = !zoneDef(g, g.fg.zone).outside;
  cs(g).lockNext = inside ? 'inside' : 'outside';
  log(g, inside ? 'The house locks itself: you can\'t move in your next Action Phase.' : 'The house locks itself: you can\'t get in during your next Action Phase.', 'killer');
};

customs['cm.brokenLadder'] = (g) => {
  const lad = L(g).ladder;
  if (!lad) return;
  g.tokens = g.tokens.filter((t) => t.id !== 'brokenLadder');
  g.tokens.push({ id: 'brokenLadder', zone: lad[0] });
  log(g, 'The outside ladder breaks: its two spaces are no longer connected.', 'killer');
};

customs['cm.voices'] = (g) => {
  const groups = new Map<string, typeof g.victims>();
  for (const v of g.victims) groups.set(v.zone, [...(groups.get(v.zone) ?? []), v]);
  log(g, 'Every victim goes up a floor.', 'killer');
  for (const [from, vs] of groups) {
    const fl = zoneDef(g, from).floor ?? 0;
    const up = exits(g, from, 'victim').filter((t) => (zoneDef(g, t).floor ?? 0) > fl && !zoneDef(g, t).hidden);
    if (!up.length) continue;
    const low = Math.min(...up.map((t) => zoneDef(g, t).floor ?? 0));
    const opts = up.filter((t) => (zoneDef(g, t).floor ?? 0) === low);
    if (opts.length > 1) {
      choose(g, `Tie: where do the victims in ${zoneName(g, from)} go up to?`, opts.map((t) => ({ id: t, label: zoneName(g, t), zone: t })), { id: 'victimsStep', data: { from } });
      continue;
    }
    for (const v of vs) moveVictim(g, v, opts[0]);
  }
};

customs['cm.trees'] = (g) => {
  if (zoneDef(g, g.fg.zone).window) {
    log(g, 'Branches smash through your window: lose 1 health.', 'bad');
    hurtFG(g, 1);
  }
  let n = 0;
  for (const v of g.victims.filter((x) => zoneDef(g, x.zone).window)) {
    killVictim(g, v, false);
    n++;
  }
  if (n && !g.outcome) {
    log(g, 'Someone died at a window: +1 Horror.', 'bad');
    addHorror(g, 1);
  }
};

customs['cm.towardAttic'] = (g) => {
  log(g, 'Every victim moves 1 space toward the Attic.', 'phase');
  const groups = new Map<string, typeof g.victims>();
  for (const v of g.victims) if (v.zone !== 'attic') groups.set(v.zone, [...(groups.get(v.zone) ?? []), v]);
  for (const [from, vs] of groups) {
    const steps = [...new Set(shortestPaths(g, from, 'attic', 'victim').map((p) => p[0]))].filter(Boolean);
    if (!steps.length) continue;
    if (steps.length > 1) {
      choose(g, `Tie: which way do the victims in ${zoneName(g, from)} go?`, steps.map((s) => ({ id: s, label: zoneName(g, s), zone: s })), { id: 'victimsStep', data: { from } });
      continue;
    }
    for (const v of vs) moveVictim(g, v, steps[0]);
  }
};

customs['cm.pushed'] = (g) => {
  for (const v of g.victims.filter((x) => zoneDef(g, x.zone).window)) {
    const r = d6(g);
    const dies = r <= 4;
    log(g, `Pushed to the Edge: ${r}. ${dies ? 'The victim jumps.' : 'The victim steps back.'}`, dies ? 'killer' : 'good', { kind: 'dice', faces: [r] });
    if (dies) killVictim(g, v, false);
  }
};

customs['cm.panicFoyer'] = (g) => {
  const vs = victimsIn(g, 'foyer').slice(-3);
  if (vs.length) {
    log(g, 'The new arrivals panic.', 'killer');
    panicVictims(g, vs);
  }
};

eventSetups['ev.helicopter'] = (g) => {
  cs(g).heliUsed = false;
  g.tokens = g.tokens.filter((t) => t.id !== 'helicopter');
  g.tokens.push({ id: 'helicopter', zone: 'helicopter' });
  log(g, 'A helicopter hovers over the roof, next to the Attic.', 'phase');
};
eventSetups['ev.nobodyReturns'] = (g) => {
  g.tokens = g.tokens.filter((t) => t.id !== 'skull' || t.zone !== 'attic');
  g.tokens.push({ id: 'skull', zone: 'attic' });
  for (const v of victimsIn(g, 'attic')) {
    log(g, 'Nobody Comes Back: a victim in the Attic dies.', 'killer');
    killVictim(g, v, false);
  }
};
hooks.victimEnters.push((g, v, zone) => {
  if (zone === 'attic' && has(g, 'ev.nobodyReturns')) {
    log(g, 'A victim goes into the Attic and doesn\'t come back.', 'killer');
    killVictim(g, v, false);
  }
});

eventSetups['ev.ghostHunters'] = (g) => makeHunters(g, 3);
function makeHunters(g: GameState, left: number): void {
  if (left <= 0) return;
  const plain = g.victims.filter((v) => !v.role);
  if (!plain.length) return;
  const d = distances(g, g.fg.zone, 'fg');
  const best = Math.min(...plain.map((v) => d.get(v.zone) ?? 99));
  const zs = [...new Set(plain.filter((v) => (d.get(v.zone) ?? 99) === best).map((v) => v.zone))];
  if (zs.length > 1) {
    choose(g, 'Tie: which victim becomes a ghost hunter?', zs.map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'cmHunter', data: { left } });
    return;
  }
  hunterAt(g, zs[0]);
  makeHunters(g, left - 1);
}
function hunterAt(g: GameState, zone: string): void {
  const v = g.victims.find((x) => x.zone === zone && !x.role);
  if (!v) return;
  v.role = 'ghostHunter';
  log(g, `A victim in ${zoneName(g, zone)} turns out to be a ghost hunter.`);
}
answers.cmHunter = (g, zone, data: { left: number }) => {
  hunterAt(g, zone);
  makeHunters(g, data.left - 1);
};
hooks.victimKilled.push((g, v) => {
  if (v.role === 'ghostHunter') {
    cs(g).hunterDied = true;
    log(g, 'A ghost hunter died: +1 Bloodlust.', 'killer');
    pushFx(g, [{ k: 'bloodlust', n: 1 }], { kind: 'event' });
  }
});

diceMods.push((g, p, n, notes) => {
  if (p.kind === 'action' && has(g, 'ev.lightsOut') && isMoveCard(p.card)) {
    const lit = usableItems(g, 'item.flashlight').length + usableItems(g, 'item.selenaFlashlight').length + usableItems(g, 'item.candle').length;
    if (!lit) {
      notes.push('−1 Lights Out');
      return n - 1;
    }
  }
  if (p.kind === 'action' && p.card === 'search') {
    if (has(g, 'ult.selena')) {
      notes.push('+2 Selena');
      n += 2;
    }
    if (has(g, 'mdp.psychicConfusion')) {
      if (cs(g).psychicPaid) {
        cs(g).psychicPaid = false;
        notes.push('Psychic Confusion ignored');
      } else {
        notes.push('−1 Psychic Confusion');
        n -= 1;
      }
    }
  }
  return n;
});

beforePlay.push((g, c) => {
  if (c === 'search' && has(g, 'mdp.psychicConfusion') && g.fg.time >= 3) {
    choose(
      g,
      'Psychic Confusion: spend 3 Time to roll your full dice for this Search?',
      [
        { id: 'yes', label: 'Yes (−3 Time)' },
        { id: 'no', label: 'No' },
      ],
      { id: 'cmPsychic' },
    );
  }
});
answers.cmPsychic = (g, id) => {
  if (id === 'yes') {
    addTime(g, -3);
    cs(g).psychicPaid = true;
  }
};

afterRoll.push((g, dice) => {
  if (!has(g, 'dp.eternalDespair')) return;
  const ones = dice.filter((d) => d === 1).length;
  if (ones) {
    log(g, `Eternal Despair: ${plural(ones, 'one')} rolled, lose ${ones} Time.`, 'bad');
    addTime(g, -ones);
  }
});

costMods.push((g, _c, cost) => (cost === 0 && has(g, 'fin.nothingEasy') ? 1 : cost));

// Panic moves: "The floor is shaking!" and Unseen Forces.
hooks.actionPhaseStart.push((g) => {
  if (!g.film.creech) return;
  const c = cs(g);
  c.panicNow = c.panicNext;
  c.lockNow = c.lockNext;
  c.panicNext = false;
  c.lockNext = null;
  if (c.panicNow) log(g, 'The floor is still shaking: every move this Action Phase is a panic move.', 'bad');
  if (c.lockNow === 'inside') log(g, 'The doors and windows are shut: you can\'t move this Action Phase.', 'bad');
  if (c.lockNow === 'outside') log(g, 'The doors and windows are shut: you can\'t get into the house this Action Phase.', 'bad');
});
hooks.actionPhaseEnd.push((g) => {
  if (!g.film.creech) return;
  cs(g).panicNow = false;
  cs(g).lockNow = null;
});
panicMoves.push((g) => {
  if (g.film.creech?.panicNow) return 'Panic move';
  if (has(g, 'mdp.unseenForces') && !g.mods.usedThisPhase.includes('unseenForces')) {
    g.mods.usedThisPhase.push('unseenForces');
    return 'Unseen Forces';
  }
  return null;
});

// The finale where she slips away for good.
hooks.finaleRevealed.push((g, ability) => {
  if (ability !== 'fin.soonLost') return;
  const all = [...K(g).terror, ...L(g).terror].flatMap((c) => Array(c.copies).fill(c.id) as string[]);
  const used = [...g.terrorDeck, ...g.terrorDiscard, ...g.killer.minors.map((m) => m.id), ...g.activeTerror];
  const left = [...all];
  for (const u of used) {
    const i = left.indexOf(u);
    if (i >= 0) left.splice(i, 1);
  }
  const add = shuffle(g, left).slice(0, 3);
  g.terrorDeck = shuffle(g, [...g.terrorDeck, ...add]);
  log(g, `${plural(add.length, 'Terror card')} go into the deck (${g.terrorDeck.length} now).`, 'killer');
});
customs['cm.lostDraw'] = (g) => {
  if (!g.terrorDeck.length) return endGame(g, 'killer', 'The Terror deck is empty: Carolyn is lost forever.');
  drawTerror(g);
};

// ---- the padlock and the crucifix -----------------------------------------------------------

attackStoppers.push((g) => {
  const lock = g.film.creech?.lock;
  if (!lock || (g.fg.zone !== lock[0] && g.fg.zone !== lock[1])) return false;
  log(g, 'The padlock holds: the attack is stopped, and the padlock breaks.', 'good');
  cs(g).lock = null;
  g.tokens = g.tokens.filter((t) => t.id !== 'padlock');
  return true;
});

beforeTerror.push((g, id) => {
  const c = usableItems(g, 'item.crucifix')[0];
  if (!c) return false;
  choose(
    g,
    `"${terrorDef(g, id).name}". Discard the Crucifix to ignore it?`,
    [
      { id: 'yes', label: 'Yes: ignore this Terror card' },
      { id: 'no', label: 'No: let it happen' },
    ],
    { id: 'cmCrucifix', data: { card: id, uid: c.uid } },
    terrorDef(g, id).text,
  );
  return true;
});
answers.cmCrucifix = (g, id, data: { card: string; uid: string }) => {
  if (id === 'yes') {
    discardItem(g, data.uid);
    g.terrorDiscard.push(data.card);
    log(g, 'The Crucifix cancels the Terror card.', 'good');
    return;
  }
  push(g, { t: 'terror', card: data.card, asked: true });
};

// ---- items ------------------------------------------------------------------------------------

const used = (g: GameState, key: string) => g.mods.usedThisPhase.includes(key);

itemHandlers['item.padlock'] = {
  actions: (g) => (adjacent(g, g.fg.zone).length ? [{ action: 'place', label: 'Fit the padlock to a door' }] : []),
  use(g, it) {
    choose(g, 'Which connection do you lock?', adjacent(g, g.fg.zone).map((z) => ({ id: z, label: `${zoneName(g, g.fg.zone)} ↔ ${zoneName(g, z)}`, zone: z })), { id: 'cmPadlock', data: { uid: it.uid } });
  },
};
answers.cmPadlock = (g, z, data: { uid: string }) => {
  g.tokens = g.tokens.filter((t) => t.id !== 'padlock');
  g.tokens.push({ id: 'padlock', zone: g.fg.zone, to: z });
  cs(g).lock = [g.fg.zone, z];
  log(g, `You padlock the door between ${zoneName(g, g.fg.zone)} and ${zoneName(g, z)}.`, 'good');
  discardItem(g, data.uid);
};

itemHandlers['item.ritualDagger'] = {
  actions: (g) => (victimsIn(g, g.fg.zone).some((v) => v.role !== 'werewolf') ? [{ action: 'sacrifice', label: 'Ritual Dagger: sacrifice a victim here' }] : []),
  use(g, it) {
    discardItem(g, it.uid);
    pushFx(g, [{ k: 'custom', id: 'pickKill', data: g.fg.zone }, { k: 'custom', id: 'cm.daggerAfter' }], { kind: 'item', id: it.id });
  },
};
customs['cm.daggerAfter'] = (g) => {
  if (g.killer.minors.length) {
    for (const m of g.killer.minors) g.terrorDiscard.push(m.id);
    g.killer.minors = [];
    log(g, 'The ritual breaks every Minor Dark Power.', 'good');
  } else damageKiller(g, 1);
};

itemHandlers['item.ancientText'] = {
  actions: (g, it) => (!used(g, it.uid) && g.fg.health.hp > 1 ? [{ action: 'use', label: 'Ancient Text: lose 1 health, +2 Time' }] : []),
  use(g, it) {
    g.mods.usedThisPhase.push(it.uid);
    log(g, 'You read from the Ancient Text.');
    hurtFG(g, 1);
    if (!g.outcome) addTime(g, 2);
  },
};

const candleFrom = (g: GameState) => adjacent(g, g.fg.zone).filter((z) => victimsIn(g, z).some((v) => v.role !== 'werewolf') && exits(g, z, 'victim').includes(g.fg.zone));
itemHandlers['item.candle'] = {
  actions: (g, it) => (!used(g, it.uid) && candleFrom(g).length ? [{ action: 'use', label: 'Candle: guide a victim from next door' }] : []),
  use(g, it) {
    g.mods.usedThisPhase.push(it.uid);
    const from = candleFrom(g);
    if (from.length === 1) return candle(g, from[0]);
    choose(g, 'Candle: guide a victim from where?', from.map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'cmCandle' });
  },
};
function candle(g: GameState, from: string): void {
  const v = victimsIn(g, from).find((x) => x.role !== 'werewolf');
  if (!v) return;
  log(g, `The candle guides a victim from ${zoneName(g, from)} to you.`, 'good', { kind: 'victimMove', victim: v.id, path: [from, g.fg.zone] });
  moveVictim(g, v, g.fg.zone);
  if (rescuable(g).length) push(g, { t: 'rescue' });
}
answers.cmCandle = (g, z) => candle(g, z);

function rifle(discard: number): import('../engine/registry').ItemHandler {
  return {
    actions(g, it) {
      if (g.mods.usedThisTurn.includes(it.uid) || g.fg.hand.length < discard) return [];
      const enemiesHere = (!K(g).invulnerable && g.killer.zone === g.fg.zone) || g.minions.some((m) => m.zone === g.fg.zone);
      return enemiesHere ? [{ action: 'shoot', label: `Fire ${theItem(g, it.id)} (discard ${plural(discard, 'card')})` }] : [];
    },
    use(g, it) {
      g.mods.usedThisTurn.push(it.uid);
      rifleDiscard(g, discard, it.uid);
    },
  };
}
function rifleDiscard(g: GameState, left: number, uid: string): void {
  if (left <= 0) return fireRifle(g, uid);
  choose(
    g,
    `Rifle: discard a card (${left} to go)`,
    [...new Set(g.fg.hand)].map((c) => ({ id: c, label: card(c).name })),
    { id: 'cmRifle', data: { left, uid } },
  );
}
answers.cmRifle = (g, c, data: { left: number; uid: string }) => {
  const i = g.fg.hand.indexOf(c);
  if (i >= 0) {
    g.fg.hand.splice(i, 1);
    g.actionDiscard.push(c);
  }
  rifleDiscard(g, data.left - 1, data.uid);
};
function fireRifle(g: GameState, uid: string): void {
  const dice = Array.from({ length: 6 }, () => d6(g));
  const hits = dice.filter((d) => d >= 5).length;
  const blanks = dice.filter((d) => d <= 2).length;
  log(g, `Rifle (6 dice): ${dice.join(' ')}: ${plural(hits, 'hit')}, ${blanks} blank.`, 'info', { kind: 'dice', faces: dice });
  if (hits) {
    if (!K(g).invulnerable && g.killer.zone === g.fg.zone) damageKiller(g, hits);
    if (!g.outcome && g.minions.some((m) => m.zone === g.fg.zone)) damageMinions(g, g.fg.zone, hits);
  }
  if (blanks >= 3 && !g.outcome) {
    log(g, 'Half the dice or more came up blank: the rifle is done.', 'bad');
    const it = g.fg.items.find((i) => i.uid === uid);
    if (it) {
      g.fg.items = g.fg.items.filter((i) => i !== it);
      g.itemDiscard.push(it.id);
    }
  }
}
itemHandlers['item.rifle'] = rifle(2);
itemHandlers['item.alicesRifle'] = rifle(1);


const ropeSpots = (g: GameState) => [...new Set((L(g).oneWay ?? []).map((o) => o.at))].filter((z) => !g.tokens.some((t) => t.id === 'ropeLadder' && t.zone === z));
itemHandlers['item.ropeLadder'] = {
  actions(g) {
    const out: { action: string; label: string }[] = [];
    if (g.tokens.some((t) => t.id === 'brokenLadder')) out.push({ action: 'fix', label: 'Rope Ladder: replace the broken ladder' });
    if (ropeSpots(g).length) out.push({ action: 'place', label: 'Rope Ladder: hang it where an arrow goes one way' });
    return out;
  },
  use(g, it, action) {
    if (action === 'fix') {
      g.tokens = g.tokens.filter((t) => t.id !== 'brokenLadder');
      log(g, 'The rope ladder replaces the broken one.', 'good');
      return discardItem(g, it.uid);
    }
    choose(g, 'Hang the rope ladder where?', ropeSpots(g).map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'cmRope', data: { uid: it.uid } });
  },
};
answers.cmRope = (g, z, data: { uid: string }) => {
  g.tokens.push({ id: 'ropeLadder', zone: z });
  log(g, `The rope ladder hangs from the ${zoneName(g, z)}: you can climb back up now.`, 'good');
  discardItem(g, data.uid);
};

itemHandlers['item.selenaFlashlight'] = {
  actions(g, it) {
    const out: { action: string; label: string }[] = [];
    if (!used(g, it.uid) && g.terrorDeck.length) out.push({ action: 'look', label: "Selena's Flashlight: look at the top Terror card" });
    const deck = zoneDef(g, g.fg.zone).search ? g.itemDecks[zoneDef(g, g.fg.zone).deck ?? g.fg.zone] : undefined;
    if (deck?.length) out.push({ action: 'take', label: "Selena's Flashlight: discard it to take this deck's top item" });
    return out;
  },
  use(g, it, action) {
    if (action === 'take') {
      const deck = g.itemDecks[zoneDef(g, g.fg.zone).deck ?? g.fg.zone];
      discardItem(g, it.uid);
      const top = deck?.shift();
      if (top) gainItem(g, top.id);
      return;
    }
    g.mods.usedThisPhase.push(it.uid);
    peekTerror(g, "Selena's Flashlight");
  },
};

itemHandlers['item.list'] = {};
customs['cm.list'] = (g, data: { id: string }) => {
  log(g, `You get ${itemDef(g, data.id).name}`, 'good', { kind: 'card', deck: 'item', id: data.id });
  const r = d6(g);
  const deck = r <= 2 ? 'garage' : r <= 4 ? 'closet' : 'attic';
  log(g, `Rolled ${r}: every item in the ${zoneName(g, deck)} deck is turned up.`, 'info', { kind: 'dice', faces: [r] });
  for (const c of g.itemDecks[deck] ?? []) c.up = true;
  g.itemDiscard.push(data.id);
};

// ---- final girls ---------------------------------------------------------------------------

onUltimate.push((g) => {
  if (g.fg.id !== 'alice') return;
  const kinds = [...new Set(ACTION_CARDS.filter((c) => c.results && (!c.onlyWith || g.tableau[c.id] !== undefined || g.fg.hand.includes(c.id))).map((c) => c.id))];
  choose(g, "Alice's Ultimate: which kind of card always rolls 5 dice?", kinds.map((c) => ({ id: c, label: card(c).name })), { id: 'cmAlice' });
});
answers.cmAlice = (g, c) => {
  cs(g).fiveDice = c;
  log(g, `${card(c).name} will always roll exactly 5 dice.`, 'good');
};

