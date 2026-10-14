// npm run sim -- [games per combo] [killer] — random-bot results for every killer/location/final girl.
import { newGame } from '../src/game';
import { FILMS, FINAL_GIRLS, KILLERS, LOCATIONS } from '../src/game/content';
import { playOut } from '../test/bot';

const n = Number(process.argv[2] ?? 20);
const only = process.argv[3];
void FILMS;
for (const k of KILLERS) {
  if (only && k.id !== only) continue;
  for (const loc of LOCATIONS) {
    let wins = 0;
    let turns = 0;
    for (let i = 0; i < n; i++) {
      const fg = FINAL_GIRLS[i % FINAL_GIRLS.length];
      const g0 = newGame({ killer: k.id, location: loc.id, finalGirl: fg.id, board: 'normal', seed: 1000 + i });
      const { g } = playOut(g0, i * 7 + 3);
      if (g.outcome?.winner === 'finalGirl') wins++;
      turns += g.turn;
    }
    console.log(`${k.name.padEnd(14)} ${loc.name.padEnd(20)} wins ${((100 * wins) / n).toFixed(0).padStart(3)}%  avg turns ${(turns / n).toFixed(1)}`);
  }
}
