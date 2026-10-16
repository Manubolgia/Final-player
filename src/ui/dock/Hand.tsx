import { useLayoutEffect, useRef, useState } from 'react';
import type { CardId } from '../../game/types';
import { ActionCard } from '../cards/Cards';
import { sfx } from '../fx/sound';

interface Props {
  cards: CardId[];
  /** Index of the lifted card. */
  sel?: number | null;
  marked?: number[];
  off?: (c: CardId, i: number) => boolean;
  onPick?: (i: number) => void;
  /** Reference only: no interaction. */
  passive?: boolean;
  dim?: boolean;
}

/** The hand: an overlapping fan that always fits; slide a finger along it to pick. */
export function Hand({ cards, sel = null, marked = [], off, onPick, passive, dim }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<number | null>(null);
  const scrub = useRef<{ id: number; moved: boolean; x: number } | null>(null);
  const suppress = useRef(0);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const set = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = cards.length;
  // leave headroom so a picked-up card lifts without covering the tray's title
  const cw = Math.max(76, Math.min(126, Math.floor(((dims.h - 14) * 63) / 88)));
  const ch = Math.round((cw * 88) / 63);
  const W = dims.w;
  const step = n > 1 ? Math.min(cw + 6, (W - cw) / (n - 1)) : 0;
  const total = n > 1 ? step * (n - 1) + cw : cw;
  const left0 = Math.max(0, (W - total) / 2);
  const mid = (n - 1) / 2;

  const indexAt = (clientX: number): number | null => {
    const el = box.current;
    if (!el || !n) return null;
    const x = clientX - el.getBoundingClientRect().left - left0;
    if (x < 0 || x > total) return null;
    // the card whose visible strip is under the finger (later cards cover earlier ones)
    for (let i = n - 1; i >= 0; i--) if (x >= i * step) return i;
    return 0;
  };

  const down = (e: React.PointerEvent) => {
    if (passive) return;
    const i = indexAt(e.clientX);
    scrub.current = { id: e.pointerId, moved: false, x: e.clientX };
    setHover(i);
    if (i !== null) sfx.lift();
  };
  const move = (e: React.PointerEvent) => {
    const s = scrub.current;
    if (!s || s.id !== e.pointerId) return;
    if (Math.abs(e.clientX - s.x) > 6) s.moved = true;
    const i = indexAt(e.clientX);
    if (i !== hover) {
      setHover(i);
      if (i !== null) sfx.lift();
    }
  };
  const up = (e: React.PointerEvent) => {
    const s = scrub.current;
    scrub.current = null;
    setHover(null);
    if (!s || s.id !== e.pointerId) return;
    const i = indexAt(e.clientX);
    if (i === null) return;
    suppress.current = performance.now();
    onPick?.(i);
  };

  return (
    <div
      className={`hand${passive ? ' passive' : ''}${dim ? ' dim' : ''}${step < cw * 0.8 ? ' tight' : ''}`}
      ref={box}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => {
        scrub.current = null;
        setHover(null);
      }}
      style={{ ['--cw' as string]: `${cw}px` }}
    >
      {cards.map((c, i) => {
        const rot = (i - mid) * 0.6;
        const dy = Math.abs(i - mid) * 1.5;
        return (
          <ActionCard
            key={`${c}-${i}`}
            id={c}
            sel={sel === i}
            hover={hover === i && sel !== i}
            marked={marked.includes(i)}
            off={off?.(c, i)}
            style={{ position: 'absolute', left: left0 + i * step, top: Math.max(0, dims.h - ch - 2) + dy - Math.abs(mid) * 1.5, rotate: `${rot}deg`, ['--cw' as string]: `${cw}px`, zIndex: sel === i ? 30 : hover === i ? 20 : i }}
            onClick={() => {
              // keyboard / synthetic clicks; real taps were handled by the scrub
              if (passive || performance.now() - suppress.current < 400) return;
              onPick?.(i);
            }}
          />
        );
      })}
      {!n ? <p className="hint empty-hand">No cards in hand.</p> : null}
    </div>
  );
}
