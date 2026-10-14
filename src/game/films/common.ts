// Items, events and abilities shared by several feature films, plus the
// whole of The Happy Trails Horror (Hans, Camp Happy Trails, Laurie, Reiko).

import { releaseRole } from '../engine/actionPhase';
import { distances, exits, killVictim, moveVictim, shortestPaths, victimsIn } from '../engine/board';
import { attackTargets, pushKillerAction, weaponRange } from '../engine/combat';
import { rollDone, startRoll } from '../engine/dice';
import { discardItem, spendUse } from '../engine/effects';
import { answers, choose, customs, gotoPhase, has, hooks, itemDef, K, L, log, plural, push, pushFx, terrorDef, theItem, zoneDef, zoneName } from '../engine/kernel';
import { assignRole, eventSetups } from '../engine/phases';
import { itemHandlers, ultimates } from '../engine/registry';
import type { GameState, ItemInst } from '../engine/state';
import { addTime } from '../engine/stats';
import type { Effect } from '../types';

const used = (g: GameState, key: string) => g.mods.usedThisPhase.includes(key);
const use = (g: GameState, key: string) => g.mods.usedThisPhase.push(key);

export function optionsChoice(g: GameState, title: string, opts: { id: string; label: string; fx: Effect[] }[], src: string): void {
  choose(
    g,
    title,
    opts.map((o) => ({ id: o.id, label: o.label })),
    { id: 'fxOption', data: { opts: Object.fromEntries(opts.map((o) => [o.id, o.fx])), src } },
  );
}
answers.fxOption = (g, id, data: { opts: Record<string, Effect[]>; src: string }) => pushFx(g, data.opts[id] ?? [], { kind: 'item', id: data.src });

// ---- one-shot items -----------------------------------------------------------

itemHandlers['item.energyDrink'] = {
  actions: () => [{ action: 'use', label: 'Drink it: +3 Time or move 1' }],
  use(g, it) {
    discardItem(g, it.uid);
    optionsChoice(g, 'Energy Drink', [
      { id: 'time', label: '+3 Time', fx: [{ k: 'time', n: 3 }] },
      { id: 'move', label: 'Move 1 space', fx: [{ k: 'move', n: 1 }] },
    ], it.id);
  },
};

itemHandlers['item.pills'] = {
  actions: () => [{ action: 'use', label: 'Swallow: −1 Horror or heal 2' }],
  use(g, it) {
    discardItem(g, it.uid);
    optionsChoice(g, 'Mystery Pills', [
      { id: 'horror', label: '−1 Horror', fx: [{ k: 'horror', n: -1 }] },
      { id: 'heal', label: 'Heal 2', fx: [{ k: 'heal', n: 2 }] },
    ], it.id);
  },
};

itemHandlers['item.rabbitFoot'] = {
  actions: () => [{ action: 'use', label: 'Rub it: a horror roll for rewards' }],
  use(g, it) {
    discardItem(g, it.uid);
    startRoll(g, { kind: 'item', id: it.id }, { id: 'rabbitFoot' });
  },
};
rollDone.rabbitFoot = (g, s) => {
  log(g, `Rabbit's Foot: ${plural(s, 'success', 'successes')}.`, s ? 'good' : 'bad');
  if (s > 0) rabbitPick(g, s);
};
function rabbitPick(g: GameState, left: number): void {
  choose(
    g,
    `Rabbit's Foot: pick a reward (${left} left)`,
    [
      { id: 'time', label: '+2 Time' },
      { id: 'heal', label: 'Heal 1' },
      { id: 'horror', label: '−1 Horror' },
      { id: 'move', label: 'Move 1 space' },
    ],
    { id: 'rabbitReward', data: { left } },
  );
}
answers.rabbitReward = (g, id, data: { left: number }) => {
  if (data.left > 1) rabbitPick(g, data.left - 1);
  const fx: Record<string, Effect> = { time: { k: 'time', n: 2 }, heal: { k: 'heal', n: 1 }, horror: { k: 'horror', n: -1 }, move: { k: 'move', n: 1 } };
  pushFx(g, [fx[id]], { kind: 'item', id: 'rabbitFoot' });
};

