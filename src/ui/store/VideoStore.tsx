// The title screen: a late-night video store. Six tapes on the horror shelf,
// a VCR holding the night you paused, and the box back to set up a new one.

import { useEffect, useRef, useState } from 'react';
import type { GameConfig, GameState } from '../../game';
import { BONUS_ITEMS, FILMS } from '../../game/content';
import type { FilmDef } from '../../game/types';
import type { Prefs } from '../persistence';
import { backToLibrary, inLibrary } from '../library';
import { Close, Play, Question, Rotate, Share } from '../pieces/icons';
import { haptic } from '../fx/haptics';
import { sfx } from '../fx/sound';
import { SheetFrame } from '../sheets/Sheet';
import { RulesSheet } from '../sheets';
import { BoxBack } from './BoxBack';
import { MixSheet } from './MixSheet';
import { Spine } from './Spine';
import { WIDE, filmBill, filmIdFor, firstBill, girlOf, killerOf, useMedia, type Bill } from './bits';

export { filmIdFor } from './bits';

export interface VideoStoreProps {
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  saved: GameState | null;
  onContinue: () => void;
  onStart: (cfg: Omit<GameConfig, 'seed'>) => void;
}

type Open = null | 'box' | 'mix' | 'rules';

const DISCLAIMER = 'Fan-made, unofficial. Final Girl \u00a9 Van Ryder Games.';

/** iPhone or iPad in a browser tab (not yet added to the Home Screen). */
function iosTab(): boolean {
  try {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = (navigator as unknown as { standalone?: boolean }).standalone === true || matchMedia('(display-mode: standalone)').matches;
    return ios && !standalone;
  } catch {
    return false;
  }
}

