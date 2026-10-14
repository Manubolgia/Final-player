import type { FilmDef, FinalGirlDef, ItemDef, KillerDef, LocationDef } from '../types';
import { BIRDS } from './birds';
import { CARNIVAL } from './carnival';
import { CREECH } from './creech';
import { GROVES } from './groves';
import { HAPPY_TRAILS } from './happyTrails';
import { MAPLE } from './maple';

export const FILMS: FilmDef[] = [HAPPY_TRAILS, CREECH, CARNIVAL, MAPLE, GROVES, BIRDS];

export const KILLERS: KillerDef[] = FILMS.map((f) => f.killer);
export const LOCATIONS: LocationDef[] = FILMS.flatMap((f) => (f.location ? [f.location] : []));
export const FINAL_GIRLS: FinalGirlDef[] = FILMS.flatMap((f) => f.finalGirls);
export const BONUS_ITEMS: ItemDef[] = FILMS.flatMap((f) => f.bonusItems);

function find<T extends { id: string }>(list: T[], id: string, what: string): T {
  const x = list.find((e) => e.id === id);
  if (!x) throw new Error(`Unknown ${what}: ${id}`);
  return x;
}

export const killerDef = (id: string): KillerDef => find(KILLERS, id, 'killer');
export const locationDef = (id: string): LocationDef => find(LOCATIONS, id, 'location');
export const finalGirlDef = (id: string): FinalGirlDef => find(FINAL_GIRLS, id, 'final girl');
export const filmOf = (filmId: string): FilmDef => find(FILMS, filmId, 'film');

/** Where a film is played by default (a vignette borrows the first location). */
export const homeLocation = (f: FilmDef): LocationDef => f.location ?? LOCATIONS[0];
