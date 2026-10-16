import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { GameState, Input } from '../../game';
import { card, HAND_LIMIT, isAttackCard } from '../../game/content/core';
import { finalGirlDef } from '../../game/content';
import { canSearchHere, cost } from '../../game/engine/actionPhase';
import { victimName } from '../../game/engine/board';
import { diceCount, successes } from '../../game/engine/dice';
import { itemDef, zoneName } from '../../game/engine/kernel';
import type { Prompt } from '../../game/engine/state';
import type { CardId } from '../../game/types';
import { ActionCard, EffectLine, ItemCard, matchRow, rowsOf } from '../cards/Cards';
import { victimHex } from '../film';
import { haptic } from '../fx/haptics';
import { sfx } from '../fx/sound';
import { Backpack, DieFace, FastFwd, Hand as HandIcon, Hourglass, MeepleIcon, Play, Skip, Tick } from '../pieces/icons';
import { Hand } from './Hand';
import { Key, Tray } from './parts';

export interface Playback {
  title: string;
  lines: { n: number; text: string; tone: string }[];
  fast: boolean;
  setFast: (f: boolean) => void;
  skip: () => void;
}

interface Props {
  g: GameState;
  send: (i: Input) => void;
  busy: Playback | null;
  bring: string[];
  setBring: (b: string[]) => void;
  setPressed: (zone: string | null) => void;
}

type P<T extends Prompt['type']> = Extract<Prompt, { type: T }>;

export function Dock({ g, send, busy, bring, setBring, setPressed }: Props) {
  if (busy) return <div className="dock">{<BusyTray pb={busy} />}</div>;
  const p = g.prompt;
  if (!p || g.outcome) return <div className="dock"><Tray title="…" /></div>;
  let body: ReactNode;
  switch (p.type) {
    case 'main':
      body = <MainPrompt key={`m${g.log.length}`} g={g} p={p} send={send} />;
      break;
    case 'roll':
      body = <RollPrompt g={g} p={p} send={send} />;
      break;
    case 'move':
      body = <MovePrompt g={g} p={p} send={send} bring={bring} setBring={setBring} setPressed={setPressed} />;
      break;
    case 'choice':
      body = <ChoicePrompt g={g} p={p} send={send} setPressed={setPressed} />;
      break;
    case 'planning':
      body = <PlanningPrompt g={g} p={p} send={send} />;
      break;
    case 'react':
      body = <ReactPrompt g={g} p={p} send={send} />;
      break;
    case 'rescue':
      body = <RescuePrompt g={g} p={p} send={send} />;
      break;
    case 'search':
      body = <SearchPrompt g={g} p={p} send={send} />;
      break;
    case 'arrange':
      body = <ArrangePrompt g={g} p={p} send={send} />;
      break;
    case 'discardDown':
      body = <DiscardPrompt g={g} p={p} send={send} />;
      break;
  }
  return <div className="dock">{body}</div>;
}

// ---- playback ------------------------------------------------------------------------

function BusyTray({ pb }: { pb: Playback }) {
  return (
    <Tray
      title={
        <span className="vcr-title">
          <Play className="ico" /> {pb.title}
        </span>
      }
      mode="busy"
      keys={
        <>
          <Key kind={pb.fast ? 'dark' : 'plain'} onClick={() => pb.setFast(!pb.fast)} glyph={<FastFwd className="glyph" />}>
            Fast
          </Key>
          <span className="grow" />
          <Key onClick={pb.skip} glyph={<Skip className="glyph" />}>
            Skip
          </Key>
        </>
      }
    >
      <div className="script slip">
        {pb.lines.map((l, i) => (
          <div key={l.n} className={`sl t-${l.tone}${i === pb.lines.length - 1 ? ' now' : ''}`}>
            {l.text}
          </div>
        ))}
      </div>
    </Tray>
  );
}

// ---- action phase --------------------------------------------------------------------

function notNowReason(g: GameState, c: CardId): string {
  const def = card(c);
  if (def.timing === 'reaction') return "Played when you're attacked.";
  if (def.timing === 'afterRoll') return 'Played after a horror roll.';
  if (isAttackCard(c)) return 'Nothing to attack from here.';
  if (c === 'search' && !canSearchHere(g)) return 'Needs a search space with items.';
  if (c === 'persuade') return 'Only next to a house with a victim in it.';
  return "Can't play it right now.";
}

