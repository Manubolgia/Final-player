// Killer posters: one bust per killer, 240 × 300 drawing units, low angle,
// big silhouette against a backdrop shape, in the film's spot inks.

import { BLOOD, BONE, INK, PAL, Rim, DotScreen, ol, splat, drops, type Kit, type Piece } from './kit';

const W = 240;
const H = 300;
const box = [0, 0, W, H] as const;

/* ---- Hans: the butcher of Camp Happy Trails ------------------------------- */

const HANS_BODY =
  'M-12 312L-12 214C-10 196-6 168-2 134C1 110 8 88 18 70L22 48C28 38 46 34 58 40L62 58C60 66 56 72 52 78C48 94 44 112 40 128C48 146 58 164 68 176C78 164 88 154 97 147C93 141 91 135 90 129C85 127 82 120 82 110C82 103 85 99 89 100C88 86 91 73 101 65C110 58 131 58 140 65C150 73 153 86 152 100C156 99 159 103 159 110C159 120 156 127 151 129C150 135 148 141 144 147C162 155 186 163 208 172C228 181 242 196 252 216L252 312Z';

function Hans(k: Kit) {
  const P = PAL.happyTrails;
  return (
    <g>
      <defs>
        <DotScreen k={k} name="crater" color={INK} r={1.3} gap={5} />
        <DotScreen k={k} name="stubble" color={P.deep} r={0.9} gap={4} />
      </defs>
      <rect x={-20} y={-20} width={W + 40} height={H + 40} fill={k.c(P.pine)} />
      {/* the moon over the lake */}
      <circle cx={124} cy={112} r={88} fill={k.c(P.fire)} {...ol(k, 3)} />
      <circle cx={92} cy={70} r={16} fill={k.url('crater')} />
      <circle cx={168} cy={88} r={11} fill={k.url('crater')} />
      <circle cx={176} cy={150} r={20} fill={k.url('crater')} />
      <circle cx={70} cy={150} r={9} fill={k.url('crater')} />
      {/* pines on the far shore */}
      <path
        d="M-10 214L4 170L10 182L18 150L26 176L34 160L42 196L50 206L58 192L66 214ZM176 212L186 186L192 196L202 162L210 186L218 150L226 178L234 168L250 206L250 214Z"
        fill={k.c(P.deep)}
        {...ol(k, 2.5)}
      />
      {/* the cleaver, raised */}
      <g transform="translate(40 52) rotate(16)">
        <rect x={-9} y={-4} width={11} height={40} rx={4} fill={k.c(P.wood)} {...ol(k, 3)} />
        <path d="M-12 -2L-12 -86C-12 -90-10 -92-6 -92L36 -92C40 -92 42 -90 42 -86L42 -8C42 -3 38 0 33 0L-4 0Z" fill={k.c(BONE)} {...ol(k, 3)} />
        <path d="M33 -90L42 -86L42 -8C42 -3 38 0 33 0Z" fill={k.c(BLOOD)} />
        <path d="M42 -60C46 -54 46 -46 42 -40M42 -26C45 -20 44 -14 41 -11" fill="none" {...ol(k, 2.5)} />
        <path d="M42 -62L48 -50C50 -46 46 -42 43 -45Z" fill={k.c(BLOOD)} {...ol(k, 2)} />
        <circle cx={0} cy={-80} r={4.5} fill={k.c(P.pine)} {...ol(k, 2.5)} />
        <path d="M-6 -86L-6 -10" stroke={k.s(INK)} strokeWidth={2} opacity={1} />
        <path d="M-12 -2L-12 -86C-12 -90-10 -92-6 -92L36 -92C40 -92 42 -90 42 -86L42 -8C42 -3 38 0 33 0L-4 0Z" fill="none" {...ol(k, 3)} />
      </g>
      {/* the man: black against the moon, rimmed in moonlight */}
      <Rim k={k} name="hans" d={HANS_BODY} fill={INK} light={BONE} dx={-3} dy={4} />
      {/* fist over the handle */}
      <path d="M26 44C32 36 50 36 58 42C62 48 62 58 56 64C48 68 34 68 26 62C22 56 22 50 26 44Z" fill={k.c(INK)} />
      <path d="M30 42C36 38 48 38 55 42" fill="none" stroke={k.s(BONE)} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M34 49L52 49M33 56L51 56" fill="none" stroke={k.s(P.deep)} strokeWidth={2} strokeLinecap="round" />
      {/* the apron, straps over the shoulders */}
      <path d="M100 150L102 192M141 150L139 192" fill="none" stroke={k.s(INK)} strokeWidth={12} strokeLinecap="round" />
      <path d="M100 152L102 192M141 152L139 192" fill="none" stroke={k.s(BONE)} strokeWidth={6} strokeLinecap="round" />
      <path d="M96 188L146 188C150 210 160 246 176 312L64 312C80 246 90 210 96 188Z" fill={k.c(BONE)} {...ol(k, 3)} />
      <path d="M146 188C150 210 160 246 176 312L150 312C148 262 142 222 136 196Z" fill={k.c(P.khaki)} />
      <path d="M112 214C110 240 104 270 100 300M128 230C130 254 128 280 128 304" fill="none" stroke={k.s(P.khaki)} strokeWidth={3} strokeLinecap="round" />
      <path d="M96 188L146 188C150 210 160 246 176 312L64 312C80 246 90 210 96 188Z" fill="none" {...ol(k, 3)} />
      <path d={splat(118, 226, 11, 7)} fill={k.c(BLOOD)} />
      <path d={splat(144, 258, 7, 3, 5)} fill={k.c(BLOOD)} />
      <path d={splat(96, 270, 6, 12, 5)} fill={k.c(BLOOD)} />
      {drops(118, 226, -0.6, 4, 5).map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={k.c(BLOOD)} />
      ))}
      <path d="M100 196L142 196" stroke={k.s(INK)} strokeWidth={2.5} />
      {/* face: lit from below by the campfire */}
      <path d="M92 116C96 136 108 146 120 146C132 146 144 136 148 116C146 128 136 140 120 140C104 140 94 128 92 116Z" fill={k.url('stubble')} />
      <path d="M99 92C107 88 114 90 120 97C126 90 133 88 141 92L141 97C133 94 127 96 120 103C113 96 107 94 99 97Z" fill={k.c(P.fire)} />
      <path d="M102 104L117 106L115 110L104 109Z" fill={k.c(BONE)} />
      <path d="M123 106L138 104L136 109L125 110Z" fill={k.c(BONE)} />
      <circle cx={111} cy={107.5} r={1.9} fill={k.c(INK)} />
      <circle cx={129} cy={107.5} r={1.9} fill={k.c(INK)} />
      <path d="M115 122C117 125 123 125 125 122L124 126C122 127 118 127 116 126Z" fill={k.c(P.fire)} />
      <path d="M108 133C114 131 126 131 132 133C126 135 114 135 108 133Z" fill={k.c(P.fire)} />
      <path d="M110 146C114 149 126 149 130 146C126 151 114 151 110 146Z" fill={k.c(P.fire)} />
      {/* a butcher's scar */}
      <path d="M100 84L116 118" stroke={k.s(BLOOD)} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M103 92L109 89M106 99L112 96M109 106L115 103M112 113L118 110" stroke={k.s(BLOOD)} strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

export const KILLER_ART: Record<string, Piece> = {
  hans: { box, crops: { face: [66, 46, 108, 108] }, draw: Hans },
};
