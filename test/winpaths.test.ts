import { describe, expect, it } from 'vitest';
import { newGame, type GameState } from '../src/game';
import { FILMS, homeLocation } from '../src/game/content';
import { mainPrompt } from '../src/game/engine/actionPhase';
import { exits } from '../src/game/engine/board';
import { L } from '../src/game/engine/kernel';
import { smartInput, smartPlayOut } from './smartBot';
import { act } from '../src/game';
import { rng } from './bot';

/** Play until the first Action Phase menu, so the board can be rigged. */
function toFirstTurn(g: GameState, seed: number): GameState {
  const r = rng(seed);
  while (g.prompt?.type !== 'main') g = act(g, smartInput(g, r));
  return g;
}

describe('the Final Girl can win', () => {
  for (const film of FILMS.filter((f) => !f.killer.invulnerable)) {
    it(`by killing ${film.killer.name}`, () => {
      let wins = 0;
      for (let seed = 1; seed <= 12; seed++) {
        let g = newGame({ killer: film.killer.id, location: homeLocation(film).id, finalGirl: film.finalGirls[seed % 2].id, board: 'normal', seed: seed * 977 });
        g = toFirstTurn(g, seed);
        g.killer.health = { ...g.killer.health, hp: 1, token: 'white', hidden: 0 };
        g.killer.zone = g.fg.zone;
        g.fg.hand = ['weakAttack', 'weakAttack', 'furiousStrike', 'criticalBlow', 'focus'];
        if (g.film.maple) g.film.maple.asleep = true;
        g.prompt = mainPrompt(g);
        const { g: end } = smartPlayOut(g, seed);
        if (end.outcome?.winner === 'finalGirl') wins++;
      }
      expect(wins).toBeGreaterThanOrEqual(6);
    });
  }

  it('by escaping Creech Manor with Carolyn', () => {
    const film = FILMS.find((f) => f.killer.invulnerable)!;
    let wins = 0;
    for (let seed = 1; seed <= 12; seed++) {
      let g = newGame({ killer: film.killer.id, location: homeLocation(film).id, finalGirl: film.finalGirls[seed % 2].id, board: 'normal', seed: seed * 977 });
      g = toFirstTurn(g, seed);
      const exit = L(g).zones.find((z) => z.exit)!;
      g.fg.zone = L(g).zones.find((z) => !z.exit && !z.hidden && exits(g, z.id, 'fg').includes(exit.id))!.id;
      g.fg.items.push({ uid: 'carolyn-test', id: 'carolyn', inHands: false });
      g.fg.hand = ['walk', 'walk', 'sprint', 'focus'];
      g.prompt = mainPrompt(g);
      const { g: end } = smartPlayOut(g, seed);
      if (end.outcome?.winner === 'finalGirl') wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(6);
  });

  it('by saving every survivor from the Birds', () => {
    let g = newGame({ killer: 'birds', location: 'campHappyTrails', finalGirl: 'paula', board: 'normal', seed: 12 });
    g = toFirstTurn(g, 12);
    const exit = L(g).zones.find((z) => z.exit)!.id;
    g.fg.zone = exit;
    g.minions = g.minions.filter((m) => m.zone !== exit);
    g.film.birds!.hidden = 0;
    g.victims.push({ id: 'sv1', zone: exit, role: 'survivor' }, { id: 'sv2', zone: exit, role: 'survivor' });
    g.prompt = mainPrompt(g);
    g = act(g, { t: 'rescue' });
    for (let i = 0; i < 20 && !g.outcome; i++) {
      const p = g.prompt!;
      if (p.type === 'rescue') g = act(g, { t: 'rescueOne', victim: p.victims.find((v) => v.startsWith('sv')) ?? p.victims[0], slot: p.slots[0] });
      else if (p.type === 'choice') g = act(g, { t: 'choose', id: p.options[0].id });
      else if (p.type === 'search') g = act(g, { t: 'searchPick', keep: 0, otherTo: 'top' });
      else break;
    }
    expect(g.outcome?.winner).toBe('finalGirl');
  });

  it("can't hurt Dr. Fright while awake", () => {
    let g = newGame({ killer: 'drFright', location: 'mapleLane', finalGirl: 'sheila', board: 'normal', seed: 4 });
    g = toFirstTurn(g, 4);
    g.killer.zone = g.fg.zone;
    g.fg.hand = ['weakAttack', 'criticalBlow'];
    g.prompt = mainPrompt(g);
    expect((g.prompt as { playable: unknown[] }).playable).toHaveLength(0);
    g.film.maple!.asleep = true;
    expect(mainPrompt(g).playable.map((p) => p.card)).toContain('criticalBlow');
  });
});
