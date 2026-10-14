// Killer actions (target ▸ move ▸ attack), attacks on the Final Girl and her
// reactions, and the Final Girl's own attacks.

import { card } from '../content/core';
import type { KillerActionDef, ZoneId } from '../types';
import { distances, exits, killVictim, minionsIn, shortestPaths, targetable, victimName, victimsIn } from './board';
import { discardItem, spendUse } from './effects';
import {
  answers,
  cap,
  choose,
  customs,
  FG,
  frames,
  gotoPhase,
  has,
  hooks,
  itemDef,
  K,
  log,
  push,
  pushFx,
  RuleError,
  topOf,
  usable,
  usableItems,
  yesNo,
  zoneDef,
  zoneName,
} from './kernel';
import { itemHandlers, killerActionOverrides, minionDestroyed } from './registry';
import type { Frame, GameState, KillerTarget, Minion, Src } from './state';
import { bloodlustSpace, damageKiller, hurtFG, killerAttack, killerVulnerable, NEXT_PHASE, wrathOp } from './stats';
import { startRoll } from './dice';

type KF = Extract<Frame, { t: 'killer' }>;

// ---- actors ---------------------------------------------------------------------

type Actor = { kind: 'killer' } | { kind: 'minion'; id: string } | { kind: 'victim'; id: string };

export function parseActor(a: string): Actor {
  if (a.startsWith('m:')) return { kind: 'minion', id: a.slice(2) };
  if (a.startsWith('v:')) return { kind: 'victim', id: a.slice(2) };
  return { kind: 'killer' };
}

function actorZone(g: GameState, a: string): ZoneId | undefined {
  const p = parseActor(a);
  if (p.kind === 'killer') return g.killer.zone;
  if (p.kind === 'minion') return g.minions.find((m) => m.id === p.id)?.zone;
  return g.victims.find((v) => v.id === p.id)?.zone;
}

function setActorZone(g: GameState, a: string, z: ZoneId): void {
  const p = parseActor(a);
  if (p.kind === 'killer') g.killer.zone = z;
  else if (p.kind === 'minion') {
    const m = g.minions.find((x) => x.id === p.id);
    if (m) m.zone = z;
  } else {
    const v = g.victims.find((x) => x.id === p.id);
    if (v) v.zone = z;
  }
}

export function enemyName(g: GameState, a: string): string {
  const p = parseActor(a);
  if (p.kind === 'killer') return K(g).name;
  if (p.kind === 'minion') return K(g).bodiless && !p.id.startsWith('tmp-giant') && !p.id.startsWith('tmp-clown') ? 'The birds' : `The ${minionName(g, p.id)}`;
  return 'A puppet victim';
}

export function minionName(g: GameState, id: string, many = false): string {
  if (id.startsWith('tmp-giant')) return 'Giant';
  if (id.startsWith('tmp-clown')) return 'Clown Doll';
  return many ? K(g).minion?.plural ?? 'minions' : K(g).minion?.name ?? 'minion';
}

/** Creech Manor's padlock stops one attack on you next to it. */
export const attackStoppers: ((g: GameState, f: Extract<Frame, { t: 'attackFG' }>) => boolean)[] = [];

/** Can the Killer attack the Final Girl right now? (Dr. Fright can't reach you while you're awake.) */
export function killerCanHitFG(g: GameState): boolean {
  const m = g.film.maple;
  if (m && g.config.killer === 'drFright' && !m.asleep && !m.blurred && !has(g, 'dp.frightsadilla')) return false;
  return true;
}

/** Enemy attack value. */
export function attackValue(g: GameState, a: string): number {
  const p = parseActor(a);
  if (p.kind === 'killer') return killerAttack(g);
  return (K(g).minion?.attack ?? 1) + (has(g, 'dp.weaponGraft') ? 1 : 0);
}

const minionsByDistanceToFG = (g: GameState): Minion[] => {
  const d = distances(g, g.fg.zone, 'enemy');
  return [...g.minions].sort((a, b) => (d.get(a.zone) ?? 99) - (d.get(b.zone) ?? 99) || a.id.localeCompare(b.id));
};

/** Queue a killer action: minions act first, then the Killer. */
export function pushKillerAction(g: GameState, a: KillerActionDef, src: Src): void {
  if (killerActionOverrides.some((fn) => fn(g, a, src))) return;
  const who = a.actor ?? 'all';
  const fs: Frame[] = [];
  const mk = (actor: string): Frame => ({ t: 'killer', a, actor, step: 'target', killed: 0, src });
  if (who !== 'killer') {
    for (const m of minionsByDistanceToFG(g)) fs.push(mk(`m:${m.id}`));
    if (has(g, 'fin.friends') && g.phase === 'killer') for (const v of targetable(g)) fs.push(mk(`v:${v.id}`));
  }
  if (who !== 'minions' && !g.film.birds) fs.push(mk('killer'));
  push(g, ...fs);
}

// ---- targeting ------------------------------------------------------------------

