import type { CSSProperties, ReactNode } from 'react';
import type { GameState } from '../../game';
import { card } from '../../game/content/core';
import { describe } from '../../game/engine/actionPhase';
import type { CardId, Effect, ItemDef } from '../../game/types';
import { cardGlyph, type Glyph } from '../film';
import { Boot, CardIcon, Eye, Hand, Heart, HeartBroken, Hourglass, Knife, Mask, Shield, StarsLabel, Wrench } from '../pieces/icons';

const GLYPH: Record<Glyph, (p: { className?: string }) => ReactNode> = {
  shield: Shield,
  knife: Knife,
  boot: Boot,
  eye: Eye,
  heart: Heart,
  wrench: Wrench,
  hourglass: Hourglass,
  card: CardIcon,
};

const sign = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

/** One effect as an icon + number. */
function Fx({ e, g }: { e: Effect; g?: GameState }) {
  switch (e.k) {
    case 'move':
      return (
        <span className="fx">
          <Boot />
          {e.n}
        </span>
      );
    case 'time':
      return (
        <span className="fx time">
          <Hourglass />
          {sign(e.n)}
        </span>
      );
    case 'horror':
      return (
        <span className="fx">
          <Mask />
          {sign(e.n)}
        </span>
      );
    case 'heal':
      return (
        <span className="fx blood">
          <Heart />
          {sign(e.n)}
        </span>
      );
    case 'lose':
      return (
        <span className="fx blood">
          <HeartBroken />
          {sign(-e.n)}
        </span>
      );
    case 'damage':
      return (
        <span className="fx">
          <Knife />
          {e.n}
        </span>
      );
    case 'search':
      return (
        <span className="fx">
          <Wrench />
          {e.n}
        </span>
      );
    case 'itemAny':
      return (
        <span className="fx">
          <Wrench />
          any
        </span>
      );
    case 'takeCard':
      return (
        <span className="fx">
          <CardIcon />
          +1
        </span>
      );
    case 'ignoreAttack':
      return (
        <span className="fx">
          <Shield />
          block
        </span>
      );
    case 'reduceAttack':
      return (
        <span className="fx">
          <Shield />
          −{e.n}
        </span>
      );
    case 'endAction':
      return <span className="tag">end</span>;
    case 'partials':
      return <span className="tag">3-4 count</span>;
    case 'bonusDice':
      return <span className="tag">+{e.n} die</span>;
    default:
      return <span className="fx txt">{describe(g as GameState, [e])}</span>;
  }
}

export function EffectLine({ list, g }: { list: Effect[]; g?: GameState }) {
  if (!list.length) return <span className="fx txt">nothing</span>;
  return (
    <span className="fxline">
      {list.map((e, i) => (
        <Fx key={i} e={e} g={g} />
      ))}
    </span>
  );
}

export interface Row {
  stars: number;
  plus: boolean;
  lines: Effect[][];
}

export function rowsOf(id: CardId): Row[] {
  const r = card(id).results;
  if (!r) return [];
  const out: Row[] = [];
  if (r.triple) out.push({ stars: 3, plus: true, lines: r.triple });
  out.push({ stars: 2, plus: !r.triple, lines: r.double });
  out.push({ stars: 1, plus: false, lines: r.single });
  out.push({ stars: 0, plus: false, lines: r.fail });
  return out;
}

export function matchRow(id: CardId, s: number): number {
  const r = card(id).results;
  if (!r) return -1;
  if (r.triple) return s >= 3 ? 0 : s === 2 ? 1 : s === 1 ? 2 : 3;
  return s >= 2 ? 0 : s === 1 ? 1 : 2;
}

interface ActionCardProps {
  id: CardId;
  size?: 'hand' | 'big' | 'mid';
  sel?: boolean;
  off?: boolean;
  marked?: boolean;
  hover?: boolean;
  hit?: number;
  costOverride?: number;
  count?: number;
  g?: GameState;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
  btnRef?: (el: HTMLButtonElement | null) => void;
  notNow?: string;
}

