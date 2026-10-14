// Terror from Above: no Killer, just birds. They never move, pile up to 3 to
// a space and attack whatever is under them. Save the hidden survivors before
// the flock covers every space.

import { onSave, onUltimate } from '../engine/actionPhase';
import { adjacent, distances, killVictim, panicVictims, victimsIn } from '../engine/board';
import { damageMinions } from '../engine/combat';
import { answers, choose, customs, d6, endGame, eventDef, has, hooks, K, L, log, plural, push, shuffle, uid, zoneName } from '../engine/kernel';
import { turnEnd } from '../engine/phases';
import { killerActionOverrides, minionDestroyed, placeKillerOverrides, rescueFilters, ultimates } from '../engine/registry';
import { setupHooks } from '../engine/setup';
import type { GameState } from '../engine/state';
import { addBloodlust, addHorror, damageKiller, hurtFG, killerVulnerable } from '../engine/stats';
import type { Effect, ZoneId } from '../types';

interface BirdsState {
  hidden: number;
  total: number;
  saved: number;
  lastSpawned: number;
  lastAttacks: number;
  wall: number;
}

const MAX = 3;
const isBirds = (g: GameState): boolean => !!K(g).bodiless;
const bs = (g: GameState): BirdsState => g.film.birds as BirdsState;
const spaces = (g: GameState) => L(g).zones.filter((z) => !z.hidden);
export const birdsIn = (g: GameState, z: ZoneId): number => g.minions.filter((m) => m.zone === z).length;
const birds = (n: number): string => plural(n, 'bird');
const label = (g: GameState, z: ZoneId): string => `${zoneName(g, z)} (${birdsIn(g, z)}/${MAX})`;

/** Location cards that need a Killer on the board are left out. */
function usableTerror(effects: Effect[]): boolean {
  return !effects.some((e) => (e.k === 'panic' && e.who === 'killerSpace') || e.k === 'victimsStep');
}
const ROLE_EVENTS = ['ev.deathWish', 'ev.sister', 'ev.fiance', 'ev.werewolf'];

setupHooks.push((g) => {
  if (!isBirds(g)) return;
  g.film.birds = { hidden: 2, total: 2, saved: 0, lastSpawned: 0, lastAttacks: 0, wall: 0 } satisfies BirdsState;
  const loc = L(g);
  const k = K(g);
  g.terrorDeck = shuffle(
    g,
    [...k.terror, ...loc.terror.filter((c) => usableTerror(c.effects))].flatMap((c) => Array(c.copies).fill(c.id) as string[]),
  ).slice(0, 10);
  g.eventDeck = g.eventDeck.filter((id) => {
    const e = eventDef(g, id);
    return !e.special && !ROLE_EVENTS.includes(e.ability ?? '');
  });
  const busy = new Set([g.fg.zone, ...g.victims.map((v) => v.zone)]);
  addBirds(g, g.killer.startZone, MAX);
  for (const z of spaces(g)) if (!busy.has(z.id) && !birdsIn(g, z.id)) addBirds(g, z.id, 1);
  log(g, `Terror from Above: save the ${bs(g).total} hidden survivors, and don't let 3 birds settle on every space.`, 'phase');
});

function addBirds(g: GameState, z: ZoneId, n: number): void {
  for (let i = 0; i < n; i++) g.minions.push({ id: uid(g, 'tmp-b'), zone: z, hp: 1 });
}

function checkCovered(g: GameState): void {
  if (!g.outcome && spaces(g).every((z) => birdsIn(g, z.id) >= MAX)) endGame(g, 'killer', 'There are 3 birds on every space: the flock has taken everything.');
}