function describeTarget(g: GameState, t: KillerTarget): string {
  if (t.kind === 'none') return 'nobody';
  if (t.who === 'finalGirl') return FG(g).name;
  if (t.who === 'token') return `the fireworks (${zoneName(g, t.zone)})`;
  return `${t.who === 'victim' ? 'the victims' : 'whoever is'} in ${zoneName(g, t.zone)}`;
}

function zoneLabel(g: GameState, z: ZoneId): string {
  const n = victimsIn(g, z).length;
  const parts = [zoneName(g, z)];
  if (n) parts.push(`${n} victim${n === 1 ? '' : 's'}`);
  if (g.fg.zone === z) parts.push(FG(g).name);
  return parts.join(' · ');
}

/** Work out the target; returns 'tie' if the player has to break a tie. */
function findTarget(g: GameState, f: KF): KillerTarget | 'tie' {
  const actor = parseActor(f.actor);
  const from = actorZone(g, f.actor)!;
  const d = distances(g, from, 'enemy');
  const dd = (z: ZoneId) => d.get(z) ?? Infinity;

  // Things that pull every target choice their way.
  const lures: { t: KillerTarget; label: string }[] = [];
  let fw = g.tokens.find((t) => t.id === 'fireworks');
  if (fw && fw.zone === from) {
    g.tokens = g.tokens.filter((t) => t !== fw);
    log(g, 'The fireworks fizzle out.');
    fw = undefined;
  }
  if (fw) lures.push({ t: { kind: 'zone', zone: fw.zone, who: 'token' }, label: `The fireworks (${zoneName(g, fw.zone)})` });
  const cursed = g.victims.find((v) => v.role === 'cursed');
  if (cursed && has(g, 'ev.revenge')) lures.push({ t: { kind: 'zone', zone: cursed.zone, who: 'victim' }, label: `The Cursed (${zoneName(g, cursed.zone)})` });
  const sup = g.victims.find((v) => v.role === 'superTourist');
  if (sup && has(g, 'ev.superTourist')) lures.push({ t: { kind: 'zone', zone: sup.zone, who: 'victim' }, label: `The Super Tourist (${zoneName(g, sup.zone)})` });
  if (lures.length === 1) return lures[0].t;
  if (lures.length > 1) {
    choose(
      g,
      'Tie: what draws the Killer?',
      lures.map((l, i) => ({ id: String(i), label: l.label, zone: (l.t as any).zone })),
      { id: 'killerTarget', data: { lures: lures.map((l) => l.t) } },
    );
    return 'tie';
  }

  let target = f.a.target;
  if (target === 'finalGirl' && has(g, 'ev.mlBoyfriend')) {
    const bf = g.victims.find((v) => v.role === 'mlBoyfriend');
    if (bf) return { kind: 'zone', zone: bf.zone, who: 'victim' };
  }
  const pool = targetable(g).filter((v) => !(actor.kind === 'victim' && v.id === actor.id));
  if (actor.kind === 'killer' && !killerCanHitFG(g) && (target === 'nearest' || target === 'victimElseFG')) target = 'victim';
  if (target === 'victimElseFG') target = pool.length ? 'victim' : 'finalGirl';
  if (target === 'finalGirl') return { kind: 'zone', zone: g.fg.zone, who: 'finalGirl' };

  const counts = new Map<ZoneId, number>();
  for (const v of pool) counts.set(v.zone, (counts.get(v.zone) ?? 0) + 1);
  if (target === 'nearest' && !counts.has(g.fg.zone)) counts.set(g.fg.zone, 0);
  if (!counts.size) return { kind: 'none' };
  const zones = [...counts.keys()].filter((z) => dd(z) !== Infinity);
  if (!zones.length) return { kind: 'none' };
  const best = target === 'farthestVictim' ? Math.max(...zones.map(dd)) : Math.min(...zones.map(dd));
  let tied = zones.filter((z) => dd(z) === best);
  const most = Math.max(...tied.map((z) => counts.get(z)!));
  tied = tied.filter((z) => counts.get(z) === most);
  const who = target === 'nearest' ? 'group' : 'victim';
  if (tied.length === 1) return { kind: 'zone', zone: tied[0], who };
  choose(
    g,
    `Tie: where does ${enemyName(g, f.actor).toLowerCase()} go?`,
    tied.map((z) => ({ id: z, label: zoneLabel(g, z), zone: z })),
    { id: 'killerTargetZone', data: { who } },
  );
  return 'tie';
}

function currentKF(g: GameState): KF {
  const f = topOf(g, 'killer');
  if (!f) throw new Error('No killer action in progress');
  return f;
}

const afterTarget = (f: KF): KF['step'] => (f.a.attackFirst ? 'spray' : 'path');

answers.killerTarget = (g, id, data: { lures: KillerTarget[] }) => {
  const f = currentKF(g);
  f.target = data.lures[Number(id)];
  f.step = afterTarget(f);
};
answers.killerTargetZone = (g, zone, data: { who: 'victim' | 'group' }) => {
  const f = currentKF(g);
  f.target = { kind: 'zone', zone, who: data.who };
  f.step = afterTarget(f);
};
answers.killerPath = (g, id, data: { paths: ZoneId[][] }) => {
  const f = currentKF(g);
  f.path = data.paths[Number(id)];
  f.step = 'move';
};

