// Horror rolls: count the dice, roll, let the player fix 3s and 4s and reroll,
// then hand the successes back to whoever asked.

import { card } from '../content/core';
import { victimsIn } from './board';
import { discardItem } from './effects';
import { d6, frames, has, log, plural, push, RuleError, usableItems } from './kernel';
import { afterRoll, diceMods } from './registry';
import type { Continuation, Frame, GameState, RollPurpose } from './state';
import { addTime, adrenaline, horrorDice } from './stats';

type RF = Extract<Frame, { t: 'roll' }>;

/** Handlers for rolls made by effects: rollDone[id](g, successes, data). */
export const rollDone: Record<string, (g: GameState, successes: number, data: any, dice: number[]) => void> = {};

export function diceCount(g: GameState, p: RollPurpose, consume: boolean): { n: number; notes: string[] } {
  let n = horrorDice(g);
  const notes: string[] = [];
  if (g.mods.bonusDice) {
    n += g.mods.bonusDice;
    notes.push(`+${g.mods.bonusDice} from Planning`);
    if (consume) g.mods.bonusDice = 0;
  }
  const adr = adrenaline(g);
  if (adr) {
    n += adr;
    notes.push(`+${adr} adrenaline`);
  }
  if (has(g, 'ev.girlfriend') && g.victims.some((v) => v.role === 'girlfriend' && v.zone === g.fg.zone)) {
    n++;
    notes.push('+1 Girlfriend');
  }
  if (p.kind === 'action' && p.card === 'weakAttack' && has(g, 'item.reikosAxe')) {
    n++;
    notes.push("+1 Reiko's Axe");
  }
  for (const m of diceMods) n = m(g, p, n, notes);
  if (g.phase === 'action' && g.mods.minusDicePhase) {
    n -= g.mods.minusDicePhase;
    notes.push(`−${g.mods.minusDicePhase} Better Stay Awake`);
  }
  n = Math.max(1, n);
  const five = g.film.creech?.fiveDice;
  if (five && (p.kind === 'action' || p.kind === 'reaction') && p.card === five) {
    n = 5;
    notes.length = 0;
    notes.push("Alice's Ultimate: exactly 5 dice");
  }
  return { n, notes };
}

export function startRoll(g: GameState, purpose: RollPurpose, ret?: Continuation): void {
  const { n, notes } = diceCount(g, purpose, true);
  const auto34 = g.mods.partialsNext || (g.phase === 'action' && g.mods.partialsPhase);
  g.mods.partialsNext = false;
  const dice = Array.from({ length: n }, () => d6(g));
  log(g, `Horror roll (${plural(n, 'die', 'dice')}${notes.length ? `, ${notes.join(', ')}` : ''}): ${dice.join(' ')}.`, 'info', { kind: 'dice', faces: dice });
  push(g, { t: 'roll', purpose, dice, converted: [], auto34, ...(ret ? { ret } : {}) });
}

const partial = (x: number) => x === 3 || x === 4;

export function successes(f: { dice: number[]; converted: number[]; auto34: boolean }): number {
  return f.dice.reduce((s, x, i) => s + (x >= 5 || f.converted.includes(i) || (f.auto34 && partial(x)) ? 1 : 0), 0);
}

function options(g: GameState, f: RF) {
  return {
    convertible: !f.auto34 && g.fg.hand.length >= 2 && f.dice.some((x, i) => partial(x) && !f.converted.includes(i)),
    canCloseCall: g.fg.hand.includes('closeCall'),
    canLucky: usableItems(g, 'item.luckyDice').length + usableItems(g, 'item.superLuckyDice').length > 0,
    canSister: has(g, 'ev.sister') && g.fg.time >= 2 && victimsIn(g, g.fg.zone).some((v) => v.role === 'sister'),
  };
}

