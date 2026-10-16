// A sheet of printed stock slid over the table: a bottom sheet in portrait, a
// side sheet on a landscape phone. Drag the grabber (or the title row) to
// dismiss it, tap the scrim, press the close chit or Escape.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { Close } from '../pieces/icons';

export interface SheetProps {
  title: string;
  onClose: () => void;
  /** Stock the sheet is printed on. */
  tone?: 'bone' | 'black' | 'paper' | 'kraft';
  children: ReactNode;
  /** Optional element shown at the right of the title row. */
  aside?: ReactNode;
}

export interface SheetFrameProps extends SheetProps {
  /** 'auto': only as tall as its content, at most 60% of the screen in portrait (the Zone sheet). */
  fit?: 'tall' | 'auto';
  /** A wider side sheet in landscape (the Rules pager). */
  wide?: boolean;
  /** Open scrolled to the end (the Log). */
  startAtEnd?: boolean;
  /** false: the body doesn't scroll itself (its content manages scrolling). */
  scroll?: boolean;
  className?: string;
}

const CLOSE_MS = 240;

const reducedMotion = (): boolean => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export function Sheet(props: SheetProps) {
  return <SheetFrame {...props} />;
}

export function SheetFrame({ title, onClose, tone = 'bone', children, aside, fit = 'tall', wide, startAtEnd, scroll = true, className }: SheetFrameProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const timer = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onCloseRef.current(), reducedMotion() ? 0 : CLOSE_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Escape closes; focus moves into the sheet so keyboard and VoiceOver land here.
  useEffect(() => {
    sheetRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  // Everything behind the sheet goes inert while it's open (the game, the end screen…).
  useLayoutEffect(() => {
    const layer = layerRef.current;
    const parent = layer?.parentElement;
    if (!layer || !parent) return;
    const made: Element[] = [];
    for (const el of Array.from(parent.children)) {
      if (el === layer || el.classList.contains('sheet-layer') || el.hasAttribute('inert')) continue;
      if (el instanceof SVGElement && el.getAttribute('aria-hidden') === 'true') continue;
      el.setAttribute('inert', '');
      made.push(el);
    }
    return () => made.forEach((el) => el.removeAttribute('inert'));
  }, []);

  useLayoutEffect(() => {
    const b = bodyRef.current;
    if (startAtEnd && b) b.scrollTop = b.scrollHeight;
  }, [startAtEnd]);

  // drag to dismiss
  const drag = useRef<{ id: number; x: number; y: number; axis: string; d: number; t: number; v: number; size: number; moved: boolean } | null>(null);
  const setDrag = (px: number | null, size = 1) => {
    const s = sheetRef.current;
    const l = layerRef.current;
    if (!s || !l) return;
    if (px === null) {
      s.style.removeProperty('--drag');
      l.style.removeProperty('--p');
      return;
    }
    s.style.setProperty('--drag', `${px}px`);
    l.style.setProperty('--p', String(Math.max(0, Math.min(1, px / size))));
  };
  const onGripDown = (e: RPointerEvent<HTMLElement>) => {
    if (closingRef.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if ((e.target as Element).closest('button, a, input, summary, select, textarea')) return;
    const s = sheetRef.current;
    if (!s) return;
    const axis = getComputedStyle(s).getPropertyValue('--axis').trim() || 'y';
    const size = axis === 'y' ? s.offsetHeight : s.offsetWidth;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, axis, d: 0, t: e.timeStamp, v: 0, size, moved: false };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // capture isn't essential
    }
  };
  const onGripMove = (e: RPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const raw = d.axis === 'y' ? e.clientY - d.y : d.axis === '-x' ? d.x - e.clientX : e.clientX - d.x;
    if (!d.moved && Math.abs(raw) < 4) return;
    if (!d.moved) {
      d.moved = true;
      sheetRef.current?.classList.add('dragging');
      layerRef.current?.classList.add('dragging');
    }
    // pulling the wrong way only gives a little (rubber band)
    const px = raw < 0 ? -Math.pow(-raw, 0.7) : raw;
    const dt = Math.max(1, e.timeStamp - d.t);
    d.v = 0.6 * ((px - d.d) / dt) + 0.4 * d.v;
    d.d = px;
    d.t = e.timeStamp;
    setDrag(px, d.size);
  };
  const onGripUp = (e: RPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    sheetRef.current?.classList.remove('dragging');
    layerRef.current?.classList.remove('dragging');
    if (!d.moved) return;
    const flick = d.v > 0.5 && d.d > 12;
    if (e.type === 'pointerup' && (d.d > d.size * 0.25 || flick)) close();
    else setDrag(null);
  };
  const grip = { onPointerDown: onGripDown, onPointerMove: onGripMove, onPointerUp: onGripUp, onPointerCancel: onGripUp };

  const cls = ['sheet', `tone-${tone}`, fit === 'auto' ? 'fit-auto' : '', wide ? 'wide' : '', closing ? 'closing' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <div className={`sheet-layer${closing ? ' closing' : ''}`} ref={layerRef}>
      <div className="sheet-scrim" onClick={close} aria-hidden="true" />
      <section className={cls} ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="sheet-gutter" {...grip} aria-hidden="true">
          <span className="grabber" />
        </div>
        <header className="sheet-top" {...grip}>
          <span className="grabber" aria-hidden="true" />
          <div className="sheet-head">
            <h3 id={titleId} className="sheet-title">
              {title}
            </h3>
            {aside ? <div className="sheet-aside">{aside}</div> : null}
            <button className="chit sheet-close" type="button" onClick={close} aria-label="Close">
              <Close />
            </button>
          </div>
        </header>
        <div className={`sheet-body${scroll ? ' scroll-y' : ''}`} ref={bodyRef}>
          {children}
        </div>
      </section>
    </div>
  );
}
