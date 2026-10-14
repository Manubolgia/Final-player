// Health, Horror, Time, Bloodlust, Dark Powers, the Finale and Wrath.

import { BOARDS } from '../content/core';
import type { Effect, WrathBy, WrathKind } from '../types';
import { choose, endGame, FG, gotoPhase, has, hooks, K, L, log, pick, plural, pushFx, usableItems } from './kernel';
import type { GameState, Src } from './state';

export const board = (g: GameState) => BOARDS[g.config.board];

export const NEXT_PHASE = {
  setup: 'action',
  action: 'planning',
  planning: 'killer',
  killer: 'panic',
  panic: 'upkeep',
  upkeep: 'action',
} as const;

// ---- time ------------------------------------------------------------------

export function addTime(g: GameState, n: number): void {
  if (n > 0) {
    if (g.fg.time < 0) {
      log(g, 'Time is below zero: it can\'t be gained back now.');
      return;
    }
    g.fg.time = Math.min(board(g).maxTime, g.fg.time + n);
    log(g, `+${n} Time (${g.fg.time}).`, 'good');
  } else if (n < 0) {
    g.fg.time = Math.max(-1, g.fg.time + n);
    log(g, `${n} Time (${g.fg.time < 0 ? 'below zero' : g.fg.time}).`, 'bad');
    if (g.fg.time < 0) {
      if (g.phase === 'action') g.mods.actionEnding = true;
      else g.mods.skipNextAction = true;
    }
  }
}

// ---- horror ----------------------------------------------------------------

export const horrorDice = (g: GameState): number => board(g).horror[g.fg.horror].dice;
/** Horror level as a number: green space 0 … red space 7. */
export const horrorLevel = (g: GameState): number => g.fg.horror;

export function horrorLabel(g: GameState): string {
  const sp = board(g).horror[g.fg.horror];
  if (sp.label === null) return g.fg.horror === 0 ? 'the green space' : 'the red space';
  return `level ${sp.label}`;
}

export function addHorror(g: GameState, n: number): void {
  if (!n) return;
  if (n > 0) for (const fn of hooks.horrorUp) if (fn(g, n)) return;
  const top = board(g).horror.length - 1;
  for (let i = 0; i < Math.abs(n); i++) {
    if (n > 0) {
      if (g.fg.horror >= top) {
        log(g, 'Horror is already at the top: +1 Bloodlust instead.', 'bad');
        addBloodlust(g, 1);
      } else g.fg.horror++;
    } else if (g.fg.horror <= 0) {
      log(g, 'Horror is already at the bottom: +1 Time instead.', 'good');
      addTime(g, 1);
    } else g.fg.horror--;
  }
  log(g, `${n > 0 ? '+' : ''}${n} Horror (${horrorLabel(g)}).`, n > 0 ? 'bad' : 'good');
  if (n > 0) for (const fn of hooks.afterHorrorUp) fn(g);
}

// ---- health ----------------------------------------------------------------

export function healFG(g: GameState, n: number, src?: Src): void {
  if (n <= 0) return;
  if (g.fg.cobra) {
    g.fg.cobra = false;
    log(g, 'The hidden cobra is gone instead of you healing.', 'good');
    return;
  }
  let amount = n;
  if (src?.kind === 'action' && !src.healBonus && has(g, 'item.firstAid')) {
    amount++;
    src.healBonus = true;
  }
  const h = g.fg.health;
  const before = h.hp;
  h.hp = Math.min(h.max, h.hp + amount);
  log(g, `${FG(g).name} heals ${h.hp - before} (${h.hp}/${h.max}).`, 'good');
}

