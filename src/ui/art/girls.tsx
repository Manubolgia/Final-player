// The twelve Final Girls as cast portraits for the back of the box: one bust
// each (200 x 220), every one with her own hair, silhouette and prop.

import type { ReactNode } from 'react';
import { BLOOD, BONE, Dots, Halo, INK, Limb, line, type Drawing, type Kit } from './kit';

const L = line(3);
const T = line(2);

const SKIN = { light: '#efd6b8', warm: '#e0bb8e', tan: '#c08f62', deep: '#875638' };
const HAIR = { ink: INK, brown: '#5b3a24', auburn: '#8e3b23', blonde: '#e0b24a', grey: '#b9b2a6' };

/** Film palettes: the backdrop, the disc behind her head, and a third ink. */
const FILM = {
  happyTrails: { bg: '#2f4a32', disc: '#e07a2e', third: '#4e6b3e' },
  creech: { bg: '#3b2140', disc: '#d9a441', third: '#7a4f7f' },
  carnival: { bg: '#c8272d', disc: '#f2b705', third: '#f4e9d0' },
  maple: { bg: '#3c5a2e', disc: '#9e2b25', third: '#5e8c3a' },
  groves: { bg: '#8e3b23', disc: '#c47f2c', third: '#2b6e6a' },
  birds: { bg: '#e9e6df', disc: '#b3161b', third: '#5a6570' },
} as const;
type Film = keyof typeof FILM;

const CROPS = { bust: [52, 28, 96, 96] as const, band: [0, 46, 200, 84] as const, head: [30, 10, 140, 140] as const };

/** The backdrop: film colour, a disc of the second ink with a halftone halo. */
function Back({ k, film }: { k: Kit; film: Film }) {
  const f = FILM[film];
  return (
    <>
      <rect x={-10} y={-10} width={220} height={240} fill={f.bg} />
      <Halo k={k} name="disc" cx={100} cy={84} r={60} color={f.disc} ring={10} />
      <circle cx={100} cy={84} r={60} fill={f.disc} {...L} />
    </>
  );
}

const Neck = ({ skin }: { skin: string }) => <path d="M88 100h24v42H88z" fill={skin} {...T} />;

/** Shoulders in a top of this colour; `neck` is the neckline cut drawn over it. */
function Top({ fill, neck = 'M88 150c4 10 20 10 24 0' }: { fill: string; neck?: string }) {
  return (
    <>
      <path d="M22 232c2-46 30-72 66-80h24c36 8 64 34 66 80z" fill={fill} {...L} />
      <path d={neck} fill="none" {...T} />
    </>
  );
}

type Brows = 'set' | 'worried' | 'fierce';
type Mouth = 'set' | 'grim' | 'open' | 'smirk';

const BROWS: Record<Brows, string> = {
  set: 'M84 70l12 2M116 70l-12 2',
  worried: 'M84 72l12-4M116 72l-12-4',
  fierce: 'M83 68l13 5M117 68l-13 5',
};
const MOUTH: Record<Mouth, ReactNode> = {
  set: <path d="M93 104q7 1.6 14 0" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />,
  grim: <path d="M92 105q8-2.4 16 0" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />,
  smirk: <path d="M93 104q8 2 14-2" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />,
  open: <path d="M94 101q6-2 12 0l-1 7q-5 3-10 0z" fill={BLOOD} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />,
};

/** Face, ears and features. `look` shifts the irises sideways. */
function Face({ skin, brows = 'set', mouth = 'set', look = 0, tired = false }: { skin: string; brows?: Brows; mouth?: Mouth; look?: number; tired?: boolean }) {
  return (
    <>
      <path d="M78 82c-7-3-11 3-8 10 2 5 6 6 9 5M122 82c7-3 11 3 8 10-2 5-6 6-9 5" fill={skin} {...T} />
      <path d="M76 78c0-22 10-34 24-34s24 12 24 34c0 20-10 36-24 38-14-2-24-18-24-38z" fill={skin} {...L} />
      {tired ? <path d="M85 87q6 3 11 0M104 87q5 3 11 0" fill="none" stroke={INK} strokeWidth={1.2} /> : null}
      <path d={BROWS[brows]} stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
      <path d="M85 80c4-4 9-4 12 0-3 3-8 3-12 0zM103 80c3-4 8-4 12 0-4 3-9 3-12 0z" fill={BONE} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={91 + look} cy={80} r={2.4} fill={INK} />
      <circle cx={109 + look} cy={80} r={2.4} fill={INK} />
      <path d="M100 84l-3 11c2 1.5 4 1.5 6 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      {MOUTH[mouth]}
    </>
  );
}

