// The back of the VHS box: who's starring, how nasty, and the big red key.
// A bottom sheet in portrait, the always-open right panel in landscape.

import { useLayoutEffect, useRef } from 'react';
import { BONUS_ITEMS, FILMS, LOCATIONS } from '../../game/content';
import { Heart, Play } from '../pieces/icons';
import { GirlArt, KillerArt, PlaceArt } from '../art';
import { haptic } from '../fx/haptics';
import { sfx } from '../fx/sound';
import { Barcode, FlipToken, girlOf, killerOf, locationOf, spaces, spineVars, titleParts, type Bill } from './bits';

export interface BoxBackProps {
  bill: Bill;
  board: 'normal' | 'extreme';
  epic: boolean;
  bonus: boolean;
  setBill: (b: Bill) => void;
  setBoard: (b: 'normal' | 'extreme') => void;
  setEpic: (on: boolean) => void;
  setBonus: (on: boolean) => void;
  onStart: () => void;
  /** Landscape panel only: the box back carries the Mix & match key. */
  onMix?: () => void;
  /** Printed inside a Sheet (which shows the film name as its title). */
  inSheet?: boolean;
}

const key = () => sfx.key();

export function BoxBack(p: BoxBackProps) {
  const { bill, inSheet } = p;
  const film = bill.film ? FILMS.find((f) => f.id === bill.film) : undefined;
  const killer = killerOf(bill.killer);
  const location = locationOf(bill.location);
  const girl = girlOf(bill.finalGirl);
  const cast = film ? film.finalGirls : [girl];
  const name = film ? film.name : 'Custom bill';
  const [kicker, main] = film ? titleParts(film) : ['', name];
  const tagline = film ? film.tagline : 'Your own double feature: any killer, any place, any girl.';
  const roaming = !!film && !film.location;
  const hasEpic = killer.darkPowers.some((d) => d.epic);
  const signature = BONUS_ITEMS.find((i) => i.onlyFor === girl.id);
  const locs = useRef<HTMLDivElement>(null);

  // keep the picked location chip in view (it can sit off the end of the row)
  useLayoutEffect(() => {
    const row = locs.current;
    const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !chip) return;
    const left = chip.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft || left + chip.offsetWidth > row.scrollLeft + row.clientWidth) row.scrollLeft = Math.max(0, left - 8);
  }, [bill.location, roaming]);

  return (
    <section className={`boxback${inSheet ? ' in-sheet' : ' stock'}`} style={spineVars(film ? film.id : null)} aria-label={`${name}: box back`}>
      <header className="bb-head">
        <PlaceArt id={location.id} crop="band" className="bb-place" />
        {inSheet ? null : (
          <h2 className="bb-name">
            {kicker ? <span className="k">{kicker}</span> : null}
            {kicker ? ' ' : null}
            <span className="m">{main}</span>
          </h2>
        )}
        <span className="bb-cover">
          <KillerArt id={killer.id} crop="bust" title={killer.name} />
        </span>
      </header>

      <div className="bb-body scroll-y">
        <p className="bb-tag">{tagline}</p>
        <p className="bb-match">
          <b>
            {killer.name}
            {killer.title ? <span className="ttl"> · {killer.title}</span> : null}
          </b>{' '}
          vs{' '}
          <b>
            {location.name} · {spaces(location)} spaces
          </b>
        </p>

        {roaming ? (
          <div className="bb-row">
            <h3 className="bb-h">Location</h3>
            <div className="bb-locs scroll-x" role="group" aria-label="Location" ref={locs}>
              {LOCATIONS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="vs-chip loc"
                  aria-pressed={l.id === bill.location}
                  onClick={() => {
                    key();
                    p.setBill({ ...bill, location: l.id });
                  }}
                >
                  <span className="tok art-tok">
                    <PlaceArt id={l.id} crop="bust" />
                  </span>
                  <span className="nm">{l.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="bb-row">
          <h3 className="bb-h">Starring</h3>
          <div className={`bb-cast${cast.length === 1 ? ' solo' : ''}`} role="group" aria-label="Final Girl">
            {cast.map((g) => (
              <button
                key={g.id}
                type="button"
                className="vs-chip girl"
                aria-pressed={g.id === bill.finalGirl}
                onClick={() => {
                  key();
                  p.setBill({ ...bill, finalGirl: g.id });
                }}
              >
                <span className="tok art-tok">
                  <GirlArt id={g.id} crop="bust" />
                </span>
                <span className="nm">{g.name}</span>
                <span className="hp num">
                  <Heart className="ico" />
                  {g.health}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bb-row bb-rating">
          <h3 className="bb-h">Rating</h3>
          <div className="vs-seg" role="group" aria-label="Rating">
            <button
              type="button"
              aria-pressed={p.board === 'normal'}
              onClick={() => {
                key();
                p.setBoard('normal');
              }}
            >
              <span className="lbl">Normal</span>
              <span className="vs-rated">R</span>
            </button>
            <button
              type="button"
              aria-pressed={p.board === 'extreme'}
              onClick={() => {
                key();
                p.setBoard('extreme');
              }}
            >
              <span className="lbl">Extreme horror</span>
              <span className="vs-unrated">Unrated</span>
            </button>
          </div>
        </div>

        <div className="bb-toggles">
          <button
            type="button"
            className="vs-toggle"
            aria-pressed={hasEpic && p.epic}
            disabled={!hasEpic}
            onClick={() => {
              key();
              p.setEpic(!p.epic);
            }}
          >
            <FlipToken on={hasEpic && p.epic} />
            <span className="txt">
              <span className="lbl">Epic Dark Power</span>
              <small>{hasEpic ? 'The nastier one' : `None for ${killer.name}`}</small>
            </span>
          </button>
          <button
            type="button"
            className="vs-toggle"
            aria-pressed={!!signature && p.bonus}
            disabled={!signature}
            onClick={() => {
              key();
              p.setBonus(!p.bonus);
            }}
          >
            <FlipToken on={!!signature && p.bonus} />
            <span className="txt">
              <span className="lbl">Signature items</span>
              <small>{signature ? signature.name : `None for ${girl.name}`}</small>
            </span>
          </button>
        </div>

        {inSheet ? (
          <div className="bb-fine">
            <Barcode seed={name} />
            <span>1 player · 30–60 min · Color · Hi-fi stereo</span>
          </div>
        ) : null}
      </div>

      <footer className="bb-foot">
        <div className="bb-keys">
          {p.onMix ? (
            <button
              type="button"
              className="btn bb-mix"
              onClick={() => {
                key();
                p.onMix?.();
              }}
            >
              Mix &amp; match
            </button>
          ) : null}
          <button type="button" className="btn primary bb-start" ref={haptic} onClick={p.onStart}>
            <span className="row1">
              <Play className="glyph" />
              Start the night
            </span>
          </button>
        </div>
      </footer>
    </section>
  );
}
