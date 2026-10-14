import { useEffect, useState } from 'react';
import { newGame, type GameConfig, type GameState } from '../game';
import { FILMS, FINAL_GIRLS, KILLERS, LOCATIONS, killerDef } from '../game/content';
import { Emblem, Heart } from './art/Icons';
import { Game } from './components/Game';
import { RulesSheet } from './components/Rules';
import { backToLibrary, inLibrary } from './library';
import { loadGame, loadPrefs, saveGame, savePrefs, type Prefs } from './persistence';

const seed = () => (Math.random() * 2 ** 31) >>> 0;

export function App() {
  const [g, setGState] = useState<GameState | null>(null);
  const [startAt, setStartAt] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const [saved, setSaved] = useState<GameState | null>(() => loadGame());
  const [prefs, setPrefsState] = useState<Prefs>(() => loadPrefs());
  const setPrefs = (p: Prefs) => {
    setPrefsState(p);
    savePrefs(p);
  };
  const setG = (n: GameState) => {
    setGState(n);
    saveGame(n.outcome ? null : n);
  };

  const start = (cfg: Omit<GameConfig, 'seed'>) => {
    setPrefs({ ...prefs, last: cfg });
    setStartAt(0);
    setGameKey((k) => k + 1);
    setG(newGame({ ...cfg, seed: seed() }));
  };

  if (g)
    return (
      <Game
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
        onRestart={() => start({ killer: g.config.killer, location: g.config.location, finalGirl: g.config.finalGirl, board: g.config.board, epicDarkPower: g.config.epicDarkPower, bonusItems: g.config.bonusItems })}
      />
    );
  return <Title prefs={prefs} saved={saved} onContinue={() => {
        if (!saved) return;
        setStartAt(saved.log[saved.log.length - 1]?.n ?? 0);
        setGameKey((k) => k + 1);
        setGState(saved);
      }} onStart={start} />;
}

function Title({ prefs, saved, onContinue, onStart }: { prefs: Prefs; saved: GameState | null; onContinue: () => void; onStart: (c: Omit<GameConfig, 'seed'>) => void }) {
  const last = prefs.last ?? {};
  const [killer, setKiller] = useState(last.killer ?? FILMS[0].killer.id);
  const [location, setLocation] = useState(last.location ?? LOCATIONS[0].id);
  const [finalGirl, setFinalGirl] = useState(last.finalGirl ?? FILMS[0].finalGirls[0].id);
  const [board, setBoard] = useState<'normal' | 'extreme'>(last.board ?? 'normal');
  const [epic, setEpic] = useState(!!last.epicDarkPower);
  const [bonus, setBonus] = useState(!!last.bonusItems);
  const [rules, setRules] = useState(false);
  useEffect(() => {
    if (!KILLERS.some((k) => k.id === killer)) setKiller(FILMS[0].killer.id);
    if (!LOCATIONS.some((l) => l.id === location)) setLocation(LOCATIONS[0].id);
    if (!FINAL_GIRLS.some((f) => f.id === finalGirl)) setFinalGirl(FILMS[0].finalGirls[0].id);
  }, [killer, location, finalGirl]);

  const pickFilm = (id: string) => {
    const f = FILMS.find((x) => x.id === id)!;
    setKiller(f.killer.id);
    if (f.location) setLocation(f.location.id);
    setFinalGirl(f.finalGirls[0].id);
  };
  const film = FILMS.find((f) => f.killer.id === killer && (!f.location || f.location.id === location));

  return (
    <div className="app">
      <div className="title-screen">
        <div className="logo">Final Player</div>
        <div className="tagline">Survive the night. Save who you can. Kill the killer.</div>
        {saved && !saved.outcome ? (
          <button className="btn primary block" onClick={onContinue} type="button">
            Continue: {FINAL_GIRLS.find((f) => f.id === saved.config.finalGirl)?.name} vs {killerDef(saved.config.killer).name}, turn {saved.turn}
          </button>
        ) : null}

        <div className="section-title">Feature films</div>
        <div className="list">
          {FILMS.map((f) => (
            <button key={f.id} className={`film-card pick ${film?.id === f.id ? 'on' : ''}`} onClick={() => pickFilm(f.id)} type="button" style={{ display: 'block' }}>
              <h3>{f.name}</h3>
              <p>
                {f.location ? `${f.killer.name} at ${f.location.name}.` : `${f.killer.name}, in any location.`} {f.tagline}
              </p>
            </button>
          ))}
        </div>

        <div className="section-title">Killer</div>
        <div className="choice-grid">
          {KILLERS.map((k) => (
            <button key={k.id} className={`pick ${killer === k.id ? 'on' : ''}`} onClick={() => setKiller(k.id)} type="button">
              <Emblem name={k.icon} color={k.color} className="pick-icon" />
              <span>
                <b>{k.name}</b>
                <small>{k.invulnerable ? 'Can\'t be killed' : `${k.health} health`}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="section-title">Location</div>
        <div className="choice-grid">
          {LOCATIONS.map((l) => (
            <button key={l.id} className={`pick ${location === l.id ? 'on' : ''}`} onClick={() => setLocation(l.id)} type="button">
              <Emblem name={l.icon} color={l.accent} className="pick-icon" />
              <span>
                <b>{l.name}</b>
                <small>{l.zones.filter((z) => !z.hidden).length} spaces</small>
              </span>
            </button>
          ))}
        </div>

        <div className="section-title">Final Girl</div>
        <div className="choice-grid">
          {FINAL_GIRLS.map((f) => (
            <button key={f.id} className={`pick ${finalGirl === f.id ? 'on' : ''}`} onClick={() => setFinalGirl(f.id)} type="button">
              <span className="row" style={{ gap: 2, fontWeight: 700 }}>
                <Heart className="pick-icon" />
              </span>
              <span>
                <b>
                  {f.name} <span className="muted">{f.health}</span>
                </b>
                <small>{f.blurb}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="section-title">Difficulty</div>
        <div className="seg">
          <button className={board === 'normal' ? 'on' : ''} onClick={() => setBoard('normal')} type="button">
            Normal
          </button>
          <button className={board === 'extreme' ? 'on' : ''} onClick={() => setBoard('extreme')} type="button">
            Extreme Horror
          </button>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={epic} onChange={(e) => setEpic(e.target.checked)} />
          <span>
            Epic Dark Power <span className="muted">(the Kickstarter ones, nastier)</span>
          </span>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={bonus} onChange={(e) => setBonus(e.target.checked)} />
          <span>
            Signature items <span className="muted">(each Final Girl's own weapon hides in the item decks)</span>
          </span>
        </label>

        <button className="btn primary block" style={{ fontSize: 20, minHeight: 54 }} onClick={() => onStart({ killer, location, finalGirl, board, epicDarkPower: epic, bonusItems: bonus })} type="button">
          Start the night
        </button>
        <div className="row">
          <button className="btn grow" onClick={() => setRules(true)} type="button">
            How to play
          </button>
          {inLibrary ? (
            <button className="btn grow" onClick={backToLibrary} type="button">
              Back to the library
            </button>
          ) : null}
        </div>
        <p className="muted center" style={{ fontSize: 13 }}>
          A fan-made companion to Final Girl by Van Ryder Games. Not affiliated.
        </p>
      </div>
      {rules ? <RulesSheet onClose={() => setRules(false)} /> : null}
    </div>
  );
}
