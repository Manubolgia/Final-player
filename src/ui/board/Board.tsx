import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { GameState } from '../../game';
import { locationDef } from '../../game/content';
import type { LocationDef, ZoneDef } from '../../game/types';
import { boardInk, victimHex, type BoardInk } from '../film';
import type { BoardFx, DisplayView } from '../game/display';
import { edgesOf, fitView, isBlocked, visibleZones, type View } from './geometry';
import { layoutBoard, panicArrows, placeTiles, type BoardLayout } from './layout';
import { placeGlyph } from './places';

const WRENCH = 'M21 7.5a5.5 5.5 0 01-7.3 5.2l-7.6 7.6a2.3 2.3 0 01-3.2-3.2l7.6-7.6A5.5 5.5 0 0117.7 2l-3.4 3.4.9 3.4 3.4.9z';
import { TOKEN_CHIT } from './tokens';

interface Props {
  g: GameState;
  view: DisplayView;
  fx: BoardFx;
  splats: string[];
  targets: string[];
  pressed?: string | null;
  panicAll: boolean;
  inspect?: string | null;
  zoom: boolean;
  onTarget: (zone: string) => void;
  onInspect: (zone: string) => void;
}

const KILLER = '#c1272d';
const GIRL = '#6e46a0';
const INK = '#141213';

/** Zones drawn as square plates (rooms and houses). */
const isSquare = (z: ZoneDef, loc: LocationDef) => !!z.house || loc.id === 'creechManor';

