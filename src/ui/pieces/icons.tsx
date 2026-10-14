// Every icon is flat ink in currentColor, so it takes the colour of the piece
// it's printed on. Decorative by default (aria-hidden).

import type { JSX } from 'react';

type P = { className?: string; title?: string; style?: React.CSSProperties };

const S = ({ className = 'ico', title, style, children, vb = '0 0 24 24' }: P & { children: JSX.Element | JSX.Element[]; vb?: string }) => (
  <svg viewBox={vb} className={className} style={style} aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} focusable="false">
    {title ? <title>{title}</title> : null}
    {children}
  </svg>
);
const F = (d: string) => (p: P) => (
  <S {...p}>
    <path fill="currentColor" d={d} />
  </S>
);

export const Heart = F('M12 21s-7.5-4.6-9.4-9.3C1.2 8.2 3.3 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.7 0 5.8 3.7 4.4 7.2C19.5 16.4 12 21 12 21z');
export const HeartOutline = F('M12 21s-7.5-4.6-9.4-9.3C1.2 8.2 3.3 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.7 0 5.8 3.7 4.4 7.2C19.5 16.4 12 21 12 21zm0-2.4c2-1.3 6.1-4.4 7.4-7.6.9-2.3-.4-4.5-2.4-4.5-1.5 0-2.6 1-3.5 2.2L12 10.6l-1.5-1.9C9.6 7.5 8.5 6.5 7 6.5c-2 0-3.3 2.2-2.4 4.5 1.3 3.2 5.4 6.3 7.4 7.6z');
export const HeartBroken = F('M12 21s-7.5-4.6-9.4-9.3C1.2 8.2 3.3 4.5 7 4.5c2 0 3.5 1.1 4.8 2.7L10 11l3 2-2 4 4-5-3-2 1.4-2.6c1.1-1.2 2.4-1.9 3.6-1.9 3.7 0 5.8 3.7 4.4 7.2C19.5 16.4 12 21 12 21z');
export const Knife = F('M20.5 2.5c-3.3 1.1-8.4 5.7-11.4 9.2l2.7 2.7C15.3 11.4 19.4 6 20.5 2.5zM8.4 12.4l-1.6 1.6 3.2 3.2 1.6-1.6zM6 14.8L2.6 18.2a1.5 1.5 0 000 2.1l1.1 1.1a1.5 1.5 0 002.1 0l3.4-3.4z');
export const Boot = F('M7 2h6v9.5l5.6 2.4c1.5.6 2.4 2 2.4 3.6V20H3v-3l1.4-1.5c.4-.4.6-.9.6-1.4V3a1 1 0 011-1zm-4 19h18v1H3z');
export const Hourglass = F('M6 2h12v2h-1v3.2c0 1.7-.9 3.2-2.3 4.1L13.6 12l1.1.7c1.4.9 2.3 2.4 2.3 4.1V20h1v2H6v-2h1v-3.2c0-1.7.9-3.2 2.3-4.1l1.1-.7-1.1-.7A4.9 4.9 0 017 7.2V4H6zm3 2v3.2c0 1 .5 2 1.4 2.5L12 10.8l1.6-1.1c.9-.6 1.4-1.5 1.4-2.5V4zm3 9.2l-1.6 1.1c-.9.6-1.4 1.5-1.4 2.5V20h6v-3.2c0-1-.5-2-1.4-2.5z');
export const Mask = F('M12 2C7.6 2 4.5 5.4 4.5 10.6c0 5.6 3.2 11.4 7.5 11.4s7.5-5.8 7.5-11.4C19.5 5.4 16.4 2 12 2zM9 11.5a1.6 1.6 0 110-3.2 1.6 1.6 0 010 3.2zm6 0a1.6 1.6 0 110-3.2 1.6 1.6 0 010 3.2zM12 6.2a.9.9 0 110-1.8.9.9 0 010 1.8zm-3 9.3a.8.8 0 110-1.6.8.8 0 010 1.6zm3 1.5a.8.8 0 110-1.6.8.8 0 010 1.6zm3-1.5a.8.8 0 110-1.6.8.8 0 010 1.6z');
export const Eye = F('M12 5c5 0 8.8 3.7 10 7-1.2 3.3-5 7-10 7S3.2 15.3 2 12c1.2-3.3 5-7 10-7zm0 3a4 4 0 100 8 4 4 0 000-8zm0 2.2a1.8 1.8 0 110 3.6 1.8 1.8 0 010-3.6z');
export const Shield = F('M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z');
export const Wrench = F('M21.7 6.1l-3.4 3.4-2.9-.9-.9-2.9 3.4-3.4a6 6 0 00-7.6 7.6L2.8 17.4a2.2 2.2 0 003.1 3.1l7.5-7.5a6 6 0 008.3-6.9z');
export const Door = F('M5 2h14v19h2v1H3v-1h2zm2 2v17h6V4zm8 0v17h2V4zm-4.5 8.5a1 1 0 110 2 1 1 0 010-2z');
export const CardIcon = F('M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zm0 2v16h10V4z');
export const Hand = F('M8 11V4.5a1.5 1.5 0 013 0V10h1V3.5a1.5 1.5 0 013 0V10h1V5.5a1.5 1.5 0 013 0V15c0 4-3 7-7 7-2.6 0-4.4-1.2-5.8-3.3L3.6 14a1.5 1.5 0 012.5-1.6L8 15z');
export const Backpack = F('M9 2h6v2h1a4 4 0 014 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8a4 4 0 014-4h1zm2 0v2h2V2zM7 12v6h10v-6zm2 2h6v2H9z');
export const Menu = F('M3 5h18v2.5H3zm0 5.75h18v2.5H3zM3 16.5h18V19H3z');
export const Scroll = F('M6 3h11a3 3 0 013 3v1h-3v12a2 2 0 01-2 2H6a3 3 0 01-3-3v-1h3zm2 4v2h7V7zm0 4v2h7v-2zm0 4v2h5v-2z');
export const Zoom = F('M10 2a8 8 0 016.3 12.9l5.4 5.4-1.4 1.4-5.4-5.4A8 8 0 1110 2zm0 2a6 6 0 100 12 6 6 0 000-12zm-1 2h2v3h3v2h-3v3H9v-3H6V9h3z');
export const ZoomOut = F('M10 2a8 8 0 016.3 12.9l5.4 5.4-1.4 1.4-5.4-5.4A8 8 0 1110 2zm0 2a6 6 0 100 12 6 6 0 000-12zM6 9h8v2H6z');
export const Play = F('M6 3l15 9-15 9z');
export const FastFwd = F('M2 4l10 8-10 8zm10 0l10 8-10 8z');
export const Skip = F('M3 4l9 8-9 8zm9 0l9 8-9 8zm9 0h2v16h-2z');
export const Rewind = F('M22 4L12 12l10 8zm-10 0L2 12l10 8z');
export const Eject = F('M12 4l9 10H3zM3 16h18v4H3z');
export const Close = F('M5.6 4.2L12 10.6l6.4-6.4 1.4 1.4-6.4 6.4 6.4 6.4-1.4 1.4-6.4-6.4-6.4 6.4-1.4-1.4 6.4-6.4-6.4-6.4z');
export const Tick = F('M9 16.2l-4.2-4.2-1.6 1.6L9 19.4 21 7.4l-1.6-1.6z');
export const Plus = F('M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z');
export const Question = F('M12 2a10 10 0 110 20 10 10 0 010-20zm0 14a1.3 1.3 0 100 2.6 1.3 1.3 0 000-2.6zm.2-10.5c-2.4 0-4 1.4-4.2 3.6h2.3c.1-1 .8-1.6 1.8-1.6s1.7.6 1.7 1.5c0 .8-.4 1.2-1.4 1.9-1.2.8-1.7 1.5-1.6 3v.4h2.2V14c0-.8.3-1.2 1.4-1.9 1.2-.8 1.9-1.7 1.9-3.1 0-2.1-1.7-3.5-4.1-3.5z');
export const Footprint = F('M8 2c1.7 0 2.7 1.8 2.7 4.3S9.5 11 8 11 5.3 8.8 5.3 6.3 6.3 2 8 2zm-.2 10.3c1.4 0 2.3.9 2.3 2.3S9 17 7.8 17s-2.3-1-2.3-2.4.9-2.3 2.3-2.3zM16 7c1.7 0 2.7 1.8 2.7 4.3S17.5 16 16 16s-2.7-2.2-2.7-4.7S14.3 7 16 7zm-.2 10.3c1.4 0 2.3.9 2.3 2.3S17 22 15.8 22s-2.3-1-2.3-2.4.9-2.3 2.3-2.3z');
export const Padlock = F('M12 2a5 5 0 015 5v3h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v3h6V7a3 3 0 00-3-3zm0 9a2 2 0 00-1 3.7V19h2v-2.3A2 2 0 0012 13z');
export const Crow = F('M2 9c3-1 6 0 8 3 1-4 4-7 8-7l4 1-3 1c1 3-1 7-5 9l-2 4-1-3c-3 0-6-2-9-8z');
export const Puppet = F('M4 2h16v2h-3v3.2a3 3 0 11-2 0V4H9v3.2a3 3 0 11-2 0V4H4zm8 8a3 3 0 110 6 3 3 0 010-6zm-1 7h2l2 5h-2l-1-2.5L11 22H9z');
export const Splat = F('M12 3l1.6 4.2L17.5 4l-1.2 4.6 4.7-.3-3.6 3 3.9 2.6-4.6.9 1.7 4.3-4-2.4-.9 4.3-1.7-4.1L8.7 20l.6-4.6-4.6.6 3.4-3.2-3.9-2.4 4.6-.6L7 5.5l3.9 2.7z');
export const Share = F('M12 2l4.5 4.5-1.4 1.4L13 5.8V15h-2V5.8L8.9 7.9 7.5 6.5zM5 10h3v2H6v8h12v-8h-2v-2h3a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V11a1 1 0 011-1z');
export const Window = F('M4 3h16v18H4zm2 2v6h5V5zm7 0v6h5V5zm-7 8v6h5v-6zm7 0v6h5v-6z');
export const Water = F('M2 7c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2v2.5c-1.3 0-1.4 2-4 2s-2-2-4-2-2 2-4 2-2-2-4-2-2 2-4 2zm0 6c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2v2.5c-1.3 0-1.4 2-4 2s-2-2-4-2-2 2-4 2-2-2-4-2-2 2-4 2z');
export const Sacred = F('M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4-6.2-4.6-6.2 4.6 2.4-7.4L2 9.4h7.6z');
export const Bolt = F('M13 2L4 14h6l-1 8 9-12h-6z');
export const Volume = F('M3 9h4l5-4v14l-5-4H3zm13.5-1.5a6 6 0 010 9l-1.4-1.4a4 4 0 000-6.2zm2.8-2.8a10 10 0 010 14.6l-1.4-1.4a8 8 0 000-11.8z');
export const Gear = F('M10.3 2h3.4l.5 2.6 1.7.7 2.2-1.5 2.4 2.4-1.5 2.2.7 1.7 2.6.5v3.4l-2.6.5-.7 1.7 1.5 2.2-2.4 2.4-2.2-1.5-1.7.7-.5 2.6h-3.4l-.5-2.6-1.7-.7-2.2 1.5-2.4-2.4 1.5-2.2-.7-1.7L2 13.7v-3.4l2.6-.5.7-1.7-1.5-2.2 2.4-2.4 2.2 1.5 1.7-.7zM12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z');
export const Rotate = F('M12 4a8 8 0 017.7 5.9L22 8v7h-7l2.8-2.8A6 6 0 106 13H4a8 8 0 018-9z');
export const Swap = F('M7 3l-4 4 4 4V8h12V6H7zm10 10v3H5v2h12v3l4-4z');