/** A puff of curls: overlapping outlined circles, outlines first. */
function Curls({ fill, at }: { fill: string; at: [number, number, number][] }) {
  return (
    <>
      {at.map(([x, y, r]) => (
        <circle key={`o${x}-${y}`} cx={x} cy={y} r={r + 3} fill={INK} />
      ))}
      {at.map(([x, y, r]) => (
        <circle key={`f${x}-${y}`} cx={x} cy={y} r={r} fill={fill} />
      ))}
    </>
  );
}

const girl = (label: string, draw: (k: Kit) => ReactNode): Drawing => ({ box: [0, 0, 200, 220], crops: { ...CROPS }, label, draw });

/* ---- Happy Trails ---------------------------------------------------------- */

const laurie = girl('Laurie with her ponytail, headband and bow', (k) => {
  const f = FILM.happyTrails;
  return (
    <>
      <Back k={k} film="happyTrails" />
      {/* arrows in the quiver over her shoulder */}
      <path d="M50 150L36 70M58 148L50 66M44 152L22 80" stroke={INK} strokeWidth={3} />
      <path d="M30 64l6 6 4-10-4-10zM44 60l6 6 4-10-4-10zM16 74l6 6 4-10-4-10z" fill={BONE} {...T} />
      {/* ponytail swinging out */}
      <path d="M112 42c22 2 34 16 34 34 14 10 22 34 16 64-6-18-16-34-28-44-6-14-14-24-22-30z" fill={HAIR.brown} {...L} />
      <path d="M134 52c4-4 10-4 12 0l-2 8c-4 2-8 2-10-2z" fill={f.disc} {...T} />
      <Neck skin={SKIN.light} />
      <Top fill={f.third} neck="M86 152c4 12 24 12 28 0" />
      <path d="M86 152c4 12 24 12 28 0" fill="none" stroke={f.disc} strokeWidth={4} />
      <path d="M60 162l70 70" stroke={INK} strokeWidth={9} />
      <path d="M60 162l70 70" stroke={HAIR.brown} strokeWidth={5} />
      <Face skin={SKIN.light} brows="set" mouth="set" look={1} />
      <path d="M76 76c-2-26 10-38 26-38 16 0 26 12 24 34-8-12-20-18-34-16-8 4-12 10-16 20z" fill={HAIR.brown} {...L} />
      <path d="M78 64c10-12 34-14 46-4l-1 6c-12-8-32-8-44 4z" fill={BONE} {...T} />
      {/* the recurve bow */}
      <path d="M164 50c14 30 16 120 0 172" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <path d="M164 50c14 30 16 120 0 172" fill="none" stroke={f.disc} strokeWidth={5} strokeLinecap="round" />
      <path d="M164 50v172" stroke={BONE} strokeWidth={1.6} />
      <path d="M160 132h12v18h-12z" fill={HAIR.brown} {...T} />
    </>
  );
});

const reiko = girl('Reiko with a blunt black bob, a whistle and a hatchet', (k) => {
  const f = FILM.happyTrails;
  return (
    <>
      <Back k={k} film="happyTrails" />
      {/* hatchet up by her shoulder */}
      <path d="M156 222l-8-150" stroke={INK} strokeWidth={11} strokeLinecap="round" />
      <path d="M156 222l-8-150" stroke={HAIR.brown} strokeWidth={6} strokeLinecap="round" />
      <path d="M146 70l-2-16 30-6c6 10 6 22 0 30l-26 4z" fill={BONE} {...L} />
      <path d="M172 50c5 9 5 20 0 28" fill="none" stroke={INK} strokeWidth={4} />
      <path d="M70 116c-6-50 6-80 30-80s36 30 30 80z" fill={HAIR.ink} {...L} />
      <Neck skin={SKIN.warm} />
      <Top fill={f.third} neck="M84 150l16 16 16-16" />
      <path d="M84 150l16 16 16-16" fill={BONE} {...T} />
      <path d="M40 200c8-20 20-34 36-42M160 200c-8-20-20-34-36-42" fill="none" stroke={BONE} strokeWidth={5} />
      <path d="M92 152c2 20 6 30 8 34 2-4 6-14 8-34" fill="none" stroke={f.disc} strokeWidth={2.4} />
      <path d="M96 186h8l2 10h-12z" fill={BONE} {...T} />
      <Face skin={SKIN.warm} brows="fierce" mouth="grim" />
      <path d="M78 72c-2-20 8-32 22-32s24 12 22 32z" fill={HAIR.ink} {...L} />
      <path d="M78 72c-4 16-4 32 0 44M122 72c4 16 4 32 0 44" fill="none" stroke={INK} strokeWidth={3} />
      <path d="M112 92l9-3 1 4-9 3z" fill={BONE} stroke={INK} strokeWidth={1.2} />
      {/* fist on the handle */}
      <path d="M140 150c0-8 6-12 12-12s12 4 12 12-4 14-12 14-12-6-12-14z" fill={SKIN.warm} {...L} />
    </>
  );
});

