// One VHS tape on the shelf: the spine you read sideways in a video store.
// Lying flat in portrait (title across), standing up in landscape (title down).

import type { CSSProperties } from 'react';
import type { FilmDef } from '../../game/types';
import { KillerArt } from '../art';
import { haptic } from '../fx/haptics';
import { spineVars, titleParts } from './bits';

/** Stickers are slapped on by hand: each tape's sits at its own angle. */
const TILT = [5, -4, 3, -6, 4, -3];

/** A long name in two balanced lines (for the standing spines), a short one in one. */
function lines(name: string): string[] {
  const w = name.split(' ');
  if (name.length <= 12 || w.length < 2) return [name];
  let best: string[] = [name];
  let worst = Infinity;
  for (let i = 1; i < w.length; i++) {
    const pair = [w.slice(0, i).join(' '), w.slice(i).join(' ')];
    const m = Math.max(pair[0].length, pair[1].length);
    if (m < worst) {
      worst = m;
      best = pair;
    }
  }
  return best;
}

export function Spine({ film, n, on, rented, fresh, onPick }: { film: FilmDef; n: number; on: boolean; rented: boolean; fresh: boolean; onPick: () => void }) {
  const [kicker, main] = titleParts(film);
  const rows = lines(main);
  const style = {
    ...spineVars(film.id),
    '--len': Math.max(main.length, 6),
    '--col': Math.max(...rows.map((r) => r.length), 5),
    '--rows': rows.length,
    '--tilt': `${TILT[(n - 1) % TILT.length]}deg`,
  } as CSSProperties;
  return (
    <button type="button" className={`film-card vs-spine${on ? ' on' : ''}${film.id === 'carnival' ? ' tent' : ''}`} style={style} aria-pressed={on} onClick={onPick} ref={haptic}>
      <span className="vs-cap">
        <KillerArt id={film.killer.id} crop="bust" className="vs-cover" />
      </span>
      <span className="vs-stripe" />
      <span className="vs-title">
        {kicker ? <span className="vs-kicker">{kicker}</span> : null}
        {kicker ? ' ' : null}
        <span className="vs-main">
          {rows.map((r, i) => (
            <span key={r} className="ln">
              {i ? ' ' : null}
              {r}
            </span>
          ))}
        </span>
      </span>
      <span className="vs-label num">#{String(n).padStart(2, '0')}</span>
      {rented ? <span className="sticker red vs-flag">Rented</span> : fresh ? <span className="sticker yellow vs-flag new">New</span> : null}
    </button>
  );
}
