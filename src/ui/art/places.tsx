// The five locations as wide establishing shots (360 x 240): the backdrop of
// the box back, the end-screen poster and the tape covers.

import type { ReactNode } from 'react';
import { BONE, Dots, Halo, INK, line, type Drawing, type Kit } from './kit';

const L = line(3);
const T = line(2);

const place = (label: string, bust: [number, number, number, number], draw: (k: Kit) => ReactNode): Drawing => ({
  box: [0, 0, 360, 240],
  crops: { bust, band: [0, 50, 360, 150] },
  label,
  draw,
});

/** A pine: a stack of three ink triangles on a trunk. */
const pine = (x: number, base: number, h: number) => {
  const w = h * 0.42;
  const t = base - h;
  return `M${x} ${t}l${w * 0.55} ${h * 0.36}h${-w * 0.2}l${w * 0.75} ${h * 0.34}h${-w * 0.25}l${w * 0.95} ${h * 0.3}H${x - w * 1.25}l${w * 0.95}-${h * 0.3}h${-w * 0.25}l${w * 0.75}-${h * 0.34}h${-w * 0.2}z`;
};

/* ---- Camp Happy Trails ----------------------------------------------------- */

const C = { sky: '#2f4a32', moon: '#e07a2e', pine: '#1d2f20', lake: '#2e5a6b', wood: '#6b4423', lamp: '#f2b45a' };

const campHappyTrails = place('Camp Happy Trails: cabins on a lake under an orange moon', [96, 40, 160, 160], (k) => (
  <>
    <rect x={-10} y={-10} width={380} height={260} fill={C.sky} />
    <Halo k={k} name="moon" cx={276} cy={58} r={32} color={C.moon} ring={9} />
    <circle cx={276} cy={58} r={32} fill={C.moon} {...L} />
    {/* far shore */}
    <path d={[30, 52, 74, 200, 222, 246, 300, 322, 344].map((x, i) => pine(x, 142, 40 + ((i * 13) % 22))).join('')} fill={C.pine} {...T} />
    <path d="M-10 142h380v10H-10z" fill={C.pine} {...T} />
    {/* two cabins with their lights on */}
    <path d="M100 142v-26l22-18 22 18v26z" fill={C.wood} {...L} />
    <path d="M94 118l28-24 28 24" fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M110 122h10v10h-10zM126 124h8v18h-8z" fill={C.lamp} {...T} />
    <path d="M160 142v-20l18-14 18 14v20z" fill={C.wood} {...L} />
    <path d="M154 124l24-20 24 20" fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M172 126h12v10h-12z" fill={C.lamp} {...T} />
    {/* the lake and the moon on it */}
    <rect x={-10} y={150} width={380} height={100} fill={C.lake} {...L} />
    <path d="M252 160h48v5h-48zM258 172h36v5h-36zM264 184h24v4h-24zM270 196h12v4h-12z" fill={C.moon} />
    <path d="M110 150v10h6v-10M174 150v8h6v-8" fill={C.lamp} />
    <path d="M30 178q12-5 24 0M196 172q12-5 24 0M120 206q12-5 24 0M300 220q12-5 24 0" fill="none" stroke={BONE} strokeWidth={2.2} strokeLinecap="round" />
    {/* the canoe */}
    <path d="M190 196c20 6 50 6 70 0-6 8-18 12-34 12s-30-4-36-12z" fill={C.moon} {...L} />
    {/* the dock */}
    <path d="M-10 196l136-16 4 12-140 22z" fill={C.wood} {...L} />
    <path d="M30 204v26M80 198v22M118 192v18" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    <path d="M20 192l2 16M48 188l2 16M76 185l2 15M102 182l2 14" stroke={INK} strokeWidth={1.4} />
    {/* pines close by */}
    <path d={`${pine(10, 250, 170)}${pine(352, 250, 150)}`} fill={INK} {...T} />
  </>
));

/* ---- Creech Manor ---------------------------------------------------------- */

const M = { sky: '#3b2140', moon: '#d9a441', hill: '#26142b', wall: '#5a3a5e', path: '#7a4f7f' };

