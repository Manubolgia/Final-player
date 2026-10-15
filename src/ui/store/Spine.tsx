// One VHS tape on the shelf: the spine you read sideways in a video store.
// Lying flat in portrait (title across), standing up in landscape (title down).

import type { CSSProperties } from 'react';
import type { FilmDef } from '../../game/types';
import { Emblem } from '../pieces/icons';
import { haptic } from '../fx/haptics';
import { spineVars, titleParts } from './bits';

/** Stickers are slapped on by hand: each tape's sits at its own angle. */
const TILT = [5, -4, 3, -6, 4, -3];

export function Spine({ film, n, on, rented, fresh, onPick }: { film: FilmDef; n: number; on: boolean; rented: boolean; fresh: boolean; onPick: () => void }) {
  const [kicker, main] = titleParts(film);
  const style = {
    ...spineVars(film.id),
    '--len': Math.max(main.length, 6),
    '--tilt': `${TILT[(n - 1) % TILT.length]}deg`,
  } as CSSProperties;
  return (
    <button type="button" className={`film-card vs-spine${on ? ' on' : ''}${film.id === 'carnival' ? ' tent' : ''}`} style={style} aria-pressed={on} onClick={onPick} ref={haptic}>
      <span className="vs-cap">
        <span className="vs-disc">
          <Emblem name={film.killer.icon} className="vs-emblem" />
        </span>
      </span>
      <span className="vs-stripe" />
      <span className="vs-title">
        {kicker ? <span className="vs-kicker">{kicker}</span> : null}
        {kicker ? ' ' : null}
        <span className="vs-main">{main}</span>
      </span>
      <span className="vs-label num">#{String(n).padStart(2, '0')}</span>
      {rented ? <span className="sticker red vs-flag">Rented</span> : fresh ? <span className="sticker yellow vs-flag new">New</span> : null}
    </button>
  );
}
