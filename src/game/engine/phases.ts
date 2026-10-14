// The five phases of a turn, and the Terror and Event cards they draw.

import { card, HAND_LIMIT } from '../content/core';
import { closestVictims, minionsIn, panicVictims } from './board';
import { drawTerror } from './effects';
import { buyable, canAct, cost, mainInput, mainPrompt, planningInput } from './actionPhase';
import {
  answers,
  choose,
  eventDef,
  frames,
  gotoPhase,
  has,
  hooks,
  K,
  L,
  log,
  plural,
  push,
  pushFx,
  terrorDef,
  zoneName,
} from './kernel';
import { beforeTerror } from './registry';
import type { Frame, GameState } from './state';
import { board, NEXT_PHASE, revealFinale } from './stats';

type PhF = Extract<Frame, { t: 'phase' }>;

const PHASE_TITLE = {
  setup: 'Setup',
  action: 'Action Phase',
  planning: 'Planning Phase',
  killer: 'Killer Phase',
  panic: 'Panic Phase',
  upkeep: 'Upkeep Phase',
} as const;

frames.phase = {
  step(g, f: PhF) {
    if (f.step === 0) {
      g.phase = f.phase;
      if (f.phase === 'action') log(g, `— Turn ${g.turn} —`, 'phase');
      log(g, PHASE_TITLE[f.phase], 'phase');
    }
    switch (f.phase) {
      case 'action':
        return actionPhase(g, f);
      case 'planning':
        return planningPhase(g, f);
      case 'killer':
        return killerPhase(g, f);
      case 'panic':
        return panicPhase(g, f);
      case 'upkeep':
        return upkeepPhase(g, f);
      default:
        gotoPhase(g, 'action');
        return 'continue';
    }
  },
  input(g, f: PhF, inp) {
    if (f.phase === 'action') {
      mainInput(g, inp);
      return 'continue';
    }
    if (f.phase === 'planning') {
      planningInput(g, f, inp);
      return 'continue';
    }
    throw new Error('Nothing to do');
  },
};

function next(g: GameState, f: PhF): 'continue' {
  g.stack = g.stack.filter((x) => x !== f);
  push(g, { t: 'phase', phase: NEXT_PHASE[f.phase], step: 0 });
  return 'continue';
}

function resetActionMods(g: GameState): void {
  g.mods.partialsPhase = false;
  g.mods.usedThisPhase = [];
  g.mods.rescuedThisPhase = 0;
  g.mods.actionEnding = false;
}

// ---- action ---------------------------------------------------------------------

function actionPhase(g: GameState, f: PhF) {
  if (f.step === 0) {
    f.step = 1;
    resetActionMods(g);
    if (g.mods.skipNextAction) {
      g.mods.skipNextAction = false;
      log(g, 'Time dropped below zero outside your turn: you lose this Action Phase.', 'bad');
      return next(g, f);
    }
    if (g.mods.timeAtNextAction !== null) {
      g.fg.time = g.mods.timeAtNextAction;
      g.mods.timeAtNextAction = null;
      log(g, `You start this Action Phase with ${g.fg.time} Time.`, 'good');
    }
    for (const fn of hooks.actionPhaseStart) fn(g);
    if (g.stack[g.stack.length - 1] !== f) return 'continue';
  }
  if (g.mods.actionEnding || g.fg.time < 0 || !canAct(g)) {
    for (const fn of hooks.actionPhaseEnd) fn(g);
    resetActionMods(g);
    g.mods.minusDicePhase = 0;
    return next(g, f);
  }
  g.prompt = mainPrompt(g);
  return 'wait';
}

// ---- planning --------------------------------------------------------------------

