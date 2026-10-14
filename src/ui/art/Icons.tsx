import type { JSX } from 'react';

type P = { className?: string; color?: string; title?: string };

const S = (props: P & { children: JSX.Element | JSX.Element[]; vb?: string }) => (
  <svg viewBox={props.vb ?? '0 0 24 24'} className={props.className} aria-hidden={props.title ? undefined : true} role={props.title ? 'img' : undefined}>
    {props.title ? <title>{props.title}</title> : null}
    {props.children}
  </svg>
);

export const Heart = ({ color = '#ff3b4a', ...p }: P) => (
  <S {...p}>
    <path fill={color} d="M12 21s-7.5-4.6-9.4-9.3C1.2 8.2 3.3 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.7 0 5.8 3.7 4.4 7.2C19.5 16.4 12 21 12 21z" />
  </S>
);

export const Skull = ({ color = '#f3e9e7', ...p }: P) => (
  <S {...p}>
    <path fill={color} d="M12 2C6.8 2 3 5.7 3 10.5c0 2.6 1.2 4.6 3 5.9V20c0 1.1.9 2 2 2h1v-2h2v2h2v-2h2v2h1c1.1 0 2-.9 2-2v-3.6c1.8-1.3 3-3.3 3-5.9C21 5.7 17.2 2 12 2zm-3.5 12.5a2.3 2.3 0 110-4.6 2.3 2.3 0 010 4.6zm7 0a2.3 2.3 0 110-4.6 2.3 2.3 0 010 4.6z" />
  </S>
);

export const Knife = ({ color = '#ffb0b5', ...p }: P) => (
  <S {...p}>
    <path fill={color} d="M20.5 2.5c-3.3 1.1-8.4 5.7-11.4 9.2l2.7 2.7C15.3 11.4 19.4 6 20.5 2.5zM8.4 12.4l-1.6 1.6 3.2 3.2 1.6-1.6zM6 14.8L2.6 18.2a1.5 1.5 0 000 2.1l1.1 1.1a1.5 1.5 0 002.1 0l3.4-3.4z" />
  </S>
);

export const Boot = ({ color = '#e8b37a', ...p }: P) => (
  <S {...p}>
    <path fill={color} d="M7 2h6v9.5l5.6 2.4c1.5.6 2.4 2 2.4 3.6V20H3v-3l1.4-1.5c.4-.4.6-.9.6-1.4V3a1 1 0 011-1zm-4 19h18v1H3z" />
  </S>
);

export const Hourglass = ({ color = '#79e2ff', ...p }: P) => (
  <S {...p}>
    <path fill={color} d="M6 2h12v2h-1v3.2c0 1.7-.9 3.2-2.3 4.1L13.6 12l1.1.7c1.4.9 2.3 2.4 2.3 4.1V20h1v2H6v-2h1v-3.2c0-1.7.9-3.2 2.3-4.1l1.1-.7-1.1-.7A4.9 4.9 0 017 7.2V4H6zm3 2v3.2c0 1 .5 2 1.4 2.5L12 10.8l1.6-1.1c.9-.6 1.4-1.5 1.4-2.5V4zm3 9.2l-1.6 1.1c-.9.6-1.4 1.5-1.4 2.5V20h6v-3.2c0-1-.5-2-1.4-2.5z" />
  </S>
);

export const Mask = ({ color = '#f3e9e7', ...p }: P) => (
  <S {...p}>
    <path fill={color} d="M12 2C7.6 2 4.5 5.4 4.5 10.6c0 5.6 3.2 11.4 7.5 11.4s7.5-5.8 7.5-11.4C19.5 5.4 16.4 2 12 2zM9 11.5a1.6 1.6 0 110-3.2 1.6 1.6 0 010 3.2zm6 0a1.6 1.6 0 110-3.2 1.6 1.6 0 010 3.2zM12 6.2a.9.9 0 110-1.8.9.9 0 010 1.8zm-3 9.3a.8.8 0 110-1.6.8.8 0 010 1.6zm3 1.5a.8.8 0 110-1.6.8.8 0 010 1.6zm3-1.5a.8.8 0 110-1.6.8.8 0 010 1.6z" />
  </S>
);