const creechManor = place('Creech Manor on its hill, windows lit gold', [150, 20, 170, 170], (k) => (
  <>
    <rect x={-10} y={-10} width={380} height={260} fill={M.sky} />
    <Halo k={k} name="moon" cx={88} cy={66} r={38} color={M.moon} ring={10} />
    <circle cx={88} cy={66} r={38} fill={M.moon} {...L} />
    <path d="M-10 250v-60c80-36 170-50 250-42 60 6 100 22 130 40v62z" fill={M.hill} {...L} />
    <path d="M210 150c-10 30-40 50-90 100h40c40-40 64-70 66-100z" fill={M.path} {...T} />
    {/* the manor: a tower, a mansard roof, chimneys */}
    <path d="M176 152V92h12V70l14-30 14 30v22h10v60z" fill={M.wall} {...L} />
    <path d="M188 70h28" {...T} />
    <path d="M222 152V96l12-20h76l12 20v56z" fill={M.wall} {...L} />
    <path d="M222 96h100" {...T} />
    <path d="M234 76l-4-22h12l-2 22zM296 76l-4-26h12l-2 26z" fill={INK} {...T} />
    <path d="M196 84h12v14h-12zM194 112h16v16h-16zM236 104h14v16h-14zM266 104h14v16h-14zM294 104h14v16h-14zM236 128h14v16h-14zM294 128h14v16h-14z" fill={M.moon} {...T} />
    <path d="M266 130h14v22h-14z" fill={INK} {...T} />
    <path d="M200 40v-10" stroke={INK} strokeWidth={2} />
    {/* dead tree */}
    <path d="M44 250c4-40 6-70 2-100-10-12-24-18-38-18 14-4 28 0 38 8 0-14-6-26-14-34 12 6 18 18 20 30 6-12 16-20 28-22-10 8-18 20-20 34 8-6 20-8 30-4-12 2-22 8-28 16-2 30-2 60 4 90z" fill={INK} {...T} />
    {/* bats */}
    <path d="M150 50c4-4 8-4 10 0 2-4 6-4 10 0-4 0-6 2-10 6-4-4-6-6-10-6zM186 26c3-3 6-3 8 0 2-3 5-3 8 0-3 0-5 2-8 5-3-3-5-5-8-5zM128 84c3-3 6-3 8 0 2-3 5-3 8 0-3 0-5 2-8 5-3-3-5-5-8-5z" fill={INK} />
    {/* iron fence */}
    <path d="M-10 222h380M-10 238h380" stroke={INK} strokeWidth={3} />
    <path d={Array.from({ length: 31 }, (_, i) => `M${i * 12} 240v-28l-3 4m3-4l3 4`).join('')} stroke={INK} strokeWidth={2.4} fill="none" />
  </>
));

/* ---- Carnival of Blood ----------------------------------------------------- */

const R = { red: '#c8272d', cream: '#f4e9d0', yellow: '#f2b705', dust: '#c49a6c', night: '#2a1a1c' };

const wheel = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  return [96 + 74 * Math.cos(a), 104 + 74 * Math.sin(a)] as const;
});

const carnivalOfBlood = place('The Carnival of Blood: a big top and a Ferris wheel', [168, 20, 180, 180], (k) => (
  <>
    <rect x={-10} y={-10} width={380} height={260} fill={R.night} />
    <Halo k={k} name="glow" cx={240} cy={120} r={90} color={R.red} ring={12} />
    {/* Ferris wheel */}
    <path d="M96 104L60 214M96 104l36 110M50 214h92" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <circle cx={96} cy={104} r={74} fill="none" stroke={INK} strokeWidth={7} />
    <circle cx={96} cy={104} r={74} fill="none" stroke={R.cream} strokeWidth={3} />
    {wheel.map(([x, y], i) => (
      <path key={`s${i}`} d={`M96 104L${x} ${y}`} stroke={R.cream} strokeWidth={2} />
    ))}
    <circle cx={96} cy={104} r={8} fill={R.yellow} {...T} />
    {wheel.map(([x, y], i) => (
      <path key={`c${i}`} d={`M${x - 8} ${y}h16v10c0 4-4 6-8 6s-8-2-8-6z`} fill={R.yellow} {...T} />
    ))}
    {/* the big top */}
    <path d="M150 210l20-96 70-74 70 74 20 96z" fill={R.cream} {...L} />
    <path d="M240 40l-50 74-12 96h24l8-96zM240 40l-6 74 2 96h26l-6-96zM240 40l40 74 16 96h20l-24-96z" fill={R.red} {...T} />
    <path d="M170 114c10 10 20 10 30 0 10 10 20 10 30 0 10 10 20 10 30 0 10 10 20 10 30 0 10 10 20 10 30 0" fill={R.yellow} {...L} />
    <path d="M228 210v-40c0-8 6-14 12-14s12 6 12 14v40z" fill={INK} {...T} />
    <path d="M240 40V20l18 6-18 6" fill={R.yellow} {...T} />
    {/* bunting */}
    <path d="M-10 30c60 20 120 20 190 0M300 30c20 8 40 10 70 4" fill="none" stroke={INK} strokeWidth={2} />
    <path
      d={[0, 24, 48, 72, 96, 120, 144, 166].map((x, i) => `M${x} ${33 + Math.sin((x / 180) * Math.PI) * 12 + (i === 0 ? 0 : 0)}l10 18 10-17z`).join('')}
      fill={R.yellow}
      {...T}
    />
    {/* sawdust */}
    <path d="M-10 250v-40h380v40z" fill={R.dust} {...L} />
    <path d="M30 224h6M80 232h4M150 222h6M210 234h4M280 226h6M330 232h4" stroke={INK} strokeWidth={2} strokeLinecap="round" />
  </>
));

