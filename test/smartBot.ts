// A greedy player that actually tries: saves victims, takes items, and goes
// after the Killer when it has the cards for it. Used to check that the
// winning paths of every film work, not to play well.
import { act, RuleError, type GameState, type Input } from '../src/game';
import { card, isAttackCard, isHealCard, isMoveCard } from '../src/game/content/core';
import { attackTargets } from '../src/game/engine/combat';
import { distances } from '../src/game/engine/board';
import { itemDef, L } from '../src/game/engine/kernel';
import { killerVulnerable } from '../src/game/engine/stats';
import { rng } from './bot';

const dmgOf = (c: string): number => {
  const r = card(c).results;
  if (!r) return 0;
  const line = [...(r.triple ?? []), ...r.double, ...r.single].flat();
  return Math.max(0, ...line.map((e) => (e.k === 'damage' ? e.n : 0)));
};

function goal(g: GameState): string | null {
  const here = g.fg.zone;
  const d = distances(g, here, 'fg');
  const near = (zs: string[]) => zs.filter((z) => d.has(z)).sort((a, b) => d.get(a)! - d.get(b)!)[0] ?? null;
  const withMe = g.victims.some((v) => v.zone === here);
  if (withMe || g.fg.items.some((i) => i.id === 'carolyn')) {
    const exits = L(g).zones.filter((z) => z.exit && !g.tokens.some((t) => t.id === 'barrier' && t.zone === z.id)).map((z) => z.id);
    const e = near(exits);
    if (e && e !== here) return e;
  }
  const attackCards = g.fg.hand.filter(isAttackCard).length;
  if (killerVulnerable(g) && attackCards >= 2 && g.fg.health.hp >= 3 && !g.film.birds) return g.killer.zone;
  const items = g.fg.items.length;
  if (items < 2) {
    const search = L(g).zones.filter((z) => z.search && (g.itemDecks[z.deck ?? z.id]?.length ?? 0) > 0 && !g.tokens.some((t) => t.zone === z.id && t.id === 'searched')).map((z) => z.id);
    const s = near(search);
    if (s && (d.get(s) ?? 9) <= 2) return s;
  }
  const v = near([...new Set(g.victims.map((x) => x.zone))]);
  return v;
}

