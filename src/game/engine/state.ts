import type { CardId, Phase, SpecialRole, ZoneId } from '../types';

export interface Victim {
  id: string;
  zone: ZoneId;
  role?: SpecialRole;
}

export interface ItemInst {
  uid: string;
  id: string;
  inHands: boolean;
  uses?: number;
}

export interface Health {
  hp: number;
  max: number;
  /** black: the face-down Final Health token; white: it already came back once. */
  token: 'black' | 'white';
  /** Hearts on the back of the black token. */
  hidden: number;
}

export interface Minion {
  id: string;
  zone: ZoneId;
  hp: number;
  /** Already shrugged off a hit this turn (Massive Abomination). */
  hit?: boolean;
}

export interface Token {
  id: string;
  zone: ZoneId;
  /** For tokens that sit on a connection between two spaces. */
  to?: ZoneId;
}

export interface ItemCard {
  id: string;
  up: boolean;
}

export interface Mods {
  bonusDice: number;
  partialsNext: boolean;
  partialsPhase: boolean;
  killedThisTurn: number;
  killedThisKillerPhase: number;
  rescuedThisPhase: number;
  usedThisPhase: string[];
  usedThisTurn: string[];
  skipNextAction: boolean;
  timeAtNextAction: number | null;
  actionEnding: boolean;
  damageTaken: number;
  damageMark: number;
  /** Dice removed from the next action phase's horror rolls (Dr. Fright). */
  minusDicePhase: number;
}

export interface GameConfig {
  killer: string;
  location: string;
  finalGirl: string;
  board: 'normal' | 'extreme';
  setup?: string;
  seed: number;
  /** Kickstarter Epic Dark Power instead of a random one. */
  epicDarkPower?: boolean;
  /** Shuffle the Final Girls' signature items into the item decks. */
  bonusItems?: boolean;
}

export type Tone = 'info' | 'good' | 'bad' | 'killer' | 'phase';

export type Anim =
  | { kind: 'dice'; faces: number[] }
  | { kind: 'killerMove'; path: ZoneId[]; minion?: string }
  | { kind: 'fgMove'; path: ZoneId[]; victims?: string[] }
  | { kind: 'victimMove'; victim: string; path: ZoneId[] }
  | { kind: 'victimDie'; zone: ZoneId }
  | { kind: 'card'; deck: 'terror' | 'event' | 'darkPower' | 'finale' | 'item'; id: string };

/** The board as it stood right after a log entry, so playback can show each moment. */
export interface Snap {
  fz: ZoneId;
  kz: ZoneId;
  fhp: number;
  ftok: 'black' | 'white';
  ft: number;
  fh: number;
  khp: number;
  ktok: 'black' | 'white';
  bl: number;
  td: number;
  saved: number;
  dead: number;
  vic: [string, ZoneId, SpecialRole?][];
  min: [string, ZoneId, number][];
}

export interface LogEntry {
  n: number;
  turn: number;
  phase: Phase;
  text: string;
  tone: Tone;
  anim?: Anim;
  /** Only on the entries the latest input produced. */
  snap?: Snap;
}

export interface Option {
  id: string;
  label: string;
  detail?: string;
  /** The space this option is about, so the map can highlight it. */
  zone?: ZoneId;
}

export interface ItemAction {
  uid: string;
  action: string;
  label: string;
}

export type RollPurpose =
  | { kind: 'action'; card: CardId; weapon?: string }
  | { kind: 'reaction'; card: CardId }
  | { kind: 'item'; id: string; uid?: string }
  | { kind: 'effect'; label: string; id: string; data?: unknown };

export type Prompt =
  | {
      type: 'main';
      playable: { card: CardId; weapons: string[]; needsWeapon: boolean }[];
      items: ItemAction[];
      ultimate: string | null;
      canRescue: boolean;
      /** Creech Manor: a forced strike in the Killer Phase (attack cards only). */
      strike?: 'victims' | 'enemy';
    }
  | {
      type: 'roll';
      purpose: RollPurpose;
      dice: number[];
      converted: number[];
      auto34: boolean;
      convertible: boolean;
      canCloseCall: boolean;
      canLucky: boolean;
      canSister: boolean;
      successes: number;
    }
  | {
      type: 'move';
      remaining: number;
      to: ZoneId[];
      followers: string[];
      followLimit: number;
      mode: MoveMode;
      canStop: boolean;
      title: string;
    }
  | { type: 'choice'; title: string; options: Option[]; detail?: string }
  | { type: 'planning'; buyable: CardId[] }
  | { type: 'react'; damage: number; by: string; cards: CardId[]; items: ItemAction[] }
  | { type: 'rescue'; victims: string[]; slots: number[]; ultimate: boolean }
  | { type: 'search'; drawn: string[] }
  | { type: 'arrange'; optional: boolean }
  | { type: 'discardDown'; excess: number };

export type MoveMode = 'walk' | 'free' | 'boat' | 'persuade' | 'panic';

