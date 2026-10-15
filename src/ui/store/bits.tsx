// Small printed pieces shared by the video store: the tick box, the rating
// badge, the VHS bill helpers and the orientation hook.

import { useCallback, useSyncExternalStore, type CSSProperties } from 'react';
import { FILMS, FINAL_GIRLS, KILLERS, LOCATIONS, homeLocation } from '../../game/content';
import type { FilmDef, FinalGirlDef, KillerDef, LocationDef } from '../../game/types';
import type { GameConfig } from '../../game';
import { SPINES } from '../film';

/** The store's landscape layout (box back always on the right). */
export const WIDE = '(orientation: landscape) and (min-width: 600px)';

export function useMedia(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      if (typeof matchMedia === 'undefined') return () => {};
      const m = matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => (typeof matchMedia === 'undefined' ? false : matchMedia(query).matches),
    () => false,
  );
}

/** What's on the bill: a film from the shelf, or a mix-and-match (film null). */
export interface Bill {
  film: string | null;
  killer: string;
  location: string;
  finalGirl: string;
}

type Pick3 = Pick<GameConfig, 'killer' | 'location' | 'finalGirl'>;

/** The shelf film this exact line-up is, if any. */
export function filmFor(c: Partial<Pick3>): FilmDef | undefined {
  return FILMS.find((f) => f.killer.id === c.killer && (!f.location || f.location.id === c.location) && f.finalGirls.some((g) => g.id === c.finalGirl));
}

/** The film a config was "rented" from: the killer's own film. */
export function filmIdFor(c: Partial<Pick<GameConfig, 'killer'>>): string | undefined {
  return FILMS.find((f) => f.killer.id === c.killer)?.id;
}

export const killerOf = (id: string): KillerDef => KILLERS.find((k) => k.id === id) ?? KILLERS[0];
export const locationOf = (id: string): LocationDef => LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0];
export const girlOf = (id: string): FinalGirlDef => FINAL_GIRLS.find((g) => g.id === id) ?? FINAL_GIRLS[0];
export const spaces = (l: LocationDef): number => l.zones.filter((z) => !z.hidden).length;

/** A film's default bill (its first Final Girl at its own location). */
export function filmBill(f: FilmDef, keep?: Partial<Bill>): Bill {
  const girl = keep?.finalGirl && f.finalGirls.some((g) => g.id === keep.finalGirl) ? keep.finalGirl : f.finalGirls[0].id;
  const location = f.location ? f.location.id : keep?.location && LOCATIONS.some((l) => l.id === keep.location) ? keep.location : homeLocation(f).id;
  return { film: f.id, killer: f.killer.id, location, finalGirl: girl };
}

/** Where the store opens: the last bill played, else the first film. */
export function firstBill(last?: Partial<GameConfig>): Bill {
  const ok = last && KILLERS.some((k) => k.id === last.killer) && LOCATIONS.some((l) => l.id === last.location) && FINAL_GIRLS.some((g) => g.id === last.finalGirl);
  if (!ok) return filmBill(FILMS[0]);
  const f = filmFor(last);
  return { film: f ? f.id : null, killer: last.killer!, location: last.location!, finalGirl: last.finalGirl! };
}

/** Spine title split into a small kicker and the big words. */
const SPLIT: Record<string, [string, string]> = {
  happyTrails: ['The', 'Happy Trails Horror'],
  creech: ['The Haunting of', 'Creech Manor'],
  carnival: ['Carnage at the', 'Carnival'],
  maple: ['Frightmare on', 'Maple Lane'],
  groves: ['Slaughter in the', 'Groves'],
  terror: ['', 'Terror from Above'],
};
export function titleParts(f: FilmDef): [string, string] {
  const s = SPLIT[f.id];
  return s && `${s[0]} ${s[1]}`.trim() === f.name ? s : ['', f.name];
}

/** CSS variables for a film's spine colours (custom bills print on black). */
export function spineVars(filmId: string | null): CSSProperties {
  const s = filmId ? SPINES[filmId] : undefined;
  return {
    '--sp-bg': s?.bg ?? '#1e1a1b',
    '--sp-ink': s?.title ?? '#efe6d2',
    '--sp-stripe': s?.stripe ?? '#d4a12a',
  } as CSSProperties;
}

/** A printed tick box: bone square, ink border, chunky ink tick. */
export function TickBox({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="vs-tickbox" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#efe6d2" stroke="#141213" strokeWidth="2.5" />
      {on ? <path d="M5.8 12.6l4.1 4.3L18.6 6.4" fill="none" stroke="#141213" strokeWidth="3.4" strokeLinecap="square" strokeLinejoin="miter" /> : null}
    </svg>
  );
}

/** A little barcode, as printed on the back of every rental box. */
export function Barcode({ seed }: { seed: string }) {
  let h = 7;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const bars: [number, number][] = [];
  let x = 0;
  for (let i = 0; i < 26 && x < 92; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const w = 1 + ((h >>> 8) % 3);
    if (i % 2 === 0 || i < 2) bars.push([x, w]);
    x += w + 1;
  }
  return (
    <svg viewBox="0 0 96 28" className="vs-barcode" aria-hidden="true">
      {bars.map(([bx, w], i) => (
        <rect key={i} x={bx + 2} y={0} width={w} height={i % 5 === 0 ? 28 : 23} fill="#141213" />
      ))}
    </svg>
  );
}
