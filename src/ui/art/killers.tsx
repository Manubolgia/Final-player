// The six killers as VHS-sleeve posters: one canvas each (240 x 360), drawn
// from a low angle, with a `bust` crop for chips and a `band` crop for cards.

import { BLOOD, BONE, Dots, Halo, INK, Limb, line, type Drawing } from './kit';

const L = line(3);
const T = line(2);

/* ---- Hans, the Butcher (Happy Trails: pine green, camp orange) ----------- */

const H = { sky: '#2f4a32', moon: '#e07a2e', pine: '#1d2f20', steel: '#d8d2c4' };

export const hans: Drawing = {
  box: [0, 0, 240, 360],
  crops: { bust: [58, 6, 160, 160], band: [0, 8, 240, 120] },
  label: 'Hans the Butcher raising a cleaver against the moon',
  draw: (k) => (
    <>
      <defs>
        <Dots k={k} name="fog" color={BONE} r={1.1} gap={6} />
        <Dots k={k} name="fog2" color={BONE} r={1.7} gap={6} />
      </defs>
      <rect x={-10} y={-10} width={260} height={380} fill={H.sky} />
      <Halo k={k} name="moon" cx={128} cy={122} r={84} color={H.moon} ring={12} />
      <circle cx={128} cy={122} r={84} fill={H.moon} {...L} />
      {/* clouds across the moon */}
      <path d="M40 168h70c8 0 8-10 16-10h72v12H128c-6 0-6 9-14 9H40z" fill={H.sky} {...T} />
      <path d="M150 190h70v9h-70z" fill={H.sky} {...T} />
      {/* the treeline */}
      <path
        d="M-6 360V262l10-6 8-26 8 26 8-6 10-40 10 40 8-4 9-30 9 30 8-6 6 4 8-22 8 22 6 0 8-34 8 34 6-4 9 26 7-22 8 22 8-4 10-44 10 44 8 4 8-28 8 28 6-6 9-30 9 30 8 6V360z"
        fill={H.pine}
        {...T}
      />
      <rect x={-10} y={318} width={260} height={52} fill={k.url('fog')} />

      {/* hanging arm and sledgehammer (behind the body) */}
      <path d="M58 146C40 150 28 166 26 190c-2 16-2 30 0 46l6 28 26-2c0-16 2-32 4-48l6-44z" fill={INK} {...L} />
      <path d="M33 262h26l2 18c0 9-7 14-15 14s-14-5-14-14z" fill={INK} {...L} />
      <path d="M42 290l-6 44" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M14 330l46 4-2 24-46-4z" fill={INK} {...L} />
      <path d="M16 334l40 3" stroke={H.moon} strokeWidth={2.5} strokeLinecap="round" />

      {/* body: neck, traps, torso, legs */}
      <path
        d="M101 110l-5 16c-16 4-34 8-46 20-10 10-14 26-12 44l14 60-8 112h62l14-56 14 56h62l-8-112 12-60c2-18-2-34-10-44-12-12-30-16-46-20l-5-16z"
        fill={INK}
        {...L}
      />
      {/* raised arm */}
      <path d="M166 146c10-18 20-30 30-38-2-12-4-24-4-38l22-4c8 14 16 30 18 46 2 12-4 22-14 30-8 10-14 18-18 24z" fill={INK} {...L} />
      {/* cleaver: handle, blade, drips */}
      <path d="M201 50l-6-26" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M196 12l4 30-64 10-6-30z" fill={H.steel} {...L} />
      <path d="M136 52l64-10" stroke={INK} strokeWidth={4} />
      <circle cx={142} cy={30} r={4} fill={H.sky} {...T} />
      <path d="M150 50l2 12c0 3-4 3-4 0l-1-11zM172 47l1 7c0 3-4 3-4 0v-6z" fill={BLOOD} {...T} />
      <path d="M190 64c0-10 6-16 14-16s16 6 16 16-7 15-15 15-15-5-15-15z" fill={INK} {...L} />
      {/* head */}
      <path d="M119 56c-16 0-25 12-25 30-4 0-6 4-5 9 1 6 5 8 8 8 2 8 10 17 22 17s20-9 22-17c3 0 7-2 8-8 1-5-1-9-5-9 0-18-9-30-25-30z" fill={INK} {...L} />
      {/* eyes in the shadow of the brow */}
      <path d="M104 90l11 2-1 4-9-2z M124 92l11-2 0 4-10 2z" fill={BONE} />
      {/* apron */}
      <path d="M100 124l2 26h36l2-26" fill="none" stroke={BONE} strokeWidth={3} />
      <path d="M100 150h38l12 62 20 104c-34 8-68 8-102 0l20-104z" fill={BONE} {...L} />
      <path d="M52 214h136" {...T} />
      <path d="M86 236l-6 72M120 228v86M152 236l8 72" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <path d="M112 166c4-6 12-4 12 2s6 8 2 12-12 2-12-2-8-6-2-12zM134 196c3-3 8-1 7 3s-6 5-8 2zM92 252c6-6 16-2 14 6s-10 10-16 4zM98 268l-2 10M140 280c4-4 11-2 10 4s-8 6-10 2zM122 300l-1 12c0 3 4 3 4 0l-1-12" fill={BLOOD} stroke={INK} strokeWidth={1.4} />
      {/* rim light from the moon */}
      <path d="M97 78c2-12 10-19 20-20M54 148c10-8 26-14 42-18M164 142c8-14 18-26 28-34M194 100c-2-10-3-20-3-30M30 196c0-16 6-30 18-40" fill="none" stroke={H.moon} strokeWidth={3} strokeLinecap="round" />
    </>
  ),
};