// ---- movement ---------------------------------------------------------------------

function stepsFor(g: GameState, f: KF): number {
  const actor = parseActor(f.actor);
  let per = bloodlustSpace(g).move;
  if (actor.kind === 'killer' && has(g, 'mdp.demonicSpeed')) per += 1;
  let s = f.a.moves * per;
  if (actor.kind === 'minion') {
    if (has(g, 'fin.unbound')) s += 1;
    if (has(g, 'fin.remember')) s = Math.max(0, s - 1);
  }
  return s;
}

/** Minions must end their move within 2 spaces of the Killer (unless unbound). */
function leash(g: GameState, from: ZoneId, to: ZoneId, steps: number): ZoneId[][] {
  const free = has(g, 'fin.unbound');
  const dk = distances(g, g.killer.zone, 'enemy');
  const near = (z: ZoneId) => (dk.get(z) ?? Infinity) <= 2;
  if (!free && !near(from)) {
    // too far from its master: head back toward him first
    return shortestPaths(g, from, g.killer.zone).map((p) => {
      const out: ZoneId[] = [];
      for (const z of p.slice(0, steps)) {
        out.push(z);
        if (near(z)) break;
      }
      return out;
    });
  }
  return shortestPaths(g, from, to).map((p) => {
    const cut = p.slice(0, steps);
    for (let i = cut.length; i >= 0; i--) {
      const end = i === 0 ? from : cut[i - 1];
      if (free || near(end)) return cut.slice(0, i);
    }
    return [];
  });
}

/** Ask before an enemy moves (Maple Lane's crucifix). Filled in by films. */
export const pathChecks: ((g: GameState, f: KF, path: ZoneId[]) => boolean)[] = [];

function moveAlong(g: GameState, f: KF): void {
  const path = f.path ?? [];
  const actor = parseActor(f.actor);
  const name = enemyName(g, f.actor);
  const start = actorZone(g, f.actor)!;
  const went: ZoneId[] = [start];
  const anim = () => ({ kind: 'killerMove' as const, path: [...went], ...(actor.kind === 'minion' ? { minion: actor.id } : {}) });
  for (const z of path) {
    if (z === g.fg.zone && has(g, 'ev.fiance')) {
      const fi = g.victims.find((v) => v.role === 'fiance' && v.zone === z);
      if (fi) {
        log(g, `${name} tries to get to you, but your Fiancé steps in and dies in your place.`, 'killer');
        killVictim(g, fi, true);
        break;
      }
    }
    setActorZone(g, f.actor, z);
    went.push(z);
    const boob = g.tokens.find((t) => t.zone === z && t.id === 'boobyTrap');
    if (boob) {
      g.tokens = g.tokens.filter((t) => t !== boob);
      log(g, `${name} walks into your booby trap: 2 damage!`, 'good');
      if (actor.kind === 'killer') damageKiller(g, 2);
      else damageMinions(g, z, 2);
    }
    if (g.tokens.some((t) => t.zone === z && t.id === 'mlFire')) {
      log(g, `${name} walks into the burning house: 1 damage.`, 'good');
      if (actor.kind === 'killer') damageKiller(g, 1);
      else damageMinions(g, z, 1);
    }
    if (g.outcome) return;
    if (actor.kind !== 'killer') continue;
    const trap = g.tokens.find((t) => t.zone === z && t.id === 'bearTrap');
    if (trap) {
      log(g, `${name} moves: ${went.map((x) => zoneName(g, x)).join(' → ')}.`, 'killer', anim());
      g.tokens = g.tokens.filter((t) => t !== trap);
      log(g, `${name} steps in the bear trap!`, 'good');
      damageKiller(g, 2);
      if (!g.outcome && g.phase === 'killer') gotoPhase(g, 'panic', 'The Killer Phase ends at once.');
      f.step = 'done';
      return;
    }
    const fw = g.tokens.find((t) => t.zone === z && t.id === 'fireworks');
    if (fw) {
      g.tokens = g.tokens.filter((t) => t !== fw);
      log(g, 'The fireworks fizzle out.');
    }
  }
  if (went.length > 1) {
    log(g, `${name} moves: ${went.map((x) => zoneName(g, x)).join(' → ')}.`, 'killer', anim());
    if (actor.kind === 'killer') for (const fn of hooks.killerMoved) fn(g);
  }
  if (f.a.killAlong) killAlong(g, f, [...new Set(went)]);
}

function killAlong(g: GameState, f: KF, zones: ZoneId[]): void {
  for (const z of zones) {
    const v = victimsIn(g, z)
      .filter((x) => x.role !== 'werewolf')
      .sort((a, b) => +!!a.role - +!!b.role)[0];
    if (v) killOne(g, f, v.id);
  }
}

function killOne(g: GameState, f: KF, vid: string): void {
  const v = g.victims.find((x) => x.id === vid);
  if (!v) return;
  f.killed++;
  killVictim(g, v, true);
  if (f.a.perKill) pushFx(g, f.a.perKill, f.src);
}

// ---- the killer frame ---------------------------------------------------------------

