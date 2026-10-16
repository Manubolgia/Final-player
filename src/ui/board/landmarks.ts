// The large flat-ink shapes printed under the spaces, one or two per board:
// the camp's lake and woods, the Groves' stream under the bridge and the
// temple ruin round the shrine, Maple Lane's blocks and sidewalks, Creech's
// floor plan, the Carnival's midway. Authored in board percent (the same
// x/y as the zones) and warped with the spaces when they are spread apart,
// or built from where the spaces ended up. The Birds get power lines.

import type { LocationDef } from '../../game/types';
import { rand01, type Pt, type View } from './geometry';

/** Which board ink a shape is filled with (so the dream, finale and Birds palettes apply). */
export type Fill = 'water' | 'forest' | 'lawn' | 'walk' | 'floor' | 'house' | 'lane' | 'stone' | 'ground' | 'roof';

export type Shape =
  /** A closed outline: smooth, scalloped like tree crowns, or straight-edged. */
  | { k: 'area'; pts: Pt[]; fill: Fill; edge: 'smooth' | 'crowns' | 'straight'; line?: number }
  /** A thick band along a line (a stream, a lane, a sidewalk), in board units wide. */
  | { k: 'band'; pts: Pt[]; w: number; fill: Fill; line?: number; smooth?: boolean }
  /** A plain line in screen px (walls, wires, floorboards). */
  | { k: 'line'; pts: Pt[]; px: number; ink?: Fill | 'ink'; dash?: string; smooth?: boolean }
  /** A perched crow, s board units tall (decoration, not a token). */
  | { k: 'crow'; at: Pt; s: number; flip?: boolean };

export interface LandmarkSet {
  shapes: Shape[];
  /** Points scenery (pines, hedges) must keep out of. */
  keepOut: (p: Pt) => boolean;
}

interface Ctx {
  loc: LocationDef;
  view: View;
  /** Board percent → board units, following the spaces. */
  warp: (x: number, y: number) => Pt;
  /** Where each space ended up, in board units. */
  at: (id: string) => Pt | undefined;
  /** Board units per percent of y (1 / aspect). */
  ky: number;
  birds: boolean;
}

/** An irregular ring of points round a centre (percent), for woods and ponds. */
function ring(c: Ctx, cx: number, cy: number, rx: number, ry: number, n: number, seed: number, jitter = 0.18): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand01(seed) * 0.6;
    const j = 1 + (rand01(seed + i * 5.3) - 0.5) * 2 * jitter;
    out.push(c.warp(cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j));
  }
  return out;
}

const poly = (c: Ctx, pts: [number, number][]): Pt[] => pts.map(([x, y]) => c.warp(x, y));

/** Is p inside the polygon? */
export function inside(p: Pt, pts: Pt[]): boolean {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

/** Distance from p to a polyline. */
function lineDist(p: Pt, pts: Pt[]): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
    best = Math.min(best, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
  }
  return best;
}

function camp(c: Ctx): Shape[] {
  // the lake, with Lake in the water, the Dock and the Lakeside Cabin on its shore, the Cliff above it, the Marsh at its east end
  const lake = poly(c, [
    [39, 54],
    [44, 50.5],
    [51, 51.5],
    [58, 52.5],
    [64, 55.5],
    [70, 57],
    [77, 57.5],
    [82, 60.5],
    [83.5, 66],
    [81, 71],
    [75, 72.5],
    [69, 71],
    [65, 73],
    [59, 72],
    [53, 74.5],
    [46, 74],
    [41, 71],
    [38.5, 64.5],
    [37.5, 58.5],
  ]);
  const woods: [number, number, number, number][] = [
    [40, 35, 6.5, 4.5],
    [69.5, 45, 6, 3.6],
    [20.5, 78, 6.5, 6],
    [16.5, 52, 4.2, 5.5],
    [65, 86.5, 4.5, 2.6],
  ];
  return [
    { k: 'area', pts: lake, fill: 'water', edge: 'smooth', line: 2 },
    // a few ripples printed on the water
    ...[
      [48, 63],
      [57, 66.5],
      [67, 63.5],
    ].map(([x, y]): Shape => ({ k: 'line', pts: [0, 1, 2, 3, 4, 5, 6].map((i) => c.warp(x - 4.2 + i * 1.4, y + (i % 2 ? -0.3 : 0.3))), px: 1.4, ink: 'walk', smooth: true })),
    ...woods.map(([x, y, rx, ry], i): Shape => ({ k: 'area', pts: ring(c, x, y, rx, ry, 11, 40 + i * 9, 0.12), fill: 'forest', edge: 'crowns', line: 1.5 })),
  ];
}