/* ---- The Poltergeist (Creech Manor: aubergine, candle gold) ------------- */

const P = { sky: '#3b2140', wall: '#4a2d50', mid: '#7a4f7f', gold: '#d9a441', floor: '#26142b', skin: '#e9e0d0' };

export const poltergeist: Drawing = {
  box: [0, 0, 240, 360],
  crops: { bust: [46, 18, 148, 148], band: [0, 20, 240, 120] },
  label: 'A pale ghost girl floating before a lit window, hands raised',
  draw: (k) => (
    <>
      <defs>
        <Dots k={k} name="pool" color={P.gold} r={1.7} gap={6} />
        <Dots k={k} name="glow" color={P.gold} r={1.1} gap={6} />
      </defs>
      <rect x={-10} y={-10} width={260} height={380} fill={P.sky} />
      <path d="M14 0v320M40 0v320M200 0v320M226 0v320" stroke={P.wall} strokeWidth={8} />
      <path d="M32 310V106C32 46 72 10 120 10s88 36 88 96v204z" fill={k.url('glow')} />
      {/* the arched window */}
      <path d="M44 300V110C44 56 80 22 120 22s76 34 76 88v190z" fill={INK} {...L} />
      <path d="M52 296V110c0-48 32-80 68-80s68 32 68 80v186z" fill={P.gold} />
      <path d="M62 238l18-6-8 18 20 10-30 20z" fill={P.sky} {...T} />
      <path d="M120 30v266M52 152h136M52 228h136" stroke={INK} strokeWidth={7} />
      <circle cx={120} cy={88} r={24} fill="none" stroke={INK} strokeWidth={6} />
      <path d="M36 296h168v12H36z" fill={P.mid} {...L} />
      {/* floorboards and the light on them */}
      <path d="M-10 308h260v62H-10z" fill={P.floor} {...T} />
      <path d="M44 308h152l44 52H0z" fill={k.url('pool')} />
      <path d="M-30 360l130-52M50 360l60-52M120 360v-52M190 360l-60-52M270 360l-130-52" stroke={P.sky} strokeWidth={2} />
      {/* things she has thrown about */}
      <g transform="rotate(-18 30 196)">
        <rect x={12} y={172} width={36} height={46} fill={P.gold} {...L} />
        <rect x={19} y={179} width={22} height={32} fill={P.mid} {...T} />
      </g>
      <g transform="rotate(26 212 236)">
        <rect x={194} y={224} width={36} height={26} fill={BLOOD} {...L} />
        <path d="M198 228h28v18h-28z" fill="none" stroke={BONE} strokeWidth={2} />
      </g>
      {/* arms raised, fingers spread */}
      <Limb d="M98 128C86 104 74 82 64 58" w={10} fill={P.skin} />
      <Limb d="M142 128c12-24 24-46 34-70" w={10} fill={P.skin} />
      <path d="M84 124c-8-12-14-24-18-38l18-6c4 14 10 26 20 36z" fill={BONE} {...L} />
      <path d="M156 124c8-12 14-24 18-38l-18-6c-4 14-10 26-20 36z" fill={BONE} {...L} />
      <Limb d="M60 50l-10-7-4-10M63 47l-6-12v-10M66 47l-1-14 3-9M69 50l4-12 5-7M70 58l9-4 4-6" w={3.2} fill={P.skin} ink={2.4} />
      <Limb d="M180 50l10-7 4-10M177 47l6-12v-10M174 47l1-14-3-9M171 50l-4-12-5-7M170 58l-9-4-4-6" w={3.2} fill={P.skin} ink={2.4} />
      <ellipse cx={65} cy={55} rx={7} ry={9} transform="rotate(-30 65 55)" fill={P.skin} {...T} />
      <ellipse cx={175} cy={55} rx={7} ry={9} transform="rotate(30 175 55)" fill={P.skin} {...T} />
      {/* the nightgown, trailing off into nothing */}
      <path
        d="M86 116c-6 24-12 64-20 114-6 32-10 56-6 70l12-8 8 14 12-12 12 14 12-14 12 14 12-14 10 10 10-12c12 8 26 28 40 52-10-26-18-54-24-84-6-50-14-100-22-142z"
        fill={BONE}
        {...L}
      />
      <path d="M140 134c6 40 14 88 22 132l-10 14c-4-40-10-92-16-146z" fill={P.mid} />
      {/* long black hair over the face */}
      <path
        d="M120 58c-20 0-32 14-34 36-2 24-6 54-16 100l8-6 2 20 10-14 6 18 8-16 8 18 8-16 8 18 8-16 8 18 6-18 10 14 2-20 8 6c-10-46-14-76-16-100-2-22-14-36-34-36z"
        fill={INK}
        {...L}
      />
      <path d="M114 84h13l-3 40h-8z" fill={P.skin} />
      <path d="M115 97c3-3 8-3 11 0-3 3-8 3-11 0z" fill={BONE} stroke={INK} strokeWidth={1.2} />
      <circle cx={120.5} cy={97} r={1.8} fill={INK} />
      <path d="M118 84l-2 40M124 84l2 40" stroke={INK} strokeWidth={2.4} />
    </>
  ),
};

