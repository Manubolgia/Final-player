import type { ActionCardDef, BoardDef, Effect } from '../types';

const t = (n: number): Effect => ({ k: 'time', n });
const h = (n: number): Effect => ({ k: 'horror', n });
const heal = (n: number): Effect => ({ k: 'heal', n });
const lose = (n: number): Effect => ({ k: 'lose', n });
const move = (n: number): Effect => ({ k: 'move', n });
const dmg = (n: number): Effect => ({ k: 'damage', n });
const end: Effect = { k: 'endAction' };

/** The core box's 23 action cards, plus the two location-only ones. */
export const ACTION_CARDS: ActionCardDef[] = [
  {
    id: 'walk',
    name: 'Walk',
    cost: 0,
    copies: 2,
    timing: 'action',
    text: '2+: move up to 2, −1 Time. 1: move up to 1, −1 Time. Fail: move up to 1, lose 1 health, −2 Time — or just −2 Time.',
    results: {
      double: [[move(2), t(-1)]],
      single: [[move(1), t(-1)]],
      fail: [[move(1), lose(1), t(-2)], [t(-2)]],
    },
  },
  {
    id: 'focus',
    name: 'Focus',
    cost: 0,
    copies: 2,
    timing: 'action',
    text: '2+: −1 Horror, +2 Time. 1: −1 Horror, −1 Time. Fail: −2 Time.',
    results: {
      double: [[h(-1), t(2)]],
      single: [[h(-1), t(-1)]],
      fail: [[t(-2)]],
    },
  },
  {
    id: 'weakAttack',
    name: 'Weak Attack',
    cost: 0,
    copies: 1,
    timing: 'action',
    text: '2+: 1 damage. 1: 1 damage, lose 1 health. Fail: lose 1 health and the Action Phase ends.',
    results: {
      double: [[dmg(1)]],
      single: [[dmg(1), lose(1)]],
      fail: [[lose(1), end]],
    },
  },
  {
    id: 'shortRest',
    name: 'Short Rest',
    cost: 0,
    copies: 1,
    timing: 'action',
    text: '2+: heal 2. 1: heal 1, −1 Time. Fail: heal 1, +1 Horror, −1 Time and the Action Phase ends.',
    results: {
      double: [[heal(2)]],
      single: [[heal(1), t(-1)]],
      fail: [[heal(1), h(1), t(-1), end]],
    },
  },
  {
    id: 'closeCall',
    name: 'Close Call',
    cost: 1,
    copies: 2,
    timing: 'afterRoll',
    text: 'Play after any horror roll: reroll one die, or reroll ALL the dice for −2 Time.',
  },
  {
    id: 'search',
    name: 'Search',
    cost: 2,
    copies: 2,
    timing: 'action',
    text: 'Search space only. 2+: draw the top 2 items of this space\'s deck and keep 1; put the other back on top face up or on the bottom face down; −1 Time. 1: take the top item, −1 Time. Fail: take the top item, +2 Horror, −2 Time — or +1 Horror, −2 Time.',
    results: {
      double: [[{ k: 'search', n: 2 }, t(-1)]],
      single: [[{ k: 'search', n: 1 }, t(-1)]],
      fail: [[{ k: 'search', n: 1 }, h(2), t(-2)], [h(1), t(-2)]],
    },
  },
  {
    id: 'sprint',
    name: 'Sprint',
    cost: 2,
    copies: 2,
    timing: 'action',
    text: '2+: move up to 3, −1 Time. 1: move up to 2, −1 Time. Fail: move up to 1, lose 1 health, −2 Time and the Action Phase ends — or lose 1 health, −2 Time.',
    results: {
      double: [[move(3), t(-1)]],
      single: [[move(2), t(-1)]],
      fail: [[move(1), lose(1), t(-2), end], [lose(1), t(-2)]],
    },
  },
  {
    id: 'guard',
    name: 'Guard',
    cost: 2,
    copies: 2,
    timing: 'reaction',
    text: 'Reaction, when an enemy attacks you. 2+: ignore ALL the damage. 1: reduce the damage by 2. Fail: reduce the damage by 1 (to no less than 1).',
    results: {
      double: [[{ k: 'ignoreAttack' }]],
      single: [[{ k: 'reduceAttack', n: 2 }]],
      fail: [[{ k: 'reduceAttack', n: 1, min: 1 }]],
    },
  },
  {
    id: 'distraction',
    name: 'Distraction',
    cost: 3,
    copies: 2,
    timing: 'action',
    text: '2+: −2 Horror, +2 Time. 1: −1 Horror, +1 Time. Fail: −1 Horror, −4 Time — or +1 Horror, −2 Time.',
    results: {
      double: [[h(-2), t(2)]],
      single: [[h(-1), t(1)]],
      fail: [[h(-1), t(-4)], [h(1), t(-2)]],
    },
  },
  {
    id: 'improvise',
    name: 'Improvise',
    cost: 3,
    copies: 1,
    timing: 'action',
    text: '2+: until this Action Phase ends, every 3 and 4 is a success. 1: on your next horror roll, every 3 and 4 is a success. Fail: +1 Horror, −1 Time.',
    results: {
      double: [[{ k: 'partials', scope: 'phase' }]],
      single: [[{ k: 'partials', scope: 'next' }]],
      fail: [[h(1), t(-1)]],
    },
  },
  {
    id: 'planning',
    name: 'Planning',
    cost: 4,
    copies: 1,
    timing: 'action',
    text: '2+: +3 dice on your next horror roll. 1: +2 dice on your next horror roll, −1 Time. Fail: +1 die on your next horror roll, +1 Horror, −2 Time.',
    results: {
      double: [[{ k: 'bonusDice', n: 3 }]],
      single: [[{ k: 'bonusDice', n: 2 }, t(-1)]],
      fail: [[{ k: 'bonusDice', n: 1 }, h(1), t(-2)]],
    },
  },
  {
    id: 'retaliate',
    name: 'Retaliate',
    cost: 4,
    copies: 1,
    timing: 'reaction',
    text: 'Reaction, when an enemy attacks you. 2+: ignore ALL the damage and deal 2 damage. 1: reduce the damage by 2 and deal 1 damage. Fail: no effect.',
    results: {
      double: [[{ k: 'ignoreAttack' }, dmg(2)]],
      single: [[{ k: 'reduceAttack', n: 2 }, dmg(1)]],
      fail: [[]],
    },
  },
  {
    id: 'furiousStrike',
    name: 'Furious Strike',
    cost: 4,
    copies: 2,
    timing: 'action',
    text: '2+: 2 damage, −1 Horror. 1: 1 damage, −1 Horror and the Action Phase ends. Fail: lose 1 health, +1 Horror and the Action Phase ends.',
    results: {
      double: [[dmg(2), h(-1)]],
      single: [[dmg(1), h(-1), end]],
      fail: [[lose(1), h(1), end]],
    },
  },
  {
    id: 'longRest',
    name: 'Long Rest',
    cost: 5,
    copies: 1,
    timing: 'action',
    text: '2+: heal 4, −1 Time. 1: heal 3, −2 Time. Fail: heal 2, +1 Horror, −2 Time and the Action Phase ends.',
    results: {
      double: [[heal(4), t(-1)]],
      single: [[heal(3), t(-2)]],
      fail: [[heal(2), h(1), t(-2), end]],
    },
  },
  {
    id: 'criticalBlow',
    name: 'Critical Blow',
    cost: 6,
    copies: 1,
    timing: 'action',
    text: '2+: 3 damage, −1 Horror. 1: 2 damage, −1 Horror and the Action Phase ends. Fail: 2 damage, lose 2 health, +1 Horror and the Action Phase ends.',
    results: {
      double: [[dmg(3), h(-1)]],
      single: [[dmg(2), h(-1), end]],
      fail: [[dmg(2), lose(2), h(1), end]],
    },
  },
  {
    id: 'atone',
    name: 'Atone',
    cost: 2,
    copies: 2,
    timing: 'action',
    onlyWith: ['inkanyamba', 'sacredGroves'],
    text: '3+: set the Killer Wrath or the Divine Wrath to 1. 2: halve one Wrath (round up). 1: reduce one Wrath by 1. Fail: +1 Horror, −2 Time.',
    results: {
      triple: [[{ k: 'wrath', which: 'choose', op: 'set', n: 1 }]],
      double: [[{ k: 'wrath', which: 'choose', op: 'halve' }]],
      single: [[{ k: 'wrath', which: 'choose', op: 'reduce', n: 1 }]],
      fail: [[h(1), t(-2)]],
    },
  },
  {
    id: 'persuade',
    name: 'Persuade',
    cost: 1,
    copies: 2,
    timing: 'action',
    onlyWith: ['mapleLane'],
    text: 'Only to get into an adjacent house with a victim in it. 3+: go in; you may take its top item (then mark the house searched). 2: go in. 1: go in, −1 Time. Fail: go in, lose 1 health and the Action Phase ends — or put this card back in the tableau, −1 Time.',
    results: {
      triple: [[{ k: 'custom', id: 'ml.enter', data: { take: true } }]],
      double: [[{ k: 'custom', id: 'ml.enter' }]],
      single: [[{ k: 'custom', id: 'ml.enter' }, t(-1)]],
      fail: [[{ k: 'custom', id: 'ml.enter' }, lose(1), end], [{ k: 'custom', id: 'ml.returnCard' }, t(-1)]],
    },
  },
];