/** Put n birds in a space; the ones that don't fit go to the nearest spaces with room. */
function placeBirds(g: GameState, z: ZoneId, n: number): void {
  if (n <= 0 || g.outcome) return;
  const fit = Math.min(n, MAX - birdsIn(g, z));
  if (fit > 0) {
    addBirds(g, z, fit);
    log(g, `${birds(fit)} in ${label(g, z)}.`, 'killer', { kind: 'killerMove', path: [z] });
    checkCovered(g);
  }
  const left = n - fit;
  if (left <= 0 || g.outcome) return;
  const seen = new Set([z]);
  let ring = [z];
  while (ring.length) {
    const next: ZoneId[] = [];
    for (const r of ring) for (const a of adjacent(g, r)) if (!seen.has(a)) {
      seen.add(a);
      next.push(a);
    }
    const room = next.filter((x) => birdsIn(g, x) < MAX);
    if (room.length === 1) return placeBirds(g, room[0], left);
    if (room.length > 1) {
      choose(g, `${cap(birds(left))} don't fit in ${zoneName(g, z)}: which nearby space do they go to?`, room.map((x) => ({ id: x, label: label(g, x), zone: x })), { id: 'tbPlaceAt', data: { n: left } });
      return;
    }
    ring = next;
  }
}
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
answers.tbPlaceAt = (g, z, data: { n: number }) => placeBirds(g, z, data.n);

/** The space of `zones` closest to you (you pick on a tie). */
function nearest(g: GameState, zones: ZoneId[], n: number, what: string): void {
  if (!zones.length) return placeBirds(g, g.fg.zone, n);
  const d = distances(g, g.fg.zone, 'fg');
  const best = Math.min(...zones.map((z) => d.get(z) ?? 99));
  const tied = zones.filter((z) => (d.get(z) ?? 99) === best);
  if (tied.length === 1) return placeBirds(g, tied[0], n);
  choose(g, `Tie: which of the closest ${what} gets ${birds(n)}?`, tied.map((z) => ({ id: z, label: label(g, z), zone: z })), { id: 'tbPlaceAt', data: { n } });
}

function distribute(g: GameState, left: number): void {
  if (left <= 0 || g.outcome) return;
  const room = spaces(g).filter((z) => birdsIn(g, z.id) < MAX);
  if (!room.length) return;
  if (room.length === 1) return placeBirds(g, room[0].id, left);
  choose(g, `Spread out: where does the next bird go? (${left} left)`, room.map((z) => ({ id: z.id, label: label(g, z.id), zone: z.id })), { id: 'tbDistribute', data: { left } });
}
answers.tbDistribute = (g, z, data: { left: number }) => {
  placeBirds(g, z, 1);
  distribute(g, data.left - 1);
};

const WHERE: Record<number, string> = {
  1: 'spread out anywhere',
  2: 'all in any one space',
  3: 'the search space closest to you',
  4: 'the exit closest to you',
  5: "the closest victim's space",
  6: 'your space',
};

function placeBy(g: GameState, n: number, face: number): void {
  const all = spaces(g);
  switch (face) {
    case 1:
      return distribute(g, n);
    case 2:
      choose(g, `Where do ${birds(n)} land?`, all.map((z) => ({ id: z.id, label: label(g, z.id), zone: z.id })), { id: 'tbPlaceAt', data: { n } });
      return;
    case 3:
      return nearest(g, all.filter((z) => z.search).map((z) => z.id), n, 'search spaces');
    case 4:
      return nearest(g, all.filter((z) => z.exit).map((z) => z.id), n, 'exits');
    case 5:
      return nearest(g, [...new Set(g.victims.map((v) => v.zone))], n, 'victim spaces');
    default:
      return placeBirds(g, g.fg.zone, n);
  }
}

function spawnWith(g: GameState, n: number, face: number): void {
  bs(g).lastSpawned = n;
  log(g, `Birds spawn: ${birds(n)}, ${WHERE[face]}.`, 'killer');
  placeBy(g, n, face);
}

function spawn(g: GameState): void {
  if (g.outcome) return;
  if (has(g, 'fin.birdAttack')) return rollOne(g, 'attack');
  const a = d6(g);
  const b = d6(g);
  log(g, `Spawning birds: ${a} and ${b}.`, 'killer', { kind: 'dice', faces: [a, b] });
  if (a === b || has(g, 'fin.pests')) return spawnWith(g, Math.max(a, b), Math.min(a, b));
  choose(
    g,
    `Spawning birds (${a} and ${b}): one die is how many, the other where. Which is how many?`,
    [
      { id: 'a', label: `${birds(a)}, ${WHERE[b]}` },
      { id: 'b', label: `${birds(b)}, ${WHERE[a]}` },
    ],
    { id: 'tbPickDie', data: { a, b } },
  );
}
answers.tbPickDie = (g, id, data: { a: number; b: number }) => (id === 'a' ? spawnWith(g, data.a, data.b) : spawnWith(g, data.b, data.a));