/* ---- Geppetto, the Puppeteer (Carnival: tent red, cream, marquee yellow) -- */

const G = { red: '#c8272d', cream: '#f4e9d0', yellow: '#f2b705' };

const tent = Array.from({ length: 14 }, (_, i) => {
  const a = (d: number) => ((d + 90) * Math.PI) / 180;
  const s = -70 + i * 10;
  const p = (d: number) => `${120 + 600 * Math.cos(a(d))} ${-40 + 600 * Math.sin(a(d))}`;
  return `M120 -40L${p(s)}L${p(s + 5)}Z`;
}).join('');

export const geppetto: Drawing = {
  box: [0, 0, 240, 360],
  crops: { bust: [52, 34, 136, 136], band: [0, 44, 240, 120] },
  label: 'Geppetto the puppeteer, lit from below, working a marionette on strings',
  draw: (k) => (
    <>
      <defs>
        <Dots k={k} name="shade" color={INK} r={1.3} gap={5} />
        <clipPath id={k.id('face')}>
          <path d="M120 48c-20 0-28 16-28 38 0 18 6 38 16 50 4 5 8 8 12 8s8-3 12-8c10-12 16-32 16-50 0-22-8-38-28-38z" />
        </clipPath>
      </defs>
      <rect x={-10} y={-10} width={260} height={380} fill={G.red} />
      <path d={tent} fill={G.cream} />
      <Halo k={k} name="spot" cx={120} cy={104} r={66} color={G.yellow} ring={11} />
      <circle cx={120} cy={104} r={66} fill={G.yellow} {...L} />
      {/* hunched over us: shoulders up by his ears */}
      <path d="M12 370l10-160c2-30 14-58 40-70 14-6 26-4 38 4h40c12-8 24-10 38-4 26 12 38 40 40 70l10 160z" fill={INK} {...L} />
      <path d="M30 196c2-26 12-46 32-54M210 196c-2-26-12-46-32-54" fill="none" stroke={G.yellow} strokeWidth={3} strokeLinecap="round" />
      {/* sleeves down to the control */}
      <Limb d="M56 158c-20 14-28 32-22 52" w={26} fill={INK} ink={2} />
      <Limb d="M184 158c20 14 28 32 22 52" w={26} fill={INK} ink={2} />
      <path d="M36 168c-6 10-8 22-6 32M204 168c6 10 8 22 6 32" fill="none" stroke={G.yellow} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M26 202h22l4 10H24zM192 202h22l2 10h-28z" fill={G.cream} {...T} />
      {/* the control: a cross of yellow wood, strings, and the bony hands on it */}
      <Limb d="M40 220h160" w={8} fill={G.yellow} />
      <Limb d="M120 200v44" w={8} fill={G.yellow} />
      <path d="M44 220l50 74M196 220l-50 74M120 244v12M86 220l24 116M154 220l-24 116" stroke={INK} strokeWidth={1.4} />
      <path d="M34 206c4-6 16-6 22 0l2 10c-6 4-18 4-24 0z" fill={G.cream} {...T} />
      <Limb d="M38 212c-2 6 0 12 4 14M45 210c-2 7 0 13 4 15M52 211c-2 6 0 11 3 13M58 214c4 1 6 4 5 8" w={4} fill={G.cream} ink={2} />
      <path d="M206 206c-4-6-16-6-22 0l-2 10c6 4 18 4 24 0z" fill={G.cream} {...T} />
      <Limb d="M202 212c2 6 0 12-4 14M195 210c2 7 0 13-4 15M188 211c2 6 0 11-3 13M182 214c-4 1-6 4-5 8" w={4} fill={G.cream} ink={2} />
      {/* wild white hair behind the ears */}
      <path d="M98 68L82 58l6 12-20-2 14 10-16 6 16 4-12 10 18-2-4 12 14-12zM142 68l16-10-6 12 20-2-14 10 16 6-16 4 12 10-18-2 4 12-14-12z" fill={G.cream} {...L} />
      <path d="M92 90c-6-2-8 8-4 14 2 2 4 3 6 2M148 90c6-2 8 8 4 14-2 2-4 3-6 2" fill={G.cream} {...T} />
      {/* the gaunt face, shadowed from above, lit from below */}
      <path d="M120 48c-20 0-28 16-28 38 0 18 6 38 16 50 4 5 8 8 12 8s8-3 12-8c10-12 16-32 16-50 0-22-8-38-28-38z" fill={G.cream} {...L} />
      <g clipPath={k.url('face')}>
        <path d="M90 46h60v36c-10-6-20-8-30-8s-20 2-30 8z" fill={k.url('shade')} />
        <path d="M100 106c3 10 7 18 12 24l-6-2c-4-6-6-14-6-22zM140 106c-3 10-7 18-12 24l6-2c4-6 6-14 6-22z" fill={INK} />
      </g>
      <path d="M97 87c3-6 14-7 19-1-1 8-15 10-19 1zM143 87c-3-6-14-7-19-1 1 8 15 10 19 1z" fill={INK} />
      <circle cx={107} cy={89} r={9} fill="none" stroke={INK} strokeWidth={2.6} />
      <circle cx={133} cy={89} r={9} fill="none" stroke={INK} strokeWidth={2.6} />
      <path d="M116 89h8" stroke={INK} strokeWidth={2.4} />
      <circle cx={108} cy={91} r={1.8} fill={G.yellow} />
      <circle cx={132} cy={91} r={1.8} fill={G.yellow} />
      <path d="M100 82c3-2 6-3 9-3" stroke={G.yellow} strokeWidth={1.6} strokeLinecap="round" />
      <path d="M96 76l20 6M144 76l-20 6" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d="M119 92l7 22c-2 5-8 5-10 2" fill="none" {...T} />
      <path d="M104 124c6-5 12-5 16-1 4-4 10-4 16 1 4 4 3 10-1 12-4-5-9-7-15-5-6-2-11 0-15 5-4-2-5-8-1-12z" fill={G.cream} {...L} />
      <path d="M107 136q13 9 26 0q-13 5-26 0z" fill={BONE} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M112 137.5v3M117 138.5v3.5M123 138.5v3.5M128 137.5v3" stroke={INK} strokeWidth={1.1} />
      <path d="M108 146h24l-12 8z" fill={G.red} {...T} />
      {/* the marionette: a little girl on strings */}
      <Limb d="M108 282l-12 10 -2 4M132 282l12 10 2 4" w={5} fill={G.cream} ink={2.4} />
      <Limb d="M112 318l-4 18 2 18M128 318l4 18-2 18" w={5} fill={G.cream} ink={2.4} />
      <path d="M106 276h28l8 42h-44z" fill={G.red} {...L} />
      <path d="M106 296h34" stroke={G.cream} strokeWidth={2} />
      <circle cx={120} cy={264} r={13} fill={G.cream} {...L} />
      <path d="M106 262c0-12 6-18 14-18s14 6 14 18c-4-6-10-8-14-8s-10 2-14 8z" fill={INK} {...T} />
      <circle cx={115} cy={265} r={1.8} fill={INK} />
      <circle cx={125} cy={265} r={1.8} fill={INK} />
      <path d="M116 271h8M118 269v4M122 269v4" stroke={INK} strokeWidth={1.2} />
      <circle cx={94} cy={294} r={3} fill={INK} />
      <circle cx={146} cy={294} r={3} fill={INK} />
      <circle cx={108} cy={336} r={3} fill={INK} />
      <circle cx={132} cy={336} r={3} fill={INK} />
    </>
  ),
};

