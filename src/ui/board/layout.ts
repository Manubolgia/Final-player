// Where everything printed on the board goes, for a given location and
// scale: space discs, name plates (placed so they don't collide), panic
// tiles, and scenery. Computed once per location and size.

import type { LocationDef, ZoneDef } from '../../game/types';
import { discPx, faces, fitView, hashStr, LABEL_FONT, rand01, segDist, textWidth, zonePoint, type Edge, type Pt, type View } from './geometry';

export { LABEL_FONT };

export type Box = { x: number; y: number; w: number; h: number };

export interface LabelBox {
  /** Top-left, in screen px relative to the disc centre. */
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
}

/**
 * A space's pawn pad: the fixed spot where its pieces stand (the Final Girl,
 * the Killer, victims, puppets), on the side of the tile away from its name
 * plate. Pieces stand in one row, feet on `foot`; past three, a ×N chit.
 */
export interface Pad {
  /** Box in screen px relative to the disc centre. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** 'c': the row is centred on the tile; 'r' / 'l': it runs from the tile outward. */
  align: 'c' | 'r' | 'l';
  /** Feet line, px below the disc centre. */
  foot: number;
  /** Where the first piece stands, px from the disc centre (for 'r' and 'l' rows). */
  x0: number;
  /** How many pieces stand side by side before the rest become a ×N chit. */
  cap: number;
}

export interface ZoneLayout {
  z: ZoneDef;
  p: Pt;
  /** Disc radius in screen px. */
  r: number;
  label: LabelBox;
  pad: Pad;
  /** Where printed token chits and birds sit, in screen px relative to the disc centre. */
  slot: Box;
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
  ob: { discs: Box[]; labels: Box[]; pads: Box[]; slots: Box[]; bounds: Box };
}

const LINE = 13;

