// Where everything printed on the board goes, for a given location and
// scale: space discs, name plates (placed so they don't collide), panic
// tiles, and scenery. Computed once per location and size.

import type { LocationDef, ZoneDef } from '../../game/types';
import { discPx, faces, fitView, hashStr, rand01, segDist, textWidth, zonePoint, type Edge, type Pt, type View } from './geometry';

export type Box = { x: number; y: number; w: number; h: number };

export interface LabelBox {
  /** Top-left, in screen px relative to the disc centre. */
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
}

export interface ZoneLayout {
  z: ZoneDef;
  p: Pt;
  /** Disc radius in screen px. */
  r: number;
  label: LabelBox;
}

export interface PanicTile {
  from: string;
  to: string;
  text: string;
  /** Centre in board units. */
  x: number;
  y: number;
  w: number;
  /** Unit direction of travel. */
  ux: number;
  uy: number;
}

export interface Decor {
  x: number;
  y: number;
  s: number;
  k: number;
}

export interface BoardLayout {
  view: View;
  ppu: number;
  zones: Map<string, ZoneLayout>;
  edges: Edge[];
  /** Every panic tile, placed together (for "show all"). */
  tiles: PanicTile[];
  decor: Decor[];
  /** What tiles must keep clear of, in screen px. */
  ob: { discs: Box[]; labels: Box[]; stands: Box[]; bounds: Box };
}

export const LABEL_FONT = '700 11px "Archivo Narrow", "Arial Narrow", sans-serif';
const LINE = 13;

function wrap(name: string, max: number): string[] {
  const up = name.toUpperCase();
  if (textWidth(up, LABEL_FONT) <= max) return [up];
  const words = up.split(' ');
  if (words.length === 1) return [up];
  let best: string[] = [up];
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const w = Math.max(textWidth(a, LABEL_FONT), textWidth(b, LABEL_FONT));
    if (w < bestW) {
      bestW = w;
      best = [a, b];
    }
  }
  return best;
}

/** Overlap area of two boxes. */
const over = (a: Box, b: Box) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
/** How far a box sticks out of the bounds, as an area-like penalty. */
const outside = (b: Box, o: Box) => {
  const dx = Math.max(0, o.x - b.x) + Math.max(0, b.x + b.w - (o.x + o.w));
  const dy = Math.max(0, o.y - b.y) + Math.max(0, b.y + b.h - (o.y + o.h));
  return (dx * b.h + dy * b.w) * 4;
};
/** Samples of a trail that fall inside a box (trails under a plate read badly). */
const onTrail = (b: Box, segs: [Pt, Pt][]) => {
  let n = 0;
  for (const [a, c] of segs) {
    for (let k = 1; k < 12; k++) {
      const x = a.x + ((c.x - a.x) * k) / 12;
      const y = a.y + ((c.y - a.y) * k) / 12;
      if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) n++;
    }
  }
  return n;
};
const clampIn = (b: Box, o: Box): Box => ({ ...b, x: Math.min(Math.max(b.x, o.x), o.x + o.w - b.w), y: Math.min(Math.max(b.y, o.y), o.y + o.h - b.h) });

