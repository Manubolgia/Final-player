import type { Effect, KillerActionDef, PanicArrow, Target } from '../types';

/** Board position from a pixel position on a W×H board. */
export function at(px: number, py: number, w: number, h: number): { x: number; y: number } {
  return { x: Math.round((px / w) * 1000) / 10, y: Math.round((py / h) * 1000) / 10 };
}

export const range = (a: number, b: number): number[] => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export const panic = (arrows: [string, number[]][]): PanicArrow[] => arrows.map(([to, faces]) => ({ to, faces }));

export const ka = (target: Target, moves: number, attacks: number, extra: Partial<KillerActionDef> = {}): Effect => ({
  k: 'killer',
  a: { target, moves, attacks, ...extra },
});

export const hor = (n: number): Effect => ({ k: 'horror', n });
export const time = (n: number): Effect => ({ k: 'time', n });
export const cu = (id: string, data?: unknown): Effect => (data === undefined ? { k: 'custom', id } : { k: 'custom', id, data });

export const draw = {
  event: { k: 'event' } as Effect,
  terror: { k: 'terror' } as Effect,
};