function groves(c: Ctx): Shape[] {
  const out: Shape[] = [];
  // grove trees in the gaps
  const woods: [number, number, number, number][] = [
    [25, 52, 4.5, 3.6],
    [82.5, 53.5, 3.4, 4],
    [68, 32, 3.6, 2.6],
    [46, 52, 3, 3.4],
  ];
  woods.forEach(([x, y, rx, ry], i) => out.push({ k: 'area', pts: ring(c, x, y, rx, ry, 9, 70 + i * 7, 0.12), fill: 'forest', edge: 'crowns', line: 1.5 }));
  // a spring west of the Bridge, its stream running under it and off the board
  out.push({ k: 'area', pts: ring(c, 63, 76.5, 4.2, 3.2, 10, 91, 0.1), fill: 'water', edge: 'smooth', line: 2 });
  out.push({ k: 'band', pts: poly(c, [[64, 77.5], [68.5, 82.5], [74, 88], [76, 94], [77, 100], [78, 110]]), w: 3.6, fill: 'water', line: 2, smooth: true });
  // the temple ruin the Sacred Shrine stands in: a stepped stone floor and broken columns
  const sh = c.at('shrine');
  if (sh) {
    const R = (dx: number, dy: number, w: number, h: number): Pt[] => {
      const x = sh.x + dx;
      const y = sh.y + dy * c.ky;
      const hh = h * c.ky;
      return [
        { x, y },
        { x: x + w, y },
        { x: x + w, y: y + hh },
        { x, y: y + hh },
      ];
    };
    out.push({ k: 'area', pts: R(-9, -6.5, 18, 13), fill: 'stone', edge: 'straight', line: 2 });
    out.push({ k: 'area', pts: R(-6.5, -4.6, 13, 9.2), fill: 'stone', edge: 'straight', line: 1.5 });
    for (const [dx, dy, h] of [
      [-8.2, -9.5, 3.4],
      [6.6, -9, 2.4],
      [-8.2, 4.4, 2.2],
      [6.6, 4.2, 3.8],
    ])
      out.push({ k: 'area', pts: R(dx, dy, 1.7, h), fill: 'stone', edge: 'straight', line: 1.5 });
  }
  return out;
}

function maple(c: Ctx): Shape[] {
  const out: Shape[] = [];
  const X = c.at('crossroads');
  if (!X) return out;
  const v = c.view;
  // four lawn blocks between the streets, kerbed
  const gap = 4.2;
  const m = 3;
  const blocks: [number, number, number, number][] = [
    [v.x0 - m, v.y0 - m, X.x - gap, X.y - gap],
    [X.x + gap, v.y0 - m, v.x0 + v.w + m, X.y - gap],
    [v.x0 - m, X.y + gap, X.x - gap, v.y0 + v.h + m],
    [X.x + gap, X.y + gap, v.x0 + v.w + m, v.y0 + v.h + m],
  ];
  for (const [x0, y0, x1, y1] of blocks)
    out.push({
      k: 'area',
      pts: [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: x0, y: y1 },
      ],
      fill: 'ground',
      edge: 'straight',
      line: 1.5,
    });
  // sidewalks along both streets, from exit to exit
  const street = (ids: string[]) => ids.map((id) => c.at(id)).filter((p): p is Pt => !!p);
  const ns = street(['northExit', 'northSt', 'crossroads', 'southSt', 'southExit']);
  const ew = street(['westExit', 'westSt', 'crossroads', 'eastSt', 'eastExit']);
  const ext = (pts: Pt[]) => {
    // run each street off the board's edges
    const a = pts[0];
    const b = pts[1];
    const y = pts[pts.length - 1];
    const z = pts[pts.length - 2];
    const L = (p: Pt, q: Pt) => Math.hypot(p.x - q.x, p.y - q.y) || 1;
    return [{ x: a.x + ((a.x - b.x) / L(a, b)) * 20, y: a.y + ((a.y - b.y) / L(a, b)) * 20 }, ...pts, { x: y.x + ((y.x - z.x) / L(y, z)) * 20, y: y.y + ((y.y - z.y) / L(y, z)) * 20 }];
  };
  for (const s of [ns, ew]) if (s.length > 1) out.push({ k: 'band', pts: ext(s), w: gap * 2, fill: 'walk', line: 1.5 });
  // each house in its own yard, fenced
  for (const z of c.loc.zones) {
    const p = z.house ? c.at(z.id) : undefined;
    if (!p) continue;
    const sx = p.x < X.x ? -1 : 1;
    const sy = p.y < X.y ? -1 : 1;
    const w = 7.5;
    const h = 6.5 * c.ky * 1.1;
    // kept off the sidewalk
    let x0 = p.x - w;
    let x1 = p.x + w;
    let y0 = p.y - h;
    let y1 = p.y + h;
    if (sx < 0) x1 = Math.min(x1, X.x - gap - 0.6);
    else x0 = Math.max(x0, X.x + gap + 0.6);
    if (sy < 0) y1 = Math.min(y1, X.y - gap - 0.6);
    else y0 = Math.max(y0, X.y + gap + 0.6);
    out.splice(blocks.length, 0, {
      k: 'area',
      pts: [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: x0, y: y1 },
      ],
      fill: 'lawn',
      edge: 'straight',
      line: 1.5,
    });
  }
  return out;
}

