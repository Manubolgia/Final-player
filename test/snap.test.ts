import { describe, expect, it } from 'vitest';
import { act, newGame } from '../src/game';
import { rng, botInput } from './bot';

describe('log snapshots for playback', () => {
  it('only the newest input carries snapshots, and they match the board', () => {
    let g = newGame({ killer: 'hans', location: 'campHappyTrails', finalGirl: 'laurie', board: 'normal', seed: 3 });
    const r = rng(9);
    let checked = 0;
    for (let i = 0; i < 400 && !g.outcome; i++) {
      const before = g.log[g.log.length - 1]?.n ?? 0;
      g = act(g, botInput(g, r));
      for (const e of g.log) {
        if (e.n <= before) expect(e.snap).toBeUndefined();
        else expect(e.snap).toBeDefined();
      }
      const last = g.log[g.log.length - 1];
      if (last && last.n > before && last.snap) {
        expect(last.snap.fz).toBe(g.fg.zone);
        expect(last.snap.vic.length).toBe(g.victims.length);
        checked++;
      }
      const move = g.log.find((e) => e.n > before && e.anim?.kind === 'killerMove' && !e.anim.minion);
      if (move && move.anim?.kind === 'killerMove') expect(move.snap!.kz).toBe(move.anim.path[move.anim.path.length - 1]);
      const death = g.log.find((e) => e.n > before && e.anim?.kind === 'victimDie');
      if (death) {
        const prev = g.log[g.log.indexOf(death) - 1];
        if (prev?.snap) expect(death.snap!.vic.length).toBe(prev.snap.vic.length - 1);
      }
    }
    expect(checked).toBeGreaterThan(10);
  });
});
