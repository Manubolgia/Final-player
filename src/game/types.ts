// Content definitions: every card, board and character is plain data built
// from these shapes. Behaviour that data can't express is an `ability` or a
// `custom` effect id, implemented by the film modules in ../films.

export type ZoneId = string;
export type CardId = string;
export type Phase = 'setup' | 'action' | 'planning' | 'killer' | 'panic' | 'upkeep';

/** Who an enemy goes for. */
export type Target = 'victim' | 'finalGirl' | 'nearest' | 'victimElseFG' | 'farthestVictim';

export interface KillerActionDef {
  target: Target;
  moves: number;
  attacks: number;
  /** Who performs it. Defaults to every enemy, minions first. */
  actor?: 'killer' | 'minions' | 'all';
  /** Extra effects for each victim killed by this action. */
  perKill?: Effect[];
  /** Attack first, then move (some cards read "attack ▸ move"). */
  attackFirst?: boolean;
  /** Kill one victim in every space the killer passes through. */
  killAlong?: boolean;
}

export type WrathKind = 'killer' | 'divine';
export type WrathBy =
  | 'sacredVictims'
  | 'bloodlustLevel'
  | 'handSize'
  | 'fgHealth'
  | 'saved'
  | 'horrorLevel'
  | 'killedThisTurn'
  | 'damageSinceMark';

export type Effect =
  | { k: 'time'; n: number }
  | { k: 'horror'; n: number }
  | { k: 'heal'; n: number }
  /** Lose health. Can't be prevented. */
  | { k: 'lose'; n: number }
  /** The Final Girl moves up to n spaces. */
  | { k: 'move'; n: number }
  | { k: 'endAction' }
  /** The Final Girl deals damage (an attack). */
  | { k: 'damage'; n: number }
  | { k: 'bonusDice'; n: number }
  | { k: 'partials'; scope: 'phase' | 'next' }
  | { k: 'search'; n: number }
  | { k: 'itemAny' }
  | { k: 'takeCard'; card?: CardId; maxCost?: number }
  | { k: 'ignoreAttack' }
  | { k: 'reduceAttack'; n: number; min?: number }
  | { k: 'bloodlust'; n: number }
  | { k: 'killer'; a: KillerActionDef }
  | { k: 'killerHeal'; n: number }
  | { k: 'event' }
  | { k: 'terror' }
  | { k: 'victims'; n: number; at: ZoneId | 'killerStart' | 'fgStart' }
  | { k: 'panic'; who: 'notFG' | 'killerSpace'; times: number }
  | { k: 'wrath'; which: WrathKind | 'choose'; op: 'increase' | 'reduce' | 'halve' | 'set'; n?: number; by?: WrathBy }
  | { k: 'unleash'; which: WrathKind }
  | { k: 'discardRandom'; n: number }
  | { k: 'victimsStep' }
  | { k: 'custom'; id: string; data?: unknown };

export interface ResultTable {
  triple?: Effect[][];
  double: Effect[][];
  single: Effect[][];
  fail: Effect[][];
}

export interface ActionCardDef {
  id: CardId;
  name: string;
  cost: number;
  copies: number;
  /** action: played on your turn; afterRoll: played after a horror roll; reaction: when attacked. */
  timing: 'action' | 'afterRoll' | 'reaction';
  text: string;
  results?: ResultTable;
  /** Only in the tableau with these killers or locations. */
  onlyWith?: string[];
}

export interface PanicArrow {
  to: ZoneId;
  faces: number[];
}

export interface ZoneDef {
  id: ZoneId;
  name: string;
  /** Position on the drawn map, 0–100 on both axes. */
  x: number;
  y: number;
  /** Arrows leaving this space: where a panicking victim goes on each die face. Also the space's connections. */
  panic: PanicArrow[];
  search?: boolean;
  exit?: boolean;
  water?: boolean;
  sacred?: boolean;
  window?: boolean;
  outside?: boolean;
  floor?: number;
  house?: boolean;
  street?: boolean;
  /** Item deck this space searches, when it isn't the space's own id. */
  deck?: string;
  /** Not on the board until something puts it there. */
  hidden?: boolean;
  /** A named landmark (drawn larger). */
  landmark?: boolean;
}

export interface ItemDef {
  id: string;
  name: string;
  text: string;
  hands: 0 | 1 | 2;
  range?: [number, number];
  /** Extra damage when used with an attack. */
  damage?: number;
  uses?: number;
  /** Which action cards it can modify: any attack card, none, or a list. */
  modifies?: 'any' | 'none' | CardId[];
  ability?: string;
  trap?: boolean;
  onlyFor?: string;
  token?: string;
  /** Can't go in the backpack. */
  noBackpack?: boolean;
}

export interface SetupDef {
  id: string;
  name: string;
  fg: ZoneId;
  killer: ZoneId;
  victims: Record<ZoneId, number>;
}

export type SpecialRole =
  | 'boyfriend'
  | 'girlfriend'
  | 'cursed'
  | 'superTourist'
  | 'holyMan'
  | 'tourGuide'
  | 'fiance'
  | 'sister'
  | 'werewolf'
  | 'ghostHunter'
  | 'mlBoyfriend'
  | 'smalley'
  | 'survivor';

export interface EventDef {
  id: string;
  name: string;
  text: string;
  persistent: boolean;
  onReveal?: Effect[];
  ability?: string;
  /** Turns a victim into a special victim when revealed (ignored if no victims). */
  special?: boolean;
}

export interface TerrorDef {
  id: string;
  name: string;
  copies: number;
  text: string;
  effects: Effect[];
  /** "If there are no victims on the board, discard this and draw the next." */
  requiresVictims?: boolean;
  /** Creech Manor: skipped when Carolyn is (or isn't) with you. */
  skipIf?: 'carolyn' | 'noCarolyn';
  /** A Minor Dark Power: stays with health tokens on it. */
  minor?: { hp: number; ability: string };
  /** Stays in play with an ability. */
  stays?: string;
  /** Carnival trap terror cards. */
  trapCard?: boolean;
}

export interface FinaleDef {
  id: string;
  name: string;
  text?: string;
  action: Effect[];
  minionAction?: Effect[];
  ability?: string;
}

export interface DarkPowerDef {
  id: string;
  name: string;
  text: string;
  ability: string;
  epic?: boolean;
}

export interface BloodlustSpace {
  attack: number;
  move: number;
  effects?: Effect[];
  darkPower?: boolean;
}

export interface MinionDef {
  name: string;
  plural: string;
  count: number;
  hp: number;
  attack: number;
  text: string;
}

export interface WrathDef {
  kind: WrathKind;
  name: string;
  start: number;
  /** Effects for unleashing at levels 1–10. */
  levels: { effects: Effect[]; text: string }[];
}

export interface KillerDef {
  id: string;
  name: string;
  title?: string;
  film: string;
  startHorror: number;
  health: number;
  /** Can't be damaged or killed (The Poltergeist). */
  invulnerable?: boolean;
  /** No body on the board: a flock of minions instead (the Birds). */
  bodiless?: boolean;
  bloodlust: BloodlustSpace[];
  maxEffect: Effect[];
  maxText: string;
  action: Effect[];
  minionAction?: Effect[];
  finales: FinaleDef[];
  darkPowers: DarkPowerDef[];
  terror: TerrorDef[];
  items?: ItemDef[];
  minion?: MinionDef;
  wrath?: WrathDef;
  rules: string;
  /** Colour used for this killer on the board. */
  color: string;
  icon: string;
}

export interface LocationDef {
  id: string;
  name: string;
  film: string;
  /** Board width / height, for drawing the map. */
  aspect: number;
  zones: ZoneDef[];
  /** Item decks, by id (normally the search space's id). */
  itemDecks: string[];
  deckNames?: Record<string, string>;
  /** Cards per item deck. */
  deckSize?: number;
  setups: SetupDef[];
  events: EventDef[];
  terror: TerrorDef[];
  items: ItemDef[];
  rules: string;
  wrath?: WrathDef;
  /** Sacred Groves: extra effects when bloodlust reaches each space (index = bloodlust - 1). */
  bloodlustTrack?: { effects: Effect[]; text: string }[];
  /** Sacred Groves: extra killer phase effects after the Finale. */
  finaleToken?: { effects: Effect[]; text: string };
  /** One-way connections a rope ladder can open both ways: the token goes on `at`. */
  oneWay?: { from: ZoneId; to: ZoneId; at: ZoneId }[];
  /** The outside ladder (two spaces) a "broken" token can cut. */
  ladder?: [ZoneId, ZoneId];
  /** Map colours. */
  ground: string;
  accent: string;
  icon: string;
}

export interface RescueSlot {
  effects: Effect[];
  text: string;
}

export interface FinalGirlDef {
  id: string;
  name: string;
  film: string;
  health: number;
  slots: RescueSlot[];
  ultimate: { text: string; ability: string };
  extra: Effect[];
  extraText: string;
  bonusItem?: string;
  blurb: string;
}

export interface FilmDef {
  id: string;
  name: string;
  killer: KillerDef;
  /** A vignette (the Birds) brings no location of its own. */
  location?: LocationDef;
  finalGirls: FinalGirlDef[];
  bonusItems: ItemDef[];
  tagline: string;
}

export interface BoardDef {
  id: 'normal' | 'extreme';
  name: string;
  /** Horror track, green space first: dice rolled on each space, and the killer start labels 1–6. */
  horror: { label: number | null; dice: number }[];
  startTime: number;
  maxTime: number;
}
