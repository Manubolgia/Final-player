// npm exec tsx scripts/show.ts -- killer location fg seed — print one bot game's log.
import { newGame } from '../src/game';
import { playOut } from '../test/bot';
const [k, l, f, s] = process.argv.slice(2);
const g0 = newGame({ killer: k, location: l, finalGirl: f, board: 'normal', seed: Number(s ?? 1) });
const { g } = playOut(g0, Number(s ?? 1) * 7);
for (const e of g.log) console.log(`[${e.turn} ${e.phase}] ${e.text}`);