function creech(c: Ctx): Shape[] {
  const out: Shape[] = [];
  const floors = new Map<number, { id: string; p: Pt }[]>();
  for (const z of c.loc.zones) {
    const p = c.at(z.id);
    if (!p || z.floor == null || z.floor < 1 || z.floor > 5) continue;
    if (!floors.has(z.floor)) floors.set(z.floor, []);
    floors.get(z.floor)!.push({ id: z.id, p });
  }
  const rows = [...floors.entries()].sort((a, b) => a[0] - b[0]).map(([f, rs]) => ({ f, rs: rs.sort((a, b) => a.p.x - b.p.x), y: rs.reduce((s, r) => s + r.p.y, 0) / rs.length }));
  if (rows.length < 2) return out;
  const storeys = rows.filter((r) => r.f <= 4);
  const gapY = (storeys[0].y - storeys[storeys.length - 1].y) / Math.max(1, storeys.length - 1);
  const xs = storeys.flatMap((r) => r.rs.map((q) => q.p.x));
  const x0 = Math.min(...xs) - 7;
  const x1 = Math.max(...xs) + 7;
  // storeys from the ground floor up: each a band of rooms split halfway between neighbours
  const top = (i: number) => (i + 1 < storeys.length ? (storeys[i].y + storeys[i + 1].y) / 2 : storeys[i].y - gapY / 2);
  const bot = (i: number) => (i > 0 ? (storeys[i].y + storeys[i - 1].y) / 2 : storeys[i].y + gapY / 2);
  const roofBase = top(storeys.length - 1);
  const attic = rows.find((r) => r.f === 5);
  // the roof, with the attic under it
  const peak = attic ? attic.y - gapY * 0.85 : roofBase - gapY;
  const midX = (x0 + x1) / 2;
  out.push({
    k: 'area',
    pts: [
      { x: x0 - 3, y: roofBase },
      { x: midX, y: peak },
      { x: x1 + 3, y: roofBase },
    ],
    fill: 'roof',
    edge: 'straight',
    line: 2,
  });
  if (attic) {
    const ax = attic.rs[0].p.x;
    const w = Math.min(14, (x1 - x0) / 4);
    out.push({
      k: 'area',
      pts: [
        { x: ax - w, y: roofBase },
        { x: ax - w, y: attic.y - gapY * 0.35 },
        { x: ax + w, y: attic.y - gapY * 0.35 },
        { x: ax + w, y: roofBase },
      ],
      fill: 'floor',
      edge: 'straight',
      line: 2,
    });
  }
  storeys.forEach((row, i) => {
    const yT = top(i);
    const yB = bot(i);
    const cuts = [x0, ...row.rs.slice(1).map((q, k) => (q.p.x + row.rs[k].p.x) / 2), x1];
    for (let k = 0; k + 1 < cuts.length; k++) {
      const a = cuts[k];
      const b = cuts[k + 1];
      out.push({
        k: 'area',
        pts: [
          { x: a, y: yT },
          { x: b, y: yT },
          { x: b, y: yB },
          { x: a, y: yB },
        ],
        fill: 'floor',
        edge: 'straight',
        line: 2,
      });
      // floorboards
      for (let y = yB - 1.6; y > yT + 0.8; y -= 2.4) out.push({ k: 'line', pts: [{ x: a + 0.8, y }, { x: b - 0.8, y }], px: 1, ink: 'house' });
    }
  });
  // the house's outer walls, heavier
  out.push({ k: 'line', pts: [{ x: x0, y: roofBase }, { x: x0, y: bot(0) }, { x: x1, y: bot(0) }, { x: x1, y: roofBase }], px: 3.5, ink: 'ink' });
  return out;
}

