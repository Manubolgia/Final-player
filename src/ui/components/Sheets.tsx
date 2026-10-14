import type { ReactNode } from 'react';
import type { GameState } from '../../game';
import { finalGirlDef, killerDef, locationDef } from '../../game/content';
import { card } from '../../game/content/core';
import { eventDef, itemDef, terrorDef, zoneDef, zoneName } from '../../game/engine/kernel';
import { victimName } from '../../game/engine/board';
import { Close } from '../art/Icons';
import { ActionCard } from './Cards';
import { boilerView } from '../../game/films/maple';

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet" onClick={onClose}>
      <div className="sheet-body" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close" type="button">
            <Close />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function KillerSheet({ g, onClose }: { g: GameState; onClose: () => void }) {
  const k = killerDef(g.config.killer);
  const loc = locationDef(g.config.location);
  const fin = k.finales.find((f) => f.id === g.killer.finale)!;
  return (
    <Sheet title={`${k.name}${k.title ? ` ${k.title}` : ''}`} onClose={onClose}>
      {k.bodiless ? (
        <p>
          No body to hurt: <b>{g.minions.length}</b> birds on the board. Survivors saved <b>{g.film.birds?.saved ?? 0}</b> of {g.film.birds?.total ?? 2}
          {g.film.birds?.hidden ? ` (still hiding: ${g.film.birds.hidden})` : ''}.
        </p>
      ) : k.invulnerable ? (
        <p>Can't be hurt or killed.</p>
      ) : (
        <p>
          Health <b>{g.killer.health.hp}</b>
          {g.killer.health.token === 'black' ? ' (the last point is a face-down Final Health token)' : ' (back from the dead once already)'}.
        </p>
      )}
      <h4>Bloodlust</h4>
      <div className="list">
        {[...k.bloodlust].map((sp, i) => ({ sp, i })).reverse().map(({ sp, i }) => (
          <div key={i} className="opt" style={i === g.killer.bloodlust ? { borderColor: 'var(--blood-hi)', background: '#3a1118' } : i < g.killer.bloodlust ? { opacity: 0.55 } : undefined}>
            {k.bodiless ? `${i + 1}` : `🔪 ${sp.attack} · 👢 ${sp.move}`}
            {sp.darkPower ? ' · DARK POWER' : ''}
            {sp.effects?.length ? ` · ${sp.effects.map((e) => (e.k === 'horror' ? `+${e.n} Horror` : e.k === 'event' ? 'draw an Event' : e.k)).join(', ')}` : ''}
            {loc.bloodlustTrack?.[i - 1]?.text ? <small>{loc.name}: {loc.bloodlustTrack[i - 1].text}</small> : null}
            {i === g.killer.bloodlust ? <small>← now</small> : null}
          </div>
        ))}
        <div className="opt">
          <small>Past the top: {k.maxText}</small>
        </div>
      </div>
      <h4>Killer action</h4>
      <p>
        {g.killer.finaleRevealed
          ? `Finale (${fin.name}): ${describeAction([...(fin.minionAction ?? []), ...fin.action])}`
          : describeAction([...(k.minionAction ?? []), ...k.action])}
      </p>
      {k.minion ? (
        <>
          <h4>{k.minion.plural}</h4>
          <p>{k.minion.text}</p>
        </>
      ) : null}
      <h4>Dark Power</h4>
      {g.killer.darkPowers.map((d) => {
        const def = k.darkPowers.find((x) => x.id === d.id)!;
        return <p key={d.id}>{d.revealed ? <><b>{def.name}.</b> {def.text}</> : 'Face down. It turns over when Bloodlust reaches the Dark Power space, or at the Finale.'}</p>;
      })}
      {g.killer.minors.length ? (
        <>
          <h4>Minor Dark Powers</h4>
          {g.killer.minors.map((m) => (
            <p key={m.id}>
              <b>{terrorDef(g, m.id).name}</b> {m.hp ? `(${m.hp} health)` : ''}: {terrorDef(g, m.id).text}
            </p>
          ))}
        </>
      ) : null}
      <h4>Finale</h4>
      <p>{g.killer.finaleRevealed ? <><b>{fin.name}.</b> {fin.text ?? ''}</> : `Face down until the Terror deck runs out (${g.terrorDeck.length} cards left).`}</p>
      {g.wrath.killer !== undefined && k.wrath ? <WrathBox title={k.wrath.name} level={g.wrath.killer} levels={k.wrath.levels} /> : null}
      {g.wrath.divine !== undefined && loc.wrath ? <WrathBox title={loc.wrath.name} level={g.wrath.divine} levels={loc.wrath.levels} /> : null}
      <BoilerRoom g={g} />
      <h4>Special rules</h4>
      <p>{k.rules}</p>
      <p>
        <b>{loc.name}:</b> {loc.rules}
      </p>
      {g.activeEvents.length || g.activeTerror.length ? (
        <>
          <h4>In play</h4>
          {g.activeEvents.map((e) => (
            <p key={e}>
              <b>{eventDef(g, e).name}.</b> {eventDef(g, e).text}
            </p>
          ))}
          {g.activeTerror.map((t) => (
            <p key={t}>
              <b>{terrorDef(g, t).name}.</b> {terrorDef(g, t).text}
            </p>
          ))}
        </>
      ) : null}
      <h4>Terror cards played</h4>
      <p className="muted">{g.terrorDiscard.length ? g.terrorDiscard.map((t) => terrorDef(g, t).name).join(' · ') : 'None yet.'}</p>
    </Sheet>
  );
}