/** A red-die face for 0–3 "stars" (result-row labels). */
export function StarsLabel({ n, className = 'ico' }: { n: number; className?: string }) {
  const pos: Record<number, [number, number][]> = { 0: [], 1: [[12, 12]], 2: [[7.5, 12], [16.5, 12]], 3: [[12, 7], [7, 16], [17, 16]] };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {n === 0 ? <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /> : null}
      {pos[n]?.map(([x, y], i) => (
        <path key={i} transform={`translate(${x - 5} ${y - 5}) scale(0.42)`} fill="currentColor" d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
      ))}
    </svg>
  );
}

/** Horror-die faces: 1–2 blank, 3–4 a pair of cards (pay 2 cards → success), 5–6 a star. */
export function DieFace({ n }: { n: number }) {
  if (n >= 5)
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="currentColor" />
      </svg>
    );
  if (n >= 3)
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5" width="10" height="14" rx="1.5" transform="rotate(-12 8.5 12)" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="10.5" y="5" width="10" height="14" rx="1.5" transform="rotate(10 15.5 12)" fill="currentColor" stroke="currentColor" strokeWidth="2" opacity="0.9" />
      </svg>
    );
  return <svg viewBox="0 0 24 24" aria-hidden="true" />;
}

/** Little emblems for killers and places. */
export function Emblem({ name, className = 'ico' }: { name: string; className?: string }) {
  const d: Record<string, string> = {
    hammer: 'M3 6l6-4 4 3-2 2 9 11-2.5 2.5L8.5 11 6.5 13l-4-4z',
    ghost: 'M12 2a7 7 0 00-7 7v13l2.3-2 2.4 2 2.3-2 2.3 2 2.4-2 2.3 2V9a7 7 0 00-7-7zM9.5 8a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm5 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z',
    puppet: 'M4 2h16v2h-3v3.2a3 3 0 11-2 0V4H9v3.2a3 3 0 11-2 0V4H4zm8 8a3 3 0 110 6 3 3 0 010-6zm-1 7h2l2 5h-2l-1-2.5L11 22H9z',
    claw: 'M5 3c1 4 1 8-1 11l2 1c2-3 2.5-7 1-12zm5-1c1.2 5 1 10-1 14l2 1c2.5-4.5 2.5-10 1-15zm5 1c1 4 .8 9-1.5 13l2 1c2.5-4.4 2.7-9.6 1.5-14zM4 18h16v2H4z',
    serpent: 'M17 3c2.5 0 4 1.6 4 3.5S19.5 10 17 10h-6c-1.4 0-2 .7-2 1.5S9.6 13 11 13h4c3 0 5 2 5 4.5S18 22 15 22H4v-2h11c1.8 0 3-.9 3-2.5S16.8 15 15 15h-4c-2.5 0-4-1.6-4-3.5S8.5 8 11 8h6c1.4 0 2-.6 2-1.5S18.4 5 17 5h-2V3z',
    tent: 'M12 2l1 1.7L22 20h-2l-8-14-8 14H2l9-16.3zm0 8l5 10H7z',
    house: 'M12 2l10 8h-3v12H5V10H2zm-2 12v6h4v-6zM8 11v2h2v-2zm6 0v2h2v-2z',
    bigtop: 'M12 2l1 3c3 2.5 6 5 9 6v2h-2v9h-5v-6a3 3 0 00-6 0v6H4v-9H2v-2c3-1 6-3.5 9-6z',
    houses: 'M7 4l6 5H11v9H3V9H1zm10 3l6 5h-2v8h-7v-8h-2l5-4.2z',
    tombstone: 'M12 2a6 6 0 016 6v12h2v2H4v-2h2V8a6 6 0 016-6zm-1 4v3H8v2h3v5h2v-5h3V9h-3V6z',
    bird: 'M2 9c3-1 6 0 8 3 1-4 4-7 8-7l4 1-3 1c1 3-1 7-5 9l-2 4-1-3c-3 0-6-2-9-8z',
    pitchfork: 'M4 2h2v6a2 2 0 002 2h3V2h2v8h3a2 2 0 002-2V2h2v6a4 4 0 01-4 4h-3v10h-2V12H8a4 4 0 01-4-4z',
    pine: 'M12 2l6 8h-3l5 7h-7v5h-2v-5H4l5-7H6z',
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {d[name] ? <path fill="currentColor" d={d[name]} /> : <circle cx="12" cy="12" r="9" fill="currentColor" />}
    </svg>
  );
}

