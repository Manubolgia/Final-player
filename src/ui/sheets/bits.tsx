// Small printed pieces shared by the sheets.

import { Fragment, type ReactNode } from 'react';
import type { Effect, KillerActionDef } from '../../game/types';
import { Boot, Heart, HeartBroken, HeartOutline, Knife } from '../pieces/icons';

/** The step chevron the cards print between steps ("nearest > move > attack"). */
export function Chev({ className = 'chev' }: { className?: string }) {
  return (
    <svg viewBox="0 0 8 12" className={className} aria-hidden="true" focusable="false">
      <path d="M1.5 1.2L7 6l-5.5 4.8z" fill="currentColor" />
    </svg>
  );
}

const STEP = '\u25B8'; // the step marker in the content text

/** Rules text from the content files, with its step markers printed as chevrons. */
export function Rich({ text }: { text: string }) {
  if (!text.includes(STEP)) return <>{text}</>;
  const parts = text.split(STEP);
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i ? (
            <>
              <Chev />
              <span className="sr-only">then</span>
            </>
          ) : null}
          {p}
        </Fragment>
      ))}
    </>
  );
}

/** A section heading printed on the sheet: Anton label, an ink rule, and an optional count on the right. */
export function Head({ icon, children, right }: { icon?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <h4 className="sh">
      {icon}
      <span className="sh-t">{children}</span>
      <span className="sh-rule" aria-hidden="true" />
      {right != null ? <span className="sh-r">{right}</span> : null}
    </h4>
  );
}

/** Hearts: filled up to hp, outlines after. Big totals collapse to one heart and a numeral. */
export function Hearts({ hp, max, label }: { hp: number; max: number; label?: string }) {
  const aria = label ?? `${hp} of ${max} health`;
  if (max > 7)
    return (
      <span className="hearts big" role="img" aria-label={aria}>
        <Heart className="ico" />
        <b className="num">{hp}</b>
        <span className="of">/{max}</span>
      </span>
    );
  return (
    <span className="hearts" role="img" aria-label={aria}>
      {Array.from({ length: max }, (_, i) => (i < hp ? <Heart key={i} className="ico on" /> : <HeartOutline key={i} className="ico" />))}
    </span>
  );
}

/** The Final Health token: a black coin with a heart while face down, a spent white one after. */
export function FinalCoin({ tok, who }: { tok: 'black' | 'white'; who: string }) {
  return (
    <span
      className={`coin fh ${tok}`}
      role="img"
      aria-label={tok === 'black' ? `${who}'s Final Health token, still face down` : `${who} already came back once`}
    >
      {tok === 'black' ? <Heart className="fh-i" /> : <HeartBroken className="fh-i" />}
    </span>
  );
}

/** Health pips (minions, Minor Dark Powers). */
export function Pips({ n, max, tone = 'blood' }: { n: number; max: number; tone?: 'blood' | 'ink' }) {
  return (
    <span className={`pips ${tone}`} role="img" aria-label={`${n} of ${max} health`}>
      {Array.from({ length: Math.max(max, n) }, (_, i) => (
        <i key={i} className={i < n ? 'on' : ''} />
      ))}
    </span>
  );
}

const PIPS: Record<number, [number, number][]> = {
  1: [[12, 12]],
  2: [[7.5, 7.5], [16.5, 16.5]],
  3: [[7, 7], [12, 12], [17, 17]],
  4: [[7.5, 7.5], [16.5, 7.5], [7.5, 16.5], [16.5, 16.5]],
  5: [[7, 7], [17, 7], [12, 12], [7, 17], [17, 17]],
  6: [[7.5, 6.5], [16.5, 6.5], [7.5, 12], [16.5, 12], [7.5, 17.5], [16.5, 17.5]],
};

/** A small red panic die showing pips. */
export function PipDie({ n }: { n: number }) {
  return (
    <span className="die xs pipdie" role="img" aria-label={String(n)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {PIPS[n]?.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.3} fill="currentColor" />)}
      </svg>
    </span>
  );
}

/** A small card back / face thumbnail (63:88). */
export type ThumbKind = 'terror' | 'event' | 'darkPower' | 'darkPowerUp' | 'finale' | 'finaleUp' | 'minor' | 'item' | 'action';
export function Thumb({ kind, label }: { kind: ThumbKind; label?: string }) {
  return (
    <span className={`thumb t-${kind}`} aria-hidden="true">
      {kind === 'terror' ? <span className="slash" /> : null}
      {kind === 'darkPower' || kind === 'darkPowerUp' || kind === 'minor' ? <span className="diamond" /> : null}
      {label ? <span className="tl">{label}</span> : null}
    </span>
  );
}

// ---------- the Killer's action, as printed steps ----------