/* ---- Creech Manor ---------------------------------------------------------- */

const alice = girl('Alice with long fair hair and a ribbon, holding a candle', (k) => {
  const f = FILM.creech;
  return (
    <>
      <defs>
        <Dots k={k} name="flame" color={f.disc} r={1.6} gap={5} />
      </defs>
      <Back k={k} film="creech" />
      <path d="M72 70c-6 50-12 100-24 140h104c-12-40-18-90-24-140-4-24-12-32-28-32s-24 8-28 32z" fill={HAIR.blonde} {...L} />
      <path d="M62 180l6 30M136 180l-4 30M78 120l-6 70M124 120l6 70" stroke={INK} strokeWidth={1.6} />
      <Neck skin={SKIN.light} />
      <Top fill={BONE} neck="M84 150c4 14 28 14 32 0" />
      <path d="M78 150c6 22 38 22 44 0l4 4c-6 26-46 26-52 0z" fill={BONE} {...T} />
      <path d="M84 166l4-4 4 5 4-5 4 5 4-5 4 5 4-5 4 4" fill="none" stroke={INK} strokeWidth={1.4} />
      <Face skin={SKIN.light} brows="worried" mouth="open" look={-1} />
      <path d="M76 78c-2-26 10-40 24-40s26 14 24 40c-6-14-14-22-24-22s-18 8-24 22z" fill={HAIR.blonde} {...L} />
      <path d="M78 60c12-12 32-12 44 0l-2 6c-12-10-28-10-40 0z" fill={f.third} {...T} />
      <path d="M118 56l12-8 2 14zM118 56l14 6-6 10z" fill={f.third} {...T} />
      {/* the candle */}
      <circle cx={100} cy={170} r={34} fill={k.url('flame')} />
      <path d="M92 174h16v50H92z" fill={BONE} {...L} />
      <path d="M92 182c4 2 6 6 4 12" fill="none" stroke={INK} strokeWidth={1.4} />
      <path d="M100 172c-8-6-8-16 0-28 8 12 8 22 0 28z" fill={f.disc} {...T} />
      <path d="M100 168c-3-3-3-7 0-12 3 5 3 9 0 12z" fill={BONE} />
      <path d="M78 214c0-10 10-16 22-16s22 6 22 16z" fill={SKIN.light} {...L} />
    </>
  );
});