itemHandlers['item.map'] = {
  actions: () => [{ action: 'use', label: 'Read the map: turn up the item decks' }],
  use(g, it) {
    discardItem(g, it.uid);
    for (const d of L(g).itemDecks) {
      const deck = g.itemDecks[d];
      if (!deck?.length) continue;
      if (!deck[0].up) {
        deck[0].up = true;
        log(g, `Map: ${zoneName(g, d)} shows ${theItem(g, deck[0].id)}.`, 'info', { kind: 'card', deck: 'item', id: deck[0].id });
      } else if (deck.length > 1) {
        choose(
          g,
          `Map: remove ${theItem(g, deck[0].id)} from ${zoneName(g, d)} and turn up the next one?`,
          [
            { id: 'yes', label: 'Yes' },
            { id: 'no', label: 'No' },
          ],
          { id: 'mapRemove', data: { deck: d } },
        );
      }
    }
  },
};
answers.mapRemove = (g, id, data: { deck: string }) => {
  if (id !== 'yes') return;
  const deck = g.itemDecks[data.deck];
  const out = deck.shift();
  if (out) g.itemDiscard.push(out.id);
  if (deck[0]) {
    deck[0].up = true;
    log(g, `Map: ${theItem(g, out!.id)} is gone; ${zoneName(g, data.deck)} now shows ${theItem(g, deck[0].id)}.`, 'info', { kind: 'card', deck: 'item', id: deck[0].id });
  }
};

// ---- peeking at the Terror deck ---------------------------------------------------

export function peekTerror(g: GameState, who: string): void {
  const top = g.terrorDeck[0];
  if (!top) return;
  choose(
    g,
    `${who}: the top Terror card is "${terrorDef(g, top).name}"`,
    [
      { id: 'keep', label: 'Leave it on top' },
      { id: 'bottom', label: 'Put it on the bottom' },
    ],
    { id: 'peekTerror' },
    terrorDef(g, top).text,
  );
}
answers.peekTerror = (g, id) => {
  if (id === 'bottom') {
    g.terrorDeck.push(g.terrorDeck.shift()!);
    log(g, 'You slide the Terror card to the bottom of the deck.');
  }
};

itemHandlers['item.flashlight'] = {
  actions: (g, it) => (g.fg.time >= 1 && !used(g, it.uid) && g.terrorDeck.length ? [{ action: 'use', label: 'Look at the top Terror card (1 Time)' }] : []),
  use(g, it) {
    use(g, it.uid);
    addTime(g, -1);
    peekTerror(g, 'Flashlight');
  },
};

// ---- defence ------------------------------------------------------------------------

itemHandlers['item.trashLid'] = {
  react: {
    label: (_g, it) => `Trash Can Lid: block 1 damage (${plural(it.uses ?? 1, 'use')} left)`,
    can: (_g, _it, f) => f.damage > 0,
    use(g, it, f) {
      f.damage = Math.max(0, f.damage - 1);
      log(g, `The lid blocks 1 damage (${f.damage} left).`, 'good');
      spendUse(g, it.uid);
    },
  },
};

itemHandlers['item.pepperSpray'] = {
  react: {
    label: () => 'Pepper Spray: end the Killer Phase',
    can: (g) => g.phase === 'killer' && g.killer.zone === g.fg.zone,
    use(g, it) {
      discardItem(g, it.uid);
      push(g, { t: 'custom', id: 'endKillerPhase', step: 0 });
    },
  },
};

customs.endKillerPhase = (g) => gotoPhase(g, 'panic', 'Pepper Spray! The Killer Phase is over.');

// ---- moving people around ---------------------------------------------------------

itemHandlers['item.whistle'] = {
  actions: (g, it) => (g.fg.time >= 1 && !used(g, it.uid) ? [{ action: 'use', label: 'Blow the whistle (1 Time)' }] : []),
  use(g, it) {
    use(g, it.uid);
    addTime(g, -1);
    const adj = exits(g, g.fg.zone, 'fg');
    const come = g.victims.filter((v) => adj.includes(v.zone) && v.role !== 'werewolf');
    for (const v of come) moveVictim(g, v, g.fg.zone);
    log(g, `The whistle! ${plural(come.length, 'victim')} come${come.length === 1 ? 's' : ''} running. Every enemy heads your way.`);
    pushKillerAction(g, { target: 'finalGirl', moves: 1, attacks: 0 }, { kind: 'item', id: it.id });
  },
};

