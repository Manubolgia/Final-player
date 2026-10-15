import { useEffect, useState } from 'react';
import type { GameState, LogEntry } from '../../game';
import { FILMS, finalGirlDef, killerDef, locationDef } from '../../game/content';
import { eventDef, itemDef, terrorDef } from '../../game/engine/kernel';
import { RevealCard, type RevealKind } from '../cards/Cards';
import { DieFace, Eject, Rewind, Scroll } from '../pieces/icons';
import { PipDie } from '../sheets/bits';
import { inLibrary, backToLibrary } from '../library';

export function cardFor(g: GameState, e: LogEntry): { kind: RevealKind; title: string; text: string; band?: string; item?: ReturnType<typeof itemDef> } | null {
  if (e.anim?.kind !== 'card') return null;
  const { deck, id } = e.anim;
  const k = killerDef(g.config.killer);
  try {
    switch (deck) {
      case 'terror': {
        const t = terrorDef(g, id);
        return { kind: t.minor ? 'minor' : 'terror', title: t.name, text: t.text, band: t.minor ? 'Minor Dark Power' : 'Terror' };
      }
      case 'event': {
        const ev = eventDef(g, id);
        return { kind: 'event', title: ev.name, text: ev.text };
      }
      case 'darkPower': {
        const d = k.darkPowers.find((x) => x.id === id)!;
        return { kind: 'darkPower', title: d.name, text: d.text, band: d.epic ? 'Epic Dark Power' : 'Dark Power' };
      }
      case 'finale': {
        const f = k.finales.find((x) => x.id === id)!;
        return { kind: 'finale', title: f.name, text: f.text ?? 'A new Killer action takes over. No more Terror cards are drawn.' };
      }
      case 'item': {
        const it = itemDef(g, id);
        return { kind: 'item', title: it.name, text: it.text, item: it, band: 'You found' };
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** A card flies up from its deck, flips and lands; tap to continue. Terror cards get a black jump cut first. */
export function Reveal({ g, entry, onDone, auto }: { g: GameState; entry: LogEntry; onDone: () => void; auto: boolean }) {
  const c = cardFor(g, entry);
  const [cut, setCut] = useState(c?.kind === 'terror');
  useEffect(() => {
    if (!cut) return;
    const t = setTimeout(() => setCut(false), 90);
    return () => clearTimeout(t);
  }, [cut]);
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [auto, onDone]);
  if (!c) return null;
  return (
    <div className={`overlay reveal${cut ? ' cut' : ''}`} onClick={onDone} role="dialog" aria-label={`${c.band ?? c.kind}: ${c.title}`}>
      {cut ? null : (
        <div className="reveal-wrap">
          <RevealCard kind={c.kind} title={c.title} text={c.text} band={c.band} item={c.item} className="flying" />
          <div className="tap-hint">Tap to continue</div>
        </div>
      )}
    </div>
  );
}

/** A title card across the board: TURN 2, PLANNING, HANS IS COMING. */
export function TitleCard({ title, sub, onDone, ms }: { title: string; sub?: string; onDone: () => void; ms: number }) {
  useEffect(() => {
    const t = setTimeout(onDone, ms);
    return () => clearTimeout(t);
  }, [onDone, ms]);
  return (
    <div className="titlecard" onClick={onDone}>
      <div className="tc-band">
        <div className="tc-title">{title}</div>
        {sub ? <div className="tc-sub">{sub}</div> : null}
      </div>
    </div>
  );
}

export function EndScreen({ g, onRestart, onQuit, onLog }: { g: GameState; onRestart: () => void; onQuit: () => void; onLog: () => void }) {
  const won = g.outcome!.winner === 'finalGirl';
  const k = killerDef(g.config.killer);
  const fg = finalGirlDef(g.config.finalGirl);
  const loc = locationDef(g.config.location);
  const film = FILMS.find((f) => f.killer.id === g.config.killer);
  return (
    <div className={`end-screen${won ? ' win' : ''}`}>
      <div className="end-left">
        <div className="big">{won ? 'She survived' : 'The end?'}</div>
        <p className="outcome">{g.outcome!.text}</p>
        <div className="end-keys">
          <button type="button" className="btn primary" onClick={onRestart}>
            <span className="row1">
              <Rewind className="glyph" /> Rewind
            </span>
            <span className="sub">play again</span>
          </button>
          <button type="button" className="btn" onClick={onQuit}>
            <span className="row1">
              <Eject className="glyph" /> Eject
            </span>
            <span className="sub">{inLibrary ? 'to the title' : 'to the title'}</span>
          </button>
          <button type="button" className="btn dark" onClick={onLog}>
            <span className="row1">
              <Scroll className="glyph" /> Credits
            </span>
          </button>
        </div>
        {inLibrary ? (
          <button type="button" className="btn small" onClick={backToLibrary}>
            Back to the library
          </button>
        ) : null}
      </div>
      <div className="receipt">
        <div className="rh">Rental receipt</div>
        <div className="rl">
          <span>Film</span>
          <span>{film?.name ?? k.name}</span>
        </div>
        <div className="rl">
          <span>Killer</span>
          <span>{k.name}</span>
        </div>
        <div className="rl">
          <span>Location</span>
          <span>{loc.name}</span>
        </div>
        <div className="rl">
          <span>Starring</span>
          <span>{fg.name}</span>
        </div>
        <div className="rl">
          <span>Mode</span>
          <span>{g.config.board === 'extreme' ? 'Extreme Horror' : 'Normal'}</span>
        </div>
        <div className="rule" />
        <div className="muted">
          Turn {g.turn} · {g.fg.saved} saved · {g.dead.length} dead
        </div>
        <span className={`sticker ${won ? 'gold' : 'red'}`}>{won ? 'Survivor' : 'Be kind, rewind'}</span>
      </div>
    </div>
  );
}

export function Toast({ text }: { text: string }) {
  return <div className="toast">{text}</div>;
}

/** A transient strip of dice for rolls that happen outside your prompts (panic, killer cards). */
export function DiceFlash({ faces, label }: { faces: number[]; label: string }) {
  // horror dice show blank / card pair / star; the panic die shows pips
  const panic = label === 'Panic';
  return (
    <div className="diceflash">
      <span className="df-l">{label}</span>
      {faces.map((f, i) =>
        panic ? (
          <span key={i} className="tumble" style={{ animationDelay: `${i * 60}ms` }}>
            <PipDie n={f} />
          </span>
        ) : (
          <span key={i} className={`die sm tumble${f < 3 ? ' fail' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
            <DieFace n={f} />
          </span>
        ),
      )}
    </div>
  );
}