const selena = girl('Selena with big curls and round glasses, shining a flashlight', (k) => {
  const f = FILM.creech;
  return (
    <>
      <defs>
        <Dots k={k} name="beam" color={BONE} r={1.5} gap={5} />
      </defs>
      <Back k={k} film="creech" />
      <Curls
        fill={HAIR.ink}
        at={[
          [72, 64, 16], [82, 44, 16], [100, 36, 17], [118, 44, 16], [128, 64, 16], [66, 86, 14], [134, 86, 14],
          [64, 106, 13], [136, 106, 13], [70, 124, 11], [130, 124, 11],
        ]}
      />
      <Neck skin={SKIN.tan} />
      <Top fill={f.third} neck="M86 146h28" />
      <path d="M86 140h28v14H86z" fill={f.third} {...T} />
      <path d="M86 146h28" stroke={INK} strokeWidth={1.6} />
      <Face skin={SKIN.tan} brows="set" mouth="set" look={2} />
      {/* round glasses */}
      <circle cx={91} cy={80} r={9} fill="none" stroke={INK} strokeWidth={3} />
      <circle cx={109} cy={80} r={9} fill="none" stroke={INK} strokeWidth={3} />
      <path d="M98 79h4M82 78l-6-2M118 78l6-2" stroke={INK} strokeWidth={2.4} />
      <path d="M86 74l3-2M104 74l3-2" stroke={BONE} strokeWidth={1.6} strokeLinecap="round" />
      <Curls fill={HAIR.ink} at={[[84, 56, 9], [98, 50, 10], [114, 54, 9]]} />
      {/* the flashlight, pointed up into the dark */}
      <path d="M160 128L214 20h-70z" fill={k.url('beam')} />
      <g transform="rotate(30 158 160)">
        <rect x={148} y={140} width={22} height={52} rx={3} fill={INK} {...T} />
        <path d="M144 126h30v16h-30z" fill={f.disc} {...L} />
        <path d="M148 154h22M148 164h22" stroke={f.third} strokeWidth={2} />
      </g>
      <path d="M134 196c0-12 8-20 18-20s16 8 16 20v30h-34z" fill={SKIN.tan} {...L} />
    </>
  );
});

/* ---- Carnival of Blood ----------------------------------------------------- */

const asami = girl('Asami with two buns, peering through a magnifying glass', (k) => {
  const f = FILM.carnival;
  return (
    <>
      <Back k={k} film="carnival" />
      <circle cx={74} cy={40} r={14} fill={HAIR.ink} {...L} />
      <circle cx={126} cy={40} r={14} fill={HAIR.ink} {...L} />
      <path d="M74 96c-4-40 8-58 26-58s30 18 26 58z" fill={HAIR.ink} {...L} />
      <Neck skin={SKIN.warm} />
      <Top fill={f.disc} neck="M84 150l16 10 16-10" />
      <path d="M44 232l18-70M156 232l-18-70" stroke={INK} strokeWidth={2} />
      <path d="M66 176h12M64 192h12M122 176h12M124 192h12" stroke={f.bg} strokeWidth={5} />
      <Face skin={SKIN.warm} brows="set" mouth="smirk" look={-1} />
      <path d="M76 74c0-22 10-34 24-34s24 12 24 34c-6-8-10-12-12-18-6 8-16 12-30 12z" fill={HAIR.ink} {...L} />
      {/* magnifying glass over her right eye */}
      <path d="M78 96l-30 66" stroke={INK} strokeWidth={12} strokeLinecap="round" />
      <path d="M78 96l-30 66" stroke={f.third} strokeWidth={7} strokeLinecap="round" />
      <circle cx={88} cy={78} r={20} fill={f.third} stroke={INK} strokeWidth={5} />
      <path d="M76 78c7-8 17-8 24 0-7 6-17 6-24 0z" fill={BONE} stroke={INK} strokeWidth={1.8} />
      <circle cx={87} cy={78} r={4.6} fill={INK} />
      <path d="M76 66l6-4" stroke={BONE} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M36 176c0-10 8-18 18-16s14 10 12 20l-4 12H40z" fill={SKIN.warm} {...L} />
    </>
  );
});

const charlie = girl('Charlie with a flat-top and a strongman hammer on her shoulder', (k) => {
  const f = FILM.carnival;
  return (
    <>
      <Back k={k} film="carnival" />
      {/* the strongman's hammer across her shoulders */}
      <path d="M196 214L36 100" stroke={INK} strokeWidth={13} strokeLinecap="round" />
      <path d="M196 214L36 100" stroke={f.third} strokeWidth={8} strokeLinecap="round" />
      <g transform="rotate(35 34 98)">
        <rect x={4} y={74} width={60} height={48} rx={6} fill={f.disc} {...L} />
        <path d="M16 74v48M52 74v48" stroke={INK} strokeWidth={3} />
      </g>
      <Neck skin={SKIN.deep} />
      <path d="M14 232c0-50 26-80 70-86h32c44 6 70 36 70 86z" fill={SKIN.deep} {...L} />
      <path d="M58 232c0-40 10-66 28-80h28c18 14 28 40 28 80z" fill={f.third} {...L} />
      <path d="M86 152c4 12 24 12 28 0" fill="none" stroke={f.bg} strokeWidth={4} />
      <path d="M40 186c6-10 14-16 22-18M160 186c-6-10-14-16-22-18" fill="none" stroke={INK} strokeWidth={1.8} />
      <Face skin={SKIN.deep} brows="fierce" mouth="smirk" />
      <path d="M78 66c-2-10 0-22 4-28h36c4 6 6 18 4 28z" fill={HAIR.ink} {...L} />
      <path d="M77 60h46l1 9H76z" fill={f.bg} {...T} />
      {/* fist on the handle */}
      <path d="M150 168c0-8 6-12 12-12s12 4 12 12-4 14-12 14-12-6-12-14z" fill={SKIN.deep} {...L} />
    </>
  );
});