export function layoutBoard(loc: LocationDef, zones: ZoneDef[], edges: Edge[], ppu: number, aspect = loc.aspect, sideOverride: Record<string, string> = {}): BoardLayout {
  const view = fitView(zones, aspect);
  const zl = new Map<string, ZoneLayout>();
  const pts = zones.map((z) => ({ z, p: zonePoint(z, aspect), r: discPx(z, ppu) }));
  relax(pts, view, ppu);
  const at = new Map(pts.map((q) => [q.z.id, q]));
  // everything in screen px
  const discs: Box[] = pts.map(({ p, r }) => ({ x: p.x * ppu - r - 2, y: p.y * ppu - r - 2, w: r * 2 + 4, h: r * 2 + 5 }));
  // item-deck chits sit on the top-right of search spaces
  for (const { z, p, r } of pts) if (z.search) discs.push({ x: p.x * ppu + r * 0.92 - 10, y: p.y * ppu - r * 0.95 - 12, w: 20, h: 24 });
  const segs: [Pt, Pt][] = edges.map((e) => {
    const a = at.get(e.a.id)!.p;
    const b = at.get(e.b.id)!.p;
    return [
      { x: a.x * ppu, y: a.y * ppu },
      { x: b.x * ppu, y: b.y * ppu },
    ];
  });
  // where meeples stand: just above each space
  const stands: Box[] = pts.map(({ p, r }) => ({ x: p.x * ppu - r, y: p.y * ppu - r - 16, w: r * 2, h: 18 }));
  const placed: Box[] = [];
  const bounds: Box = { x: view.x0 * ppu + 2, y: view.y0 * ppu + 2, w: view.w * ppu - 4, h: view.h * ppu - 4 };
  // crowded spaces first, so they get the best spots
  const crowd = (q: (typeof pts)[number]) => pts.filter((o) => o !== q && Math.hypot(o.p.x - q.p.x, o.p.y - q.p.y) * ppu < 90).length;
  const order = [...pts].sort((a, b) => crowd(b) - crowd(a) || a.p.y - b.p.y || a.p.x - b.p.x);
  for (const q of order) {
    const { z, p, r } = q;
    const lines = wrap(z.name, 74);
    const w = Math.ceil(Math.max(...lines.map((l) => textWidth(l, LABEL_FONT)))) + 8;
    const h = lines.length * LINE + 3;
    const cands: [string, number, number][] = [
      ['S', -w / 2, r + 3],
      ['N', -w / 2, -r - 3 - h],
      ['E', r + 4, -h / 2],
      ['W', -r - 4 - w, -h / 2],
      ['SE', r * 0.55, r * 0.7 + 2],
      ['SW', -r * 0.55 - w, r * 0.7 + 2],
      ['NE', r * 0.55, -r * 0.7 - 2 - h],
      ['NW', -r * 0.55 - w, -r * 0.7 - 2 - h],
      ['S2', -w / 2, r + 14],
      ['N2', -w / 2, -r - 14 - h],
    ];
    const pref = sideOverride[z.id];
    let best: Box | null = null;
    let bestScore = Infinity;
    let bestAt: [number, number] = [cands[0][1], cands[0][2]];
    cands.forEach(([k, dx, dy], i) => {
      const box = { x: p.x * ppu + dx, y: p.y * ppu + dy, w, h };
      let score = (k === pref ? -1 : i) * 3;
      score += outside(box, bounds);
      for (const d of discs) score += over(box, d) * 3;
      for (const b of placed) score += over(box, b) * 5;
      for (const b of stands) score += over(box, b) * 1.5;
      score += onTrail(box, segs) * 18;
      if (score < bestScore) {
        bestScore = score;
        best = box;
        bestAt = [dx, dy];
      }
    });
    const box = clampIn(best!, bounds);
    bestAt = [box.x - p.x * ppu, box.y - p.y * ppu];
    placed.push(box);
    zl.set(z.id, { z, p, r, label: { x: bestAt[0], y: bestAt[1], w, h, lines } });
  }

  const ob = { discs, labels: placed, stands, bounds };
  const tiles = placeTiles({ zones: zl, ppu, ob }, panicArrows(edges));
  const tileBoxes = tiles.map((t) => ({ x: t.x * ppu - t.w / 2 - 3, y: t.y * ppu - 9, w: t.w + 6, h: 18 }));

  // scenery: deterministic points well clear of spaces and trails
  const decor: Decor[] = [];
  const seed = hashStr(loc.id);
  for (let i = 0; i < 90 && decor.length < 22; i++) {
    const x = view.x0 + rand01(seed + i * 3.1) * view.w;
    const y = view.y0 + rand01(seed + i * 7.7) * view.h;
    const pt = { x, y };
    if (pts.some((q) => Math.hypot(q.p.x - x, q.p.y - y) < 9)) continue;
    if (edges.some((e) => segDist(pt, zl.get(e.a.id)!.p, zl.get(e.b.id)!.p) < 4.5)) continue;
    if (tileBoxes.some((b) => x * ppu > b.x - 6 && x * ppu < b.x + b.w + 6 && y * ppu > b.y - 6 && y * ppu < b.y + b.h + 6)) continue;
    if ([...zl.values()].some((q) => {
      const b = { x: q.p.x * ppu + q.label.x - 4, y: q.p.y * ppu + q.label.y - 4, w: q.label.w + 8, h: q.label.h + 8 };
      return x * ppu > b.x && x * ppu < b.x + b.w && y * ppu > b.y && y * ppu < b.y + b.h;
    }))
      continue;
    decor.push({ x, y, s: 0.8 + rand01(seed + i) * 0.5, k: Math.floor(rand01(seed + i * 13) * 3) });
  }

  return { view, ppu, zones: zl, edges, tiles, decor, ob };
}

