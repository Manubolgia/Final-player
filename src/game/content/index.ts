import type { FilmDef, FinalGirlDef, ItemDef, KillerDef, LocationDef } from '../types';
import { CARNIVAL } from './carnival';
import { CREECH } from './creech';
import { GROVES } from './groves';
import { HAPPY_TRAILS } from './happyTrails';

export const FILMS: FilmDef[] = [HAPPY_TRAILS, CREECH, CARNIVAL, GROVES];

export const KILLERS: KillerDef[] = FILMS.map((f) => f.killer);
export const LOCATIONS: LocationDef[] = FILMS.map((f) => f.location);
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
