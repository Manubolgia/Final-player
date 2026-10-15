// The poster-art kit: the <svg> frame every illustration is printed in, the
// film palettes, the print "tones" (colour variants) and a few drawing helpers.
//
// House style: flat spot inks plus ink black and bone, thick ink outlines,
// hard shapes. No gradients, no blur, no filters. Halftone is a <pattern> of
// circles; rim light is a clipped, offset copy of a silhouette.

import { useId, type CSSProperties, type ReactNode } from 'react';

export const INK = '#141213';
export const BONE = '#efe6d2';
export const BLOOD = '#b3161b';
export const BLOOD_EDGE = '#6e0b0f';
export const BLACK_STOCK = '#1e1a1b';
export const GIRL = '#6e46a0';

/**
 * How a piece is printed.
 * - `film`: its own spot inks (the default).
 * - `mono`: a one-colour job, ink on bone, mid-tones as halftone.
 * - `night`: bone on black stock (Terror cards, title cards).
 * - `blood`: a red duotone (the death screen).
 */
export type Tone = 'film' | 'mono' | 'night' | 'blood';
export type Rect = readonly [number, number, number, number];
export type Fit = 'slice' | 'meet';

/** A drawing: its full box, named crops and the ink it lays down. */
export interface Piece {
  box: Rect;
  /** Named crops in drawing units (e.g. the face, for 56 px chips). */
  crops: Record<string, Rect>;
  draw: (k: Kit) => ReactNode;
}

export interface Kit {
  /** A colour as this tone prints it: a hex, or a halftone fill `url(#…)`. */
  c: (hex: string) => string;
  /** The same colour, solid only (strokes, pattern dots). */
  s: (hex: string) => string;
  /** A document-unique id for a def. */
  id: (name: string) => string;
  /** `url(#id)` for a def made with `id`. */
  url: (name: string) => string;
  tone: Tone;
}

/* ---- tones ----------------------------------------------------------------- */

type Dots = { dot: string; on: string; r: number };
type Slot = string | Dots;

/** Five lightness bands, darkest first. */
const TONES: Record<Exclude<Tone, 'film'>, readonly Slot[]> = {
  mono: [INK, { dot: INK, on: BONE, r: 1.95 }, { dot: INK, on: BONE, r: 1.35 }, { dot: INK, on: BONE, r: 0.85 }, BONE],
  night: [BLACK_STOCK, { dot: BONE, on: BLACK_STOCK, r: 0.85 }, { dot: BONE, on: BLACK_STOCK, r: 1.35 }, { dot: BONE, on: BLACK_STOCK, r: 1.95 }, BONE],
  blood: [INK, { dot: INK, on: BLOOD, r: 1.5 }, BLOOD, { dot: BLOOD, on: BONE, r: 1.4 }, BONE],
};

/** CIE L* (0–100) of a #rrggbb colour. */
function lightness(hex: string): number {
  const n = parseInt(hex.slice(1, 7), 16);
  const lin = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y;
}
const band = (hex: string): number => {
  if (hex === INK) return 0;
  const l = lightness(hex);
  return l < 14 ? 0 : l < 36 ? 1 : l < 56 ? 2 : l < 78 ? 3 : 4;
};

function makeKit(uid: string, tone: Tone): Kit {
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  if (tone === 'film') return { c: (h) => h, s: (h) => h, id, url, tone };
  const slots = TONES[tone];
  const c = (hex: string) => {
    if (!hex.startsWith('#')) return hex;
    const i = band(hex);
    return typeof slots[i] === 'string' ? (slots[i] as string) : url(`t${i}`);
  };
  const s = (hex: string) => {
    if (!hex.startsWith('#')) return hex;
    const i = band(hex);
    const slot = slots[i];
    if (typeof slot === 'string') return slot;
    return slot.r > 1.3 ? slot.dot : slot.on;
  };
  return { c, s, id, url, tone };
}

/** The halftone screens a tone needs (a 6-unit diagonal grid of dots). */
function ToneDefs({ k }: { k: Kit }) {
  if (k.tone === 'film') return null;
  return (
    <>
      {TONES[k.tone].map((slot, i) =>
        typeof slot === 'string' ? null : (
          <pattern key={i} id={k.id(`t${i}`)} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill={slot.on} />
            <circle cx="1.5" cy="1.5" r={slot.r} fill={slot.dot} />
            <circle cx="4.5" cy="4.5" r={slot.r} fill={slot.dot} />
          </pattern>
        ),
      )}
    </>
  );
}

/* ---- the frame ------------------------------------------------------------ */

