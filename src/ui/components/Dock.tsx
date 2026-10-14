import { useEffect, useState } from 'react';
import type { GameState, Input } from '../../game';
import { card, isAttackCard } from '../../game/content/core';
import { finalGirlDef } from '../../game/content';
import { describe } from '../../game/engine/actionPhase';
import { itemDef, zoneName } from '../../game/engine/kernel';
import { victimName } from '../../game/engine/board';
import { ActionCard } from './Cards';
import { Dice } from './Panels';

interface Props {
  g: GameState;
  send: (i: Input) => void;
  /** Followers picked for the next move (shared with the map). */
  bring: string[];
  setBring: (b: string[]) => void;
}

export function Dock({ g, send, bring, setBring }: Props) {
  const p = g.prompt;
  if (!p) return <div className="dock muted center">…</div>;
  switch (p.type) {
    case 'main':
      return <MainDock g={g} send={send} />;
    case 'roll':
      return <RollDock g={g} send={send} />;
    case 'move':
      return <MoveDock g={g} send={send} bring={bring} setBring={setBring} />;
    case 'choice':
      return (
        <div className="dock">
          <h4>{p.title}</h4>
          {p.detail ? <p className="lede">{p.detail}</p> : null}
          <div className="list">
            {p.options.map((o) => (
              <button key={o.id} className="opt" onClick={() => send({ t: 'choose', id: o.id })} type="button">
                {o.label}
                {o.detail ? <small>{o.detail}</small> : null}
              </button>
            ))}
          </div>
        </div>
      );
    case 'planning':
      return <PlanningDock g={g} send={send} />;
    case 'react':
      return (
        <div className="dock">
          <h4 className="tone-killer">
            {p.by} attacks you: {p.damage} damage!
          </h4>
          <p className="lede">Play a reaction, use an item, or take the hit.</p>
          <div className="hand">
            {p.cards.map((c) => (
              <ActionCard key={c} id={c} onClick={() => send({ t: 'react', card: c })} />
            ))}
          </div>
          <div className="list">
            {p.items.map((it) => (
              <button key={it.uid} className="opt" onClick={() => send({ t: 'reactItem', uid: it.uid })} type="button">
                {it.label}
              </button>
            ))}
            <button className="btn primary block" onClick={() => send({ t: 'takeHit' })} type="button">
              Take {p.damage} damage
            </button>
          </div>
        </div>
      );
    case 'rescue':
      return <RescueDock g={g} send={send} />;
    case 'search':
      return <SearchDock g={g} send={send} />;
    case 'arrange':
      return <ArrangeDock g={g} send={send} />;
    case 'discardDown':
      return <DiscardDownDock g={g} send={send} />;
  }
}

// ---- action phase ---------------------------------------------------------------