/* ---- Maple Lane ------------------------------------------------------------ */

const nancy = girl('Nancy, wide awake, with auburn waves and a mug of coffee', (k) => {
  const f = FILM.maple;
  return (
    <>
      <Back k={k} film="maple" />
      <path d="M74 60c-14 18-16 50-10 80 8 10 18 12 26 6 0-30-2-60 8-90-10-4-18-2-24 4zM126 60c14 18 16 50 10 80-8 10-18 12-26 6 0-30 2-60-8-90 10-4 18-2 24 4z" fill={HAIR.auburn} {...L} />
      <path d="M68 100c4 6 4 14 0 20M132 100c-4 6-4 14 0 20" fill="none" stroke={INK} strokeWidth={1.6} />
      <Neck skin={SKIN.light} />
      <Top fill={f.third} neck="M84 150l16 30 16-30" />
      <path d="M84 150l16 30 16-30z" fill={BONE} {...T} />
      <path d="M90 156h20M93 164h14" stroke={f.disc} strokeWidth={3} />
      <Face skin={SKIN.light} brows="worried" mouth="grim" tired />
      <path d="M76 80c-4-28 8-42 26-42 16 0 28 14 22 40-6-16-14-22-22-22-4 10-14 18-26 24z" fill={HAIR.auburn} {...L} />
      <path d="M96 42c-6 8-14 14-20 18M112 44c4 8 8 14 10 22" fill="none" stroke={INK} strokeWidth={1.6} />
      {/* coffee */}
      <path d="M126 156c-2-8-4-16 0-24M136 156c-2-8-4-16 0-24M146 156c-2-8-4-16 0-24" fill="none" stroke={BONE} strokeWidth={3} strokeLinecap="round" />
      <path d="M118 162h40l-4 46h-32z" fill={f.disc} {...L} />
      <path d="M158 172c12 0 12 22 0 22" fill="none" stroke={INK} strokeWidth={7} />
      <path d="M158 172c12 0 12 22 0 22" fill="none" stroke={f.disc} strokeWidth={3} />
      <path d="M124 176h28" stroke={BONE} strokeWidth={3} />
      <path d="M108 208c0-12 8-20 16-20h10v26h-26z" fill={SKIN.light} {...L} />
    </>
  );
});

const sheila = girl('Sheila in headphones, holding up an alarm clock', (k) => {
  const f = FILM.maple;
  return (
    <>
      <Back k={k} film="maple" />
      <path d="M70 110c-8-44 6-72 30-72 26 0 40 28 30 72-4-20-8-30-14-34H84c-6 4-10 14-14 34z" fill={HAIR.brown} {...L} />
      <Neck skin={SKIN.tan} />
      <Top fill={BONE} neck="M86 150c4 10 24 10 28 0" />
      <path d="M22 232c2-46 30-72 66-80l-6 80zM178 232c-2-46-30-72-66-80l6 80z" fill={f.third} {...L} />
      <Face skin={SKIN.tan} brows="set" mouth="smirk" look={2} />
      <path d="M78 66c4-20 14-28 24-28 14 0 22 10 22 26-10-6-22-8-30-4-6-2-12 0-16 6z" fill={HAIR.brown} {...L} />
      <path d="M86 46c4 6 4 12 0 18M100 40c4 6 4 14 2 20" fill="none" stroke={INK} strokeWidth={1.6} />
      {/* headphones and their cord */}
      <path d="M72 82c-4-36 10-54 28-54s32 18 28 54" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d="M72 82c-4-36 10-54 28-54s32 18 28 54" fill="none" stroke={f.third} strokeWidth={3.5} strokeLinecap="round" />
      <rect x={62} y={74} width={16} height={26} rx={7} fill={f.disc} {...L} />
      <rect x={122} y={74} width={16} height={26} rx={7} fill={f.disc} {...L} />
      <path d="M68 100c-6 30 10 50 30 70" fill="none" stroke={INK} strokeWidth={2} />
      {/* the alarm clock */}
      <path d="M140 132l-8-8M178 132l8-8" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d="M128 124a10 10 0 0114-6zM190 124a10 10 0 00-14-6z" fill={f.disc} {...T} />
      <circle cx={159} cy={156} r={26} fill={f.disc} {...L} />
      <circle cx={159} cy={156} r={19} fill={BONE} {...T} />
      <path d="M159 142v14l9 6" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
      <path d="M159 139v3M159 170v3M142 156h3M173 156h3" stroke={INK} strokeWidth={2} />
      <path d="M146 180l-6 8M172 180l6 8" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d="M138 200c0-10 8-16 16-16h10c6 0 10 6 10 12v26h-36z" fill={SKIN.tan} {...L} />
    </>
  );
});