function planningPhase(g: GameState, f: PhF) {
  if (f.step === 0) {
    f.step = 1;
    for (const [c, n] of Object.entries(g.tableau)) {
      if (cost(g, c) !== 0) continue;
      for (let i = 0; i < n && g.fg.hand.length < HAND_LIMIT; i++) {
        g.tableau[c]--;
        g.fg.hand.push(c);
        log(g, `${card(c).name} comes back to your hand (free).`);
      }
    }
  }
  if (f.step === 1) {
    const b = buyable(g);
    if (b.length) {
      g.prompt = { type: 'planning', buyable: b };
      return 'wait';
    }
    log(g, g.fg.hand.length >= HAND_LIMIT ? 'Your hand is full (10 cards).' : 'No Time left to buy anything.');
    f.step = 2;
  }
  g.fg.time = board(g).startTime;
  for (const c of g.actionDiscard) g.tableau[c] = (g.tableau[c] ?? 0) + 1;
  g.actionDiscard = [];
  log(g, `Time resets to ${g.fg.time}; the cards you used go back to the tableau.`);
  return next(g, f);
}


// ---- killer ------------------------------------------------------------------------

function killerPhase(g: GameState, f: PhF) {
  const k = K(g);
  if (f.step === 0) {
    f.step = 1;
    g.mods.killedThisKillerPhase = 0;
    for (const fn of hooks.killerPhaseStart) fn(g);
    const fin = k.finales.find((x) => x.id === g.killer.finale)!;
    const act = g.killer.finaleRevealed ? fin.action : k.action;
    const minions = (g.killer.finaleRevealed ? fin.minionAction : k.minionAction) ?? [];
    log(g, g.killer.finaleRevealed ? `Killer action (${fin.name}).` : 'Killer action.', 'killer');
    pushFx(g, [...minions, ...act], { kind: g.killer.finaleRevealed ? 'finale' : 'killer' });
    return 'continue';
  }
  if (f.step === 1) {
    f.step = 2;
    const tok = L(g).finaleToken;
    if (g.killer.finaleRevealed && tok) {
      log(g, `${L(g).name} finale: ${tok.text}`, 'killer');
      pushFx(g, tok.effects, { kind: 'finale' });
    }
    if (!g.killer.finaleRevealed) drawTerror(g);
    return 'continue';
  }
  if (f.step === 2) {
    f.step = 3;
    for (const fn of hooks.killerPhaseEnd) fn(g);
    return 'continue';
  }
  return next(g, f);
}

frames.terror = {
  step(g, f: Extract<Frame, { t: 'terror' }>) {
    const c = terrorDef(g, f.card);
    if (!f.asked) log(g, `Terror card: ${c.name}`, 'killer', { kind: 'card', deck: 'terror', id: c.id });
    const carolyn = g.fg.items.some((i) => i.id === 'carolyn');
    const skip = (c.skipIf === 'carolyn' && carolyn) || (c.skipIf === 'noCarolyn' && !carolyn);
    if (skip || (c.requiresVictims && !g.victims.some((v) => v.role !== 'werewolf'))) {
      log(g, skip ? (carolyn ? 'Carolyn is with you: discard it and draw the next.' : 'Carolyn isn\'t with you: discard it and draw the next.') : 'No victims on the board: discard it and draw the next.');
      g.terrorDiscard.push(c.id);
      drawTerror(g);
      return 'done';
    }
    if (!f.asked) {
      f.asked = true;
      // A question (Crucifix, Found Tape) re-queues this card itself if you say no.
      if (beforeTerror.some((fn) => fn(g, c.id))) return 'done';
    }
    if (c.minor) {
      g.killer.minors.push({ id: c.id, hp: c.minor.hp });
      log(g, `${c.name} stays in play as a Minor Dark Power${c.minor.hp ? ` with ${plural(c.minor.hp, 'health')}` : ''}.`, 'killer');
      pushFx(g, c.effects, { kind: 'terror', id: c.id });
      return 'done';
    }
    if (c.stays) {
      g.activeTerror.push(c.id);
      log(g, `It stays in play: ${c.text}`, 'killer');
      pushFx(g, c.effects, { kind: 'terror', id: c.id });
      return 'done';
    }
    g.terrorDiscard.push(c.id);
    pushFx(g, c.effects, { kind: 'terror', id: c.id });
    return 'done';
  },
};