/** The Final Girl loses health. Reactions can't stop this; attacks go through attackFG first. */
export function hurtFG(g: GameState, n: number): void {
  if (n <= 0 || g.outcome) return;
  const h = g.fg.health;
  h.hp -= n;
  g.mods.damageTaken += n;
  log(g, `${FG(g).name} loses ${n} health.`, 'bad');
  if (has(g, 'item.tribalMask')) {
    log(g, `Tribal Mask: reduce a Wrath by ${n}.`, 'good');
    pushFx(g, [{ k: 'wrath', which: 'choose', op: 'reduce', n }], { kind: 'item', id: 'tribalMask' });
  }
  if (h.hp > 0) {
    for (const fn of hooks.fgHurt) fn(g, n);
    return;
  }
  finalToken(g, 'fg');
}

export function healKiller(g: GameState, n: number): void {
  if (n <= 0 || K(g).invulnerable) return;
  const h = g.killer.health;
  const before = h.hp;
  h.hp = Math.min(h.max, h.hp + n);
  if (h.hp > before) log(g, `${K(g).name} heals ${h.hp - before} (${h.hp}).`, 'killer');
}

/** Can the Final Girl hurt the Killer right now? */
export function killerVulnerable(g: GameState): boolean {
  if (K(g).invulnerable) return false;
  const m = g.film.maple;
  if (m && g.config.killer === 'drFright' && !m.asleep && !m.blurred) return false;
  return true;
}

/** Damage to the Killer: Minor Dark Powers soak it up first. */
export function damageKiller(g: GameState, n: number, force = false): void {
  if (n <= 0 || g.outcome) return;
  if (!force && !killerVulnerable(g)) {
    log(g, `${K(g).name} can't be hurt right now.`);
    return;
  }
  log(g, `${n} damage to ${K(g).name}!`, 'good');
  let left = n;
  while (left > 0 && g.killer.minors.length) {
    const m = g.killer.minors[0];
    const take = Math.min(left, m.hp);
    m.hp -= take;
    left -= take;
    if (m.hp <= 0) {
      g.killer.minors.shift();
      g.terrorDiscard.push(m.id);
      log(g, 'A Minor Dark Power is destroyed.', 'good');
    }
  }
  if (left <= 0) return;
  g.killer.health.hp -= left;
  if (g.killer.health.hp > 0) return;
  for (const fn of hooks.killerDying) if (fn(g)) return;
  finalToken(g, 'killer');
}

/** Someone just lost their last health: flip the Final Health token. */
export function finalToken(g: GameState, who: 'fg' | 'killer'): void {
  const h = who === 'fg' ? g.fg.health : g.killer.health;
  const name = who === 'fg' ? FG(g).name : K(g).name;
  if (h.token === 'black' && h.hidden > 0) {
    h.token = 'white';
    h.hp = h.hidden;
    log(g, `${name}'s Final Health token shows ${plural(h.hidden, 'heart')}: back on their feet with ${h.hp} health!`, who === 'fg' ? 'good' : 'killer');
    h.hidden = 0;
    if (!g.outcome) gotoPhase(g, NEXT_PHASE[g.phase], 'The phase ends at once.');
    return;
  }
  h.hp = 0;
  if (h.token === 'black') log(g, `${name}'s Final Health token is blank.`, 'phase');
  if (who === 'killer') endGame(g, 'finalGirl', `${K(g).name} is dead. ${FG(g).name} survives the night!`);
  else if (g.killer.health.hp <= 0 && !K(g).invulnerable) endGame(g, 'finalGirl', `${FG(g).name} dies taking ${K(g).name} down too. It still counts.`);
  else endGame(g, 'killer', `${FG(g).name} is dead. ${K(g).name} ${K(g).bodiless ? 'win' : 'wins'}.`);
}

/** +1 die each when you or the Killer are on your last health. */
export const adrenaline = (g: GameState): number => +(g.fg.health.hp === 1) + +(!K(g).invulnerable && g.killer.health.hp === 1);

// ---- bloodlust, dark power, finale ----------------------------------------

export const bloodlustSpace = (g: GameState) => K(g).bloodlust[g.killer.bloodlust];