function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export function Board(props: Props) {
  const { g, view, fx, targets, zoom } = props;
  const loc = locationDef(g.config.location);
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const size = useSize(wrap);
  const zones = useMemo(() => visibleZones(g, loc), [loc, g.tokens.some((t) => t.id === 'helicopter')]); // eslint-disable-line react-hooks/exhaustive-deps
  // the printed map is schematic: stretch it (a little) to fill the space it's given,
  // so a wide manor gets taller rows on a portrait phone and a tall camp gets wider ones sideways
  const natural = useMemo(() => fitView(zones, loc.aspect), [zones, loc.aspect]);
  const k = size.w && size.h ? Math.round(Math.min(2, Math.max(0.6, size.h / size.w / (natural.h / natural.w))) * 20) / 20 : 1;
  const aspect = loc.aspect / k;
  const base = useMemo(() => fitView(zones, aspect), [zones, aspect]);
  const edges = useMemo(() => edgesOf(zones), [zones]);

  // zoom: a smaller window centred on the Final Girl, pannable with one finger
  const [pan, setPan] = useState({ dx: 0, dy: 0 });
  useEffect(() => setPan({ dx: 0, dy: 0 }), [zoom]);
  const win: View = useMemo(() => {
    if (!zoom) return base;
    const fz = loc.zones.find((z) => z.id === view.fz);
    const w = base.w / 1.7;
    const h = base.h / 1.7;
    const cx = (fz ? fz.x : base.x0 + base.w / 2) + pan.dx;
    const cy = (fz ? fz.y / aspect : base.y0 + base.h / 2) + pan.dy;
    const x0 = Math.min(Math.max(cx - w / 2, base.x0), base.x0 + base.w - w);
    const y0 = Math.min(Math.max(cy - h / 2, base.y0), base.y0 + base.h - h);
    return { x0, y0, w, h };
  }, [zoom, base, pan, view.fz, loc, aspect]);

  const rawPpu = size.w && size.h ? Math.min(size.w / win.w, size.h / win.h) : 0;
  const ppu = Math.round(rawPpu * 20) / 20;
  const layout = useMemo(() => (ppu ? layoutBoard(loc, zones, edges, ppu, aspect) : null), [loc, zones, edges, ppu, aspect]);

  // pointer: tap a target / inspect a space, long-press to inspect, drag to pan when zoomed
  const press = useRef<{ x: number; y: number; t: number; moved: boolean; timer: number; pan0: { dx: number; dy: number }; long: boolean } | null>(null);
  const toBoard = (cx: number, cy: number) => {
    const s = svg.current;
    const m = s?.getScreenCTM();
    if (!s || !m) return null;
    const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  const zoneAt = (cx: number, cy: number, among?: string[]) => {
    if (!layout) return null;
    const b = toBoard(cx, cy);
    if (!b) return null;
    let best: string | null = null;
    let bestD = Infinity;
    for (const [id, zl] of layout.zones) {
      if (among && !among.includes(id)) continue;
      const d = Math.hypot(zl.p.x - b.x, zl.p.y - b.y) * ppu;
      const reach = among ? 40 + zl.r : Math.max(zl.r + 6, 22);
      if (d <= reach && d < bestD) {
        best = id;
        bestD = d;
      }
    }
    return best;
  };
  const onPointerDown = (e: React.PointerEvent) => {
    const st = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, pan0: pan, long: false, timer: 0 };
    st.timer = window.setTimeout(() => {
      if (!press.current || press.current.moved) return;
      const z = zoneAt(st.x, st.y);
      if (z) {
        press.current.long = true;
        props.onInspect(z);
      }
    }, 420);
    press.current = st;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const st = press.current;
    if (!st) return;
    const dx = e.clientX - st.x;
    const dy = e.clientY - st.y;
    if (Math.hypot(dx, dy) > 8) st.moved = true;
    if (zoom && st.moved && ppu) setPan({ dx: st.pan0.dx - dx / ppu, dy: st.pan0.dy - dy / ppu });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const st = press.current;
    press.current = null;
    if (!st) return;
    clearTimeout(st.timer);
    if (st.moved || st.long) return;
    if (targets.length) {
      const z = zoneAt(e.clientX, e.clientY, targets);
      if (z) return props.onTarget(z);
    }
    const z = zoneAt(e.clientX, e.clientY);
    if (z) props.onInspect(z);
  };

  const ink = boardInk(g);
  const vb = `${win.x0} ${win.y0} ${win.w} ${win.h}`;
  return (
    <div className={`board-map${zoom ? ' zoomed' : ''}`} ref={wrap}>
      {layout ? (
        <svg
          ref={svg}
          className="board-svg"
          viewBox={vb}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Map of ${loc.name}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (press.current = null)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <rect x={base.x0 - 200} y={base.y0 - 200} width={base.w + 400} height={base.h + 400} fill="var(--ground)" />
          <StaticLayer g={g} loc={loc} layout={layout} ink={ink} sig={staticSig(g)} />
          <PanicLayer layout={layout} view={view} panicAll={props.panicAll} inspect={props.inspect ?? null} edge={fx.panicEdge} />
          {fx.trail && fx.trail.length > 1 ? <Trail layout={layout} path={fx.trail} /> : null}
          {targets.length ? <Targets layout={layout} base={base} targets={targets} pressed={props.pressed ?? null} loc={loc} /> : null}
          <TokenLayer g={g} layout={layout} view={view} fx={fx} splats={props.splats} />
        </svg>
      ) : null}
    </div>
  );
}

/** Things that change the printed layer. */
function staticSig(g: GameState): string {
  return [
    g.tokens.map((t) => `${t.id}@${t.zone}>${t.to ?? ''}`).join(','),
    g.blocked.map((b) => b.join('-')).join(','),
    g.tunnel.join(','),
    JSON.stringify(g.film.creech?.lock ?? null),
    Object.entries(g.itemDecks)
      .map(([k, d]) => `${k}:${d.length}:${d[0]?.up ? d[0].id : ''}`)
      .join(','),
    g.film.maple?.asleep ? 'dream' : '',
    g.killer.finaleRevealed ? 'fin' : '',
  ].join('|');
}