/** A single-die spawn (Bird Attack, They're Trying to Get In). Paula rolls two and picks. */
function rollOne(g: GameState, kind: 'attack' | 'search'): void {
  const a = d6(g);
  if (!has(g, 'ult.paula')) {
    log(g, `You roll ${a}.`, 'killer', { kind: 'dice', faces: [a] });
    return single(g, kind, a);
  }
  const b = d6(g);
  log(g, `Paula rolls 2 dice instead of 1: ${a} and ${b}.`, 'killer', { kind: 'dice', faces: [a, b] });
  if (a === b) return single(g, kind, a);
  choose(g, `Paula: ${a} or ${b}?`, [{ id: String(a), label: `The ${a}` }, { id: String(b), label: `The ${b}` }], { id: 'tbPaula', data: { kind } });
}
answers.tbPaula = (g, id, data: { kind: 'attack' | 'search' }) => single(g, data.kind, Number(id));
function single(g: GameState, kind: 'attack' | 'search', n: number): void {
  bs(g).lastSpawned = n;
  if (kind === 'attack') {
    log(g, `Bird Attack: ${birds(n)} in your space.`, 'killer');
    return placeBirds(g, g.fg.zone, n);
  }
  log(g, `They're trying to get in: ${birds(n)} at the closest search space.`, 'killer');
  nearest(g, spaces(g).filter((z) => z.search).map((z) => z.id), n, 'search spaces');
}

// ---- attacks ------------------------------------------------------------------------

function attackIn(g: GameState, zones: ZoneId[]): void {
  bs(g).lastAttacks = 0;
  const list = [...new Set(zones)].filter((z) => birdsIn(g, z) > 0).sort((a, b) => +(b === g.fg.zone) - +(a === g.fg.zone));
  push(g, ...list.map((z) => ({ t: 'custom' as const, id: `tb.hit:${z}`, step: 0 })));
}

customs['tb.hit'] = (g, z: ZoneId) => {
  const n = birdsIn(g, z);
  if (!n || g.outcome) return;
  const vs = victimsIn(g, z).filter((v) => v.role !== 'survivor' && v.role !== 'werewolf').sort((a, b) => +!!a.role - +!!b.role);
  if (vs.length) {
    bs(g).lastAttacks++;
    log(g, `${cap(birds(n))} attack a victim in ${zoneName(g, z)}.`, 'killer');
    return killVictim(g, vs[0], true);
  }
  if (g.fg.zone === z) {
    bs(g).lastAttacks++;
    const first = g.minions.find((m) => m.zone === z)!;
    push(g, { t: 'attackFG', damage: n, by: `m:${first.id}` });
  }
};

customs['tb.attack'] = (g) => attackIn(g, [g.fg.zone, ...spaces(g).filter((z) => birdsIn(g, z.id) >= MAX).map((z) => z.id)]);
customs['tb.attackOutnumber'] = (g) => attackIn(g, [g.fg.zone, ...spaces(g).filter((z) => birdsIn(g, z.id) > victimsIn(g, z.id).length).map((z) => z.id)]);
customs['tb.spawn'] = (g) => spawn(g);
customs['tb.spawnSearch'] = (g) => rollOne(g, 'search');
customs['tb.spawnIfFew'] = (g) => {
  if (bs(g).lastSpawned > 3) return;
  log(g, `Only ${birds(bs(g).lastSpawned)} came: more are on their way.`, 'killer');
  spawn(g);
};
customs['tb.spawnIfSpecial'] = (g) => {
  if (!g.victims.some((v) => v.role === 'survivor')) return;
  log(g, 'A special victim is in play: the birds spawn.', 'killer');
  spawn(g);
};
customs['tb.ifNoAttacks'] = (g) => {
  if (bs(g).lastAttacks > 0) return;
  log(g, 'Nothing was attacked: the birds spawn and +1 Bloodlust.', 'killer');
  push(g, { t: 'custom', id: 'tb.spawn', step: 0 }, { t: 'custom', id: 'tb.bloodlust', step: 0 });
};
customs['tb.bloodlust'] = (g) => addBloodlust(g, 1);
customs['tb.max'] = (g) => {
  if (g.killer.finaleRevealed) {
    log(g, 'Bloodlust is maxed out with the Finale in play: you lose 1 health.', 'killer');
    return hurtFG(g, 1);
  }
  const id = g.terrorDeck.shift();
  if (id) {
    g.terrorDiscard.push(id);
    log(g, 'Bloodlust is maxed out: the next Terror card is discarded.', 'good');
  }
};