export function killerAttack(g: GameState): number {
  return bloodlustSpace(g).attack + (has(g, 'mdp.wickedRage') ? 1 : 0);
}

export function addBloodlust(g: GameState, n: number): void {
  const k = K(g);
  const out: Effect[] = [];
  for (let i = 0; i < n; i++) {
    const top = k.bloodlust.length - 1;
    if (g.killer.bloodlust >= top) {
      log(g, `Bloodlust is maxed out: ${k.maxText}`, 'killer');
      out.push(...k.maxEffect);
      continue;
    }
    g.killer.bloodlust++;
    const sp = k.bloodlust[g.killer.bloodlust];
    log(g, K(g).bodiless ? `Bloodlust rises (${g.killer.bloodlust + 1}).` : `Bloodlust rises: attack ${sp.attack}, move ${sp.move}.`, 'killer');
    if (sp.effects) out.push(...sp.effects);
    if (sp.darkPower) revealDarkPower(g);
    const row = L(g).bloodlustTrack?.[g.killer.bloodlust - 1];
    if (row?.effects.length) {
      log(g, `${L(g).name}: ${row.text}`, 'killer');
      out.push(...row.effects);
    }
  }
  pushFx(g, out, { kind: 'bloodlust' });
}

export function revealDarkPower(g: GameState): void {
  for (const dp of g.killer.darkPowers) {
    if (dp.revealed) continue;
    dp.revealed = true;
    const def = K(g).darkPowers.find((d) => d.id === dp.id)!;
    log(g, `Dark Power revealed: ${def.name}. ${def.text}`, 'killer', { kind: 'card', deck: 'darkPower', id: def.id });
    for (const fn of hooks.darkPowerRevealed) fn(g, def.ability);
  }
}

export function revealFinale(g: GameState): void {
  const k = K(g);
  const fin = k.finales.find((f) => f.id === g.killer.finale)!;
  g.killer.finaleRevealed = true;
  log(g, `FINALE: ${fin.name}.${fin.text ? ` ${fin.text}` : ''}`, 'killer', { kind: 'card', deck: 'finale', id: fin.id });
  revealDarkPower(g);
  if (fin.ability === 'fin.secondDarkPower') {
    const options = k.darkPowers.filter((d) => !d.epic && !g.killer.darkPowers.some((x) => x.id === d.id));
    if (options.length) {
      const d = pick(g, options);
      g.killer.darkPowers.push({ id: d.id, revealed: true });
      log(g, `A second Dark Power: ${d.name}. ${d.text}`, 'killer', { kind: 'card', deck: 'darkPower', id: d.id });
      for (const fn of hooks.darkPowerRevealed) fn(g, d.ability);
    }
  }
  for (const fn of hooks.finaleRevealed) fn(g, fin.ability);
}

// ---- wrath (Inkanyamba, Sacred Groves) -----------------------------------

export const wrathName = (w: WrathKind): string => (w === 'killer' ? 'Killer Wrath' : 'Divine Wrath');
export const wrathKinds = (g: GameState): WrathKind[] => (['killer', 'divine'] as WrathKind[]).filter((w) => g.wrath[w] !== undefined);

export function sacredVictims(g: GameState): number {
  const brimstone = g.activeEvents.includes('fireBrimstone') ? g.tokens.find((t) => t.id === 'fireBrimstone')?.zone : undefined;
  let n = 0;
  for (const z of L(g).zones) if (z.sacred) n += g.victims.filter((v) => v.zone === z.id).length * (z.id === brimstone ? 2 : 1);
  return n;
}

export function wrathAmount(g: GameState, by: WrathBy): number {
  switch (by) {
    case 'sacredVictims':
      return sacredVictims(g);
    case 'bloodlustLevel':
      return g.killer.bloodlust + 1;
    case 'handSize':
      return g.fg.hand.length;
    case 'fgHealth':
      return Math.max(0, g.fg.health.hp);
    case 'saved':
      return g.fg.saved;
    case 'horrorLevel':
      return horrorLevel(g);
    case 'killedThisTurn':
      return g.mods.killedThisTurn;
    case 'damageSinceMark':
      return g.mods.damageTaken - g.mods.damageMark;
  }
}

