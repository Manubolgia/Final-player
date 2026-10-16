// The poster-art kit: the <svg> frame every illustration is printed in, the
// shared inks, and a few printing helpers (halftone screens, a moon with a
// halftone halo, ink outlines).
//
// House style: an 80s one-colour VHS sleeve. Two or three spot inks from the
// film's palette, plus ink black and bone. Thick ink outlines, hard shapes, no
// colour blends, no blur, no filter effects. Halftone is a <pattern> of circles only.

import { useId, type ReactNode } from 'react';

export const INK = '#141213';
export const BONE = '#efe6d2';
export const PAPER = '#f7f1e3';
export const BLOOD = '#b3161b';
export const BLACK = '#1e1a1b';

export type Box = readonly [number, number, number, number];

/** A drawing on its own canvas, with the named crops the app shows it at. */
export interface Drawing {
  /** The whole canvas (x, y, w, h). */
  box: Box;
  /** `bust`: a square on the head (48 px chips). `band`: a wide strip (cards, title bands). */
  crops: { bust: Box; band: Box; [name: string]: Box };
  /** What it shows, for screen readers when the art carries meaning. */
  label: string;
  draw: (k: Kit) => ReactNode;
}

export interface Kit {
  /** A document-unique id for a def. */
  id: (name: string) => string;
  /** `url(#…)` for a def made with `id`. */
  url: (name: string) => string;
}

export type Crop = 'full' | 'bust' | 'band' | (string & {});

export interface ArtProps {
  d: Drawing;
  crop?: Crop;
  /** `slice` fills the box and trims (default); `meet` shows the whole crop. */
  fit?: 'slice' | 'meet';
  /** Where the crop sits when it is trimmed (default centre). */
  align?: string;
  className?: string;
  /** Give the art a name when it is the only thing saying who this is. */
  title?: string;
}

/** Prints a drawing (or one of its crops) as inline SVG. */
export function Art({ d, crop = 'full', fit = 'slice', align = 'xMidYMid', className, title }: ArtProps) {
  const uid = 'a' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const k: Kit = { id: (n) => `${uid}-${n}`, url: (n) => `url(#${uid}-${n})` };
  const box = crop === 'full' ? d.box : (d.crops[crop] ?? d.box);
  return (
    <svg
      viewBox={box.join(' ')}
      preserveAspectRatio={`${align} ${fit}`}
      className={`art${className ? ` ${className}` : ''}`}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
      focusable="false"
    >
      {d.draw(k)}
    </svg>
  );
}

/** A halftone screen: one dot per cell on a 45-degree grid. */
export function Dots({ k, name, color, r = 1.5, gap = 6, bg }: { k: Kit; name: string; color: string; r?: number; gap?: number; bg?: string }) {
  return (
    <pattern id={k.id(name)} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      {bg ? <rect width={gap} height={gap} fill={bg} /> : null}
      <circle cx={gap / 2} cy={gap / 2} r={r} fill={color} />
    </pattern>
  );
}

/**
 * A disc with a halftone halo: three rings of dots that shrink outwards.
 * The poster's light source, printed rather than blurred.
 */
export function Halo({ k, name, cx, cy, r, color, ring = 14 }: { k: Kit; name: string; cx: number; cy: number; r: number; color: string; ring?: number }) {
  return (
    <g>
      <defs>
        <Dots k={k} name={`${name}1`} color={color} r={2.1} gap={6} />
        <Dots k={k} name={`${name}2`} color={color} r={1.5} gap={6} />
        <Dots k={k} name={`${name}3`} color={color} r={0.9} gap={6} />
      </defs>
      <circle cx={cx} cy={cy} r={r + ring * 3} fill={k.url(`${name}3`)} />
      <circle cx={cx} cy={cy} r={r + ring * 2} fill={k.url(`${name}2`)} />
      <circle cx={cx} cy={cy} r={r + ring} fill={k.url(`${name}1`)} />
    </g>
  );
}

/**
 * A limb, strap or tube: an ink stroke with a narrower colour stroke on top,
 * so it prints with its own outline.
 */
export function Limb({ d, w, fill, ink = 3 }: { d: string; w: number; fill: string; ink?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + ink * 2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={fill} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/** Common stroke props: the thick ink outline every shape is printed with. */
export const line = (w = 3) => ({ stroke: INK, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });
