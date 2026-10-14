// Slaughter in the Groves: Inkanyamba's Killer Wrath, the Sacred Groves'
// Divine Wrath, Adelaide and Barbara.

import { card } from '../content/core';
import { moveEndHooks, onUltimate, releaseRole } from '../engine/actionPhase';
import { closestVictims, exits, killVictim, moveVictim, panicVictims, shortestPaths, victimsIn } from '../engine/board';
import { rollDone, startRoll } from '../engine/dice';
import { gainCard, placeKiller } from '../engine/effects';
import { answers, choose, customs, d6, has, hooks, L, log, plural, push, pushFx, zoneDef, zoneName } from '../engine/kernel';
import { assignRole, eventSetups, lateUpkeep } from '../engine/phases';
import { afterRoll, extraActions, extraUses, itemHandlers } from '../engine/registry';
import type { GameState } from '../engine/state';
import { addTime, healFG, lowerWrath, raiseWrath, unleash, wrathKinds, wrathName, wrathOp } from '../engine/stats';
import { peekTerror } from './common';

const sacred = (g: GameState) => L(g).zones.filter((z) => z.sacred).map((z) => z.id);

customs['gr.initialWrath'] = (g) => {
  const w = g.wrath.killer;
  if (w !== undefined && w <= 2) raiseWrath(g, 'killer', 1);
};

customs['gr.markDamage'] = (g) => {
  g.mods.damageMark = g.mods.damageTaken;
};

customs['gr.purge'] = (g) => {
  const out = g.fg.hand.filter((c) => c !== 'atone');
  g.fg.hand = g.fg.hand.filter((c) => c === 'atone');
  g.actionDiscard.push(...out);
  log(g, `You discard ${plural(out.length, 'action card')}.`, 'bad');
  if (out.length) lowerWrath(g, 'divine', 'reduce', out.length);
};

customs['gr.punishmentMercy'] = (g) => {
  const w = g.wrath.killer;
  if (w === undefined) return log(g, 'There is no Killer Wrath in play: no effect.');
  if (w <= 3) {
    raiseWrath(g, 'killer', 2);
    unleash(g, 'killer');
  } else if (w <= 5) raiseWrath(g, 'killer', 2);
  else if (w <= 9) lowerWrath(g, 'killer', 'halve');
  else lowerWrath(g, 'killer', 'set', 1);
};

customs['gr.killerToSacred'] = (g) => {
  const counts = sacred(g)
    .map((z) => [z, victimsIn(g, z).length] as const)
    .filter(([, n]) => n > 0);
  if (!counts.length) return placeKiller(g, g.fg.zone);
  const most = Math.max(...counts.map(([, n]) => n));
  const zs = counts.filter(([, n]) => n === most).map(([z]) => z);
  if (zs.length === 1) return placeKiller(g, zs[0]);
  choose(g, 'Tie: which sacred space does the Killer appear in?', zs.map((z) => ({ id: z, label: zoneName(g, z), zone: z })), { id: 'placeKiller' });
};

customs['gr.gather'] = (g, arg: string) => {
  const targets = arg === 'sacred' ? sacred(g) : [arg];
  const moves = new Map<string, string[]>();
  for (const v of g.victims) {
    if (targets.includes(v.zone) || moves.has(v.zone)) continue;
    const to = targets.filter((t) => exits(g, v.zone, 'victim').includes(t));
    if (to.length) moves.set(v.zone, to);
  }
  for (const [from, to] of moves) {
    if (to.length > 1) {
      choose(g, `Tie: which sacred space do the victims in ${zoneName(g, from)} go to?`, to.map((t) => ({ id: t, label: zoneName(g, t), zone: t })), { id: 'gatherTo', data: { from } });
      continue;
    }
    gatherFrom(g, from, to[0]);
  }
};
function gatherFrom(g: GameState, from: string, to: string): void {
  const vs = victimsIn(g, from);
  if (!vs.length) return;
  log(g, `${plural(vs.length, 'victim')} drift from ${zoneName(g, from)} to ${zoneName(g, to)}.`, 'info', { kind: 'victimMove', victim: vs[0].id, path: [from, to] });
  for (const v of vs) moveVictim(g, v, to);
}
answers.gatherTo = (g, to, data: { from: string }) => gatherFrom(g, data.from, to);

// ---- rolls made by cards -------------------------------------------------------

function effectRoll(g: GameState, id: string, label: string): void {
  log(g, `${label}: make a horror roll.`, 'killer');
  startRoll(g, { kind: 'effect', id, label }, { id });
}

customs['gr.fickleTemper'] = (g) => effectRoll(g, 'gr.fickleTemper', 'Fickle Temper');
rollDone['gr.fickleTemper'] = (g, s) => {
  log(g, `Fickle Temper: ${plural(s, 'success', 'successes')}.`, s ? 'good' : 'bad');
  if (s >= 2) return wrathOp(g, 'choose', 'halve', 0);
  if (s === 1) return wrathOp(g, 'choose', 'reduce', 1);
  unleash(g, 'killer');
  const r = d6(g);
  log(g, `You roll a ${r}.`, 'info', { kind: 'dice', faces: [r] });
  pushFx(g, [{ k: 'wrath', which: 'killer', op: 'increase', n: r }], { kind: 'terror' });
};

rollDone['gr.boiling'] = (g, s) => {
  log(g, `Boiling Wrath: ${plural(s, 'success', 'successes')}.`, s ? 'good' : 'bad');
  if (!s) raiseWrath(g, 'killer', 1);
};
rollDone['gr.volatile'] = (g, s) => {
  log(g, `Volatile Temper: ${plural(s, 'success', 'successes')}.`, s ? 'good' : 'bad');
  if (!s) unleash(g, 'killer');
};
rollDone['gr.fickleGods'] = (g, s) => {
  log(g, `The Fickleness of the Gods: ${plural(s, 'success', 'successes')}.`, s ? 'good' : 'bad');
  if (s >= 2) return wrathOp(g, 'choose', 'reduce', 1);
  if (s === 0) pushFx(g, [{ k: 'unleash', which: 'divine' }, { k: 'wrath', which: 'divine', op: 'increase', by: 'sacredVictims' }], { kind: 'terror' });
};

hooks.upkeep.push((g) => {
  if (has(g, 'mdp.boilingWrath')) effectRoll(g, 'gr.boiling', 'Boiling Wrath');
});
lateUpkeep.push(
  (g) => {
    if (has(g, 'tr.fickleGods')) effectRoll(g, 'gr.fickleGods', 'The Fickleness of the Gods');
  },
  (g) => {
    if (has(g, 'dp.volatileTemper')) effectRoll(g, 'gr.volatile', 'Volatile Temper');
  },
);

extraActions.push((g) =>
  g.activeTerror.includes('fickleGods') && g.fg.time >= 3 ? [{ uid: 'gr:fickle', action: 'discard', label: 'Appease the gods: discard The Fickleness of the Gods (3 Time)' }] : [],
);
extraUses['gr:fickle'] = (g) => {
  addTime(g, -3);
  g.activeTerror = g.activeTerror.filter((t) => t !== 'fickleGods');
  g.terrorDiscard.push('fickleGods');
  log(g, 'The gods are calmer: The Fickleness of the Gods is discarded.', 'good');
};

afterRoll.push((g, _dice, s) => {
  if (s === 0 && has(g, 'ev.godsHateFailure') && g.wrath.divine !== undefined) {
    log(g, 'The Gods Hate Failure: Divine Wrath +1.', 'killer');
    raiseWrath(g, 'divine', 1);
  }
});

// ---- Dark Lightning ------------------------------------------------------------------

customs['gr.darkLightning'] = (g, data: { zone: string }) => {
  const zones = [data.zone, ...exits(g, data.zone, 'enemy')].filter((z) => victimsIn(g, z).some((v) => v.role !== 'werewolf'));
  if (!zones.length) return;
  const opts = zones.flatMap((z) => [...new Set(victimsIn(g, z).map((v) => v.role ?? ''))].map((r) => ({ id: `${z}|${r}`, label: `${r ? 'A special victim' : 'A victim'} in ${zoneName(g, z)}`, zone: z })));
  if (opts.length === 1) return lightning(g, opts[0].id);
  choose(g, 'Dark Lightning: who else dies?', opts, { id: 'darkLightning' });
};
function lightning(g: GameState, id: string): void {
  const [z, r] = id.split('|');
  const v = victimsIn(g, z).find((x) => (x.role ?? '') === r);
  if (!v) return;
  log(g, 'Dark Lightning: another victim falls.', 'killer');
  killVictim(g, v, true, { chained: true });
}
answers.darkLightning = (g, id) => lightning(g, id);

// ---- events -------------------------------------------------------------------------------

const sacredByRoll = (r: number) => (r <= 2 ? 'cemetery' : r <= 4 ? 'shrine' : 'sacredTrees');
for (const [ab, tok] of [
  ['ev.fireBrimstone', 'fireBrimstone'],
  ['ev.sacredGround', 'sacredGround'],
] as const) {
  eventSetups[ab] = (g) => {
    const r = d6(g);
    const z = sacredByRoll(r);
    g.tokens.push({ id: tok, zone: z });
    log(g, `Rolled ${r}: the token goes to ${zoneName(g, z)}.`, 'info', { kind: 'dice', faces: [r] });
  };
}

eventSetups['ev.closed'] = (g) => {
  const n = g.fg.hand.filter((c) => c !== 'atone').length;
  choose(
    g,
    'Closed for Maintenance: discard your action cards (but Atone) to close a sacred space?',
    [...sacred(g).map((z) => ({ id: z, label: `Close ${zoneName(g, z)} (discard ${plural(n, 'card')})`, zone: z })), { id: 'no', label: 'No' }],
    { id: 'closeSacred' },
  );
};
answers.closeSacred = (g, id) => {
  const ev = g.activeEvents.find((e) => e === 'closed');
  if (id === 'no') {
    if (ev) {
      g.activeEvents = g.activeEvents.filter((e) => e !== ev);
      g.eventDiscard.push(ev);
    }
    return;
  }
  const out = g.fg.hand.filter((c) => c !== 'atone');
  g.fg.hand = g.fg.hand.filter((c) => c === 'atone');
  g.actionDiscard.push(...out);
  g.tokens.push({ id: 'closed', zone: id });
  log(g, `You discard ${plural(out.length, 'card')} and close ${zoneName(g, id)}.`, 'good');
  const outs = exits(g, id, 'enemy');
  victimsIn(g, id).forEach((v, i) => {
    const to = outs[i % outs.length];
    log(g, `A victim leaves ${zoneName(g, id)} for ${zoneName(g, to)}.`, 'info', { kind: 'victimMove', victim: v.id, path: [id, to] });
    moveVictim(g, v, to);
  });
};

eventSetups['ev.superTourist'] = (g) => assignRole(g, 'superTourist', 'killer');
eventSetups['ev.holyMan'] = (g) => assignRole(g, 'holyMan', 'killer');
eventSetups['ev.tourGuide'] = (g) => assignRole(g, 'tourGuide', 'fg');

hooks.victimKilled.push((g, v, zone) => {
  if (v.role === 'superTourist') {
    log(g, 'The Super Tourist is dead: Divine Wrath +4.', 'killer');
    pushFx(g, [{ k: 'wrath', which: 'divine', op: 'increase', n: 4 }], { kind: 'event' });
  }
  if (v.role === 'tourGuide') {
    log(g, 'The Tour Guide is dead: Divine Wrath +6.', 'killer');
    pushFx(g, [{ k: 'wrath', which: 'divine', op: 'increase', n: 6 }], { kind: 'event' });
  }
  if (has(g, 'ev.unholySlaughter') && zoneDef(g, zone).sacred) {
    log(g, 'Unholy Slaughter: blood on sacred ground.', 'killer');
    pushFx(g, [{ k: 'unleash', which: 'divine' }], { kind: 'event' });
  }
});

