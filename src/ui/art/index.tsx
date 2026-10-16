// The poster art, by id: KillerArt, GirlArt and PlaceArt print a drawing (or
// one of its crops) as inline SVG. Unknown ids fall back to the first drawing.

import { Art, type ArtProps, type Drawing } from './kit';
import './art.css';
import { KILLER_ART } from './killers';
import { GIRL_ART } from './girls';
import { PLACE_ART } from './places';

export type { Crop } from './kit';
export { KILLER_ART, GIRL_ART, PLACE_ART };

type ByIdProps = Omit<ArtProps, 'd'> & { id: string };

const pick = (set: Record<string, Drawing>, id: string): Drawing => set[id] ?? Object.values(set)[0];

export const KillerArt = ({ id, ...p }: ByIdProps) => <Art d={pick(KILLER_ART, id)} {...p} />;
export const GirlArt = ({ id, ...p }: ByIdProps) => <Art d={pick(GIRL_ART, id)} {...p} />;
export const PlaceArt = ({ id, ...p }: ByIdProps) => <Art d={pick(PLACE_ART, id)} {...p} />;

/**
 * The killer of the game on the table. The Killer strip sets it as it mounts,
 * so pieces that are not handed the game (a reveal card, a title card) can
 * still print the right silhouette.
 */
let onTable = '';
export const setTableKiller = (id: string): void => {
  onTable = id;
};
export const tableKiller = (): string => onTable;

/** The band across the top of a Terror or Finale card: the killer's poster, cropped wide. */
export function RevealArt({ killer }: { killer?: string }) {
  const id = killer || tableKiller();
  if (!id) return null;
  return (
    <div className="rc-art" aria-hidden="true">
      <KillerArt id={id} crop="band" />
    </div>
  );
}