export function smartInput(g: GameState, r: () => number): Input {
  const p = g.prompt!;
  const pick = <T>(a: T[]): T => a[Math.floor(r() * a.length)];
  switch (p.type) {
    case 'main': {
      if (p.strike) {
        const c = p.playable.sort((a, b) => dmgOf(b.card) - dmgOf(a.card))[0];
        if (c) return c.needsWeapon ? { t: 'play', card: c.card, weapon: c.weapons[0] } : { t: 'play', card: c.card, ...(c.weapons[0] ? { weapon: c.weapons[0] } : {}) };
        return { t: 'endPhase' };
      }
      if (p.canRescue) return { t: 'rescue' };
      if (p.ultimate && r() < 0.5) return { t: 'ultimate' };
      const can = (f: (c: string) => boolean) => p.playable.filter((x) => f(x.card));
      // Hit the Killer (or a minion) when something is in reach.
      const hits = can(isAttackCard).filter((x) => attackTargets(g, [0, 0]).length || x.weapons.length);
      if (hits.length && (g.fg.time >= 1 || r() < 0.5)) {
        const c = hits.sort((a, b) => dmgOf(b.card) - dmgOf(a.card))[0];
        return c.weapons[0] ? { t: 'play', card: c.card, weapon: c.weapons[0] } : { t: 'play', card: c.card };
      }
      if (g.fg.health.hp <= Math.max(2, g.fg.health.max / 2)) {
        const h = can(isHealCard)[0];
        if (h) return { t: 'play', card: h.card };
      }
      if (g.fg.horror >= 5) {
        const f = can((c) => c === 'focus' || c === 'distraction')[0];
        if (f) return { t: 'play', card: f.card };
      }
      const search = can((c) => c === 'search')[0];
      if (search && g.fg.items.length < 3) return { t: 'play', card: 'search' };
      const gl = goal(g);
      if (gl && gl !== g.fg.zone) {
        const m = can(isMoveCard)[0];
        if (m) return { t: 'play', card: m.card };
      }
      const use = p.items.find((a) => /shoot|Fire|Shoot|Drink|Swallow/.test(a.label));
      if (use && r() < 0.7) return { t: 'item', uid: use.uid, action: use.action };
      if (p.playable.length && r() < 0.3) {
        const c = pick(p.playable.filter((x) => !x.needsWeapon).length ? p.playable.filter((x) => !x.needsWeapon) : p.playable);
        return c.needsWeapon ? { t: 'play', card: c.card, weapon: c.weapons[0] } : { t: 'play', card: c.card };
      }
      return { t: 'endPhase' };
    }
    case 'roll': {
      if (p.convertible && g.fg.hand.length >= 4) {
        const die = p.dice.findIndex((x, i) => (x === 3 || x === 4) && !p.converted.includes(i));
        const spare = [...g.fg.hand].sort((a, b) => card(a).cost - card(b).cost).slice(0, 2);
        return { t: 'convert', die, discard: spare };
      }
      if (p.canLucky && p.successes === 0) return { t: 'lucky', dice: p.dice.map((_, i) => i) };
      if (p.canCloseCall && p.successes === 0) return { t: 'closeCall', die: 0 };
      return { t: 'confirm' };
    }
    case 'move': {
      const gl = goal(g);
      const bring = p.followers.slice(0, p.followLimit);
      if (!gl) return p.canStop ? { t: 'stop' } : { t: 'moveTo', zone: pick(p.to), bring };
      if (gl === g.fg.zone && p.canStop) return { t: 'stop' };
      const best = p.to
        .map((z) => ({ z, d: distances(g, z, 'fg').get(gl) ?? 99 }))
        .sort((a, b) => a.d - b.d)[0];
      const now = distances(g, g.fg.zone, 'fg').get(gl) ?? 99;
      if (p.canStop && best.d >= now) return { t: 'stop' };
      return { t: 'moveTo', zone: best.z, bring };
    }
    case 'choice': {
      const yes = p.options.find((o) => o.id === 'yes');
      if (yes && /sleep/i.test(p.title)) return { t: 'choose', id: g.fg.hand.filter(isAttackCard).length >= 2 ? 'yes' : 'no' };
      return { t: 'choose', id: pick(p.options).id };
    }
    case 'planning': {
      const want = ['criticalBlow', 'furiousStrike', 'longRest', 'sprint', 'retaliate', 'guard', 'improvise', 'planning', 'persuade'];
      const b = want.find((c) => p.buyable.includes(c)) ?? (r() < 0.5 ? pick(p.buyable) : undefined);
      return b ? { t: 'buy', card: b } : { t: 'endPlanning' };
    }
    case 'react':
      if (p.cards.length) return { t: 'react', card: p.cards.includes('retaliate') ? 'retaliate' : p.cards[0] };
      if (p.items.length) return { t: 'reactItem', uid: p.items[0].uid };
      return { t: 'takeHit' };
    case 'rescue':
      return { t: 'rescueOne', victim: p.victims[0], slot: p.ultimate ? 0 : p.slots[0] };
    case 'search': {
      const score = (id: string) => (itemDef(g, id).damage ?? 0) * 2 + (itemDef(g, id).ability ? 1 : 0);
      const keep = p.drawn.map((id, i) => ({ i, s: score(id) })).sort((a, b) => b.s - a.s)[0].i;
      return { t: 'searchPick', keep, otherTo: 'top' };
    }
    case 'arrange': {
      const hand = g.fg.items
        .filter((it) => itemDef(g, it.id).hands > 0 && (!itemDef(g, it.id).onlyFor || itemDef(g, it.id).onlyFor === g.fg.id))
        .sort((a, b) => (itemDef(g, b.id).damage ?? 0) - (itemDef(g, a.id).damage ?? 0));
      const inHands: string[] = [];
      let hands = 0;
      for (const it of hand) {
        const h = itemDef(g, it.id).hands;
        if (hands + h <= 2) {
          inHands.push(it.uid);
          hands += h;
        }
      }
      return { t: 'arrange', inHands };
    }
    case 'discardDown':
      return { t: 'discardDown', cards: [...g.fg.hand].sort((a, b) => card(a).cost - card(b).cost).slice(0, p.excess) };
  }
}

export function smartPlayOut(g0: GameState, seed: number, maxSteps = 8000): { g: GameState; steps: number } {
  const r = rng(seed);
  let g = g0;
  let steps = 0;
  while (!g.outcome && steps < maxSteps) {
    if (!g.prompt) throw new Error(`No prompt and no outcome at step ${steps}`);
    let inp = smartInput(g, r);
    try {
      g = act(g, inp);
    } catch (e) {
      // A greedy guess the rules don't allow: fall back to something always legal.
      if (!(e instanceof RuleError)) {
        (e as { g?: GameState }).g = g;
        throw e;
      }
      const pr = g.prompt!;
      inp = pr.type === 'main' ? { t: 'endPhase' } : pr.type === 'move' && pr.canStop ? { t: 'stop' } : inp;
      g = act(g, inp);
    }
    steps++;
  }
  return { g, steps };
}
