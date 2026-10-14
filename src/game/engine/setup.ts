import { BONUS_ITEMS, finalGirlDef, killerDef, locationDef } from '../content';
import { ACTION_CARDS, BOARDS, FINAL_TOKENS, VICTIM_COUNT } from '../content/core';
import { log, pick, push, run, shuffle } from './kernel';
import type { GameConfig, GameState, ItemCard, Victim } from './state';

/** Film modules can add their own state and setup. */
export const setupHooks: ((g: GameState) => void)[] = [];

export function newGame(cfg: GameConfig): GameState {
  const k = killerDef(cfg.killer);
  const loc = locationDef(cfg.location);
  const fg = finalGirlDef(cfg.finalGirl);
  const b = BOARDS[cfg.board];

  const g = {
    v: 1,
    config: cfg,
    rng: { s: cfg.seed >>> 0 },
    turn: 1,
    phase: 'setup',
    log: [],
    stack: [],
    prompt: null,
    outcome: null,
    uid: 1,
  } as unknown as GameState;

  // Action cards: zero-cost ones start in hand, the rest make the tableau.
  const hand: string[] = [];
  const tableau: Record<string, number> = {};
  for (const c of ACTION_CARDS) {
    if (c.onlyWith && !c.onlyWith.includes(k.id) && !c.onlyWith.includes(loc.id)) continue;
    if (c.cost === 0) for (let i = 0; i < c.copies; i++) hand.push(c.id);
    else tableau[c.id] = c.copies;
  }

  const finale = pick(g, k.finales).id;
  const epic = k.darkPowers.find((d) => d.epic);
  const darkPower = cfg.epicDarkPower && epic ? epic : pick(g, k.darkPowers.filter((d) => !d.epic));
  const terror = shuffle(
    g,
    [...k.terror, ...loc.terror].flatMap((c) => Array(c.copies).fill(c.id) as string[]),
  ).slice(0, 10);

  // Item decks: normally 12 location items dealt into face-down piles, top card face up.
  const bonus = cfg.bonusItems ? BONUS_ITEMS.filter((i) => i.onlyFor === fg.id).map((i) => i.id) : [];
  const traps = loc.items.filter((i) => i.trap).map((i) => i.id);
  const pool = shuffle(g, [...loc.items.filter((i) => !i.trap).map((i) => i.id), ...bonus]);
  const decks: Record<string, ItemCard[]> = {};
  const nd = loc.itemDecks.length;
  const per = loc.deckSize ?? Math.floor(12 / nd);
  if (k.items?.length) {
    // Creech: the Killer's items hide below the face-up tops.
    const tops = pool.slice(0, nd);
    const rest = shuffle(g, [...pool.slice(nd, 10), ...k.items.map((i) => i.id)]);
    const each = Math.ceil(rest.length / nd);
    loc.itemDecks.forEach((d, i) => {
      decks[d] = [{ id: tops[i], up: true }, ...rest.slice(i * each, (i + 1) * each).map((id) => ({ id, up: false }))];
    });
  } else if (traps.length) {
    // Carnival: one trap hidden in each pile, never on top.
    const tr = shuffle(g, traps);
    loc.itemDecks.forEach((d, i) => {
      const top = pool[i * per];
      const under = shuffle(g, [...pool.slice(i * per + 1, (i + 1) * per), tr[i % tr.length]]);
      decks[d] = [{ id: top, up: true }, ...under.map((id) => ({ id, up: false }))];
    });
  } else {
    loc.itemDecks.forEach((d, i) => {
      decks[d] = pool.slice(i * per, (i + 1) * per).map((id, j) => ({ id, up: j === 0 }));
    });
  }

  const setup = cfg.setup ? loc.setups.find((s) => s.id === cfg.setup)! : pick(g, loc.setups);
  const tokens = shuffle(g, FINAL_TOKENS);
  let n = 1;
  const victims: Victim[] = Object.entries(setup.victims).flatMap(([zone, c]) => Array.from({ length: c }, () => ({ id: `v${n++}`, zone })));

  Object.assign(g, {
    setupName: setup.name,
    fg: {
      id: fg.id,
      zone: setup.fg,
      startZone: setup.fg,
      health: { hp: fg.health, max: fg.health, token: 'black', hidden: tokens[1] },
      time: b.startTime,
      horror: Math.max(0, b.horror.findIndex((h) => h.label === k.startHorror)),
      hand,
      items: [],
      slots: fg.slots.map(() => false),
      ultimate: false,
      saved: 0,
    },
    killer: {
      id: k.id,
      zone: setup.killer,
      startZone: setup.killer,
      health: { hp: k.health, max: k.health, token: 'black', hidden: tokens[0] },
      bloodlust: 0,
      finale,
      finaleRevealed: false,
      darkPowers: [{ id: darkPower.id, revealed: false }],
      minors: [],
    },
    victims,
    victimPool: VICTIM_COUNT - victims.length,
    dead: [],
    minions: [],
    minionPool: { ready: k.minion ? Array.from({ length: k.minion.count }, (_, i) => `m${i + 1}`) : [], exhausted: [] },
    tableau,
    actionDiscard: [],
    terrorDeck: terror,
    terrorDiscard: [],
    activeTerror: [],
    eventDeck: shuffle(g, loc.events.map((e) => e.id)),
    eventDiscard: [],
    activeEvents: [],
    itemDecks: decks,
    itemDiscard: [],
    tokens: [],
    tunnel: [],
    blocked: [],
    wrath: { ...(k.wrath ? { killer: k.wrath.start } : {}), ...(loc.wrath ? { divine: loc.wrath.start } : {}) },
    spareTokens: tokens.slice(2),
    film: {},
    mods: {
      bonusDice: 0,
      partialsNext: false,
      partialsPhase: false,
      killedThisTurn: 0,
      killedThisKillerPhase: 0,
      rescuedThisPhase: 0,
      usedThisPhase: [],
      usedThisTurn: [],
      skipNextAction: false,
      timeAtNextAction: null,
      actionEnding: false,
      damageTaken: 0,
      damageMark: 0,
      minusDicePhase: 0,
    },
  });
  g.uid = n;

  log(g, `${fg.name} vs ${k.name} at ${loc.name}. Setup: ${setup.name}.`, 'phase');
  if (cfg.board === 'extreme') log(g, 'Extreme Horror.', 'phase');
  for (const fn of setupHooks) fn(g);
  const first = g.eventDeck.shift()!;
  push(g, { t: 'event', card: first }, { t: 'phase', phase: 'action', step: 0 });
  run(g);
  return g;
}
