import type { GameConfig, GameState } from '../game';

const KEY = 'final-player:game:v1';
const PREFS = 'final-player:prefs:v1';

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const g = JSON.parse(raw) as GameState;
    return g.v === 1 ? g : null;
  } catch {
    return null;
  }
}

export function saveGame(g: GameState | null): void {
  try {
    if (!g) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(g));
  } catch {
    // storage full or blocked: the game still plays, it just won't resume
  }
}

export interface Prefs {
  last?: Partial<GameConfig>;
  speed: 'slow' | 'normal' | 'fast';
  seenHelp?: boolean;
  sound: boolean;
  haptics: boolean;
  awake: boolean;
  text: 'normal' | 'large';
  hand: 'right' | 'left';
  /** Show every panic arrow number on the board. */
  panicAll: boolean;
  seenSideways?: boolean;
  seenInstall?: boolean;
  /** Films played at least once. */
  played: string[];
  /** First-run tips already shown. */
  tips: string[];
}

const reducedMotion = (): boolean => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export const DEFAULT_PREFS: Prefs = { speed: 'normal', sound: true, haptics: true, awake: true, text: 'normal', hand: 'right', panicAll: false, played: [], tips: [] };

export function loadPrefs(): Prefs {
  const base = { ...DEFAULT_PREFS, speed: reducedMotion() ? 'fast' : 'normal' } as Prefs;
  try {
    return { ...base, ...(JSON.parse(localStorage.getItem(PREFS) ?? '{}') as Partial<Prefs>) };
  } catch {
    return base;
  }
}

export function savePrefs(p: Prefs): void {
  try {
    localStorage.setItem(PREFS, JSON.stringify(p));
  } catch {
    // ignore
  }
}