hooks.actionPhaseEnd.push((g) => {
  if (!has(g, 'ev.sacredGround')) return;
  const z = g.tokens.find((t) => t.id === 'sacredGround')?.zone;
  if (z && g.fg.zone === z) {
    log(g, 'Sacred Ground: you end your turn here and gain 2 Time.', 'good');
    addTime(g, 2);
  }
});

// The Holy Man walks to the Killer.
const holyMan = (g: GameState) => g.victims.find((v) => v.role === 'holyMan');
function holyMeets(g: GameState): void {
  const h = holyMan(g);
  if (!h || h.zone !== g.killer.zone || g.outcome) return;
  g.victims = g.victims.filter((v) => v !== h);
  log(g, `The Holy Man meets ${'the Killer'} and is gone.`, 'phase');
  releaseRole(g, h);
  if (g.fg.zone === h.zone) {
    log(g, 'You were there: set a Wrath to 4.', 'good');
    return wrathOp(g, 'choose', 'set', 4);
  }
  const ks = wrathKinds(g);
  if (ks.length === 1) return raiseWrath(g, ks[0], 10);
  if (ks.length)
    choose(
      g,
      'The Holy Man: split a rise of 10 between the Killer Wrath and the Divine Wrath',
      Array.from({ length: 11 }, (_, i) => ({ id: String(i), label: `Killer +${i} · Divine +${10 - i}` })),
      { id: 'holySplit' },
    );
}
answers.holySplit = (g, id) => {
  const n = Number(id);
  if (n) raiseWrath(g, 'killer', n);
  if (10 - n) raiseWrath(g, 'divine', 10 - n);
};
hooks.killerMoved.push(holyMeets);
hooks.upkeep.push((g) => {
  const h = holyMan(g);
  if (!h || !has(g, 'ev.holyMan')) return;
  if (h.zone === g.killer.zone) return holyMeets(g);
  const steps = [...new Set(shortestPaths(g, h.zone, g.killer.zone, 'victim').map((p) => p[0]))].filter(Boolean);
  if (!steps.length) return log(g, 'The Holy Man can\'t find a way to the Killer.');
  if (steps.length > 1) return choose(g, 'Tie: which way does the Holy Man go?', steps.map((s) => ({ id: s, label: zoneName(g, s), zone: s })), { id: 'holyStep' });
  holyStep(g, steps[0]);
});
function holyStep(g: GameState, to: string): void {
  const h = holyMan(g);
  if (!h) return;
  log(g, `The Holy Man walks toward the Killer: ${zoneName(g, h.zone)} → ${zoneName(g, to)}.`, 'info', { kind: 'victimMove', victim: h.id, path: [h.zone, to] });
  moveVictim(g, h, to);
  holyMeets(g);
}
answers.holyStep = (g, to) => holyStep(g, to);

