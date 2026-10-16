import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { act, RuleError, type GameState, type Input, type LogEntry } from '../../game';
import { killerDef } from '../../game/content';
import { eventDef, terrorDef } from '../../game/engine/kernel';
import { Board } from '../board/Board';
import { RevealCard } from '../cards/Cards';
import { Dock, type Playback } from '../dock/Dock';
import { boardVars, PHASE_NAME, PHASE_SHORT } from '../film';
import { setHaptics } from '../fx/haptics';
import { setSound, sfx } from '../fx/sound';
import { keepAwake } from '../fx/wakeLock';
import type { Prefs } from '../persistence';
import { Menu, Play, Scroll, Zoom, ZoomOut } from '../pieces/icons';
import { GirlSheet, KillerSheet, LogSheet, MenuSheet, RulesSheet, ZoneSheet } from '../sheets';
import { KillerStrip, GirlStrip, filmSticker } from '../strips/Strips';
import { DiceFlash, EndScreen, Reveal, TitleCard, Toast, cardFor } from '../overlays/Overlays';
import { liveView, snapView, type BoardFx, type DisplayView } from './display';

interface Props {
  g: GameState;
  startAt: number;
  setG: (g: GameState) => void;
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  onQuit: () => void;
  onRestart: () => void;
}

type SheetState = null | 'killer' | 'girl' | 'log' | 'rules' | 'menu' | { zone: string } | { deck: 'terror' | 'event'; id: string };

const SPEED = { slow: 1.6, normal: 1, fast: 0.55 } as const;

function titleFor(g: GameState, e: LogEntry): { title: string; sub?: string } | null {
  if (e.tone !== 'phase') return null;
  const turn = /^— Turn (\d+) —$/.exec(e.text);
  if (turn) return { title: `Turn ${turn[1]}`, sub: 'Your move.' };
  if (e.text === 'Killer Phase') {
    const k = killerDef(g.config.killer);
    const td = e.snap?.td ?? g.terrorDeck.length;
    return { title: k.bodiless ? 'The birds are coming' : `${k.name} is coming`, sub: g.killer.finaleRevealed ? 'The finale.' : `${td} Terror ${td === 1 ? 'card' : 'cards'} left.` };
  }
  if (e.text === 'Planning Phase') return { title: 'Planning', sub: 'Spend your Time.' };
  return null;
}

/** What a horror roll came to: stars (and 3-4s when they count), or a fail. */
function verdictOf(g: GameState, faces: number[]): string {
  const partials = !!(g.mods.partialsNext || g.mods.partialsPhase);
  const n = faces.filter((f) => f >= 5 || (partials && f >= 3)).length;
  return n === 0 ? 'Fail' : n === 1 ? '1 star' : `${n} stars`;
}

type TipId = 'hand' | 'move' | 'deck';
const TIPS: Record<TipId, string> = {
  hand: 'Tap a card to pick it up',
  move: 'Tap a lit space to move',
  deck: 'The Terror deck is the clock: when it runs out, the Finale begins',
};

