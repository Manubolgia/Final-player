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
}

export function loadPrefs(): Prefs {
  try {
    return { speed: 'normal', ...(JSON.parse(localStorage.getItem(PREFS) ?? '{}') as Partial<Prefs>) };
  } catch {
    return { speed: 'normal' };
  }
}

export function savePrefs(p: Prefs): void {
  try {
    localStorage.setItem(PREFS, JSON.stringify(p));
  } catch {
    // ignore
  }
}