const StaticLayer = memo(
  function StaticLayer({ g, loc, layout, ink }: { g: GameState; loc: LocationDef; layout: BoardLayout; ink: BoardInk; sig: string }) {
    const u = 1 / layout.ppu;
    const P = (id: string) => layout.zones.get(id)!.p;
    const out: ReactNode[] = [];

    // scenery
    for (const [i, d] of layout.decor.entries()) {
      const s = d.s * 6 * u * (layout.ppu > 4 ? 1.2 : 1);
      if (ink.decorKind === 'pine')
        out.push(
          <g key={`d${i}`} transform={`translate(${d.x} ${d.y})`}>
            <path d={`M0 ${-s * 1.3} L${s * 0.75} ${-s * 0.2} L${-s * 0.75} ${-s * 0.2}Z M0 ${-s * 0.7} L${s * 0.95} ${s * 0.6} L${-s * 0.95} ${s * 0.6}Z`} fill={ink.decor} stroke={INK} strokeWidth={1.2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </g>,
        );
      else if (ink.decorKind === 'hedge') out.push(<circle key={`d${i}`} cx={d.x} cy={d.y} r={s * 0.75} fill={ink.decor} stroke={INK} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />);
      else if (ink.decorKind === 'grove')
        out.push(
          <g key={`d${i}`}>
            <circle cx={d.x} cy={d.y} r={s * (0.75 + d.k * 0.12)} fill={ink.decor} stroke={INK} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
          </g>,
        );
      else if (ink.decorKind === 'pennant' && i < 10)
        out.push(
          <g key={`d${i}`} transform={`translate(${d.x} ${d.y})`}>
            <path d={`M${-s * 1.5} ${-s * 0.4} Q0 ${s * 0.2} ${s * 1.5} ${-s * 0.4}`} fill="none" stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            {[-1, 0, 1].map((k) => (
              <path key={k} d={`M${k * s - s * 0.35} ${-s * 0.2 + Math.abs(k) * -s * 0.12} L${k * s + s * 0.35} ${-s * 0.2 + Math.abs(k) * -s * 0.12} L${k * s} ${s * 0.5}Z`} fill={k === 0 ? '#f2b705' : '#c8272d'} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
          </g>,
        );
    }
    if (ink.decorKind === 'planks') {
      const v = layout.view;
      for (let y = v.y0 + 3; y < v.y0 + v.h; y += 6) out.push(<line key={`pl${y}`} x1={v.x0 - 50} x2={v.x0 + v.w + 50} y1={y} y2={y} stroke={ink.decor} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />);
    }

    // landmarks under the spaces: water, tents, sacred rings
    for (const [id, zl] of layout.zones) {
      const z = zl.z;
      const r = zl.r * u;
      // water spaces get a lake rim, like the shoreline printed round them on the board
      if (z.water)
        out.push(
          <g key={`w${id}`}>
            <circle cx={zl.p.x} cy={zl.p.y} r={r + 7 * u} fill={ink.water} stroke={INK} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            <path
              d={`M${zl.p.x - r - 3.5 * u} ${zl.p.y + 3 * u} q${2 * u} ${-2.5 * u} ${4 * u} 0 M${zl.p.x + r - 0.5 * u} ${zl.p.y + 3 * u} q${2 * u} ${-2.5 * u} ${4 * u} 0`}
              fill="none"
              stroke="#efe6d2"
              strokeWidth={1.4}
              vectorEffect="non-scaling-stroke"
            />
          </g>,
        );
      if (loc.id === 'carnivalOfBlood' && z.landmark) out.push(<circle key={`t${id}`} cx={zl.p.x} cy={zl.p.y} r={r * 1.9} fill="url(#tentStripes)" stroke={INK} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />);
      if (z.sacred) out.push(<circle key={`s${id}`} cx={zl.p.x} cy={zl.p.y} r={r + 5 * u} fill="none" stroke={ink.house} strokeWidth={4} vectorEffect="non-scaling-stroke" />);
    }

    // trails
    for (const e of layout.edges) {
      const a = P(e.a.id);
      const b = P(e.b.id);
      const street = !!e.a.street && !!e.b.street;
      const blocked = isBlocked(g, e.a.id, e.b.id);
      out.push(
        <g key={`e${e.a.id}-${e.b.id}`}>
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={INK} strokeWidth={street ? 12 : 9} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={street ? ink.street : ink.trail} strokeWidth={street ? 8 : 5.5} strokeLinecap="round" strokeDasharray={blocked ? '6 4' : undefined} vectorEffect="non-scaling-stroke" />
        </g>,
      );
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      if (blocked)
        out.push(
          <g key={`x${e.a.id}-${e.b.id}`} transform={`translate(${mx} ${my}) scale(${u})`}>
            <rect x={-7} y={-2.5} width={14} height={5} fill="#b3161b" stroke={INK} strokeWidth={1.5} transform="rotate(45)" />
            <rect x={-7} y={-2.5} width={14} height={5} fill="#b3161b" stroke={INK} strokeWidth={1.5} transform="rotate(-45)" />
          </g>,
        );
      else if (!e.ab !== !e.ba) {
        const fwd = !!e.ab;
        out.push(
          <g key={`o${e.a.id}-${e.b.id}`} transform={`translate(${mx} ${my}) rotate(${fwd ? ang : ang + 180}) scale(${u})`}>
            <path d="M-4 -6 L5 0 L-4 6Z" fill={INK} />
          </g>,
        );
      }
    }
    if (g.tunnel.length === 2 && layout.zones.get(g.tunnel[0]) && layout.zones.get(g.tunnel[1])) {
      const a = P(g.tunnel[0]);
      const b = P(g.tunnel[1]);
      const mx = (a.x + b.x) / 2 - (b.y - a.y) * 0.18;
      const my = (a.y + b.y) / 2 + (b.x - a.x) * 0.18;
      out.push(<path key="tunnel" d={`M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`} fill="none" stroke={INK} strokeWidth={2.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />);
    }

    // spaces
    for (const [id, zl] of layout.zones) {
      const z = zl.z;
      const r = zl.r * u;
      const sq = isSquare(z, loc);
      const fill = z.exit ? '#cfe1c4' : z.street ? '#d6d1c8' : ink.tile;
      const glyph = placeGlyph(loc.id, z);
      const gs = r * 1.2;
      out.push(
        <g key={`z${id}`}>
          {sq ? (
            <>
              <rect x={zl.p.x - r} y={zl.p.y - r + 2 * u} width={r * 2} height={r * 2} rx={3 * u} fill={INK} />
              <rect x={zl.p.x - r} y={zl.p.y - r} width={r * 2} height={r * 2} rx={3 * u} fill={fill} stroke={INK} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
            </>
          ) : (
            <>
              <circle cx={zl.p.x} cy={zl.p.y + 2 * u} r={r} fill={INK} />
              <circle cx={zl.p.x} cy={zl.p.y} r={r} fill={fill} stroke={INK} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
            </>
          )}
          {glyph ? (
            <path
              d={glyph.d}
              transform={`translate(${zl.p.x - gs / 2} ${zl.p.y - gs / 2}) scale(${gs / 24})`}
              fill={glyph.line ? 'none' : ink.icon}
              stroke={glyph.line ? ink.icon : 'none'}
              strokeWidth={glyph.line ? 2.2 : 0}
              strokeLinecap="round"
              strokeLinejoin="round"
              fillRule="evenodd"
            />
          ) : null}
          {z.exit ? (
            <g transform={`translate(${zl.p.x - r * 0.95} ${zl.p.y - r * 0.95}) scale(${u})`}>
              <rect x={-9} y={-11} width={18} height={22} rx={2} fill="#3e7a3a" stroke={INK} strokeWidth={2} />
              <path d="M-4 -7h8v16h-8z" fill="#efe6d2" />
              <circle cx={2} cy={1.5} r={1.2} fill={INK} />
            </g>
          ) : null}
          {z.window ? (
            <g transform={`translate(${zl.p.x + r * 0.9} ${zl.p.y + r * 0.85}) scale(${u})`}>
              <rect x={-7} y={-7} width={14} height={14} rx={2} fill="#9fc3d6" stroke={INK} strokeWidth={2} />
              <path d="M0 -6v12M-6 0h12" stroke={INK} strokeWidth={1.6} />
            </g>
          ) : null}
        </g>,
      );
    }

    // item decks on search spaces
    for (const [id, zl] of layout.zones) {
      const z = zl.z;
      if (!z.search) continue;
      const deckId = z.deck ?? z.id;
      const deck = g.itemDecks[deckId] ?? [];
      const searched = g.tokens.some((t) => t.zone === id && (t.id === 'searched' || t.id === 'mlFire'));
      const n = deck.length;
      out.push(
        <g key={`deck${id}`} transform={`translate(${zl.p.x + zl.r * u * 0.9} ${zl.p.y - zl.r * u * 0.9}) scale(${u})`}>
          <circle cy={1.5} r={9.5} fill={INK} />
          <circle r={9.5} fill={n ? '#e8742a' : '#dccfb4'} stroke={INK} strokeWidth={1.8} />
          <path d={WRENCH} transform="translate(-6 -6) scale(0.5)" fill={INK} />
          {n ? (
            <g transform="translate(9 8)">
              <circle r={6.5} fill="#efe6d2" stroke={INK} strokeWidth={1.4} />
              <text y={3.6} textAnchor="middle" className="deck-n">
                {n}
              </text>
            </g>
          ) : null}
          {searched ? <path d="M-8 -8 L8 8" stroke="#b3161b" strokeWidth={3} strokeLinecap="round" /> : null}
        </g>,
      );
    }

    // name plates
    for (const [id, zl] of layout.zones) {
      const { label } = zl;
      const z = zl.z;
      const plate = z.exit ? '#3e7a3a' : INK;
      out.push(
        <g key={`l${id}`} transform={`translate(${zl.p.x} ${zl.p.y}) scale(${u})`} className="zlabel">
          <rect x={label.x} y={label.y} width={label.w} height={label.h} rx={3} fill={plate} />
          {label.lines.map((ln, i) => (
            <text key={i} x={label.x + label.w / 2} y={label.y + 11 + i * 13} textAnchor="middle">
              {ln}
            </text>
          ))}
        </g>,
      );
    }

    // printed tokens
    const stackAt = new Map<string, number>();
    for (const [i, t] of g.tokens.entries()) {
      const c = TOKEN_CHIT[t.id];
      const zl = layout.zones.get(t.zone);
      if (!c || !zl) continue;
      let x: number;
      let y: number;
      if (t.to && layout.zones.get(t.to)) {
        const q = layout.zones.get(t.to)!.p;
        x = (zl.p.x + q.x) / 2;
        y = (zl.p.y + q.y) / 2;
      } else {
        const k = stackAt.get(t.zone) ?? 0;
        stackAt.set(t.zone, k + 1);
        x = zl.p.x - zl.r * u - 4 * u;
        y = zl.p.y - zl.r * u * 0.2 + k * 20 * u;
      }
      const w = c.label.length * 6.4 + 10;
      out.push(
        <g key={`tk${i}`} transform={`translate(${x} ${y}) scale(${u})`}>
          <rect x={t.to ? -w / 2 : -w} y={-9} width={w} height={18} rx={3} fill={c.fill} stroke={INK} strokeWidth={1.6} />
          <text x={t.to ? 0 : -w / 2} y={4} textAnchor="middle" className="chit-t" fill={c.ink ?? INK}>
            {c.label}
          </text>
        </g>,
      );
    }
    return <g>{out}</g>;
  },
  (a, b) => a.sig === b.sig && a.layout === b.layout && a.ink === b.ink && a.loc === b.loc,
);

function PanicLayer({ layout, view, panicAll, inspect, edge }: { layout: BoardLayout; view: DisplayView; panicAll: boolean; inspect: string | null; edge?: [string, string] }) {
  const u = 1 / layout.ppu;
  // only the tiles on show are placed, so they can spread out
  // panic numbers only when they matter: a panic move playing, the space you're inspecting, or "1-6" on
  void view;
  const want = (from: string, to: string) => panicAll || inspect === from || (!!edge && edge[0] === from && edge[1] === to);
  const key = panicAll ? 'all' : layout.tiles.filter((t) => want(t.from, t.to)).map((t) => `${t.from}>${t.to}`).join(',');
  const shown = useMemo(
    () => (panicAll ? layout.tiles : placeTiles(layout, panicArrows(layout.edges).filter((a) => key.split(',').includes(`${a.from.id}>${a.to.id}`)))),
    [layout, key, panicAll], // eslint-disable-line react-hooks/exhaustive-deps
  );
  if (!shown.length) return null;
  return (
    <g pointerEvents="none">
      {shown.map((t) => {
        const hot = edge && edge[0] === t.from && edge[1] === t.to;
        const ang = (Math.atan2(t.uy, t.ux) * 180) / Math.PI;
        return (
          <g key={`${t.from}>${t.to}`} transform={`translate(${t.x} ${t.y}) scale(${u * (hot ? 1.15 : 1)})`}>
            <rect x={-t.w / 2} y={-8} width={t.w} height={16} rx={3} fill={hot ? '#f2c230' : '#efe6d2'} stroke={INK} strokeWidth={1.5} />
            <text x={0} y={4} textAnchor="middle" className="tile-t">
              {t.text}
            </text>
            <g transform={`rotate(${ang}) translate(${t.w / 2 + 6} 0)`}>
              <path d="M-3 -4 L3 0 L-3 4Z" fill={INK} />
            </g>
          </g>
        );
      })}
    </g>
  );
}

function Trail({ layout, path }: { layout: BoardLayout; path: string[] }) {
  const pts = path
    .map((id) => layout.zones.get(id)?.p)
    .filter(Boolean)
    .map((p) => `${p!.x},${p!.y}`)
    .join(' ');
  return <polyline className="trail" points={pts} fill="none" stroke="#b3161b" strokeWidth={3} strokeDasharray="6 5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />;
}

function Targets({ layout, base, targets, pressed, loc }: { layout: BoardLayout; base: View; targets: string[]; pressed: string | null; loc: LocationDef }) {
  const u = 1 / layout.ppu;
  // lit spaces keep their printed place icon
  const glyphs = new Map(targets.map((id) => [id, layout.zones.get(id) ? placeGlyph(loc.id, layout.zones.get(id)!.z) : null]));
  return (
    <g pointerEvents="none">
      <rect x={base.x0 - 200} y={base.y0 - 200} width={base.w + 400} height={base.h + 400} fill={INK} opacity={0.35} />
      {targets.map((id) => {
        const zl = layout.zones.get(id);
        if (!zl) return null;
        const r = zl.r * u;
        const sq = isSquare(zl.z, loc);
        return (
          <g key={id}>
            {sq ? (
              <rect x={zl.p.x - r} y={zl.p.y - r} width={r * 2} height={r * 2} rx={3 * u} fill="#efe6d2" stroke={INK} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
            ) : (
              <circle cx={zl.p.x} cy={zl.p.y} r={r} fill="#efe6d2" stroke={INK} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
            )}
            {glyphs.get(id) ? (
              <path
                d={glyphs.get(id)!.d}
                transform={`translate(${zl.p.x - r * 0.6} ${zl.p.y - r * 0.6}) scale(${(r * 1.2) / 24})`}
                fill={glyphs.get(id)!.line ? 'none' : '#6b5434'}
                stroke={glyphs.get(id)!.line ? '#6b5434' : 'none'}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fillRule="evenodd"
              />
            ) : null}
            <g transform={`translate(${zl.p.x} ${zl.p.y})`}>
              <circle className="lit-ring" r={r + 6 * u} fill="none" stroke="#f2c230" strokeWidth={3.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
              {pressed === id ? <circle r={r + 10 * u} fill="none" stroke={INK} strokeWidth={4} vectorEffect="non-scaling-stroke" /> : null}
            </g>
            <g transform={`translate(${zl.p.x} ${zl.p.y}) scale(${u})`}>
              <path transform="translate(-8 -8) scale(0.66)" fill={INK} d="M8 2c1.7 0 2.7 1.8 2.7 4.3S9.5 11 8 11 5.3 8.8 5.3 6.3 6.3 2 8 2zm-.2 10.3c1.4 0 2.3.9 2.3 2.3S9 17 7.8 17s-2.3-1-2.3-2.4.9-2.3 2.3-2.3zM16 7c1.7 0 2.7 1.8 2.7 4.3S17.5 16 16 16s-2.7-2.2-2.7-4.7S14.3 7 16 7zm-.2 10.3c1.4 0 2.3.9 2.3 2.3S17 22 15.8 22s-2.3-1-2.3-2.4.9-2.3 2.3-2.3z" />
            </g>
            <g transform={`translate(${zl.p.x} ${zl.p.y}) scale(${u})`} className="zlabel">
              <rect x={zl.label.x} y={zl.label.y} width={zl.label.w} height={zl.label.h} rx={3} fill={INK} />
              {zl.label.lines.map((ln, i) => (
                <text key={i} x={zl.label.x + zl.label.w / 2} y={zl.label.y + 11 + i * 13} textAnchor="middle">
                  {ln}
                </text>
              ))}
            </g>
          </g>
        );
      })}
    </g>
  );
}

function Meeple({ x, y, size, color, u, base, className, style }: { x: number; y: number; size: number; color: string; u: number; base?: boolean; className?: string; style?: React.CSSProperties }) {
  const s = size * u;
  return (
    <g className={`tok ${className ?? ''}`} style={{ transform: `translate(${x}px, ${y}px)`, ...style }}>
      {base ? <ellipse cx={0} cy={s * 0.46} rx={s * 0.42} ry={s * 0.12} fill={INK} /> : null}
      <use href="#meeple" x={-s / 2 + s * 0.07} y={-s / 2 + s * 0.08} width={s} height={s} fill={INK} />
      <use href="#meeple" x={-s / 2} y={-s / 2} width={s} height={s} fill={color} stroke={INK} strokeWidth={1.4} paintOrder="stroke" vectorEffect="non-scaling-stroke" />
    </g>
  );
}

function TokenLayer({ g, layout, view, fx, splats }: { g: GameState; layout: BoardLayout; view: DisplayView; fx: BoardFx; splats: string[] }) {
  const u = 1 / layout.ppu;
  const at = (id: string) => layout.zones.get(id);
  const items: ReactNode[] = [];

  for (const z of new Set(splats)) {
    const zl = at(z);
    if (!zl) continue;
    items.push(
      <g key={`sp${z}`} transform={`translate(${zl.p.x + 2 * u} ${zl.p.y + 8 * u}) scale(${u})`} pointerEvents="none">
        <path transform="translate(-11 -11) scale(0.92)" fill="#b3161b" stroke={INK} strokeWidth={1.2} d="M12 3l1.6 4.2L17.5 4l-1.2 4.6 4.7-.3-3.6 3 3.9 2.6-4.6.9 1.7 4.3-4-2.4-.9 4.3-1.7-4.1L8.7 20l.6-4.6-4.6.6 3.4-3.2-3.9-2.4 4.6-.6L7 5.5l3.9 2.7z" />
      </g>,
    );
  }

  // victims, grouped by the zone they're shown in
  const shown = new Map<string, { id: string; role?: string }[]>();
  for (const v of view.victims) {
    const z = fx.runners?.[v.id] ?? v.zone;
    if (!shown.has(z)) shown.set(z, []);
    shown.get(z)!.push(v);
  }
  for (const [z, vs] of shown) {
    const zl = at(z);
    if (!zl) continue;
    vs.sort((a, b) => +!!b.role - +!!a.role);
    const draw = vs.length > 3 ? vs.slice(0, 2) : vs;
    const n = draw.length + (vs.length > 3 ? 1 : 0);
    draw.forEach((v, i) => {
      const x = zl.p.x + (i - (n - 1) / 2) * 11 * u;
      const y = zl.p.y + 5 * u;
      items.push(<Meeple key={`v${v.id}`} x={x} y={y} size={18} color={victimHex(v.role)} u={u} className="victim" />);
    });
    if (vs.length > 3) {
      const x = zl.p.x + (n - 1 - (n - 1) / 2) * 11 * u;
      items.push(
        <g key={`vn${z}`} transform={`translate(${x} ${zl.p.y + 5 * u}) scale(${u})`}>
          <rect x={-9} y={-8} width={20} height={16} rx={3} fill="#f2c230" stroke={INK} strokeWidth={1.5} />
          <text x={1} y={4} textAnchor="middle" className="tile-t">
            ×{vs.length - 2}
          </text>
        </g>,
      );
    }
  }

  // minions and birds
  const mz = new Map<string, { id: string; hp: number }[]>();
  for (const m of view.minions) {
    const z = fx.minionAt?.id === m.id ? fx.minionAt.zone : m.zone;
    if (!mz.has(z)) mz.set(z, []);
    mz.get(z)!.push(m);
  }
  for (const [z, ms] of mz) {
    const zl = at(z);
    if (!zl) continue;
    ms.forEach((m, i) => {
      if (g.film.birds) {
        const x = zl.p.x + (zl.r + 10 + i * 13) * u;
        items.push(
          <g key={`b${m.id}`} className="tok" style={{ transform: `translate(${x}px, ${zl.p.y - 2 * u}px)` }}>
            <circle r={8 * u} fill="#4a5560" stroke={INK} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
            <path transform={`scale(${u * 0.6}) translate(-12 -12)`} fill="#efe6d2" d="M2 9c3-1 6 0 8 3 1-4 4-7 8-7l4 1-3 1c1 3-1 7-5 9l-2 4-1-3c-3 0-6-2-9-8z" />
          </g>,
        );
      } else {
        const x = zl.p.x - (zl.r + 10 + i * 14) * u;
        items.push(
          <g key={`m${m.id}`} className="tok" style={{ transform: `translate(${x}px, ${zl.p.y}px)` }}>
            <rect x={-7 * u} y={-8 * u} width={14 * u} height={16 * u} rx={2 * u} fill="#c9a46a" stroke={INK} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
            <path transform={`scale(${u * 0.5}) translate(-12 -12)`} fill={INK} d="M4 2h16v2h-3v3.2a3 3 0 11-2 0V4H9v3.2a3 3 0 11-2 0V4H4zm8 8a3 3 0 110 6 3 3 0 010-6zm-1 7h2l2 5h-2l-1-2.5L11 22H9z" />
          </g>,
        );
      }
    });
  }

  // the Final Girl and the Killer
  const fz = at(fx.fgAt ?? view.fz);
  if (fz) items.push(<Meeple key="fg" x={fz.p.x - 9 * u} y={fz.p.y - 15 * u} size={28} color={GIRL} u={u} className="girl" />);
  const killerShown = !g.film.birds && !g.film.maple?.offBoard;
  const kz = at(fx.killerAt ?? view.kz);
  if (killerShown && kz) items.push(<Meeple key="killer" x={kz.p.x + 11 * u} y={kz.p.y - 17 * u} size={32} color={KILLER} u={u} base className="killer" />);

  // a death in progress
  if (fx.dying) {
    const zl = at(fx.dying);
    if (zl)
      items.push(
        <g key="dying" transform={`translate(${zl.p.x} ${zl.p.y + 5 * u})`}>
          <g className="tip">
            <use href="#meeple" x={-9 * u} y={-9 * u} width={18 * u} height={18 * u} fill="#f2c230" stroke={INK} strokeWidth={1.4} paintOrder="stroke" vectorEffect="non-scaling-stroke" />
          </g>
        </g>,
      );
  }
  return <g pointerEvents="none">{items}</g>;
}
