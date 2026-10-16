// The printed board must stay readable: name plates don't sit on each other or on
// another space, and no space's pawn pad (where its pieces stand) sits on a name
// plate or another space, on any board, at the phone's portrait and landscape
// frame sizes and zoomed in.
import { describe, expect, it } from 'vitest';
import { LOCATIONS } from '../src/game/content';
import { edgesOf, fitView } from '../src/ui/board/geometry';
import { layoutBoard, type Box } from '../src/ui/board/layout';

const over = (a: Box, b: Box) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

function layoutAt(locId: string, w: number, h: number, zoom = 1) {
  const loc = LOCATIONS.find((l) => l.id === locId)!;
  const zones = loc.zones.filter((z) => !z.hidden);
  // the same fit as Board.tsx: stretch the schematic map to its frame
  const natural = fitView(zones, loc.aspect);
  const k = Math.round(Math.min(2, Math.max(0.6, h / w / (natural.h / natural.w))) * 20) / 20;
  const aspect = loc.aspect / k;
  const base = fitView(zones, aspect);
  const ppu = Math.round(Math.min((w * zoom) / base.w, (h * zoom) / base.h) * 20) / 20;
  return { lay: layoutBoard(loc, zones, edgesOf(zones), ppu, aspect), ppu };
}

function items(locId: string, w: number, h: number, zoom = 1) {
  const { lay, ppu } = layoutAt(locId, w, h, zoom);
  return [...lay.zones.values()].map((zl) => {
    const cx = zl.p.x * ppu;
    const cy = zl.p.y * ppu;
    return {
      id: zl.z.id,
      plate: { x: cx + zl.label.x, y: cy + zl.label.y, w: zl.label.w, h: zl.label.h },
      tile: { x: cx - zl.r, y: cy - zl.r, w: zl.r * 2, h: zl.r * 2 },
      pad: { x: cx + zl.pad.x, y: cy + zl.pad.y, w: zl.pad.w, h: zl.pad.h },
      slot: { x: cx + zl.slot.x, y: cy + zl.slot.y, w: zl.slot.w, h: zl.slot.h },
    };
  });
}

/** Overlaps worth noticing (more than a few px²): plates on plates or spaces, pads on plates or spaces. */
function collisions(locId: string, w: number, h: number, zoom = 1): { plates: string[]; pads: string[] } {
  const all = items(locId, w, h, zoom);
  const plates: string[] = [];
  const pads: string[] = [];
  for (const a of all)
    for (const b of all) {
      if (over(a.pad, b.plate) > 6) pads.push(`${a.id} pad on ${b.id} plate`);
      if (a.id === b.id) continue;
      if (a.id < b.id && over(a.plate, b.plate) > 6) plates.push(`${a.id} plate on ${b.id} plate`);
      if (over(a.plate, b.tile) > 30) plates.push(`${a.id} plate on ${b.id} space`);
      if (over(a.pad, b.tile) > 30) pads.push(`${a.id} pad on ${b.id} space`);
    }
  return { plates, pads };
}

/** The board's frame on iPhones (portrait 390 and 393 wide, Pro Max; landscape 844, 852, Pro Max, SE), a wide frame, and zoomed in. */
const SIZES: [string, number, number, number][] = [
  ['portrait', 350, 259, 1],
  ['portrait 393', 353, 255, 1],
  ['portrait Max', 390, 307, 1],
  ['landscape', 366, 347, 1],
  ['landscape 852', 347, 350, 1],
  ['landscape Max', 397, 387, 1],
  ['landscape SE', 285, 347, 1],
  ['wide', 470, 330, 1],
  ['portrait zoomed', 350, 259, 1.7],
  ['landscape zoomed', 366, 347, 1.7],
];

/**
 * Known tight spots where two plates touch, on the densest boards in the small
 * portrait frames; they may shrink, never grow. Pads have none: pieces never
 * stand on a name or another space.
 */
const KNOWN: Record<string, number> = { 'mapleLane portrait': 1, 'mapleLane portrait 393': 1, 'sacredGroves portrait 393': 2, 'creechManor landscape SE': 3 };

describe('board name plates and pawn pads', () => {
  for (const loc of LOCATIONS)
    for (const [name, w, h, zoom] of SIZES)
      it(`${loc.name}, ${name}`, () => {
        const { plates, pads } = collisions(loc.id, w, h, zoom);
        const allowed = KNOWN[`${loc.id} ${name}`] ?? 0;
        if (plates.length > allowed || pads.length) console.log(`${loc.id} ${name}: ${plates.length} plate, ${pads.length} pad\n  ${[...plates, ...pads].join('\n  ')}`);
        expect(plates.length).toBeLessThanOrEqual(allowed);
        expect(pads).toEqual([]);
      });
});
