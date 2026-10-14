// The map: who can go where, distances, and everything that happens to victims.

import type { ZoneId } from '../types';
import { choose, d6, has, hooks, K, L, log, push, uid, zoneDef, zoneName, cap, plural } from './kernel';
import type { GameState, Victim } from './state';
import { addBloodlust } from './stats';

export type Mover = 'enemy' | 'fg' | 'victim';

const hasToken = (g: GameState, id: string, zone?: ZoneId) => g.tokens.some((t) => t.id === id && (zone === undefined || t.zone === zone));

/** Spaces a mover can step into from `zone`. */
export function exits(g: GameState, zone: ZoneId, mover: Mover): ZoneId[] {
  const loc = L(g);
  const z = zoneDef(g, zone);
  let out = z.panic.map((a) => a.to);
  // Creech Manor: a rope ladder makes a one-way drop two-way.
  for (const ow of loc.oneWay ?? []) {
    if (ow.to === zone && hasToken(g, 'ropeLadder', ow.at) && !out.includes(ow.from)) out.push(ow.from);
  }
  if (hasToken(g, 'helicopter') && !g.film.creech?.heliUsed && mover === 'fg') {
    if (zone === 'attic') out.push('helicopter');
    if (zone === 'helicopter') out.push('attic');
  }
  if (hasToken(g, 'brokenLadder')) out = out.filter((to) => !isLadder(g, zone, to));
  const lock = g.film.creech?.lock as [ZoneId, ZoneId] | undefined;
  if (lock && mover !== 'fg') out = out.filter((to) => !((lock[0] === zone && lock[1] === to) || (lock[1] === zone && lock[0] === to)));
  if (mover === 'victim') out = out.filter((to) => victimCanCross(g, zone, to));
  if (mover === 'fg' && g.tunnel.includes(zone)) for (const t of g.tunnel) if (t !== zone && !out.includes(t)) out.push(t);
  return out.filter((to) => !zoneDef(g, to).hidden || to === 'helicopter');
}

function isLadder(g: GameState, a: ZoneId, b: ZoneId): boolean {
  const lad = L(g).ladder;
  return !!lad && ((lad[0] === a && lad[1] === b) || (lad[1] === a && lad[0] === b));
}

