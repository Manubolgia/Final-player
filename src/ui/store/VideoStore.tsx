// STUB — replaced by the title screen implementation. Props are fixed.
import type { GameConfig, GameState } from '../../game';
import type { Prefs } from '../persistence';

export interface VideoStoreProps {
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  saved: GameState | null;
  onContinue: () => void;
  onStart: (cfg: Omit<GameConfig, 'seed'>) => void;
}

export function VideoStore({ onStart }: VideoStoreProps) {
  return (
    <div className="app store">
      <div className="logo">Final Player</div>
      <button type="button" onClick={() => onStart({ killer: 'hans', location: 'campHappyTrails', finalGirl: 'laurie', board: 'normal' })}>
        Start the night
      </button>
    </div>
  );
}
