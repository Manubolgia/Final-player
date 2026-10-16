// Mix & match: any killer, any location, any Final Girl. "Use this bill"
// puts the line-up on the box back as a custom bill.

import { useState } from 'react';
import { FINAL_GIRLS, KILLERS, LOCATIONS } from '../../game/content';
import { SheetFrame } from '../sheets/Sheet';
import { Heart } from '../pieces/icons';
import { GirlArt, KillerArt, PlaceArt } from '../art';
import { sfx } from '../fx/sound';
import { filmFor, girlOf, spaces, type Bill } from './bits';

export function MixSheet({ bill, onUse, onClose }: { bill: Bill; onUse: (b: Bill) => void; onClose: () => void }) {
  const [killer, setKiller] = useState(bill.killer);
  const [location, setLocation] = useState(bill.location);
  const [finalGirl, setFinalGirl] = useState(bill.finalGirl);
  const girl = girlOf(finalGirl);
  const tap = (fn: () => void) => () => {
    sfx.key();
    fn();
  };

  return (
    <SheetFrame title="Mix & match" tone="bone" scroll={false} className="vs-sheet" onClose={onClose}>
      <div className="mix">
        <div className="mix-scroll scroll-y">
          <section className="mix-sec">
            <h3 className="bb-h">Killer</h3>
            <div className="mix-grid" role="group" aria-label="Killer">
              {KILLERS.map((k) => (
                <button key={k.id} type="button" className="vs-chip killer" aria-pressed={k.id === killer} onClick={tap(() => setKiller(k.id))}>
                  <span className="tok art-tok">
                    <KillerArt id={k.id} crop="bust" />
                  </span>
                  <span className="nm">
                    {k.name}
                    <small>
                      {k.invulnerable ? (
                        "Can't be killed"
                      ) : (
                        <>
                          <Heart className="ico" /> {k.health}
                        </>
                      )}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mix-sec">
            <h3 className="bb-h">Location</h3>
            <div className="mix-grid" role="group" aria-label="Location">
              {LOCATIONS.map((l) => (
                <button key={l.id} type="button" className="vs-chip loc" aria-pressed={l.id === location} onClick={tap(() => setLocation(l.id))}>
                  <span className="tok art-tok">
                    <PlaceArt id={l.id} crop="bust" />
                  </span>
                  <span className="nm">
                    {l.name}
                    <small>{spaces(l)} spaces</small>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mix-sec">
            <h3 className="bb-h">Final Girl</h3>
            <div className="mix-grid" role="group" aria-label="Final Girl">
              {FINAL_GIRLS.map((g) => (
                <button key={g.id} type="button" className="vs-chip girl" aria-pressed={g.id === finalGirl} onClick={tap(() => setFinalGirl(g.id))}>
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
            <p className="slip mix-blurb">
              <b>{girl.name.toUpperCase()}.</b> {girl.blurb}
            </p>
          </section>
        </div>

        <div className="mix-foot">
          <button
            type="button"
            className="btn primary block"
            onClick={() => {
              sfx.slap();
              const f = filmFor({ killer, location, finalGirl });
              onUse({ film: f ? f.id : null, killer, location, finalGirl });
            }}
          >
            Use this bill
          </button>
        </div>
      </div>
    </SheetFrame>
  );
}
