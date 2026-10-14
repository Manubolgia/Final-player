import { card } from '../../game/content/core';
import { Hourglass } from '../art/Icons';

export function ActionCard({
  id,
  onClick,
  sel,
  off,
  count,
  costOverride,
}: {
  id: string;
  onClick?: () => void;
  sel?: boolean;
  off?: boolean;
  count?: number;
  costOverride?: number;
}) {
  const c = card(id);
  const cls = ['acard', c.timing === 'reaction' ? 'react' : c.timing === 'afterRoll' ? 'after' : '', sel ? 'sel' : '', off ? 'off' : ''].join(' ');
  return (
    <button className={cls} onClick={onClick} type="button" aria-pressed={sel}>
      <span className="cname">{c.name}</span>
      <span className="ctext">{short(c.text)}</span>
      <span className="cost">
        <Hourglass color="#1b4a63" />
        {costOverride ?? c.cost}
      </span>
      {count !== undefined ? <span className="count">×{count}</span> : null}
    </button>
  );
}

/** Card text squeezed for a small card. */
function short(t: string): string {
  return t.length > 120 ? `${t.slice(0, 117)}…` : t;
}

export type BigKind = 'terror' | 'event' | 'darkPower' | 'finale' | 'item' | 'action' | 'minor';

export function BigCard({ kind, title, text, sub }: { kind: BigKind; title: string; text: string; sub?: string }) {
  const label = { terror: 'Terror', event: 'Event', darkPower: 'Dark Power', finale: 'Finale', item: 'Item', action: 'Action', minor: 'Minor Dark Power' }[kind];
  return (
    <div className={`bigcard ${kind === 'minor' ? 'darkPower' : kind}`}>
      <div className="kind">{label}</div>
      <h2>{title}</h2>
      <p>{text}</p>
      {sub ? <p style={{ marginTop: 8, opacity: 0.8, fontSize: 15 }}>{sub}</p> : null}
    </div>
  );
}