/* ---- Maple Lane ------------------------------------------------------------ */

const S = { sky: '#22341a', lawn: '#5e8c3a', roof: '#9e2b25', road: '#6e6a66', lamp: '#f2d27a', hedge: '#3c5a2e' };

/** A front-facing house with a gable roof; `lit` windows glow lamp yellow. */
const house = (x: number, base: number, w: number, lit: boolean[]) => {
  const h = w * 0.62;
  const win = w * 0.2;
  return (
    <g key={x}>
      <path d={`M${x} ${base}v${-h}h${w}v${h}z`} fill={BONE} {...L} />
      <path d={`M${x - w * 0.08} ${base - h + 2}L${x + w / 2} ${base - h - w * 0.42}L${x + w * 1.08} ${base - h + 2}z`} fill={S.roof} {...L} />
      <path d={`M${x + w * 0.14} ${base - h * 0.72}h${win}v${win}h${-win}z`} fill={lit[0] ? S.lamp : INK} {...T} />
      <path d={`M${x + w * 0.66} ${base - h * 0.72}h${win}v${win}h${-win}z`} fill={lit[1] ? S.lamp : INK} {...T} />
      <path d={`M${x + w * 0.42} ${base}v${-h * 0.42}h${w * 0.16}v${h * 0.42}z`} fill={S.roof} {...T} />
    </g>
  );
};

const mapleLane = place('Maple Lane: a quiet street of houses under a streetlight', [100, 40, 160, 160], (k) => (
  <>
    <defs>
      <Dots k={k} name="lamp" color={S.lamp} r={1.6} gap={6} />
    </defs>
    <rect x={-10} y={-10} width={380} height={260} fill={S.sky} />
    <circle cx={70} cy={40} r={18} fill={BONE} {...L} />
    <circle cx={64} cy={36} r={4} fill={'#d8cfbb'} />
    <path d="M-10 250v-118h380v118z" fill={S.lawn} {...L} />
    {house(4, 136, 64, [true, false])}
    {house(90, 128, 42, [false, true])}
    {house(228, 128, 42, [true, true])}
    {house(292, 136, 64, [false, true])}
    {/* the street, running off to the horizon */}
    <path d="M150 130h60l120 120H30z" fill={S.road} {...L} />
    <path d="M178 136h4l1 10h-6zM176 156h8l2 16h-12zM172 186h16l4 26h-24zM168 228h24l3 22h-30z" fill={BONE} />
    {/* picket fences */}
    <path d={Array.from({ length: 9 }, (_, i) => `M${8 + i * 12} 172v-16l3-4 3 4v16z`).join('')} fill={BONE} {...T} />
    <path d={Array.from({ length: 9 }, (_, i) => `M${250 + i * 12} 172v-16l3-4 3 4v16z`).join('')} fill={BONE} {...T} />
    <path d="M4 164h110M246 164h110" stroke={INK} strokeWidth={2.4} />
    {/* the streetlight and its pool of light */}
    <path d="M280 136h42l40 114H242z" fill={k.url('lamp')} />
    <path d="M320 250V64c0-10-8-14-20-12" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <path d="M286 62h24l-4 12h-16z" fill={S.lamp} {...L} />
    {/* a hedge and a mailbox */}
    <path d="M-10 250v-30c10-10 24-10 32 0 8-10 22-10 30 0 8-8 18-6 24 2v28z" fill={S.hedge} {...L} />
    <path d="M110 250v-34" stroke={INK} strokeWidth={5} />
    <path d="M98 204h24v14H98z" fill={S.roof} {...L} />
  </>
));

