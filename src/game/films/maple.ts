// Frightmare on Maple Lane: Dr. Fright only gets you in your dreams. Awake,
// he can't touch you and you can't touch him; asleep, you're in his Boiler
// Room until you get through its four cards. Plus the street's houses
// (Persuade to get in), its events and items, Nancy and Sheila.

import { beforePlay, canSearchHere, setPersuadeTargets } from '../engine/actionPhase';
import { distances, exits, killVictim, moveVictim, panicVictims, placeVictims, shortestPaths, victimsIn } from '../engine/board';
import { attackValue, pathChecks, pushKillerAction, targetZoneFilters } from '../engine/combat';
import { startRoll, rollDone } from '../engine/dice';
import { discardItem, drawTerror, gainItem, placeKiller, spendUse, takeItemFromAnyDeck } from '../engine/effects';
import { answers, cap, choose, customs, d6, has, hooks, itemDef, K, L, log, plural, push, pushFx, uid, usableItems, yesNo, zoneDef, zoneName } from '../engine/kernel';
import { eventSetups, turnEnd } from '../engine/phases';
import { cardGates, diceMods, followFilters, itemHandlers, moveFilters, rescueFilters } from '../engine/registry';
import { setupHooks } from '../engine/setup';
import type { Frame, GameState, Victim } from '../engine/state';
import { addBloodlust, addHorror, addTime, damageKiller, horrorLevel, hurtFG } from '../engine/stats';
import type { ZoneId } from '../types';

interface MapleState {
  asleep: boolean;
  /** The Boiler Room: cards left, and where each revealed card sits (grid cells). */
  br: { deck: string[]; placed: { id: string; x: number; y: number }[] };
  blurred: boolean;
  marked: boolean;
  lockNext: boolean;
  lockNow: boolean;
  extraBR: number;
  mark: number;
  attackedFG: boolean;
  surprise: number;
  revived: boolean;
  offBoard: boolean;
  policeTo: ZoneId | null;
  crucifixPass: boolean;
}

const BR_CARDS = ['br1', 'br2', 'br3', 'br4'];
/** Where Dr. Fright is drawn on each Boiler Room card (quarter of the card). */
const FRIGHT_AT: Record<string, { qx: number; qy: number }> = {
  br1: { qx: 1, qy: 0 },
  br2: { qx: 0, qy: 0 },
  br3: { qx: 1, qy: 1 },
  br4: { qx: 0, qy: 1 },
};
type Dir = 'up' | 'down' | 'left' | 'right';
const SLIDE: Record<Dir, [number, number]> = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] };

function fresh(): MapleState {
  return {
    asleep: false,
    br: { deck: [...BR_CARDS], placed: [{ id: 'top', x: 0, y: 0 }] },
    blurred: false,
    marked: false,
    lockNext: false,
    lockNow: false,
    extraBR: 0,
    mark: 0,
    attackedFG: false,
    surprise: 0,
    revived: false,
    offBoard: false,
    policeTo: null,
    crucifixPass: false,
  };
}

export const ml = (g: GameState): MapleState => (g.film.maple ??= fresh());
const isFright = (g: GameState): boolean => g.config.killer === 'drFright';
const isMaple = (g: GameState): boolean => g.config.location === 'mapleLane';
export const asleep = (g: GameState): boolean => isFright(g) && ml(g).asleep;
const mustSleep = (g: GameState): boolean => has(g, 'mdp.endless') || has(g, 'fin.faceFear');
const isHouse = (g: GameState, z: ZoneId): boolean => !!zoneDef(g, z).house;
const isStreet = (g: GameState, z: ZoneId): boolean => !!zoneDef(g, z).street;
const burning = (g: GameState, z: ZoneId): boolean => g.tokens.some((t) => t.id === 'mlFire' && t.zone === z);
const occupied = (g: GameState, z: ZoneId): boolean => g.victims.some((v) => v.zone === z);

setupHooks.push((g) => {
  if (isFright(g) || isMaple(g)) {
    g.film.maple = fresh();
    if (isFright(g)) shuffleBR(g, false);
  }
});

// ---- awake and asleep ---------------------------------------------------------------

