// Every sound is synthesised with Web Audio: no files, nothing to download.
// The context unlocks on the first tap (iOS needs a user gesture).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

export function setSound(on: boolean): void {
  enabled = on;
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      const nav = navigator as unknown as { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = 'ambient';
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

if (typeof window !== 'undefined') {
  const unlock = () => {
    if (enabled) audio();
  };
  for (const ev of ['pointerup', 'touchend', 'click', 'keydown']) window.addEventListener(ev, unlock, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ctx?.state === 'suspended') void ctx.resume();
  });
}

function noise(a: AudioContext, dur: number): AudioBufferSourceNode {
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  return src;
}

function env(a: AudioContext, peak: number, dur: number, at = 0): GainNode {
  const g = a.createGain();
  const t = a.currentTime + at;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.008, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(master!);
  return g;
}

function hiss(dur: number, type: BiquadFilterType, freq: number, peak: number, at = 0): void {
  const a = audio();
  if (!a) return;
  const src = noise(a, dur);
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  src.connect(f);
  f.connect(env(a, peak, dur, at));
  src.start(a.currentTime + at);
  src.stop(a.currentTime + at + dur + 0.02);
}

function tone(type: OscillatorType, from: number, to: number, dur: number, peak: number, at = 0, lowpass?: [number, number]): void {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  o.type = type;
  const t = a.currentTime + at;
  o.frequency.setValueAtTime(from, t);
  if (to !== from) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  let out: AudioNode = o;
  if (lowpass) {
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(lowpass[0], t);
    f.frequency.exponentialRampToValueAtTime(lowpass[1], t + dur);
    o.connect(f);
    out = f;
  }
  out.connect(env(a, peak, dur, at));
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  key: () => hiss(0.006, 'highpass', 2000, 0.15),
  lift: () => hiss(0.04, 'bandpass', 3000, 0.2),
  slap: () => {
    hiss(0.07, 'lowpass', 1200, 0.35);
    tone('sine', 90, 90, 0.05, 0.4);
  },
  dice: () => {
    for (let i = 0; i < 6; i++) hiss(0.008, 'bandpass', 2500 + Math.random() * 1500, 0.3, Math.random() * 0.3);
  },
  star: () => {
    tone('sine', 140, 140, 0.06, 0.4);
    hiss(0.02, 'bandpass', 2000, 0.2);
  },
  step: () => tone('sine', 110, 60, 0.08, 0.35),
  sting: () => {
    tone('sawtooth', 220, 220, 0.4, 0.18, 0, [3000, 600]);
    tone('sawtooth', 233, 233, 0.4, 0.18, 0, [3000, 600]);
  },
  death: () => {
    hiss(0.2, 'lowpass', 800, 0.4);
    tone('sine', 70, 60, 0.2, 0.4);
  },
  clunk: () => {
    tone('square', 90, 90, 0.06, 0.2);
    hiss(0.03, 'lowpass', 900, 0.3);
  },
  terror: () => {
    tone('sawtooth', 110, 110, 0.6, 0.16, 0, [2400, 400]);
    tone('sawtooth', 117, 117, 0.6, 0.16, 0, [2400, 400]);
    hiss(0.6, 'highpass', 3000, 0.12);
  },
  sticker: () => hiss(0.05, 'bandpass', 1500, 0.3),
  buy: () => {
    tone('sine', 1318, 1318, 0.06, 0.2);
    tone('sine', 1760, 1760, 0.06, 0.2, 0.04);
  },
  whir: () => tone('sawtooth', 60, 180, 0.5, 0.12, 0, [800, 1600]),
  thunk: () => {
    tone('sine', 70, 70, 0.09, 0.5);
    hiss(0.06, 'lowpass', 700, 0.3);
  },
  error: () => {
    tone('square', 180, 180, 0.05, 0.12);
    tone('square', 180, 180, 0.05, 0.12, 0.08);
  },
};
