// Draws the landmark shapes (landmarks.ts) as flat ink: a fill, a 1.5–2 px
// black edge, no shading.

import type { ReactNode } from 'react';
import type { BoardInk } from '../film';
import type { Pt } from './geometry';
import type { Fill, Shape } from './landmarks';
import { BIRD } from './tokens';

const INK = '#141213';

const f = (n: number) => +n.toFixed(2);

/** A smooth curve through the points (Catmull-Rom as cubic Béziers). */
export function smoothPath(pts: Pt[], closed: boolean): string {
  if (pts.length < 3) return `M${pts.map((p) => `${f(p.x)} ${f(p.y)}`).join(' L')}`;
  const n = pts.length;
  const P = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(P(0).x)} ${f(P(0).y)}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = P(i - 1);
    const p1 = P(i);
    const p2 = P(i + 1);
    const p3 = P(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return closed ? `${d}Z` : d;
}

/** Tree crowns: a scalloped outline, one bump per edge. */
function crownPath(pts: Pt[]): string {
  // bumps bulge outward whichever way the ring runs
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    area += a.x * b.y - b.x * a.y;
  }
  const sweep = area > 0 ? 1 : 0;
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const r = Math.hypot(b.x - a.x, b.y - a.y) * 0.6;
    d += ` A${f(r)} ${f(r)} 0 0 ${sweep} ${f(b.x)} ${f(b.y)}`;
  }
  return `${d}Z`;
}

const linePath = (pts: Pt[], smooth?: boolean) => (smooth ? smoothPath(pts, false) : `M${pts.map((p) => `${f(p.x)} ${f(p.y)}`).join(' L')}`);

export function fillOf(ink: BoardInk, k: Fill | 'ink'): string {
  if (k === 'ink') return INK;
  if (k === 'ground') return 'var(--ground)';
  return ink[k];
}

export function landmarkEls(shapes: Shape[], ink: BoardInk, ppu: number): ReactNode[] {
  return shapes.map((s, i) => {
    if (s.k === 'area') {
      const d = s.edge === 'smooth' ? smoothPath(s.pts, true) : s.edge === 'crowns' ? crownPath(s.pts) : `M${s.pts.map((p) => `${f(p.x)} ${f(p.y)}`).join(' L')}Z`;
      return <path key={`lm${i}`} d={d} fill={fillOf(ink, s.fill)} stroke={INK} strokeWidth={s.line ?? 1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />;
    }
    if (s.k === 'band') {
      const d = linePath(s.pts, s.smooth);
      const edge = (s.line ?? 1.5) * 2;
      return (
        <g key={`lm${i}`}>
          <path d={d} fill="none" stroke={INK} strokeWidth={s.w + edge / ppu} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke={fillOf(ink, s.fill)} strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    }
    if (s.k === 'line')
      return (
        <path
          key={`lm${i}`}
          d={linePath(s.pts, s.smooth)}
          fill="none"
          stroke={fillOf(ink, s.ink ?? 'ink')}
          strokeWidth={s.px}
          strokeDasharray={s.dash}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      );
    // a crow on the wire, feet on the point
    return <path key={`lm${i}`} d={BIRD} fill={INK} transform={`translate(${f(s.at.x)} ${f(s.at.y)}) scale(${f((s.flip ? -s.s : s.s) / 24)} ${f(s.s / 24)}) translate(-12 -20)`} />;
  });
}