export function VideoStore({ prefs, setPrefs, saved, onContinue, onStart }: VideoStoreProps) {
  const wide = useMedia(WIDE);
  const [bill, setBill] = useState<Bill>(() => firstBill(prefs.last));
  const [board, setBoard] = useState<'normal' | 'extreme'>(prefs.last?.board === 'extreme' ? 'extreme' : 'normal');
  const [epic, setEpic] = useState(!!prefs.last?.epicDarkPower);
  const [bonus, setBonus] = useState(!!prefs.last?.bonusItems);
  const [open, setOpen] = useState<Open>(null);
  const [coach] = useState(iosTab);
  /** Each tape remembers how you set it up while you browse the shelf. */
  const memory = useRef<Record<string, Bill>>({});

  // The box back lives in the right panel in landscape: no sheet needed.
  useEffect(() => {
    if (wide && open === 'box') setOpen(null);
  }, [wide, open]);

  const rented = filmIdFor(prefs.last ?? {});
  const resume = saved && !saved.outcome ? saved : null;
  const showCoach = coach && !inLibrary && !prefs.seenInstall;

  const pick = (f: FilmDef) => {
    sfx.slap();
    if (bill.film !== f.id) {
      memory.current[bill.film ?? ''] = bill;
      setBill(memory.current[f.id] ?? filmBill(f, { location: prefs.last?.location }));
    }
    if (!wide) setOpen('box');
  };

  const start = () => {
    sfx.slap();
    const k = killerOf(bill.killer);
    const hasEpic = k.darkPowers.some((d) => d.epic);
    const hasSig = BONUS_ITEMS.some((i) => i.onlyFor === bill.finalGirl);
    onStart({
      killer: bill.killer,
      location: bill.location,
      finalGirl: bill.finalGirl,
      board,
      epicDarkPower: epic && hasEpic,
      bonusItems: bonus && hasSig,
    });
  };

  const box = {
    bill,
    board,
    epic,
    bonus,
    setBill,
    setBoard,
    setEpic,
    setBonus,
    onStart: start,
  };
  const film = bill.film ? FILMS.find((f) => f.id === bill.film) : undefined;

  const openMix = () => {
    sfx.key();
    setOpen('mix');
  };
  const dismissCoach = () => {
    sfx.sticker();
    setPrefs({ ...prefs, seenInstall: true });
  };
  const openRules = () => {
    sfx.key();
    setOpen('rules');
  };

  return (
    <div className={`app store${wide ? ' wide' : ''}`}>
      <div className="vs-floor scroll-y">
        <div className="vs-front">
          <header className="vs-top">
            <div className="vs-brand">
              <h1 className="logo">Final Player</h1>
              <span className="sticker vs-fan">Fan-made</span>
            </div>
            <button type="button" className="chit vs-help" aria-label="How to play" onClick={openRules}>
              <Question />
            </button>
          </header>

          {showCoach && !wide ? <Coach onDismiss={dismissCoach} /> : null}

          {resume && !wide ? <Vcr g={resume} onContinue={onContinue} /> : null}

          <div className="vs-shelf">
            <div className="vs-aisle">
              <span className="vs-aisle-tag">Horror</span>
              <span className="vs-aisle-note">{FILMS.length} tapes · 1 night</span>
            </div>
            <div className="vs-spines" role="group" aria-label="Films">
              {FILMS.map((f, i) => (
                <Spine key={f.id} film={f} n={i + 1} on={bill.film === f.id} rented={rented === f.id} fresh={!prefs.played.includes(f.id)} onPick={() => pick(f)} />
              ))}
            </div>
            {wide ? (
              <div className="vs-plank">
                <p className="vs-plank-lbl">{DISCLAIMER}</p>
              </div>
            ) : (
              <div className="vs-plank" aria-hidden="true" />
            )}
          </div>

          {!wide && !prefs.seenSideways && !showCoach ? (
            <div className="vs-sideways">
              <span className="sticker yellow">
                <Rotate className="ico" /> Best played sideways
              </span>
              <button
                type="button"
                className="chit vs-x"
                aria-label="Dismiss"
                onClick={() => {
                  sfx.sticker();
                  setPrefs({ ...prefs, seenSideways: true });
                }}
              >
                <Close />
              </button>
            </div>
          ) : null}

          {wide ? (
            <div className="vs-keys">
              {resume ? (
                <Vcr g={resume} onContinue={onContinue} />
              ) : (
                <>
                  <button type="button" className="btn" onClick={openRules}>
                    How to play
                  </button>
                  {showCoach ? <Coach compact onDismiss={dismissCoach} /> : inLibrary ? null : <span className="vs-aisle-note">{FILMS.length} tapes · 1 night</span>}
                </>
              )}
              {/* narrow landscape phones: the box back has no room for this key */}
              <button type="button" className="btn vs-mix-alt" onClick={openMix}>
                Mix &amp; match
              </button>
              {inLibrary ? (
                <button type="button" className="btn small dark vs-lib" onClick={backToLibrary}>
                  Back to the library
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="vs-keys">
                <button type="button" className={`btn${film ? '' : ' purple'}`} onClick={openMix}>
                  Mix &amp; match
                </button>
                <button type="button" className="btn" onClick={openRules}>
                  How to play
                </button>
              </div>
              <footer className="vs-foot">
                <p>{DISCLAIMER}</p>
                {inLibrary ? (
                  <button type="button" className="btn small dark" onClick={backToLibrary}>
                    Back to the library
                  </button>
                ) : null}
              </footer>
            </>
          )}
        </div>

        {wide ? (
          <div className="vs-back">
            <BoxBack {...box} onMix={openMix} />
          </div>
        ) : null}
      </div>

      {open === 'box' && !wide ? (
        <SheetFrame title={film ? film.name : 'Custom bill'} tone="bone" scroll={false} className="vs-sheet" onClose={() => setOpen(null)}>
          <BoxBack {...box} inSheet />
        </SheetFrame>
      ) : null}
      {open === 'mix' ? (
        <MixSheet
          bill={bill}
          onClose={() => setOpen(null)}
          onUse={(b) => {
            setBill(b);
            setOpen(wide ? null : 'box');
          }}
        />
      ) : null}
      {open === 'rules' ? <RulesSheet onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

/** How to install on iOS: a paper note taped to the table (a slip in the key row in landscape). */
function Coach({ compact, onDismiss }: { compact?: boolean; onDismiss: () => void }) {
  return (
    <div className={`vs-coach${compact ? ' compact' : ''}`} role="note">
      <span className="vs-coach-ico">
        <Share />
      </span>
      {compact ? (
        <p>
          <b>Install:</b> tap Share, then Add to Home Screen.
        </p>
      ) : (
        <p>
          <b>Add to Home Screen:</b> tap Share, then Add to Home Screen.
        </p>
      )}
      <button type="button" className="chit vs-x" aria-label="Dismiss" onClick={onDismiss}>
        <Close />
      </button>
    </div>
  );
}

/** The VCR with tonight's tape still in it. */
function Vcr({ g, onContinue }: { g: GameState; onContinue: () => void }) {
  const girl = girlOf(g.config.finalGirl).name.toUpperCase();
  const killer = killerOf(g.config.killer).name.replace(/^The /, '').toUpperCase();
  return (
    <button
      type="button"
      className="vs-vcr"
      ref={haptic}
      onClick={() => {
        sfx.whir();
        onContinue();
      }}
    >
      <span className="vs-vcr-play">
        <Play className="ico" />
      </span>
      <span className="vs-vcr-lbl">
        Continue
        <span className="vs-vcr-slot" aria-hidden="true" />
      </span>
      <span className="vs-vcr-lcd">
        <span className="t num">T{String(g.turn).padStart(2, '0')}</span>
        <span className="who">
          {girl} vs {killer}
        </span>
      </span>
    </button>
  );
}