// Killer actions on location cards: each move spawns birds, each attack makes them attack.
killerActionOverrides.push((g, a) => {
  if (!isBirds(g)) return false;
  const sp = Array.from({ length: a.moves }, () => ({ t: 'custom' as const, id: 'tb.spawn', step: 0 }));
  const at = Array.from({ length: a.attacks }, () => ({ t: 'custom' as const, id: 'tb.attack', step: 0 }));
  push(g, ...(a.attackFirst ? [...at, ...sp] : [...sp, ...at]));
  return true;
});
placeKillerOverrides.push((g, zone) => {
  if (!isBirds(g)) return false;
  log(g, `Where the Killer would appear, 3 birds land: ${zoneName(g, zone)}.`, 'killer');
  placeBirds(g, zone, MAX);
  return true;
});

// ---- the hidden survivors --------------------------------------------------------------

function emerge(g: GameState): void {
  if (!isBirds(g) || g.outcome) return;
  const s = bs(g);
  if (s.hidden <= 0) return;
  if (!g.fg.ultimate && g.victims.some((v) => v.role !== 'survivor')) return;
  const n = s.hidden;
  s.hidden = 0;
  log(g, g.fg.ultimate ? 'Your ultimate is unlocked: the survivors come out of hiding!' : 'No ordinary victims are left: the survivors come out of hiding!', 'phase');
  comeOut(g, n, []);
}
function comeOut(g: GameState, left: number, used: ZoneId[]): void {
  if (left <= 0) return;
  const search = spaces(g).filter((z) => z.search).map((z) => z.id);
  let pool = search.filter((z) => !used.includes(z));
  if (!pool.length) pool = search.length ? search : [g.fg.zone];
  const d = distances(g, g.fg.zone, 'fg');
  const far = Math.max(...pool.map((z) => d.get(z) ?? 0));
  const tied = pool.filter((z) => (d.get(z) ?? 0) === far);
  if (tied.length === 1) return surface(g, tied[0], left, used);
  choose(g, 'Tie: at which of the farthest search spaces does a survivor appear?', tied.map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'tbSurvivor', data: { left, used } });
}
answers.tbSurvivor = (g, z, data: { left: number; used: ZoneId[] }) => surface(g, z, data.left, data.used);
function surface(g: GameState, z: ZoneId, left: number, used: ZoneId[]): void {
  g.victims.push({ id: uid(g, 'v'), zone: z, role: 'survivor' });
  log(g, `A survivor comes out in ${zoneName(g, z)}.`, 'phase');
  comeOut(g, left - 1, [...used, z]);
}
customs['tb.emerge'] = (g) => emerge(g);
const checkLater = (g: GameState) => {
  if (isBirds(g) && bs(g).hidden > 0) push(g, { t: 'custom', id: 'tb.emerge', step: 0 });
};
hooks.victimKilled.push((g) => checkLater(g));
hooks.actionPhaseStart.push((g) => checkLater(g));
turnEnd.push((g) => checkLater(g));
onUltimate.push((g) => checkLater(g));
onSave.push((g, v) => {
  if (!isBirds(g)) return;
  if (v.role === 'survivor') {
    const s = bs(g);
    s.saved++;
    log(g, `Survivors saved: ${s.saved} of ${s.total}.`, 'good');
    if (s.saved >= s.total) endGame(g, 'finalGirl', 'You saved every survivor. The birds can have the rest.');
    return;
  }
  checkLater(g);
});

// ---- Wall of Birds, finales and dark powers -------------------------------------------

