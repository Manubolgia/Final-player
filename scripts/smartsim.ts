// npm run sim:smart -- [games per combo] — greedy-bot results for every film.
import { newGame } from '../src/game';
import { FILMS, homeLocation } from '../src/game/content';
import { smartPlayOut } from '../test/smartBot';

const n = Number(process.argv[2] ?? 20);
for (const f of FILMS) {
  for (const fg of f.finalGirls) {
    let wins = 0;
    let turns = 0;
    const how = new Map<string, number>();
    for (let i = 0; i < n; i++) {
      const g0 = newGame({ killer: f.killer.id, location: homeLocation(f).id, finalGirl: fg.id, board: 'normal', seed: 5000 + i });
      const { g } = smartPlayOut(g0, i * 11 + 1);
      if (g.outcome?.winner === 'finalGirl') wins++;
      turns += g.turn;
      const k = (g.outcome?.text ?? 'unfinished').replace(/\d+/g, '#');
      how.set(k, (how.get(k) ?? 0) + 1);
    }
    console.log(`${f.killer.name.padEnd(15)} ${fg.name.padEnd(9)} wins ${((100 * wins) / n).toFixed(0).padStart(3)}%  turns ${(turns / n).toFixed(1)}  ${[...how].map(([k, v]) => `${v}× ${k}`).join(' | ')}`);
  }
}