/* ---- Dr. Fright (Maple Lane: hedge green, brick red) ---------------------- */

const F = { green: '#3c5a2e', deep: '#283e1f', red: '#9e2b25', steel: '#d8d2c4', lamp: '#f2d27a' };

export const drFright: Drawing = {
  box: [0, 0, 240, 360],
  crops: { bust: [40, 26, 150, 150], band: [0, 30, 240, 120] },
  label: 'Dr. Fright in a brimmed hat, face in shadow, raising a claw glove',
  draw: (k) => (
    <>
      <defs>
        <clipPath id={k.id('sweater')}>
          <path d="M106 138h36l14 232h-64z" />
        </clipPath>
      </defs>
      <rect x={-10} y={-10} width={260} height={380} fill={F.green} />
      {[230, 190, 150, 112, 76].map((r, i) => (
        <circle key={r} cx={124} cy={92} r={r} fill={i % 2 ? F.green : F.deep} stroke={INK} strokeWidth={2} />
      ))}
      {/* houses leaning in at the edges */}
      <path d="M-10 370V262l40-34 40 34v108z" fill={INK} {...L} />
      <path d="M16 280h14v18H16zM44 300h14v18H44z" fill={F.lamp} {...T} />
      <path d="M250 370V244l-44-30-40 36v120z" fill={INK} {...L} />
      <path d="M190 268h14v18h-14zM214 290h14v18h-14z" fill={F.lamp} {...T} />
      {/* the coat */}
      <path d="M38 370l14-174c2-34 22-54 50-60h44c28 6 48 26 50 60l14 174z" fill={BONE} {...L} />
      <g clipPath={k.url('sweater')}>
        <rect x={80} y={130} width={90} height={240} fill={F.red} />
        {[146, 174, 202, 230, 258, 286, 314, 342].map((y) => (
          <rect key={y} x={80} y={y} width={90} height={14} fill={F.green} />
        ))}
      </g>
      <path d="M106 138l14 232M142 138l14 232" {...T} />
      <path d="M104 138l-12 58 18-18zM144 138l12 58-18-18z" fill={BONE} {...L} />
      <path d="M80 250l-4 80M170 250l4 80" stroke={INK} strokeWidth={1.6} />
      {/* stethoscope */}
      <path d="M110 140c-8 36 0 64 14 70 14-6 22-34 14-70" fill="none" stroke={INK} strokeWidth={4} />
      <circle cx={124} cy={214} r={8} fill={F.steel} {...L} />
      {/* the syringe hand */}
      <Limb d="M186 172c16 26 20 54 10 80" w={24} fill={BONE} />
      <path d="M186 256c0-8 6-12 12-12s12 4 12 12-5 12-12 12-12-4-12-12z" fill={F.steel} {...L} />
      <g transform="rotate(32 196 262)">
        <rect x={190} y={262} width={14} height={50} fill={BONE} {...L} />
        <rect x={192} y={286} width={10} height={24} fill={BLOOD} />
        <path d="M197 312v22M188 262h18M197 262v-12M190 250h14" {...T} />
      </g>
      {/* face in the shadow of the brim */}
      <path d="M104 112c0-20 8-30 20-30s20 10 20 30c0 16-8 26-20 26s-20-10-20-26z" fill={INK} {...L} />
      <path d="M110 104l10 3-1 3-9-2zM138 104l-10 3 1 3 9-2z" fill={BONE} />
      <circle cx={116} cy={106.5} r={1.4} fill={BLOOD} />
      <circle cx={132} cy={106.5} r={1.4} fill={BLOOD} />
      <path d="M110 120q14 14 28 0q-14 8-28 0z" fill={BONE} stroke={INK} strokeWidth={1.4} />
      <path d="M116 122v4M121 123v5M126 123v5M131 122v4" stroke={INK} strokeWidth={1.2} />
      {/* the hat */}
      <path d="M98 86l3-32c2-12 44-12 46 0l3 32z" fill={F.red} {...L} />
      <path d="M100 74h48l1 12h-50z" fill={INK} />
      <ellipse cx={124} cy={88} rx={58} ry={11} transform="rotate(-5 124 88)" fill={F.red} {...L} />
      <path d="M110 50c4-6 24-6 28 0" fill="none" stroke={INK} strokeWidth={2} />
      {/* the claw glove, raised close to us */}
      <Limb d="M70 170c-20-18-30-38-26-62" w={28} fill={BONE} />
      <path d="M26 100c-2-10 6-18 20-20 14-2 24 6 24 16l-4 14c-2 8-12 12-22 10l-10-2c-8-2-10-10-8-18z" fill={F.red} {...L} />
      <Limb d="M32 94l-4-12M41 89l-3-15M51 88l-1-17M60 92l4-14" w={8} fill={F.red} ink={2.6} />
      <Limb d="M64 104l10-4 6-8" w={8} fill={F.red} ink={2.6} />
      <path d="M30 82L4 28l6-2 30 50zM40 74L22 8h6l22 64zM52 72l-2-66h6l6 66zM62 78l14-60 6 2-10 62z" fill={F.steel} {...L} />
      <path d="M28 84l14-4M38 76l14-2M50 74h12M60 80l10 2" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d="M34 104c6 2 14 2 22-2M36 96l2 4M45 93l1 4M54 93v4" fill="none" stroke={INK} strokeWidth={1.6} />
    </>
  ),
};

