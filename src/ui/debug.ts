// A hook for screenshots and end-to-end tests: with ?debug in the URL (or in
// dev), window.__fp can start seeded games and jump the real UI to any prompt.
// Nothing here runs for players.

import { act, newGame, type GameConfig, type GameState, type Input } from '../game';
import type { Prompt } from '../game/engine/state';

export interface DebugHost {
  get(): GameState | null;
  /** Show this state; log entries after `startAt` play back as if they just happened. */
  show(g: GameState, startAt?: number): void;
  toTitle(): void;
}

export const debugOn = typeof location !== 'undefined' && (import.meta.env.DEV || /[?&]debug\b/.test(location.search));

type Pick = (g: GameState, r: () => number) => Input;

export function registerDebug(host: DebugHost): void {
  if (!debugOn) return;
  let bot: Pick | null = null;
  let r = mulberry(1);
  const load = async () => (bot ??= (await import('./debugBot')).botInput);
  const api = {
    start(cfg: Partial<GameConfig> & { seed?: number }) {
      const g = newGame({ killer: 'hans', location: 'campHappyTrails', finalGirl: 'laurie', board: 'normal', seed: 7, ...cfg } as GameConfig);
      r = mulberry(cfg.seed ?? 7);
      host.show(g, g.log[g.log.length - 1]?.n ?? 0);
      return g.turn;
    },
    /** Play random legal moves until the prompt is of this type (and `test` passes), at most `max` steps. */
    async driveTo(type: Prompt['type'], opts: { max?: number; skip?: number; test?: string } = {}) {
      const pick = await load();
      let g = host.get();
      if (!g) return false;
      let skip = opts.skip ?? 0;
      const test = opts.test ? (new Function('g', `return (${opts.test})`) as (g: GameState) => boolean) : () => true;
      for (let i = 0; i < (opts.max ?? 4000) && !g.outcome; i++) {
        if (g.prompt?.type === type && test(g)) {
          if (skip-- <= 0) break;
        }
        g = act(g, pick(g, r));
      }
      host.show(g, g.log[g.log.length - 1]?.n ?? 0);
      return g.prompt?.type === type;
    },
    /** Replay the last `n` log entries (killer phase playback, card reveals). */
    replay(n: number) {
      const g = host.get();
      if (!g) return;
      const at = g.log[Math.max(0, g.log.length - 1 - n)]?.n ?? 0;
      host.show(structuredClone(g), at);
    },
    act(inp: Input) {
      const g = host.get();
      if (g) host.show(act(g, inp), g.log[g.log.length - 1]?.n ?? 0);
    },
    finish(winner: 'finalGirl' | 'killer') {
      const g = host.get();
      if (!g) return;
      const n = structuredClone(g);
      n.outcome = { winner, text: winner === 'finalGirl' ? `${n.config.killer === 'birds' ? 'You saved every survivor.' : 'The Killer is dead.'} You survive the night!` : 'You are dead. The Killer wins.' };
      n.prompt = null;
      n.stack = [];
      host.show(n, n.log[n.log.length - 1]?.n ?? 0);
    },
    state: () => host.get(),
    patch(fn: string) {
      const g = host.get();
      if (!g) return;
      const n = structuredClone(g);
      (new Function('g', fn) as (g: GameState) => void)(n);
      host.show(n, n.log[n.log.length - 1]?.n ?? 0);
    },
    title: () => host.toTitle(),
  };
  (window as unknown as { __fp: typeof api }).__fp = api;
}

function mulberry(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