function shuffleBR(g: GameState, say = true): void {
  const deck = [...BR_CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor((d6(g) * 6 + d6(g)) % (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  ml(g).br = { deck, placed: [{ id: 'top', x: 0, y: 0 }] };
  if (say) log(g, 'The Boiler Room deck is reset.', 'killer');
}

export function fallAsleep(g: GameState): void {
  if (!isFright(g) || ml(g).asleep) return;
  ml(g).asleep = true;
  shuffleBR(g, false);
  log(g, 'You fall asleep! You\'re in the Boiler Room: Dr. Fright can hurt you and you can hurt him. Victims won\'t follow you and you can\'t save anyone.', 'killer');
}

function wakeUp(g: GameState): void {
  shuffleBR(g, false);
  if (mustSleep(g)) {
    log(g, 'You get out of the Boiler Room, but you\'re still asleep: the deck resets.', 'killer');
    return;
  }
  ml(g).asleep = false;
  log(g, 'You wake up! You got through all four Boiler Room cards.', 'good');
}

/** Cells of the newest card that no earlier card covers. */
function visible(placed: { x: number; y: number }[], i: number): { qx: number; qy: number }[] {
  const c = placed[i];
  const out: { qx: number; qy: number }[] = [];
  for (let qy = 0; qy < 2; qy++)
    for (let qx = 0; qx < 2; qx++) {
      const x = c.x + qx;
      const y = c.y + qy;
      if (!placed.slice(0, i).some((p) => x >= p.x && x < p.x + 2 && y >= p.y && y < p.y + 2)) out.push({ qx, qy });
    }
  return out;
}

/** What the Boiler Room shows so far, for the UI: each revealed cell and whether Dr. Fright is in it. */
export function boilerView(g: GameState): { cells: { x: number; y: number; card: number; fright: boolean }[]; left: number } | null {
  if (!isFright(g) || !g.film.maple) return null;
  const s = ml(g);
  const cells: { x: number; y: number; card: number; fright: boolean }[] = [];
  s.br.placed.forEach((p, i) => {
    const vis = i === 0 ? [{ qx: 0, qy: 0 }, { qx: 1, qy: 0 }, { qx: 0, qy: 1 }, { qx: 1, qy: 1 }] : visible(s.br.placed, i);
    for (const c of vis) cells.push({ x: p.x + c.qx, y: p.y + c.qy, card: i, fright: i > 0 && FRIGHT_AT[p.id].qx === c.qx && FRIGHT_AT[p.id].qy === c.qy });
  });
  return { cells, left: s.br.deck.length };
}

function describeCells(cells: { qx: number; qy: number }[]): string {
  if (cells.length === 4) return 'the whole card';
  if (cells.length === 3) return 'three quarters of it';
  if (cells.length === 2) {
    const xs = new Set(cells.map((c) => c.qx));
    const ys = new Set(cells.map((c) => c.qy));
    if (xs.size === 1) return xs.has(0) ? 'its left half' : 'its right half';
    if (ys.size === 1) return ys.has(0) ? 'its top half' : 'its bottom half';
    return 'two opposite quarters';
  }
  if (cells.length === 1) return `its ${cells[0].qy === 0 ? 'top' : 'bottom'} ${cells[0].qx === 0 ? 'left' : 'right'} quarter`;
  return 'nothing';
}

function slides(g: GameState): { dir: Dir; cells: { qx: number; qy: number }[] }[] {
  const s = ml(g);
  const last = s.br.placed[s.br.placed.length - 1];
  const out: { dir: Dir; cells: { qx: number; qy: number }[] }[] = [];
  for (const dir of Object.keys(SLIDE) as Dir[]) {
    const [dx, dy] = SLIDE[dir];
    const placed = [...s.br.placed, { id: 'next', x: last.x + dx, y: last.y + dy }];
    const cells = visible(placed, placed.length - 1);
    if (cells.length) out.push({ dir, cells });
  }
  return out;
}

customs['df.resolveBR'] = (g) => {
  if (!asleep(g)) return;
  const s = ml(g);
  if (!s.br.deck.length) return wakeUp(g);
  const opts = slides(g);
  if (opts.length <= 1) return revealBR(g, opts[0]?.dir ?? null);
  choose(
    g,
    'Boiler Room: which way do you slide the deck?',
    opts.map((o) => ({ id: o.dir, label: `Slide it ${o.dir} (shows ${describeCells(o.cells)})` })),
    { id: 'dfSlide' },
    `${plural(s.br.deck.length, 'card')} left. Dr. Fright is somewhere on each one; the more you show, the likelier he's in it.`,
  );
};
answers.dfSlide = (g, dir) => revealBR(g, dir as Dir);

function revealBR(g: GameState, dir: Dir | null): void {
  const s = ml(g);
  const id = s.br.deck.shift()!;
  const last = s.br.placed[s.br.placed.length - 1];
  const [dx, dy] = dir ? SLIDE[dir] : [0, 0];
  s.br.placed.push({ id, x: last.x + dx, y: last.y + dy });
  const cells = visible(s.br.placed, s.br.placed.length - 1);
  const f = FRIGHT_AT[id];
  const there = cells.some((c) => c.qx === f.qx && c.qy === f.qy);
  log(
    g,
    `Boiler Room (${s.br.placed.length - 1} of 4): you slide the deck${dir ? ` ${dir}` : ''} and see ${describeCells(cells)}.${there ? ' Dr. Fright is there!' : ' Nothing.'}`,
    there ? 'bad' : 'info',
  );
  if (!s.br.deck.length) push(g, { t: 'custom', id: 'df.brWake', step: 0 });
  if (there) {
    s.attackedFG = true;
    push(g, { t: 'attackFG', damage: attackValue(g, 'killer'), by: 'killer' });
  }
}
customs['df.brWake'] = (g) => {
  if (asleep(g)) wakeUp(g);
};

hooks.killerPhaseEnd.push((g) => {
  if (!asleep(g)) return;
  const s = ml(g);
  const n = 1 + (has(g, 'mdp.infernalSearch') ? 1 : 0) + s.extraBR;
  s.extraBR = 0;
  log(g, `End of the Killer Phase: you resolve ${n === 1 ? 'a Boiler Room card' : `${n} Boiler Room cards`}.`, 'killer');
  for (let i = 0; i < n; i++) push(g, { t: 'custom', id: 'df.resolveBR', step: 0 });
});

// Short and Long Rests can put you to sleep.
beforePlay.push((g, c) => {
  if (!isFright(g) || ml(g).asleep || (c !== 'shortRest' && c !== 'longRest')) return;
  yesNo(g, 'Do you drift off to sleep (into the Boiler Room)?', 'Yes: fall asleep', { id: 'dfRestSleep' });
});
answers.dfRestSleep = (g, id) => {
  if (id === 'yes') fallAsleep(g);
};

customs['df.sleep'] = (g) => fallAsleep(g);
customs['df.maxed'] = (g) => {
  if (!isFright(g)) return;
  if (ml(g).asleep) shuffleBR(g);
  else fallAsleep(g);
};

// "Until the next Terror card" effects end when one is drawn (or at the next Killer Phase after the Finale).
function clearUntilTerror(g: GameState): void {
  if (!g.film.maple) return;
  g.film.maple.blurred = false;
  g.film.maple.marked = false;
}
hooks.killerPhaseStart.push((g) => {
  if (g.killer.finaleRevealed) clearUntilTerror(g);
});

hooks.actionPhaseStart.push((g) => {
  if (!g.film.maple) return;
  const s = ml(g);
  s.lockNow = s.lockNext;
  s.lockNext = false;
  if (s.lockNow) log(g, 'Better Lock the Door: you can\'t get into a house with a victim in it this phase.', 'bad');
});
hooks.actionPhaseEnd.push((g) => {
  if (g.film.maple) g.film.maple.lockNow = false;
});

turnEnd.push((g) => {
  if (g.film.maple) g.film.maple.surprise = 0;
});

followFilters.push((g) => !asleep(g) && !has(g, 'item.machete') && !has(g, 'item.nancysMachetes'));
rescueFilters.push((g, _v, zone) => !asleep(g) && !g.tokens.some((t) => t.id === 'barrier' && t.zone === zone));

// ---- skipping a Terror card ---------------------------------------------------------

/** "Discard this card and draw the next": drop the rest of the card's effects. */
function skipCard(g: GameState, why: string): void {
  log(g, `${why}: discard it and draw the next Terror card.`);
  stopCard(g);
  drawTerror(g);
}
function stopCard(g: GameState): void {
  for (let i = g.stack.length - 1; i >= 0; i--) {
    const f = g.stack[i];
    if (f.t === 'fx' && f.src.kind === 'terror') {
      f.i = f.list.length;
      return;
    }
  }
}

// ---- the Final Girl panics -------------------------------------------------------------

function fgPanic(g: GameState): void {
  const r = d6(g);
  const arrow = zoneDef(g, g.fg.zone).panic.find((a) => a.faces.includes(r));
  if (!arrow || !exits(g, g.fg.zone, 'fg').includes(arrow.to) || burning(g, arrow.to)) {
    log(g, `You panic: ${r}, you stay in ${zoneName(g, g.fg.zone)}.`, 'bad', { kind: 'dice', faces: [r] });
    return;
  }
  const from = g.fg.zone;
  g.fg.zone = arrow.to;
  log(g, `You panic: ${r}, you bolt to ${zoneName(g, arrow.to)}.`, 'bad', { kind: 'fgMove', path: [from, arrow.to] });
  for (const fn of hooks.fgEnters) fn(g, arrow.to, from);
}

// ---- Dr. Fright's Terror cards ---------------------------------------------------------

customs['df.panicOutside'] = (g) => {
  const list = g.victims.filter((v) => !isHouse(g, v.zone) && v.role !== 'werewolf');
  if (!list.length) return;
  log(g, 'Every victim outside a house panics.', 'killer');
  panicVictims(g, list);
};

customs['df.deadCount'] = (g) => {
  const n = g.dead.length;
  if (!n) {
    log(g, 'Nobody has died yet.', 'killer');
    return fallAsleep(g);
  }
  log(g, `${plural(n, 'victim')} dead: +${n >= 4 ? 2 : 1} Bloodlust.`, 'killer');
  addBloodlust(g, n >= 4 ? 2 : 1);
};

customs['df.crucifixGate'] = (g) => {
  const it = usableItems(g, 'item.mlCrucifix')[0];
  if (!it) return;
  yesNo(g, 'Grab Your Crucifix: discard it to ignore the rest of this card?', 'Yes: hold it up', { id: 'dfCrucifix', data: { uid: it.uid } });
};
answers.dfCrucifix = (g, id, data: { uid: string }) => {
  if (id !== 'yes') return;
  discardItem(g, data.uid);
  log(g, 'The Crucifix: the rest of the card is ignored.', 'good');
  stopCard(g);
};

customs['df.fingers'] = (g) => {
  if (g.killer.health.hp <= 1) {
    log(g, 'Dr. Fright is down to his last health: he doesn\'t cut himself.');
    return;
  }
  log(g, 'Dr. Fright cuts off his own fingers: 1 damage to him.', 'good');
  const before = g.killer.health.hp;
  damageKiller(g, 1, true);
  if (g.outcome || g.killer.health.hp >= before) return;
  log(g, 'You shudder: +3 Horror, and you and the victims with him panic.', 'bad');
  const list = victimsIn(g, g.killer.zone);
  addHorror(g, 3);
  if (list.length) panicVictims(g, list);
  fgPanic(g);
};

customs['df.lockHouses'] = (g) => {
  ml(g).lockNext = true;
  log(g, 'In your next Action Phase you can\'t go into a house with a victim in it.', 'killer');
};

customs['df.undead'] = (g) => {
  const i = g.fg.slots.lastIndexOf(true);
  if (!g.fg.saved || g.fg.ultimate || i < 0) return skipCard(g, 'You haven\'t saved anyone (or your card is flipped)');
  g.fg.slots[i] = false;
  g.fg.saved--;
  g.dead.push({ id: `v${uid(g, '')}`, zone: g.fg.zone });
  log(g, 'One of the victims you saved was dead all along: they leave your Final Girl card.', 'bad');
};

customs['df.stayAwake'] = (g) => {
  if (!asleep(g)) {
    g.mods.minusDicePhase++;
    log(g, 'Next Action Phase you roll 1 fewer die on every horror roll.', 'bad');
    return;
  }
  const n = ml(g).br.deck.length;
  log(g, `Better Stay Awake: you resolve the last ${plural(n, 'Boiler Room card')} now.`, 'killer');
  for (let i = 0; i < n; i++) push(g, { t: 'custom', id: 'df.resolveBR', step: 0 });
};

customs['df.sleepy'] = (g) => {
  if (!asleep(g)) {
    const r = d6(g);
    log(g, `"I'm so sleepy…": you roll ${r} against Horror ${horrorLevel(g)}.`, 'info', { kind: 'dice', faces: [r] });
    if (r < horrorLevel(g)) fallAsleep(g);
    return;
  }
  ml(g).mark = g.mods.damageTaken;
  push(g, { t: 'custom', id: 'df.resolveBR', step: 0 }, { t: 'custom', id: 'df.sleepyAfter', step: 0 });
};
customs['df.sleepyAfter'] = (g) => {
  if (g.mods.damageTaken > ml(g).mark) {
    log(g, 'You got hurt: +1 Horror.', 'bad');
    addHorror(g, 1);
  }
};

customs['df.blurred'] = (g) => {
  ml(g).blurred = true;
  log(g, 'Blurred Reality: until the next Terror card you and Dr. Fright can hurt each other even while you\'re awake.', 'killer');
};

customs['df.marked'] = (g) => {
  ml(g).marked = true;
  const list = victimsIn(g, g.fg.zone);
  log(g, 'Marked for Death: victims in your space panic until the next Terror card.', 'killer');
  if (list.length) panicVictims(g, list);
};
customs['df.attackMark'] = (g) => {
  ml(g).attackedFG = false;
};
customs['df.markedAfter'] = (g) => {
  if (!ml(g).attackedFG && !asleep(g) && isFright(g)) {
    log(g, 'Dr. Fright didn\'t attack you: you fall asleep at once.', 'killer');
    fallAsleep(g);
  }
};

customs['df.dream'] = (g) => {
  if (!asleep(g)) return skipCard(g, 'You\'re awake');
  choose(
    g,
    '"If this is a dream…": raise Bloodlust by 1 for one of these?',
    [
      { id: 'item', label: '+1 Bloodlust: take the top item of any deck' },
      { id: 'move', label: '+1 Bloodlust: go to any space' },
      { id: 'time', label: '+1 Bloodlust: gain 4 Time' },
      { id: 'no', label: 'No' },
    ],
    { id: 'dfDream' },
  );
};
answers.dfDream = (g, id) => {
  if (id === 'no') return;
  addBloodlust(g, 1);
  if (id === 'item') takeItemFromAnyDeck(g);
  if (id === 'time') addTime(g, 4);
  if (id === 'move') {
    const to = L(g).zones.filter((z) => z.id !== g.fg.zone && !z.hidden && !burning(g, z.id));
    choose(g, 'Go to any space', to.map((z) => ({ id: z.id, label: z.name, zone: z.id })), { id: 'dfDreamMove' });
  }
};
answers.dfDreamMove = (g, zone) => {
  const from = g.fg.zone;
  g.fg.zone = zone;
  log(g, `In the dream you're suddenly in ${zoneName(g, zone)}.`, 'good', { kind: 'fgMove', path: [from, zone] });
  for (const fn of hooks.fgEnters) fn(g, zone, from);
};

customs['df.frankie'] = (g) => {
  const n = victimsIn(g, g.killer.zone).length ? 2 : 1;
  log(g, `Frankie's coming: +${n} Horror.`, 'bad');
  addHorror(g, n);
};

customs['df.neverSleep'] = (g) => {
  if (!asleep(g)) return fallAsleep(g);
  choose(
    g,
    'Never Sleep Again: you\'re already asleep.',
    [
      { id: 'reset', label: 'Reset the Boiler Room deck' },
      { id: 'extra', label: 'Resolve 1 extra Boiler Room card at the end of the Killer Phase' },
    ],
    { id: 'dfNeverSleep' },
  );
};
answers.dfNeverSleep = (g, id) => {
  if (id === 'reset') shuffleBR(g);
  else ml(g).extraBR++;
};

// ---- Dr. Fright's finales and dark powers ------------------------------------------------

customs['df.killTwo'] = (g) => {
  const n = Math.min(2, g.victims.filter((v) => v.role !== 'werewolf').length);
  if (!n) {
    log(g, 'There\'s nobody left to kill: you lose 4 health.', 'killer');
    return hurtFG(g, 4);
  }
  log(g, `Everyone Has to Die: ${plural(n, 'victim')} of your choice die.`, 'killer');
  for (let i = 0; i < n; i++) push(g, { t: 'custom', id: 'pickKill', step: 0 });
};

hooks.finaleRevealed.push((g, ability) => {
  if (!isFright(g)) return;
  if (ability === 'fin.faceFear') {
    if (ml(g).asleep) shuffleBR(g);
    else fallAsleep(g);
  }
  if (ability === 'fin.everyoneDies') {
    ml(g).offBoard = true;
    g.killer.zone = g.fg.zone;
    log(g, 'Dr. Fright leaves the board: while you\'re asleep you can attack him from anywhere.', 'killer');
  }
});

hooks.upkeep.push((g) => {
  if (!isFright(g) || !has(g, 'fin.timeToDie') || ml(g).asleep) return;
  log(g, 'Time to Die: you\'re awake in the Upkeep. Lose 2 health and fall asleep.', 'killer');
  hurtFG(g, 2);
  if (!g.outcome) fallAsleep(g);
});

hooks.darkPowerRevealed.push((g, ability) => {
  if (ability !== 'dp.neverDead') return;
  const h = g.killer.health;
  if (h.token === 'black') g.spareTokens.push(h.hidden);
  h.token = 'white';
  h.hidden = 0;
  log(g, 'Dr. Fright\'s Final Health token goes back to the pool: he gets a white one.', 'killer');
});
hooks.killerDying.push((g) => {
  if (!isFright(g) || !has(g, 'dp.neverDead') || ml(g).revived) return false;
  ml(g).revived = true;
  const toks = g.spareTokens.splice(0, 3);
  const n = toks.reduce((s, x) => s + x, 0);
  log(g, `Never Really Dead: 3 Final Health tokens from the pool show ${toks.join(', ') || 'nothing'}.`, 'killer');
  if (n <= 0) return false;
  g.killer.health.hp = n;
  log(g, `Dr. Fright gets back up with ${n} health.`, 'killer');
  return true;
});

// Moving into a space while he's off the board, Nancy's machetes, Marked for Death.
hooks.fgEnters.push((g, zone) => {
  const s = g.film.maple as MapleState | undefined;
  if (!s) return;
  if (s.offBoard) g.killer.zone = zone;
  if (has(g, 'item.nancysMachetes') && g.killer.zone === zone && !s.offBoard) {
    log(g, "Nancy's Machetes: you go into the Killer's space. +1 Bloodlust.", 'killer');
    addBloodlust(g, 1);
  }
  if (s.marked) {
    const list = victimsIn(g, zone);
    if (list.length) {
      log(g, 'Marked for Death: the victims here panic.', 'killer');
      panicVictims(g, list);
    }
  }
});

// ---- Nancy ------------------------------------------------------------------------

hooks.fgHurt.push((g) => {
  if (!has(g, 'ult.nancy') || g.fg.health.token !== 'black' || !g.spareTokens.length) return;
  const v = g.spareTokens.shift()!;
  choose(
    g,
    `Nancy: a Final Health token from the pool shows ${v ? plural(v, 'heart') : 'nothing'}. Swap it for yours?`,
    [
      { id: 'swap', label: 'Swap (yours goes back to the pool)' },
      { id: 'drop', label: 'Remove it from the game' },
    ],
    { id: 'nancySwap', data: { v } },
  );
});
answers.nancySwap = (g, id, data: { v: number }) => {
  if (id !== 'swap') return log(g, 'You put the token out of the game.');
  g.spareTokens.push(g.fg.health.hidden);
  g.fg.health.hidden = data.v;
  log(g, 'You swap your Final Health token for the one you turned up.', 'good');
};

// ---- Maple Lane: houses and Persuade -------------------------------------------------------

/** Houses next to you that Persuade can get you into. */
function persuadeTargets(g: GameState): ZoneId[] {
  const s = g.film.maple as MapleState | undefined;
  return exits(g, g.fg.zone, 'fg').filter((z) => isHouse(g, z) && !burning(g, z) && !(s?.lockNow && occupied(g, z)));
}
setPersuadeTargets(persuadeTargets);
cardGates.push((g, c) => c !== 'persuade' || persuadeTargets(g).some((z) => occupied(g, z)));

moveFilters.push((g, mode, to) => {
  if (mode === 'free' || !L(g).zones.some((z) => z.house)) return to;
  return to.filter((z) => !isHouse(g, z) || (!burning(g, z) && !occupied(g, z)));
});

customs['ml.enter'] = (g, data?: { take?: boolean }) => {
  if (!persuadeTargets(g).length) return log(g, 'There\'s no house next to you to go into.');
  if (data?.take) push(g, { t: 'move', remaining: 1, mode: 'persuade', moved: 0, src: { kind: 'action', id: 'persuade' } }, { t: 'custom', id: 'ml.takeTop', step: 0 });
  else push(g, { t: 'move', remaining: 1, mode: 'persuade', moved: 0, src: { kind: 'action', id: 'persuade' } });
};
customs['ml.takeTop'] = (g) => {
  const z = zoneDef(g, g.fg.zone);
  if (!z.house || !canSearchHere(g)) return;
  const top = g.itemDecks[z.deck!]?.[0];
  if (!top) return;
  yesNo(g, `Persuade: take the top item of ${zoneName(g, z.deck!)}${top.up ? ` (${itemDef(g, top.id).name})` : ''}? The house is then marked searched.`, 'Yes, take it', { id: 'mlTakeTop' });
};
answers.mlTakeTop = (g, id) => {
  if (id !== 'yes') return;
  const z = zoneDef(g, g.fg.zone);
  const deck = g.itemDecks[z.deck!];
  const c = deck?.shift();
  if (!c) return;
  if (deck[0]) deck[0].up = true;
  g.tokens.push({ id: 'searched', zone: z.id });
  gainItem(g, c.id);
};
customs['ml.returnCard'] = (g) => {
  const i = g.actionDiscard.lastIndexOf('persuade');
  if (i < 0) return;
  g.actionDiscard.splice(i, 1);
  g.tableau.persuade = (g.tableau.persuade ?? 0) + 1;
  log(g, 'Persuade goes back to the tableau.');
};

diceMods.push((g, p, n, notes) => {
  if (p.kind === 'action' && p.card === 'persuade') {
    if (has(g, 'ev.friendlyNeighbors')) {
      n++;
      notes.push('+1 Friendly Neighbors');
    }
    if (has(g, 'item.bible')) {
      n += 2;
      notes.push('+2 Bible');
    }
  }
  if (p.kind === 'action' && p.weapon) {
    const w = g.fg.items.find((i) => i.uid === p.weapon);
    if (w && itemDef(g, w.id).ability === 'item.sheilasKnife') {
      n++;
      notes.push("+1 Sheila's Knife");
    }
  }
  return n;
});

// ---- Maple Lane's Terror cards --------------------------------------------------------

customs['ml.killerToExit'] = (g) => {
  const ex = L(g).zones.filter((z) => z.exit && occupied(g, z.id));
  if (!ex.length) return skipCard(g, 'No exit has a victim');
  if (ex.length === 1) return placeKiller(g, ex[0].id);
  choose(g, 'Which exit does the Killer appear on?', ex.map((z) => ({ id: z.id, label: `${z.name} (${victimsIn(g, z.id).length})`, zone: z.id })), { id: 'placeKiller' });
};

function placeBarrier(g: GameState, zone: ZoneId): void {
  g.tokens.push({ id: 'barrier', zone });
  log(g, `A barrier goes up at the ${zoneName(g, zone)}: nobody can be saved there.`, 'killer');
}
answers.mlBarrier = (g, zone) => placeBarrier(g, zone);

customs['ml.barrier'] = (g) => {
  const d = distances(g, g.fg.zone, 'fg');
  const ex = L(g).zones.filter((z) => z.exit && !g.tokens.some((t) => t.id === 'barrier' && t.zone === z.id));
  if (!ex.length) return;
  const best = Math.min(...ex.map((z) => d.get(z.id) ?? 99));
  const tied = ex.filter((z) => (d.get(z.id) ?? 99) === best);
  if (tied.length === 1) return placeBarrier(g, tied[0].id);
  choose(g, 'Tie: which exit gets the barrier?', tied.map((z) => ({ id: z.id, label: z.name, zone: z.id })), { id: 'mlBarrier' });
};

customs['ml.works'] = (g) => {
  const r = d6(g);
  const pick: Record<number, ZoneId[]> = { 1: ['westExit'], 2: ['eastExit'], 3: ['northExit'], 4: ['southExit'], 5: ['eastExit', 'westExit'], 6: ['northExit', 'southExit'] };
  const opts = pick[r].filter((z) => zoneDef(g, z));
  log(g, `Roadworks: ${r}.`, 'killer', { kind: 'dice', faces: [r] });
  if (!opts.length) return;
  if (opts.length === 1) return placeBarrier(g, opts[0]);
  choose(g, 'Roadworks: which exit gets the barrier?', opts.map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'mlBarrier' });
};

customs['ml.markKills'] = (g) => {
  ml(g).mark = g.mods.killedThisTurn;
};
customs['ml.allDie'] = (g) => {
  if (g.mods.killedThisTurn > ml(g).mark) return;
  log(g, 'Nobody died: +2 Bloodlust.', 'killer');
  addBloodlust(g, 2);
};

customs['ml.patio'] = (g) => {
  if (K(g).bodiless) return;
  const here = zoneDef(g, g.killer.zone);
  if (!here.house) return;
  const quarters = new Set(g.victims.filter((v) => isHouse(g, v.zone)).map((v) => zoneDef(g, v.zone).deck));
  const to = L(g).zones.filter((z) => z.house && z.id !== here.id && quarters.has(z.deck) && !burning(g, z.id));
  if (!to.length) return;
  if (to.length === 1) return placeKiller(g, to[0].id);
  choose(g, 'Through the patio: which house does the Killer turn up in?', to.map((z) => ({ id: z.id, label: z.name, zone: z.id })), { id: 'placeKiller' });
};

customs['ml.car'] = (g) => {
  const zs = [...new Set(g.victims.filter((v) => isStreet(g, v.zone) && v.role !== 'werewolf').map((v) => v.zone))];
  if (!zs.length) return skipCard(g, 'No victim is in the street');
  if (zs.length === 1) return carHits(g, zs[0]);
  choose(g, 'Hit by a car: in which street does a victim die?', zs.map((z) => ({ id: z, label: `${zoneName(g, z)} (${victimsIn(g, z).length})`, zone: z })), { id: 'mlCar' });
};
answers.mlCar = (g, z) => carHits(g, z);
function carHits(g: GameState, z: ZoneId): void {
  const v = victimsIn(g, z).sort((a, b) => +!!a.role - +!!b.role)[0];
  if (v) killVictim(g, v, false);
}

customs['ml.sneaky'] = (g) => {
  if (K(g).bodiless) return;
  if (g.killer.zone !== g.fg.zone) return;
  log(g, 'He\'s right there with you: +1 Horror.', 'bad');
  addHorror(g, 1);
};

customs['ml.hide'] = (g) => {
  for (const z of L(g).zones.filter((x) => x.house)) {
    if (z.panic.some((a) => zoneDef(g, a.to).exit)) continue;
    placeVictims(g, z.id, 1);
  }
};

// ---- Maple Lane's Events -------------------------------------------------------------------

customs['ml.everyExit'] = (g) => {
  for (const z of L(g).zones.filter((x) => x.exit)) placeVictims(g, z.id, 1);
};

customs['ml.party'] = (g) => {
  const zs = [...new Set(g.victims.filter((v) => isHouse(g, v.zone)).map((v) => v.zone))];
  if (!zs.length) return void placeVictims(g, 'crossroads', 4);
  if (zs.length === 1) return void placeVictims(g, zs[0], 4);
  choose(g, 'Neighborhood Cookout: which house gets 4 new victims?', zs.map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'mlParty' });
};
answers.mlParty = (g, z) => void placeVictims(g, z, 4);

customs['ml.rain'] = (g) => {
  const cross = victimsIn(g, 'crossroads');
  if (cross.length) panicVictims(g, cross);
  push(g, { t: 'custom', id: 'ml.rainIn', step: 0 });
};
customs['ml.rainIn'] = (g) => {
  for (const z of [...new Set(g.victims.filter((v) => isStreet(g, v.zone)).map((v) => v.zone))]) {
    const to = exits(g, z, 'victim').filter((x) => isHouse(g, x) && !burning(g, x));
    if (!to.length) continue;
    if (to.length === 1) {
      for (const v of victimsIn(g, z)) moveVictim(g, v, to[0]);
      continue;
    }
    choose(g, `It's raining: which house do the victims in ${zoneName(g, z)} run into?`, to.map((x) => ({ id: x, label: zoneName(g, x), zone: x })), { id: 'mlRain', data: { from: z } });
  }
};
answers.mlRain = (g, to, data: { from: ZoneId }) => {
  for (const v of victimsIn(g, data.from)) moveVictim(g, v, to);
};

customs['ml.july'] = (g) => {
  for (const v of g.victims.filter((x) => isHouse(g, x.zone))) {
    const to = exits(g, v.zone, 'victim').find((z) => isStreet(g, z));
    if (to) moveVictim(g, v, to);
  }
  log(g, 'Everyone steps out into the street for the fireworks.');
};

const OPPOSITE: Record<ZoneId, ZoneId> = { northExit: 'southExit', southExit: 'northExit', westExit: 'eastExit', eastExit: 'westExit' };

eventSetups['ev.policeOfficer'] = (g) => {
  const ex = L(g).zones.filter((z) => z.exit && OPPOSITE[z.id]);
  if (!ex.length) return;
  choose(g, 'Police Officer: which exit does the police car start from?', ex.map((z) => ({ id: z.id, label: z.name, zone: z.id })), { id: 'mlPolice' });
};
answers.mlPolice = (g, zone) => {
  g.tokens = g.tokens.filter((t) => t.id !== 'policeCar');
  g.tokens.push({ id: 'policeCar', zone });
  ml(g).policeTo = OPPOSITE[zone];
  log(g, `The police car is at the ${zoneName(g, zone)}, heading for the ${zoneName(g, OPPOSITE[zone])}.`, 'good');
};

/** One step along the streets toward `to`. */
function streetStep(g: GameState, from: ZoneId, to: ZoneId): ZoneId | null {
  const prev = new Map<ZoneId, ZoneId | null>([[from, null]]);
  const q = [from];
  while (q.length) {
    const z = q.shift()!;
    if (z === to) break;
    for (const n of exits(g, z, 'enemy').filter((x) => isStreet(g, x))) {
      if (!prev.has(n)) {
        prev.set(n, z);
        q.push(n);
      }
    }
  }
  if (!prev.has(to)) return null;
  let z = to;
  while (prev.get(z) !== from && prev.get(z) !== null) z = prev.get(z)!;
  return z === from ? null : z;
}

hooks.upkeep.push((g) => {
  const car = g.tokens.find((t) => t.id === 'policeCar');
  const dest = g.film.maple?.policeTo as ZoneId | null | undefined;
  if (!car || !dest) return;
  const step = streetStep(g, car.zone, dest);
  if (!step) return;
  const riders = victimsIn(g, car.zone);
  car.zone = step;
  for (const v of riders) moveVictim(g, v, step);
  const still = riders.filter((v) => g.victims.includes(v));
  log(g, `The police car drives to ${zoneName(g, step)}${still.length ? ` with ${plural(still.length, 'victim')}` : ''}.`, 'good');
  if (step !== dest) return;
  for (const v of victimsIn(g, step)) {
    g.victims = g.victims.filter((x) => x !== v);
    g.fg.saved++;
    releaseRoleQuiet(g, v);
  }
  if (still.length) log(g, `${cap(plural(still.length, 'victim'))} saved by the police.`, 'good');
  g.tokens = g.tokens.filter((t) => t !== car);
  ml(g).policeTo = null;
  const id = g.activeEvents.find((e) => e === 'policeOfficer');
  if (id) {
    g.activeEvents = g.activeEvents.filter((e) => e !== id);
    g.eventDiscard.push(id);
  }
});
function releaseRoleQuiet(g: GameState, v: Victim): void {
  if (v.role === 'mlBoyfriend' || v.role === 'smalley') {
    const ab = v.role === 'mlBoyfriend' ? 'boyfriend' : 'smalleys';
    if (v.role === 'smalley' && g.victims.some((x) => x.role === 'smalley')) return;
    g.activeEvents = g.activeEvents.filter((e) => e !== ab);
    if (!g.eventDiscard.includes(ab)) g.eventDiscard.push(ab);
  }
}

eventSetups['ev.fire'] = (g) => {
  const r = d6(g);
  const zone = r <= 3 ? 'boyfriendHouse' : 'smalleyHouse';
  g.tokens.push({ id: 'mlFire', zone });
  log(g, `Fire! (${r}) ${zoneName(g, zone)} is burning.`, 'killer', { kind: 'dice', faces: [r] });
  for (const v of victimsIn(g, zone)) killVictim(g, v, false);
  if (g.fg.zone === zone) hurtFG(g, 1);
  if (!g.outcome && g.killer.zone === zone) damageKiller(g, 1);
};
hooks.victimEnters.push((g, v, zone) => {
  if (!burning(g, zone)) return;
  log(g, `${cap(victimName2(v))} runs into the burning house and dies.`, 'killer');
  killVictim(g, v, false);
});
const victimName2 = (v: Victim): string => (v.role === 'mlBoyfriend' ? 'your boyfriend' : v.role === 'smalley' ? 'a Smalley' : 'a victim');

eventSetups['ev.mlBoyfriend'] = (g) => {
  const [v] = placeVictims(g, 'boyfriendHouse', 1);
  if (v) {
    v.role = 'mlBoyfriend';
    log(g, 'Your boyfriend is home, in the Boyfriend\'s House.', 'good');
  }
};
hooks.upkeep.push((g) => {
  if (!has(g, 'ev.mlBoyfriend')) return;
  const bf = g.victims.find((v) => v.role === 'mlBoyfriend');
  if (!bf) return;
  for (let i = 0; i < 2 && bf.zone !== g.fg.zone && g.victims.includes(bf); i++) {
    const p = shortestPaths(g, bf.zone, g.fg.zone, 'victim')[0];
    if (!p?.length) break;
    moveVictim(g, bf, p[0]);
  }
  if (!g.victims.includes(bf)) return;
  log(g, `Your boyfriend comes over to ${zoneName(g, bf.zone)}.`);
  if (bf.zone === g.fg.zone) {
    log(g, 'He\'s with you: +2 Time.', 'good');
    addTime(g, 2);
  }
});

eventSetups['ev.mlSmalleys'] = (g) => {
  const vs = placeVictims(g, 'smalleyHouse', 2);
  for (const v of vs) v.role = 'smalley';
  if (vs.length) log(g, 'The Smalleys are at home.');
};
hooks.victimKilled.push((g, v) => {
  if (v.role !== 'smalley') return;
  log(g, 'One of the Smalleys is dead: +1 Bloodlust.', 'killer');
  addBloodlust(g, 1);
});

// ---- Maple Lane's items ------------------------------------------------------------------

const streetOnly = new Set(['item.mlRifle', 'item.mlBow']);
targetZoneFilters.push((g, weaponUid, zone) => {
  const it = g.fg.items.find((i) => i.uid === weaponUid);
  if (!it || !streetOnly.has(itemDef(g, it.id).ability ?? '') || !isMaple(g)) return true;
  return isStreet(g, zone);
});

itemHandlers['item.mlRifle'] = {
  actions(g, it) {
    if ((it.uses ?? 0) <= 0 || g.fg.time < 1) return [];
    const range = itemDef(g, it.id).range ?? [1, 3];
    const d = distances(g, g.fg.zone, 'fg');
    const ok = (z: ZoneId) => (!isMaple(g) || isStreet(g, z)) && (d.get(z) ?? 99) >= range[0] && (d.get(z) ?? 99) <= range[1];
    const target = g.minions.some((m) => ok(m.zone)) || (!K(g).invulnerable && ok(g.killer.zone));
    return target ? [{ action: 'shoot', label: 'Fire the Rifle (1 Time, horror roll)' }] : [];
  },
  use(g, it) {
    addTime(g, -1);
    spendUse(g, it.uid);
    log(g, 'You take aim with the Rifle.');
    startRoll(g, { kind: 'item', id: 'mlRifle', uid: it.uid }, { id: 'mlRifle', data: { uid: it.uid } });
  },
};
rollDone.mlRifle = (g, s, data: { uid: string }) => {
  if (!s) return log(g, 'The shot misses.', 'bad');
  const still = g.fg.items.find((i) => i.uid === data.uid);
  pushFx(g, [{ k: 'damage', n: 2 }], { kind: 'item', id: 'mlRifle', damageBonus: true, ...(still ? { weapon: data.uid } : {}) });
};

itemHandlers['item.mlBow'] = {
  actions(g, it, d) {
    return itemHandlers['item.bow'].actions!(g, it, d);
  },
  use(g, it, action) {
    itemHandlers['item.bow'].use!(g, it, action);
  },
};

itemHandlers['item.pitchfork'] = {
  react: {
    label: () => 'Pitchfork: discard it to avoid the whole attack',
    can: (_g, _it, f) => f.damage > 0,
    use(g, it, f) {
      discardItem(g, it.uid);
      f.damage = 0;
      log(g, 'You fend the attack off with the pitchfork and lose it.', 'good');
    },
  },
};

// Crucifix: cancel a Horror rise, or stop an enemy next to you.
hooks.horrorUp.push((g, n) => {
  const it = usableItems(g, 'item.mlCrucifix')[0];
  if (!it || ml(g).crucifixPass) return false;
  choose(
    g,
    `+${n} Horror: discard the Crucifix to ignore it?`,
    [
      { id: 'yes', label: 'Yes: ignore the Horror' },
      { id: 'no', label: `No: +${n} Horror` },
    ],
    { id: 'mlCrucifixHorror', data: { uid: it.uid, n } },
  );
  return true;
});
answers.mlCrucifixHorror = (g, id, data: { uid: string; n: number }) => {
  if (id === 'yes') {
    discardItem(g, data.uid);
    log(g, 'You clutch the Crucifix: the Horror doesn\'t rise.', 'good');
    return;
  }
  ml(g).crucifixPass = true;
  try {
    addHorror(g, data.n);
  } finally {
    ml(g).crucifixPass = false;
  }
};
pathChecks.push((g, f, path) => {
  const it = usableItems(g, 'item.mlCrucifix')[0];
  if (!it || path.length < 2) return false;
  const near = exits(g, g.fg.zone, 'fg');
  const i = path.findIndex((z) => near.includes(z));
  if (i < 0 || i >= path.length - 1) return false;
  yesNo(g, `An enemy is coming past ${zoneName(g, path[i])}, next to you. Hold up the Crucifix to stop it there?`, 'Yes: discard the Crucifix', { id: 'mlCrucifixStop', data: { uid: it.uid, cut: i + 1 } });
  void f;
  return true;
});
answers.mlCrucifixStop = (g, id, data: { uid: string; cut: number }) => {
  if (id !== 'yes') return;
  const kf = [...g.stack].reverse().find((x): x is Extract<Frame, { t: 'killer' }> => x.t === 'killer');
  if (!kf?.path) return;
  kf.path = kf.path.slice(0, data.cut);
  discardItem(g, data.uid);
  log(g, 'The Crucifix stops it in its tracks.', 'good');
};

itemHandlers['item.megaphone'] = {
  actions: (g, it) => (!g.mods.usedThisPhase.includes(it.uid) && g.victims.length ? [{ action: 'use', label: 'Megaphone: move a victim 1 space (enemies come 1 closer)' }] : []),
  use(g, it) {
    g.mods.usedThisPhase.push(it.uid);
    const zs = [...new Set(g.victims.filter((v) => exits(g, v.zone, 'victim').length).map((v) => v.zone))];
    if (!zs.length) return log(g, 'Nobody can move.');
    choose(g, 'Megaphone: which space do you call a victim from?', zs.map((z) => ({ id: z, label: `${zoneName(g, z)} (${victimsIn(g, z).length})`, zone: z })), { id: 'mlMegaFrom' });
  },
};
answers.mlMegaFrom = (g, from) => {
  const to = exits(g, from, 'victim');
  choose(g, `Megaphone: where does the victim in ${zoneName(g, from)} go?`, to.map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'mlMegaTo', data: { from } });
};
answers.mlMegaTo = (g, to, data: { from: ZoneId }) => {
  const v = victimsIn(g, data.from).sort((a, b) => +!!a.role - +!!b.role)[0];
  if (!v) return;
  log(g, `A victim runs from ${zoneName(g, data.from)} to ${zoneName(g, to)}.`, 'info', { kind: 'victimMove', victim: v.id, path: [data.from, to] });
  moveVictim(g, v, to);
  log(g, 'The noise draws the enemies 1 space closer.', 'bad');
  pushKillerAction(g, { target: 'finalGirl', moves: 1, attacks: 0 }, { kind: 'item', id: 'megaphone' });
};