function BoilerRoom({ g }: { g: GameState }) {
  const v = boilerView(g);
  if (!v) return null;
  const xs = v.cells.map((c) => c.x);
  const ys = v.cells.map((c) => c.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX + 1;
  const h = Math.max(...ys) - minY + 1;
  const S = 34;
  return (
    <>
      <h4>{g.film.maple?.asleep ? `Boiler Room: ${4 - v.left} of 4 cards revealed` : 'Boiler Room (you\'re awake)'}</h4>
      {g.film.maple?.asleep ? (
        <svg className="boiler" viewBox={`0 0 ${w * S} ${h * S}`} width={w * S} height={h * S} role="img" aria-label="Revealed Boiler Room cards">
          {v.cells.map((c, i) => (
            <g key={i} transform={`translate(${(c.x - minX) * S} ${(c.y - minY) * S})`}>
              <rect x={1} y={1} width={S - 2} height={S - 2} rx={4} fill={c.card === 0 ? '#2a2026' : c.fright ? '#5a1520' : '#1d2a22'} stroke={c.card === 0 ? '#5d4a53' : '#3c5a48'} />
              <text x={S / 2} y={S / 2 + 5} textAnchor="middle" fontSize={c.fright ? 18 : 11} fill={c.fright ? '#ff7043' : '#8da394'}>
                {c.card === 0 ? '' : c.fright ? '☠' : c.card}
              </text>
            </g>
          ))}
        </svg>
      ) : (
        <p className="muted">Fall asleep and you start sliding through its 4 cards at the end of each Killer Phase.</p>
      )}
    </>
  );
}

function WrathBox({ title, level, levels }: { title: string; level: number; levels: { text: string }[] }) {
  return (
    <>
      <h4>
        {title}: {level}
      </h4>
      <div className="list">
        {levels.map((l, i) => (
          <div key={i} className="opt" style={i + 1 === level ? { borderColor: 'var(--blood-hi)', background: '#3a1118' } : undefined}>
            {i + 1}. {l.text}
          </div>
        ))}
      </div>
    </>
  );
}

const CUSTOM_LABEL: Record<string, string> = {
  'tb.spawn': 'spawn birds',
  'tb.attack': 'the birds attack',
  'gp.spawn': 'a Puppet comes out',
  'gr.initialWrath': 'Killer Wrath +1 if it is 1–2',
  'cm.toYou': 'appears in your space',
  'cm.lostDraw': 'draw a Terror card (none left: you lose)',
  'df.killTwo': '2 victims of your choice die',
};

function describeAction(list: import('../../game/types').Effect[]): string {
  return (
    list
      .map((e) => {
        if (e.k !== 'killer') return e.k === 'bloodlust' ? `+${e.n} Bloodlust` : e.k === 'custom' ? CUSTOM_LABEL[e.id.split(':')[0]] ?? 'special' : e.k;
        const t = { victim: 'closest victim', finalGirl: 'Final Girl', nearest: 'nearest', victimElseFG: 'closest victim (else you)', farthestVictim: 'farthest victim' }[e.a.target];
        const who = e.a.actor === 'minions' ? 'Minions: ' : '';
        return `${who}${t}${' ▸ move'.repeat(e.a.moves)}${' ▸ attack'.repeat(e.a.attacks)}`;
      })
      .join('; ') || '—'
  );
}

export function PlayerSheet({ g, onClose }: { g: GameState; onClose: () => void }) {
  const fg = finalGirlDef(g.config.finalGirl);
  return (
    <Sheet title={fg.name} onClose={onClose}>
      <p>
        Health <b>{g.fg.health.hp}</b>/{g.fg.health.max}
        {g.fg.health.token === 'black' ? ' (your last point is a face-down Final Health token)' : ' (you already came back once)'} · Time <b>{g.fg.time}</b> · Saved <b>{g.fg.saved}</b>
      </p>
      <h4>{g.fg.ultimate ? 'Ultimate Ability' : 'Rescue rewards'}</h4>
      {g.fg.ultimate ? (
        <p>
          {fg.ultimate.text} Each extra victim saved: {fg.extraText}.
        </p>
      ) : (
        <>
          <div className="slots">
            {fg.slots.map((s, i) => (
              <div key={i} className={`slot ${g.fg.slots[i] ? 'full' : ''}`}>
                {g.fg.slots[i] ? '✓ ' : ''}
                {s.text}
              </div>
            ))}
          </div>
          <p className="muted">Fill them all to flip the card: {fg.ultimate.text}</p>
        </>
      )}
      <h4>Items</h4>
      {g.fg.items.length ? (
        g.fg.items.map((it) => {
          const d = itemDef(g, it.id);
          return (
            <p key={it.uid}>
              <b>{d.name}</b> {d.hands ? (it.inHands ? '(in hand)' : '(backpack)') : ''} {it.uses !== undefined ? `· ${it.uses} uses left` : ''}
              <br />
              <span className="muted">{d.text}</span>
            </p>
          );
        })
      ) : (
        <p className="muted">Nothing yet. Search the marked spaces.</p>
      )}
      <h4>Hand ({g.fg.hand.length}/10)</h4>
      {g.fg.hand.map((c, i) => (
        <p key={`${c}-${i}`}>
          <b>{card(c).name}</b> <span className="muted">— {card(c).text}</span>
        </p>
      ))}
      <h4>Action tableau</h4>
      <div className="hand" style={{ flexWrap: 'wrap' }}>
        {Object.entries(g.tableau)
          .filter(([, n]) => n > 0)
          .map(([c, n]) => (
            <ActionCard key={c} id={c} count={n} />
          ))}
      </div>
    </Sheet>
  );
}

export function ZoneSheet({ g, zone, onClose }: { g: GameState; zone: string; onClose: () => void }) {
  const z = zoneDef(g, zone);
  const vs = g.victims.filter((v) => v.zone === zone);
  const deckId = z.search ? z.deck ?? z.id : undefined;
  const deck = deckId ? g.itemDecks[deckId] : undefined;
  const tags = [z.exit && 'Exit: save victims here', z.search && 'Search space', z.sacred && 'Sacred', z.window && 'Window', z.water && 'By the water', z.house && 'House', z.street && 'Street', z.outside && 'Outside'].filter(Boolean);
  return (
    <Sheet title={z.name} onClose={onClose}>
      {tags.length ? <p className="muted">{tags.join(' · ')}</p> : null}
      <p>
        {g.fg.zone === zone ? `${finalGirlDef(g.config.finalGirl).name} is here. ` : ''}
        {g.killer.zone === zone && !g.film.birds ? `${killerDef(g.config.killer).name} is here. ` : ''}
        {vs.length ? `${vs.length} victim${vs.length === 1 ? '' : 's'}${vs.some((v) => v.role) ? ` (${vs.filter((v) => v.role).map(victimName).join(', ')})` : ''}.` : 'No victims.'}
      </p>
      {deck ? (
        <p>
          Item deck: {deck.length} card{deck.length === 1 ? '' : 's'}
          {deck[0] ? (deck[0].up ? `, top: ${itemDef(g, deck[0].id).name}` : ', top card face down') : ''}.
        </p>
      ) : null}
      <h4>Panic arrows</h4>
      {z.panic.length ? (
        z.panic.map((a) => (
          <p key={a.to}>
            🎲 {a.faces.join(', ')} → {zoneName(g, a.to)}
          </p>
        ))
      ) : (
        <p className="muted">None.</p>
      )}
      <p className="muted">Other die faces: the victim stays put.</p>
    </Sheet>
  );
}

export function LogSheet({ g, onClose }: { g: GameState; onClose: () => void }) {
  let last = -1;
  return (
    <Sheet title="What happened" onClose={onClose}>
      <div className="log-list">
        {g.log.map((e) => {
          const head = e.turn !== last ? <div className="turn">Turn {e.turn}</div> : null;
          last = e.turn;
          return (
            <div key={e.n}>
              {head}
              <div className={`tone-${e.tone}`}>{e.text}</div>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
