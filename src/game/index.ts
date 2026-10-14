// Public face of the engine. Importing this registers every film's rules.
import './engine/effects';
import './engine/combat';
import './engine/dice';
import './engine/actionPhase';
import './engine/phases';
import './films/common';
import './films/creech';
import './films/carnival';
import './films/maple';
import './films/birds';
import './films/groves';
import { respond } from './engine/kernel';
import type { GameState, Input } from './engine/state';

export { newGame } from './engine/setup';
export { RuleError } from './engine/kernel';
export type * from './engine/state';

/** Apply one player input to a copy of the state. */
export function act(g: GameState, inp: Input): GameState {
  const next = structuredClone(g);
  // Only the entries this input produces keep their snapshots (for playback).
  for (const e of next.log) delete e.snap;
  respond(next, inp);
  return next;
}
