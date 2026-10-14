import { describe, expect, it } from 'vitest';
import { newGame } from '../src/game';
import { FILMS, FINAL_GIRLS, homeLocation, KILLERS, LOCATIONS } from '../src/game/content';
import { playOut } from './bot';

describe('whole games with a random player', () => {
  for (const film of FILMS) {
    for (const fg of film.finalGirls) {
      it(`${film.killer.name} / ${homeLocation(film).name} / ${fg.name}`, () => {
        for (let seed = 1; seed <= 25; seed++) {
          const g0 = newGame({ killer: film.killer.id, location: homeLocation(film).id, finalGirl: fg.id, board: seed % 5 ? 'normal' : 'extreme', seed, bonusItems: seed % 2 === 0, epicDarkPower: seed % 7 === 0 });
          const { g } = playOut(g0, seed * 31);
          expect(g.outcome, `seed ${seed} turn ${g.turn}`).toBeTruthy();
        }
      });
    }
  }
});

describe('any killer in any location', () => {
  for (const k of KILLERS) {
    for (const loc of LOCATIONS) {
      it(`${k.name} at ${loc.name}`, () => {
        for (let seed = 1; seed <= 12; seed++) {
          const fg = FINAL_GIRLS[seed % FINAL_GIRLS.length];
          const g0 = newGame({ killer: k.id, location: loc.id, finalGirl: fg.id, board: 'normal', seed: seed * 101, bonusItems: true, epicDarkPower: seed % 3 === 0 });
          const { g } = playOut(g0, seed * 17);
          expect(g.outcome, `seed ${seed} turn ${g.turn}`).toBeTruthy();
        }
      });
    }
  }
});
