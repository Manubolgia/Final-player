// STUB — replaced by the sheets implementation. Component names and props are fixed.
import type { GameState } from '../../game';
import type { DisplayView } from '../game/display';
import type { Prefs } from '../persistence';
import { Sheet } from './Sheet';

export function KillerSheet({ g, onClose }: { g: GameState; view: DisplayView; onClose: () => void; onReveal: (deck: 'terror' | 'event', id: string) => void }) {
  return <Sheet title={g.config.killer} onClose={onClose}>…</Sheet>;
}
export function GirlSheet({ g, onClose }: { g: GameState; view: DisplayView; onClose: () => void }) {
  return <Sheet title={g.config.finalGirl} onClose={onClose}>…</Sheet>;
}
export function ZoneSheet({ zone, onClose }: { g: GameState; view: DisplayView; zone: string; onClose: () => void }) {
  return <Sheet title={zone} onClose={onClose}>…</Sheet>;
}
export function LogSheet({ onClose }: { g: GameState; onClose: () => void }) {
  return <Sheet title="Log" onClose={onClose}>…</Sheet>;
}
export function MenuSheet({ onClose }: { prefs: Prefs; setPrefs: (p: Prefs) => void; onClose: () => void; onRules: () => void; onRestart: () => void; onQuit: () => void }) {
  return <Sheet title="Paused" onClose={onClose}>…</Sheet>;
}
export function RulesSheet({ onClose }: { onClose: () => void }) {
  return <Sheet title="How to play" onClose={onClose}>…</Sheet>;
}