/* ---- Inkanyamba (Sacred Groves: rust, ochre sun, river teal) -------------- */

const N = { sky: '#8e3b23', sun: '#c47f2c', teal: '#2b6e6a', deep: '#1d4b48', hill: '#5e2614' };

const coil: [string, number][] = [
  ['M64 340C52 290 66 252 108 238', 46],
  ['M108 238c48-14 72-46 52-78', 40],
  ['M160 160c-18-30-58-30-62-62', 33],
  ['M98 98c-2-22 8-36 22-40', 27],
];

export const inkanyamba: Drawing = {
  box: [0, 0, 240, 360],
  crops: { bust: [64, 14, 140, 140], band: [0, 14, 240, 120] },
  label: 'Inkanyamba, a great serpent rising out of the river',
  draw: (k) => (
    <>
      <defs>
        <Dots k={k} name="scale" color={N.deep} r={1.8} gap={6} />
      </defs>
      <rect x={-10} y={-10} width={260} height={380} fill={N.sky} />
      <Halo k={k} name="sun" cx={150} cy={120} r={74} color={N.sun} ring={12} />
      <circle cx={150} cy={120} r={74} fill={N.sun} {...L} />
      <path d="M70 150h160v8H70zM74 168h152v6H74zM82 182h136v5H82z" fill={N.sky} />
      {/* far hills of the grove */}
      <path d="M-10 290v-28c20-12 36-14 52-4 14-14 34-18 52-6 18-10 38-8 52 4 16-10 40-12 60 0 12-4 22-2 34 4v30z" fill={N.hill} {...L} />
      {/* the river */}
      <rect x={-10} y={286} width={260} height={84} fill={N.teal} {...L} />
      <ellipse cx={64} cy={328} rx={58} ry={10} fill="none" stroke={BONE} strokeWidth={2.5} />
      <ellipse cx={64} cy={330} rx={84} ry={16} fill="none" stroke={BONE} strokeWidth={1.6} strokeDasharray="10 8" />
      <path d="M150 304q10-6 20 0t20 0M170 324q10-6 20 0t20 0M120 346q10-6 20 0t20 0M14 300q8-5 16 0" fill="none" stroke={BONE} strokeWidth={2.4} strokeLinecap="round" />
      {/* the coils: outlines first, then the flesh, then the scales */}
      {coil.map(([d, w]) => (
        <path key={`o${w}`} d={d} fill="none" stroke={INK} strokeWidth={w + 6} strokeLinecap="round" />
      ))}
      {coil.map(([d, w]) => (
        <path key={`f${w}`} d={d} fill="none" stroke={N.teal} strokeWidth={w} strokeLinecap="round" />
      ))}
      {coil.map(([d, w]) => (
        <path key={`s${w}`} d={d} fill="none" stroke={k.url('scale')} strokeWidth={w * 0.55} strokeLinecap="round" />
      ))}
      {/* the crest along its back */}
      <path d="M182 186l14-4-8 12 16 0-12 10 14 4-14 6M150 140l6-14 4 12 8-10 2 14" fill={N.sun} {...T} />
      <path d="M46 290l-14-6 12-6-12-8 16-2" fill={N.sun} {...T} />
      {/* head: open jaws, fangs, an ochre eye */}
      <path d="M96 52c8-18 34-24 52-12l30 22c4 4 2 10-4 10h-36c-12 0-24 2-34 6-8-6-10-16-8-26z" fill={N.teal} {...L} />
      <path d="M108 80c12-4 26-4 38-2l26 6c-2 8-10 12-18 10l-34-4c-6 0-10-4-12-10z" fill={N.teal} {...L} />
      <path d="M106 76c14-4 30-4 44-4h22l-2 12-24-6c-14-2-28 0-40 2z" fill={BLOOD} />
      <path d="M150 72l3 10 3-10M162 72l2 8 3-8M140 72l2 8 2-8M148 88l3-8 3 8M160 90l2-7 3 7" fill={BONE} stroke={INK} strokeWidth={1.2} />
      <circle cx={128} cy={52} r={6.5} fill={N.sun} {...T} />
      <path d="M128 46v12" stroke={INK} strokeWidth={2.6} />
      <path d="M108 44L94 32l6 14-18-2 14 12-18 6 16 4-14 12 14 0-10 14 12-4" fill={N.sun} {...T} />
      <path d="M114 42c-6-12-14-18-26-20 10 6 16 12 20 22zM126 38c-2-12-8-20-18-26 6 8 10 16 10 26z" fill={BONE} {...T} />
      <circle cx={168} cy={62} r={1.6} fill={INK} />
    </>
  ),
};