frames.roll = {
  step(g, f: RF) {
    const o = options(g, f);
    if (!o.convertible && !o.canCloseCall && !o.canLucky && !o.canSister) return finishRoll(g, f);
    g.prompt = { type: 'roll', purpose: f.purpose, dice: f.dice, converted: f.converted, auto34: f.auto34, ...o, successes: successes(f) };
    return 'wait';
  },
  input(g, f: RF, inp) {
    switch (inp.t) {
      case 'convert': {
        const x = f.dice[inp.die];
        if (x === undefined || !partial(x) || f.converted.includes(inp.die)) throw new RuleError('That die isn\'t a 3 or 4');
        if (inp.discard.length !== 2) throw new RuleError('Discard exactly 2 cards');
        const hand = [...g.fg.hand];
        for (const c of inp.discard) {
          const i = hand.indexOf(c);
          if (i < 0) throw new RuleError('You don\'t have those cards');
          hand.splice(i, 1);
        }
        g.fg.hand = hand;
        g.actionDiscard.push(...inp.discard);
        f.converted.push(inp.die);
        log(g, `You discard ${inp.discard.map((c) => card(c).name).join(' and ')} to turn a ${x} into a success.`);
        return 'continue';
      }
      case 'closeCall': {
        const i = g.fg.hand.indexOf('closeCall');
        if (i < 0) throw new RuleError('You don\'t have Close Call');
        g.fg.hand.splice(i, 1);
        g.actionDiscard.push('closeCall');
        if (inp.die !== undefined) {
          if (f.dice[inp.die] === undefined) throw new RuleError('No such die');
          f.dice[inp.die] = d6(g);
          f.converted = f.converted.filter((x) => x !== inp.die);
          log(g, `Close Call: you reroll a die (${f.dice[inp.die]}).`, 'info', { kind: 'dice', faces: [...f.dice] });
        } else {
          f.dice = f.dice.map(() => d6(g));
          f.converted = [];
          log(g, `Close Call: you reroll every die for 2 Time (${f.dice.join(' ')}).`, 'info', { kind: 'dice', faces: [...f.dice] });
          addTime(g, -2);
        }
        return 'continue';
      }
      case 'lucky': {
        const plain = usableItems(g, 'item.luckyDice')[0];
        const sup = usableItems(g, 'item.superLuckyDice')[0];
        const it = plain ?? sup;
        if (!it) throw new RuleError('You have no lucky dice');
        if (!inp.dice.length || inp.dice.some((i) => f.dice[i] === undefined)) throw new RuleError('Pick dice to reroll');
        for (const i of inp.dice) f.dice[i] = d6(g);
        f.converted = f.converted.filter((i) => !inp.dice.includes(i));
        log(g, `Lucky dice: you reroll ${plural(inp.dice.length, 'die', 'dice')} (${f.dice.join(' ')}).`, 'info', { kind: 'dice', faces: [...f.dice] });
        if (plain) discardItem(g, it.uid);
        else {
          const r = d6(g);
          log(g, `Super Lucky Dice: ${r}. ${r >= 5 ? 'You keep them.' : 'They\'re discarded.'}`, r >= 5 ? 'good' : 'bad', { kind: 'dice', faces: [r] });
          if (r <= 4) discardItem(g, it.uid);
        }
        return 'continue';
      }
      case 'sister': {
        if (!options(g, f).canSister) throw new RuleError('Your sister isn\'t with you');
        if (f.dice[inp.die] === undefined) throw new RuleError('No such die');
        addTime(g, -2);
        f.dice[inp.die] = d6(g);
        f.converted = f.converted.filter((x) => x !== inp.die);
        log(g, `Your sister helps (−2 Time): you reroll a die (${f.dice[inp.die]}).`, 'info', { kind: 'dice', faces: [...f.dice] });
        return 'continue';
      }
      case 'confirm':
        return finishRoll(g, f);
      default:
        throw new RuleError('Finish the roll first');
    }
  },
};

function finishRoll(g: GameState, f: RF): 'done' {
  const s = successes(f);
  for (const fn of afterRoll) fn(g, f.dice, s, f.purpose);
  const i = g.stack.lastIndexOf(f);
  const below = g.stack[i - 1];
  if (f.ret) {
    g.stack.splice(i, 1);
    const fn = rollDone[f.ret.id];
    if (!fn) throw new Error(`No roll handler ${f.ret.id}`);
    fn(g, s, f.ret.data, f.dice);
    g.stack.push(f); // finish() removes it again
  } else if (below && (below.t === 'play' || below.t === 'reaction')) below.successes = s;
  return 'done';
}
