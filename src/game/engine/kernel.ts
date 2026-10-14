// The engine is a stack machine. Every pending piece of work is a Frame on
// g.stack; run() keeps stepping the top frame until one needs the player
// (it sets g.prompt and returns 'wait'). respond() hands the player's input
// to that frame and runs on. The whole state is plain JSON, so a game can be
// saved and resumed at any prompt.

import { BONUS_ITEMS, finalGirlDef, killerDef, locationDef } from '../content';
import type { Effect, EventDef, FinalGirlDef, ItemDef, KillerDef, LocationDef, TerrorDef, ZoneDef, ZoneId } from '../types';
import type { Anim, Continuation, Frame, GameState, Input, Option, Snap, Src, Tone, Victim } from './state';

export type Status = 'continue' | 'wait' | 'done';

export class RuleError extends Error {}

interface FrameHandler {
  step(g: GameState, f: any): Status;
  input?(g: GameState, f: any, inp: Input): Status;
}

export const frames: Record<string, FrameHandler> = {};
/** Custom effects: { k: 'custom', id } runs customs[id]. An id may carry a ":arg" suffix. */
export const customs: Record<string, (g: GameState, data: any, src: Src) => void> = {};
/** What happens after the player picks an option in a choice frame. */
export const answers: Record<string, (g: GameState, id: string, data: any) => void> = {};

export const hooks = {
  /** A victim was placed in or moved into a space. */
  victimEnters: [] as ((g: GameState, v: Victim, zone: ZoneId) => void)[],
  /** A victim died. */
  victimKilled: [] as ((g: GameState, v: Victim, zone: ZoneId, byEnemy: boolean) => void)[],
  /** The Final Girl moved into a space (walking, running, any way). */
  fgEnters: [] as ((g: GameState, zone: ZoneId, from: ZoneId) => void)[],
  /** The Killer finished a move. */
  killerMoved: [] as ((g: GameState) => void)[],
  /** Horror is about to go up by n; return true to cancel it. */
  horrorUp: [] as ((g: GameState, n: number) => boolean)[],
  /** Horror went up. */
  afterHorrorUp: [] as ((g: GameState) => void)[],
  /** The Final Girl lost health (and is still alive). */
  fgHurt: [] as ((g: GameState, n: number) => void)[],
  /** The Killer would die; return true if something stopped it. */
  killerDying: [] as ((g: GameState) => boolean)[],
  darkPowerRevealed: [] as ((g: GameState, ability: string) => void)[],
  finaleRevealed: [] as ((g: GameState, ability: string | undefined) => void)[],
  actionPhaseStart: [] as ((g: GameState) => void)[],
  /** The Action Phase is ending (before Planning). */
  actionPhaseEnd: [] as ((g: GameState) => void)[],
  /** Upkeep steps contributed by films, run after the core ones. */
  upkeep: [] as ((g: GameState) => void)[],
  /** End of the Killer Phase, before Panic. */
  killerPhaseEnd: [] as ((g: GameState) => void)[],
  /** Start of the Killer Phase. */
  killerPhaseStart: [] as ((g: GameState) => void)[],
};

// ---- content lookups -------------------------------------------------------

export const K = (g: GameState): KillerDef => killerDef(g.config.killer);
export const L = (g: GameState): LocationDef => locationDef(g.config.location);
export const FG = (g: GameState): FinalGirlDef => finalGirlDef(g.config.finalGirl);

export function itemDef(g: GameState, id: string): ItemDef {
  const it = L(g).items.find((i) => i.id === id) ?? K(g).items?.find((i) => i.id === id) ?? BONUS_ITEMS.find((i) => i.id === id);
  if (!it) throw new Error(`Unknown item ${id}`);
  return it;
}

export function terrorDef(g: GameState, id: string): TerrorDef {
  const c = K(g).terror.find((t) => t.id === id) ?? L(g).terror.find((t) => t.id === id);
  if (!c) throw new Error(`Unknown terror card ${id}`);
  return c;
}

