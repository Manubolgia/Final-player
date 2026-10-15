import { useEffect, useRef, useState } from 'react';
import { newGame, type GameConfig, type GameState } from '../game';
import { FILMS } from '../game/content';
import { registerDebug } from './debug';
import { GameScreen } from './game/GameScreen';
import { loadGame, loadPrefs, saveGame, savePrefs, type Prefs } from './persistence';
import { Sprites } from './pieces/icons';
import { VideoStore } from './store/VideoStore';

const seed = () => (Math.random() * 2 ** 31) >>> 0;

/** Called by main.tsx when a new version is waiting; applied on the title screen only. */
export let applyUpdate: (() => void) | null = null;
export function setUpdate(fn: () => void): void {
  applyUpdate = fn;
}

export function App() {
  const [g, setGState] = useState<GameState | null>(null);
  const [startAt, setStartAt] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const [saved, setSaved] = useState<GameState | null>(() => loadGame());
  const [prefs, setPrefsState] = useState<Prefs>(() => loadPrefs());
  const gRef = useRef<GameState | null>(null);
  gRef.current = g;

  const setPrefs = (p: Prefs) => {
    setPrefsState(p);
    savePrefs(p);
  };
  const setG = (n: GameState) => {
    setGState(n);
    saveGame(n.outcome ? null : n);
  };

  const start = (cfg: Omit<GameConfig, 'seed'>) => {
    const film = FILMS.find((f) => f.killer.id === cfg.killer)?.id;
    setPrefs({ ...prefs, last: cfg, played: film && !prefs.played.includes(film) ? [...prefs.played, film] : prefs.played });
    setStartAt(0);
    setGameKey((k) => k + 1);
    setG(newGame({ ...cfg, seed: seed() }));
  };

  useEffect(() => {
    registerDebug({
      get: () => gRef.current,
      show: (n, at = n.log[n.log.length - 1]?.n ?? 0) => {
        setStartAt(at);
        setGameKey((k) => k + 1);
        setGState(n);
      },
      toTitle: () => setGState(null),
    });
  }, []);

  // never reload mid-game: a waiting update is applied when the title shows
  useEffect(() => {
    if (!g) applyUpdate?.();
  }, [g]);

  // save when the app is hidden or closed
  useEffect(() => {
    const save = () => {
      if (gRef.current) saveGame(gRef.current.outcome ? null : gRef.current);
    };
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, []);

  return (
    <>
      <Sprites />
      {g ? (
        <GameScreen
          key={gameKey}
          g={g}
          startAt={startAt}
          setG={setG}
          prefs={prefs}
          setPrefs={setPrefs}
          onQuit={() => {
            setSaved(g.outcome ? null : g);
            setGState(null);
          }}
          onRestart={() =>
            start({ killer: g.config.killer, location: g.config.location, finalGirl: g.config.finalGirl, board: g.config.board, epicDarkPower: g.config.epicDarkPower, bonusItems: g.config.bonusItems })
          }
        />
      ) : (
        <VideoStore
          prefs={prefs}
          setPrefs={setPrefs}
          saved={saved}
          onContinue={() => {
            if (!saved) return;
            setStartAt(saved.log[saved.log.length - 1]?.n ?? 0);
            setGameKey((k) => k + 1);
            setGState(saved);
          }}
          onStart={start}
        />
      )}
    </>
  );
}