/** Set up a special victim when its Event is revealed. */
export const eventSetups: Record<string, (g: GameState) => void> = {};

frames.event = {
  step(g, f: Extract<Frame, { t: 'event' }>) {
    const e = eventDef(g, f.card);
    log(g, `Event: ${e.name}. ${e.text}`, 'phase', { kind: 'card', deck: 'event', id: e.id });
    if (e.special && !g.victims.length && !e.ability?.startsWith('ev.ml')) {
      log(g, 'There are no victims: the Event is ignored.');
      g.eventDiscard.push(e.id);
      return 'done';
    }
    if (e.persistent) g.activeEvents.push(e.id);
    else g.eventDiscard.push(e.id);
    // onReveal first so its pushed frames run after the setup below
    if (e.ability && eventSetups[e.ability]) eventSetups[e.ability](g);
    pushFx(g, e.onReveal ?? [], { kind: 'event', id: e.id });
    return 'done';
  },
};

/** Make the closest (to you) or farthest (from the Killer) victim special. */
export function assignRole(g: GameState, role: string, from: 'fg' | 'killer'): void {
  const vs = from === 'fg' ? closestVictims(g, g.fg.zone, { mover: 'fg' }) : closestVictims(g, g.killer.zone, { farthest: true });
  const zones = [...new Set(vs.map((v) => v.zone))];
  if (!zones.length) return;
  if (zones.length === 1) return setRole(g, role, zones[0]);
  choose(
    g,
    'Tie: which victim is it?',
    zones.map((z) => ({ id: z, label: zoneName(g, z), zone: z })),
    { id: 'assignRole', data: { role } },
  );
}

export function setRole(g: GameState, role: string, zone: string): void {
  const v = g.victims.find((x) => x.zone === zone && !x.role);
  if (!v) return;
  v.role = role as any;
  log(g, `A victim in ${zoneName(g, zone)} becomes special.`);
}
answers.assignRole = (g, zone, data: { role: string }) => setRole(g, data.role, zone);

// ---- panic -------------------------------------------------------------------------

function panicPhase(g: GameState, f: PhF) {
  if (f.step === 0) {
    f.step = 1;
    if (g.mods.killedThisTurn > 0) {
      if (has(g, 'ev.frozenFear')) log(g, 'Frozen with Fear: nobody panics.', 'killer');
      else {
        const list = g.victims.filter((v) => v.role !== 'werewolf' && ((!g.film.birds && !g.film.maple?.offBoard && v.zone === g.killer.zone) || minionsIn(g, v.zone).length > 0));
        if (list.length) {
          log(g, 'Someone died this turn: the victims with an enemy panic.');
          panicVictims(g, list);
        }
      }
    }
    return 'continue';
  }
  return next(g, f);
}

// ---- upkeep ------------------------------------------------------------------------

function upkeepPhase(g: GameState, f: PhF) {
  const n = hooks.upkeep.length;
  if (f.step === 0) {
    f.step = 1;
    if (!g.terrorDeck.length && !g.killer.finaleRevealed) revealFinale(g);
    return 'continue';
  }
  if (f.step <= n) {
    const fn = hooks.upkeep[f.step - 1];
    f.step++;
    fn(g);
    return 'continue';
  }
  if (f.step === n + 1) {
    f.step++;
    push(g, { t: 'arrange', optional: true });
    return 'continue';
  }
  const m = lateUpkeep.length;
  if (f.step <= n + 1 + m) {
    const fn = lateUpkeep[f.step - n - 2];
    f.step++;
    fn(g);
    return 'continue';
  }
  g.turn++;
  g.mods.killedThisTurn = 0;
  g.mods.usedThisTurn = [];
  for (const fn of turnEnd) fn(g);
  return next(g, f);
}

/** Upkeep steps after you rearrange items. */
export const lateUpkeep: ((g: GameState) => void)[] = [];
export const turnEnd: ((g: GameState) => void)[] = [];

