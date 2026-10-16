// Look-and-feel data per film and location: board inks, VHS spine colours,
// special-victim meeple colours. Kept out of the rules content on purpose.

import type { CSSProperties } from 'react';
import { card } from '../game/content/core';
import type { CardId } from '../game/types';
import type { GameState } from '../game';

export interface BoardInk {
  ground: string;
  water: string;
  decor: string;
  house: string;
  trail: string;
  street: string;
  accent: string;
  event: string;
  eventInk: string;
  groundFinale: string;
  decorKind: 'pine' | 'planks' | 'pennant' | 'hedge' | 'grove' | 'none';
  /** Printed space tiles and the place icons on them. */
  tile: string;
  icon: string;
  /** Landmarks: tree masses, lawns, sidewalks, room floors, midway lanes, stone, roofs. */
  forest: string;
  lawn: string;
  walk: string;
  floor: string;
  lane: string;
  stone: string;
  roof: string;
  /** How trails are printed (dirt with pebbles, corridor boards, boardwalk planks, sidewalk slabs), and the seam ink. */
  path: 'dirt' | 'boards' | 'planks' | 'walk';
  seam: string;
}

const INK: Record<string, BoardInk> = {
  campHappyTrails: {
    ground: '#4e6b3e',
    water: '#2e5a6b',
    decor: '#2f4a32',
    house: '#6b4423',
    trail: '#c9b98f',
    street: '#6e6a66',
    accent: '#e07a2e',
    event: '#c9b98f',
    eventInk: '#141213',
    groundFinale: '#2c3d2a',
    decorKind: 'pine',
    tile: '#e6d6a8',
    icon: '#6b5434',
    forest: '#2f4a32',
    lawn: '#5e7e48',
    walk: '#efe6d2',
    floor: '#6b4423',
    lane: '#c9b98f',
    stone: '#9c9384',
    roof: '#6b4423',
    path: 'dirt',
    seam: '#9a8760',
  },
  creechManor: {
    ground: '#5a3a5e',
    water: '#3b2140',
    decor: '#4a2d50',
    house: '#5f3d65',
    trail: '#ede3d1',
    street: '#6e6a66',
    accent: '#d9a441',
    event: '#7a4f7f',
    eventInk: '#efe6d2',
    groundFinale: '#3b2140',
    decorKind: 'none',
    tile: '#e3d2df',
    icon: '#5a3a5e',
    forest: '#3b2140',
    lawn: '#4a2d50',
    walk: '#ede3d1',
    floor: '#6f4a75',
    lane: '#ede3d1',
    stone: '#7a4f7f',
    roof: '#3b2140',
    path: 'boards',
    seam: '#c4b59c',
  },
  carnivalOfBlood: {
    ground: '#c49a6c',
    water: '#2e5a6b',
    decor: '#c8272d',
    house: '#c8272d',
    trail: '#b98a54',
    street: '#6e6a66',
    accent: '#f2b705',
    event: '#f2b705',
    eventInk: '#141213',
    groundFinale: '#8e6a44',
    decorKind: 'pennant',
    tile: '#f4e3b6',
    icon: '#8e2a22',
    forest: '#7a5634',
    lawn: '#c49a6c',
    walk: '#f4e3b6',
    floor: '#c49a6c',
    lane: '#dcba88',
    stone: '#b98a54',
    roof: '#c8272d',
    path: 'planks',
    seam: '#6e4a2a',
  },
  mapleLane: {
    ground: '#5e8c3a',
    water: '#2e5a6b',
    decor: '#3c5a2e',
    house: '#a44a3f',
    trail: '#e6e0d3',
    street: '#6e6a66',
    accent: '#9e2b25',
    event: '#a44a3f',
    eventInk: '#efe6d2',
    groundFinale: '#3e5e28',
    decorKind: 'hedge',
    tile: '#ece3cf',
    icon: '#3c5a2e',
    forest: '#3c5a2e',
    lawn: '#6c9a44',
    walk: '#d6cfc0',
    floor: '#ece3cf',
    lane: '#d6cfc0',
    stone: '#d6cfc0',
    roof: '#a44a3f',
    path: 'walk',
    seam: '#b0a898',
  },
  sacredGroves: {
    ground: '#c47f2c',
    water: '#2b6e6a',
    decor: '#1f4d3a',
    house: '#b8a88a',
    trail: '#8e3b23',
    street: '#6e6a66',
    accent: '#8e3b23',
    event: '#b8a88a',
    eventInk: '#141213',
    groundFinale: '#8e5a1f',
    decorKind: 'none',
    tile: '#ecdbb1',
    icon: '#6b3a1f',
    forest: '#1f4d3a',
    lawn: '#c47f2c',
    walk: '#ecdbb1',
    floor: '#b8a88a',
    lane: '#b8a88a',
    stone: '#c9b998',
    roof: '#8e3b23',
    path: 'dirt',
    seam: '#c26a45',
  },
};
const DREAM: Partial<BoardInk> = {
  tile: '#d9b48c',
  icon: '#5c3418',
  ground: '#8a4b24',
  water: '#5c3418',
  decor: '#5c3418',
  house: '#5c3418',
  trail: '#c9b98f',
  street: '#5c3418',
  accent: '#a9b04a',
  event: '#a9b04a',
  eventInk: '#141213',
  groundFinale: '#5a3218',
  forest: '#5c3418',
  lawn: '#9a5a2e',
  walk: '#c9b98f',
  floor: '#9a5a2e',
  lane: '#c9b98f',
  stone: '#c9b98f',
  roof: '#5c3418',
  seam: '#8a6a44',
};
/**
 * The Birds: an overcast, washed-out print (no killer on the board, just the
 * flock), slate water and charcoal woods, power lines strung with crows.
 */