export const Door = ({ color = '#7ee08a', ...p }: P) => (
  <S {...p}>
    <path fill={color} d="M5 2h14v19h2v1H3v-1h2zm2 2v17h6V4zm8 0v17h2V4zm-4.5 8.5a1 1 0 110 2 1 1 0 010-2z" />
  </S>
);

export const Wrench = ({ color = '#f4a64b', ...p }: P) => (
  <S {...p}>
    <path fill={color} d="M21.7 6.1l-3.4 3.4-2.9-.9-.9-2.9 3.4-3.4a6 6 0 00-7.6 7.6L2.8 17.4a2.2 2.2 0 003.1 3.1l7.5-7.5a6 6 0 008.3-6.9z" />
  </S>
);

export const Person = ({ color = '#ffd166', ...p }: P) => (
  <S {...p}>
    <circle cx="12" cy="5" r="3.2" fill={color} />
    <path fill={color} d="M7 22l1-9-2.5-.2L7 9.5c.4-.9 1.3-1.5 2.3-1.5h5.4c1 0 1.9.6 2.3 1.5l1.5 3.3-2.5.2 1 9h-3l-1-6-1 6z" />
  </S>
);

export const Menu = (p: P) => (
  <S {...p}>
    <path fill="currentColor" d="M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z" />
  </S>
);

export const Scroll = (p: P) => (
  <S {...p}>
    <path fill="currentColor" d="M6 3h11a3 3 0 013 3v1h-3v12a2 2 0 01-2 2H6a3 3 0 01-3-3v-1h3zm2 4v2h7V7zm0 4v2h7v-2zm0 4v2h5v-2z" />
  </S>
);

export const Cards = (p: P) => (
  <S {...p}>
    <path fill="currentColor" d="M8 2h11a1 1 0 011 1v15a1 1 0 01-1 1H8a1 1 0 01-1-1V3a1 1 0 011-1zM4 5h2v15h10v2H5a1 1 0 01-1-1z" />
  </S>
);

export const Expand = (p: P) => (
  <S {...p}>
    <path fill="#fff" d="M4 4h6v2H7.4l4 4L10 11.4l-4-4V10H4zm16 0v6h-2V7.4l-4 4L12.6 10l4-4H14V4zM4 20v-6h2v2.6l4-4 1.4 1.4-4 4H10v2zm16 0h-6v-2h2.6l-4-4 1.4-1.4 4 4V14h2z" />
  </S>
);

export const Close = (p: P) => (
  <S {...p}>
    <path fill="currentColor" d="M5.6 4.2L12 10.6l6.4-6.4 1.4 1.4-6.4 6.4 6.4 6.4-1.4 1.4-6.4-6.4-6.4 6.4-1.4-1.4 6.4-6.4-6.4-6.4z" />
  </S>
);

export const Hand = ({ color = '#79e2ff', ...p }: P) => (
  <S {...p}>
    <path fill={color} d="M8 11V4.5a1.5 1.5 0 013 0V10h1V3.5a1.5 1.5 0 013 0V10h1V5.5a1.5 1.5 0 013 0V15c0 4-3 7-7 7-2.6 0-4.4-1.2-5.8-3.3L3.6 14a1.5 1.5 0 012.5-1.6L8 15z" />
  </S>
);

export const Backpack = ({ color = '#e0a35c', ...p }: P) => (
  <S {...p}>
    <path fill={color} d="M9 2h6v2h1a4 4 0 014 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8a4 4 0 014-4h1zm2 0v2h2V2zM7 12v6h10v-6zm2 2h6v2H9z" />
  </S>
);