export function eventDef(g: GameState, id: string): EventDef {
  const e = L(g).events.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown event ${id}`);
  return e;
}

export function zoneDef(g: GameState, id: ZoneId): ZoneDef {
  const z = L(g).zones.find((x) => x.id === id);
  if (!z) throw new Error(`Unknown space ${id}`);
  return z;
}

export const zoneName = (g: GameState, id: ZoneId): string =>
  L(g).zones.find((z) => z.id === id)?.name ?? L(g).deckNames?.[id] ?? id;

/** An item's name with "the" in front, unless it's someone (Carolyn) or someone's (Laurie's Bow). */
export function theItem(g: GameState, id: string): string {
  const name = itemDef(g, id).name;
  return /'s |^(Carolyn|Mr\. Floppy|Zappo)/.test(name) ? name : `the ${name}`;
}

export const killerName = (g: GameState): string => K(g).name;
export const fgName = (g: GameState): string => FG(g).name;

// ---- randomness ------------------------------------------------------------

/** mulberry32 */
export function rand(g: GameState): number {
  let t = (g.rng.s = (g.rng.s + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const d6 = (g: GameState): number => Math.floor(rand(g) * 6) + 1;
export function shuffle<T>(g: GameState, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand(g) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const pick = <T>(g: GameState, arr: T[]): T => arr[Math.floor(rand(g) * arr.length)];

// ---- log -------------------------------------------------------------------

export function log(g: GameState, text: string, tone: Tone = 'info', anim?: Anim): void {
  const n = (g.log[g.log.length - 1]?.n ?? 0) + 1;
  g.log.push({ n, turn: g.turn, phase: g.phase, text, tone, ...(anim ? { anim } : {}), snap: takeSnap(g) });
  if (g.log.length > 400) g.log.splice(0, g.log.length - 400);
}

/** The board right now, for playback. */
export function takeSnap(g: GameState): Snap {
  return {
    fz: g.fg?.zone ?? '',
    kz: g.killer?.zone ?? '',
    fhp: g.fg?.health.hp ?? 0,
    ftok: g.fg?.health.token ?? 'black',
    ft: g.fg?.time ?? 0,
    fh: g.fg?.horror ?? 0,
    khp: g.killer?.health.hp ?? 0,
    ktok: g.killer?.health.token ?? 'black',
    bl: g.killer?.bloodlust ?? 0,
    td: g.terrorDeck?.length ?? 0,
    saved: g.fg?.saved ?? 0,
    dead: g.dead?.length ?? 0,
    vic: (g.victims ?? []).map((v) => (v.role ? [v.id, v.zone, v.role] : [v.id, v.zone])),
    min: (g.minions ?? []).map((m) => [m.id, m.zone, m.hp]),
  };
}

export const uid = (g: GameState, prefix: string): string => `${prefix}${g.uid++}`;

// ---- stack -----------------------------------------------------------------

/** Push frames so that the first one runs first. */
export function push(g: GameState, ...fs: Frame[]): void {
  for (let i = fs.length - 1; i >= 0; i--) g.stack.push(fs[i]);
}

export function pushFx(g: GameState, list: Effect[], src: Src): void {
  if (list.length) push(g, { t: 'fx', list, i: 0, src });
}

export function choose(g: GameState, title: string, options: Option[], then: Continuation, detail?: string): void {
  push(g, { t: 'choice', title, options, then, ...(detail ? { detail } : {}) });
}

export function yesNo(g: GameState, title: string, yes: string, then: Continuation, no = 'No'): void {
  choose(g, title, [{ id: 'yes', label: yes }, { id: 'no', label: no }], then);
}

/** Queue a custom effect to run as its own step. */
export function later(g: GameState, id: string, data?: unknown): void {
  push(g, { t: 'custom', id, data, step: 0 });
}

export function topOf<T extends Frame['t']>(g: GameState, t: T): Extract<Frame, { t: T }> | undefined {
  for (let i = g.stack.length - 1; i >= 0; i--) if (g.stack[i].t === t) return g.stack[i] as Extract<Frame, { t: T }>;
  return undefined;
}

export function gotoPhase(g: GameState, next: GameState['phase'], why?: string): void {
  if (why) log(g, why, 'phase');
  g.stack = [{ t: 'phase', phase: next, step: 0 }];
  g.prompt = null;
}

export function endGame(g: GameState, winner: 'finalGirl' | 'killer', text: string): void {
  if (g.outcome) return;
  g.outcome = { winner, text };
  log(g, text, 'phase');
  g.stack = [];
  g.prompt = null;
}

function stepFrame(g: GameState, f: Frame): Status {
  const h = frames[f.t];
  if (!h) throw new Error(`No handler for frame ${f.t}`);
  return h.step(g, f);
}

function finish(g: GameState, f: Frame): void {
  const i = g.stack.lastIndexOf(f);
  if (i >= 0) g.stack.splice(i, 1);
}

export function run(g: GameState): void {
  let guard = 0;
  g.prompt = null;
  while (!g.outcome && g.stack.length) {
    if (++guard > 20000) throw new Error(`Engine loop: ${JSON.stringify(g.stack.slice(-3))} | ${g.log.slice(-6).map((l) => l.text).join(' / ')}`);
    const f = g.stack[g.stack.length - 1];
    const st = stepFrame(g, f);
    if (st === 'wait') return;
    if (st === 'done') finish(g, f);
  }
}

export function respond(g: GameState, inp: Input): void {
  if (g.outcome) throw new RuleError('The game is over');
  const f = g.stack[g.stack.length - 1];
  if (!f || !g.prompt) throw new RuleError('Nothing to answer');
  const h = frames[f.t];
  if (!h?.input) throw new RuleError(`Can't answer ${f.t}`);
  const st = h.input(g, f, inp);
  g.prompt = null;
  if (st === 'done') finish(g, f);
  run(g);
}

// ---- choice frame ----------------------------------------------------------

frames.choice = {
  step(g, f: Extract<Frame, { t: 'choice' }>) {
    if (!f.options.length) return 'done';
    g.prompt = { type: 'choice', title: f.title, options: f.options, ...(f.detail ? { detail: f.detail } : {}) };
    return 'wait';
  },
  input(g, f: Extract<Frame, { t: 'choice' }>, inp) {
    if (inp.t !== 'choose' || !f.options.some((o) => o.id === inp.id)) throw new RuleError('Pick one of the options');
    finish(g, f);
    const a = answers[f.then.id];
    if (!a) throw new Error(`No answer handler ${f.then.id}`);
    a(g, inp.id, f.then.data);
    return 'continue';
  },
};

frames.custom = {
  step(g, f: Extract<Frame, { t: 'custom' }>) {
    if (f.step > 0) return 'done';
    f.step = 1;
    runCustom(g, f.id, f.data, { kind: 'system' });
    return 'continue';
  },
};

export function runCustom(g: GameState, id: string, data: unknown, src: Src): void {
  const c = id.indexOf(':');
  const key = c < 0 ? id : id.slice(0, c);
  const arg = c < 0 ? data : id.slice(c + 1);
  const fn = customs[key];
  if (!fn) throw new Error(`Custom effect not implemented: ${id}`);
  fn(g, arg, src);
}

// ---- abilities -------------------------------------------------------------

/** Every ability currently in play: revealed dark powers, minor dark powers, events, items, the ultimate, the finale. */
export function abilities(g: GameState): Set<string> {
  const s = new Set<string>();
  const k = K(g);
  for (const dp of g.killer.darkPowers) if (dp.revealed) s.add(k.darkPowers.find((d) => d.id === dp.id)!.ability);
  for (const m of g.killer.minors) {
    const t = k.terror.find((x) => x.id === m.id) ?? L(g).terror.find((x) => x.id === m.id);
    if (t?.minor) s.add(t.minor.ability);
  }
  for (const e of g.activeEvents) {
    const ab = eventDef(g, e).ability;
    if (ab) s.add(ab);
  }
  for (const t of g.activeTerror) {
    const ab = terrorDef(g, t).stays;
    if (ab) s.add(ab);
  }
  if (g.fg.ultimate) s.add(FG(g).ultimate.ability);
  for (const it of g.fg.items) {
    const d = itemDef(g, it.id);
    if (d.ability && usable(g, it)) s.add(d.ability);
  }
  if (g.killer.finaleRevealed) {
    const fin = k.finales.find((f) => f.id === g.killer.finale);
    if (fin?.ability) s.add(fin.ability);
  }
  return s;
}

export const has = (g: GameState, ability: string): boolean => abilities(g).has(ability);

/** An item works if it needs no hands, or is in your hands, and is yours to use. */
export function usable(g: GameState, it: { id: string; inHands: boolean }): boolean {
  const d = itemDef(g, it.id);
  if (d.onlyFor && d.onlyFor !== g.fg.id) return false;
  return d.hands === 0 || it.inHands;
}

export function usableItems(g: GameState, ability: string) {
  return g.fg.items.filter((it) => itemDef(g, it.id).ability === ability && usable(g, it));
}

export const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;
export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
