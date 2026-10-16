// The player board: Horror dial, Time track, items, the rescue card, the hand
// and the Action tableau. Printed on bone stock.

import type { GameState } from '../../game';
import { finalGirlDef } from '../../game/content';
import { BOARDS, card } from '../../game/content/core';
import { diceCount } from '../../game/engine/dice';
import { itemDef } from '../../game/engine/kernel';
import type { ActionCardDef, BoardDef } from '../../game/types';
import type { DisplayView } from '../game/display';
import { Backpack, CardIcon, Hand, Hourglass, Mask, MeepleIcon, Padlock, Wrench } from '../pieces/icons';
import { FinalCoin, Head, Hearts, Rich } from './bits';
import { Sheet } from './Sheet';
import { GirlArt } from '../art';

const KILLER = '#c1272d';

export function GirlSheet({ g, view, onClose }: { g: GameState; view: DisplayView; onClose: () => void }) {
  const fg = finalGirlDef(g.config.finalGirl);
  const board = BOARDS[g.config.board];
  let dice = board.horror[view.fh]?.dice ?? 1;
  try {
    dice = diceCount(g, { kind: 'effect', label: 'preview', id: 'preview' }, false).n;
  } catch {
    // keep the track's number
  }
  const tableau = Object.entries(g.tableau)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ c: card(id), n }))
    .sort((a, b) => a.c.cost - b.c.cost || a.c.name.localeCompare(b.c.name));

  return (
    <Sheet title={fg.name} onClose={onClose}>
      <div className="gs">
        <div className="plate girl">
          <span className="emblem girl art-frame">
            <GirlArt id={fg.id} crop="head" />
          </span>
          <div className="plate-id">
            <span className="plate-title">Final Girl</span>
            <span className="plate-sub">{fg.blurb}</span>
          </div>
          <div className="plate-hp">
            <Hearts hp={view.fhp} max={g.fg.health.max} />
            <FinalCoin tok={view.ftok} who={fg.name} />
          </div>
        </div>

        <section className="sec">
          <Head icon={<Mask className="ico" />} right={<span className="vcr">{dice} {dice === 1 ? 'die' : 'dice'}</span>}>
            Horror
          </Head>
          <div className="horror">
            <BigDial board={board} at={view.fh} dice={dice} />
            <div className="hz-text">
              <p>
                <b>Rolling {dice} {dice === 1 ? 'die' : 'dice'}</b> on each horror roll. The dial sets how many: 3 at the green end, 1 at the red end.
              </p>
              <p className="small">
                Below green: <b>+1 Time</b> instead. Above red: <b>+1 Bloodlust</b> instead. On your or his last health, +1 die each.
              </p>
            </div>
          </div>
        </section>

        <section className="sec">
          <Head icon={<Hourglass className="ico time" />} right={<span className="vcr">{view.ft}/{board.maxTime}</span>}>
            Time
          </Head>
          <TimeTrack board={board} t={view.ft} />
        </section>

        <section className="sec">
          <Head icon={<Wrench className="ico" />} right={<span className="vcr">{g.fg.items.length}</span>}>
            Items
          </Head>
          {g.fg.items.length ? (
            <div className="items">
              {g.fg.items.map((it) => {
                const d = itemDef(g, it.id);
                return (
                  <article className="icard" key={it.uid}>
                    <div className="ic-top">
                      <b className="ic-name">{d.name}</b>
                      {d.hands ? (
                        it.inHands ? (
                          <span className="sticker sm purple">
                            <Hand className="ico" /> In hand
                          </span>
                        ) : (
                          <span className="sticker sm">
                            <Backpack className="ico" /> Backpack
                          </span>
                        )
                      ) : null}
                    </div>
                    <div className="ic-stats">
                      {d.hands ? (
                        <span className="chip" title={`${d.hands} hand${d.hands === 1 ? '' : 's'}`}>
                          {Array.from({ length: d.hands }, (_, i) => (
                            <Hand key={i} className="ico" />
                          ))}
                        </span>
                      ) : (
                        <span className="chip">No hands</span>
                      )}
                      {d.range ? (
                        <span className="chip">
                          Range {d.range[0] === d.range[1] ? d.range[0] : `${d.range[0]}–${d.range[1]}`}
                        </span>
                      ) : null}
                      {d.damage ? <span className="chip">+{d.damage} damage</span> : null}
                      {it.uses !== undefined ? <span className="chip dark">×{it.uses} left</span> : null}
                    </div>
                    <p>
                      <Rich text={d.text} />
                    </p>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="empty">Nothing yet. Search the orange spaces.</p>
          )}
        </section>

        <section className="sec">
          <Head icon={<MeepleIcon color="#f2c230" size={18} />} right={<span className="vcr">Saved {view.saved}</span>}>
            Rescue
          </Head>
          <div className={`rescue${g.fg.ultimate ? ' flipped' : ''}`}>
            <ol className="slots">
              {fg.slots.map((s, i) => (
                <li key={i} className={`rslot${g.fg.slots[i] ? ' full' : ''}`}>
                  <span className="rs-n">{i + 1}</span>
                  <span className="rs-t">{s.text}</span>
                  {g.fg.slots[i] ? <span className="sticker sm gold saved">Saved</span> : null}
                </li>
              ))}
            </ol>
            <div className={`ult${g.fg.ultimate ? ' on' : ''}`}>
              <span className="ult-h">
                {g.fg.ultimate ? null : <Padlock className="ico" />}
                Ultimate
              </span>
              <p>
                <Rich text={fg.ultimate.text} />
              </p>
              <p className="small">{g.fg.ultimate ? `Each extra victim saved: ${fg.extraText}.` : 'Fill every slot to flip the card.'}</p>
            </div>
          </div>
        </section>

        <section className="sec">
          <Head icon={<CardIcon className="ico" />} right={<span className="vcr">{g.fg.hand.length}/10</span>}>
            Hand
          </Head>
          {g.fg.hand.length ? (
            <div className="mcards">
              {g.fg.hand.map((id, i) => (
                <MiniCard key={`${id}-${i}`} c={card(id)} />
              ))}
            </div>
          ) : (
            <p className="empty">No cards in hand.</p>
          )}
        </section>

        <section className="sec">
          <Head icon={<CardIcon className="ico" />} right={<span className="vcr">{tableau.reduce((s, p) => s + p.n, 0)}</span>}>
            Action tableau
          </Head>
          <ul className="piles" aria-label="Action tableau">
            {tableau.map(({ c, n }) => (
              <li key={c.id} className={`pile t-${c.timing}`} style={{ ['--stack' as string]: Math.min(4, n - 1) }}>
                <span className="pl-spine" />
                <span className="pl-name">{c.name}</span>
                <span className={`cost${c.cost ? '' : ' zero'}`}>{c.cost}</span>
                <span className="pl-n vcr">×{n}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Sheet>
  );
}

function MiniCard({ c }: { c: ActionCardDef }) {
  return (
    <article className={`mcard t-${c.timing}`}>
      <span className="mc-spine">
        <span className={`cost${c.cost ? '' : ' zero'}`}>{c.cost}</span>
      </span>
      <span className="mc-face">
        <b className="mc-name">{c.name}</b>
        <span className="mc-text">
          <Rich text={c.text} />
        </span>
        {c.timing !== 'action' ? <span className="mc-when">{c.timing === 'reaction' ? 'Reaction' : 'After a roll'}</span> : null}
      </span>
    </article>
  );
}

/** The Horror track as a big dial: 8 spaces, dice per space, killer start labels, the red meeple. */
function BigDial({ board, at, dice }: { board: BoardDef; at: number; dice: number }) {
  const C = 92;
  const R = 56;
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const pt = (d: number, r = R) => [C + r * Math.cos(rad(d)), C + r * Math.sin(rad(d))] as const;
  const arc = (i: number) => {
    const [x1, y1] = pt(i * 45 - 19);
    const [x2, y2] = pt(i * 45 + 19);
    return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`;
  };
  const n = board.horror.length;
  const fill = (i: number) => (i === 0 ? '#3e7a3a' : i === n - 1 ? '#b3161b' : i === at ? KILLER : '#dccfb4');
  const [mx, my] = pt(at * 45, R + 22);
  return (
    <svg className="bigdial" viewBox="0 0 184 184" role="img" aria-label={`Horror ${at} of ${n - 1}: ${dice} dice`}>
      <circle cx={C} cy={C} r={R + 15} fill="#141213" />
      <circle cx={C} cy={C} r={R - 15} fill="#f7f1e3" stroke="#141213" strokeWidth={2} />
      {board.horror.map((sp, i) => {
        const d = i * 45;
        const light = fill(i) === '#dccfb4';
        return (
          <g key={i}>
            <path d={arc(i)} fill="none" stroke={fill(i)} strokeWidth={22} />
            {Array.from({ length: sp.dice }, (_, j) => {
              const off = (j - (sp.dice - 1) / 2) * 10;
              const [x, y] = pt(d);
              const tx = -Math.sin(rad(d));
              const ty = Math.cos(rad(d));
              return (
                <rect
                  key={j}
                  x={x + tx * off - 3.6}
                  y={y + ty * off - 3.6}
                  width={7.2}
                  height={7.2}
                  rx={1.6}
                  transform={`rotate(${d} ${x + tx * off} ${y + ty * off})`}
                  fill={light ? KILLER : '#efe6d2'}
                  stroke="#141213"
                  strokeWidth={1.3}
                />
              );
            })}
            {sp.label != null ? (
              <text x={pt(d, R - 25)[0]} y={pt(d, R - 25)[1] + 4} textAnchor="middle" className="dl">
                {sp.label}
              </text>
            ) : null}
          </g>
        );
      })}
      <rect x={C - 16} y={C - 16} width={32} height={32} rx={7} fill={KILLER} stroke="#141213" strokeWidth={2.5} />
      <text x={C} y={C + 8.5} textAnchor="middle" className="dn">
        {dice}
      </text>
      <g transform={`translate(${mx} ${my})`}>
        <use href="#meeple" x={-10.5 + 1.4} y={-11 + 1.6} width={22} height={22} fill="#141213" />
        <use href="#meeple" x={-10.5} y={-11} width={22} height={22} fill={KILLER} stroke="#141213" strokeWidth={1.6} paintOrder="stroke" />
      </g>
    </svg>
  );
}

function TimeTrack({ board, t }: { board: BoardDef; t: number }) {
  const n = board.maxTime + 1;
  return (
    <ol className="time-track" style={{ ['--n' as string]: n }} aria-label={`Time ${t} of ${board.maxTime}`}>
      {Array.from({ length: n }, (_, i) => (
        <li key={i} className={i === t ? 'here' : i < t ? 'past' : i === board.startTime ? 'start' : ''}>
          {i === t ? <Hourglass className="ico" /> : <span className="n">{i}</span>}
        </li>
      ))}
    </ol>
  );
}
