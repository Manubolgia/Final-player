// The printed board must stay readable: name plates don't sit on each other or on
// another space, on any board, at portrait and landscape sizes.
import { describe, expect, it } from 'vitest';
import { LOCATIONS } from '../src/game/content';
import { edgesOf, fitView } from '../src/ui/board/geometry';
import { layoutBoard, type Box } from '../src/ui/board/layout';

const over = (a: Box, b: Box) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

function layoutAt(locId: string, w: number, h: number) {
  const loc = LOCATIONS.find((l) => l.id === locId)!;
  const zones = loc.zones.filter((z) => !z.hidden);
  // the same fit as Board.tsx: stretch the schematic map to its frame
  const natural = fitView(zones, loc.aspect);
  const k = Math.round(Math.min(2, Math.max(0.6, h / w / (natural.h / natural.w))) * 20) / 20;
  const aspect = loc.aspect / k;
  const base = fitView(zones, aspect);
  const ppu = Math.round(Math.min(w / base.w, h / base.h) * 20) / 20;
  return { lay: layoutBoard(loc, zones, edgesOf(zones), ppu, aspect), ppu };
}

/** Plate-on-plate and plate-on-other-space overlaps worth noticing (more than a few px²). */
function collisions(locId: string, w: number, h: number): string[] {
  const { lay, ppu } = layoutAt(locId, w, h);
  const items = [...lay.zones.values()].map((zl) => ({
    id: zl.z.id,
    plate: { x: zl.p.x * ppu + zl.label.x, y: zl.p.y * ppu + zl.label.y, w: zl.label.w, h: zl.label.h },
    tile: { x: zl.p.x * ppu - zl.r, y: zl.p.y * ppu - zl.r, w: zl.r * 2, h: zl.r * 2 },
  }));
  const out: string[] = [];
  for (const a of items)
    for (const b of items) {
      if (a.id === b.id) continue;
      if (a.id < b.id && over(a.plate, b.plate) > 6) out.push(`${a.id} plate on ${b.id} plate`);
      if (over(a.plate, b.tile) > 30) out.push(`${a.id} plate on ${b.id} space`);
    }
  return out;
}

const SIZES: [string, number, number][] = [
  ['portrait', 350, 260],
  ['landscape', 470, 330],
];

/** Known tight spots on the densest boards in the small portrait frame; they may shrink, never grow. */
const KNOWN: Record<string, number> = { 'creechManor portrait': 2, 'mapleLane portrait': 3 };

describe('board name plates', () => {
  for (const loc of LOCATIONS)
    for (const [name, w, h] of SIZES)
      it(`${loc.name}, ${name}`, () => {
        const c = collisions(loc.id, w, h);
        const allowed = KNOWN[`${loc.id} ${name}`] ?? 0;
        if (c.length > allowed) console.log(`${loc.id} ${name}: ${c.length}\n  ${c.join('\n  ')}`);
        expect(c.length).toBeLessThanOrEqual(allowed);
      });
});

