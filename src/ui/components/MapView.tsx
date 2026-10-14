import { useMemo } from 'react';
import { killerDef, locationDef } from '../../game/content';
import type { GameState } from '../../game';
import type { ZoneDef } from '../../game/types';

export interface MapFx {
  /** Where to draw the killer instead of his real space (mid-animation). */
  killerAt?: { x: number; y: number } | null;
  trail?: string[] | null;
  /** Spaces that just saw a death. */
  deaths?: string[];
  /** A victim running between two spaces. */
  runner?: { from: string; to: string; t: number } | null;
}

interface Props {
  g: GameState;
  selectable?: string[];
  marked?: string[];
  onTap?: (zone: string) => void;
  fx?: MapFx;
  big?: boolean;
}

const VICTIM_COLORS: Record<string, string> = {
  boyfriend: '#5aa9ff',
  mlBoyfriend: '#5aa9ff',
  fiance: '#5aa9ff',
  holyMan: '#5aa9ff',
  girlfriend: '#ffffff',
  sister: '#ffffff',
  superTourist: '#ffffff',
  ghostHunter: '#ffffff',
  cursed: '#ff9a3c',
  werewolf: '#ff9a3c',
  smalley: '#ff9a3c',
  tourGuide: '#6fe39a',
};

const TOKEN_GLYPH: Record<string, { label: string; color: string }> = {
  bearTrap: { label: 'TRAP', color: '#c9c9c9' },
  fireworks: { label: 'FIREWORKS', color: '#ff6bd5' },
  motorboat: { label: 'BOAT', color: '#9be7ff' },
  darkWaters: { label: 'DARK WATERS', color: '#7a5cff' },
  tunnel: { label: 'TUNNEL', color: '#d8b98a' },
  skull: { label: '☠', color: '#ffffff' },
  helicopter: { label: 'HELI', color: '#9be7ff' },
  brokenLadder: { label: 'BROKEN', color: '#ff6b6b' },
  ropeLadder: { label: 'ROPE', color: '#d8b98a' },
  padlock: { label: 'LOCK', color: '#f4c95d' },
  closed: { label: 'CLOSED', color: '#ff6b6b' },
  fireBrimstone: { label: 'BRIMSTONE', color: '#ff8a3c' },
  sacredGround: { label: 'SACRED', color: '#f4c95d' },
  acidTrap: { label: 'ACID', color: '#9cff57' },
  netTrap: { label: 'NET', color: '#d8b98a' },
  sawTrap: { label: 'SAWS', color: '#c9c9c9' },
  golfCart: { label: 'CART', color: '#f4c95d' },
  policeCar: { label: 'POLICE', color: '#5aa9ff' },
  mlFire: { label: 'FIRE', color: '#ff8a3c' },
  barrier: { label: 'BLOCKED', color: '#ff6b6b' },
  bicycle: { label: 'BIKE', color: '#9be7ff' },
  boobyTrap: { label: 'BOOBY', color: '#c9c9c9' },
  searched: { label: '✕', color: '#ff6b6b' },
  outOfOrder: { label: 'SIGN', color: '#f4c95d' },
};

function faces(f: number[]): string {
  const s = [...f].sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    parts.push(j > i + 1 ? `${s[i]}-${s[j]}` : j === i + 1 ? `${s[i]},${s[j]}` : `${s[i]}`);
    i = j + 1;
  }
  return parts.join(',');
}

export function zonePoint(z: ZoneDef, aspect: number): { x: number; y: number } {
  return { x: z.x, y: z.y / aspect };
}