frames.killer = {
  step(g, f: KF) {
    const actor = parseActor(f.actor);
    const here = actorZone(g, f.actor);
    if (!here) return 'done';
    if (actor.kind === 'minion' && !g.minions.some((m) => m.id === actor.id)) return 'done';
    switch (f.step) {
      case 'target': {
        if (f.a.moves === 0) {
          const fgOnly = f.a.target === 'finalGirl' || (f.a.target === 'victimElseFG' && !targetable(g).length);
          f.target = { kind: 'zone', zone: here, who: fgOnly ? 'finalGirl' : 'group' };
          f.step = 'spray';
          return 'continue';
        }
        const t = findTarget(g, f);
        if (t === 'tie') return 'continue';
        f.target = t;
        f.step = afterTarget(f);
        if (t.kind === 'zone') log(g, `${enemyName(g, f.actor)} goes after ${describeTarget(g, t)}.`, 'killer');
        if (t.kind === 'zone' && t.who === 'finalGirl' && f.a.target === 'finalGirl' && usableItems(g, 'item.makeup').length && targetable(g).length) {
          yesNo(g, 'An enemy is coming for you. Use the Makeup Kit to pass as a victim?', 'Yes: it goes for the closest victim', { id: 'makeupKit' });
        }
        return 'continue';
      }
      case 'path': {
        const t = f.target!;
        if (f.a.moves === 0 || t.kind === 'none' || t.zone === here) {
          if (f.a.killAlong) killAlong(g, f, [here]);
          f.moved = true;
          f.step = f.a.attackFirst ? 'after' : 'spray';
          return 'continue';
        }
        const steps = stepsFor(g, f);
        const raw = actor.kind === 'minion' ? leash(g, here, t.zone, steps) : shortestPaths(g, here, t.zone).map((p) => p.slice(0, steps));
        const traps = new Set(g.tokens.filter((x) => x.id === 'bearTrap' || x.id === 'fireworks' || x.id === 'boobyTrap').map((x) => x.zone));
        const key = (p: ZoneId[]) => `${p[p.length - 1] ?? ''}|${p.filter((z) => traps.has(z)).join(',')}`;
        const uniq = new Map<string, ZoneId[]>();
        for (const p of raw) if (!uniq.has(key(p))) uniq.set(key(p), p);
        const paths = [...uniq.values()];
        if (paths.length > 1) {
          choose(
            g,
            `Tie: which way does ${enemyName(g, f.actor).toLowerCase()} go?`,
            paths.map((p, i) => ({ id: String(i), label: p.length ? p.map((z) => zoneName(g, z)).join(' → ') : 'Stays put', zone: p[p.length - 1] })),
            { id: 'killerPath', data: { paths } },
          );
          return 'continue';
        }
        f.path = paths[0] ?? [];
        f.step = 'move';
        return 'continue';
      }
      case 'move': {
        if (!f.stopAsked) {
          f.stopAsked = true;
          for (const chk of pathChecks) if (chk(g, f, f.path ?? [])) return 'continue';
        }
        f.moved = true;
        moveAlong(g, f);
        if ((f.step as string) === 'done') return 'done';
        f.step = f.a.attackFirst ? 'after' : 'spray';
        return 'continue';
      }
      case 'spray': {
        f.step = 'attack';
        f.attacksLeft = f.a.attacks;
        const spray = usableItems(g, 'item.pepperSpray')[0];
        if (actor.kind === 'killer' && spray && f.a.attacks > 0 && g.killer.zone === g.fg.zone && g.phase === 'killer') {
          yesNo(g, `${K(g).name} is in your space. Use the Pepper Spray?`, 'Yes: end the Killer Phase', { id: 'pepperSpray', data: { uid: spray.uid } });
        }
        return 'continue';
      }
      case 'attack': {
        if (f.attacksLeft) {
          f.attacksLeft--;
          attackOnce(g, f);
          return 'continue';
        }
        if (f.a.attackFirst && !f.moved) {
          f.step = 'path';
          return 'continue';
        }
        f.step = 'after';
        return 'continue';
      }
      case 'after': {
        f.step = 'done';
        if (f.a.attackFirst && !f.moved) {
          f.step = 'path';
          return 'continue';
        }
        if (actor.kind === 'killer' && f.attackedFG && has(g, 'dp.darkObsession') && g.killer.zone === g.fg.zone) {
          log(g, 'Dark Obsession: Hans attacks once more.', 'killer');
          push(g, { t: 'attackFG', damage: attackValue(g, f.actor), by: f.actor });
        }
        return 'continue';
      }
      case 'done':
        if (actor.kind === 'minion') customs['gp.afterMinion']?.(g, undefined, f.src);
        return 'done';
    }
  },
};

answers.pepperSpray = (g, id, data: { uid: string }) => {
  if (id !== 'yes') return;
  discardItem(g, data.uid);
  gotoPhase(g, NEXT_PHASE.killer, 'Pepper Spray! The Killer Phase is over.');
};