const TARGET: Record<KillerActionDef['target'], string> = {
  victim: 'Closest victim',
  finalGirl: 'Final Girl',
  nearest: 'Nearest',
  victimElseFG: 'Closest victim (else you)',
  farthestVictim: 'Farthest victim',
};

export const CUSTOM_LABEL: Record<string, string> = {
  'tb.spawn': 'Spawn birds',
  'tb.attack': 'The birds attack',
  'gp.spawn': 'A Puppet comes out',
  'gr.initialWrath': 'Killer Wrath +1 if it is 1–2',
  'cm.toYou': 'Appears in your space',
  'cm.lostDraw': 'Draw a Terror card (none left: you lose)',
  'df.killTwo': '2 victims of your choice die',
};

export type Step = { k: 'target'; text: string } | { k: 'who'; text: string } | { k: 'move' } | { k: 'attack' } | { k: 'text'; text: string };

/** One printed line per effect of the action list. */
export function actionLines(list: Effect[], names: { killer: string; minions?: string }): Step[][] {
  return list.map((e): Step[] => {
    switch (e.k) {
      case 'killer': {
        const a = e.a;
        const out: Step[] = [];
        if (names.minions && a.actor === 'minions') out.push({ k: 'who', text: names.minions });
        else if (names.minions && a.actor === 'killer') out.push({ k: 'who', text: names.killer });
        out.push({ k: 'target', text: TARGET[a.target] });
        const moves: Step[] = Array.from({ length: a.moves }, () => ({ k: 'move' as const }));
        const atks: Step[] = Array.from({ length: a.attacks }, () => ({ k: 'attack' as const }));
        out.push(...(a.attackFirst ? [...atks, ...moves] : [...moves, ...atks]));
        if (a.killAlong) out.push({ k: 'text', text: 'kills along the way' });
        return out;
      }
      case 'bloodlust':
        return [{ k: 'text', text: `+${e.n} Bloodlust` }];
      case 'horror':
        return [{ k: 'text', text: `${e.n > 0 ? '+' : ''}${e.n} Horror` }];
      case 'killerHeal':
        return [{ k: 'text', text: `${names.killer} heals ${e.n}` }];
      case 'event':
        return [{ k: 'text', text: 'Draw an Event' }];
      case 'terror':
        return [{ k: 'text', text: 'Draw a Terror card' }];
      case 'unleash':
        return [{ k: 'text', text: `Unleash the ${e.which === 'killer' ? 'Killer' : 'Divine'} Wrath` }];
      case 'wrath':
        return [{ k: 'text', text: `${e.which === 'divine' ? 'Divine' : 'Killer'} Wrath ${e.op === 'reduce' ? '−' : '+'}${e.n ?? ''}`.trim() }];
      case 'custom':
        return [{ k: 'text', text: CUSTOM_LABEL[e.id.split(':')[0]] ?? 'Special' }];
      default:
        return [{ k: 'text', text: e.k }];
    }
  });
}

/** Plain words for the same thing (screen readers, tests). */
export function describeAction(list: Effect[], names: { killer: string; minions?: string }): string {
  return (
    actionLines(list, names)
      .map((line) =>
        line
          .map((s) => (s.k === 'move' ? 'move' : s.k === 'attack' ? 'attack' : s.k === 'who' ? `${s.text}:` : s.text))
          .join(' '),
      )
      .join('; ') || 'Nothing'
  );
}

/** The action printed as chips with chevrons. */
export function ActionSteps({ list, names }: { list: Effect[]; names: { killer: string; minions?: string } }) {
  const lines = actionLines(list, names);
  if (!lines.length) return <p className="ka-none">No action of his own.</p>;
  return (
    <ol className="ka-lines" aria-label={describeAction(list, names)}>
      {lines.map((line, i) => (
        <li key={i} className="ka-line" aria-hidden="true">
          {line.map((s, j) => (
            <Fragment key={j}>
              {j && line[j - 1].k !== 'who' ? <Chev /> : null}
              {s.k === 'move' ? (
                <span className="step mv">
                  <Boot /> Move
                </span>
              ) : s.k === 'attack' ? (
                <span className="step at">
                  <Knife /> Attack
                </span>
              ) : s.k === 'target' ? (
                <span className="step tg">{s.text}</span>
              ) : s.k === 'who' ? (
                <span className="step who">{s.text}</span>
              ) : (
                <span className="step tx">{s.text}</span>
              )}
            </Fragment>
          ))}
        </li>
      ))}
    </ol>
  );
}

/** Short words for a list of effects ("+1 Horror", "Draw an Event"). */
export function effectWords(list: Effect[] | undefined, names: { killer: string; minions?: string }): string[] {
  if (!list?.length) return [];
  return actionLines(list, names).map((line) => line.map((s) => (s.k === 'move' ? 'move' : s.k === 'attack' ? 'attack' : s.text)).join(' '));
}

/** "the Butcher" -> "The Butcher". */
export const cap = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);
