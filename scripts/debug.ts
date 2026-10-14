// npx tsx scripts/debug.ts killer location fg seed botSeed — replays one bot game and dumps the stack on a loop.
import { newGame } from '../src/game';
import { playOut } from '../test/bot';

const [killer, location, finalGirl, seed, bot] = process.argv.slice(2);
const g0 = newGame({ killer, location, finalGirl, board: 'normal', seed: Number(seed), bonusItems: true });
try {
  const { g } = playOut(g0, Number(bot));
  console.log(g.outcome, g.turn);
} catch (e) {
  console.log(String(e));
  const g = (e as { g?: unknown }).g as any;
  if (g) {
    console.log(JSON.stringify(g.stack.slice(-5), null, 1));
    console.log(g.log.slice(-25).map((l: any) => l.text).join('\n'));
  }
}