export type Input =
  | { t: 'play'; card: CardId; weapon?: string }
  | { t: 'discardForTime'; cards: CardId[] }
  | { t: 'item'; uid: string; action: string }
  | { t: 'ultimate' }
  | { t: 'rescue' }
  | { t: 'endPhase' }
  | { t: 'convert'; die: number; discard: CardId[] }
  | { t: 'closeCall'; die?: number }
  | { t: 'lucky'; dice: number[] }
  | { t: 'sister'; die: number }
  | { t: 'confirm' }
  | { t: 'moveTo'; zone: ZoneId; bring: string[] }
  | { t: 'stop' }
  | { t: 'choose'; id: string }
  | { t: 'buy'; card: CardId }
  | { t: 'endPlanning' }
  | { t: 'react'; card: CardId }
  | { t: 'reactItem'; uid: string }
  | { t: 'takeHit' }
  | { t: 'rescueOne'; victim: string; slot: number }
  | { t: 'rescueDone' }
  | { t: 'searchPick'; keep: number; otherTo: 'top' | 'bottom' }
  | { t: 'arrange'; inHands: string[] }
  | { t: 'discardDown'; cards: CardId[] };

/** Where an effect came from; some rules care (heal bonuses, weapons). */
export interface Src {
  kind: 'action' | 'reaction' | 'terror' | 'event' | 'item' | 'killer' | 'finale' | 'rescue' | 'system' | 'bloodlust' | 'wrath';
  id?: string;
  weapon?: string;
  /** Forced attack target ('killer' or 'm:<zone>'). */
  target?: string;
  healBonus?: boolean;
  damageBonus?: boolean;
}

export interface Continuation {
  id: string;
  data?: unknown;
}

export type Frame =
  | { t: 'phase'; phase: Phase; step: number }
  | { t: 'fx'; list: import('../types').Effect[]; i: number; src: Src }
  | { t: 'choice'; title: string; options: Option[]; then: Continuation; detail?: string }
  | { t: 'play'; card: CardId; weapon?: string; step: 'roll' | 'resolve' | 'done'; successes?: number; prayed?: boolean }
  | { t: 'roll'; purpose: RollPurpose; dice: number[]; converted: number[]; auto34: boolean; ret?: Continuation }
  | { t: 'reaction'; card: CardId; rolled: boolean; successes?: number }
  | { t: 'move'; remaining: number; mode: MoveMode; moved: number; src: Src }
  | { t: 'rescue' }
  | { t: 'search'; deck: string; n: number; drawn: string[]; zappo?: boolean }
  | { t: 'arrange'; optional: boolean }
  | { t: 'discardDown' }
  | { t: 'killer'; a: import('../types').KillerActionDef; actor: string; step: KillerStep; target?: KillerTarget; path?: ZoneId[]; attacksLeft?: number; attackedFG?: boolean; moved?: boolean; killed: number; stopAsked?: boolean; src: Src }
  | { t: 'attackFG'; damage: number; by: string; victim?: string }
  | { t: 'terror'; card: string; asked?: boolean }
  | { t: 'event'; card: string }
  | { t: 'custom'; id: string; data?: unknown; step: number }
  | { t: 'strike'; mode: 'victims' | 'enemy'; left: number };

export type KillerStep = 'target' | 'path' | 'move' | 'spray' | 'attack' | 'after' | 'done';

export type KillerTarget =
  | { kind: 'zone'; zone: ZoneId; who: 'finalGirl' | 'victim' | 'group' | 'token' }
  | { kind: 'none' };

export interface GameState {
  v: 1;
  config: GameConfig;
  rng: { s: number };
  turn: number;
  phase: Phase;
  setupName: string;
  fg: {
    id: string;
    zone: ZoneId;
    startZone: ZoneId;
    health: Health;
    time: number;
    horror: number;
    hand: CardId[];
    items: ItemInst[];
    slots: boolean[];
    ultimate: boolean;
    saved: number;
    /** Carnival: a bear trap on your leg. */
    legTrap?: boolean;
    /** Carnival: hidden cobra. */
    cobra?: boolean;
  };
  killer: {
    id: string;
    zone: ZoneId;
    startZone: ZoneId;
    health: Health;
    bloodlust: number;
    finale: string;
    finaleRevealed: boolean;
    darkPowers: { id: string; revealed: boolean }[];
    minors: { id: string; hp: number }[];
  };
  victims: Victim[];
  victimPool: number;
  dead: Victim[];
  minions: Minion[];
  minionPool: { ready: string[]; exhausted: string[] };
  tableau: Record<CardId, number>;
  actionDiscard: CardId[];
  terrorDeck: string[];
  terrorDiscard: string[];
  /** Terror cards that stay in play. */
  activeTerror: string[];
  eventDeck: string[];
  eventDiscard: string[];
  activeEvents: string[];
  itemDecks: Record<string, ItemCard[]>;
  itemDiscard: string[];
  tokens: Token[];
  /** Spaces linked by the Secret Tunnel. */
  tunnel: ZoneId[];
  /** Connections victims won't cross ([a, b] pairs). */
  blocked: [ZoneId, ZoneId][];
  wrath: { killer?: number; divine?: number };
  /** Spare black Final Health tokens (Dr. Fright and Nancy use them). */
  spareTokens: number[];
  film: Record<string, any>;
  mods: Mods;
  stack: Frame[];
  prompt: Prompt | null;
  log: LogEntry[];
  outcome: { winner: 'finalGirl' | 'killer'; text: string } | null;
  uid: number;
}
