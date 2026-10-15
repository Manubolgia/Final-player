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

/**
 * Advance widths of Archivo Narrow 700 at 1px (measured from the bundled
 * font). Text is measured from this table, not a canvas, so the layout is
 * the same in the browser and in tests, before or after the font loads.
 */
const NARROW: Record<string, number> = {
  A: 0.59, B: 0.59, C: 0.59, D: 0.59, E: 0.55, F: 0.5, G: 0.64, H: 0.59, I: 0.23, J: 0.46, K: 0.59, L: 0.5, M: 0.68,
  N: 0.59, O: 0.64, P: 0.55, Q: 0.64, R: 0.59, S: 0.55, T: 0.5, U: 0.59, V: 0.55, W: 0.77, X: 0.55, Y: 0.55, Z: 0.5,
  ' ': 0.23, "'": 0.19, '(': 0.27, ')': 0.27, '-': 0.27, ',': 0.23, '.': 0.23, '&': 0.59, '+': 0.48, '/': 0.23,
};

/** Width in screen px of UPPER-CASE Archivo Narrow 700 text at `size` px, with `track` em letter-spacing. */
export function textWidth(text: string, size = 11, track = 0.02): number {
  let w = 0;
  for (const ch of text) w += NARROW[ch] ?? (ch >= '0' && ch <= '9' ? 0.46 : 0.55);
  return (w + track * text.length) * size;
}

/** A closed (or open) Catmull-Rom spline through the points, as an SVG path. */
export function smoothPath(pts: Pt[], closed = true, tension = 0.5): string {
  const n = pts.length;
  if (n < 3) return pts.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join('') + (closed ? 'Z' : '');
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const k = tension / 3;
    d += `C${f(p1.x + (p2.x - p0.x) * k)} ${f(p1.y + (p2.y - p0.y) * k)} ${f(p2.x - (p3.x - p1.x) * k)} ${f(p2.y - (p3.y - p1.y) * k)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d + (closed ? 'Z' : '');
}

/** A polygon as an SVG path. */
export const polyPath = (pts: Pt[], closed = true): string => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join('') + (closed ? 'Z' : '');

const f = (n: number) => (Math.round(n * 100) / 100).toString();

/** Is the point inside the polygon? */
export function inPoly(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Where segments ab and cd cross, if they do. */
export function segCross(a: Pt, b: Pt, c: Pt, d: Pt): { p: Pt; t: number } | null {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;
  const v = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
  if (t < 0 || t > 1 || v < 0 || v > 1) return null;
  return { p: { x: a.x + r.x * t, y: a.y + r.y * t }, t };
}