function carnival(c: Ctx): Shape[] {
  const out: Shape[] = [];
  const lane = (ids: string[]) => ids.map((id) => c.at(id)).filter((p): p is Pt => !!p);
  for (const ids of [
    ['entrance', 'westPlaza', 'tickets', 'eastPlaza', 'popcorn'],
    ['tickets', 'bigTop', 'midway', 'southPath'],
    ['westPlaza', 'mirrors', 'clownCar'],
    ['coaster', 'tickets'],
    ['oddities', 'midway'],
  ]) {
    const pts = lane(ids);
    if (pts.length > 1) out.push({ k: 'band', pts, w: 6.5, fill: 'lane', line: 1.5, smooth: true });
  }
  return out;
}

/** Power lines strung across the board, with crows sitting on them. */
function wires(c: Ctx): Shape[] {
  const out: Shape[] = [];
  const v = c.view;
  const lines: [number, number, number, number][] = [
    [v.x0 - 4, v.y0 + v.h * 0.16, v.x0 + v.w + 4, v.y0 + v.h * 0.3],
    [v.x0 - 4, v.y0 + v.h * 0.84, v.x0 + v.w + 4, v.y0 + v.h * 0.7],
  ];
  lines.forEach(([ax, ay, bx, by], li) => {
    // poles every so often, the wire sagging between them
    const n = 4;
    const poles: Pt[] = [];
    for (let i = 0; i <= n; i++) poles.push({ x: ax + ((bx - ax) * i) / n, y: ay + ((by - ay) * i) / n });
    const sag = 2.2;
    for (const off of [0, 1.1]) {
      const pts: Pt[] = [];
      for (let i = 0; i < n; i++) {
        const a = poles[i];
        const b = poles[i + 1];
        for (let t = 0; t <= 8; t++) pts.push({ x: a.x + ((b.x - a.x) * t) / 8, y: a.y + ((b.y - a.y) * t) / 8 + off + sag * Math.sin((Math.PI * t) / 8) });
      }
      out.push({ k: 'line', pts, px: 1.4, ink: 'ink' });
    }
    for (const p of poles.slice(1, -1)) {
      out.push({ k: 'line', pts: [{ x: p.x, y: p.y - 2.6 }, { x: p.x, y: p.y + 4.5 }], px: 3, ink: 'ink' });
      out.push({ k: 'line', pts: [{ x: p.x - 2, y: p.y - 0.4 }, { x: p.x + 2, y: p.y - 0.4 }], px: 2, ink: 'ink' });
    }
    // crows on the wire
    for (let i = 0; i < 7; i++) {
      const t = 0.06 + ((i + rand01(li * 31 + i) * 0.6) / 7) * 0.9;
      const seg = Math.min(n - 1, Math.floor(t * n));
      const a = poles[seg];
      const b = poles[seg + 1];
      const lt = t * n - seg;
      out.push({ k: 'crow', at: { x: a.x + (b.x - a.x) * lt, y: a.y + (b.y - a.y) * lt + sag * Math.sin(Math.PI * lt) }, s: 2.6, flip: rand01(li * 7 + i * 3) > 0.6 });
    }
  });
  return out;
}

export function landmarkSet(c: Ctx): LandmarkSet {
  const by: Record<string, (c: Ctx) => Shape[]> = { campHappyTrails: camp, sacredGroves: groves, mapleLane: maple, creechManor: creech, carnivalOfBlood: carnival };
  const shapes = [...(by[c.loc.id]?.(c) ?? []), ...(c.birds ? wires(c) : [])];
  const areas = shapes.filter((s): s is Extract<Shape, { k: 'area' }> => s.k === 'area' && !['floor', 'lawn', 'roof', 'ground', 'stone'].includes(s.fill));
  const bands = shapes.filter((s): s is Extract<Shape, { k: 'band' }> => s.k === 'band');
  const keepOut = (p: Pt) => areas.some((a) => inside(p, a.pts)) || bands.some((b) => lineDist(p, b.pts) < b.w / 2 + 1.5);
  return { shapes, keepOut };
}