export function raiseWrath(g: GameState, w: WrathKind, n: number): void {
  const cur = g.wrath[w];
  if (cur === undefined || n <= 0) return;
  let by = n;
  const why: string[] = [];
  if (w === 'killer' && has(g, 'mdp.outrageAddict')) {
    by++;
    why.push('Outrage Addict +1');
  }
  if (w === 'divine' && has(g, 'ev.loudObnoxious')) {
    by++;
    why.push('Loud and Obnoxious +1');
  }
  if (has(g, 'item.incense') && by > 1) {
    by--;
    why.push('Incense −1');
  }
  const next = Math.min(10, cur + by);
  g.wrath[w] = next;
  log(g, `${wrathName(w)} +${by}${why.length ? ` (${why.join(', ')})` : ''}: now ${next}.`, 'killer');
  if (next !== cur && w === 'killer') {
    if (has(g, 'dp.wrathFeast')) {
      log(g, 'Feast of Wrath: Inkanyamba heals.', 'killer');
      healKiller(g, 1);
    }
    if (has(g, 'dp.growingFear')) {
      log(g, 'Growing Fear: +1 Horror.', 'killer');
      addHorror(g, 1);
    }
  }
}

export function lowerWrath(g: GameState, w: WrathKind, op: 'reduce' | 'halve' | 'set', n = 1): void {
  const cur = g.wrath[w];
  if (cur === undefined) return;
  const target = op === 'reduce' ? cur - n : op === 'halve' ? Math.ceil(cur / 2) : n;
  g.wrath[w] = Math.max(1, Math.min(cur, target));
  log(g, `${wrathName(w)} drops to ${g.wrath[w]}.`, 'good');
}

export function wrathOp(g: GameState, which: WrathKind | 'choose', op: 'increase' | 'reduce' | 'halve' | 'set', n: number): void {
  const kinds = which === 'choose' ? wrathKinds(g) : wrathKinds(g).filter((w) => w === which);
  if (!kinds.length) return;
  const apply = (w: WrathKind) => (op === 'increase' ? raiseWrath(g, w, n) : lowerWrath(g, w, op, n));
  if (kinds.length === 1) return apply(kinds[0]);
  const what = op === 'increase' ? `raise by ${n}` : op === 'reduce' ? `lower by ${n}` : op === 'halve' ? 'halve' : `set to ${n}`;
  choose(
    g,
    `Which Wrath do you ${what}?`,
    kinds.map((w) => ({ id: w, label: `${wrathName(w)} (now ${g.wrath[w]})` })),
    { id: 'wrathOp', data: { op, n } },
  );
}

export function unleash(g: GameState, w: WrathKind): void {
  const lvl = g.wrath[w];
  const def = w === 'killer' ? K(g).wrath : L(g).wrath;
  if (lvl === undefined || !def) return;
  const row = def.levels[lvl - 1];
  log(g, `The ${wrathName(w)} is unleashed at ${lvl}! ${row.text}`, 'killer');
  pushFx(g, row.effects, { kind: 'wrath' });
}

/** Lucky charms you hold that can reroll dice. */
export const hasLuckyDice = (g: GameState): boolean =>
  usableItems(g, 'item.luckyDice').length > 0 || usableItems(g, 'item.superLuckyDice').length > 0;


import { answers } from './kernel';
answers.wrathOp = (g, w, data: { op: 'increase' | 'reduce' | 'halve' | 'set'; n: number }) => {
  if (data.op === 'increase') raiseWrath(g, w as WrathKind, data.n);
  else lowerWrath(g, w as WrathKind, data.op, data.n);
};