itemHandlers['item.motorboat'] = {
  gained(g) {
    const d = distances(g, g.fg.zone, 'fg');
    const near = L(g)
      .zones.filter((z) => z.water)
      .sort((a, b) => (d.get(a.id) ?? 99) - (d.get(b.id) ?? 99))[0];
    if (!near) return;
    g.tokens = g.tokens.filter((t) => t.id !== 'motorboat');
    g.tokens.push({ id: 'motorboat', zone: near.id });
    log(g, `The motorboat is moored at ${near.name}.`);
  },
  actions: (g) => (g.tokens.find((t) => t.id === 'motorboat')?.zone === g.fg.zone && g.fg.time >= 2 ? [{ action: 'ride', label: 'Ride the motorboat (2 Time)' }] : []),
  use(g, it) {
    addTime(g, -2);
    push(g, { t: 'move', remaining: 1, mode: 'boat', moved: 0, src: { kind: 'item', id: it.id } });
  },
};

// ---- ranged weapons on their own ---------------------------------------------------

const bowCost = (it: ItemInst) => (it.id === 'lauriesBow' ? 1 : 2);
itemHandlers['item.bow'] = {
  actions(g, it, d) {
    if (!d.range || (it.uses ?? 0) <= 0 || g.fg.time < bowCost(it)) return [];
    if (!attackTargets(g, weaponRange(g, it.uid), it.uid).length) return [];
    return [{ action: 'shoot', label: `Shoot the ${d.name} (${bowCost(it)} Time)` }];
  },
  use(g, it) {
    addTime(g, -bowCost(it));
    log(g, `You loose an arrow with ${theItem(g, it.id)}.`);
    spendUse(g, it.uid);
    pushFx(g, [{ k: 'damage', n: itemDef(g, it.id).damage ?? 1 }], { kind: 'item', id: it.id, weapon: it.uid });
  },
};

// ---- traps and lures ------------------------------------------------------------------

itemHandlers['item.bearTrap'] = {
  actions: (g) => (g.fg.time >= 2 && g.fg.zone !== 'lake' ? [{ action: 'set', label: 'Set the bear trap here (2 Time)' }] : []),
  use(g, it) {
    addTime(g, -2);
    g.tokens.push({ id: 'bearTrap', zone: g.fg.zone });
    log(g, `You set the bear trap in ${zoneName(g, g.fg.zone)}.`);
    discardItem(g, it.uid);
  },
};

itemHandlers['item.fireworks'] = {
  actions: (g) => (g.fg.time >= 2 ? [{ action: 'set', label: 'Set up the fireworks (2 Time)' }] : []),
  use(g, it) {
    const where = [g.fg.zone, ...exits(g, g.fg.zone, 'fg')].filter((z) => z !== 'lake' && !zoneDef(g, z).house && !zoneDef(g, z).hidden);
    choose(
      g,
      'Where do you set the fireworks?',
      where.map((z) => ({ id: z, label: zoneName(g, z), zone: z })),
      { id: 'placeFireworks', data: { uid: it.uid } },
    );
  },
};
answers.placeFireworks = (g, zone, data: { uid: string }) => {
  addTime(g, -2);
  g.tokens = g.tokens.filter((t) => t.id !== 'fireworks');
  g.tokens.push({ id: 'fireworks', zone });
  log(g, `The fireworks are set in ${zoneName(g, zone)}.`);
  discardItem(g, data.uid);
};

// ---- Camp Happy Trails events ---------------------------------------------------

eventSetups['ev.boyfriend'] = (g) => assignRole(g, 'boyfriend', 'fg');
eventSetups['ev.girlfriend'] = (g) => assignRole(g, 'girlfriend', 'fg');
eventSetups['ev.revenge'] = (g) => assignRole(g, 'cursed', 'killer');

eventSetups['ev.darkWaters'] = (g) => {
  g.tokens.push({ id: 'darkWaters', zone: 'lake' });
  for (const v of victimsIn(g, 'lake')) {
    log(g, 'The dark waters take a victim in the Lake.', 'killer');
    killVictimNoChain(g, v.id);
  }
};

