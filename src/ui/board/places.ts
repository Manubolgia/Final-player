// What is printed inside each space: a small flat place icon (24-unit box),
// so a cabin reads as a cabin and a dock as a dock, like the real boards.

import type { ZoneDef } from '../../game/types';

export interface Glyph {
  d: string;
  /** Drawn as a 2-unit outline instead of a fill. */
  line?: boolean;
}

export const GLYPHS: Record<string, Glyph> = {
  house: { d: 'M3 11L12 3l9 8h-2v10h-5v-6h-4v6H5V11z' },
  cabin: { d: 'M1 12L12 3l11 9h-3v9H4v-9zm8 9h6v-6H9z' },
  shed: { d: 'M3 10l9-6 9 6v11H3zm5 11h8v-8H8z' },
  pines: { d: 'M8 2l5 7h-2.5l4 6H10v4H6v-4H1.5l4-6H3zm9 4l4.5 6.5h-2l3 4.5h-4v3h-3v-3h-1.5l2.5-4.5h-2z' },
  tree: { d: 'M12 1c5 0 8 3 8 7 0 3-2 5-5 6v8h-6v-8c-3-1-5-3-5-6 0-4 3-7 8-7z' },
  waves: { d: 'M2 8q2.5-3 5 0t5 0 5 0 5 0M2 13q2.5-3 5 0t5 0 5 0 5 0M2 18q2.5-3 5 0t5 0 5 0 5 0', line: true },
  pier: { d: 'M2 9h20v4H2zm2 4h2.5v8H4zm6 0h2.5v8H10zm6 0h2.5v8H16z' },
  reeds: { d: 'M6 22V9M12 22V5M18 22V10M6 9l-2-3M12 5l2-3M18 10l2-3M3 22h18', line: true },
  fire: { d: 'M12 1c1 5 7 7 7 13a7 7 0 01-14 0c0-3 2-5 3.5-7 0 3 1.5 4.5 3 4.5 0-3.5-1-7 .5-10.5zM3 22l18-3v2L3 24z' },
  flag: { d: 'M5 1h2.5v22H5zm2.5 1H20l-3 4.5L20 11H7.5z' },
  cliff: { d: 'M1 23V13l5-6 4 3 4-8 9 21z' },
  ball: { d: 'M12 2a10 10 0 110 20 10 10 0 010-20zM2.5 9.5c5 1 14 1 19 0M2.5 14.5c5-1 14-1 19 0M12 2v20', line: true },
  gate: { d: 'M2 22V8a10 6 0 0120 0v14h-3V10a7 4 0 00-14 0v12z' },
  signpost: { d: 'M10.5 2h3v20h-3zM3 4h13l3.5 3.5L16 11H3zm18 8H8l-3.5 3.5L8 19h13z' },
  stairs: { d: 'M2 22v-5h5v-5h5V7h5V2h5v20z' },
  bed: { d: 'M1 19V5h3v8h7V9h9a3 3 0 013 3v7h-3v-3H4v3zm4-9a2 2 0 104 0 2 2 0 00-4 0z' },
  bath: { d: 'M2 11h20v3a7 7 0 01-7 7H9a7 7 0 01-7-7zm2 0V5a3 3 0 016 0H7.5a.5.5 0 00-1 0v6zM6 21l-1 2M18 21l1 2' },
  tv: { d: 'M2 7h20v14H2zm3 3v8h14v-8zM7 2l5 4 5-4' },
  trophy: { d: 'M6 2h12v5a6 6 0 01-12 0zM2 3h4v3a3 3 0 01-4-3zm16 0h4a3 3 0 01-4 3zm-8 11h4v4h4v4H6v-4h4z' },
  book: { d: 'M2 4c4-1 7 0 9 2v16c-2-2-5-3-9-2zm20 0c-4-1-7 0-9 2v16c2-2 5-3 9-2z' },
  desk: { d: 'M2 10h20v3h-2v9h-3v-9H7v9H4v-9H2zm6-8l4 4-2 2-4-4zm3 3l3 5H8z' },
  hanger: { d: 'M12 6a2.5 2.5 0 10-2.5-2.5M12 6v2L2 16v2h20v-2L12 8', line: true },
  window: { d: 'M3 2h18v20H3zm3 3v6h5V5zm7 0v6h5V5zM6 13v6h5v-6zm7 0v6h5v-6z' },
  car: { d: 'M2 17v-5l3-6h14l3 6v5h-2.5a2.5 2.5 0 01-5 0h-5a2.5 2.5 0 01-5 0zm4-5h12l-1.6-3.5H7.6z' },
  curtain: { d: 'M1 2h22v3H1zm1 3c1 7 4 11 8 17H2zm20 0c-1 7-4 11-8 17h8z' },
  chandelier: { d: 'M11 1h2v5h-2zM4 9h16v2H4zm7-3h2v3h-2zM3 11h3v4H3zm7.5 0h3v5h-3zM18 11h3v4h-3zM2 17l2.5-2 2.5 2zm7.5 1l2.5-2 2.5 2zm7.5-1l2.5-2 2.5 2z' },
  ladder: { d: 'M6 1v22M18 1v22M6 5h12M6 10h12M6 15h12M6 20h12', line: true },
  swing: { d: 'M2 2h20M6 2l2 16M18 2l-2 16M5 18h14v3H5z', line: true },
  roof: { d: 'M1 14L12 3l11 11h-4v8H5v-8zm8 2h6v-4H9z' },
  door: { d: 'M5 2h14v20H5zm9 9a1.3 1.3 0 100 2.6 1.3 1.3 0 000-2.6z' },
  heli: { d: 'M1 3h22v2H1zm10 2h2v3h-2zM5 9h11a5 5 0 015 5v1a3 3 0 01-3 3H8l-3-4H1v-3h4zM8 20h12v2H8z' },
  target: { d: 'M12 1a11 11 0 110 22 11 11 0 010-22zm0 4a7 7 0 100 14 7 7 0 000-14zm0 4a3 3 0 110 6 3 3 0 010-6z' },
  mirror: { d: 'M12 1a7 10 0 110 20 7 10 0 010-20zm0 3a4 7 0 100 14 4 7 0 000-14zM9 21h6v2H9z' },
  coaster: { d: 'M1 20c3-14 6-14 8-6s4 8 6-2 5-9 8-4M3 20v3M9 15v8M15 13v10M21 9v14', line: true },
  ticket: { d: 'M1 6h22v4a2 2 0 000 4v4H1v-4a2 2 0 000-4zm8 2v8h2V8z' },
  tent: { d: 'M12 1l11 21H1zm0 8l-5 13h10z' },
  pennant: { d: 'M1 4c7 3 15 3 22 0M3 5l2 7 3-6M10 6l2 7 2-7M16 6l3 6 2-7', line: true },
  cage: { d: 'M3 4h18v18H3zM8 4v18M13 4v18M18 4v18M3 1h18v3', line: true },
  ferris: { d: 'M12 2a8 8 0 110 16 8 8 0 010-16zM12 2v16M4 10h16M6.3 4.3l11.4 11.4M17.7 4.3L6.3 15.7M12 10l-5 13M12 10l5 13', line: true },
  popcorn: { d: 'M5 10h14l-2.5 13h-9zm0-1a3 3 0 013.5-4 3.5 3.5 0 017 0A3 3 0 0119 9z' },
  traffic: { d: 'M8 1h8v22H8zm4 3a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4z' },
  tower: { d: 'M2 9l10-8 10 8zm3 0h14v3H5zm2 3h3v11H7zm7 0h3v11h-3z' },
  tomb: { d: 'M5 23V10a7 7 0 0114 0v13zm6-14v8h2V9zm-2.5 2.5h7v2h-7z' },
  rocks: { d: 'M1 21l4-9 4 3 4-8 4 6 2-2 4 10z' },
  bridge: { d: 'M1 12h22v3H1zm2 3v7h3v-4a6 6 0 0112 0v4h3v-7z' },
  huts: { d: 'M1 13l6-6 6 6h-2v8H3v-8zm10 0l6-6 6 6h-2v8h-8z' },
  box: { d: 'M2 8l10-5 10 5v11l-10 5-10-5zm10 3L4.5 7.2 12 11l7.5-3.8z' },
  flower: { d: 'M12 6a3 3 0 113 3 3 3 0 11-3 3 3 3 0 11-3-3 3 3 0 113-3zm-1 7h2v10h-2zM5 23c0-4 3-6 7-6M19 23c0-4-3-6-7-6' },
  shrine: { d: 'M1 6h22v3H1zm2-4h18l-2 4H5zm2 7h3v13H5zm11 0h3v13h-3zM3 21h18v2H3z' },
  board: { d: 'M2 3h20v12H2zM5 15h3v8H5zm11 0h3v8h-3zM5 7h14v2H5zm0 3h10v2H5z' },
  steps: { d: 'M7 2c2 0 3 2 3 4.5S9 11 7 11 4 9 4 6.5 5 2 7 2zm-.5 10.5c1.5 0 2.5 1 2.5 2.5s-1 2.5-2.5 2.5S4 16.5 4 15s1-2.5 2.5-2.5zM17 7c2 0 3 2 3 4.5S19 16 17 16s-3-2-3-4.5S15 7 17 7zm-.5 10.5c1.5 0 2.5 1 2.5 2.5s-1 2.5-2.5 2.5S14 21.5 14 20s1-2.5 2.5-2.5z' },
};

