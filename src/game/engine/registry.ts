// Extension points the film modules plug into.

import type { CardId, ItemDef, ZoneId } from '../types';
import type { Frame, GameState, ItemAction, ItemInst, MoveMode, RollPurpose, Victim } from './state';

export interface ItemHandler {
  /** What the item offers in the Action Phase menu. */
  actions?(g: GameState, it: ItemInst, def: ItemDef): Omit<ItemAction, 'uid'>[];
  use?(g: GameState, it: ItemInst, action: string): void;
  /** Runs when you take the item. */
  gained?(g: GameState, it: ItemInst): void;
  /** Offered when an enemy attacks you. */
  react?: {
    label(g: GameState, it: ItemInst): string;
    can(g: GameState, it: ItemInst, f: Extract<Frame, { t: 'attackFG' }>): boolean;
    use(g: GameState, it: ItemInst, f: Extract<Frame, { t: 'attackFG' }>): void;
  };
}

export const itemHandlers: Record<string, ItemHandler> = {};

/** Change how many dice a horror roll uses. Return the new count; add a note for the log. */
export const diceMods: ((g: GameState, p: RollPurpose, n: number, notes: string[]) => number)[] = [];

/** Return false to stop a card from being played right now. */
export const cardGates: ((g: GameState, card: CardId) => boolean)[] = [];

/** Extra Action Phase menu entries that aren't items (uid is the key into extraUses). */
export const extraActions: ((g: GameState) => ItemAction[])[] = [];
export const extraUses: Record<string, (g: GameState, action: string) => void> = {};

/** Narrow where the Final Girl may move. */
export const moveFilters: ((g: GameState, mode: MoveMode, to: ZoneId[]) => ZoneId[])[] = [];

/** Return false if this victim won't follow you right now. */
export const followFilters: ((g: GameState, v: Victim, to?: ZoneId) => boolean)[] = [];

/** Return false if this victim can't be saved here. */
export const rescueFilters: ((g: GameState, v: Victim, zone: ZoneId) => boolean)[] = [];

/** Ultimate abilities you trigger yourself. */
export const ultimates: Record<string, { label(g: GameState): string | null; use(g: GameState): void }> = {};

/** Spaces that count as exits besides the board's (the helicopter). */
export const rescueSpaces: ((g: GameState, zone: ZoneId) => boolean)[] = [];

/** Played cards whose time cost changes (Nothing Is Easy). */
export const costMods: ((g: GameState, card: CardId, cost: number) => number)[] = [];

/** A horror roll was fully resolved (after rerolls). */
export const afterRoll: ((g: GameState, dice: number[], successes: number, p: RollPurpose) => void)[] = [];

/** Something to ask before a Terror card resolves (e.g. a Crucifix). Return true if it pushed a question. */
export const beforeTerror: ((g: GameState, card: string) => boolean)[] = [];