const PIPS: Record<number, [number, number][]> = {
  1: [[12, 12]],
  2: [[7, 7], [17, 17]],
  3: [[7, 7], [12, 12], [17, 17]],
  4: [[7, 7], [17, 7], [7, 17], [17, 17]],
  5: [[7, 7], [17, 7], [12, 12], [7, 17], [17, 17]],
  6: [[7, 7], [17, 7], [7, 12], [17, 12], [7, 17], [17, 17]],
};
export const DieFace = ({ n, ...p }: P & { n: number }) => (
  <S {...p}>
    {(PIPS[n] ?? []).map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={2.1} fill={n >= 5 ? '#c41a26' : '#1a1012'} />
    ))}
  </S>
);

/** Little emblems for killers and places. */
export const Emblem = ({ name, color = '#ff4552', ...p }: P & { name: string }) => {
  switch (name) {
    case 'hammer':
      return (
        <S {...p}>
          <path fill={color} d="M3 6l6-4 4 3-2 2 9 11-2.5 2.5L8.5 11 6.5 13l-4-4z" />
        </S>
      );
    case 'ghost':
      return (
        <S {...p}>
          <path fill={color} d="M12 2a7 7 0 00-7 7v13l2.3-2 2.4 2 2.3-2 2.3 2 2.4-2 2.3 2V9a7 7 0 00-7-7zM9.5 8a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm5 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
        </S>
      );
    case 'puppet':
      return (
        <S {...p}>
          <path fill={color} d="M4 2h16v2h-3v3.2a3 3 0 11-2 0V4H9v3.2a3 3 0 11-2 0V4H4zm8 8a3 3 0 110 6 3 3 0 010-6zm-1 7h2l2 5h-2l-1-2.5L11 22H9z" />
        </S>
      );
    case 'claw':
      return (
        <S {...p}>
          <path fill={color} d="M5 3c1 4 1 8-1 11l2 1c2-3 2.5-7 1-12zm5-1c1.2 5 1 10-1 14l2 1c2.5-4.5 2.5-10 1-15zm5 1c1 4 .8 9-1.5 13l2 1c2.5-4.4 2.7-9.6 1.5-14zM4 18h16v2H4z" />
        </S>
      );
    case 'serpent':
      return (
        <S {...p}>
          <path fill={color} d="M17 3c2.5 0 4 1.6 4 3.5S19.5 10 17 10h-6c-1.4 0-2 .7-2 1.5S9.6 13 11 13h4c3 0 5 2 5 4.5S18 22 15 22H4v-2h11c1.8 0 3-.9 3-2.5S16.8 15 15 15h-4c-2.5 0-4-1.6-4-3.5S8.5 8 11 8h6c1.4 0 2-.6 2-1.5S18.4 5 17 5h-2V3z" />
        </S>
      );
    case 'tent':
      return (
        <S {...p}>
          <path fill={color} d="M12 2l1 1.7L22 20h-2l-8-14-8 14H2l9-16.3zm0 8l5 10H7z" />
        </S>
      );
    case 'house':
      return (
        <S {...p}>
          <path fill={color} d="M12 2l10 8h-3v12H5V10H2zm-2 12v6h4v-6zM8 11v2h2v-2zm6 0v2h2v-2z" />
        </S>
      );
    case 'bigtop':
      return (
        <S {...p}>
          <path fill={color} d="M12 2l1 3c3 2.5 6 5 9 6v2h-2v9h-5v-6a3 3 0 00-6 0v6H4v-9H2v-2c3-1 6-3.5 9-6z" />
        </S>
      );
    case 'houses':
      return (
        <S {...p}>
          <path fill={color} d="M7 4l6 5H11v9H3V9H1zm10 3l6 5h-2v8h-7v-8h-2l5-4.2z" />
        </S>
      );
    case 'tombstone':
      return (
        <S {...p}>
          <path fill={color} d="M12 2a6 6 0 016 6v12h2v2H4v-2h2V8a6 6 0 016-6zm-1 4v3H8v2h3v5h2v-5h3V9h-3V6z" />
        </S>
      );
    default:
      return (
        <S {...p}>
          <circle cx="12" cy="12" r="9" fill={color} />
        </S>
      );
  }
};