const SIDE: Record<string, string> = {
  Top: 'Top',
  Middle: 'Mid',
  Big: 'Big',
  Bottom: 'Low',
};
/** "NW House (Middle)" → "NW Mid", "Bay Window Room" → "Bay Window", "The Smalleys' House" → "Smalleys'". */
export function shortName(name: string): string {
  return name
    .replace(/ House \((Top|Middle|Big|Bottom)\)$/, (_, w: string) => ` ${SIDE[w]}`)
    .replace(/^Outside \((\w+)\)$/, '$1')
    .replace(/^The /, '')
    .replace(/ (House|Room|Stand|Tent|Cabin|Center)$/, '')
    .replace(/^(North|South)(west|east) /, (_, a: string, b: string) => `${a[0]}${b[0].toUpperCase()} `)
    .replace(/ and /, ' & ')
    .replace(/^Groundskeeper's/, "Keeper's");
}

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
const clampIn = (b: Box, o: Box): Box => ({
  ...b,
  x: Math.min(Math.max(b.x, o.x), o.x + o.w - b.w),
  y: Math.min(Math.max(b.y, o.y), o.y + o.h - b.h),
});
/** Solver weights per px² of overlap. */
const W = {
  plate: 100,
  platePad: 120,
  pad: 30,
  slotPlate: 8,
  slotPad: 6,
  slot: 2,
  plateTile: 100,
  padTile: 100,
  slotTile: 9,
  flat: 600,
  padX: 3,
};
/** Overlap cost: by area, plus a flat charge once it is a real collision. */
const pen = (v: number, w: number, t: number) => (v ? v * w + (v > t ? W.flat : 0) : 0);
const union = (...bs: Box[]): Box => {
  const x = Math.min(...bs.map((b) => b.x));
  const y = Math.min(...bs.map((b) => b.y));
  return {
    x,
    y,
    w: Math.max(...bs.map((b) => b.x + b.w)) - x,
    h: Math.max(...bs.map((b) => b.y + b.h)) - y,
  };
};

/** Pawn pads: px between pieces in a row, and the pad's height. */
export const PITCH = 15;
const PAD_H = 25;
type PadSide = 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW' | 'C';
const PAD_SIDES: PadSide[] = ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW', 'C'];
/** Above the tile reads most like pieces standing on it; centred on the tile least. */
const PAD_PREF: Record<PadSide, number> = { N: 0, S: 1, NE: 1.5, NW: 1.5, E: 2.5, W: 2.5, SE: 2.5, SW: 2.5, C: 3 };
/** A pad holds three pieces side by side; a two-piece pad is only for the tightest spots. */
const CAP_PREF: Record<number, number> = { 3: 0, 2: 60 };
export function padAt(side: PadSide, r: number, cap = 3): Pad {
  const v = side[0] === 'N' ? 'top' : side[0] === 'S' ? 'bot' : 'mid';
  const align = side === 'N' || side === 'S' || side === 'C' ? 'c' : side.endsWith('E') ? 'r' : 'l';
  const foot = v === 'top' ? r * 0.3 : v === 'bot' ? r + 5 : r * 0.6 + 2;
  const x0 = r * 0.3;
  const w = PITCH * (cap - 1) + 20;
  const x = align === 'c' ? -w / 2 : align === 'r' ? x0 - 10 : -(x0 + PITCH * (cap - 1) + 10);
  return { x, y: foot - PAD_H, w, h: PAD_H, align, foot, x0: align === 'l' ? -x0 : x0, cap };
}

/** Token slots: one printed chit (or up to three birds), hugging the tile's rim. */
export const SLOT_W = 50;
export const SLOT_H = 22;
type SlotSide = 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW';
const SLOT_SIDES: SlotSide[] = ['E', 'W', 'S', 'N', 'SE', 'SW', 'NE', 'NW'];
function slotAt(side: SlotSide, r: number, out = 0): Box {
  const d = r * 0.6 + out * 0.7;
  const e = r - 6 + out;
  const at: Record<SlotSide, [number, number]> = {
    E: [e, -SLOT_H / 2],
    W: [-e - SLOT_W, -SLOT_H / 2],
    S: [-SLOT_W / 2, e],
    N: [-SLOT_W / 2, -e - SLOT_H],
    SE: [d, d],
    SW: [-d - SLOT_W, d],
    NE: [d, -d - SLOT_H],
    NW: [-d - SLOT_W, -d - SLOT_H],
  };
  const [x, y] = at[side];
  return { x, y, w: SLOT_W, h: SLOT_H };
}

export function layoutBoard(loc: LocationDef, zones: ZoneDef[], edges: Edge[], ppu: number, aspect = loc.aspect, sideOverride: Record<string, string> = {}): BoardLayout {
  const view = fitView(zones, aspect);
  const zl = new Map<string, ZoneLayout>();
  const pts = zones.map((z) => ({
    z,
    p: zonePoint(z, aspect),
    r: discPx(z, ppu),
  }));
  relax(pts, view, ppu);
  const at = new Map(pts.map((q) => [q.z.id, q]));
  // everything in screen px: tiles, and the badges printed on them (item decks
  // top-right, exit doors top-left, windows bottom-right), each with its owner
  type Ob = { box: Box; own: number; tile: boolean };
  const obs: Ob[] = pts.map(({ p, r }, i) => ({
    box: {
      x: p.x * ppu - r - 2,
      y: p.y * ppu - r - 2,
      w: r * 2 + 4,
      h: r * 2 + 5,
    },
    own: i,
    tile: true,
  }));
  pts.forEach(({ z, p, r }, i) => {
    const cx = p.x * ppu;
    const cy = p.y * ppu;
    if (z.search)
      obs.push({
        box: { x: cx + r * 0.9 - 11, y: cy - r * 0.9 - 11, w: 28, h: 28 },
        own: i,
        tile: false,
      });
    if (z.exit)
      obs.push({
        box: { x: cx - r * 0.95 - 10, y: cy - r * 0.95 - 12, w: 20, h: 24 },
        own: i,
        tile: false,
      });
    if (z.window)
      obs.push({
        box: { x: cx + r * 0.9 - 8, y: cy + r * 0.85 - 8, w: 16, h: 16 },
        own: i,
        tile: false,
      });
  });
  const discs = obs.map((o) => o.box);
  const tileAt = pts.map(({ p, r }) => ({ x: p.x * ppu - r, y: p.y * ppu - r, w: r * 2, h: r * 2 }));
  const segs: [Pt, Pt][] = edges.map((e) => {
    const a = at.get(e.a.id)!.p;
    const b = at.get(e.b.id)!.p;
    return [
      { x: a.x * ppu, y: a.y * ppu },
      { x: b.x * ppu, y: b.y * ppu },
    ];
  });
  const bounds: Box = {
    x: view.x0 * ppu + 2,
    y: view.y0 * ppu + 2,
    w: view.w * ppu - 4,
    h: view.h * ppu - 4,
  };
  const fixedCost = (i: number, box: Box, own: number, other: number, trail: number) => {
    let c = 0;
    for (const o of obs) c += o.own === i ? (o.tile ? 0 : over(box, o.box) * own) : pen(over(box, o.box), other, 20);
    return c + onTrail(box, segs) * trail;
  };

  // Every space gets a name plate, a pawn pad and a token slot, chosen together:
  // candidate plates (around and beside the tile, one or two lines, short forms
  // only to clear a collision), each paired with the pads that keep clear of it
  // (opposite the plate preferred) and the best slot left over. Scored against
  // what never moves (tiles, badges, trails, the frame), then seated greedily
  // and improved by re-seating each space given where all the others ended up.
  type Cand = {
    lab: LabelBox;
    plate: Box;
    pad: Box;
    slot: Box;
    u: Box;
    padRel: Pad;
    slotRel: Box;
    fixed: number;
  };
  const cands: Cand[][] = pts.map((q, own) => {
    const { z, p, r } = q;
    const cx = p.x * ppu;
    const cy = p.y * ppu;
    const wraps = [wrap(z.name, 74)];
    const alt = wrap(z.name, wraps[0].length > 1 ? 999 : 40);
    if (alt.join('|') !== wraps[0].join('|')) wraps.push(alt);
    // a shorter printed form, only used when it clears a collision (the tile's icon carries the rest)
    const short = shortName(z.name);
    if (short !== z.name) wraps.push(wrap(short, 74), wrap(short, 999));
    const wrapsLong = short !== z.name ? wraps.length - 2 : 99;
    // the pads and slots this space could use, with what they cost on their own
    const pads = [3, 2].flatMap((cap) =>
      PAD_SIDES.map((side) => {
        const rel = padAt(side, r, cap);
        const box = { x: cx + rel.x, y: cy + rel.y, w: rel.w, h: rel.h };
        return { side, rel, box, cost: PAD_PREF[side] + CAP_PREF[cap] + outside(box, bounds) * 1.5 + fixedCost(own, box, 1.5, W.padTile, 0.3) };
      }),
    );
    const slots = SLOT_SIDES.map((side) => {
      const rel = slotAt(side, r);
      const box = { x: cx + rel.x, y: cy + rel.y, w: rel.w, h: rel.h };
      return {
        rel,
        box,
        cost: outside(box, bounds) * 1.5 + fixedCost(own, box, 4, W.slotTile, 2),
      };
    });
    const out: Cand[] = [];
    wraps.forEach((lines, wi) => {
      const w = Math.ceil(Math.max(...lines.map((l) => textWidth(l, LABEL_FONT)))) + 8;
      const h = lines.length * LINE + 3;
      const spots: [string, number, number][] = [
        ['S', -w / 2, r - 3],
        ['N', -w / 2, -r + 3 - h],
        ['E', r - 3, -h / 2],
        ['W', -r + 3 - w, -h / 2],
        ['SE', r * 0.55, r * 0.7 + 2],
        ['SW', -r * 0.55 - w, r * 0.7 + 2],
        ['NE', r * 0.55, -r * 0.7 - 2 - h],
        ['NW', -r * 0.55 - w, -r * 0.7 - 2 - h],
        ['S2', -w / 2, r + 10],
        ['N2', -w / 2, -r - 10 - h],
        // shifted sideways, still touching their own tile
        ['Sl', -w + r * 0.7, r - 3],
        ['Sr', -r * 0.7, r - 3],
        ['Nl', -w + r * 0.7, -r + 3 - h],
        ['Nr', -r * 0.7, -r + 3 - h],
        ['Eu', r - 3, -h + 4],
        ['Ed', r - 3, -4],
        ['Wu', -r + 3 - w, -h + 4],
        ['Wd', -r + 3 - w, -4],
      ];
      const pref = sideOverride[z.id];
      spots.forEach(([k, dx, dy], i) => {
        const plate = clampIn({ x: cx + dx, y: cy + dy, w, h }, bounds);
        let fixed = (k === pref ? -1 : Math.min(i, 10)) * 3 + (i >= 10 ? 4 : 0) + wi * 6 + (wi >= wrapsLong ? 14 : 0);
        fixed += outside({ x: cx + dx, y: cy + dy, w, h }, bounds);
        // a plate may tuck under its own tile's rim; anything else counts
        fixed += fixedCost(own, plate, 9, W.plateTile, 18);
        // plate direction, to keep the pad on the far side
        const px = plate.x + plate.w / 2 - cx;
        const py = plate.y + plate.h / 2 - cy;
        const pl = Math.hypot(px, py) || 1;
        const lab: LabelBox = { x: plate.x - cx, y: plate.y - cy, w, h, lines };
        const fits = pads
          .filter((d) => over(d.box, plate) <= 4)
          .map((d) => {
            const qx = d.rel.x + d.rel.w / 2;
            const qy = d.rel.y + d.rel.h / 2;
            const ql = Math.hypot(qx, qy);
            // opposite the plate costs nothing, beside it a little, on its side the most
            const facing = ql < 4 ? 4 : (1 + (px * qx + py * qy) / (pl * ql)) * 5;
            return { d, cost: d.cost + facing };
          })
          .sort((a, b) => a.cost - b.cost)
          .slice(0, 4);
        for (const { d, cost } of fits) {
          let bestSlot = slots[0];
          let bestSc = Infinity;
          for (const sl of slots) {
            const sc = sl.cost + over(sl.box, plate) * 20 + over(sl.box, d.box) * 6;
            if (sc < bestSc) {
              bestSc = sc;
              bestSlot = sl;
            }
          }
          const u = union(plate, d.box, bestSlot.box);
          out.push({
            lab,
            plate,
            pad: d.box,
            slot: bestSlot.box,
            u,
            padRel: d.rel,
            slotRel: bestSlot.rel,
            fixed: fixed + cost + bestSc * 0.5,
          });
        }
      });
    });
    // a candidate that already lands on another space or the frame far worse than the best one never wins
    const floor = Math.min(...out.map((c) => c.fixed));
    return out.filter((c) => c.fixed <= floor + 12000);
  });
  // only spaces whose candidates can reach each other interact
  const reach = cands.map((cs) => union(...cs.map((c) => c.u)));
  const near = reach.map((a, i) => reach.map((_, j) => j).filter((j) => j !== i && over(a, reach[j]) > 0));
  // what two spaces' choices cost each other: pieces on a name worst, then plates on plates
  const inter = (a: Cand, b: Cand) => {
    if (!over(a.u, b.u)) return 0;
    return (
      pen(over(a.plate, b.plate), W.plate, 4) +
      pen(over(a.plate, b.pad), W.platePad, 4) * W.padX +
      pen(over(a.pad, b.plate), W.platePad, 4) * W.padX +
      over(a.pad, b.pad) * W.pad +
      (over(a.slot, b.plate) + over(a.plate, b.slot)) * W.slotPlate +
      (over(a.slot, b.pad) + over(a.pad, b.slot)) * W.slotPad +
      over(a.slot, b.slot) * W.slot
    );
  };
  let pick: number[] = pts.map(() => -1);
  const cost = (i: number, c: Cand) => {
    let sc = c.fixed;
    for (const j of near[i]) if (pick[j] >= 0) sc += inter(c, cands[j][pick[j]]);
    return sc;
  };
  const best = (i: number) => {
    let bi = 0;
    let bs = Infinity;
    cands[i].forEach((c, k) => {
      const sc = cost(i, c);
      if (sc < bs) {
        bs = sc;
        bi = k;
      }
    });
    return bi;
  };
  const descend = (order: number[]) => {
    for (let pass = 0; pass < 8; pass++) {
      let moved = false;
      for (const i of order) {
        const k = best(i);
        if (k !== pick[i]) {
          pick[i] = k;
          moved = true;
        }
      }
      if (!moved) break;
    }
  };
  // pairs that still collide are re-seated together, trying every
  // combination of their candidates against everyone else where they stand
  const hard = (a: Cand, b: Cand) => over(a.plate, b.plate) + over(a.plate, b.pad) + over(a.pad, b.plate);
  const pairs = () => {
    for (let pass = 0; pass < 3; pass++) {
      let moved = false;
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          if (hard(cands[i][pick[i]], cands[j][pick[j]]) <= 4) continue;
          const alone = (a: number, b: number) =>
            cands[a].map((c) => {
              let sc = c.fixed;
              for (const o of near[a]) if (o !== b) sc += inter(c, cands[o][pick[o]]);
              return sc;
            });
          const si = alone(i, j);
          const sj = alone(j, i);
          let bs = si[pick[i]] + sj[pick[j]] + inter(cands[i][pick[i]], cands[j][pick[j]]);
          let bi = pick[i];
          let bj = pick[j];
          const oi = si.map((v, k) => [v, k]).sort((a, b) => a[0] - b[0]);
          const oj = sj.map((v, k) => [v, k]).sort((a, b) => a[0] - b[0]);
          for (const [vi, ki] of oi) {
            if (vi + oj[0][0] >= bs) break;
            for (const [vj, kj] of oj) {
              if (vi + vj >= bs) break;
              const sc = vi + vj + inter(cands[i][ki], cands[j][kj]);
              if (sc < bs) {
                bs = sc;
                bi = ki;
                bj = kj;
              }
            }
          }
          if (bi !== pick[i] || bj !== pick[j]) {
            pick[i] = bi;
            pick[j] = bj;
            moved = true;
          }
        }
      if (!moved) break;
    }
  };
  // how a seating came out: real collisions first, then the total cost
  const score = () => {
    let bad = 0;
    let total = 0;
    pts.forEach((_, i) => {
      const c = cands[i][pick[i]];
      total += cost(i, c);
      pick.forEach((k, j) => {
        // pieces on a name or another space count double: plates may touch in a tight spot, pieces never
        if (j !== i && over(c.pad, cands[j][k].plate) > 6) bad += 2;
        if (j > i && over(c.plate, cands[j][k].plate) > 6) bad++;
        if (j !== i && over(c.plate, tileAt[j]) > 30) bad++;
        if (j !== i && over(c.pad, tileAt[j]) > 30) bad += 2;
      });
    });
    return { pick: [...pick], bad, total };
  };
  // crowded spaces first, so they get the best spots
  const crowd = (q: (typeof pts)[number]) => pts.filter((o) => o !== q && Math.hypot(o.p.x - q.p.x, o.p.y - q.p.y) * ppu < 90).length;
  const order = pts.map((_, i) => i).sort((a, b) => crowd(pts[b]) - crowd(pts[a]) || pts[a].p.y - pts[b].p.y || pts[a].p.x - pts[b].p.x);
  for (const i of order) pick[i] = best(i);
  descend(order);
  pairs();
  let sol = score();
  // still a collision: shake it loose (a seeded anneal, so every phone gets the same board) and settle again
  for (let round = 0; round < 3 && sol.bad; round++) {
    let seed = hashStr(loc.id) + round * 977 + Math.round(ppu * 100);
    const rnd = () => rand01((seed += 1.618));
    const steps = 4000;
    for (let it = 0; it < steps; it++) {
      const T = 400 * Math.pow(2 / 400, it / steps);
      const i = Math.floor(rnd() * pts.length);
      const k = Math.floor(rnd() * cands[i].length);
      if (k === pick[i]) continue;
      const d = cost(i, cands[i][k]) - cost(i, cands[i][pick[i]]);
      if (d < 0 || rnd() < Math.exp(-d / T)) pick[i] = k;
    }
    descend(order);
    pairs();
    const s2 = score();
    if (s2.bad < sol.bad || (s2.bad === sol.bad && s2.total < sol.total)) sol = s2;
    pick = [...sol.pick];
  }
  pick = sol.pick;
  const placed = pts.map((_, i) => cands[i][pick[i]].plate);
  const padBoxes = pts.map((_, i) => cands[i][pick[i]].pad);
  const slotRel = pts.map((_, i) => cands[i][pick[i]].slotRel);
  // token slots last: with every plate and pad seated, each slot takes the spot
  // round its tile (close in, or a step further out) that covers the least
  const slotAbs = (i: number, b: Box): Box => ({
    x: pts[i].p.x * ppu + b.x,
    y: pts[i].p.y * ppu + b.y,
    w: b.w,
    h: b.h,
  });
  for (let pass = 0; pass < 2; pass++)
    for (const i of order) {
      let bs = Infinity;
      // round the tile, close in or a step further out; failing all of those, lying
      // on the tile itself, under the feet of whoever stands there
      const tries: [number, Box][] = SLOT_SIDES.flatMap((side, k) => [-6, 0, 9, 18].map((out): [number, Box] => [k * 0.5 + Math.abs(out) * 0.4, slotAt(side, pts[i].r, out)]));
      {
        // on the tile, away from its own plate
        const r = pts[i].r;
        const pl = cands[i][pick[i]].lab;
        const py = pl.y + pl.h / 2;
        const px = pl.x + pl.w / 2;
        const y = Math.abs(py) > Math.abs(px) ? (py > 0 ? Math.min(-r * 0.3, pl.y - SLOT_H / 2 - 1) : Math.max(r * 0.45, pl.y + pl.h + SLOT_H / 2 + 1)) : 0;
        const x = Math.abs(py) > Math.abs(px) ? 0 : px > 0 ? Math.min(0, pl.x - SLOT_W / 2 - 1) : Math.max(0, pl.x + pl.w + SLOT_W / 2 + 1);
        tries.push([60, { x: x - SLOT_W / 2, y: y - SLOT_H / 2, w: SLOT_W, h: SLOT_H }]);
      }
      for (const [pref, at] of tries) {
        // kept inside the frame, so a chit is never cut off
        const box = clampIn(slotAbs(i, at), bounds);
        const rel = { x: box.x - pts[i].p.x * ppu, y: box.y - pts[i].p.y * ppu, w: box.w, h: box.h };
        let sc = pref + fixedCost(i, box, pref >= 60 ? 0 : 4, 60, pref >= 60 ? 0 : 2);
        pts.forEach((_, j) => {
          sc += over(box, placed[j]) * 100 + over(box, padBoxes[j]) * (j === i ? (pref >= 60 ? 2 : 80) : 60);
          if (j !== i) sc += over(box, slotAbs(j, slotRel[j])) * 10;
        });
        if (sc < bs) {
          bs = sc;
          slotRel[i] = rel;
        }
      }
    }
  const slotBoxes = pts.map((_, i) => slotAbs(i, slotRel[i]));
  pts.forEach((q, i) => {
    const c = cands[i][pick[i]];
    zl.set(q.z.id, {
      z: q.z,
      p: q.p,
      r: q.r,
      label: c.lab,
      pad: c.padRel,
      slot: slotRel[i],
    });
  });

  const ob = {
    discs,
    labels: placed,
    pads: padBoxes,
    slots: slotBoxes,
    bounds,
  };
  const tiles = placeTiles({ zones: zl, ppu, ob }, panicArrows(edges));
  const tileBoxes = tiles.map((t) => ({
    x: t.x * ppu - t.w / 2 - 3,
    y: t.y * ppu - 9,
    w: t.w + 6,
    h: 18,
  }));

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
    if (
      [...zl.values()].some((q) => {
        const b = {
          x: q.p.x * ppu + q.label.x - 4,
          y: q.p.y * ppu + q.label.y - 4,
          w: q.label.w + 8,
          h: q.label.h + 8,
        };
        return x * ppu > b.x && x * ppu < b.x + b.w && y * ppu > b.y && y * ppu < b.y + b.h;
      })
    )
      continue;
    decor.push({
      x,
      y,
      s: 0.8 + rand01(seed + i) * 0.5,
      k: Math.floor(rand01(seed + i * 13) * 3),
    });
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
          for (const pb of ob.pads) s += over(box, pb) * 10;
          for (const sb of ob.slots) s += over(box, sb) * 4;
          for (const tb of boxes) s += over(box, tb) * 8;
          if (!best || s < best.s) best = { x: cx, y: cy, s };
        }
      }
    }
    const c = best!;
    boxes.push({ x: c.x - w / 2 - 3, y: c.y - 9, w: w + 6, h: 18 });
    out.push({
      from: from.id,
      to: to.id,
      text,
      x: c.x / ppu,
      y: c.y / ppu,
      w,
      ux,
      uy,
    });
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