itemHandlers['item.bicycle'] = {
  gained(g) {
    const where = [g.fg.zone, ...exits(g, g.fg.zone, 'fg')].filter((z) => isStreet(g, z));
    g.tokens = g.tokens.filter((t) => t.id !== 'bicycle');
    if (!where.length) return;
    if (where.length === 1) {
      g.tokens.push({ id: 'bicycle', zone: where[0] });
      return log(g, `The bike is in ${zoneName(g, where[0])}.`);
    }
    choose(g, 'Bicycle: which street space do you leave it in?', where.map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'mlBikePlace' });
  },
  actions(g, it) {
    const bike = g.tokens.find((t) => t.id === 'bicycle');
    if (bike?.zone !== g.fg.zone || g.mods.usedThisTurn.includes(it.uid) || g.fg.legTrap) return [];
    return [{ action: 'ride', label: 'Ride the bike to another street space' }];
  },
  use(g, it) {
    g.mods.usedThisTurn.push(it.uid);
    const to = L(g).zones.filter((z) => z.street && z.id !== g.fg.zone);
    choose(g, 'Bicycle: which street space do you ride to?', to.map((z) => ({ id: z.id, label: z.name, zone: z.id })), { id: 'mlBikeRide' });
  },
};
answers.mlBikePlace = (g, z) => {
  g.tokens = g.tokens.filter((t) => t.id !== 'bicycle');
  g.tokens.push({ id: 'bicycle', zone: z });
  log(g, `You leave the bike in ${zoneName(g, z)}.`);
};
answers.mlBikeRide = (g, z) => {
  const from = g.fg.zone;
  const bike = g.tokens.find((t) => t.id === 'bicycle');
  g.fg.zone = z;
  if (bike) bike.zone = z;
  log(g, `You ride the bike to ${zoneName(g, z)}.`, 'good', { kind: 'fgMove', path: [from, z] });
  for (const fn of hooks.fgEnters) fn(g, z, from);
};

itemHandlers['item.junk'] = {
  actions(g, it) {
    if ((it.uses ?? 0) <= 0 || !isHouse(g, g.fg.zone) || g.tokens.some((t) => t.id === 'boobyTrap' && t.zone === g.fg.zone)) return [];
    return [{ action: 'trap', label: 'Rig a booby trap in this house' }];
  },
  use(g, it) {
    g.tokens.push({ id: 'boobyTrap', zone: g.fg.zone });
    log(g, `You rig a booby trap in ${zoneName(g, g.fg.zone)}.`, 'good');
    spendUse(g, it.uid);
  },
};
