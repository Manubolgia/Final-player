// One space of the map: what kind of space it is, who's in it, its item deck
// and its panic arrows.

import type { ReactNode } from 'react';
import type { GameState } from '../../game';
import { finalGirlDef, killerDef } from '../../game/content';
import { victimName } from '../../game/engine/board';
import { itemDef, zoneDef, zoneName } from '../../game/engine/kernel';
import { victimHex } from '../film';
import type { DisplayView } from '../game/display';
import { Crow, Door, MeepleIcon, Puppet, Sacred, Water, Window, Wrench } from '../pieces/icons';
import { cap, Head, PipDie, Pips } from './bits';
import { SheetFrame } from './Sheet';

const GIRL = '#6e46a0';
const KILLER = '#c1272d';

export function ZoneSheet({ g, view, zone, onClose }: { g: GameState; view: DisplayView; zone: string; onClose: () => void }) {
  const z = zoneDef(g, zone);
  const k = killerDef(g.config.killer);
  const fg = finalGirlDef(g.config.finalGirl);
  const killerShown = !g.film.birds && !g.film.maple?.offBoard;
  const vs = view.victims.filter((v) => v.zone === zone);
  const plain = vs.filter((v) => !v.role);
  const special = vs.filter((v) => v.role);
  const mins = view.minions.filter((m) => m.zone === zone);
  const deckId = z.search ? (z.deck ?? z.id) : undefined;
  const deck = deckId ? g.itemDecks[deckId] : undefined;
  const top = deck?.[0];
  const used = new Set(z.panic.flatMap((a) => a.faces));
  const stay = [1, 2, 3, 4, 5, 6].filter((f) => !used.has(f));
  const arrows = [...z.panic].sort((a, b) => Math.min(...a.faces) - Math.min(...b.faces));

  const tags: { label: string; cls: string; icon?: ReactNode }[] = [];
  if (z.exit) tags.push({ label: 'Exit', cls: 'green', icon: <Door className="ico" /> });
  if (z.search) tags.push({ label: 'Search', cls: 'orange', icon: <Wrench className="ico" /> });
  if (z.sacred) tags.push({ label: 'Sacred', cls: 'gold', icon: <Sacred className="ico" /> });
  if (z.window) tags.push({ label: 'Window', cls: '', icon: <Window className="ico" /> });
  if (z.water) tags.push({ label: 'Water', cls: 'blue', icon: <Water className="ico" /> });
  if (z.house) tags.push({ label: 'House', cls: 'black' });
  if (z.street) tags.push({ label: 'Street', cls: 'black' });
  if (z.outside) tags.push({ label: 'Outside', cls: '' });

  const here = view.fz === zone || (killerShown && view.kz === zone) || vs.length > 0 || mins.length > 0;

  return (
    <SheetFrame title={z.name} onClose={onClose} fit="auto">
      <div className="zs">
        {tags.length ? (
          <div className="tags">
            {tags.map((t, i) => (
              <span key={t.label} className={`sticker ${t.cls}`} style={{ transform: `rotate(${i % 2 ? 3 : -4}deg)` }}>
                {t.icon}
                {t.label}
              </span>
            ))}
          </div>
        ) : null}
        {z.exit ? <p className="zs-note">Bring victims here to save them.</p> : null}

        <section className="sec">
          <Head right={<span className="vcr">{vs.length + (view.fz === zone ? 1 : 0)}</span>}>Who's here</Head>
          {here ? (
            <ul className="who">
              {view.fz === zone ? (
                <li>
                  <MeepleIcon color={GIRL} size={30} />
                  <span>
                    <b>{fg.name}</b> <span className="muted">you</span>
                  </span>
                </li>
              ) : null}
              {killerShown && view.kz === zone ? (
                <li>
                  <MeepleIcon color={KILLER} size={34} />
                  <span>
                    <b>{k.name}</b> <span className="muted">the Killer</span>
                  </span>
                </li>
              ) : null}
              {plain.length ? (
                <li>
                  <span className="meeples">
                    {plain.slice(0, 4).map((v) => (
                      <MeepleIcon key={v.id} color={victimHex()} size={24} />
                    ))}
                  </span>
                  <span>
                    <b>
                      {plain.length} victim{plain.length === 1 ? '' : 's'}
                    </b>
                  </span>
                </li>
              ) : null}
              {special.map((v) => (
                <li key={v.id}>
                  <MeepleIcon color={victimHex(v.role)} size={26} />
                  <span>
                    <b>{cap(victimName(v))}</b> <span className="muted">special victim</span>
                  </span>
                </li>
              ))}
              {g.film.birds && mins.length ? (
                <li>
                  <span className="mtoken bird" aria-hidden="true">
                    <Crow className="ico" />
                  </span>
                  <span>
                    <b>Birds {mins.length}/3</b> <span className="muted">{mins.length >= 3 ? 'this space is full' : 'roosting'}</span>
                  </span>
                </li>
              ) : (
                mins.map((m) => (
                  <li key={m.id}>
                    <span className="mtoken" aria-hidden="true">
                      <Puppet className="ico" />
                    </span>
                    <span>
                      <b>{k.minion?.name ?? 'Minion'}</b> <Pips n={m.hp} max={k.minion?.hp ?? m.hp} />
                    </span>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <p className="empty">Nobody. Quiet. Too quiet.</p>
          )}
        </section>

        {deck ? (
          <section className="sec">
            <Head icon={<Wrench className="ico" />} right={<span className="vcr">{deck.length}</span>}>
              Item deck
            </Head>
            <div className="deckrow">
              <span className={`thumb t-item${top?.up ? ' up' : ''}`} aria-hidden="true">
                {top?.up ? <span className="tl">{itemDef(g, top.id).name}</span> : <Wrench className="ico" />}
              </span>
              <p>
                {deck.length ? (
                  <>
                    <b>
                      {deck.length} card{deck.length === 1 ? '' : 's'}
                    </b>
                    {top?.up ? (
                      <>
                        . Face up on top: <b>{itemDef(g, top.id).name}</b>.
                      </>
                    ) : (
                      '. The top card is face down.'
                    )}
                  </>
                ) : (
                  <b>Searched out.</b>
                )}
                {deckId && deckId !== z.id ? <span className="muted"> Shared deck: {zoneName(g, deckId)}.</span> : null}
              </p>
            </div>
          </section>
        ) : null}

        <section className="sec">
          <Head>Panic</Head>
          {arrows.length ? (
            <ul className="panic">
              {arrows.map((a) => (
                <li key={a.to}>
                  <span className="faces">
                    {[...a.faces]
                      .sort((x, y) => x - y)
                      .map((f) => (
                        <PipDie key={f} n={f} />
                      ))}
                  </span>
                  <svg className="arrow" viewBox="0 0 28 14" aria-hidden="true">
                    <path d="M1 7h19" stroke="currentColor" strokeWidth="3" />
                    <path d="M18 1.5L27 7l-9 5.5z" fill="currentColor" />
                  </svg>
                  <b className="dest">{zoneName(g, a.to)}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">No arrows: victims here never run.</p>
          )}
          {arrows.length && stay.length ? (
            <p className="zs-note">
              On a {stay.join(' or ')} the victim stays put.
            </p>
          ) : null}
        </section>
      </div>
    </SheetFrame>
  );
}
