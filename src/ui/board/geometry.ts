// Board geometry in "board units": zone x is 0–100 across, y is scaled by the
// board's aspect so distances are true. Screen sizes are divided by ppu
// (screen px per unit) so pieces keep their size whatever the board's scale.

import type { GameState } from '../../game';
import type { LocationDef, ZoneDef } from '../../game/types';

export interface Pt {
  x: number;
  y: number;
}

export const zonePoint = (z: ZoneDef, aspect: number): Pt => ({ x: z.x, y: z.y / aspect });

export const visibleZones = (g: GameState, loc: LocationDef): ZoneDef[] =>
  loc.zones.filter((z) => !z.hidden || g.tokens.some((t) => t.id === 'helicopter'));

export interface View {
  x0: number;
  y0: number;
  w: number;
  h: number;
}

export function fitView(zones: ZoneDef[], aspect: number, pad = 8): View {
  const ps = zones.map((z) => zonePoint(z, aspect));
  const xs = ps.map((p) => p.x);
  const ys = ps.map((p) => p.y);
  const x0 = Math.min(...xs) - pad;
  const y0 = Math.min(...ys) - pad;
  return { x0, y0, w: Math.max(...xs) - x0 + pad, h: Math.max(...ys) - y0 + pad + 2 };
}

export interface Edge {
  a: ZoneDef;
  b: ZoneDef;
  /** Panic faces from a to b, and from b to a. */
  ab?: number[];
  ba?: number[];
}

export function edgesOf(zones: ZoneDef[]): Edge[] {
  const byId = new Map(zones.map((z) => [z.id, z]));
  const out: Edge[] = [];
  const idx = new Map<string, Edge>();
  for (const a of zones) {
    for (const arr of a.panic) {
      const b = byId.get(arr.to);
      if (!b) continue;
      const key = [a.id, b.id].sort().join('|');
      const e = idx.get(key);
      if (e) {
        if (e.a.id === a.id) e.ab = arr.faces;
        else e.ba = arr.faces;
        continue;
      }
      const ne: Edge = { a, b, ab: arr.faces };
      idx.set(key, ne);
      out.push(ne);
    }
  }
  return out;
}

/** "1-3", "5,6", "2". */
export function faces(f: number[]): string {
  const s = [...f].sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    parts.push(j > i + 1 ? `${s[i]}-${s[j]}` : j === i + 1 ? `${s[i]},${s[j]}` : `${s[i]}`);
    i = j + 1;
  }
  return parts.join(',');
}

/** A space's disc radius in screen px. */
export function discPx(z: ZoneDef, ppu: number): number {
  const units = z.landmark || z.exit || z.search ? 4.3 : 3.4;
  return Math.max(units * ppu, z.landmark || z.exit ? 18 : 15);
}

export function isBlocked(g: GameState, a: string, b: string): boolean {
  if (g.blocked.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return true;
  const lock = g.film.creech?.lock as [string, string] | undefined;
  return !!lock && ((lock[0] === a && lock[1] === b) || (lock[1] === a && lock[0] === b));
}

/** Cheap deterministic hash → [0, 1). */
export function rand01(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
export const hashStr = (s: string): number => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100003, 7);

/** Distance from point p to segment ab. */
export function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

let measureCtx: CanvasRenderingContext2D | null = null;
/** Width of text in screen px for a CSS font shorthand. */
export function textWidth(text: string, font: string): number {
  try {
    measureCtx ??= document.createElement('canvas').getContext('2d');
    if (measureCtx) {
      measureCtx.font = font;
      return measureCtx.measureText(text).width;
    }
  } catch {
    // no canvas (tests): estimate
  }
  return text.length * 6.2;
}