export function MapView({ g, selectable = [], marked = [], onTap, fx, big }: Props) {
  const loc = locationDef(g.config.location);
  const killer = killerDef(g.config.killer);
  const zones = loc.zones.filter((z) => !z.hidden || g.tokens.some((t) => t.id === 'helicopter'));
  const P = (z: ZoneDef) => zonePoint(z, loc.aspect);

  const view = useMemo(() => {
    const xs = zones.map((z) => P(z).x);
    const ys = zones.map((z) => P(z).y);
    const pad = 7;
    const x0 = Math.min(...xs) - pad;
    const y0 = Math.min(...ys) - pad;
    return { x0, y0, w: Math.max(...xs) - x0 + pad, h: Math.max(...ys) - y0 + pad + 2 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.config.location, zones.length]);

  const byId = new Map(zones.map((z) => [z.id, z]));
  const edges: { a: ZoneDef; b: ZoneDef; ab?: number[]; ba?: number[] }[] = [];
  const seen = new Set<string>();
  for (const a of zones) {
    for (const arr of a.panic) {
      const b = byId.get(arr.to);
      if (!b) continue;
      const key = [a.id, b.id].sort().join('|');
      if (seen.has(key)) {
        const e = edges.find((x) => [x.a.id, x.b.id].sort().join('|') === key)!;
        if (e.a.id === a.id) e.ab = arr.faces;
        else e.ba = arr.faces;
        continue;
      }
      seen.add(key);
      edges.push({ a, b, ab: arr.faces });
    }
  }
  const sel = new Set(selectable);
  const mk = new Set(marked);
  const R = (z: ZoneDef) => (z.landmark || z.exit || z.search ? 4.3 : 3.4);
  const kz = byId.get(g.killer.zone);
  const kp = fx?.killerAt ?? (kz ? P(kz) : null);
  const killerShown = !g.film.birds && !g.film.maple?.offBoard;

  const blocked = (a: string, b: string) => g.blocked.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const lock = g.film.creech?.lock as [string, string] | undefined;

  return (
    <svg className="map" viewBox={`${view.x0} ${view.y0} ${view.w} ${view.h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Map of ${loc.name}`}>
      <defs>
        <radialGradient id="ground" cx="50%" cy="45%" r="75%">
          <stop offset="0" stopColor={loc.ground} />
          <stop offset="1" stopColor="#050304" />
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="#ffffffaa" />
        </marker>
      </defs>
      <rect x={view.x0} y={view.y0} width={view.w} height={view.h} fill="url(#ground)" />

      {edges.map((e) => {
        const p = P(e.a);
        const q = P(e.b);
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const ra = R(e.a);
        const rb = R(e.b);
        const oneWay = !e.ab || !e.ba;
        const isBlocked = blocked(e.a.id, e.b.id) || (lock && ((lock[0] === e.a.id && lock[1] === e.b.id) || (lock[1] === e.a.id && lock[0] === e.b.id)));
        const lab = (fs: number[] | undefined, from: { x: number; y: number }, r: number, dir: number) => {
          if (!fs) return null;
          const d = Math.min(r + 3.4, len * 0.4);
          const x = from.x + ux * d * dir;
          const y = from.y + uy * d * dir;
          return (
            <g key={`${x}-${y}`}>
              <rect x={x - 2.5} y={y - 1.55} width={5} height={3.1} rx={1.3} fill="#0b0507cc" />
              <text x={x} y={y + 1.0} textAnchor="middle" fontSize="2.25" fill="#f3e9e7" fontWeight={700}>
                {faces(fs)}
              </text>
            </g>
          );
        };
        return (
          <g key={`${e.a.id}-${e.b.id}`}>
            <line
              x1={p.x + ux * ra}
              y1={p.y + uy * ra}
              x2={q.x - ux * rb}
              y2={q.y - uy * rb}
              stroke={isBlocked ? '#ff4552' : '#e9d9c6'}
              strokeOpacity={isBlocked ? 0.9 : 0.42}
              strokeWidth={isBlocked ? 0.8 : 1.1}
              strokeDasharray={isBlocked ? '1.4 1' : undefined}
              strokeLinecap="round"
              markerEnd={oneWay && e.ab && !e.ba ? 'url(#arrow)' : undefined}
              markerStart={oneWay && e.ba && !e.ab ? 'url(#arrow)' : undefined}
            />
            {lab(e.ab, p, ra, 1)}
            {lab(e.ba, q, rb, -1)}
          </g>
        );
      })}

      {fx?.trail && fx.trail.length > 1 ? (
        <polyline
          points={fx.trail
            .map((id) => byId.get(id))
            .filter(Boolean)
            .map((z) => `${P(z!).x},${P(z!).y}`)
            .join(' ')}
          fill="none"
          stroke="#ff2b3a"
          strokeWidth={1.4}
          strokeDasharray="2 1.5"
          strokeOpacity={0.9}
        />
      ) : null}

      {zones.map((z) => {
        const p = P(z);
        const r = R(z);
        const isSel = sel.has(z.id);
        const stroke = z.exit ? '#7ee08a' : z.sacred ? '#c7a6ff' : z.window ? '#9be7ff' : z.search ? '#f4a64b' : '#e9d9c6';
        const deck = z.search ? g.itemDecks[z.deck ?? z.id] : undefined;
        const words = z.name.split(' ');
        const lines = z.name.length > 11 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [z.name];
        return (
          <g key={z.id} onClick={() => onTap?.(z.id)} style={{ cursor: onTap ? 'pointer' : undefined }}>
            {isSel ? <circle cx={p.x} cy={p.y} r={r + 2.2} fill="#79e2ff33" stroke="#79e2ff" strokeWidth={0.7} className="pulse" /> : null}
            {mk.has(z.id) ? <circle cx={p.x} cy={p.y} r={r + 2.2} fill="none" stroke="#f4c95d" strokeWidth={0.8} strokeDasharray="1.5 1" /> : null}
            {z.house ? (
              <rect x={p.x - r} y={p.y - r} width={r * 2} height={r * 2} rx={1.2} fill="#120a0c" stroke={stroke} strokeWidth={0.7} />
            ) : (
              <circle cx={p.x} cy={p.y} r={r} fill="#120a0c" stroke={stroke} strokeWidth={z.exit || z.search || z.sacred ? 0.9 : 0.6} />
            )}
            {z.exit ? (
              <path transform={`translate(${p.x - r - 1.2} ${p.y - r - 1.2}) scale(0.13)`} fill="#7ee08a" d="M5 2h14v19h2v1H3v-1h2zm2 2v17h6V4zm8 0v17h2V4zm-4.5 8.5a1 1 0 110 2 1 1 0 010-2z" />
            ) : null}
            {z.search ? (
              <g transform={`translate(${p.x + r - 1.4} ${p.y - r - 1.4})`}>
                <rect width={3.6} height={4.4} rx={0.5} fill={deck?.length ? (deck[0].up ? '#f4a64b' : '#6e3f17') : '#3a2a20'} stroke="#000" strokeWidth={0.2} />
                <text x={1.8} y={3.2} fontSize={2.4} textAnchor="middle" fill="#000" fontWeight={700}>
                  {deck?.length ?? 0}
                </text>
              </g>
            ) : null}
            {lines.map((ln, i) => (
              <text
                key={i}
                x={p.x}
                y={p.y + r + 2.6 + i * 2.5}
                textAnchor="middle"
                fontSize={big ? 2.3 : 2.4}
                fill={z.exit ? '#a8f0b2' : z.search ? '#ffd2a1' : '#f3e9e7'}
                fontWeight={z.landmark || z.exit || z.search ? 700 : 400}
                style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: 0.5 }}
              >
                {ln}
              </text>
            ))}
          </g>
        );
      })}

      {/* tokens on spaces */}
      {g.tokens.map((t, i) => {
        const z = byId.get(t.zone);
        const glyph = TOKEN_GLYPH[t.id];
        if (!z || !glyph) return null;
        const p = P(z);
        const r = R(z);
        return (
          <g key={`${t.id}-${i}`} pointerEvents="none">
            <rect x={p.x - r - 1} y={p.y - r - 3.6} width={Math.max(4, glyph.label.length * 1.15 + 1)} height={2.6} rx={0.6} fill="#000c" stroke={glyph.color} strokeWidth={0.25} />
            <text x={p.x - r - 0.5} y={p.y - r - 1.65} fontSize={1.8} fill={glyph.color} fontWeight={700}>
              {glyph.label}
            </text>
          </g>
        );
      })}

      {/* victims */}
      {zones.map((z) => {
        const vs = g.victims.filter((v) => v.zone === z.id);
        if (!vs.length) return null;
        const p = P(z);
        const specials = vs.filter((v) => v.role);
        return (
          <g key={`v-${z.id}`} pointerEvents="none">
            <path transform={`translate(${p.x - 3.1} ${p.y - 1.9}) scale(0.16)`} fill="#ffd166" d="M12 2a3.2 3.2 0 110 6.4A3.2 3.2 0 0112 2zM7 22l1-9-2.5-.2L7 9.5c.4-.9 1.3-1.5 2.3-1.5h5.4c1 0 1.9.6 2.3 1.5l1.5 3.3-2.5.2 1 9h-3l-1-6-1 6z" />
            <text x={p.x + 1.2} y={p.y + 1.25} textAnchor="middle" fontSize={3.4} fill="#ffd166" fontWeight={700}>
              {vs.length}
            </text>
            {specials.slice(0, 3).map((v, i) => (
              <circle key={v.id} cx={p.x - 2 + i * 2} cy={p.y + 2.6} r={0.8} fill={VICTIM_COLORS[v.role!] ?? '#fff'} stroke="#000" strokeWidth={0.2} />
            ))}
          </g>
        );
      })}

      {/* minions */}
      {zones.map((z) => {
        const ms = g.minions.filter((m) => m.zone === z.id);
        if (!ms.length) return null;
        const p = P(z);
        return (
          <g key={`m-${z.id}`} pointerEvents="none">
            {g.film.birds
              ? ms.slice(0, 3).map((m, i) => (
                  <path
                    key={m.id}
                    transform={`translate(${p.x - 5.4 + i * 3.6} ${p.y - 6.2}) scale(1.45)`}
                    d="M0 1.2 Q0.6 0 1.2 0.9 Q1.8 0 2.4 1.2 Q1.8 0.7 1.2 1.5 Q0.6 0.7 0 1.2Z"
                    fill="#f5f7f8"
                    stroke="#000"
                    strokeWidth={0.22}
                  />
                ))
              : ms.slice(0, 4).map((m, i) => (
                  <rect key={m.id} x={p.x + 0.4 + i * 1.6} y={p.y + 0.6} width={1.4} height={2.2} rx={0.4} fill="#c7a6ff" stroke="#000" strokeWidth={0.25} />
                ))}
            {!g.film.birds && ms.length > 4 ? (
              <text x={p.x + 7} y={p.y + 2.6} fontSize={2.2} fill="#c7a6ff">
                ×{ms.length}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* the Final Girl */}
      {(() => {
        const z = byId.get(g.fg.zone);
        if (!z) return null;
        const p = P(z);
        return (
          <g pointerEvents="none">
            <circle cx={p.x + 3.2} cy={p.y - 3.2} r={2.1} fill="#79e2ff" stroke="#fff" strokeWidth={0.45} />
            <text x={p.x + 3.2} y={p.y - 2.3} fontSize={2.5} textAnchor="middle" fill="#032" fontWeight={700}>
              {g.fg.id.charAt(0).toUpperCase()}
            </text>
          </g>
        );
      })()}

      {/* the Killer */}
      {killerShown && kp ? (
        <g pointerEvents="none">
          <circle cx={kp.x - 3.2} cy={kp.y - 3.2} r={2.4} fill={killer.color} stroke="#fff" strokeWidth={0.45} />
          <text x={kp.x - 3.2} y={kp.y - 2.2} fontSize={2.7} textAnchor="middle" fill="#fff" fontWeight={700}>
            {killer.name.charAt(0)}
          </text>
        </g>
      ) : null}

      {fx?.runner
        ? (() => {
            const a = byId.get(fx.runner.from);
            const b = byId.get(fx.runner.to);
            if (!a || !b) return null;
            const pa = P(a);
            const pb = P(b);
            const t = fx.runner.t;
            return <circle cx={pa.x + (pb.x - pa.x) * t} cy={pa.y + (pb.y - pa.y) * t} r={1.1} fill="#ffd166" stroke="#000" strokeWidth={0.3} />;
          })()
        : null}

      {(fx?.deaths ?? []).map((id, i) => {
        const z = byId.get(id);
        if (!z) return null;
        const p = P(z);
        return (
          <g key={`d-${i}`} pointerEvents="none" className="death">
            <circle cx={p.x} cy={p.y} r={5.5} fill="#ff001c55" filter="url(#glow)" />
            <path transform={`translate(${p.x - 2.6} ${p.y - 2.6}) scale(0.22)`} fill="#fff" d="M12 2C6.8 2 3 5.7 3 10.5c0 2.6 1.2 4.6 3 5.9V20c0 1.1.9 2 2 2h1v-2h2v2h2v-2h2v2h1c1.1 0 2-.9 2-2v-3.6c1.8-1.3 3-3.3 3-5.9C21 5.7 17.2 2 12 2zm-3.5 12.5a2.3 2.3 0 110-4.6 2.3 2.3 0 010 4.6zm7 0a2.3 2.3 0 110-4.6 2.3 2.3 0 010 4.6z" />
          </g>
        );
      })}
    </svg>
  );
}
