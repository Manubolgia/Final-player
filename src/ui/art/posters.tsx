// The poster art set: flat-ink VHS-sleeve illustrations of every killer,
// Final Girl and location, as inline SVG that scales to its container.
//
//   <KillerArt id="hans" />                      the whole 4:5 poster, cropped to fit
//   <KillerArt id="hans" crop="face" />          the head, for 56 px strip chips
//   <GirlArt id="laurie" fit="meet" />           letterboxed instead of cropped
//   <PlaceArt id="creechManor" crop="focus" />   the landmark, square-ish
//   <PlaceArt id="mapleLane" tone="night" />     printed bone-on-black
//
// Characters are 240 × 300 units (crops: `poster`, `face`); places are
// 400 × 200 (crops: `wide`, `focus`, `band`). The svg fills its box
// (width/height 100%), so size it with the container.

import { ArtFrame, type ArtProps, type Piece } from './kit';
import { KILLER_ART } from './killers';
import { GIRL_ART } from './girls';
import { PLACE_ART } from './places';

export type { ArtProps, Tone, Fit } from './kit';

export type CharacterCrop = 'poster' | 'face';
export type PlaceCrop = 'wide' | 'focus' | 'band';

function pick(set: Record<string, Piece>, id: string): Piece | undefined {
  return set[id];
}

/** A killer's poster bust. Unknown ids draw nothing. */
export function KillerArt({ id, crop, ...rest }: Omit<ArtProps, 'crop'> & { id: string; crop?: CharacterCrop }) {
  const piece = pick(KILLER_ART, id);
  return piece ? <ArtFrame piece={piece} crop={crop} {...rest} /> : null;
}

/** A Final Girl's poster bust. Unknown ids draw nothing. */
export function GirlArt({ id, crop, ...rest }: Omit<ArtProps, 'crop'> & { id: string; crop?: CharacterCrop }) {
  const piece = pick(GIRL_ART, id);
  return piece ? <ArtFrame piece={piece} crop={crop} {...rest} /> : null;
}

/** A location's establishing vignette (wide). Unknown ids draw nothing. */
export function PlaceArt({ id, crop, ...rest }: Omit<ArtProps, 'crop'> & { id: string; crop?: PlaceCrop }) {
  const piece = pick(PLACE_ART, id);
  return piece ? <ArtFrame piece={piece} crop={crop} {...rest} /> : null;
}

/** Which ids have art (for fallbacks). */
export const hasKillerArt = (id: string): boolean => id in KILLER_ART;
export const hasGirlArt = (id: string): boolean => id in GIRL_ART;
export const hasPlaceArt = (id: string): boolean => id in PLACE_ART;