// The Tour Guide: one free extra step a turn.
moveEndHooks.push((g, f) => {
  if (f.mode !== 'walk' || !f.moved || !has(g, 'ev.tourGuide') || g.mods.usedThisTurn.includes('guide')) return;
  if (!victimsIn(g, g.fg.zone).some((v) => v.role === 'tourGuide')) return;
  g.mods.usedThisTurn.push('guide');
  choose(
    g,
    'The Tour Guide is with you: move 1 more space?',
    [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
    { id: 'guideMove' },
  );
});
answers.guideMove = (g, id) => {
  if (id === 'yes') push(g, { t: 'move', remaining: 1, mode: 'walk', moved: 0, src: { kind: 'event' } });
};

// ---- items -----------------------------------------------------------------------------

itemHandlers['item.shamanBones'] = {
  actions: (g, it) => ((it.uses ?? 0) > 0 && g.terrorDeck.length ? [{ action: 'use', label: "Read the Shaman's Bones (peek at the Terror deck)" }] : []),
  use(g, it) {
    const left = (it.uses ?? 1) - 1;
    it.uses = left;
    if (left <= 0) {
      g.fg.items = g.fg.items.filter((x) => x !== it);
      g.itemDiscard.push(it.id);
    }
    peekTerror(g, "Shaman's Bones");
  },
};

itemHandlers['item.airHorn'] = {
  actions: (g) => (g.fg.time >= 1 ? [{ action: 'use', label: 'Sound the air horn (1 Time)' }] : []),
  use(g) {
    addTime(g, -1);
    const near = [g.fg.zone, ...exits(g, g.fg.zone, 'enemy')];
    const vs = g.victims.filter((v) => near.includes(v.zone) && v.role !== 'werewolf');
    log(g, `Air horn! ${plural(vs.length, 'victim')} panic.`);
    panicVictims(g, vs);
  },
};

itemHandlers['item.outOfOrder'] = {
  actions: (g) => (g.fg.time >= 1 && signOptions(g).length ? [{ action: 'use', label: 'Out of Order signs (1 Time)' }] : []),
  use(g) {
    choose(g, 'Out of Order signs', signOptions(g), { id: 'outOfOrder' });
  },
};
function signOptions(g: GameState) {
  const here = g.fg.zone;
  return exits(g, here, 'enemy').flatMap((to) => {
    const has = g.blocked.some(([a, b]) => (a === here && b === to) || (a === to && b === here));
    if (has) return [{ id: `del|${to}`, label: `Take the sign down between here and ${zoneName(g, to)}`, zone: to }];
    return g.blocked.length < 2 ? [{ id: `add|${to}`, label: `Put a sign between here and ${zoneName(g, to)}`, zone: to }] : [];
  });
}
answers.outOfOrder = (g, id) => {
  const [op, to] = id.split('|');
  const here = g.fg.zone;
  addTime(g, -1);
  if (op === 'add') {
    g.blocked.push([here, to]);
    log(g, `You put an Out of Order sign between ${zoneName(g, here)} and ${zoneName(g, to)}.`);
  } else {
    g.blocked = g.blocked.filter(([a, b]) => !((a === here && b === to) || (a === to && b === here)));
    log(g, `You take the sign down between ${zoneName(g, here)} and ${zoneName(g, to)}.`);
  }
};

// ---- Adelaide's ultimate, the Miracle finale ---------------------------------------------

export function cardsByCost(g: GameState, budget: number): void {
  const opts = Object.entries(g.tableau)
    .filter(([c, n]) => n > 0 && card(c).cost > 0 && card(c).cost <= budget)
    .map(([c]) => ({ id: c, label: `${card(c).name} (cost ${card(c).cost})`, detail: card(c).text }));
  if (!opts.length || g.fg.hand.length >= 10) return;
  choose(g, `Take action cards (${budget} cost left)`, [...opts, { id: 'done', label: 'That\'s enough' }], { id: 'cardsByCost', data: { budget } });
}
answers.cardsByCost = (g, id, data: { budget: number }) => {
  if (id === 'done') return;
  gainCard(g, id);
  cardsByCost(g, data.budget - card(id).cost);
};

onUltimate.push((g) => {
  if (g.fg.id !== 'adelaide') return;
  choose(
    g,
    "Adelaide's Ultimate: pick one",
    [
      ...(wrathKinds(g).length ? [{ id: 'wrath', label: 'Set a Wrath to 1' }] : []),
      { id: 'heal', label: 'Heal all your health' },
      { id: 'cards', label: 'Take action cards worth up to 6' },
    ],
    { id: 'adelaideUlt' },
  );
});
answers.adelaideUlt = (g, id) => {
  if (id === 'wrath') return wrathOp(g, 'choose', 'set', 1);
  if (id === 'heal') return healFG(g, g.fg.health.max);
  cardsByCost(g, 6);
};

hooks.finaleRevealed.push((g, ability) => {
  if (ability !== 'fin.miracle') return;
  if (g.wrath.killer !== undefined) {
    g.wrath.killer = 10;
    log(g, `The ${wrathName('killer')} jumps to 10.`, 'killer');
  }
  cardsByCost(g, 6);
});

export { closestVictims };