const BIRDS: Partial<BoardInk> = {
  tile: '#efe9dc',
  icon: '#3a434c',
  ground: '#b4ad9e',
  water: '#5d6a72',
  decor: '#4a4643',
  house: '#6f6a64',
  trail: '#e9e4d8',
  street: '#5f5b57',
  accent: '#b3161b',
  event: '#e9e6df',
  eventInk: '#141213',
  groundFinale: '#8a8476',
  decorKind: 'none',
  forest: '#4a4643',
  lawn: '#a39c8c',
  walk: '#d9d3c6',
  floor: '#cdc6b6',
  lane: '#cdc6b6',
  stone: '#cdc6b6',
  roof: '#4a4643',
  seam: '#a39c8c',
};

export function boardInk(g: GameState): BoardInk {
  const base = INK[g.config.location] ?? INK.campHappyTrails;
  if (g.config.killer === 'birds') return { ...base, ...BIRDS };
  if (g.film.maple?.asleep) return { ...base, ...DREAM };
  return base;
}

export function boardVars(g: GameState): CSSProperties {
  const k = boardInk(g);
  return {
    '--ground': g.killer.finaleRevealed ? k.groundFinale : k.ground,
    '--water': k.water,
    '--decor': k.decor,
    '--house': k.house,
    '--trail': k.trail,
    '--street': k.street,
    '--accent': k.accent,
    '--event': k.event,
    '--event-ink': k.eventInk,
  } as CSSProperties;
}

export interface Spine {
  bg: string;
  title: string;
  stripe: string;
  icon: string;
  short: string;
}

export const SPINES: Record<string, Spine> = {
  happyTrails: { bg: '#2f4a32', title: '#efe6d2', stripe: '#e07a2e', icon: 'hammer', short: 'HAPPY TRAILS' },
  creech: { bg: '#3b2140', title: '#efe6d2', stripe: '#d9a441', icon: 'ghost', short: 'CREECH MANOR' },
  carnival: { bg: '#c8272d', title: '#f4e9d0', stripe: '#f2b705', icon: 'puppet', short: 'CARNIVAL' },
  maple: { bg: '#3c5a2e', title: '#f1ede4', stripe: '#9e2b25', icon: 'pitchfork', short: 'MAPLE LANE' },
  groves: { bg: '#8e3b23', title: '#f4e9d0', stripe: '#c47f2c', icon: 'serpent', short: 'SACRED GROVES' },
  terror: { bg: '#e9e6df', title: '#1a1a1d', stripe: '#b3161b', icon: 'bird', short: 'TERROR FROM ABOVE' },
};

export const ROLE_COLOR: Record<string, string> = {
  girlfriend: 'var(--sv-white)',
  sister: 'var(--sv-white)',
  superTourist: 'var(--sv-white)',
  ghostHunter: 'var(--sv-white)',
  survivor: 'var(--sv-white)',
  boyfriend: 'var(--sv-blue)',
  mlBoyfriend: 'var(--sv-blue)',
  fiance: 'var(--sv-blue)',
  holyMan: 'var(--sv-blue)',
  cursed: 'var(--sv-orange)',
  werewolf: 'var(--sv-orange)',
  smalley: 'var(--sv-orange)',
  tourGuide: 'var(--sv-green)',
};
export const ROLE_HEX: Record<string, string> = {
  girlfriend: '#f4f1ea',
  sister: '#f4f1ea',
  superTourist: '#f4f1ea',
  ghostHunter: '#f4f1ea',
  survivor: '#f4f1ea',
  boyfriend: '#3a7bd5',
  mlBoyfriend: '#3a7bd5',
  fiance: '#3a7bd5',
  holyMan: '#3a7bd5',
  cursed: '#e8742a',
  werewolf: '#e8742a',
  smalley: '#e8742a',
  tourGuide: '#5e9c4a',
};
export const victimHex = (role?: string): string => (role ? ROLE_HEX[role] ?? '#f4f1ea' : '#f2c230');

export type Glyph = 'shield' | 'knife' | 'boot' | 'eye' | 'heart' | 'wrench' | 'hourglass' | 'card';

/** The spine icon of an action card, from the first effect its results mention. */
export function cardGlyph(id: CardId): Glyph {
  const c = card(id);
  if (c.timing === 'reaction') return 'shield';
  const r = c.results;
  if (!r) return 'card';
  const all = [...(r.triple ?? []), ...r.double, ...r.single, ...r.fail].flat(2);
  if (all.some((e) => e.k === 'damage')) return 'knife';
  if (all.some((e) => e.k === 'move')) return 'boot';
  if (all.some((e) => e.k === 'horror' && e.n < 0)) return 'eye';
  if (all.some((e) => e.k === 'heal')) return 'heart';
  if (all.some((e) => e.k === 'search' || e.k === 'itemAny')) return 'wrench';
  if (all.some((e) => e.k === 'time')) return 'hourglass';
  return 'card';
}

/** Phase names for the tape counter and the VCR bar. */
export const PHASE_SHORT = { setup: 'SETUP', action: 'ACT', planning: 'PLAN', killer: 'KILL', panic: 'PANIC', upkeep: 'UPKP' } as const;
export const PHASE_NAME = { setup: 'Setup', action: 'Action', planning: 'Planning', killer: 'Killer', panic: 'Panic', upkeep: 'Upkeep' } as const;