export function GameScreen({ g, startAt, setG, prefs, setPrefs, onQuit, onRestart }: Props) {
  const [played, setPlayed] = useState(startAt);
  const [cur, setCur] = useState<LogEntry | null>(null);
  const [step, setStep] = useState(0);
  const [fast, setFast] = useState(false);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [zoom, setZoom] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [shake, setShakeOn] = useState(false);
  const setShake = (_: unknown) => {
    setShakeOn(true);
    setTimeout(() => setShakeOn(false), 320);
  };
  const [splats, setSplats] = useState<string[]>([]);
  const [bring, setBring] = useState<string[]>([]);
  const [opening, setOpening] = useState(startAt === 0);
  const settled = useRef<DisplayView>(liveView(g));
  const sp = SPEED[prefs.speed] * (fast ? 0.25 : 1);

  useEffect(() => setSound(prefs.sound), [prefs.sound]);
  useEffect(() => setHaptics(prefs.haptics), [prefs.haptics]);
  useEffect(() => {
    document.documentElement.dataset.text = prefs.text;
  }, [prefs.text]);
  useEffect(() => {
    keepAwake(prefs.awake);
    return () => keepAwake(false);
  }, [prefs.awake]);
  useEffect(() => {
    if (!opening) return;
    sfx.whir();
    const t = setTimeout(() => {
      setOpening(false);
      sfx.thunk();
    }, 900);
    return () => clearTimeout(t);
  }, [opening]);

  const pending = useMemo(() => g.log.filter((e) => e.n > played), [g.log, played]);
  const busy = !!cur || pending.length > 0;
  // an open sheet pauses playback
  const paused = sheet !== null;

  // bring-along defaults: the first followers you're allowed, special roles first
  useEffect(() => {
    const p = g.prompt;
    if (p?.type === 'move') {
      const vs = p.followers.map((id) => g.victims.find((v) => v.id === id)).filter(Boolean) as { id: string; role?: string }[];
      vs.sort((a, b) => +!!b.role - +!!a.role);
      setBring(vs.slice(0, p.followLimit).map((v) => v.id));
    } else setBring([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.log.length, g.prompt?.type]);

  // ---- playback ------------------------------------------------------------------------
  useEffect(() => {
    if (cur || paused) return;
    const next = g.log.find((e) => e.n > played);
    if (!next) return;
    setCur(next);
    setStep(0);
  }, [cur, played, g.log, paused]);

  const finish = useCallback(() => {
    setCur((c) => {
      if (c) {
        setPlayed(c.n);
        if (c.anim?.kind === 'victimDie') setSplats((s) => [...s, (c.anim as { zone: string }).zone]);
        if (c.tone === 'phase' && c.text === 'Action Phase') setSplats([]);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (!cur || paused) return;
    const a = cur.anim;
    const inAction = cur.phase === 'action';
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    if (a?.kind === 'card') {
      if (cardFor(g, cur)?.kind === 'terror') sfx.terror();
      else sfx.slap();
      return; // the reveal finishes it
    }
    if (titleFor(g, cur)) return; // the title card finishes it
    if (/attacks you|loses \d+ health/.test(cur.text)) {
      setShake(1);
      sfx.sting();
    }
    if (/Bloodlust rises/.test(cur.text)) sfx.clunk();
    if (a?.kind === 'killerMove') {
      const steps = Math.max(0, a.path.length - 1);
      for (let i = 1; i <= steps; i++)
        at(i * 280 * sp, () => {
          setStep(i);
          sfx.step();
        });
      at((steps * 280 + 160) * sp, finish);
    } else if (a?.kind === 'fgMove') {
      at(20, () => setStep(1));
      at(320 * sp, finish);
    } else if (a?.kind === 'victimMove') {
      at(20, () => setStep(1));
      at(420 * sp, finish);
    } else if (a?.kind === 'victimDie') {
      sfx.death();
      at(680 * sp, finish);
    } else if (a?.kind === 'dice') {
      if (inAction && g.prompt?.type === 'roll' && g.log[g.log.length - 1]?.n === cur.n) at(0, finish);
      else {
        // your own rolls get a proper beat: tumble, land, read the verdict
        sfx.dice();
        at((inAction ? 1200 : 720) * sp, finish);
      }
    } else if (inAction || cur.phase === 'setup') at(cur.tone === 'killer' ? 160 * sp : 30, finish);
    else at((cur.tone === 'killer' || cur.tone === 'bad' ? 340 : cur.tone === 'phase' ? 200 : 170) * sp, finish);
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, paused]);

  const skip = () => {
    const nextCard = g.log.find((e) => e.n > (cur?.n ?? played) && e.anim?.kind === 'card');
    const deaths = g.log.filter((e) => e.n > played && e.n < (nextCard?.n ?? Infinity) && e.anim?.kind === 'victimDie').map((e) => (e.anim as { zone: string }).zone);
    setSplats((s) => [...s, ...deaths]);
    setPlayed(nextCard ? nextCard.n - 1 : g.log[g.log.length - 1]?.n ?? 0);
    setCur(null);
  };

  // ---- what the table shows right now ---------------------------------------------------
  const view: DisplayView = useMemo(() => {
    if (!busy) return liveView(g);
    if (cur?.anim?.kind === 'victimDie' && cur.snap) return snapView(cur.snap);
    for (let i = g.log.length - 1; i >= 0; i--) {
      const e = g.log[i];
      if (e.n > played) continue;
      if (e.snap) return snapView(e.snap);
      break;
    }
    return settled.current;
  }, [busy, g, played, cur]);

  const fx: BoardFx = useMemo(() => {
    const out: BoardFx = {};
    const a = cur?.anim;
    if (!a) return out;
    if (a.kind === 'killerMove') {
      const z = a.path[Math.min(step, a.path.length - 1)];
      if (a.minion) out.minionAt = { id: a.minion, zone: z };
      else {
        out.killerAt = z;
        out.trail = a.path;
      }
    } else if (a.kind === 'fgMove') {
      const z = step >= 1 ? a.path[a.path.length - 1] : a.path[0];
      out.fgAt = z;
      out.runners = Object.fromEntries((a.victims ?? []).map((v) => [v, z]));
    } else if (a.kind === 'victimMove') {
      out.runners = { [a.victim]: step >= 1 ? a.path[a.path.length - 1] : a.path[0] };
      if (a.path.length === 2) out.panicEdge = [a.path[0], a.path[1]];
    } else if (a.kind === 'victimDie') out.dying = a.zone;
    return out;
  }, [cur, step]);

  // ---- input ------------------------------------------------------------------------------
  const send = (inp: Input) => {
    try {
      settled.current = view;
      setG(act(g, inp));
    } catch (e) {
      if (e instanceof RuleError || e instanceof Error) {
        setToast(e.message);
        sfx.error();
        setTimeout(() => setToast(null), 2200);
        if (!(e instanceof RuleError)) console.error(e);
      }
    }
  };

  const p = g.prompt;
  const targets = !busy && p?.type === 'move' ? p.to : !busy && p?.type === 'choice' ? (p.options.map((o) => o.zone).filter(Boolean) as string[]) : [];
  const onTarget = (zone: string) => {
    if (busy) return;
    if (p?.type === 'move' && p.to.includes(zone)) return send({ t: 'moveTo', zone, bring });
    if (p?.type === 'choice') {
      const o = p.options.find((x) => x.zone === zone);
      if (o) return send({ t: 'choose', id: o.id });
    }
  };

  const k = killerDef(g.config.killer);
  const showBusy = busy && !!cur && cur.phase !== 'action';
  const playback: Playback | null = showBusy
    ? {
        title:
          cur!.phase === 'killer'
            ? `${k.bodiless ? 'The birds are gathering' : `${k.name} is hunting`}`
            : cur!.phase === 'setup'
              ? 'Opening credits'
              : PHASE_NAME[cur!.phase],
        lines: g.log
          .filter((e) => e.n <= cur!.n && e.n > Math.max(0, cur!.n - 12))
          .slice(-6)
          .map((e) => ({ n: e.n, text: e.text, tone: e.tone })),
        fast,
        setFast,
        skip,
      }
    : null;
  const waiting = busy && !showBusy;

  const title = cur ? titleFor(g, cur) : null;
  const done = g.outcome && !busy;
  const active = [...g.activeEvents.map((id) => ({ deck: 'event' as const, id })), ...g.activeTerror.map((id) => ({ deck: 'terror' as const, id }))];
  const dicePlaying = cur?.anim?.kind === 'dice' && !(cur.phase === 'action' && g.prompt?.type === 'roll' && g.log[g.log.length - 1]?.n === cur.n) ? cur.anim.faces : null;

  // during playback the tape counter follows the moment being shown, not the live state
  const shownTurn = cur?.turn ?? g.turn;
  const shownPhase = cur?.phase ?? g.phase;
  const sticker = filmSticker(g, view);

  // first-run tips: three paper stickers, each shown once
  const seen = prefs.tips ?? [];
  const tip: TipId | null =
    busy || sheet || done || opening
      ? null
      : g.prompt?.type === 'main' && !seen.includes('hand')
        ? 'hand'
        : g.prompt?.type === 'move' && !seen.includes('move')
          ? 'move'
          : g.prompt?.type === 'main' && g.turn >= 2 && !seen.includes('deck')
            ? 'deck'
            : null;

  return (
    <div className={`app game-app${g.killer.finaleRevealed ? ' finale' : ''}`} style={boardVars(g)}>
      <div
        className={`game${shake ? ' shake' : ''}${opening ? ' opening' : ''}${waiting ? ' waiting' : ''}${prefs.hand === 'left' ? ' left-handed' : ''}`}
        data-phase={g.phase}
        // a tip peels off with your first real tap, which still goes through
        onPointerDownCapture={tip ? () => setPrefs({ ...prefs, tips: [...seen, tip] }) : undefined}
      >
        <KillerStrip g={g} view={view} onOpen={() => setSheet('killer')} />
        <div className="board">
          <div className="board-head">
            <button type="button" className="chit" aria-label="Menu" onClick={() => setSheet('menu')}>
              <Menu />
            </button>
            <span className="tape" aria-label={`Turn ${shownTurn}, ${PHASE_NAME[shownPhase]} phase`}>
              T{String(shownTurn).padStart(2, '0')}
              <Play className="ico" />
              {PHASE_SHORT[shownPhase]}
            </span>
            <span className="sleeves">
              {active.slice(0, 3).map((c) => (
                <button key={`${c.deck}${c.id}`} type="button" className={`sleeve ${c.deck}`} aria-label={c.deck === 'event' ? eventDef(g, c.id).name : terrorDef(g, c.id).name} onClick={() => setSheet(c)} />
              ))}
              {active.length > 3 ? <span className="sleeve-more">+{active.length - 3}</span> : null}
            </span>
            <span className="grow spacer" />
            <button type="button" className="chit panic-t" aria-label="Show every panic number" aria-pressed={prefs.panicAll} onClick={() => setPrefs({ ...prefs, panicAll: !prefs.panicAll })}>
              <b>1-6</b>
            </button>
            <button type="button" className="chit zoom-t" aria-label={zoom ? 'Zoom out' : 'Zoom in'} aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
              {zoom ? <ZoomOut /> : <Zoom />}
            </button>
            <button type="button" className="chit" aria-label="Log" onClick={() => setSheet('log')}>
              <Scroll />
            </button>
          </div>
          <Board
            g={g}
            view={view}
            fx={fx}
            splats={splats}
            targets={targets}
            pressed={pressed}
            panicAll={prefs.panicAll}
            inspect={sheet && typeof sheet === 'object' && 'zone' in sheet ? sheet.zone : null}
            zoom={zoom}
            onTarget={onTarget}
            onInspect={(zone) => setSheet({ zone })}
          />
          <div className="board-foot">
            {sticker ? <span className={`sticker sm film-st ${sticker.cls}`}>{sticker.text}</span> : null}
            <span className="grow" />
            <button type="button" className="chit panic-t" aria-label="Show every panic number" aria-pressed={prefs.panicAll} onClick={() => setPrefs({ ...prefs, panicAll: !prefs.panicAll })}>
              <b>1-6</b>
            </button>
            <button type="button" className="chit zoom-t" aria-label={zoom ? 'Zoom out' : 'Zoom in'} aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
              {zoom ? <ZoomOut /> : <Zoom />}
            </button>
          </div>
          {title && cur ? <TitleCard title={title.title} sub={title.sub} onDone={finish} ms={900 * sp} /> : null}
          {dicePlaying ? (
            <DiceFlash
              faces={dicePlaying}
              label={cur?.phase === 'panic' || /panic/i.test(cur?.text ?? '') ? 'Panic' : 'Roll'}
              verdict={cur?.phase === 'action' ? verdictOf(g, dicePlaying) : undefined}
            />
          ) : null}
        </div>
        <GirlStrip g={g} view={view} onOpen={() => setSheet('girl')} />
        <Dock g={g} send={send} busy={playback} bring={bring} setBring={setBring} setPressed={setPressed} />
        {tip ? (
          <div className={`tip-sticker tip-${tip}`} role="note">
            {TIPS[tip]}
          </div>
        ) : null}
      </div>

      {cur?.anim?.kind === 'card' ? <Reveal key={cur.n} g={g} entry={cur} onDone={finish} auto={fast} /> : null}
      {toast ? <Toast text={toast} /> : null}
      {done ? <EndScreen g={g} onRestart={onRestart} onQuit={onQuit} onLog={() => setSheet('log')} /> : null}

      {sheet === 'killer' ? <KillerSheet g={g} view={view} onClose={() => setSheet(null)} onReveal={(deck, id) => setSheet({ deck, id })} /> : null}
      {sheet === 'girl' ? <GirlSheet g={g} view={view} onClose={() => setSheet(null)} /> : null}
      {sheet === 'log' ? <LogSheet g={g} onClose={() => setSheet(null)} /> : null}
      {sheet === 'rules' ? <RulesSheet onClose={() => setSheet(null)} /> : null}
      {sheet === 'menu' ? <MenuSheet prefs={prefs} setPrefs={setPrefs} onClose={() => setSheet(null)} onRules={() => setSheet('rules')} onRestart={onRestart} onQuit={onQuit} /> : null}
      {sheet && typeof sheet === 'object' && 'zone' in sheet ? <ZoneSheet g={g} view={view} zone={sheet.zone} onClose={() => setSheet(null)} /> : null}
      {sheet && typeof sheet === 'object' && 'deck' in sheet ? (
        <div className="overlay" onClick={() => setSheet(null)}>
          <div className="reveal-wrap">
            {sheet.deck === 'event' ? (
              <RevealCard kind="event" title={eventDef(g, sheet.id).name} text={eventDef(g, sheet.id).text} band="Event · in play" />
            ) : (
              <RevealCard kind="terror" title={terrorDef(g, sheet.id).name} text={terrorDef(g, sheet.id).text} band="Terror · in play" />
            )}
            <div className="tap-hint">Tap to close</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