answers.makeupKit = (g, id) => {
  if (id !== 'yes') return;
  const f = currentKF(g);
  const it = usableItems(g, 'item.makeup')[0];
  const here = actorZone(g, f.actor)!;
  const d = distances(g, here, 'enemy');
  const pool = targetable(g);
  if (!pool.length || !it) return;
  const best = Math.min(...pool.map((v) => d.get(v.zone) ?? Infinity));
  const zones = [...new Set(pool.filter((v) => (d.get(v.zone) ?? Infinity) === best).map((v) => v.zone))];
  log(g, 'You pass yourself off as a victim with the Makeup Kit.', 'good');
  if (zones.length > 1) {
    choose(g, 'Tie: which victims does it go for?', zones.map((z) => ({ id: z, label: zoneLabel(g, z), zone: z })), { id: 'killerTargetZone', data: { who: 'victim' } });
    return;
  }
  f.target = { kind: 'zone', zone: zones[0], who: 'victim' };
};

/** One knife icon. */
function attackOnce(g: GameState, f: KF): void {
  const actor = parseActor(f.actor);
  const z = actorZone(g, f.actor)!;
  const vs = victimsIn(g, z).filter((v) => v.role !== 'werewolf' && !(actor.kind === 'victim' && v.id === actor.id));
  const fgHere = g.fg.zone === z;
  const canHitFG = actor.kind !== 'killer' || killerCanHitFG(g);
  if (actor.kind === 'killer' && has(g, 'dp.hammerMassacre')) {
    for (const v of vs) killOne(g, f, v.id);
    if (fgHere && canHitFG) {
      f.attackedFG = true;
      push(g, { t: 'attackFG', damage: attackValue(g, f.actor), by: f.actor });
    }
    return;
  }
  const aimedAtFG = f.target?.kind === 'zone' && f.target.who === 'finalGirl';
  if (fgHere && canHitFG && (aimedAtFG || !vs.length)) {
    f.attackedFG = true;
    push(g, { t: 'attackFG', damage: attackValue(g, f.actor), by: f.actor });
    return;
  }
  if (actor.kind === 'victim') return;
  if (!vs.length) {
    if (fgHere && !canHitFG) log(g, `${enemyName(g, f.actor)} lunges at you, but can't reach you while you're awake.`);
    else log(g, `${enemyName(g, f.actor)} attacks, but nobody is there.`);
    return;
  }
  const kinds = [...new Set(vs.map((v) => v.role ?? 'normal'))];
  if (kinds.length > 1) {
    choose(
      g,
      'Which victim is attacked?',
      kinds.map((k) => ({ id: k, label: k === 'normal' ? 'An ordinary victim' : cap(victimName({ role: k })) })),
      { id: 'attackVictim' },
    );
    return;
  }
  killOne(g, f, vs[0].id);
}

answers.attackVictim = (g, kind) => {
  const f = currentKF(g);
  const z = actorZone(g, f.actor)!;
  const v = victimsIn(g, z).find((x) => (x.role ?? 'normal') === kind);
  if (v) killOne(g, f, v.id);
};

// ---- attacks on the Final Girl -------------------------------------------------------

type AF = Extract<Frame, { t: 'attackFG' }>;

function reactions(g: GameState, f: AF) {
  const cards = [...new Set(g.fg.hand.filter((c) => card(c).timing === 'reaction'))];
  const items = [] as { uid: string; action: string; label: string }[];
  for (const it of g.fg.items) {
    const d = itemDef(g, it.id);
    const h = d.ability ? itemHandlers[d.ability] : undefined;
    if (h?.react && usable(g, it) && h.react.can(g, it, f)) items.push({ uid: it.uid, action: 'react', label: h.react.label(g, it) });
  }
  return { cards, items };
}

frames.attackFG = {
  step(g, f: AF) {
    const by = enemyName(g, f.by);
    if (parseActor(f.by).kind === 'killer' && g.film.maple) g.film.maple.attackedFG = true;
    if (attackStoppers.some((fn) => fn(g, f))) return 'done';
    if (f.damage <= 0) {
      log(g, `${by}'s attack doesn't hurt you.`, 'good');
      return 'done';
    }
    const r = reactions(g, f);
    if (!r.cards.length && !r.items.length) {
      log(g, `${by} attacks you: ${f.damage} damage.`, 'killer');
      takeHit(g, f);
      return 'done';
    }
    g.prompt = { type: 'react', damage: f.damage, by, cards: r.cards, items: r.items };
    return 'wait';
  },
  input(g, f: AF, inp) {
    if (inp.t === 'react') {
      const i = g.fg.hand.indexOf(inp.card);
      if (i < 0 || card(inp.card).timing !== 'reaction') throw new RuleError('You don\'t have that reaction card');
      g.fg.hand.splice(i, 1);
      g.actionDiscard.push(inp.card);
      log(g, `You react with ${card(inp.card).name}.`);
      push(g, { t: 'reaction', card: inp.card, rolled: false });
      return 'continue';
    }
    if (inp.t === 'reactItem') {
      const it = g.fg.items.find((x) => x.uid === inp.uid);
      if (!it) throw new RuleError('No such item');
      const h = itemHandlers[itemDef(g, it.id).ability ?? ''];
      if (!h?.react || !h.react.can(g, it, f)) throw new RuleError('You can\'t use that now');
      h.react.use(g, it, f);
      return 'continue';
    }
    if (inp.t === 'takeHit') {
      log(g, `${enemyName(g, f.by)} attacks you: ${f.damage} damage.`, 'killer');
      takeHit(g, f);
      return 'done';
    }
    throw new RuleError('React or take the hit');
  },
};