/** The meeple silhouette, as a <symbol> referenced by <use href="#meeple">. Rendered once in the app root. */
export function Sprites() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="meeple" viewBox="0 0 24 24">
          <path d="M12 2a3.3 3.3 0 0 1 2.3 5.7l5.4 2.1c1 .4 1.4 1.5.9 2.4l-.3.5a1.6 1.6 0 0 1-1.9.7L16 12.6l2.6 8c.2.7-.3 1.4-1 1.4h-3.2L12 17.6 9.6 22H6.4c-.7 0-1.2-.7-1-1.4l2.6-8-2.4.8a1.6 1.6 0 0 1-1.9-.7l-.3-.5c-.5-.9-.1-2 .9-2.4l5.4-2.1A3.3 3.3 0 0 1 12 2z" />
        </symbol>
        <pattern id="tentStripes" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <rect width="2" height="4" fill="#c8272d" />
          <rect x="2" width="2" height="4" fill="#f4e9d0" />
        </pattern>
      </defs>
    </svg>
  );
}

/** A meeple in plain HTML (for trays, strips and sheets). */
export function MeepleIcon({ color, size = 22, className }: { color: string; size?: number; className?: string }) {
  return (
    <svg viewBox="-1 -1 27 27" width={size} height={size} className={className} aria-hidden="true" style={{ flex: 'none' }}>
      <use href="#meeple" x={1.4} y={1.6} width={24} height={24} fill="#141213" />
      <use href="#meeple" x={0} y={0} width={24} height={24} fill={color} stroke="#141213" strokeWidth={1.6} paintOrder="stroke" />
    </svg>
  );
}