/* ---- Sacred Groves --------------------------------------------------------- */

const adelaide = girl('Adelaide in a nun’s veil, raising a cross', (k) => {
  const f = FILM.groves;
  return (
    <>
      <Back k={k} film="groves" />
      <path d="M100 30c-30 0-44 26-44 60 0 50-10 90-26 142h140c-16-52-26-92-26-142 0-34-14-60-44-60z" fill={INK} {...L} />
      <path d="M64 232c6-40 18-70 36-80 18 10 30 40 36 80z" fill={INK} />
      <Neck skin={SKIN.deep} />
      <path d="M74 140c10 20 42 20 52 0l6 18c-14 22-50 22-64 0z" fill={BONE} {...L} />
      <Face skin={SKIN.deep} brows="set" mouth="set" />
      <path d="M74 84c-2-26 10-42 26-42s28 16 26 42l-6-2c0-20-8-32-20-32s-20 12-20 32z" fill={BONE} {...L} />
      <path d="M100 162v26M92 170h16" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M100 162v26M92 170h16" stroke={f.disc} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M86 140c4 12 10 20 14 22 4-2 10-10 14-22" fill="none" stroke={INK} strokeWidth={1.4} strokeDasharray="2 3" />
      {/* the raised cross */}
      <path d="M150 64v86M134 88h32" stroke={INK} strokeWidth={13} strokeLinecap="round" />
      <path d="M150 64v86M134 88h32" stroke={f.disc} strokeWidth={7} strokeLinecap="round" />
      <path d="M138 150c0-10 6-16 14-16s14 6 14 16-6 18-14 18-14-8-14-18z" fill={SKIN.deep} {...L} />
      <Limb d="M152 166c4 20 6 40 6 66" w={18} fill={INK} ink={2} />
    </>
  );
});

const barbara = girl('Barbara in a bush hat, rifle slung over her shoulder', (k) => {
  const f = FILM.groves;
  return (
    <>
      <Back k={k} film="groves" />
      {/* the rifle behind her */}
      <path d="M40 220L166 20" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <path d="M40 220L166 20" stroke={'#6b4423'} strokeWidth={5} strokeLinecap="round" />
      <path d="M150 46L170 14" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path d="M78 110c-6-20-4-40 6-50h32c10 10 12 30 6 50z" fill={HAIR.grey} {...L} />
      <Neck skin={SKIN.light} />
      <Top fill={'#c9a46a'} neck="M84 150l16 14 16-14" />
      <path d="M84 150l16 14 16-14-4-6H88z" fill={f.third} {...T} />
      <path d="M46 186h28v22H46zM126 186h28v22h-28z" fill="none" stroke={INK} strokeWidth={2} />
      <path d="M46 192h28M126 192h28" stroke={INK} strokeWidth={2} />
      <path d="M58 156l78 76" stroke={INK} strokeWidth={8} />
      <path d="M58 156l78 76" stroke={'#6b4423'} strokeWidth={4} />
      <Face skin={SKIN.light} brows="fierce" mouth="grim" look={-1} />
      <path d="M78 86l-4-3M122 86l4-3M80 90l-5 0M120 90l5 0M92 110q8 3 16 0" stroke={INK} strokeWidth={1.2} fill="none" />
      {/* bush hat */}
      <path d="M78 58c0-18 10-26 22-26s22 8 22 26z" fill={f.disc} {...L} />
      <path d="M78 52h44v7H78z" fill={f.bg} {...T} />
      <path d="M50 62c10-8 90-8 100 0-2 6-10 8-16 6-22-6-46-6-68 0-6 2-14 0-16-6z" fill={f.disc} {...L} />
    </>
  );
});

