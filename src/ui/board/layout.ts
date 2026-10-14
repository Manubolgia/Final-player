// Where everything printed on the board goes, for a given location and
// scale: space discs, name plates (placed so they don't collide), panic
// tiles, and scenery. Computed once per location and size.

import type { LocationDef, ZoneDef } from '../../game/types';
import { discPx, faces, fitView, hashStr, rand01, segDist, textWidth, zonePoint, type Edge, type Pt, type View } from './geometry';

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
  tiles: PanicTile[];
  decor: Decor[];
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

const hit = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export function layoutBoard(loc: LocationDef, zones: ZoneDef[], edges: Edge[], ppu: number, sideOverride: Record<string, string> = {}): BoardLayout {
  const view = fitView(zones, loc.aspect);
  const zl = new Map<string, ZoneLayout>();
  const pts = zones.map((z) => ({ z, p: zonePoint(z, loc.aspect), r: discPx(z, ppu) }));
  // discs as screen-px boxes, for collision tests
  const discs = pts.map(({ p, r }) => ({ x: p.x * ppu - r, y: p.y * ppu - r, w: r * 2, h: r * 2 }));
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const bounds = { x: view.x0 * ppu, y: view.y0 * ppu, w: view.w * ppu, h: view.h * ppu };
  const order = [...pts].sort((a, b) => a.p.y - b.p.y || a.p.x - b.p.x);
  for (const { z, p, r } of order) {
    const lines = wrap(z.name, 74);
    const w = Math.ceil(Math.max(...lines.map((l) => textWidth(l, LABEL_FONT)))) + 8;
    const h = lines.length * LINE + 3;
    const cands: Record<string, [number, number]> = {
      S: [-w / 2, r + 3],
      N: [-w / 2, -r - 3 - h],
      E: [r + 4, -h / 2],
      W: [-r - 4 - w, -h / 2],
      SE: [r * 0.55, r * 0.7 + 2],
      SW: [-r * 0.55 - w, r * 0.7 + 2],
      NE: [r * 0.55, -r * 0.7 - 2 - h],
      NW: [-r * 0.55 - w, -r * 0.7 - 2 - h],
    };
    const prefer = sideOverride[z.id] ? [sideOverride[z.id], 'S', 'N', 'E', 'W', 'SE', 'SW', 'NE', 'NW'] : ['S', 'N', 'E', 'W', 'SE', 'SW', 'NE', 'NW'];
    let chosen: [number, number] = cands.S;
    for (const k of prefer) {
      const [dx, dy] = cands[k];
      const box = { x: p.x * ppu + dx, y: p.y * ppu + dy, w, h };
      const inside = box.x >= bounds.x && box.y >= bounds.y && box.x + box.w <= bounds.x + bounds.w && box.y + box.h <= bounds.y + bounds.h;
      if (!inside) continue;
      if (discs.some((d) => hit(d, box)) || placed.some((b) => hit(b, box))) continue;
      chosen = [dx, dy];
      break;
    }
    const box = { x: p.x * ppu + chosen[0], y: p.y * ppu + chosen[1], w, h };
    placed.push(box);
    zl.set(z.id, { z, p, r, label: { x: chosen[0], y: chosen[1], w, h, lines } });
  }

  // panic tiles: one per direction, near its source space, to the right of travel
  const tiles: PanicTile[] = [];
  for (const e of edges) {
    for (const [src, dst, fs] of [
      [e.a, e.b, e.ab],
      [e.b, e.a, e.ba],
    ] as const) {
      if (!fs) continue;
      const a = zl.get(src.id)!;
      const b = zl.get(dst.id)!;
      const dx = b.p.x - a.p.x;
      const dy = b.p.y - a.p.y;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L;
      const uy = dy / L;
      const text = faces(fs);
      const w = Math.max(22, Math.ceil(textWidth(text, LABEL_FONT)) + 10);
      let push = 0;
      const lab = a.label;
      for (let tries = 0; tries < 3; tries++) {
        const d = (a.r + 14 + push) / ppu;
        const x = a.p.x + ux * d + -uy * (7 / ppu);
        const y = a.p.y + uy * d + ux * (7 / ppu);
        const box = { x: x * ppu - w / 2, y: y * ppu - 8, w, h: 16 };
        const labBox = { x: a.p.x * ppu + lab.x, y: a.p.y * ppu + lab.y, w: lab.w, h: lab.h };
        if (!hit(box, labBox) || L * ppu < a.r + b.r + 60) {
          tiles.push({ from: src.id, to: dst.id, text, x, y, w, ux, uy });
          break;
        }
        push += 20;
        if (tries === 2) tiles.push({ from: src.id, to: dst.id, text, x, y, w, ux, uy });
      }
    }
  }

  // scenery: deterministic points well clear of spaces and trails
  const decor: Decor[] = [];
  const seed = hashStr(loc.id);
  for (let i = 0; i < 90 && decor.length < 22; i++) {
    const x = view.x0 + rand01(seed + i * 3.1) * view.w;
    const y = view.y0 + rand01(seed + i * 7.7) * view.h;
    const pt = { x, y };
    if (pts.some((q) => Math.hypot(q.p.x - x, q.p.y - y) < 9)) continue;
    if (edges.some((e) => segDist(pt, zl.get(e.a.id)!.p, zl.get(e.b.id)!.p) < 4.5)) continue;
    if ([...zl.values()].some((q) => {
      const b = { x: q.p.x * ppu + q.label.x - 4, y: q.p.y * ppu + q.label.y - 4, w: q.label.w + 8, h: q.label.h + 8 };
      return x * ppu > b.x && x * ppu < b.x + b.w && y * ppu > b.y && y * ppu < b.y + b.h;
    }))
      continue;
    decor.push({ x, y, s: 0.8 + rand01(seed + i) * 0.5, k: Math.floor(rand01(seed + i * 13) * 3) });
  }

  return { view, ppu, zones: zl, edges, tiles, decor };
}