/** Can a victim cross from a to b on its own? */
export function victimCanCross(g: GameState, a: ZoneId, b: ZoneId): boolean {
  if (closedSpace(g) === b) return false;
  const lock = g.film.creech?.lock as [ZoneId, ZoneId] | undefined;
  if (lock && ((lock[0] === a && lock[1] === b) || (lock[1] === a && lock[0] === b))) return false;
  return !g.blocked.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export const closedSpace = (g: GameState): ZoneId | undefined => g.tokens.find((t) => t.id === 'closed')?.zone;

/** Spaces connected to `zone` in either direction. */
export function adjacent(g: GameState, zone: ZoneId): ZoneId[] {
  const s = new Set(exits(g, zone, 'enemy'));
  for (const z of L(g).zones) if (z.id !== zone && !z.hidden && exits(g, z.id, 'enemy').includes(zone)) s.add(z.id);
  return [...s];
}

export function distances(g: GameState, from: ZoneId, mover: Mover = 'enemy'): Map<ZoneId, number> {
  const d = new Map<ZoneId, number>([[from, 0]]);
  const q = [from];
  while (q.length) {
    const z = q.shift()!;
    for (const n of exits(g, z, mover)) {
      if (!d.has(n)) {
        d.set(n, d.get(z)! + 1);
        q.push(n);
      }
    }
  }
  return d;
}

export const dist = (g: GameState, a: ZoneId, b: ZoneId, mover: Mover = 'enemy'): number => distances(g, a, mover).get(b) ?? Infinity;

/** Every shortest path from `from` to `to`, not counting the start. */
export function shortestPaths(g: GameState, from: ZoneId, to: ZoneId, mover: Mover = 'enemy'): ZoneId[][] {
  // distance to `to` along reversed edges
  const toDist = new Map<ZoneId, number>([[to, 0]]);
  const q = [to];
  while (q.length) {
    const z = q.shift()!;
    for (const y of L(g).zones) {
      if (toDist.has(y.id)) continue;
      if (exits(g, y.id, mover).includes(z)) {
        toDist.set(y.id, toDist.get(z)! + 1);
        q.push(y.id);
      }
    }
  }
  if (!toDist.has(from)) return [];
  const out: ZoneId[][] = [];
  const walk = (z: ZoneId, path: ZoneId[]) => {
    if (out.length > 64) return;
    if (z === to) {
      out.push(path);
      return;
    }
    for (const n of exits(g, z, mover)) if (toDist.get(n) === toDist.get(z)! - 1) walk(n, [...path, n]);
  };
  walk(from, []);
  return out;
}

// ---- victims ----------------------------------------------------------------

export const victimsIn = (g: GameState, zone: ZoneId): Victim[] => g.victims.filter((v) => v.zone === zone);
/** Victims that enemies can target and attack (the werewolf can't be). */
export const targetable = (g: GameState): Victim[] => g.victims.filter((v) => v.role !== 'werewolf');

const ROLE_NAMES: Record<string, string> = {
  boyfriend: 'your Boyfriend',
  girlfriend: 'your Girlfriend',
  cursed: 'the Cursed',
  superTourist: 'the Super Tourist',
  holyMan: 'the Holy Man',
  tourGuide: 'the Tour Guide',
  fiance: 'your Fiancé',
  sister: 'your little Sister',
  werewolf: 'the Werewolf',
  ghostHunter: 'a Ghost Hunter',
  mlBoyfriend: 'your Boyfriend',
  smalley: 'a Smalley',
};
export const victimName = (v: { role?: string }): string => (v.role ? ROLE_NAMES[v.role] ?? 'a special victim' : 'a victim');

export function placeVictims(g: GameState, zone: ZoneId, n: number): Victim[] {
  if (closedSpace(g) === zone) {
    log(g, `${zoneName(g, zone)} is closed: no victims are placed there.`);
    return [];
  }
  const k = Math.min(n, g.victimPool);
  if (k < n) log(g, `Only ${k} victim${k === 1 ? '' : 's'} left in the box.`);
  const made: Victim[] = [];
  for (let i = 0; i < k; i++) {
    const v: Victim = { id: uid(g, 'v'), zone };
    g.victims.push(v);
    made.push(v);
  }
  g.victimPool -= k;
  if (k) log(g, `${plural(k, 'new victim')} in ${zoneName(g, zone)}.`);
  for (const v of made) for (const fn of hooks.victimEnters) if (g.victims.includes(v)) fn(g, v, zone);
  return made;
}

export function moveVictim(g: GameState, v: Victim, zone: ZoneId): void {
  v.zone = zone;
  for (const fn of hooks.victimEnters) if (g.victims.includes(v)) fn(g, v, zone);
}

export interface KillOpts {
  /** Doesn't raise Bloodlust. */
  noBloodlust?: boolean;
  /** Second kill from Dark Lightning; doesn't chain. */
  chained?: boolean;
}

/** A victim dies. byEnemy: killed by an enemy's attack (some dark powers care). */
export function killVictim(g: GameState, v: Victim, byEnemy: boolean, opts: KillOpts = {}): void {
  if (!g.victims.includes(v)) return;
  if (v.role === 'werewolf') {
    log(g, 'The Werewolf can\'t be killed.');
    return;
  }
  const zone = v.zone;
  const others = victimsIn(g, zone).filter((x) => x !== v);
  g.victims = g.victims.filter((x) => x !== v);
  g.dead.push(v);
  g.mods.killedThisTurn++;
  if (g.phase === 'killer') g.mods.killedThisKillerPhase++;
  log(g, `${cap(victimName(v))} dies in ${zoneName(g, zone)}.`, 'killer', { kind: 'victimDie', zone });
  for (const fn of hooks.victimKilled) fn(g, v, zone, byEnemy);
  if (byEnemy && !opts.chained && has(g, 'dp.darkLightning')) push(g, { t: 'custom', id: 'gr.darkLightning', data: { zone }, step: 0 });
  if (!opts.noBloodlust) {
    addBloodlust(g, 1);
    if (byEnemy && has(g, 'dp.bloodFrenzy')) addBloodlust(g, 1);
    if (byEnemy && has(g, 'dp.feed')) healKillerBy(g, 1);
  }
  if (has(g, 'ev.starCrossed') && others.length === 1 && g.victims.includes(others[0])) {
    log(g, 'Star-Crossed Lovers: the other one dies too.', 'killer');
    killVictim(g, others[0], false);
  }
}

// avoid a cycle with stats.ts for this one helper
function healKillerBy(g: GameState, n: number): void {
  const h = g.killer.health;
  const before = h.hp;
  h.hp = Math.min(h.max, h.hp + n);
  if (h.hp > before) log(g, `${K(g).name} heals ${h.hp - before} (${h.hp}).`, 'killer');
}

export interface PanicOpts {
  /** Victims who panic into one of these spaces die. */
  deathZones?: ZoneId[];
  /** Creech Manor: jumping out of a window kills. */
  jumpDeath?: boolean;
  /** Carnival: a victim dies on this face. */
  deathFace?: number;
}

/** Each victim in the list panics `times` times. */
export function panicVictims(g: GameState, list: Victim[], times = 1, opts: PanicOpts = {}): void {
  const nearYou = list.some((v) => v.zone === g.fg.zone);
  for (let i = 0; i < times; i++) for (const v of list) if (g.victims.includes(v)) panicOne(g, v, opts);
  if (nearYou && list.length && has(g, 'ev.flashPhoto')) {
    push(g, { t: 'custom', id: 'discardRandomCards', data: { n: 1, why: 'Flash Photography' }, step: 0 });
  }
}

function panicOne(g: GameState, v: Victim, opts: PanicOpts): void {
  if (g.film.maple && has(g, 'dp.surprise') && (g.film.maple.surprise ?? 0) < 3) {
    g.film.maple.surprise = (g.film.maple.surprise ?? 0) + 1;
    log(g, `Surprise Factor: ${victimName(v)} panics and is killed.`, 'killer');
    killVictim(g, v, true);
    return;
  }
  const a = d6(g);
  if (has(g, 'ult.paula')) {
    const b = d6(g);
    if (a !== b) {
      log(g, `Paula rolls 2 dice for the panic: ${a} and ${b}.`, 'info', { kind: 'dice', faces: [a, b] });
      choose(
        g,
        `${cap(victimName(v))} panics: use which die?`,
        [
          { id: String(a), label: `The ${a}` },
          { id: String(b), label: `The ${b}` },
        ],
        { id: 'panicFace', data: { victim: v.id, opts } },
      );
      return;
    }
  }
  panicWith(g, v, a, opts);
}

export function panicWith(g: GameState, v: Victim, face: number, opts: PanicOpts): void {
  if (opts.deathFace === face) {
    log(g, `${cap(victimName(v))} panics (${face}) and doesn't make it.`, 'killer', { kind: 'dice', faces: [face] });
    killVictim(g, v, false);
    return;
  }
  const from = v.zone;
  const arrow = zoneDef(g, from).panic.find((p) => p.faces.includes(face));
  if (!arrow) {
    log(g, `${cap(victimName(v))} panics (${face}) but stays in ${zoneName(g, from)}.`, 'info', { kind: 'dice', faces: [face] });
    return;
  }
  if (!victimCanCross(g, from, arrow.to) || (hasToken(g, 'brokenLadder') && isLadder(g, from, arrow.to))) {
    log(g, `${cap(victimName(v))} panics (${face}) toward ${zoneName(g, arrow.to)} but can't get through.`, 'info', { kind: 'dice', faces: [face] });
    return;
  }
  if (opts.jumpDeath && zoneDef(g, from).window && zoneDef(g, arrow.to).outside) {
    log(g, `${cap(victimName(v))} panics (${face}) and jumps out of the window.`, 'killer', { kind: 'dice', faces: [face] });
    killVictim(g, v, false);
    return;
  }
  log(g, `${cap(victimName(v))} panics (${face}): ${zoneName(g, from)} → ${zoneName(g, arrow.to)}.`, 'info', { kind: 'victimMove', victim: v.id, path: [from, arrow.to] });
  moveVictim(g, v, arrow.to);
  if (g.victims.includes(v) && opts.deathZones?.includes(arrow.to)) {
    log(g, `${cap(victimName(v))} runs right into an enemy and dies.`, 'killer');
    killVictim(g, v, false);
  }
}

/** Victims closest to (or farthest from) a space. */
export function closestVictims(g: GameState, from: ZoneId, opts: { farthest?: boolean; exclude?: ZoneId; mover?: Mover } = {}): Victim[] {
  const d = distances(g, from, opts.mover ?? 'enemy');
  const vs = g.victims.filter((v) => v.zone !== opts.exclude && v.role !== 'werewolf');
  if (!vs.length) return [];
  const ds = vs.map((v) => d.get(v.zone) ?? Infinity);
  const best = opts.farthest ? Math.max(...ds.filter((x) => x !== Infinity)) : Math.min(...ds);
  return vs.filter((_, i) => ds[i] === best);
}

/** Spaces with minions in them, and the minions. */
export const minionsIn = (g: GameState, zone: ZoneId) => g.minions.filter((m) => m.zone === zone);