const BY_LOCATION: Record<string, Record<string, string>> = {
  campHappyTrails: {
    nwWoods: 'pines', cabins: 'cabin', northTrail: 'signpost', entrance: 'gate', northWoods: 'pines', shed: 'shed', eastTrail: 'signpost',
    marsh: 'reeds', dock: 'pier', lake: 'waves', cliff: 'cliff', meetingPoint: 'flag', southTrail: 'steps', campfire: 'fire', lakeCabin: 'cabin', courts: 'ball',
  },
  creechManor: {
    attic: 'roof', tvRoom: 'tv', stairRoom: 'stairs', bedroom: 'bed', closet: 'hanger', leftBath: 'bath', rightBath: 'bath', trophy: 'trophy', study: 'book',
    stairHall: 'stairs', office: 'desk', dormitory: 'bed', landing: 'stairs', bayRoom: 'window', garage: 'car', curtainRoom: 'curtain', foyer: 'chandelier',
    ballroom: 'chandelier', outsideLeft: 'ladder', outsideRight: 'swing', helicopter: 'heli',
  },
  carnivalOfBlood: {
    entrance: 'gate', westPlaza: 'pennant', gallery: 'target', mirrors: 'mirror', clownCar: 'car', woods: 'pines', coaster: 'coaster', tickets: 'ticket',
    bigTop: 'tent', midway: 'pennant', southPath: 'steps', cages: 'cage', ferris: 'ferris', eastPlaza: 'pennant', popcorn: 'popcorn', oddities: 'tent',
  },
  mapleLane: { northSt: 'signpost', southSt: 'signpost', westSt: 'signpost', eastSt: 'signpost', crossroads: 'traffic' },
  sacredGroves: {
    lookout: 'tower', westWoods: 'pines', cemetery: 'tomb', rocks: 'rocks', shore: 'waves', village: 'huts', sacredTrees: 'tree', eastWoods: 'pines',
    bridge: 'bridge', lostFound: 'box', meadow: 'flower', shrine: 'shrine', welcome: 'board', swTrail: 'steps', southTrail: 'steps',
  },
};

/** The icon printed in a space, or null (exits carry their door badge instead). */
export function placeGlyph(locId: string, z: ZoneDef): Glyph | null {
  if (z.exit) return null;
  const k = BY_LOCATION[locId]?.[z.id] ?? (z.house ? 'house' : z.water ? 'waves' : null);
  return k ? GLYPHS[k] : null;
}
