// A random (but legal) player, for simulation and tests.
import { act, type GameState, type Input } from '../src/game';
import { itemDef } from '../src/game/engine/kernel';

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function botInput(g: GameState, r: () => number): Input {
  const p = g.prompt!;
  const pick = <T>(a: T[]): T => a[Math.floor(r() * a.length)];
  switch (p.type) {
    case 'main': {
      if (p.strike) {
        if (p.playable.length && r() < 0.6) {
          const c = pick(p.playable);
          return c.needsWeapon || (c.weapons.length && r() < 0.5) ? { t: 'play', card: c.card, weapon: pick(c.weapons) } : { t: 'play', card: c.card };
        }
        return { t: 'endPhase' };
      }
      if (p.canRescue) return { t: 'rescue' };
      const roll = r();
      if (p.playable.length && roll < 0.75) {
        const c = pick(p.playable);
        if (c.needsWeapon || (c.weapons.length && r() < 0.7)) return { t: 'play', card: c.card, weapon: pick(c.weapons) };
        return { t: 'play', card: c.card };
      }
      if (p.items.length && roll < 0.85) {
        const a = pick(p.items);
        return { t: 'item', uid: a.uid, action: a.action };
      }
      if (p.ultimate && roll < 0.9) return { t: 'ultimate' };
      if (g.fg.hand.length > 3 && roll < 0.93) return { t: 'discardForTime', cards: [g.fg.hand[0]] };
      return { t: 'endPhase' };
    }
    case 'roll': {
      if (p.convertible && r() < 0.5) {
        const die = p.dice.findIndex((x, i) => (x === 3 || x === 4) && !p.converted.includes(i));
        return { t: 'convert', die, discard: g.fg.hand.slice(0, 2) };
      }
      if (p.canCloseCall && p.successes === 0 && r() < 0.5) return r() < 0.5 ? { t: 'closeCall' } : { t: 'closeCall', die: 0 };
      if (p.canLucky && p.successes === 0 && r() < 0.5) return { t: 'lucky', dice: p.dice.map((_, i) => i) };
      if (p.canSister && p.successes === 0 && r() < 0.3) return { t: 'sister', die: 0 };
      return { t: 'confirm' };
    }
    case 'move': {
      if (p.canStop && r() < 0.15) return { t: 'stop' };
      const n = Math.min(p.followLimit, p.followers.length);
      return { t: 'moveTo', zone: pick(p.to), bring: p.followers.slice(0, Math.floor(r() * (n + 1))) };
    }
    case 'choice':
      return { t: 'choose', id: pick(p.options).id };
    case 'planning':
      if (r() < 0.8) return { t: 'buy', card: pick(p.buyable) };
      return { t: 'endPlanning' };
    case 'react':
      if (p.cards.length && r() < 0.7) return { t: 'react', card: pick(p.cards) };
      if (p.items.length && r() < 0.7) return { t: 'reactItem', uid: pick(p.items).uid };
      return { t: 'takeHit' };
    case 'rescue':
      return { t: 'rescueOne', victim: p.victims[0], slot: p.ultimate ? 0 : p.slots[0] };
    case 'search':
      return { t: 'searchPick', keep: 0, otherTo: r() < 0.5 ? 'top' : 'bottom' };
    case 'arrange': {
      const inHands: string[] = [];
      let hands = 0;
      for (const it of g.fg.items) {
        const h = itemDef(g, it.id).hands;
        if (h > 0 && hands + h <= 2 && r() < 0.8) {
          inHands.push(it.uid);
          hands += h;
        }
      }
      return { t: 'arrange', inHands };
    }
    case 'discardDown':
      return { t: 'discardDown', cards: g.fg.hand.slice(0, p.excess) };
  }
}

export function playOut(g0: GameState, seed: number, maxSteps = 6000): { g: GameState; steps: number } {
  const r = rng(seed);
  let g = g0;
  let steps = 0;
  while (!g.outcome && steps < maxSteps) {
    if (!g.prompt) throw new Error(`No prompt and no outcome at step ${steps}: stack ${JSON.stringify(g.stack.map((f) => f.t))}`);
    try {
      g = act(g, botInput(g, r));
    } catch (e) {
      (e as { g?: GameState }).g = g;
      throw e;
    }
    steps++;
  }
  return { g, steps };
}
