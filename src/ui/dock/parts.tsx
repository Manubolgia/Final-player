import type { ReactNode } from 'react';
import { haptic } from '../fx/haptics';
import { sfx } from '../fx/sound';

export function Tray({ title, meta, children, keys, merged, mode }: { title: ReactNode; meta?: ReactNode; children?: ReactNode; keys?: ReactNode; merged?: boolean; mode?: string }) {
  return (
    <div className={`tray${merged ? ' merged' : ''}`} data-mode={mode}>
      <div className="tray-head">
        <h4>{title}</h4>
        {meta ? <span className="meta">{meta}</span> : null}
      </div>
      <div className="tray-area">{children}</div>
      {merged ? null : <div className="keys">{keys}</div>}
    </div>
  );
}

type KeyKind = 'primary' | 'good' | 'dark' | 'purple' | 'plain';

export function Key({
  kind = 'plain',
  small,
  onClick,
  disabled,
  sub,
  glyph,
  children,
  label,
  className,
  grow,
}: {
  kind?: KeyKind;
  small?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  sub?: ReactNode;
  glyph?: ReactNode;
  children?: ReactNode;
  label?: string;
  className?: string;
  grow?: boolean;
}) {
  const cls = ['btn', kind !== 'plain' ? kind : '', small ? 'small' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      className={cls}
      disabled={disabled}
      aria-label={label}
      style={grow ? { flex: 1 } : undefined}
      ref={kind === 'primary' ? haptic : undefined}
      onClick={() => {
        if (kind === 'primary') sfx.slap();
        else sfx.key();
        onClick?.();
      }}
    >
      <span className="row1">
        {children}
        {glyph}
      </span>
      {sub ? <span className="sub">{sub}</span> : null}
    </button>
  );
}