function takeHit(g: GameState, f: AF): void {
  if (f.victim) {
    const v = g.victims.find((x) => x.id === f.victim);
    if (v && f.damage > 0) killVictim(g, v, true);
    return;
  }
  const before = g.fg.health.hp;
  hurtFG(g, f.damage);
  if (parseActor(f.by).kind === 'killer' && has(g, 'dp.trident') && g.fg.health.hp < before && !g.outcome) {
    log(g, 'Pitchfork Assault: +1 Horror.', 'bad');
    pushFx(g, [{ k: 'horror', n: 1 }], { kind: 'killer' });
  }
}

frames.reaction = {
  step(g, f: Extract<Frame, { t: 'reaction' }>) {
    if (!f.rolled) {
      f.rolled = true;
      startRoll(g, { kind: 'reaction', card: f.card });
      return 'continue';
    }
    const c = card(f.card);
    const s = f.successes ?? 0;
    log(g, `${c.name}: ${s >= 2 ? 'double success' : s === 1 ? 'success' : 'failure'}.`, s ? 'good' : 'bad');
    const atk = topOf(g, 'attackFG');
    const by = atk?.by;
    const target = by ? (parseActor(by).kind === 'minion' ? `mz:${actorZone(g, by)}` : 'killer') : 'killer';
    const weapons = meleeWeaponsFor(g, f.card);
    const src: Src = { kind: 'action', id: f.card, target, ...(weapons[0] ? { weapon: weapons[0] } : {}) };
    const line = s >= 2 ? c.results!.double : s === 1 ? c.results!.single : c.results!.fail;
    pushFx(g, line[0] ?? [], src);
    if (f.card === 'guard' && s >= 1 && has(g, 'item.adelaideBat') && by) {
      log(g, "Adelaide's Bat and Shield: you hit back.", 'good');
      pushFx(g, [{ k: 'damage', n: 1 }], { kind: 'item', id: 'adelaidesBat', target, damageBonus: true });
    }
    return 'done';
  },
};

function meleeWeaponsFor(g: GameState, cardId: string): string[] {
  return g.fg.items
    .filter((it) => {
      const d = itemDef(g, it.id);
      if (!usable(g, it) || d.range === undefined || d.damage === undefined || d.modifies === 'none') return false;
      if (Array.isArray(d.modifies) && !d.modifies.includes(cardId)) return false;
      return d.range[0] === 0;
    })
    .sort((a, b) => (itemDef(g, b.id).damage ?? 0) - (itemDef(g, a.id).damage ?? 0))
    .map((it) => it.uid);
}

// ---- the Final Girl's attacks -------------------------------------------------------

export function weaponRange(g: GameState, weaponUid?: string): [number, number] {
  if (!weaponUid) return [0, 0];
  const it = g.fg.items.find((i) => i.uid === weaponUid);
  if (!it) return [0, 0];
  const d = itemDef(g, it.id);
  const r = d.range ?? [0, 0];
  const bonus = d.ability === 'item.oldRifle' && zoneDef(g, g.fg.zone).sacred ? 2 : 0;
  return [r[0], r[1] + bonus];
}

/** Strike Creech's victims / Geppetto's puppet friends instead of an enemy. */
export const victimsAreTargets = (g: GameState): boolean => has(g, 'fin.friends') || g.film.creech?.strike === 'victims';

export interface AttackOption {
  id: string;
  label: string;
  zone: ZoneId;
}

/** Weapons that only reach some spaces (Maple Lane's rifle and bow: street spaces). */
export const targetZoneFilters: ((g: GameState, weaponUid: string, zone: ZoneId) => boolean)[] = [];

/** What the Final Girl can hit at this range. ids: killer, mz:<zone>, vz:<zone>. */
export function attackTargets(g: GameState, range: [number, number], weaponUid?: string): AttackOption[] {
  const d = distances(g, g.fg.zone, 'fg');
  const inRange = (z: ZoneId) => {
    const x = d.get(z);
    if (weaponUid && !targetZoneFilters.every((fn) => fn(g, weaponUid, z))) return false;
    return x !== undefined && x >= range[0] && x <= range[1];
  };
  const out: AttackOption[] = [];
  if (!g.film.birds && killerVulnerable(g) && (inRange(g.killer.zone) || g.film.maple?.offBoard)) {
    out.push({ id: 'killer', label: `${K(g).name} (${zoneName(g, g.killer.zone)})`, zone: g.killer.zone });
  }
  for (const z of new Set(g.minions.map((m) => m.zone))) {
    if (!inRange(z)) continue;
    const ms = minionsIn(g, z);
    out.push({ id: `mz:${z}`, label: `${ms.length > 1 ? `${ms.length} ${minionName(g, ms[0].id, true)}` : `The ${minionName(g, ms[0].id)}`} in ${zoneName(g, z)}`, zone: z });
  }
  if (victimsAreTargets(g)) {
    for (const z of new Set(targetable(g).map((v) => v.zone))) {
      if (inRange(z)) out.push({ id: `vz:${z}`, label: `A victim in ${zoneName(g, z)} (raises Bloodlust)`, zone: z });
    }
  }
  return out;
}

