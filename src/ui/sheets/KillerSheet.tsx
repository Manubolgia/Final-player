// The Killer board, printed on black stock: Bloodlust ladder, his action,
// Dark Power, Finale, minor powers, minions, film extras, cards in play.

import type { GameState } from '../../game';
import { killerDef, locationDef } from '../../game/content';
import { eventDef, terrorDef, zoneName } from '../../game/engine/kernel';
import { boilerView } from '../../game/films/maple';
import type { KillerDef, LocationDef, WrathDef } from '../../game/types';
import type { DisplayView } from '../game/display';
import { Boot, Bolt, CardIcon, Crow, Emblem, Heart, Knife, Puppet, Question, Sacred, Scroll, Splat, Zoom } from '../pieces/icons';
import { ActionSteps, cap, effectWords, FinalCoin, Head, Pips, Rich, Thumb } from './bits';
import { Sheet } from './Sheet';

type Names = { killer: string; minions?: string };

export function KillerSheet({ g, view, onClose, onReveal }: { g: GameState; view: DisplayView; onClose: () => void; onReveal: (deck: 'terror' | 'event', id: string) => void }) {
  const k = killerDef(g.config.killer);
  const loc = locationDef(g.config.location);
  const fin = k.finales.find((f) => f.id === g.killer.finale);
  const names: Names = { killer: k.name, minions: k.minion?.plural };
  const action = g.killer.finaleRevealed && fin ? [...(fin.minionAction ?? []), ...fin.action] : [...(k.minionAction ?? []), ...k.action];
  const inPlay = g.activeEvents.length + g.activeTerror.length;

  return (
    <Sheet title={k.name} tone="black" onClose={onClose}>
      <div className="ks">
        <Nameplate g={g} k={k} view={view} />

        <section className="sec">
          <Head icon={<Splat className="ico" />} right={<span className="vcr">{view.bl + 1}/{k.bloodlust.length}</span>}>
            Bloodlust
          </Head>
          <Ladder k={k} loc={loc} bl={view.bl} names={names} />
        </section>

        <section className="sec">
          <Head icon={<Knife className="ico" />}>{g.killer.finaleRevealed ? 'Finale action' : 'Killer action'}</Head>
          <div className={`kcard${g.killer.finaleRevealed ? ' fin' : ''}`}>
            <div className="kc-band">
              <span>Each Killer Phase</span>
              {g.killer.finaleRevealed && fin ? <span className="kc-fin">{fin.name}</span> : null}
            </div>
            <ActionSteps list={action} names={names} />
            {!k.bodiless && !g.killer.finaleRevealed ? (
              <p className="kc-note">
                Each <Boot className="ico" /> move: up to {k.bloodlust[view.bl]?.move ?? 1} space{(k.bloodlust[view.bl]?.move ?? 1) === 1 ? '' : 's'}. Each <Knife className="ico" /> attack: {k.bloodlust[view.bl]?.attack ?? 1} damage.
              </p>
            ) : null}
          </div>
        </section>

        <section className="sec">
          <Head icon={<span className="dia" aria-hidden="true" />}>Dark Power</Head>
          {g.killer.darkPowers.map((d) => {
            const def = k.darkPowers.find((x) => x.id === d.id);
            if (!def) return null;
            return d.revealed ? (
              <div className="crow" key={d.id}>
                <Thumb kind="darkPowerUp" />
                <div className="ct">
                  <b className="cn">{def.name}</b>
                  <p>
                    <Rich text={def.text.replace(/^Epic\.\s*/, '')} />
                  </p>
                </div>
                {def.epic ? <span className="sticker sm gold tag">Epic</span> : null}
              </div>
            ) : (
              <div className="crow down" key={d.id}>
                <Thumb kind="darkPower" />
                <div className="ct">
                  <b className="cn">Face down</b>
                  <p>It turns over when the marker reaches a Dark Power space, or at the Finale.</p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="sec">
          <Head icon={<CardIcon className="ico" />}>Finale</Head>
          {g.killer.finaleRevealed && fin ? (
            <div className="crow">
              <Thumb kind="finaleUp" label="Finale" />
              <div className="ct">
                <b className="cn">{fin.name}</b>
                <p>{fin.text ? <Rich text={fin.text} /> : 'His Killer action changes (above).'}</p>
              </div>
              <span className="sticker sm red tag">Revealed</span>
            </div>
          ) : (
            <div className="crow down">
              <Thumb kind="finale" label="Finale" />
              <div className="ct">
                <b className="cn">
                  <span className="vcr big">{view.td}</span> Terror card{view.td === 1 ? '' : 's'} left
                </b>
                <p>Face down. It turns over when the Terror deck runs out.</p>
              </div>
              {view.td <= 3 ? <span className="sticker sm red tag">Finale soon</span> : null}
            </div>
          )}
        </section>

        {g.killer.minors.length ? (
          <section className="sec">
            <Head icon={<span className="dia sm" aria-hidden="true" />}>Minor Dark Powers</Head>
            {g.killer.minors.map((m) => {
              const t = terrorDef(g, m.id);
              return (
                <div className="crow" key={m.id}>
                  <Thumb kind="minor" />
                  <div className="ct">
                    <b className="cn">
                      {t.name} <Pips n={m.hp} max={t.minor?.hp ?? m.hp} />
                    </b>
                    <p>
                      <Rich text={t.text.replace(/^Minor Dark Power \(\d+ health\)\.\s*/, '')} />
                    </p>
                  </div>
                </div>
              );
            })}
          </section>
        ) : null}

        {k.minion ? <Minions g={g} k={k} view={view} /> : null}

        {g.wrath.killer !== undefined && k.wrath ? <Wrath def={k.wrath} level={g.wrath.killer} kind="killer" /> : null}
        {g.wrath.divine !== undefined && loc.wrath ? <Wrath def={loc.wrath} level={g.wrath.divine} kind="divine" /> : null}

        <BoilerRoom g={g} />

        {inPlay ? (
          <section className="sec">
            <Head icon={<Zoom className="ico" />} right={<span className="vcr">{inPlay}</span>}>
              In play
            </Head>
            <div className="inplay">
              {g.activeEvents.map((id) => {
                const e = eventDef(g, id);
                return (
                  <button type="button" className="crow tap ev" key={`e-${id}`} onClick={() => onReveal('event', id)}>
                    <Thumb kind="event" label="Event" />
                    <span className="ct">
                      <b className="cn">{e.name}</b>
                      <span className="p">
                        <Rich text={e.text} />
                      </span>
                    </span>
                  </button>
                );
              })}
              {g.activeTerror.map((id) => {
                const t = terrorDef(g, id);
                return (
                  <button type="button" className="crow tap tr" key={`t-${id}`} onClick={() => onReveal('terror', id)}>
                    <Thumb kind="terror" label="Terror" />
                    <span className="ct">
                      <b className="cn">{t.name}</b>
                      <span className="p">
                        <Rich text={t.text} />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <details className="fold">
          <summary>
            <Scroll className="ico" />
            <span>Terror played</span>
            <span className="vcr">{g.terrorDiscard.length}</span>
          </summary>
          {g.terrorDiscard.length ? (
            <ol className="played">
              {g.terrorDiscard.map((id, i) => (
                <li key={`${id}-${i}`}>
                  <span className="vcr">{String(i + 1).padStart(2, '0')}</span> {terrorDef(g, id).name}
                </li>
              ))}
            </ol>
          ) : (
            <p className="fold-p">None yet. The deck is the clock: {view.td} left.</p>
          )}
        </details>

        <details className="fold">
          <summary>
            <Question className="ico" />
            <span>{k.name}: rules</span>
          </summary>
          <p className="fold-p">
            <Rich text={k.rules} />
          </p>
        </details>
        <details className="fold">
          <summary>
            <Question className="ico" />
            <span>{loc.name}: rules</span>
          </summary>
          <p className="fold-p">
            <Rich text={loc.rules} />
          </p>
        </details>
      </div>
    </Sheet>
  );
}

function Nameplate({ g, k, view }: { g: GameState; k: KillerDef; view: DisplayView }) {
  const birds = g.film.birds as { hidden: number; total: number; saved: number } | undefined;
  return (
    <div className="plate">
      <span className="emblem">
        <Emblem name={k.icon} />
      </span>
      <div className="plate-id">
        <span className="plate-title">{k.title ? cap(k.title) : 'The Killer'}</span>
        <span className="plate-sub">{k.bodiless ? 'A flock, not a body' : k.invulnerable ? 'No body to hurt' : `Starts at ${k.health} health`}</span>
      </div>
      {k.bodiless ? (
        <div className="plate-hp">
          <Crow className="ico" />
          <b className="num">{view.minions.length}</b>
          {birds ? (
            <span className="sticker sm black">
              Saved {birds.saved}/{birds.total}
            </span>
          ) : null}
        </div>
      ) : k.invulnerable ? (
        <div className="plate-hp">
          <span className="inf" aria-label="Infinite health">
            ∞
          </span>
          <span className="sticker sm red">Can't be hurt</span>
        </div>
      ) : (
        <div className="plate-hp" role="img" aria-label={`${view.khp} health`}>
          <Heart className="ico" />
          <b className="num">{view.khp}</b>
          <FinalCoin tok={view.ktok} who={k.name} />
        </div>
      )}
    </div>
  );
}

function Ladder({ k, loc, bl, names }: { k: KillerDef; loc: LocationDef; bl: number; names: Names }) {
  const rows = k.bloodlust.map((sp, i) => ({ sp, i })).reverse();
  return (
    <div className="ladder">
      <div className="bl-max">
        <span className="bl-box">Max</span>
        <p>
          Past the top: <Rich text={k.maxText} />
        </p>
      </div>
      <ol className="bl-rows">
        {rows.map(({ sp, i }) => {
          const state = i === bl ? 'here' : i < bl ? 'past' : 'next';
          const words = effectWords(sp.effects, names);
          const extra = i > 0 ? loc.bloodlustTrack?.[i - 1]?.text : undefined;
          return (
            <li key={i} className={`bl-row ${state}`} aria-current={i === bl ? 'step' : undefined}>
              <span className="bl-box">{i === bl ? <span className="cube" aria-label="Bloodlust marker" /> : <span className="n">{i + 1}</span>}</span>
              {k.bodiless ? null : (
                <span className="bl-stats">
                  <span className="st">
                    <Knife className="ico" />
                    <b>{sp.attack}</b>
                  </span>
                  <span className="st">
                    <Boot className="ico" />
                    <b>{sp.move}</b>
                  </span>
                </span>
              )}
              <span className="bl-fx">
                {sp.darkPower ? (
                  <span className="dp-tag">
                    <span className="dia" aria-hidden="true" />
                    Dark Power
                  </span>
                ) : null}
                {words.map((w) => (
                  <span key={w} className="fx">
                    {w}
                  </span>
                ))}
                {extra ? (
                  <span className="bl-loc">
                    <Sacred className="ico" />
                    {extra}
                  </span>
                ) : null}
              </span>
              {i === bl ? <span className="sticker sm red here">Here</span> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Minions({ g, k, view }: { g: GameState; k: KillerDef; view: DisplayView }) {
  const m = k.minion!;
  const out = view.minions;
  return (
    <section className="sec">
      <Head icon={k.bodiless ? <Crow className="ico" /> : <Puppet className="ico" />} right={<span className="vcr">{out.length}</span>}>
        {m.plural}
      </Head>
      <div className="minion-card">
        <div className="mc-stats">
          <span className="chip">
            <Heart className="ico" /> {m.hp}
          </span>
          <span className="chip">
            <Knife className="ico" /> {m.attack}
          </span>
          {k.bodiless ? null : (
            <>
              <span className="chip">{g.minionPool.ready.length} ready</span>
              {g.minionPool.exhausted.length ? <span className="chip">{g.minionPool.exhausted.length} broken</span> : null}
            </>
          )}
          <span className="chip on">{out.length} on the board</span>
        </div>
        <p>
          <Rich text={m.text} />
        </p>
        {!k.bodiless && out.length ? (
          <ul className="mc-list">
            {out.map((x) => (
              <li key={x.id}>
                <span className="mtoken" aria-hidden="true">
                  <Puppet className="ico" />
                </span>
                <span className="mz">{zoneName(g, x.zone)}</span>
                <Pips n={x.hp} max={m.hp} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function Wrath({ def, level, kind }: { def: WrathDef; level: number; kind: 'killer' | 'divine' }) {
  const now = def.levels[level - 1];
  return (
    <section className={`sec wrath ${kind}`}>
      <Head icon={kind === 'killer' ? <Bolt className="ico" /> : <Sacred className="ico" />} right={<span className="vcr">{level}/10</span>}>
        {def.name}
      </Head>
      <ol className="wr-track" aria-label={`${def.name} ${level} of 10`}>
        {def.levels.map((_, i) => (
          <li key={i} className={i + 1 === level ? 'here' : i + 1 < level ? 'past' : ''}>
            {i + 1 === level ? <span className="cube" /> : <span className="n">{i + 1}</span>}
          </li>
        ))}
      </ol>
      {now ? (
        <p className="wr-now">
          <span className="sticker sm yellow">Unleashed now</span> <Rich text={now.text} />
        </p>
      ) : null}
      <details className="fold in">
        <summary>
          <span>All ten levels</span>
        </summary>
        <ol className="wr-levels">
          {def.levels.map((l, i) => (
            <li key={i} className={i + 1 === level ? 'here' : ''}>
              <span className="vcr">{i + 1}</span>
              <span>
                <Rich text={l.text} />
              </span>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

const CELL = 44;

function BoilerRoom({ g }: { g: GameState }) {
  const v = boilerView(g);
  if (!v) return null;
  const asleep = !!g.film.maple?.asleep;
  const xs = v.cells.map((c) => c.x);
  const ys = v.cells.map((c) => c.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX + 1;
  const h = Math.max(...ys) - minY + 1;
  const pad = 3;
  return (
    <section className="sec boiler">
      <Head icon={<Emblem name="pitchfork" />} right={asleep ? <span className="vcr">{4 - v.left}/4</span> : null}>
        Boiler Room
      </Head>
      {asleep ? (
        <>
          <div className="br-wrap">
            <svg
              className="br"
              viewBox={`${-pad} ${-pad} ${w * CELL + pad * 2} ${h * CELL + pad * 2}`}
              width={w * CELL + pad * 2}
              height={h * CELL + pad * 2}
              role="img"
              aria-label={`Boiler Room: ${4 - v.left} of 4 cards revealed`}
            >
              {v.cells.map((c, i) => {
                const x = (c.x - minX) * CELL;
                const y = (c.y - minY) * CELL;
                const fill = c.card === 0 ? '#5c3418' : c.fright ? '#b3161b' : '#8a4b24';
                return (
                  <g key={i} transform={`translate(${x} ${y})`}>
                    <rect width={CELL} height={CELL} fill={fill} stroke="#141213" strokeWidth={2.5} />
                    <path d={`M6 ${CELL - 6}h${CELL - 12}`} stroke="#141213" strokeWidth={1.5} opacity={c.card === 0 ? 0 : 1} />
                    {c.fright ? (
                      <svg x={CELL / 2 - 13} y={CELL / 2 - 13} width={26} height={26} color="#efe6d2">
                        <Emblem name="pitchfork" className="" />
                      </svg>
                    ) : c.card === 0 ? null : (
                      <text x={CELL / 2} y={CELL / 2 + 6} textAnchor="middle" className="br-t">
                        {c.card}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="br-note">
            {v.left} card{v.left === 1 ? '' : 's'} left. At the end of each Killer Phase the deck slides one way; if Dr. Fright shows in the revealed part, he attacks you.
          </p>
        </>
      ) : (
        <p className="br-note">You're awake. Fall asleep and you slide through its 4 cards at the end of each Killer Phase.</p>
      )}
    </section>
  );
}