function MainPrompt({ g, p, send }: { g: GameState; p: P<'main'>; send: (i: Input) => void }) {
  const hand = g.fg.hand;
  const [sel, setSel] = useState<number | null>(null);
  const [weapon, setWeapon] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<'play' | 'discard' | 'items'>('play');
  const [marked, setMarked] = useState<number[]>([]);
  const fg = finalGirlDef(g.config.finalGirl);
  const timeEach = fg.ultimate.ability === 'ult.sheila' && g.fg.ultimate ? 2 : 1;
  const selCard = sel !== null ? hand[sel] : null;
  const play = selCard ? p.playable.find((x) => x.card === selCard) : undefined;
  const strike = p.strike;

  useEffect(() => {
    if (!play) return setWeapon(undefined);
    const best = [...play.weapons].sort((a, b) => (itemDef(g, g.fg.items.find((x) => x.uid === b)!.id).damage ?? 0) - (itemDef(g, g.fg.items.find((x) => x.uid === a)!.id).damage ?? 0))[0];
    setWeapon(play.needsWeapon || best ? best : undefined);
  }, [selCard]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (i: number) => {
    if (mode === 'discard') {
      setMarked(marked.includes(i) ? marked.filter((x) => x !== i) : [...marked, i]);
      return;
    }
    setMode('play');
    setSel(sel === i ? null : i);
  };
  const doPlay = () => {
    if (!play || !selCard) return;
    if (play.needsWeapon && !weapon) return;
    send({ t: 'play', card: selCard, ...(weapon ? { weapon } : {}) });
  };
  const preview = selCard && play ? diceCount(g, { kind: 'action', card: selCard, ...(weapon ? { weapon } : {}) }, false) : null;

  let keys: ReactNode;
  let title = strike ? 'Strike!' : 'Your move';
  if (mode === 'discard') {
    title = `Discard for Time: tap cards`;
    keys = (
      <>
        <Key
          onClick={() => {
            setMode('play');
            setMarked([]);
          }}
        >
          Cancel
        </Key>
        <Key kind="primary" disabled={!marked.length} onClick={() => send({ t: 'discardForTime', cards: marked.map((i) => hand[i]) })} sub={`+${marked.length * timeEach} Time`}>
          Discard {marked.length}
        </Key>
      </>
    );
  } else if (selCard) {
    keys = (
      <>
        {strike ? null : (
          <Key onClick={() => send({ t: 'discardForTime', cards: [selCard] })} sub={`+${timeEach} Time`}>
            Discard
          </Key>
        )}
        {play ? (
          <Key kind="primary" onClick={doPlay} disabled={play.needsWeapon && !weapon} glyph={<Play className="glyph" />} sub={preview ? `rolls ${preview.n} ${preview.n === 1 ? 'die' : 'dice'}${weapon ? ` · ${itemDef(g, g.fg.items.find((x) => x.uid === weapon)!.id).name}` : ''}` : undefined}>
            Play {card(selCard).name}
          </Key>
        ) : (
          <Key onClick={() => setSel(null)} grow>
            Put down
          </Key>
        )}
      </>
    );
  } else {
    keys = (
      <>
        {strike ? null : (
          <Key label="Discard for Time" onClick={() => setMode('discard')} glyph={<Hourglass className="glyph" />}>
            Discard
          </Key>
        )}
        {p.items.length && !strike ? <Key label={`Items (${p.items.length})`} onClick={() => setMode(mode === 'items' ? 'play' : 'items')} kind={mode === 'items' ? 'dark' : 'plain'} glyph={<Backpack className="glyph" />}>{p.items.length}</Key> : null}
        {p.canRescue ? (
          <Key kind="good" onClick={() => send({ t: 'rescue' })}>
            Save victims
          </Key>
        ) : null}
        {p.ultimate ? (
          <Key kind="purple" onClick={() => send({ t: 'ultimate' })}>
            {p.ultimate}
          </Key>
        ) : null}
        <span className="grow" />
        <Key onClick={() => send({ t: 'endPhase' })} glyph={strike ? undefined : <Play className="glyph" />}>
          {strike ? "Don't strike" : 'End turn'}
        </Key>
      </>
    );
  }

  return (
    <>
      <Tray title={title} meta={`hand ${hand.length}/${HAND_LIMIT}`} keys={keys} mode={mode}>
        <Hand cards={hand} sel={mode === 'discard' ? null : sel} marked={mode === 'discard' ? marked : []} off={(c) => !p.playable.some((x) => x.card === c)} onPick={pick} />
      </Tray>
      <div className="stage">
        {selCard && mode === 'play' ? (
          <>
            <div className="scrim" onClick={() => setSel(null)} />
            <div className="mat lifted">
              <ActionCard id={selCard} size="mid" g={g} onClick={play ? doPlay : () => setSel(null)} notNow={play ? undefined : 'Not now'} />
              <div className="side">
                {play && preview ? (
                  <div className="slip">
                    <b>ROLLS</b>
                    <div className="dice-row">
                      {Array.from({ length: Math.min(6, preview.n) }, (_, i) => (
                        <span key={i} className="die xs">
                          <DieFace n={6} />
                        </span>
                      ))}
                      <span className="dn">{preview.n}</span>
                    </div>
                    {preview.notes.length ? <div className="notes">{preview.notes.join(' · ')}</div> : null}
                  </div>
                ) : (
                  <div className="slip">{notNowReason(g, selCard)}</div>
                )}
                {play && play.weapons.length ? (
                  <div className="weapons">
                    <b className="lab">Weapon</b>
                    {!play.needsWeapon ? (
                      <button type="button" className={`itab-btn${weapon === undefined ? ' on' : ''}`} onClick={() => setWeapon(undefined)}>
                        Bare hands
                      </button>
                    ) : null}
                    {play.weapons.map((w) => {
                      const it = itemDef(g, g.fg.items.find((x) => x.uid === w)!.id);
                      return (
                        <button key={w} type="button" className={`itab-btn${weapon === w ? ' on' : ''}`} onClick={() => setWeapon(w)}>
                          {it.name} {it.damage ? `+${it.damage}` : ''}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
        {mode === 'items' ? (
          <>
            <div className="scrim" onClick={() => setMode('play')} />
            <div className="mat items scroll-x">
              {groupItems(g, p.items).map(({ uid, acts }) => {
                const inst = g.fg.items.find((x) => x.uid === uid);
                if (!inst) return null;
                return (
                  <ItemCard key={uid} it={itemDef(g, inst.id)} uses={inst.uses} small>
                    <div className="ic-acts">
                      {acts.map((a) => (
                        <button key={a.action} type="button" className="ic-act" onClick={() => send({ t: 'item', uid: a.uid, action: a.action })}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </ItemCard>
                );
              })}
            </div>
          </>
        ) : null}
        {strike && !selCard ? <div className="slip pinned">{strike === 'victims' ? 'You may play ONE action card that deals damage: each point kills one of the victims around you.' : 'You may play action cards that deal damage against the thing in your space.'}</div> : null}
      </div>
    </>
  );
}

function groupItems(_g: GameState, items: P<'main'>['items']) {
  const m = new Map<string, P<'main'>['items']>();
  for (const a of items) {
    if (!m.has(a.uid)) m.set(a.uid, []);
    m.get(a.uid)!.push(a);
  }
  return [...m].map(([uid, acts]) => ({ uid, acts }));
}

// ---- rolls -------------------------------------------------------------------------

function rollTitle(g: GameState, p: P<'roll'>): string {
  const pu = p.purpose;
  if (pu.kind === 'action' || pu.kind === 'reaction') return card(pu.card).name;
  if (pu.kind === 'item') {
    const it = g.fg.items.find((x) => x.uid === pu.uid);
    try {
      return itemDef(g, it?.id ?? pu.id).name;
    } catch {
      return 'Item';
    }
  }
  return pu.label;
}

function RollPrompt({ g, p, send }: { g: GameState; p: P<'roll'>; send: (i: Input) => void }) {
  const [mode, setMode] = useState<'none' | 'convert' | 'close1' | 'lucky' | 'sister'>('none');
  const [die, setDie] = useState<number | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const sig = `${p.dice.join(',')}|${p.converted.join(',')}`;
  useEffect(() => {
    setMode('none');
    setDie(null);
    setPicked([]);
    sfx.dice();
  }, [sig]);
  const partials = p.dice.map((d, i) => ((d === 3 || d === 4) && !p.converted.includes(i) && !p.auto34 ? i : -1)).filter((i) => i >= 0);
  const cardId = p.purpose.kind === 'action' || p.purpose.kind === 'reaction' ? p.purpose.card : null;
  const s = successes({ dice: p.dice, converted: p.converted, auto34: p.auto34 });
  const hitRow = cardId ? matchRow(cardId, s) : -1;
  const outcome = cardId ? rowsOf(cardId)[hitRow] : null;
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
  const pickCard = (i: number) => {
    if (mode !== 'convert' || die === null) return;
    const next = picked.includes(i) ? picked.filter((x) => x !== i) : [...picked, i];
    setPicked(next);
    if (next.length === 2) setTimeout(() => send({ t: 'convert', die, discard: next.map((k) => g.fg.hand[k]) }), 200);
  };
  const hint =
    mode === 'convert'
      ? 'Pick 2 cards from your hand to pay for it.'
      : mode === 'close1' || mode === 'sister'
        ? 'Tap a die to reroll it.'
        : mode === 'lucky'
          ? 'Tap the dice to reroll.'
          : p.convertible && partials.length
            ? 'Tap a wobbling die to pay 2 cards for a star.'
            : '';
  return (
    <>
      <Tray
        title={mode === 'convert' ? `Discard 2 for a star (${picked.length}/2)` : `Horror roll · ${rollTitle(g, p)}`}
        meta={`${s} ${s === 1 ? 'success' : 'successes'}`}
        mode={mode === 'convert' ? 'convert' : 'roll'}
        keys={
          mode === 'lucky' ? (
            <>
              <Key onClick={() => setMode('none')}>Cancel</Key>
              <Key kind="primary" disabled={!picked.length} onClick={() => send({ t: 'lucky', dice: picked })}>
                Reroll {picked.length}
              </Key>
            </>
          ) : mode !== 'none' ? (
            <>
              <Key onClick={() => setMode('none')}>Cancel</Key>
              <span className="grow hint">{hint}</span>
            </>
          ) : (
            <Key kind="primary" onClick={() => send({ t: 'confirm' })} sub={outcome ? <EffectLine list={outcome.lines[0] ?? []} g={g} /> : `${s} ${s === 1 ? 'success' : 'successes'}`}>
              {outcome && outcome.lines.length > 1 ? 'Accept · choose' : 'Accept'}
            </Key>
          )
        }
      >
        <Hand cards={g.fg.hand} marked={mode === 'convert' ? picked : []} dim={mode !== 'convert'} passive={mode !== 'convert'} onPick={pickCard} />
      </Tray>
      <div className="stage">
        <div className="scrim" />
        <div className="mat rollmat">
          {cardId ? <ActionCard id={cardId} size="mid" hit={hitRow} g={g} className="ref" /> : null}
          <div className="dicetray">
            <div className="dice">
              {p.dice.map((d, i) => {
                const win = d >= 5 || p.converted.includes(i) || (p.auto34 && (d === 3 || d === 4));
                const near = !win && (d === 3 || d === 4);
                const cls = ['die', 'tumble', win ? 'win' : near ? (p.convertible ? 'near' : '') : 'fail', die === i || picked.includes(i) ? 'picked' : '', p.dice.length > 4 ? 'sm' : ''].filter(Boolean).join(' ');
                return (
                  <button key={`${i}-${d}`} type="button" className={cls} onClick={() => tapDie(i)} ref={haptic} aria-label={`Die ${d}${win ? ', success' : near ? ', can be bought' : ', blank'}`} style={{ animationDelay: `${i * 60}ms` }}>
                    <DieFace n={win && d < 5 ? 6 : d} />
                    {p.converted.includes(i) ? <span className="won sticker gold sm">paid</span> : null}
                  </button>
                );
              })}
            </div>
            <div className="succ">
              <b>{s}</b> {s === 1 ? 'SUCCESS' : 'SUCCESSES'}
            </div>
            {hint ? <div className="dt-hint">{hint}</div> : null}
          </div>
          {mode === 'none' && (p.canCloseCall || p.canLucky || p.canSister) ? (
            <div className="mods">
              {p.canCloseCall ? (
                <>
                  <Key small onClick={() => setMode('close1')} sub="uses Close Call">
                    Reroll 1
                  </Key>
                  <Key small onClick={() => send({ t: 'closeCall' })} sub="Close Call, −2 Time">
                    Reroll all
                  </Key>
                </>
              ) : null}
              {p.canLucky ? (
                <Key small onClick={() => setMode('lucky')} sub="discard lucky dice">
                  Lucky
                </Key>
              ) : null}
              {p.canSister ? (
                <Key small onClick={() => setMode('sister')} sub="−2 Time">
                  Sister
                </Key>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

// ---- moving ------------------------------------------------------------------------

function MovePrompt({ g, p, send, bring, setBring, setPressed }: { g: GameState; p: P<'move'>; send: (i: Input) => void; bring: string[]; setBring: (b: string[]) => void; setPressed: (z: string | null) => void }) {
  const followers = p.followers.map((id) => g.victims.find((v) => v.id === id)!).filter(Boolean);
  const toggle = (id: string) => {
    if (bring.includes(id)) setBring(bring.filter((x) => x !== id));
    else if (bring.length < p.followLimit) setBring([...bring, id]);
    else setBring([...bring.slice(1), id]);
  };
  return (
    <>
      <Tray
        title={`${p.title}${p.mode === 'walk' ? ` · ${p.remaining} left` : ''}`}
        meta={followers.length ? `bring ${bring.length}/${Math.min(p.followLimit, followers.length)}` : undefined}
        keys={
          <>
            {p.canStop ? <Key onClick={() => send({ t: 'stop' })}>Stay here</Key> : null}
          </>
        }
      >
        <div className="movearea">
          {followers.length ? (
          <div className="bring">
            <span className="lab">Bring along</span>
            {(
              followers.map((v) => (
                <button key={v.id} type="button" className={`btn small vt${bring.includes(v.id) ? ' good' : ''}`} onClick={() => toggle(v.id)} ref={haptic}>
                  <span className="row1">
                    <MeepleIcon color={victimHex(v.role)} size={22} />
                    {v.role ? victimName(v).replace(/^(a|the|your) /, '') : 'Victim'}
                    {bring.includes(v.id) ? <Tick className="glyph" /> : null}
                  </span>
                </button>
              ))
            )}
          </div>
          ) : null}
          <div className="goto scroll-y">
            {p.to.map((z) => (
              <button
                key={z}
                type="button"
                className="opt"
                ref={haptic}
                onPointerDown={() => setPressed(z)}
                onPointerUp={() => setPressed(null)}
                onPointerLeave={() => setPressed(null)}
                onClick={() => send({ t: 'moveTo', zone: z, bring })}
              >
                Go to {zoneName(g, z)}
              </button>
            ))}
          </div>
        </div>
      </Tray>
    </>
  );
}

// ---- choices -----------------------------------------------------------------------

function ChoicePrompt({ g, p, send, setPressed }: { g: GameState; p: P<'choice'>; send: (i: Input) => void; setPressed: (z: string | null) => void }) {
  const n = p.options.length;
  const layout = n <= 2 ? 'pair' : n <= 6 ? 'grid' : 'list';
  void g;
  return (
    <>
      <Tray title={p.title} merged>
        <div className={`options ${layout}${layout === 'list' ? ' scroll-y' : ''}`}>
          {p.options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="opt"
              ref={haptic}
              onPointerDown={() => o.zone && setPressed(o.zone)}
              onPointerUp={() => setPressed(null)}
              onPointerLeave={() => setPressed(null)}
              onClick={() => {
                sfx.key();
                send({ t: 'choose', id: o.id });
              }}
            >
              {o.label}
              {o.detail ? <small>{o.detail}</small> : null}
            </button>
          ))}
        </div>
      </Tray>
      <div className="stage">{p.detail ? <div className="slip pinned">{p.detail}</div> : null}</div>
    </>
  );
}

// ---- planning ---------------------------------------------------------------------

function PlanningPrompt({ g, p, send }: { g: GameState; p: P<'planning'>; send: (i: Input) => void }) {
  const piles = useMemo(
    () =>
      Object.entries(g.tableau)
        .map(([c, count]) => ({ c, count, cost: cost(g, c) }))
        .filter((x) => x.cost > 0)
        .sort((a, b) => a.cost - b.cost || card(a.c).name.localeCompare(card(b.c).name)),
    [g],
  );
  const [sel, setSel] = useState<string | null>(null);
  const full = g.fg.hand.length >= HAND_LIMIT;
  const why = (x: { c: string; count: number; cost: number }) => (x.count <= 0 ? 'Out' : full ? 'Hand full' : x.cost > g.fg.time ? `Short ${x.cost - g.fg.time}` : null);
  const selPile = piles.find((x) => x.c === sel);
  const canBuy = !!sel && p.buyable.includes(sel);
  return (
    <>
      <Tray
        title={`Planning · ${g.fg.time} Time to spend`}
        meta={`hand ${g.fg.hand.length}/${HAND_LIMIT}`}
        keys={
          <>
            <Key onClick={() => send({ t: 'endPlanning' })}>Done planning</Key>
            {canBuy ? (
              <Key
                kind="primary"
                onClick={() => {
                  sfx.buy();
                  send({ t: 'buy', card: sel! });
                  setSel(null);
                }}
                sub={`−${selPile?.cost} Time`}
              >
                Buy {card(sel!).name}
              </Key>
            ) : null}
          </>
        }
      >
        <Hand cards={g.fg.hand} passive />
      </Tray>
      <div className="stage">
        <div className="mat tableau stock">
          <div className="tab-list scroll-y">
            {[...piles]
              .sort((a, b) => a.cost - b.cost || +(a.count <= 0) - +(b.count <= 0))
              .map((x, i) => {
                const w = why(x);
                return (
                  <button
                    key={x.c}
                    type="button"
                    className={`acard pile${sel === x.c ? ' on' : ''}${w ? ' off' : ''}`}
                    data-timing={card(x.c).timing}
                    data-col={i % 2}
                    onClick={() => setSel(sel === x.c ? null : x.c)}
                  >
                    <span className="pspine" />
                    <span className="pname">{card(x.c).name}</span>
                    <span className="pcount">×{x.count}</span>
                    {w ? <span className="sticker sm">{w}</span> : <span className="pcost">{x.cost}</span>}
                  </button>
                );
              })}
          </div>
          {sel ? (
            // the picked card floats over the other column
            <div className={`tab-detail ${sortedCol(piles, sel) ? 'left' : 'right'}`}>
              <ActionCard id={sel} size="mid" g={g} costOverride={selPile?.cost} />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

/** Which column (0 left, 1 right) a pile lands in once sorted by cost. */
function sortedCol(piles: { c: string; cost: number; count: number }[], c: string): number {
  return [...piles].sort((a, b) => a.cost - b.cost || +(a.count <= 0) - +(b.count <= 0)).findIndex((x) => x.c === c) % 2;
}

// ---- being attacked ------------------------------------------------------------------

function ReactPrompt({ g, p, send }: { g: GameState; p: P<'react'>; send: (i: Input) => void }) {
  const live = p.cards;
  const firstIdx = g.fg.hand.findIndex((c) => live.includes(c));
  const [sel, setSel] = useState<number | null>(firstIdx >= 0 ? firstIdx : null);
  const selCard = sel !== null ? g.fg.hand[sel] : null;
  const hp = g.fg.health.hp;
  const after = Math.max(0, hp - p.damage);
  return (
    <>
      <Tray
        title={`${p.by} attacks · ${p.damage} damage`}
        keys={
          <>
            {p.items.map((it) => (
              <Key key={it.uid} onClick={() => send({ t: 'reactItem', uid: it.uid })}>
                {it.label.split(':')[0]}
              </Key>
            ))}
            <Key kind={selCard ? 'plain' : 'primary'} onClick={() => send({ t: 'takeHit' })} sub={`${hp} → ${after}`}>
              Take the hit
            </Key>
            {selCard ? (
              <Key kind="primary" onClick={() => send({ t: 'react', card: selCard })}>
                Play {card(selCard).name}
              </Key>
            ) : null}
          </>
        }
      >
        <Hand cards={g.fg.hand} sel={sel} off={(c) => !live.includes(c)} onPick={(i) => live.includes(g.fg.hand[i]) && setSel(sel === i ? null : i)} />
      </Tray>
      <div className="stage">
        <div className="attack-band">
          <span>{p.by} attacks</span>
          <span className="sticker red">{p.damage} damage</span>
          {after <= 0 ? <span className="sticker yellow sm">Final Health token!</span> : null}
        </div>
      </div>
    </>
  );
}

// ---- rescue --------------------------------------------------------------------------

function RescuePrompt({ g, p, send }: { g: GameState; p: P<'rescue'>; send: (i: Input) => void }) {
  const fg = finalGirlDef(g.config.finalGirl);
  const vs = p.victims.map((id) => g.victims.find((v) => v.id === id)!).filter(Boolean);
  const [who, setWho] = useState<string | null>(vs[0]?.id ?? null);
  const nextFree = g.fg.slots.findIndex((s) => !s);
  return (
    <>
      <Tray title={`Save victims · ${vs.length} here`} keys={<Key onClick={() => send({ t: 'rescueDone' })}>Done</Key>}>
        {/* the rescue card sits in the tray, so the board stays in view */}
        <div className="rescue-tray">
          {vs.length > 1 || p.ultimate ? (
          <div className="vtoggles">
            {vs.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`btn small vt${who === v.id ? ' good' : ''}`}
                ref={haptic}
                onClick={() => (p.ultimate ? send({ t: 'rescueOne', victim: v.id, slot: 0 }) : setWho(v.id))}
              >
                <span className="row1">
                  <MeepleIcon color={victimHex(v.role)} size={22} />
                  {v.role ? victimName(v).replace(/^(a|the|your) /, '') : 'Victim'}
                </span>
              </button>
            ))}
          </div>
          ) : null}
          <div className={`rescue-card stock${p.ultimate ? ' ult' : ''}`}>
            <div className="rc-head">{fg.name} · rescue card</div>
            {p.ultimate ? (
              <div className="rc-ult">
                <b>Ultimate</b>
                <p>{fg.ultimate.text}</p>
                <p>Each save: {fg.extraText}. Tap a victim to save them.</p>
              </div>
            ) : (
              <>
                <div className="slots">
                  {g.fg.slots.map((full, i) => (
                    <button key={i} type="button" className={`slot${full ? ' full' : ''}${i === nextFree ? ' next' : ''}`} disabled={full} ref={haptic} onClick={() => who && send({ t: 'rescueOne', victim: who, slot: i })}>
                      {full ? <span className="sticker gold sm">Saved</span> : <span className="sn">{i + 1}</span>}
                      <span className="sr">{fg.slots[i].text}</span>
                    </button>
                  ))}
                </div>
                <div className="rc-hint">{vs.length > 1 ? 'Pick a victim, then tap a reward.' : 'Tap a reward to save the victim.'}</div>
              </>
            )}
          </div>
        </div>
      </Tray>
    </>
  );
}

// ---- searching ------------------------------------------------------------------------

function SearchPrompt({ g, p, send }: { g: GameState; p: P<'search'>; send: (i: Input) => void }) {
  const [keep, setKeep] = useState(0);
  return (
    <>
      <Tray
        title={`Search: keep 1 of ${p.drawn.length}`}
        keys={
          <>
            <Key onClick={() => send({ t: 'searchPick', keep, otherTo: 'bottom' })} sub="face down">
              Rest to bottom
            </Key>
            <Key kind="primary" onClick={() => send({ t: 'searchPick', keep, otherTo: 'top' })} sub="face up">
              Rest on top
            </Key>
          </>
        }
      >
        <p className="hint">Tap the item you keep. The other goes back on the deck: on top face up, or at the bottom face down.</p>
      </Tray>
      <div className="stage">
        <div className="scrim" />
        <div className="mat search">
          {p.drawn.map((id, i) => (
            <div key={`${id}-${i}`} className="keepwrap">
              <ItemCard it={itemDef(g, id)} sel={keep === i} onClick={() => setKeep(i)} />
              {keep === i ? <span className="keep-stamp">Keep</span> : null}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ---- arranging items ------------------------------------------------------------------

function ArrangePrompt({ g, p, send }: { g: GameState; p: P<'arrange'>; send: (i: Input) => void }) {
  const [inHands, setInHands] = useState<string[]>(g.fg.items.filter((i) => i.inHands).map((i) => i.uid));
  const [shake, setShake] = useState<string | null>(null);
  const used = inHands.reduce((s, u) => s + itemDef(g, g.fg.items.find((i) => i.uid === u)!.id).hands, 0);
  const toggle = (uid: string) => {
    const it = g.fg.items.find((i) => i.uid === uid)!;
    const h = itemDef(g, it.id).hands;
    if (inHands.includes(uid)) return setInHands(inHands.filter((x) => x !== uid));
    if (h === 0) return;
    if (used + h > 2) {
      setShake(uid);
      setTimeout(() => setShake(null), 400);
      return;
    }
    setInHands([...inHands, uid]);
  };
  const lost = g.fg.items.filter((i) => itemDef(g, i.id).noBackpack && itemDef(g, i.id).hands > 0 && !inHands.includes(i.uid));
  const tab = (uid: string) => {
    const it = g.fg.items.find((i) => i.uid === uid)!;
    const d = itemDef(g, it.id);
    return (
      <button key={uid} type="button" className={`atab${shake === uid ? ' shake' : ''}`} onClick={() => toggle(uid)} disabled={d.hands === 0}>
        <span className="an">{d.name}</span>
        <span className="ah">
          {Array.from({ length: d.hands }, (_, k) => (
            <HandIcon key={k} className="ico" />
          ))}
          {it.uses !== undefined ? ` ×${it.uses}` : ''}
        </span>
        {d.noBackpack && !inHands.includes(uid) && d.hands > 0 ? <span className="sticker red sm">Will be discarded</span> : null}
      </button>
    );
  };
  return (
    <>
      <Tray
        title={p.optional ? 'Arrange your items' : 'Hands full: rearrange'}
        keys={
          <Key kind="primary" onClick={() => send({ t: 'arrange', inHands })} sub={lost.length ? `${lost.length} item will be discarded` : `${used}/2 hands`}>
            Done
          </Key>
        }
      >
        <p className="hint">Tap an item to move it between your hands and your backpack. Only items in your hands work (except no-hand items).</p>
      </Tray>
      <div className="stage">
        <div className="scrim" />
        <div className="mat arrange stock">
          <div className="ar-col">
            <div className="ar-h">
              <HandIcon className="ico" /> Hands {used}/2
            </div>
            <div className="ar-box hands">{inHands.length ? inHands.map(tab) : <span className="hint dark">Empty hands</span>}</div>
          </div>
          <div className="ar-col">
            <div className="ar-h">
              <Backpack className="ico" /> Backpack
            </div>
            <div className="ar-box pack">{g.fg.items.filter((i) => !inHands.includes(i.uid)).map((i) => tab(i.uid))}</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---- discard down ---------------------------------------------------------------------

function DiscardPrompt({ g, p, send }: { g: GameState; p: P<'discardDown'>; send: (i: Input) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  return (
    <>
      <Tray
        title={`Too many cards: discard ${p.excess}`}
        keys={
          <Key kind="primary" disabled={picked.length !== p.excess} onClick={() => send({ t: 'discardDown', cards: picked.map((i) => g.fg.hand[i]) })}>
            Discard {picked.length}/{p.excess}
          </Key>
        }
      >
        <Hand cards={g.fg.hand} marked={picked} onPick={(i) => setPicked(picked.includes(i) ? picked.filter((x) => x !== i) : picked.length < p.excess ? [...picked, i] : picked)} />
      </Tray>
      <div className="stage" />
    </>
  );
}