/** An action card: a coloured spine (icon, vertical name, cost) and a face with its result rows. */
export function ActionCard({ id, size = 'hand', sel, off, marked, hover, hit = -1, costOverride, count, g, onClick, style, className, btnRef, notNow }: ActionCardProps) {
  const c = card(id);
  const G = GLYPH[cardGlyph(id)];
  const cost = costOverride ?? c.cost;
  const rows = rowsOf(id);
  const cls = ['acard', size !== 'hand' ? size : '', sel ? 'sel' : '', off ? 'off' : '', marked ? 'marked' : '', hover ? 'hover' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} data-timing={c.timing} onClick={onClick} style={style} ref={btnRef} aria-pressed={sel} aria-label={`${c.name}. ${c.text}`}>
      <span className="spine">
        <G className="sg" />
        <span className="vname">{c.name}</span>
        <span className={`cost${cost === 0 ? ' zero' : ''}`}>{cost}</span>
      </span>
      <span className="face">
        <span className="title">{c.name}</span>
        {size === 'big' ? <span className="ctag">{c.timing === 'reaction' ? 'Reaction' : c.timing === 'afterRoll' ? 'After a roll' : 'Action'}</span> : null}
        {rows.length ? (
          rows.map((r, i) => (
            <span key={i} className={`row${hit === i ? ' hit' : ''}`}>
              <span className="lbl">
                <StarsLabel n={r.stars} />
              </span>
              <span className="lines">
                {r.lines.map((ln, j) => (
                  <span key={j} className="ln">
                    {j > 0 ? <span className="or">or</span> : null}
                    <EffectLine list={ln} g={g} />
                  </span>
                ))}
              </span>
            </span>
          ))
        ) : (
          <span className="ctext">{c.text}</span>
        )}
      </span>
      {count !== undefined ? <span className="count">×{count}</span> : null}
      {marked ? (
        <svg className="xmark" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4L20 20M20 4L4 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      ) : null}
      {notNow ? <span className="notnow">{notNow}</span> : null}
    </button>
  );
}

export type RevealKind = 'terror' | 'minor' | 'event' | 'darkPower' | 'finale' | 'item';

const BAND: Record<RevealKind, string> = {
  terror: 'Terror',
  minor: 'Minor Dark Power',
  event: 'Event',
  darkPower: 'Dark Power',
  finale: 'The Finale',
  item: 'Item',
};

/** A big card face, for reveals and inspection. */
export function RevealCard({ kind, title, text, band, item, className }: { kind: RevealKind; title: string; text: string; band?: string; item?: ItemDef; className?: string }) {
  return (
    <div className={`reveal-card k-${kind} ${className ?? ''}`}>
      <div className="band">{band ?? BAND[kind]}</div>
      <div className="rc-title">{title}</div>
      {item ? <ItemStats it={item} /> : null}
      <div className="rc-text">{text}</div>
    </div>
  );
}

export function ItemStats({ it }: { it: ItemDef }) {
  return (
    <div className="istats">
      {it.hands ? (
        <span className="ist">
          {Array.from({ length: it.hands }, (_, i) => (
            <Hand key={i} />
          ))}
        </span>
      ) : (
        <span className="ist">no hands</span>
      )}
      {it.range ? <span className="ist">range {it.range[0] === it.range[1] ? it.range[0] : `${it.range[0]}-${it.range[1]}`}</span> : null}
      {it.damage ? <span className="ist">+{it.damage} dmg</span> : null}
      {it.uses ? <span className="ist">×{it.uses} uses</span> : null}
    </div>
  );
}

/** A kraft item card. */
export function ItemCard({ it, uses, sel, onClick, small, children }: { it: ItemDef; uses?: number; sel?: boolean; onClick?: () => void; small?: boolean; children?: ReactNode }) {
  return (
    <div className={`icard${sel ? ' sel' : ''}${small ? ' small' : ''}`} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="ic-band">
        <Wrench />
        Item
      </div>
      <div className="ic-title">{it.name}</div>
      <ItemStats it={uses !== undefined ? { ...it, uses } : it} />
      <div className="ic-text">{it.text}</div>
      {children}
    </div>
  );
}
