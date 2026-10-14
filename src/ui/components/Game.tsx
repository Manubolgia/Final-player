import { useEffect, useMemo, useRef, useState } from 'react';
import { act, RuleError, type GameState, type Input, type LogEntry } from '../../game';
import { finalGirlDef, killerDef, locationDef } from '../../game/content';
import { eventDef, itemDef, terrorDef } from '../../game/engine/kernel';
import { Cards, Expand, Menu, Scroll } from '../art/Icons';
import type { Prefs } from '../persistence';
import { BigCard, type BigKind } from './Cards';
import { Dock } from './Dock';
import { MapView, zonePoint, type MapFx } from './MapView';
import { KillerPanel, PlayerPanel } from './Panels';
import { RulesSheet } from './Rules';
import { KillerSheet, LogSheet, PlayerSheet, Sheet, ZoneSheet } from './Sheets';

interface Props {
  g: GameState;
  /** Log entries after this one are played back on mount (0 for a fresh game). */
  startAt: number;
  setG: (g: GameState) => void;
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  onQuit: () => void;
  onRestart: (same: boolean) => void;
}

const PHASE = { setup: 'Setup', action: 'Action', planning: 'Planning', killer: 'Killer', panic: 'Panic', upkeep: 'Upkeep' } as const;

function cardFor(g: GameState, e: LogEntry): { kind: BigKind; title: string; text: string } | null {
  if (e.anim?.kind !== 'card') return null;
  const { deck, id } = e.anim;
  const k = killerDef(g.config.killer);
  try {
    switch (deck) {
      case 'terror': {
        const t = terrorDef(g, id);
        return { kind: t.minor ? 'minor' : 'terror', title: t.name, text: t.text };
      }
      case 'event': {
        const ev = eventDef(g, id);
        return { kind: 'event', title: ev.name, text: ev.text };
      }
      case 'darkPower': {
        const d = k.darkPowers.find((x) => x.id === id)!;
        return { kind: 'darkPower', title: d.name, text: d.text };
      }
      case 'finale': {
        const f = k.finales.find((x) => x.id === id)!;
        return { kind: 'finale', title: f.name, text: f.text ?? 'A new killer action takes over. No more Terror cards are drawn.' };
      }
      case 'item': {
        const it = itemDef(g, id);
        return { kind: 'item', title: it.name, text: it.text };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function Game({ g, startAt, setG, prefs, setPrefs, onQuit, onRestart }: Props) {
  const [played, setPlayed] = useState(startAt);
  const [cur, setCur] = useState<LogEntry | null>(null);
  const [t, setT] = useState(0);
  const [sheet, setSheet] = useState<null | 'killer' | 'player' | 'log' | 'rules' | 'menu' | { zone: string }>(null);
  const [bigMap, setBigMap] = useState(false);
  const [bring, setBring] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [flash, setFlash] = useState(0);
  const speed = prefs.speed === 'fast' ? 0.45 : prefs.speed === 'slow' ? 1.6 : 1;

  const pending = g.log.filter((e) => e.n > played);
  const busy = !!cur || pending.length > 0;

  // follower picks reset whenever a new move prompt shows up
  useEffect(() => {
    if (g.prompt?.type === 'move') setBring(g.prompt.followers.slice(0, g.prompt.followLimit).filter((id) => g.victims.find((v) => v.id === id && v.role)));
    else setBring([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.log.length, g.prompt?.type]);

  // play the log back one entry at a time
  useEffect(() => {
    if (cur) return;
    const next = g.log.find((e) => e.n > played);
    if (!next) return;
    setCur(next);
    setT(0);
  }, [cur, played, g.log]);

  const raf = useRef(0);
  useEffect(() => {
    if (!cur) return;
    const a = cur.anim;
    if (a?.kind === 'card') return; // waits for a tap
    let dur = 0;
    if (a?.kind === 'killerMove') dur = 260 * Math.max(1, a.path.length - 1) + 140;
    else if (a?.kind === 'victimDie') dur = 520;
    else if (a?.kind === 'victimMove') dur = 360;
    else if (a?.kind === 'dice') dur = 520;
    else if (cur.tone === 'phase') dur = 380;
    else if (cur.tone === 'killer') dur = 260;
    else dur = 70;
    dur *= speed;
    if (a?.kind === 'victimDie' || /attacks you/.test(cur.text)) setFlash((f) => f + 1);
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / Math.max(1, dur));
      setT(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else {
        setPlayed(cur.n);
        setCur(null);
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [cur, speed]);

  const skip = () => {
    cancelAnimationFrame(raf.current);
    setPlayed(g.log[g.log.length - 1]?.n ?? 0);
    setCur(null);
  };

  const send = (inp: Input) => {
    try {
      setG(act(g, inp));
    } catch (e) {
      if (e instanceof RuleError || e instanceof Error) {
        setToast(e.message);
        setTimeout(() => setToast(null), 2200);
        if (!(e instanceof RuleError)) console.error(e);
      }
    }
  };

  // where to draw things mid-animation
  const loc = locationDef(g.config.location);
  const fx: MapFx = useMemo(() => {
    const out: MapFx = {};
    const pt = (id: string) => {
      const z = loc.zones.find((x) => x.id === id);
      return z ? zonePoint(z, loc.aspect) : null;
    };
    const a = cur?.anim;
    if (a?.kind === 'killerMove' && !a.minion && a.path.length) {
      const segs = a.path.length - 1;
      if (segs <= 0) out.killerAt = pt(a.path[0]);
      else {
        const x = t * segs;
        const i = Math.min(segs - 1, Math.floor(x));
        const f = x - i;
        const p = pt(a.path[i]);
        const q = pt(a.path[i + 1]);
        if (p && q) out.killerAt = { x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f };
      }
      out.trail = a.path;
    } else if (a?.kind === 'killerMove') out.trail = a.path;
    if (!out.killerAt) {
      const nextMove = pending.find((e) => e !== cur && e.anim?.kind === 'killerMove' && !e.anim.minion);
      if (nextMove && nextMove.anim?.kind === 'killerMove') out.killerAt = pt(nextMove.anim.path[0]);
    }
    if (a?.kind === 'victimDie') out.deaths = [a.zone];
    if (a?.kind === 'victimMove' && a.path.length === 2) out.runner = { from: a.path[0], to: a.path[1], t };
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, t, played, g]);

  const p = g.prompt;
  const selectable = !busy && p?.type === 'move' ? p.to : !busy && p?.type === 'choice' ? (p.options.map((o) => o.zone).filter(Boolean) as string[]) : [];
  const onTap = (zone: string) => {
    if (!busy && p?.type === 'move' && p.to.includes(zone)) return send({ t: 'moveTo', zone, bring });
    if (!busy && p?.type === 'choice') {
      const o = p.options.find((x) => x.zone === zone);
      if (o) return send({ t: 'choose', id: o.id });
    }
    setSheet({ zone });
  };

  const visible = g.log.filter((e) => e.n <= played).slice(-2);
  const big = cur ? cardFor(g, cur) : null;
  const k = killerDef(g.config.killer);
  const fg = finalGirlDef(g.config.finalGirl);
  const done = g.outcome && !busy;

  return (
    <div className="app">
      <div className="topbar">
        <button className="icon-btn" onClick={() => setSheet('menu')} aria-label="Menu" type="button">
          <Menu />
        </button>
        <div className="phase">
          Turn {g.turn} · {PHASE[g.phase]}
          <small>
            {fg.name} vs {k.name} · {loc.name}
          </small>
        </div>
        <button className="icon-btn" onClick={() => setSheet('killer')} aria-label="Terror deck" type="button">
          <Cards />
          <span className="badge">{g.terrorDeck.length}</span>
        </button>
        <button className="icon-btn" onClick={() => setSheet('log')} aria-label="Log" type="button">
          <Scroll />
        </button>
      </div>

      <KillerPanel g={g} onOpen={() => setSheet('killer')} />

      <div className="map-wrap">
        <MapView g={g} selectable={selectable} onTap={onTap} fx={fx} />
        <div className="map-tools">
          <button onClick={() => setBigMap(true)} aria-label="Bigger map" type="button">
            <Expand />
          </button>
        </div>
        {selectable.length ? <div className="map-hint">Tap a lit space</div> : null}
      </div>

      <PlayerPanel g={g} onOpen={() => setSheet('player')} />

      <div className="ticker" aria-live="polite">
        {visible.map((e) => (
          <div key={e.n} className={`tone-${e.tone}`}>
            {e.text}
          </div>
        ))}
        {cur && !big ? <div className={`tone-${cur.tone}`}>{cur.text}</div> : null}
      </div>

      <div style={{ position: 'relative' }}>
        {busy ? (
          <div className="dock row">
            <span className="muted grow">{k.name === 'The Birds' ? '…' : g.phase === 'killer' ? `${k.name} is coming…` : '…'}</span>
            <button className="btn small" onClick={skip} type="button">
              Skip ▸▸
            </button>
          </div>
        ) : g.outcome ? null : (
          <Dock g={g} send={send} bring={bring} setBring={setBring} />
        )}
      </div>

      {big && cur ? (
        <div
          className="overlay"
          onClick={() => {
            setPlayed(cur.n);
            setCur(null);
          }}
        >
          <div>
            <BigCard kind={big.kind} title={big.title} text={big.text} />
            <div className="tap-hint">Tap to continue</div>
          </div>
        </div>
      ) : null}

      {flash ? <div key={flash} className="flash" /> : null}
      {toast ? (
        <div className="overlay" style={{ background: 'transparent', pointerEvents: 'none', alignItems: 'start', paddingTop: 80 }}>
          <div className="chip fin" style={{ fontSize: 16, padding: '8px 12px', background: '#300' }}>
            {toast}
          </div>
        </div>
      ) : null}

      {bigMap ? (
        <div className="sheet" style={{ background: '#000', justifyContent: 'stretch' }}>
          <div className="topbar">
            <div className="phase">{loc.name}</div>
            <button className="icon-btn" onClick={() => setBigMap(false)} aria-label="Close map" type="button">
              ✕
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <MapView
              g={g}
              big
              selectable={selectable}
              onTap={(z) => {
                setBigMap(false);
                onTap(z);
              }}
              fx={fx}
            />
          </div>
        </div>
      ) : null}

      {sheet === 'killer' ? <KillerSheet g={g} onClose={() => setSheet(null)} /> : null}
      {sheet === 'player' ? <PlayerSheet g={g} onClose={() => setSheet(null)} /> : null}
      {sheet === 'log' ? <LogSheet g={g} onClose={() => setSheet(null)} /> : null}
      {sheet === 'rules' ? <RulesSheet onClose={() => setSheet(null)} /> : null}
      {sheet && typeof sheet === 'object' ? <ZoneSheet g={g} zone={sheet.zone} onClose={() => setSheet(null)} /> : null}
      {sheet === 'menu' ? (
        <Sheet title="Paused" onClose={() => setSheet(null)}>
          <div className="list">
            <button className="opt" onClick={() => setSheet('rules')} type="button">
              How to play
            </button>
            <div className="opt">
              Animation speed
              <div className="seg" style={{ marginTop: 6 }}>
                {(['slow', 'normal', 'fast'] as const).map((s) => (
                  <button key={s} className={prefs.speed === s ? 'on' : ''} onClick={() => setPrefs({ ...prefs, speed: s })} type="button">
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button className="opt" onClick={() => onRestart(true)} type="button">
              Restart this film
              <small>Same killer, place and Final Girl, new shuffle.</small>
            </button>
            <button className="opt" onClick={onQuit} type="button">
              Back to the title
              <small>This game is saved; you can continue it later.</small>
            </button>
          </div>
        </Sheet>
      ) : null}

      {done ? (
        <div className={`end-screen ${g.outcome!.winner === 'finalGirl' ? 'win' : ''}`}>
          <div className="big">{g.outcome!.winner === 'finalGirl' ? 'You survived' : 'The End'}</div>
          <p style={{ fontSize: 19, maxWidth: 360 }}>{g.outcome!.text}</p>
          <p className="muted">
            Turn {g.turn} · {g.fg.saved} saved · {g.dead.length} dead
          </p>
          <div className="row">
            <button className="btn primary" onClick={() => onRestart(true)} type="button">
              Play again
            </button>
            <button className="btn" onClick={onQuit} type="button">
              Title
            </button>
            <button className="btn ghost" onClick={() => setSheet('log')} type="button">
              Log
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