function MainDock({ g, send }: { g: GameState; send: (i: Input) => void }) {
  const p = g.prompt as Extract<NonNullable<GameState['prompt']>, { type: 'main' }>;
  const [sel, setSel] = useState<number | null>(null);
  const [weapon, setWeapon] = useState<string | undefined>(undefined);
  const [showItems, setShowItems] = useState(false);
  useEffect(() => {
    setSel(null);
    setWeapon(undefined);
  }, [g.log.length]);
  const hand = g.fg.hand;
  const selected = sel !== null ? hand[sel] : null;
  const play = selected ? p.playable.find((x) => x.card === selected) : undefined;
  const timeEach = finalGirlDef(g.config.finalGirl).ultimate.ability === 'ult.sheila' && g.fg.ultimate ? 2 : 1;
  const strike = p.strike;
  return (
    <div className="dock">
      <div className="row" style={{ marginBottom: 6 }}>
        <h4 className={`grow ${strike ? 'tone-killer' : ''}`} style={{ margin: 0 }}>
          {strike ? 'Strike!' : 'Your move'}
        </h4>
        <span className="muted">{g.fg.time} Time</span>
      </div>
      {strike ? (
        <p className="lede">
          {strike === 'victims'
            ? 'You may play ONE action card that deals damage: each point kills one of the victims around you.'
            : 'You may play action cards that deal damage against the thing in your space.'}
        </p>
      ) : null}
      {hand.length ? (
        <div className="hand">
          {hand.map((c, i) => (
            <ActionCard
              key={`${c}-${i}`}
              id={c}
              sel={sel === i}
              off={!p.playable.some((x) => x.card === c)}
              onClick={() => {
                setSel(sel === i ? null : i);
                setWeapon(undefined);
              }}
            />
          ))}
        </div>
      ) : (
        <p className="lede">Your hand is empty.</p>
      )}
      {selected ? (
        <div style={{ marginBottom: 8 }}>
          <p className="lede" style={{ color: 'var(--text)' }}>
            <b>{card(selected).name}.</b> {card(selected).text}
          </p>
          {play && isAttackCard(selected) && play.weapons.length ? (
            <div className="row wrap" style={{ marginBottom: 6 }}>
              {!play.needsWeapon ? (
                <button className={`btn small ${weapon === undefined ? 'good' : ''}`} onClick={() => setWeapon(undefined)} type="button">
                  Bare hands
                </button>
              ) : null}
              {play.weapons.map((w) => {
                const it = g.fg.items.find((x) => x.uid === w)!;
                return (
                  <button key={w} className={`btn small ${weapon === w ? 'good' : ''}`} onClick={() => setWeapon(w)} type="button">
                    {itemDef(g, it.id).name}
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="row">
            {play ? (
              <button
                className="btn primary grow"
                disabled={play.needsWeapon && !weapon}
                onClick={() => send({ t: 'play', card: selected, ...(weapon ? { weapon } : {}) })}
                type="button"
              >
                Play {card(selected).name}
              </button>
            ) : (
              <span className="muted grow">{card(selected).timing === 'action' ? "Can't play it here." : card(selected).timing === 'reaction' ? 'Played when you are attacked.' : 'Played after a horror roll.'}</span>
            )}
            {strike ? null : (
              <button className="btn" onClick={() => send({ t: 'discardForTime', cards: [selected] })} type="button">
                Discard +{timeEach} Time
              </button>
            )}
          </div>
        </div>
      ) : null}
      {showItems ? (
        <div className="list" style={{ marginBottom: 8 }}>
          {p.items.map((a) => (
            <button key={`${a.uid}-${a.action}`} className="opt" onClick={() => send({ t: 'item', uid: a.uid, action: a.action })} type="button">
              {a.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="row wrap">
        {p.canRescue ? (
          <button className="btn good" onClick={() => send({ t: 'rescue' })} type="button">
            Save victims
          </button>
        ) : null}
        {p.items.length ? (
          <button className={`btn ${showItems ? 'good' : ''}`} onClick={() => setShowItems(!showItems)} type="button">
            Items ({p.items.length})
          </button>
        ) : null}
        {p.ultimate ? (
          <button className="btn" onClick={() => send({ t: 'ultimate' })} type="button">
            {p.ultimate}
          </button>
        ) : null}
        <div className="grow" />
        <button className="btn ghost" onClick={() => send({ t: 'endPhase' })} type="button">
          {strike ? "Don't strike" : 'End turn ▸'}
        </button>
      </div>
    </div>
  );
}

// ---- rolls ------------------------------------------------------------------------

function RollDock({ g, send }: { g: GameState; send: (i: Input) => void }) {
  const p = g.prompt as Extract<NonNullable<GameState['prompt']>, { type: 'roll' }>;
  const [mode, setMode] = useState<'none' | 'convert' | 'close1' | 'lucky' | 'sister'>('none');
  const [die, setDie] = useState<number | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  useEffect(() => {
    setMode('none');
    setDie(null);
    setPicked([]);
  }, [p.dice.join(','), p.converted.join(',')]);
  const partials = p.dice.map((d, i) => ((d === 3 || d === 4) && !p.converted.includes(i) && !p.auto34 ? i : -1)).filter((i) => i >= 0);
  const outcome = (() => {
    if (p.purpose.kind === 'action' || p.purpose.kind === 'reaction') {
      const r = card(p.purpose.card).results;
      if (!r) return '';
      const s = p.successes;
      const line = s >= 3 && r.triple ? r.triple : s >= 2 ? r.double : s === 1 ? r.single : r.fail;
      return line.map((opt) => describe(g, opt)).join(' — or — ');
    }
    return '';
  })();
  const title = p.purpose.kind === 'action' || p.purpose.kind === 'reaction' ? card(p.purpose.card).name : p.purpose.kind === 'effect' ? p.purpose.label : 'Horror roll';
  const tapDie = (i: number) => {
    if (mode === 'close1') return send({ t: 'closeCall', die: i });
    if (mode === 'sister') return send({ t: 'sister', die: i });
    if (mode === 'lucky') return setPicked(picked.includes(i) ? picked.filter((x) => x !== i) : [...picked, i]);
    if (partials.includes(i) && p.convertible) {
      setMode('convert');
      setDie(i);
      setPicked([]);
    }
  };
  return (
    <div className="dock">
      <h4>{title}</h4>
      <Dice dice={p.dice} converted={p.converted} auto34={p.auto34} onTap={tapDie} selected={mode === 'lucky' ? picked : die !== null ? [die] : []} rolling />
      <div className="succ">
        {p.successes} success{p.successes === 1 ? '' : 'es'}
        {outcome ? <div className="muted" style={{ fontSize: 15, fontWeight: 400 }}>→ {outcome}</div> : null}
      </div>
      {mode === 'convert' && die !== null ? (
        <>
          <p className="lede">Discard 2 cards to turn the {p.dice[die]} into a success:</p>
          <div className="hand">
            {g.fg.hand.map((c, i) => (
              <ActionCard key={`${c}-${i}`} id={c} sel={picked.includes(i)} onClick={() => setPicked(picked.includes(i) ? picked.filter((x) => x !== i) : picked.length < 2 ? [...picked, i] : picked)} />
            ))}
          </div>
          <div className="row">
            <button className="btn" onClick={() => setMode('none')} type="button">
              Cancel
            </button>
            <button className="btn primary grow" disabled={picked.length !== 2} onClick={() => send({ t: 'convert', die, discard: picked.map((i) => g.fg.hand[i]) })} type="button">
              Discard 2, make it a success
            </button>
          </div>
        </>
      ) : mode === 'lucky' ? (
        <div className="row">
          <button className="btn" onClick={() => setMode('none')} type="button">
            Cancel
          </button>
          <button className="btn primary grow" disabled={!picked.length} onClick={() => send({ t: 'lucky', dice: picked })} type="button">
            Reroll {picked.length} {picked.length === 1 ? 'die' : 'dice'}
          </button>
        </div>
      ) : mode === 'close1' || mode === 'sister' ? (
        <div className="row">
          <span className="grow muted">Tap the die to reroll.</span>
          <button className="btn" onClick={() => setMode('none')} type="button">
            Cancel
          </button>
        </div>
      ) : (
        <>
          {p.convertible && partials.length ? <p className="lede">Tap a 3 or 4 to discard 2 cards and count it as a success.</p> : null}
          <div className="row wrap">
            {p.canCloseCall ? (
              <>
                <button className="btn" onClick={() => setMode('close1')} type="button">
                  Close Call: reroll 1
                </button>
                <button className="btn" onClick={() => send({ t: 'closeCall' })} type="button">
                  Close Call: reroll all (−2 Time)
                </button>
              </>
            ) : null}
            {p.canLucky ? (
              <button className="btn" onClick={() => setMode('lucky')} type="button">
                Lucky dice
              </button>
            ) : null}
            {p.canSister ? (
              <button className="btn" onClick={() => setMode('sister')} type="button">
                Sister: reroll 1 (−2 Time)
              </button>
            ) : null}
            <div className="grow" />
            <button className="btn primary" onClick={() => send({ t: 'confirm' })} type="button">
              Accept
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---- moving --------------------------------------------------------------------------

function MoveDock({ g, send, bring, setBring }: Props) {
  const p = g.prompt as Extract<NonNullable<GameState['prompt']>, { type: 'move' }>;
  const followers = p.followers.map((id) => g.victims.find((v) => v.id === id)!).filter(Boolean);
  return (
    <div className="dock">
      <h4>{p.title}</h4>
      <p className="lede">Tap a lit space on the map.{followers.length ? ` Up to ${p.followLimit} victim${p.followLimit === 1 ? '' : 's'} can come with you.` : ''}</p>
      {followers.length ? (
        <div className="row wrap" style={{ marginBottom: 8 }}>
          {followers.map((v) => {
            const on = bring.includes(v.id);
            return (
              <button
                key={v.id}
                className={`btn small ${on ? 'good' : ''}`}
                onClick={() => setBring(on ? bring.filter((x) => x !== v.id) : bring.length < p.followLimit ? [...bring, v.id] : bring)}
                type="button"
              >
                {on ? '✓ ' : ''}
                {v.role ? victimName(v) : 'Victim'}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="list">
        {p.to.map((z) => (
          <button key={z} className="opt" onClick={() => send({ t: 'moveTo', zone: z, bring })} type="button">
            Go to {zoneName(g, z)}
          </button>
        ))}
        {p.canStop ? (
          <button className="btn ghost block" onClick={() => send({ t: 'stop' })} type="button">
            Stay here
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ---- planning --------------------------------------------------------------------------

function PlanningDock({ g, send }: { g: GameState; send: (i: Input) => void }) {
  const p = g.prompt as Extract<NonNullable<GameState['prompt']>, { type: 'planning' }>;
  const entries = Object.entries(g.tableau).filter(([, n]) => n > 0);
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="dock">
      <div className="row" style={{ marginBottom: 6 }}>
        <h4 className="grow" style={{ margin: 0 }}>
          Planning: buy cards
        </h4>
        <span className="muted">
          {g.fg.time} Time · hand {g.fg.hand.length}/10
        </span>
      </div>
      <div className="hand" style={{ flexWrap: 'wrap', overflowX: 'visible' }}>
        {entries.map(([c, n]) => (
          <ActionCard key={c} id={c} count={n} sel={sel === c} off={!p.buyable.includes(c)} onClick={() => setSel(sel === c ? null : c)} />
        ))}
      </div>
      {sel ? <p className="lede" style={{ color: 'var(--text)' }}><b>{card(sel).name}.</b> {card(sel).text}</p> : null}
      <div className="row">
        {sel && p.buyable.includes(sel) ? (
          <button className="btn primary grow" onClick={() => { send({ t: 'buy', card: sel }); setSel(null); }} type="button">
            Buy {card(sel).name} ({card(sel).cost} Time)
          </button>
        ) : (
          <span className="grow muted">Played cards come back next round.</span>
        )}
        <button className="btn" onClick={() => send({ t: 'endPlanning' })} type="button">
          Done ▸
        </button>
      </div>
    </div>
  );
}

// ---- rescue ------------------------------------------------------------------------------

function RescueDock({ g, send }: { g: GameState; send: (i: Input) => void }) {
  const p = g.prompt as Extract<NonNullable<GameState['prompt']>, { type: 'rescue' }>;
  const fg = finalGirlDef(g.config.finalGirl);
  const vs = p.victims.map((id) => g.victims.find((v) => v.id === id)!).filter(Boolean);
  const [who, setWho] = useState(vs[0]?.id);
  useEffect(() => setWho(vs[0]?.id), [p.victims.join(',')]);
  return (
    <div className="dock">
      <h4>Save the victims here</h4>
      <p className="lede">Each one you save fills a space on {fg.name}'s card. Fill them all to unlock her Ultimate.</p>
      {vs.length > 1 && vs.some((v) => v.role) ? (
        <div className="row wrap" style={{ marginBottom: 8 }}>
          {vs.map((v) => (
            <button key={v.id} className={`btn small ${who === v.id ? 'good' : ''}`} onClick={() => setWho(v.id)} type="button">
              {v.role ? victimName(v) : 'Victim'}
            </button>
          ))}
        </div>
      ) : null}
      {p.ultimate ? (
        <button className="btn good block" onClick={() => who && send({ t: 'rescueOne', victim: who, slot: 0 })} type="button">
          Save one ({fg.extraText})
        </button>
      ) : (
        <div className="slots">
          {fg.slots.map((s, i) => (
            <button key={i} className={`slot ${g.fg.slots[i] ? 'full' : ''}`} disabled={g.fg.slots[i]} onClick={() => who && send({ t: 'rescueOne', victim: who, slot: i })} type="button">
              {g.fg.slots[i] ? '✓ ' : ''}
              {s.text}
            </button>
          ))}
        </div>
      )}
      <button className="btn ghost block" style={{ marginTop: 8 }} onClick={() => send({ t: 'rescueDone' })} type="button">
        Done
      </button>
    </div>
  );
}

// ---- search ----------------------------------------------------------------------------

function SearchDock({ g, send }: { g: GameState; send: (i: Input) => void }) {
  const p = g.prompt as Extract<NonNullable<GameState['prompt']>, { type: 'search' }>;
  const [keep, setKeep] = useState(0);
  return (
    <div className="dock">
      <h4>Search: keep one</h4>
      <div className="list">
        {p.drawn.map((id, i) => (
          <button key={`${id}-${i}`} className={`opt ${keep === i ? 'good' : ''}`} style={keep === i ? { borderColor: 'var(--good)' } : undefined} onClick={() => setKeep(i)} type="button">
            {keep === i ? '✓ ' : ''}
            <b>{itemDef(g, id).name}</b>
            <small>{itemDef(g, id).text}</small>
          </button>
        ))}
      </div>
      <p className="lede" style={{ marginTop: 8 }}>And the other one goes…</p>
      <div className="row">
        <button className="btn grow" onClick={() => send({ t: 'searchPick', keep, otherTo: 'top' })} type="button">
          On top, face up
        </button>
        <button className="btn grow" onClick={() => send({ t: 'searchPick', keep, otherTo: 'bottom' })} type="button">
          Bottom, face down
        </button>
      </div>
    </div>
  );
}

// ---- items in hands ------------------------------------------------------------------

function ArrangeDock({ g, send }: { g: GameState; send: (i: Input) => void }) {
  const p = g.prompt as Extract<NonNullable<GameState['prompt']>, { type: 'arrange' }>;
  const handItems = g.fg.items.filter((i) => itemDef(g, i.id).hands > 0);
  const [inHands, setInHands] = useState<string[]>(g.fg.items.filter((i) => i.inHands).map((i) => i.uid));
  const used = inHands.reduce((s, u) => s + itemDef(g, g.fg.items.find((i) => i.uid === u)!.id).hands, 0);
  return (
    <div className="dock">
      <h4>{p.optional ? 'Rearrange your items?' : 'Your hands are full'}</h4>
      <p className="lede">You have two hands. Everything else goes in your backpack (and can't be used until it's back in your hands).</p>
      <div className="list">
        {handItems.map((it) => {
          const d = itemDef(g, it.id);
          const on = inHands.includes(it.uid);
          const fits = on || used + d.hands <= 2;
          return (
            <button key={it.uid} className="opt" disabled={!fits} onClick={() => setInHands(on ? inHands.filter((x) => x !== it.uid) : [...inHands, it.uid])} type="button" style={on ? { borderColor: 'var(--fg)' } : undefined}>
              {on ? '✋ In hands: ' : '🎒 Backpack: '}
              <b>{d.name}</b> ({d.hands} hand{d.hands === 1 ? '' : 's'})<small>{d.text}</small>
            </button>
          );
        })}
      </div>
      <button className="btn primary block" style={{ marginTop: 8 }} onClick={() => send({ t: 'arrange', inHands })} type="button">
        Done
      </button>
    </div>
  );
}

function DiscardDownDock({ g, send }: { g: GameState; send: (i: Input) => void }) {
  const p = g.prompt as Extract<NonNullable<GameState['prompt']>, { type: 'discardDown' }>;
  const [picked, setPicked] = useState<number[]>([]);
  return (
    <div className="dock">
      <h4>Too many cards: discard {p.excess}</h4>
      <div className="hand">
        {g.fg.hand.map((c, i) => (
          <ActionCard key={`${c}-${i}`} id={c} sel={picked.includes(i)} onClick={() => setPicked(picked.includes(i) ? picked.filter((x) => x !== i) : picked.length < p.excess ? [...picked, i] : picked)} />
        ))}
      </div>
      <button className="btn primary block" disabled={picked.length !== p.excess} onClick={() => send({ t: 'discardDown', cards: picked.map((i) => g.fg.hand[i]) })} type="button">
        Discard
      </button>
    </div>
  );
}
