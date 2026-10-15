// "Paused": resume, the rules, the settings, restart and the ways out.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { sfx } from '../fx/sound';
import { backToLibrary, inLibrary } from '../library';
import type { Prefs } from '../persistence';
import { Eject, Eye, Hand, Play, Question, Rewind, Swap, Volume } from '../pieces/icons';
import { SheetFrame } from './Sheet';

export function MenuSheet({
  prefs,
  setPrefs,
  onClose,
  onRules,
  onRestart,
  onQuit,
}: {
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  onClose: () => void;
  onRules: () => void;
  onRestart: () => void;
  onQuit: () => void;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const set = (p: Partial<Prefs>) => {
    sfx.key();
    setPrefs({ ...prefs, ...p });
  };
  const restart = () => {
    if (armed) {
      window.clearTimeout(timer.current);
      setArmed(false);
      onRestart();
      return;
    }
    sfx.sticker();
    setArmed(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setArmed(false), 3000);
  };

  return (
    <SheetFrame title="Paused" onClose={onClose}>
      <div className="ms">
        <div className="ms-keys">
          <button type="button" className="btn primary block" onClick={onClose}>
            <span className="row1">
              <Play className="glyph" /> Resume
            </span>
          </button>
          <button type="button" className="btn block" onClick={onRules}>
            <span className="row1">
              <Question className="glyph" /> How to play
            </span>
          </button>
        </div>

        <div className="ms-card">
          <Seg
            label="Speed"
            value={prefs.speed}
            options={[
              ['slow', 'Slow'],
              ['normal', 'Normal'],
              ['fast', 'Fast'],
            ]}
            onPick={(v) => set({ speed: v as Prefs['speed'] })}
          />
          <Seg
            label="Text"
            value={prefs.text}
            options={[
              ['normal', 'Normal'],
              ['large', 'Large'],
            ]}
            onPick={(v) => set({ text: v as Prefs['text'] })}
          />
          <Toggle icon={<Volume className="ico" />} label="Sound" on={prefs.sound} onFlip={() => set({ sound: !prefs.sound })} />
          <Toggle icon={<Hand className="ico" />} label="Haptics" on={prefs.haptics} onFlip={() => set({ haptics: !prefs.haptics })} />
          <Toggle icon={<Eye className="ico" />} label="Keep screen awake" on={prefs.awake} onFlip={() => set({ awake: !prefs.awake })} />
          <Toggle
            icon={<Swap className="ico" />}
            label="Left-handed"
            sub="Landscape: the tray moves to the left."
            on={prefs.hand === 'left'}
            onFlip={() => set({ hand: prefs.hand === 'left' ? 'right' : 'left' })}
          />
        </div>

        <div className="ms-keys out">
          <button type="button" className={`btn block${armed ? ' primary armed' : ''}`} onClick={restart} aria-live="polite">
            <span className="row1">
              <Rewind className="glyph" /> {armed ? 'Tap again to restart' : 'Restart this film'}
            </span>
            <span className="sub">{armed ? 'This night is lost for good.' : 'Same killer, place and Final Girl. New shuffle.'}</span>
          </button>
          <button type="button" className="btn block dark" onClick={onQuit}>
            <span className="row1">
              <Eject className="glyph" /> Back to the title
            </span>
            <span className="sub">This game is saved. Continue it later.</span>
          </button>
          {inLibrary ? (
            <button type="button" className="btn block dark" onClick={() => backToLibrary()}>
              <span className="row1">
                <Eject className="glyph" /> Back to the library
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </SheetFrame>
  );
}

function Seg({ label, value, options, onPick }: { label: string; value: string; options: [string, string][]; onPick: (v: string) => void }) {
  return (
    <div className="ms-row">
      <span className="ms-label">{label}</span>
      <div className="seg" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => value !== v && onPick(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ icon, label, sub, on, onFlip }: { icon: ReactNode; label: string; sub?: string; on: boolean; onFlip: () => void }) {
  return (
    <button type="button" className="ms-row toggle" role="switch" aria-checked={on} onClick={onFlip}>
      <span className="ms-ico">{icon}</span>
      <span className="ms-label">
        {label}
        {sub ? <small>{sub}</small> : null}
      </span>
      <span className={`switch${on ? ' on' : ''}`} aria-hidden="true">
        <span className="knob" />
        <span className="sw-t">{on ? 'On' : 'Off'}</span>
      </span>
    </button>
  );
}