export interface Arrow {
  from: ZoneDef;
  to: ZoneDef;
  faces: number[];
}

/** Every panic arrow on the board, one per direction. */
export function panicArrows(edges: Edge[]): Arrow[] {
  const out: Arrow[] = [];
  for (const e of edges) {
    if (e.ab) out.push({ from: e.a, to: e.b, faces: e.ab });
    if (e.ba) out.push({ from: e.b, to: e.a, faces: e.ba });
  }
  return out;
}

/**
 * Panic tiles along their trails near the source space, clear of discs,
 * plates and each other. Placing only the tiles on show keeps them tidy.
 */
export function placeTiles(lay: Pick<BoardLayout, 'zones' | 'ppu' | 'ob'>, arrows: Arrow[]): PanicTile[] {
  const { zones: zl, ppu, ob } = lay;
  const out: PanicTile[] = [];
  const boxes: Box[] = [];
  for (const { from, to, faces: fs } of arrows) {
    const a = zl.get(from.id);
    const b = zl.get(to.id);
    if (!a || !b) continue;
    const dx = b.p.x - a.p.x;
    const dy = b.p.y - a.p.y;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L;
    const uy = dy / L;
    const text = faces(fs);
    const w = Math.max(22, Math.ceil(textWidth(text, LABEL_FONT)) + 10);
    const Lpx = L * ppu;
    // keep the arrow nub on the travel side clear of the disc too
    const half = Math.max(w, 16) / 2 + 6;
    let best: { x: number; y: number; s: number } | null = null;
    for (let d = a.r + half + 2; d <= Math.max(a.r + half + 2, Lpx - b.r - half - 2); d += 5) {
      for (const side of [1, -1, 0]) {
        for (const lat of side ? [9, 15, 22] : [0]) {
          const cx = a.p.x * ppu + ux * d - uy * lat * side;
          const cy = a.p.y * ppu + uy * d + ux * lat * side;
          const box = { x: cx - w / 2 - 3, y: cy - 9, w: w + 6, h: 18 };
          // near its own source reads best; past halfway it starts to look like the other direction's
          let s = (d - a.r) * 0.5 + Math.max(0, d - Lpx / 2) * 3 + (side === 1 ? 0 : side === -1 ? 5 : 12) + lat * 0.4;
          s += outside(box, ob.bounds);
          for (const dd of ob.discs) s += over(box, dd) * 4;
          for (const pb of ob.labels) s += over(box, pb) * 24;
          for (const sb of ob.stands) s += over(box, sb) * 3;
          for (const tb of boxes) s += over(box, tb) * 8;
          if (!best || s < best.s) best = { x: cx, y: cy, s };
        }
      }
    }
    const c = best!;
    boxes.push({ x: c.x - w / 2 - 3, y: c.y - 9, w: w + 6, h: 18 });
    out.push({ from: from.id, to: to.id, text, x: c.x / ppu, y: c.y / ppu, w, ux, uy });
  }
  return out;
}

/**
 * Spread crowded spaces apart a little so plates and tiles have room. The
 * printed boards are schematic, so a nudge of a few px reads the same.
 */
function relax(pts: { p: Pt; r: number }[], view: View, ppu: number) {
  const home = pts.map((q) => ({ ...q.p }));
  const gap = 36 / ppu;
  for (let it = 0; it < 80; it++) {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i].p;
        const b = pts[j].p;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d < 1e-6) {
          dx = 1;
          dy = 0;
          d = 1;
        }
        const want = (pts[i].r + pts[j].r) / ppu + gap;
        if (d >= want) continue;
        const push = ((want - d) / 2) * 0.4;
        a.x -= (dx / d) * push;
        a.y -= (dy / d) * push;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
      }
    }
    for (const [i, q] of pts.entries()) {
      q.p.x += (home[i].x - q.p.x) * 0.025;
      q.p.y += (home[i].y - q.p.y) * 0.025;
      const m = q.r / ppu + 1;
      q.p.x = Math.min(Math.max(q.p.x, view.x0 + m), view.x0 + view.w - m);
      q.p.y = Math.min(Math.max(q.p.y, view.y0 + m), view.y0 + view.h - m);
    }
  }
}