eventSetups['ev.secretTunnel'] = (g) => {
  choose(
    g,
    'Secret Tunnel: which two places does it join?',
    [
      { id: 'shed,cabins', label: 'Utility Shed and Cabins' },
      { id: 'shed,dock', label: 'Utility Shed and Dock' },
      { id: 'cabins,dock', label: 'Cabins and Dock' },
    ],
    { id: 'secretTunnel' },
  );
};
answers.secretTunnel = (g, id) => {
  g.tunnel = id.split(',');
  for (const z of g.tunnel) g.tokens.push({ id: 'tunnel', zone: z });
  log(g, `The secret tunnel joins ${g.tunnel.map((z) => zoneName(g, z)).join(' and ')}.`);
};

function killVictimNoChain(g: GameState, id: string): void {
  const v = g.victims.find((x) => x.id === id);
  if (v) killVictim(g, v, false);
}

hooks.victimEnters.push((g, v, zone) => {
  if (zone === 'lake' && g.activeEvents.includes('darkWaters')) {
    log(g, 'The dark waters claim another victim.', 'killer');
    killVictim(g, v, false);
  }
});

hooks.victimKilled.push((g, v, zone) => {
  const inYours = zone === g.fg.zone;
  if (v.role === 'boyfriend' && inYours) {
    g.mods.timeAtNextAction = 12;
    log(g, 'Your Boyfriend died in your space: you\'ll start the next Action Phase with 12 Time.', 'good');
  }
  if (v.role === 'girlfriend' && inYours) {
    log(g, 'Your Girlfriend died in your space: +5 Horror.', 'bad');
    pushFx(g, [{ k: 'horror', n: 5 }], { kind: 'event' });
  }
  if (v.role === 'cursed') {
    log(g, 'The Cursed is dead: +2 Bloodlust.', 'killer');
    pushFx(g, [{ k: 'bloodlust', n: 2 }], { kind: 'event' });
  }
  if (v.role) releaseRole(g, v);
});

// Death Wish: in Upkeep the victim nearest the Killer steps toward him.
hooks.upkeep.push((g) => {
  if (!has(g, 'ev.deathWish')) return;
  const d = distances(g, g.killer.zone, 'enemy');
  const vs = g.victims.filter((v) => v.zone !== g.killer.zone && v.role !== 'werewolf');
  if (!vs.length) return;
  const best = Math.min(...vs.map((v) => d.get(v.zone) ?? Infinity));
  const zones = [...new Set(vs.filter((v) => (d.get(v.zone) ?? Infinity) === best).map((v) => v.zone))];
  const opts: { id: string; label: string }[] = [];
  for (const z of zones) for (const s of new Set(shortestPaths(g, z, g.killer.zone, 'victim').map((p) => p[0]))) if (s) opts.push({ id: `${z}>${s}`, label: `${zoneName(g, z)} → ${zoneName(g, s)}` });
  if (!opts.length) return;
  if (opts.length === 1) return deathWish(g, opts[0].id);
  choose(g, 'Death Wish: tie — which victim steps toward the Killer?', opts, { id: 'deathWish' });
});
function deathWish(g: GameState, id: string): void {
  const [from, to] = id.split('>');
  const v = victimsIn(g, from)[0];
  if (!v) return;
  log(g, `Death Wish: a victim wanders toward the Killer (${zoneName(g, from)} → ${zoneName(g, to)}).`, 'killer', { kind: 'victimMove', victim: v.id, path: [from, to] });
  moveVictim(g, v, to);
}
answers.deathWish = (g, id) => deathWish(g, id);

// ---- final girls -------------------------------------------------------------------

export function enemiesWithin(g: GameState, n: number): string[] {
  const d = distances(g, g.fg.zone, 'fg');
  const zones = new Set<string>();
  if (!g.film.birds && !K(g).invulnerable) zones.add(g.killer.zone);
  for (const m of g.minions) zones.add(m.zone);
  return [...zones].filter((z) => {
    const x = d.get(z) ?? Infinity;
    return x > 0 && x <= n;
  });
}

ultimates['ult.reiko'] = {
  label(g) {
    if (used(g, 'ult.reiko') || !enemiesWithin(g, 2).length) return null;
    return 'Reiko: lunge into an enemy\'s space within 2 (free)';
  },
  use(g) {
    use(g, 'ult.reiko');
    log(g, `Reiko's Ultimate: she charges at ${K(g).name}.`, 'good');
    push(g, { t: 'move', remaining: 1, mode: 'free', moved: 0, src: { kind: 'system' } });
  },
};


import { setFreeTargets } from '../engine/actionPhase';
setFreeTargets((g) => enemiesWithin(g, 2));