export interface ArtProps {
  /** Which crop of the drawing to show (each piece names its own; default: all of it). */
  crop?: string;
  /** `slice` fills the container and trims (default); `meet` shows the whole crop. */
  fit?: Fit;
  /** preserveAspectRatio alignment, e.g. `xMidYMin` to keep the top when slicing. */
  align?: string;
  tone?: Tone;
  /** Accessible name; without it the art is decorative. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

export function ArtFrame({ piece, crop, fit = 'slice', align = 'xMidYMid', tone = 'film', title, className, style }: ArtProps & { piece: Piece }) {
  const uid = 'a' + useId().replace(/[^A-Za-z0-9_-]/g, '');
  const k = makeKit(uid, tone);
  const v = (crop && piece.crops[crop]) || piece.box;
  return (
    <svg
      viewBox={v.join(' ')}
      preserveAspectRatio={`${align} ${fit}`}
      width="100%"
      height="100%"
      className={className}
      style={{ display: 'block', overflow: 'hidden', ...style }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <ToneDefs k={k} />
      </defs>
      {piece.draw(k)}
    </svg>
  );
}

/* ---- film palettes -------------------------------------------------------- */
// From src/ui/film.ts (SPINES, boardInk) and the research palette.

export const PAL = {
  happyTrails: { pine: '#2f4a32', deep: '#1f3322', lake: '#2e5a6b', khaki: '#c9b98f', fire: '#e07a2e', wood: '#6b4423' },
  creech: { plum: '#3b2140', deep: '#2a1630', mauve: '#7a4f7f', gold: '#d9a441', bone: '#ede3d1', lilac: '#a785a6' },
  carnival: { red: '#c8272d', deep: '#7a0e12', mustard: '#f2b705', cream: '#f4e9d0', sawdust: '#c49a6c' },
  maple: { lawn: '#5e8c3a', green: '#3c5a2e', brick: '#a44a3f', red: '#9e2b25', picket: '#f1ede4', rust: '#8a4b24', gas: '#a9b04a', street: '#6e6a66' },
  groves: { ochre: '#c47f2c', earth: '#8e3b23', grove: '#1f4d3a', teal: '#2b6e6a', stone: '#b8a88a', dark: '#5a2414' },
  terror: { paper: '#e9e6df', slate: '#4a5560', grey: '#9a9a96', crow: '#1a1a1d', red: '#b3161b' },
} as const;

/* ---- helpers -------------------------------------------------------------- */

/** Common ink outline props (width in drawing units). */
export const ol = (k: Kit, w = 3): { stroke: string; strokeWidth: number; strokeLinejoin: 'round'; strokeLinecap: 'round' } => ({
  stroke: k.s(INK),
  strokeWidth: w,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
});

/**
 * Rim light: the shape in `light`, overprinted by itself in `fill` shifted by
 * (dx, dy), clipped to the shape. What's left is a hard sliver of light on
 * the edges facing away from the shift.
 */
export function Rim({ k, name, d, fill, light, dx, dy, stroke = 3 }: { k: Kit; name: string; d: string; fill: string; light: string; dx: number; dy: number; stroke?: number }) {
  return (
    <g>
      <clipPath id={k.id(name)}>
        <path d={d} />
      </clipPath>
      <g clipPath={k.url(name)}>
        <path d={d} fill={k.c(light)} />
        <path d={d} fill={k.c(fill)} transform={`translate(${dx} ${dy})`} />
      </g>
      {stroke ? <path d={d} fill="none" {...ol(k, stroke)} /> : null}
    </g>
  );
}

/** A halftone screen of dots (`r` in units, on a `gap` diagonal grid). */
export function DotScreen({ k, name, color, r, gap = 6, angle = 0 }: { k: Kit; name: string; color: string; r: number; gap?: number; angle?: number }) {
  const h = gap / 2;
  return (
    <pattern id={k.id(name)} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform={angle ? `rotate(${angle})` : undefined}>
      <circle cx={h / 2} cy={h / 2} r={r} fill={k.s(color)} />
      <circle cx={h * 1.5} cy={h * 1.5} r={r} fill={k.s(color)} />
    </pattern>
  );
}

/** A deterministic pseudo-random sequence (so splats and flocks never move). */
export function rand(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** A blood splat: a lumpy blob with a few thrown spikes, as a path. */
export function splat(cx: number, cy: number, r: number, seed: number, spikes = 7): string {
  const rnd = rand(seed);
  const n = spikes * 2 + 4;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.3;
    const spike = i % 2 === 0 && rnd() > 0.35;
    const rr = spike ? r * (1.35 + rnd() * 0.8) : r * (0.7 + rnd() * 0.35);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  // smooth closed curve through the points (midpoint quadratic)
  const mid = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${m0[0].toFixed(1)} ${m0[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += `Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return d + 'Z';
}

/** Drops thrown off a splat: little circles along a direction. */
export function drops(cx: number, cy: number, ang: number, n: number, seed: number, size = 2.4): [number, number, number][] {
  const rnd = rand(seed);
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const dist = 8 + i * (6 + rnd() * 5);
    const a = ang + (rnd() - 0.5) * 0.5;
    out.push([cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, size * (1 - i / (n + 1)) + rnd() * 0.6]);
  }
  return out;
}

/** Points to an SVG polygon string. */
export const pts = (...p: number[]): string => {
  let s = '';
  for (let i = 0; i < p.length; i += 2) s += `${p[i]},${p[i + 1]} `;
  return s.trim();
};
