// What the table shows at a moment of playback. During the Killer Phase the
// state has already moved on; the log's snapshots let us show each step.

import type { GameState, Snap } from '../../game';
import type { SpecialRole, ZoneId } from '../../game/types';

export interface DisplayView {
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
  victims: { id: string; zone: ZoneId; role?: SpecialRole }[];
  minions: { id: string; zone: ZoneId; hp: number }[];
}

export function liveView(g: GameState): DisplayView {
  return {
    fz: g.fg.zone,
    kz: g.killer.zone,
    fhp: g.fg.health.hp,
    ftok: g.fg.health.token,
    ft: g.fg.time,
    fh: g.fg.horror,
    khp: g.killer.health.hp,
    ktok: g.killer.health.token,
    bl: g.killer.bloodlust,
    td: g.terrorDeck.length,
    saved: g.fg.saved,
    dead: g.dead.length,
    victims: g.victims.map((v) => ({ id: v.id, zone: v.zone, role: v.role })),
    minions: g.minions.map((m) => ({ id: m.id, zone: m.zone, hp: m.hp })),
  };
}

export function snapView(s: Snap): DisplayView {
  return {
    fz: s.fz,
    kz: s.kz,
    fhp: s.fhp,
    ftok: s.ftok,
    ft: s.ft,
    fh: s.fh,
    khp: s.khp,
    ktok: s.ktok,
    bl: s.bl,
    td: s.td,
    saved: s.saved,
    dead: s.dead,
    victims: s.vic.map(([id, zone, role]) => ({ id, zone, role })),
    minions: s.min.map(([id, zone, hp]) => ({ id, zone, hp })),
  };
}

/** Animation hints for the board while one log entry plays. */
export interface BoardFx {
  /** Where the killer (or a minion) is drawn at this step. */
  killerAt?: ZoneId;
  minionAt?: { id: string; zone: ZoneId };
  fgAt?: ZoneId;
  /** Victims drawn somewhere other than their display zone. */
  runners?: Record<string, ZoneId>;
  /** A death happening right now. */
  dying?: ZoneId;
  trail?: ZoneId[];
  /** A panic move: light up this edge's tile. */
  panicEdge?: [ZoneId, ZoneId];
}