export const BOARDS: Record<'normal' | 'extreme', BoardDef> = {
  normal: {
    id: 'normal',
    name: 'Normal',
    horror: [
      { label: null, dice: 3 },
      { label: 1, dice: 3 },
      { label: 2, dice: 2 },
      { label: 3, dice: 2 },
      { label: 4, dice: 2 },
      { label: 5, dice: 2 },
      { label: 6, dice: 2 },
      { label: null, dice: 1 },
    ],
    startTime: 6,
    maxTime: 12,
  },
  extreme: {
    id: 'extreme',
    name: 'Extreme Horror',
    horror: [
      { label: null, dice: 3 },
      { label: 1, dice: 2 },
      { label: 2, dice: 2 },
      { label: 3, dice: 2 },
      { label: 4, dice: 2 },
      { label: 5, dice: 1 },
      { label: 6, dice: 1 },
      { label: null, dice: 1 },
    ],
    startTime: 5,
    maxTime: 12,
  },
};

/** The nine black Final Health tokens: hearts on the back of each. */
export const FINAL_TOKENS = [0, 0, 0, 0, 0, 0, 1, 2, 3];

/** Victim meeples in the core box. */
export const VICTIM_COUNT = 21;

export const HAND_LIMIT = 10;

export const cardById = new Map(ACTION_CARDS.map((c) => [c.id, c]));
export function card(id: string): ActionCardDef {
  const c = cardById.get(id);
  if (!c) throw new Error(`Unknown action card ${id}`);
  return c;
}

/** Does this card's result table deal damage (so it is an attack)? */
export function isAttackCard(id: string): boolean {
  const r = card(id).results;
  if (!r) return false;
  return [r.triple ?? [], r.double, r.single, r.fail].some((line) => line.some((opt) => opt.some((e) => e.k === 'damage')));
}

export function isMoveCard(id: string): boolean {
  const r = card(id).results;
  if (!r) return false;
  return [r.triple ?? [], r.double, r.single, r.fail].some((line) => line.some((opt) => opt.some((e) => e.k === 'move')));
}

export function isHealCard(id: string): boolean {
  const r = card(id).results;
  if (!r) return false;
  return [r.double, r.single, r.fail].some((line) => line.some((opt) => opt.some((e) => e.k === 'heal')));
}