rescueFilters.push((g, _v, zone) => !(isBirds(g) && has(g, 'tb.wall') && birdsIn(g, zone) > 0));
minionDestroyed.push((g) => {
  if (!isBirds(g) || !has(g, 'tb.wall')) return;
  const s = bs(g);
  s.wall++;
  if (s.wall < 5) return;
  s.wall = 0;
  g.activeTerror = g.activeTerror.filter((t) => t !== 'wall');
  log(g, 'Wall of Birds has 5 tokens: it leaves the game.', 'good');
});

hooks.fgEnters.push((g, zone) => {
  if (!isBirds(g) || !has(g, 'fin.endlessSwarm') || birdsIn(g, zone) < MAX) return;
  log(g, 'Endless Swarm: you run into 3 birds and lose 1 health.', 'killer');
  hurtFG(g, 1);
});

hooks.upkeep.push((g) => {
  if (!isBirds(g) || g.outcome) return;
  const here = birdsIn(g, g.fg.zone);
  if (has(g, 'dp.birdsWaiting') && here >= MAX) {
    log(g, "They're Waiting to Attack: 3 birds in your space, +2 Horror.", 'killer');
    addHorror(g, 2);
  }
  if (has(g, 'dp.birdnado') && !g.outcome) {
    const n = here + adjacent(g, g.fg.zone).reduce((s, z) => s + birdsIn(g, z), 0);
    if (n >= 10) {
      log(g, `Birdnado: ${birds(n)} around you. You lose 3 health.`, 'killer');
      hurtFG(g, 3);
    }
  }
  if (has(g, 'dp.runForLife') && !g.outcome && g.victims.length) {
    const d = distances(g, g.fg.zone, 'fg');
    const far = Math.max(...g.victims.map((v) => d.get(v.zone) ?? 0));
    const zs = [...new Set(g.victims.filter((v) => (d.get(v.zone) ?? 0) === far).map((v) => v.zone))];
    if (zs.length === 1) return runForLife(g, zs[0]);
    choose(g, 'Run for Your Life: which of the farthest victims panics?', zs.map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'tbRun' });
  }
});
answers.tbRun = (g, z) => runForLife(g, z);
function runForLife(g: GameState, z: ZoneId): void {
  const v = victimsIn(g, z).sort((a, b) => +(a.role === 'survivor') - +(b.role === 'survivor'))[0];
  if (!v) return;
  log(g, 'Run for Your Life: the farthest victim panics.', 'killer');
  panicVictims(g, [v], 1, { deathZones: spaces(g).filter((s) => birdsIn(g, s.id) >= 2).map((s) => s.id) });
}

// ---- Melanie --------------------------------------------------------------------------

const killerHere = (g: GameState): boolean => !K(g).bodiless && !K(g).invulnerable && g.killer.zone === g.fg.zone && killerVulnerable(g);
ultimates['ult.melanie'] = {
  label(g) {
    if (g.mods.usedThisPhase.includes('ult.melanie') || g.fg.health.hp <= 1) return null;
    if (!g.minions.some((m) => m.zone === g.fg.zone) && !killerHere(g)) return null;
    return 'Melanie: lose 1 health, deal 2 damage here';
  },
  use(g) {
    g.mods.usedThisPhase.push('ult.melanie');
    log(g, "Melanie's Ultimate: she takes a hit to dish out 2 damage.", 'good');
    hurtFG(g, 1);
    if (!g.outcome) melanieHit(g, 2);
  },
};
function melanieHit(g: GameState, left: number): void {
  if (left <= 0 || g.outcome) return;
  const m = g.minions.some((x) => x.zone === g.fg.zone);
  const k = killerHere(g);
  if (m && k) {
    choose(
      g,
      `Melanie: where does the next point of damage go? (${left} left)`,
      [
        { id: 'killer', label: K(g).name },
        { id: 'minions', label: `The ${K(g).minion?.plural ?? 'minions'} here` },
      ],
      { id: 'melanieHit', data: { left } },
    );
    return;
  }
  if (k) return damageKiller(g, left);
  if (m) damageMinions(g, g.fg.zone, left);
}
answers.melanieHit = (g, id, data: { left: number }) => {
  if (id === 'killer') damageKiller(g, 1);
  else damageMinions(g, g.fg.zone, 1);
  melanieHit(g, data.left - 1);
};