/* ---- Sacred Groves --------------------------------------------------------- */

const V = { sky: '#c47f2c', sun: '#efd9a4', rust: '#8e3b23', stone: '#b8a88a', leaf: '#1f4d3a', river: '#2b6e6a' };

/** Broad leaves fanning out from the tops of the two trees: x, y, angle, length. */
const fronds: [number, number, number, number][] = [
  [58, 92, 200, 58], [58, 92, 235, 52], [58, 92, 275, 46], [58, 92, 315, 54], [58, 92, 345, 58], [58, 92, 20, 50],
  [300, 92, 160, 58], [300, 92, 195, 54], [300, 92, 235, 50], [300, 92, 265, 46], [300, 92, 305, 52], [300, 92, -20, 56],
];

const sacredGroves = place('The Sacred Groves: a stepped temple ruin in the jungle', [100, 14, 160, 160], (k) => (
  <>
    <rect x={-10} y={-10} width={380} height={260} fill={V.sky} />
    <Halo k={k} name="sun" cx={180} cy={70} r={46} color={V.rust} ring={10} />
    <circle cx={180} cy={70} r={46} fill={V.sun} {...L} />
    {/* the stepped temple */}
    <path d="M90 196h180l-14-26H104zM104 170h152l-14-26H118zM118 144h124l-14-26H132zM132 118h96l-12-24h-72z" fill={V.stone} {...L} />
    <path d="M160 94V68h40v26z" fill={V.stone} {...L} />
    <path d="M172 94V78h16v16z" fill={INK} {...T} />
    <path d="M156 68h48l-4-8h-40z" fill={V.rust} {...L} />
    <path d="M166 196l6-102h16l6 102z" fill={V.rust} {...T} />
    <path d="M168 180h24M169 164h22M170 148h20M171 132h18M172 116h16M173 102h14" stroke={INK} strokeWidth={1.6} />
    <path d="M110 170v26M124 144v26M138 118v26M222 118v26M236 144v26M250 170v26" stroke={INK} strokeWidth={1.4} />
    {/* vines over the stone */}
    <path d="M132 118c4 14-2 24 4 36s-2 20 2 30M228 118c-6 10 0 22-4 32s4 16 0 28M148 94c-2 8 2 14-2 22" fill="none" stroke={V.leaf} strokeWidth={4} strokeLinecap="round" />
    {/* jungle on both sides: trunks and fans of broad leaves */}
    <path d="M-10 210V100c20-6 40-2 56 8 14-6 30-4 44 6 12 20 14 50 6 80l-16 16zM370 210V96c-20-6-42-2-58 8-14-6-30-4-42 6-12 20-12 52-4 82l16 18z" fill={V.leaf} {...L} />
    <path d="M40 210c2-40 6-80 18-118M316 210c-2-40-6-80-16-118" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <path d="M40 210c2-40 6-80 18-118M316 210c-2-40-6-80-16-118" fill="none" stroke={'#5e2614'} strokeWidth={2.5} strokeLinecap="round" />
    {fronds.map(([x, y, a, l], i) => (
      <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
        <path d={`M0 0C${l * 0.3} ${-l * 0.2} ${l * 0.75} ${-l * 0.16} ${l} 0C${l * 0.75} ${l * 0.16} ${l * 0.3} ${l * 0.2} 0 0z`} fill={i % 2 ? V.leaf : '#2d6a4f'} {...T} />
        <path d={`M2 0H${l * 0.9}`} stroke={INK} strokeWidth={1.4} />
      </g>
    ))}
    {/* the river in front */}
    <path d="M-10 250v-44c80-12 160-12 240-4 50 4 100 2 140-6v54z" fill={V.river} {...L} />
    <path d="M40 222q12-5 24 0M150 232q12-5 24 0M260 218q12-5 24 0" fill="none" stroke={BONE} strokeWidth={2.2} strokeLinecap="round" />
  </>
));

export const PLACE_ART: Record<string, Drawing> = { campHappyTrails, creechManor, carnivalOfBlood, mapleLane, sacredGroves };