/** The Final Girl deals damage. Weapons add theirs once per action card, if at least 1 damage was dealt. */
export function fgDealDamage(g: GameState, n: number, src: Src): void {
  if (n <= 0 || g.outcome) return;
  let total = n;
  const weapon = src.weapon ? g.fg.items.find((i) => i.uid === src.weapon) : undefined;
  const firstHit = (src.kind === 'action' || src.kind === 'reaction') && !src.damageBonus;
  if (firstHit) {
    src.damageBonus = true;
    if (weapon) {
      const d = itemDef(g, weapon.id);
      total += d.damage ?? 0;
      if (d.damage) log(g, `${d.name}: +${d.damage} damage.`, 'good');
    }
  }
  const range = weaponRange(g, weapon?.uid);
  let options = attackTargets(g, range, weapon?.uid);
  if (src.target) {
    const forced = options.filter((o) => o.id === src.target);
    if (forced.length) options = forced;
  }
  const ctx: HitCtx = { total, weapon: weapon?.uid, firstHit };
  if (!options.length) {
    if (src.target === 'killer' || !src.target) applyHit(g, 'killer', ctx);
    return;
  }
  const split = weapon && itemDef(g, weapon.id).ability === 'item.knifeBelt' && total > 1 && options.length > 1;
  if (options.length === 1 && !split) return applyHit(g, options[0].id, ctx);
  choose(
    g,
    split ? `Knives: split the damage (${total} left). Where does the next one go?` : `Who do you hit? (${total} damage)`,
    options.map((o) => ({ id: o.id, label: o.label, zone: o.zone })),
    { id: 'fgHit', data: { ctx, split } },
  );
}

interface HitCtx {
  total: number;
  weapon?: string;
  firstHit: boolean;
}

answers.fgHit = (g, id, data: { ctx: HitCtx; split: boolean }) => {
  if (data.split) {
    applyHit(g, id, { ...data.ctx, total: 1 }, true);
    const left = data.ctx.total - 1;
    if (left > 0 && !g.outcome) {
      const options = attackTargets(g, weaponRange(g, data.ctx.weapon), data.ctx.weapon);
      if (options.length > 1)
        choose(g, `Knives: split the damage (${left} left). Where does the next one go?`, options.map((o) => ({ id: o.id, label: o.label, zone: o.zone })), {
          id: 'fgHit',
          data: { ctx: { ...data.ctx, total: left, firstHit: false }, split: true },
        });
      else if (options.length === 1) applyHit(g, options[0].id, { ...data.ctx, total: left });
    } else afterWeapon(g, data.ctx, id);
    return;
  }
  applyHit(g, id, data.ctx);
};

/** Laurie's ultimate: +1 when you hurt an enemy in your own space. */
function laurieBonus(g: GameState, target: string): number {
  if (!has(g, 'ult.laurie')) return 0;
  const zone = target === 'killer' ? g.killer.zone : target.startsWith('mz:') ? target.slice(3) : null;
  if (zone !== g.fg.zone) return 0;
  log(g, "Laurie's Ultimate: +1 damage.", 'good');
  return 1;
}

function applyHit(g: GameState, target: string, ctx: HitCtx, partial = false): void {
  if (g.outcome) return;
  const total = ctx.total + (ctx.firstHit ? laurieBonus(g, target) : 0);
  const wd = ctx.weapon ? g.fg.items.find((i) => i.uid === ctx.weapon) : undefined;
  const ability = wd ? itemDef(g, wd.id).ability : undefined;
  if (target === 'killer') {
    damageKiller(g, total);
    if (!g.outcome) afterKillerHit(g, total, ability);
  } else if (target.startsWith('mz:')) {
    const z = target.slice(3);
    log(g, `${total} damage to the ${minionName(g, minionsIn(g, z)[0]?.id ?? '', true)} in ${zoneName(g, z)}!`, 'good');
    damageMinions(g, z, total);
    if (ability === 'item.whip') whipMinion(g, z);
  } else if (target.startsWith('vz:')) {
    const z = target.slice(3);
    const strike = g.film.creech?.strike === 'victims';
    const kills = strike ? total : 1;
    for (let i = 0; i < kills; i++) {
      const v = victimsIn(g, z)
        .filter((x) => x.role !== 'werewolf')
        .sort((a, b) => +!!a.role - +!!b.role)[0];
      if (!v) break;
      log(g, `${FG(g).name} strikes ${victimName(v)}.`, 'bad');
      killVictim(g, v, false, strike ? { noBloodlust: true } : {});
    }
  }
  if (!partial) afterWeapon(g, ctx, target);
}