/* ---- The Birds (Terror from Above: bone sky, blood sun) ------------------- */

const B = { sky: '#e9e6df', red: '#b3161b', grey: '#5a6570' };

/** A small crow in flight. */
const CROW = 'M0 0c-6-7-14-8-22-4 7-1 12 2 16 6l6 5 6-5c4-4 9-7 16-6-8-4-16-3-22 4z';
const flock: [number, number, number, number][] = [
  [30, 40, 1, -10], [62, 22, 0.7, 8], [196, 30, 1.1, 12], [216, 70, 0.8, -6], [24, 92, 0.8, 6], [172, 54, 0.6, 0],
  [88, 50, 0.5, -4], [150, 20, 0.6, 10], [206, 120, 0.7, 14], [16, 150, 0.9, -12], [224, 170, 0.6, 4], [44, 196, 0.6, -6],
  [196, 214, 0.8, 8], [66, 240, 0.5, 0], [176, 250, 0.5, -8],
];

export const birds: Drawing = {
  box: [0, 0, 240, 360],
  crops: { bust: [44, 96, 152, 152], band: [0, 80, 240, 120] },
  label: 'A flock of crows diving out of a red sun',
  draw: (k) => (
    <>
      <rect x={-10} y={-10} width={260} height={380} fill={B.sky} />
      <Halo k={k} name="sun" cx={120} cy={112} r={62} color={B.red} ring={12} />
      <circle cx={120} cy={112} r={62} fill={B.red} {...L} />
      {flock.map(([x, y, sc, r]) => (
        <path key={`${x}-${y}`} d={CROW} fill={INK} transform={`translate(${x} ${y}) rotate(${r}) scale(${sc})`} />
      ))}
      {/* roof, chimney and the telephone wire */}
      <path d="M-10 370v-56l70-40 70 40v56z" fill={INK} {...L} />
      <path d="M78 300v-26h14v34z" fill={INK} {...L} />
      <path d="M206 370V250M188 262h36" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M-10 286c70 22 140 16 198-24M224 262c10 6 18 8 26 8M-10 300c80 18 150 10 208-38" fill="none" stroke={INK} strokeWidth={1.6} />
      <path d="M40 296c0-6 4-9 8-9l3 3 3-1-2 4c0 3-2 6-6 6zM120 296c0-6 4-9 8-9l3 3 3-1-2 4c0 3-2 6-6 6zM150 286c0-6 4-9 8-9l3 3 3-1-2 4c0 3-2 6-6 6z" fill={INK} />
      {/* the crow diving at us */}
      <path d="M50 122L4 106M48 126L2 122M48 130L6 138M50 134L14 152M54 138L28 162M190 122l46-16M192 126l46-4M192 130l42 8M190 134l36 18M186 138l-26 24" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <path d="M50 122L4 106M48 126L2 122M48 130L6 138M50 134L14 152M54 138L28 162M190 122l46-16M192 126l46-4M192 130l42 8M190 134l36 18M186 138l-26 24" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M110 146c-18-14-38-24-62-28-6 6-8 14-4 22l-2 20c10-4 20-4 30 0 8-4 18-4 26 0 4-4 10-4 14-2z" fill={INK} {...L} />
      <path d="M130 146c18-14 38-24 62-28 6 6 8 14 4 22l2 20c-10-4-20-4-30 0-8-4-18-4-26 0-4-4-10-4-14-2z" fill={INK} {...L} />
      <path d="M56 130c18 2 34 8 50 18M184 130c-18 2-34 8-50 18M58 146c14 0 30 4 46 10M182 146c-14 0-30 4-46 10" fill="none" stroke={B.grey} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M110 126l-14-40 12 6 6-12 6 10 6-10 6 12 12-6-14 40z" fill={INK} {...L} />
      <path d="M120 120c12 0 18 18 16 46-2 24-8 40-16 48-8-8-14-24-16-48-2-28 4-46 16-46z" fill={INK} {...L} />
      <circle cx={120} cy={208} r={17} fill={INK} {...L} />
      <path d="M111 218l9 34 9-34z" fill={B.grey} {...L} />
      <path d="M114 220l6 22 6-22z" fill={B.red} />
      <circle cx={112} cy={204} r={4.5} fill={B.red} stroke={BONE} strokeWidth={1.4} />
      <circle cx={128} cy={204} r={4.5} fill={B.red} stroke={BONE} strokeWidth={1.4} />
      <circle cx={112} cy={204} r={1.6} fill={INK} />
      <circle cx={128} cy={204} r={1.6} fill={INK} />
    </>
  ),
};

export const KILLER_ART: Record<string, Drawing> = { hans, poltergeist, geppetto, drFright, inkanyamba, birds };