/* ---- Terror from Above ----------------------------------------------------- */

const paula = girl('Paula in a red headscarf, gripping a fire poker', (k) => {
  const f = FILM.birds;
  return (
    <>
      <Back k={k} film="birds" />
      <path d="M150 220L178 34" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d="M178 34l10 4-4 10M178 34l-8-2" stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
      <Neck skin={SKIN.tan} />
      <Top fill={f.third} />
      <path d="M58 156l30 76M142 156l-30 76" fill="none" stroke={INK} strokeWidth={2.4} />
      <path d="M60 150c8-6 18-8 28-6l-8 30zM140 150c-8-6-18-8-28-6l8 30z" fill={f.third} {...L} />
      <Face skin={SKIN.tan} brows="worried" mouth="grim" look={2} />
      <path d="M80 70c4-12 12-18 20-18s16 6 20 18c-8-6-14-8-20-8s-12 2-20 8z" fill={HAIR.ink} {...L} />
      {/* headscarf tied under the chin */}
      <path d="M100 28c-28 0-40 22-40 54 0 24 4 40 12 52l10-4c-6-14-8-30-6-50 2-20 10-30 24-30s22 10 24 30c2 20 0 36-6 50l10 4c8-12 12-28 12-52 0-32-12-54-40-54z" fill={f.disc} {...L} />
      <path d="M84 118c4 8 10 12 16 14 6-2 12-6 16-14l2 8-10 6 8 14-10-4-6 8-6-8-10 4 8-14-10-6z" fill={f.disc} {...L} />
      <path d="M138 176c0-10 6-16 14-16s14 6 14 16-6 18-14 18-14-8-14-18z" fill={SKIN.tan} {...L} />
    </>
  );
});

const melanie = girl('Melanie with a French twist and fur collar, holding a birdcage', (k) => {
  const f = FILM.birds;
  return (
    <>
      <Back k={k} film="birds" />
      <path d="M100 26c-22 0-34 16-30 42 2 14 4 26 6 34l48 0c2-8 4-20 6-34 4-26-8-42-30-42z" fill={HAIR.blonde} {...L} />
      <Neck skin={SKIN.light} />
      <Top fill={'#3a434c'} neck="M86 150c4 10 24 10 28 0" />
      <path d="M50 158c10-12 26-16 40-12 4 10 16 14 20 14 4 0 16-4 20-14 14-4 30 0 40 12-6 10-14 14-22 12-6 8-16 10-24 6-8 6-20 6-28 0-8 4-18 2-24-6-8 2-16-2-22-12z" fill={f.third} {...L} />
      <Face skin={SKIN.light} brows="set" mouth="set" look={-1} />
      <path d="M76 74c-2-24 10-36 24-36s26 12 24 36c-4-12-12-18-20-18-6 0-10 4-12 10-4-4-10-2-16 8z" fill={HAIR.blonde} {...L} />
      <path d="M114 32c10 4 16 14 14 30-2 10-6 18-10 22 2-14 0-30-8-42z" fill={HAIR.blonde} {...L} />
      <path d="M100 40c-4 10-6 18-4 26M118 44c4 8 4 18 2 28" fill="none" stroke={INK} strokeWidth={1.6} />
      {/* the lovebirds in their cage */}
      <path d="M128 216v-56c0-18 12-30 26-30s26 12 26 30v56z" fill={BONE} {...L} />
      <path d="M141 216v-80M154 216v-86M167 216v-80M128 186h52" stroke={INK} strokeWidth={2} />
      <path d="M154 130v-10m-6 0h12" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <path d="M136 182c0-8 6-12 12-10l4-4 2 6c4 4 2 10-4 12-6 2-14 2-14-4zM160 172c0-8 6-12 12-10l4-4 2 6c4 4 2 10-4 12-6 2-14 2-14-4z" fill={f.disc} {...T} />
      <path d="M118 210c0-10 6-16 14-16h10v28h-24z" fill={SKIN.light} {...L} />
    </>
  );
});

export const GIRL_ART: Record<string, Drawing> = { laurie, reiko, alice, selena, asami, charlie, nancy, sheila, adelaide, barbara, paula, melanie };