function afterKillerHit(g: GameState, total: number, ability?: string): void {
  if (has(g, 'item.ceremonialDagger')) {
    log(g, 'Ceremonial Dagger: lower a Wrath by 1.', 'good');
    wrathOp(g, 'choose', 'reduce', 1);
  }
  if (ability === 'item.warClub') {
    log(g, `War Club: lower a Wrath by ${total}.`, 'good');
    wrathOp(g, 'choose', 'reduce', total);
  }
  if (ability === 'item.whip') {
    choose(
      g,
      `Whip: drag ${K(g).name} 1 space?`,
      [
        ...exitsOf(g, g.killer.zone).map((z) => ({ id: z, label: `Into ${zoneName(g, z)}`, zone: z })),
        { id: 'no', label: 'No' },
      ],
      { id: 'whipKiller' },
    );
  }
  if (ability === 'item.metalBat' && g.killer.minors.length) {
    choose(
      g,
      'Bat: smash a Minor Dark Power?',
      [...g.killer.minors.map((m) => ({ id: m.id, label: `Discard ${terrorName(g, m.id)}` })), { id: 'no', label: 'No' }],
      { id: 'batMinor' },
    );
  }
  if (has(g, 'ult.barbara') && g.fg.zone === g.killer.zone) {
    const n = victimsIn(g, g.fg.zone).length;
    if (n)
      choose(
        g,
        "Barbara's Ultimate: deal extra damage? Each extra point kills a victim in your space.",
        Array.from({ length: n + 1 }, (_, i) => ({ id: String(i), label: i === 0 ? 'No extra damage' : `+${i} damage (${i} victim${i === 1 ? '' : 's'} die)` })),
        { id: 'barbaraExtra' },
      );
  }
}

function terrorName(g: GameState, id: string): string {
  return (K(g).terror.find((t) => t.id === id) ?? { name: id }).name;
}

const exitsOf = (g: GameState, z: ZoneId): ZoneId[] => exits(g, z, 'enemy');

answers.whipKiller = (g, id) => {
  if (id === 'no') return;
  g.killer.zone = id;
  log(g, `The whip drags ${K(g).name} into ${zoneName(g, id)}.`, 'good');
};

answers.batMinor = (g, id) => {
  if (id === 'no') return;
  g.killer.minors = g.killer.minors.filter((m) => m.id !== id);
  g.terrorDiscard.push(id);
  log(g, 'The bat smashes the Minor Dark Power.', 'good');
};

answers.barbaraExtra = (g, id) => {
  const n = Number(id);
  if (!n) return;
  for (let i = 0; i < n; i++) {
    const v = victimsIn(g, g.fg.zone)[0];
    if (v) killVictim(g, v, false, { noBloodlust: true });
  }
  damageKiller(g, n);
};

function whipMinion(g: GameState, z: ZoneId): void {
  if (!minionsIn(g, z).length) return;
  choose(
    g,
    'Whip: drag a minion 1 space?',
    [...exitsOf(g, z).map((t) => ({ id: `${z}>${t}`, label: `Into ${zoneName(g, t)}`, zone: t })), { id: 'no', label: 'No' }],
    { id: 'whipMinion' },
  );
}

answers.whipMinion = (g, id) => {
  if (id === 'no') return;
  const [from, to] = id.split('>');
  const m = minionsIn(g, from)[0];
  if (m) {
    m.zone = to;
    log(g, `The whip drags a ${K(g).minion?.name ?? 'minion'} into ${zoneName(g, to)}.`, 'good');
  }
};

function afterWeapon(g: GameState, ctx: HitCtx, target: string): void {
  if (!ctx.weapon || g.outcome) return;
  const it = g.fg.items.find((i) => i.uid === ctx.weapon);
  if (!it) return;
  const d = itemDef(g, it.id);
  if (d.ability === 'item.throwingAxe') {
    const z = target === 'killer' ? g.killer.zone : target.slice(3);
    if (z !== g.fg.zone) {
      log(g, 'You throw the axe; it\'s gone.');
      discardItem(g, it.uid);
      return;
    }
  }
  if (d.ability === 'item.strongmanHammer' || d.ability === 'item.charliesHammer') {
    log(g, 'The hammer takes its toll: lose 1 health and your Action Phase ends.', 'bad');
    hurtFG(g, 1);
    if (!g.outcome && g.phase === 'action') g.mods.actionEnding = true;
  }
  if (it.uses !== undefined && ctx.firstHit) spendUse(g, it.uid);
}

// ---- minions ----------------------------------------------------------------------

export function damageMinions(g: GameState, zone: ZoneId, n: number): void {
  const tough = has(g, 'dp.massiveAbomination');
  for (let left = n; left > 0; left--) {
    const here = minionsIn(g, zone);
    if (!here.length) break;
    const m = here.find((x) => x.hit) ?? here[0];
    if (tough && !m.hit && !m.id.startsWith('tmp-')) {
      m.hit = true;
      log(g, `Massive Abomination: the ${minionName(g, m.id)} shrugs off the first hit this turn.`, 'killer');
      continue;
    }
    m.hp--;
    if (m.hp <= 0) {
      g.minions = g.minions.filter((x) => x !== m);
      if (!m.id.startsWith('tmp-')) g.minionPool.exhausted.push(m.id);
      log(g, `The ${minionName(g, m.id)} is destroyed.`, 'good');
      for (const fn of minionDestroyed) fn(g, m);
    }
  }
}
