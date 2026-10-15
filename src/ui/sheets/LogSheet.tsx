// The log, typed up as a screenplay: one scene per turn, newest at the bottom.

import type { GameState, LogEntry } from '../../game';
import { locationDef } from '../../game/content';
import { SheetFrame } from './Sheet';

const TURN_MARK = /^— Turn \d+ —$/;
/** The phase headings ("Killer Phase"), as opposed to other phase-toned lines (setup, film notes). */
const PHASE_HEAD = /^(Setup|[A-Z][a-z]+ Phase)$/;

export function LogSheet({ g, onClose }: { g: GameState; onClose: () => void }) {
  let place = g.config.location;
  try {
    place = locationDef(g.config.location).name;
  } catch {
    // keep the id
  }
  const scenes: { turn: number; lines: LogEntry[] }[] = [];
  for (const e of g.log) {
    if (e.tone === 'phase' && TURN_MARK.test(e.text)) continue;
    const last = scenes[scenes.length - 1];
    if (last && last.turn === e.turn) last.lines.push(e);
    else scenes.push({ turn: e.turn, lines: [e] });
  }
  return (
    <SheetFrame title="Screenplay" tone="paper" onClose={onClose} startAtEnd>
      <div className="script selectable">
        <p className="fade">FADE IN:</p>
        {scenes.map((s, i) => (
          <section className="scene" key={`${s.turn}-${i}`}>
            <h5 className="slug">
              INT. {place.toUpperCase()} – TURN {s.turn}
            </h5>
            {s.lines.map((e) => (
              <p key={e.n} className={`ln ${e.tone}${e.tone === 'phase' && PHASE_HEAD.test(e.text) ? ' head' : ''}`}>
                {e.text}
              </p>
            ))}
          </section>
        ))}
        {g.outcome ? <p className="fade out">{g.outcome.winner === 'finalGirl' ? 'FADE OUT.' : 'CUT TO BLACK.'}</p> : null}
      </div>
    </SheetFrame>
  );
}
