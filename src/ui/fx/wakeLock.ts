// Keep the screen on during a game (supported on iOS 18.4+ in home-screen apps).

type Sentinel = { release(): Promise<void>; released?: boolean };
let lock: Sentinel | null = null;
let want = false;

async function acquire(): Promise<void> {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request(t: 'screen'): Promise<Sentinel> } }).wakeLock;
    if (!wl || document.hidden) return;
    lock = await wl.request('screen');
  } catch {
    lock = null;
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (want && !document.hidden) void acquire();
  });
}

export function keepAwake(on: boolean): void {
  want = on;
  if (on) void acquire();
  else {
    void lock?.release().catch(() => undefined);
    lock = null;
  }
}
