// iPhone web haptics: Safari gives a tick when an <input switch> toggles, and
// ios-haptics wires that up behind any element. Elsewhere navigator.vibrate.

import { hapticTrigger } from 'ios-haptics';

let enabled = true;
export function setHaptics(on: boolean): void {
  enabled = on;
}

const wired = new WeakSet<HTMLElement>();

/** Ref callback for tappable elements that should tick under the finger. */
export function haptic(el: HTMLElement | null): void {
  if (!el || !enabled || wired.has(el)) return;
  wired.add(el);
  try {
    hapticTrigger(el);
  } catch {
    // not iOS Safari, or no switch support
  }
}

/** For moments that aren't a direct tap (Android only; iOS ignores it). */
export function buzz(ms = 12): void {
  if (!enabled) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    // not supported
  }
}
