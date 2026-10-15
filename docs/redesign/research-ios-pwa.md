# Final Player: spec for a native iPhone feel (iOS 17, 18 and 26, installed PWA)

This spec covers behaviour, not the look. The art direction (no gradients, glows, blur or glass, nothing like Coldwake) is handled elsewhere. One rule ties the two together: **do not imitate iOS 26 "Liquid Glass" to seem native.** A web game feels native because of its layout, gestures, timing and feedback, not because it copies Apple's chrome.

---

## 0. What is wrong today, ranked (from reading the code and screenshots)

| # | Problem | Evidence | Fix in § |
|---|---|---|---|
| 1 | **Landscape is a portrait column with the dock cut off.** `.app { max-width: 600px; height: 100dvh }` leaves 120 px of empty space on each side. The dock (cards and the "End turn" button) is pushed below the fold. The turn ticker is clipped mid-line ("Laurie plays Walk / Horror roll…" is cut in half). | styles.css `.app`; `landscape-03/05` shots | 1, 2 |
| 2 | **The manifest locks `orientation: 'portrait'`.** iOS ignores this, so iPhone users rotate anyway and land in the broken layout. Android does honour it. | vite.config.ts | 2, 9 |
| 3 | **The dock is a page that scrolls** (`max-height: 52dvh; overflow-y: auto`). The hand scrolls sideways with a card cut off at the edge. Scrolling a panel reads as "web page". | styles.css `.dock`, portrait-03 | 2, 5 |
| 4 | **Map zones are below 44 pt.** In landscape the zone circles are about 30 px. They are `<g onClick>` with no larger hit area. | MapView.tsx `R()` = 3.4 to 4.3 units, about 4.7 px per unit | 4 |
| 5 | **Every animation frame re-renders the whole game.** `setT(p)` runs inside a rAF loop in Game.tsx, and MapView has no `memo`, so the full SVG re-renders at 60 fps during every killer move or dice roll. | Game.tsx lines 106 to 115 | 7 |
| 6 | **No `user-select`, `-webkit-touch-callout` or `text-size-adjust`.** A long press selects text or shows the loupe. iOS enlarges text when you rotate to landscape. | grep of styles.css | 4 |
| 7 | **The map uses `radialGradient` and `feGaussianBlur` (`#glow`)**, and the CSS has 12 gradients and glow shadows. This breaks the style rule, and SVG filters are also the most expensive thing to paint on iOS. | MapView.tsx lines 131 to 137, styles.css | 7 |
| 8 | **`registerType: 'autoUpdate'` can reload the page in the middle of a game** when a new service worker takes control. | vite.config.ts | 9 |
| 9 | **The apple-touch-icon is `icon-192.png`, which has transparent rounded corners** (`rx=112`). iOS fills transparency with black and applies its own mask. There is no 180 px icon and no splash screen. | index.html, scripts/icons.ts | 9 |
| 10 | **No haptics, no audio, no wake lock.** The screen sleeps while you think about a move. | none present | 8, 10 |

Already correct: `viewport-fit=cover`, `black-translucent`, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation` on buttons, `overscroll-behavior: none`, safe-area variables (keep the `--mnbg-safe-*` fallback chain; the library iframe needs it), and a `prefers-reduced-motion` block.

---

## 1. App shell: there is no page (P0, highest impact)

Nothing should ever scroll at the document level. Use a fixed shell, and scroll only inside named containers.

```css
html {
  -webkit-text-size-adjust: 100%;   /* stops iOS enlarging text on rotation to landscape */
  text-size-adjust: 100%;
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;        /* no rubber band or pull-to-refresh in a Safari tab (Safari 16+) */
  background: var(--table);         /* solid colour, also paints under the status bar and home indicator */
}
body { margin: 0; position: fixed; inset: 0; overflow: hidden; overscroll-behavior: none; }
#root, .app { position: fixed; inset: 0; }   /* do NOT rely on 100dvh (see note) */
.app { max-width: none; }                    /* delete the 600px cap; tablets get their own layout */

/* the only places allowed to scroll */
.scroll-y { overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; }
.scroll-x { overflow-x: auto; overscroll-behavior-x: contain; touch-action: pan-x; scrollbar-width: none; }
.scroll-x::-webkit-scrollbar { display: none; }
```

Notes:
- In standalone mode there is no address bar, so `dvh`, `svh` and `lvh` are all equal. But since 2025 there have been iOS reports of `100dvh`/`100vh` leaving a gap at the bottom the size of the home-indicator inset (WebKit 292603; Apple forums, iOS 26). There are also reports of white space after rotating a home-screen app on iOS 18. `position: fixed; inset: 0` on a body that does not scroll avoids all of these.
- Put safe-area padding on the shell, never on `body`. Padding on `body` pushes a 100%-tall shell past the bottom edge and makes it scroll.
- Momentum scrolling inside `.scroll-*` is built into iOS 13 and later. `-webkit-overflow-scrolling` is obsolete.

---

## 2. Orientation and layout (P0)

**What iOS actually does:** iOS **ignores the manifest `orientation` field**, and `screen.orientation.lock()` does not work on iPhone (it depends on the Fullscreen API, which iPhone does not have). The user's rotation lock decides. **Both orientations must be first-class.** The user most likely meant landscape. Make landscape the "table" layout that the title screen recommends ("Best played sideways", a tip you can dismiss, never a blocking overlay). Portrait is the "pocket" layout.

Set `orientation: 'any'` in the manifest (§9) so Android behaves the same way.

### Device budget (CSS px, approximate; never hard-code, always use `env()`)

| iPhone | Landscape viewport | Landscape insets L / R / B | Portrait insets T / B |
|---|---|---|---|
| SE 2/3 | 667×375 | 0 / 0 / 0 | 20 / 0 |
| 12/13/14 | 844×390 | 47 / 47 / 21 | 47 / 34 |
| 14 Pro, 15, 16 | 852×393 | 59 / 59 / 21 | 59 / 34 |
| 16 Pro, 17, 17 Pro | 874×402 | 62 / 62 / 21 | 62 / 34 |
| 15 Plus/Pro Max, 16 Plus | 932×430 | 59 / 59 / 21 | 59 / 34 |
| 16/17 Pro Max | 956×440 | 62 / 62 / 21 | 62 / 34 |

In landscape the status bar is hidden, so the top inset is 0. The side insets are **symmetric**: both sides are inset whichever side the Dynamic Island is on. The 21 px bottom band belongs to the home indicator. Backgrounds can run into it; controls must not.

**Landscape on 844×390:** the content box is 750×369.
- Map column `1fr`: about 472×369. The Camp map is about 1.27:1, so it fills the full height.
- Side column `clamp(250px, 33vw, 330px)`: about 270 px wide.
- On 932×430 the content box is 814×409: map about 510 wide, side column about 300.

**Portrait on 390×844 (insets 47/34):**
- HUD with killer chip: 48 px
- Map: 366×288
- Final Girl strip: 56 px
- Dock: about 345 px, enough for 150 px cards, a prompt line and a 52 px primary button **without scrolling**.
- iPhone SE (667 tall) leaves about 240 px for the dock, so use 120 px cards there.

```css
:root {
  --sa-t: var(--mnbg-safe-top,    env(safe-area-inset-top, 0px));
  --sa-r: var(--mnbg-safe-right,  env(safe-area-inset-right, 0px));
  --sa-b: var(--mnbg-safe-bottom, env(safe-area-inset-bottom, 0px));
  --sa-l: var(--mnbg-safe-left,   env(safe-area-inset-left, 0px));
  --gut: 12px;
  --pad-t: max(var(--sa-t), 8px);
  --pad-b: max(var(--sa-b), 8px);
  --pad-l: max(var(--sa-l), var(--gut));
  --pad-r: max(var(--sa-r), var(--gut));
}

/* POCKET (portrait): thumb zone at the bottom */
.game {
  position: fixed; inset: 0; display: grid; gap: 8px;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  grid-template-areas: "hud" "map" "fg" "dock";
  padding: var(--pad-t) var(--pad-r) 0 var(--pad-l);
}
.dock { grid-area: dock; padding-bottom: var(--pad-b); }   /* fixed size, no internal scroll */

/* TABLE (phone landscape): map on the left, the "player's side of the table" on the right */
@media (orientation: landscape) and (max-height: 500px) {
  .game {
    grid-template-columns: minmax(0, 1fr) clamp(250px, 33vw, 330px);
    grid-template-rows: auto auto minmax(0, 1fr);
    grid-template-areas: "map killer" "map fg" "map dock";
    column-gap: 8px; row-gap: 6px;
    padding: 0 var(--pad-r) 0 var(--pad-l);
  }
  .map-wrap { grid-area: map; padding: 6px 0 var(--pad-b); }
  .hud-float { position: absolute; top: 6px; left: var(--pad-l); } /* menu / log / rules as tokens over the map corner */
}
/* tablet: same grid with a wider side column */
@media (min-width: 900px) and (min-height: 600px) {
  .game { grid-template-columns: minmax(0, 1fr) 380px; grid-template-areas: "map killer" "map fg" "map dock"; grid-template-rows: auto auto 1fr; }
}
```

- **Thumb ergonomics:** in landscape the right thumb owns the dock and the left thumb owns the map and menu. Offer an optional "left-handed" setting that mirrors the grid areas.
- **Hand in landscape:** a fan of up to about 5 cards at 92×128 that **always fits without scrolling**. In portrait use a row of 110 to 150 px cards. If the hand overflows, use `scroll-snap-type: x mandatory` rather than a free-scrolling strip.

Use **CSS only** for the switch wherever possible, so the SVG and game state never remount on rotation. When the component structure has to differ (side sheet vs bottom sheet, fan vs row), use this hook:

```ts
import { useSyncExternalStore } from 'react';
const mq = matchMedia('(orientation: landscape) and (max-height: 500px)');
export const useTable = () =>
  useSyncExternalStore((cb) => (mq.addEventListener('change', cb), () => mq.removeEventListener('change', cb)), () => mq.matches);
// do not use the deprecated 'orientationchange' event
```

The title and setup screens in landscape: a two-column film shelf (a horizontal `.scroll-x` of film "boxes"), with killer/heroine/options on the right and the Start button bottom-right.

---

## 3. Safe areas (P0)

- Full-bleed **backgrounds**, inset **content**. Use the `--pad-*` tokens above everywhere, never raw `env()` in components.
- Interactive elements must not sit in the bottom inset band (34 px portrait, 21 px landscape). An upward swipe there goes home. Web apps cannot defer system edge gestures the way native apps can (`preferredScreenEdgesDeferringSystemGestures`), so no drag may start within about 20 px of any screen edge.
- **Status bar:** `black-translucent` draws **white** status text over your content in portrait. If the redesign uses a light "paper or cardboard" surface at the top, paint a dark band (`height: var(--sa-t)`, the table colour) behind the status bar, or the clock disappears. In landscape the status bar is hidden.
- `theme-color` is mostly ignored once `black-translucent` is set in standalone mode. Keep it equal to the table colour for the Safari-tab case. On iOS 26, Safari tints its bars from the body or fixed-element background instead, so keep the table background a solid colour.

---

## 4. Touch ergonomics: targets, fast tap, nothing browser-like (P0)

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
```

```css
*, *::before, *::after { touch-action: manipulation; }   /* removes double-tap zoom; 300 ms delay is already gone with width=device-width */
.app, .app * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
.selectable { -webkit-user-select: text; user-select: text; }  /* only the rules text, if wanted */
img, svg { -webkit-user-drag: none; }
a { color: inherit; text-decoration: none; }
:focus:not(:focus-visible) { outline: none; }
input, select { font-size: 16px; }                        /* anything smaller makes iOS zoom on focus */
.num { font-variant-numeric: tabular-nums; }               /* counters do not jitter */
@media (hover: hover) and (pointer: fine) { .btn:hover { /* hover only for real mice, so nothing "sticks" on iOS */ } }

/* tactile press: hard offset edge, no blur, which fits the style rules */
.btn, .token, .card { box-shadow: 0 3px 0 var(--edge); transition: transform 90ms cubic-bezier(.2,.8,.2,1), box-shadow 90ms; }
.btn:active, .token:active, .card:active { transform: translateY(3px); box-shadow: 0 0 0 var(--edge); }
```

Safari tabs ignore `user-scalable=no`, so also block pinch with WebKit's GestureEvents:

```ts
for (const t of ['gesturestart', 'gesturechange', 'gestureend'])
  document.addEventListener(t, (e) => e.preventDefault(), { passive: false });
// iOS only applies :active when a touch listener exists. React 17+ attaches one to the root;
// if not, add: document.addEventListener('touchstart', () => {}, { passive: true });
```

**Targets:** at least 44×44 pt for everything, 48 pt or more for the primary dock button, and at least 8 px between adjacent targets.

**Map hit areas:** draw a transparent hit circle sized in screen pixels, capped at half the distance to the nearest neighbour. During a move prompt, also **snap a tap to the nearest legal zone within 40 px**, so only legal destinations are tappable and each gets a large Voronoi-like area.

```tsx
const [pxPerUnit, setPx] = useState(4);
useLayoutEffect(() => {
  const el = svgRef.current!; const ro = new ResizeObserver(([e]) =>
    setPx(Math.min(e.contentRect.width / view.w, e.contentRect.height / view.h)));
  ro.observe(el); return () => ro.disconnect();
}, [view.w, view.h]);
const hitR = (z: ZoneDef) => Math.min(Math.max(R(z), 22 / pxPerUnit), nearest[z.id] / 2); // 22 px radius = 44 pt
// rendered LAST, above the visuals:
<circle cx={p.x} cy={p.y} r={hitR(z)} fill="transparent" pointerEvents="all" onClick={() => onTap(z.id)} />
```

**Fast tap:** show the pressed state on `pointerdown` (CSS `:active`) and act on `click`. Never act on `touchstart` or `pointerdown`, because that fires when a scroll begins.

---

## 5. Gestures: Pointer Events plus `touch-action` (P1)

- Use **Pointer Events only** (Safari 13 and later). Do not mix in Touch Events. React's touch listeners are passive, so `preventDefault()` in `onTouchMove` is ignored. Declare gestures in CSS with `touch-action`, which is read when the touch starts, so set it statically and not in JS during the gesture.
- **Swipe a card up to play it, tap to select it** (tap stays the primary input). The hand scrolls horizontally because the browser owns `pan-x`. A vertical drag is ours. When the browser takes over a horizontal pan it fires `pointercancel`, so the two never fight.

```tsx
function usePlayGesture(onPlay: () => void) {
  const s = useRef<{ id: number; x: number; y: number; el: HTMLElement; drag: boolean } | null>(null);
  const reset = (el: HTMLElement) => { el.style.transform = ''; delete el.dataset.lifted; };
  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => { if (e.isPrimary) s.current = { id: e.pointerId, x: e.clientX, y: e.clientY, el: e.currentTarget, drag: false }; },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const c = s.current; if (!c || c.id !== e.pointerId) return;
      const dx = e.clientX - c.x, dy = e.clientY - c.y;
      if (!c.drag) { if (Math.abs(dy) < 8 || Math.abs(dy) < Math.abs(dx)) return; c.drag = true; c.el.setPointerCapture(e.pointerId); c.el.dataset.lifted = ''; }
      c.el.style.transform = `translate3d(${dx * 0.3}px, ${Math.min(0, dy)}px, 0) rotate(${dx * 0.03}deg)`; // transform only
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => { const c = s.current; s.current = null; if (!c) return; reset(c.el); if (c.drag && e.clientY - c.y < -70) onPlay(); },
    onPointerCancel: () => { const c = s.current; s.current = null; if (c) reset(c.el); },
    onClickCapture: (e: React.MouseEvent) => { if (s.current?.drag) e.stopPropagation(); }, // a drag is not a tap
  };
}
// CSS: .hand { touch-action: pan-x } .hand .card { touch-action: pan-x; will-change: transform }
```

- **Free drags** (a meeple or victim onto a zone) use `touch-action: none` on the draggable element. Move a ghost element with `transform` inside a rAF, and give the ghost `pointer-events: none` so `document.elementFromPoint(x, y).closest('[data-drop]')` can hit-test. On `pointercancel`, animate back.
- **Long press to inspect** (like iOS Haptic Touch): after 380 ms with less than 8 px of movement, open the card zoom and swallow the next click. `-webkit-touch-callout: none` keeps the system callout away.
- **Pinch on the map:** if you want it, use two pointers and transform a `<g>`. Otherwise keep the existing "expand map" button.

---

## 6. Navigation model, sheets and transitions (P1)

- **One persistent scene.** The game screen never navigates away. Everything else is a **sheet** over it, or a card reveal. Do not push history entries for sheets: the left-edge back swipe works in standalone apps whenever history exists. If you do push them, handle `popstate` so the swipe closes the sheet.
- **Portrait bottom sheet:**
  - A grabber with a 44 pt hit area.
  - Drag to dismiss: close past 25% of the height or above 0.5 px/ms velocity.
  - A flat scrim, `rgb(… / .5)`, with no blur.
  - `inert` on the game while the sheet is open (Safari 15.5 and later).
  - Content scrolls with `overscroll-behavior: contain`.
- **Landscape side sheet:** it slides in from the right, `width: min(420px, 55vw)`, with padding-right `--pad-r`. The killer board can slide in from the left instead, mirroring where it sits on the physical table.

```css
.scrim { position: fixed; inset: 0; background: rgb(8 6 4 / .5); touch-action: none; }
.sheet { position: fixed; inset: auto 0 0 0; max-height: calc(100% - var(--pad-t) - 24px);
  padding: 8px var(--pad-r) var(--pad-b) var(--pad-l); border-radius: 16px 16px 0 0;
  transform: translateY(var(--drag, 0px)); transition: transform 380ms cubic-bezier(.32,.72,0,1); }
.sheet[data-enter] { transform: translateY(100%); }
.sheet.dragging { transition: none; }
@media (orientation: landscape) and (max-height: 500px) {
  .sheet { inset: 0 0 0 auto; width: min(420px, 55vw); max-height: none; border-radius: 16px 0 0 16px;
    padding: 12px var(--pad-r) var(--pad-b) 16px; transform: translateX(var(--drag, 0px)); }
  .sheet[data-enter] { transform: translateX(100%); }
}
```

- **Screen changes** (title, setup, game): use the View Transitions API (same-document transitions ship in Safari 18).

```ts
import { flushSync } from 'react-dom';
export function go(update: () => void) {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update();
  document.startViewTransition(() => flushSync(update));
}
```

- **Toasts and rule errors:** a banner at the top inside `--pad-t` that auto-dismisses after 2 s and can be swiped up. Never `alert()`.

---

## 7. Motion and performance (P1)

**Timing table.** iOS-like timing is short and springy.

| Interaction | Duration | Easing / notes |
|---|---|---|
| Press | 80 to 120 ms | |
| Card deal or flip | 260 to 320 ms | `cubic-bezier(.2,.9,.3,1.2)` |
| Sheet | 350 to 420 ms | `cubic-bezier(.32,.72,0,1)` |
| Killer step | 220 to 280 ms per zone | Hop with `translate` + `scale(1.08)` |
| Damage shake | 300 ms | ±6 px `translateX` |

**Rules:**
- Animate only `transform` and `opacity`.
- Never animate `box-shadow`, `filter`, `width`/`height`/`top`/`left`, or SVG geometry attributes at 60 fps.
- No `filter`, `feGaussianBlur` or `drop-shadow` anywhere. That also satisfies the style ban.

**Fix the per-frame React re-render.** This is the single biggest performance problem.
1. Split MapView into a `memo`'d **static layer** (paths, zones, labels, arrows; key it on location id plus rarely-changing zone state) and a small **token layer**.
2. Drive token motion with CSS transitions or Web Animations on a `<g>` transform, not with React state:

```ts
el.animate([{ transform: `translate(${a.x}px, ${a.y}px)` }, { transform: `translate(${b.x}px, ${b.y}px)` }],
           { duration: 260 * speed, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' }).finished.then(next);
```

3. Wrap `KillerPanel`, `PlayerPanel` and `Dock` in `React.memo` with stable props, and keep `t` out of their props.

**SVG specifics:**
- About 150 to 400 nodes is fine **if they do not re-render**.
- For CSS-animated SVG children, use `transform-box: fill-box; transform-origin: center`.
- Use `vector-effect: non-scaling-stroke` on paths so strokes stay crisp at any scale.
- Use `contain: strict` on `.map-wrap`.
- Avoid `<foreignObject>`.
- Replace the `#ground` radial gradient with a flat fill plus an SVG `<pattern>` (hatching or wood grain lines). Patterns are not gradients.
- Overlays that move a lot (dice, card reveals) belong in HTML layers above the SVG, not inside it.

**Avoid layout thrash:** never read `getBoundingClientRect` or `offsetWidth` inside an animation loop. Measure once with `ResizeObserver`, then write transforms.

**"Physical game" motion vocabulary:**
- Cards fly out of a visible deck and flip with `rotateY` and `backface-visibility: hidden`.
- Dice tumble (rotate plus translate keyframes) and then settle.
- Tokens slide along the actual path edges.
- The killer token hops step by step.
- Dead victims fall over (`rotate(90deg)`) and fade.

---

## 8. Feedback: haptics and sound (P1 and P2)

### Haptics: what actually works on iOS
- **`navigator.vibrate` does not exist on iOS Safari**, in any version up to iOS 26.
- **The only route is the native switch:** `<input type="checkbox" switch>` exists since Safari 17.4, and since iOS 18 iOS plays a system "tick" when it toggles.
  - The popular "create a label and `.click()` it from JS" version worked on iOS 18.0 to 26.4. The ios-haptics 3.1.1 README (June 2026) says **Apple patched it in iOS 26.5**. WebKit bug 285120 also proposed requiring user activation and is marked fixed.
  - The current approach (ios-haptics 3.2.0, September 2026) places an **invisible switch under the user's finger**, so the *real* tap toggles it and still fires the haptic.
- **Reliability:** works on real direct taps only.
  - **Never** from asynchronous game events (killer attacks, deaths), and not during drags.
  - It is one fixed, light pattern. There is no success, warning or heavy pattern.
  - It is silent if the user has turned off System Haptics.
  - Apple can change it in any update.
  - I have not verified it on a device. Treat it as progressive enhancement and test on an iPhone before relying on it.
- **Use it on:** card select, die keep/reroll, zone tap during a move, and the dock's primary confirm. Use it nowhere else.

```tsx
// npm i ios-haptics@3.2.0  (no-op on non-iOS)
import { hapticTrigger } from 'ios-haptics';
<button className="btn primary" ref={prefs.haptics ? hapticTrigger : undefined} onClick={confirm}>End turn</button>
// It appends an opacity:0 switch inside the element. The tap's click bubbles to the button, so onClick still fires.
// Do not use it on elements with touch-action:none drags (it sets touch-action: pan-x pan-y on the overlay).
// Check that the :active pressed style still shows.
```

For asynchronous hits, use a visual shake plus sound instead.

### Audio
- Web Audio only, with short synthesized or royalty-free effects decoded once: card snap, dice rattle, footstep thud, sting on attack.
- iOS keeps the `AudioContext` suspended until a gesture, and can re-suspend it after a call or backgrounding (non-standard `'interrupted'` state). So keep the unlock listeners **permanently**, not `once`.
- The default session category is "ambient": it **respects the silent switch**, which is correct for a game. Do not force `'playback'`.

```ts
let ctx: AudioContext | null = null;
export const audio = () => (ctx ??= new AudioContext({ latencyHint: 'interactive' }));
function unlock() {
  const c = audio();
  if (c.state !== 'running') c.resume().catch(() => {});
  const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0);
}
for (const t of ['pointerup', 'touchend', 'click', 'keydown'] as const)
  window.addEventListener(t, unlock, { capture: true, passive: true });
if ('audioSession' in navigator) (navigator as any).audioSession.type = 'ambient'; // explicit; honours the mute switch
document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx?.state !== 'running') ctx?.resume().catch(() => {}); });
```

Add Sound and Haptics toggles in the menu.

---

## 9. Launch experience: meta, manifest, icon, splash, fonts, updates (P2)

### index.html
```html
<html lang="en" style="background:#TABLE">  <!-- inline so there is no white flash before CSS loads -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
<meta name="theme-color" content="#TABLE" />
<meta name="apple-mobile-web-app-capable" content="yes" />      <!-- iOS 26 no longer needs it; harmless -->
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Final Player" />
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />    <!-- 180×180, OPAQUE, full-bleed, NOT pre-rounded -->
<!-- + generated apple-touch-startup-image links (below) -->
```

### Manifest and service worker
```ts
registerType: 'prompt',
workbox: { globIgnores: ['**/splash/**'], /* … */ },
manifest: { id: './', display: 'standalone', orientation: 'any', categories: ['games'],
  background_color: '#TABLE', theme_color: '#TABLE', icons: [/* … */, { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' }] }
```

```ts
// main.tsx: never reload during a game; apply the update on the title screen
export let applyUpdate: (() => void) | null = null;
const updateSW = registerSW({ onNeedRefresh() { applyUpdate = () => updateSW(true); } });
// App.tsx, on the title screen: useEffect(() => { applyUpdate?.(); }, []);
```

### Splash screens
iOS shows an `apple-touch-startup-image` only for an exact device match. Without one you see a plain, often white, screen until first paint.

Extend `scripts/icons.ts`, which already uses Playwright Chromium, to render a splash HTML (logo on the table colour) for each device in both orientations:

```ts
const devices = [[375,667,2],[375,812,3],[414,896,2],[414,896,3],[390,844,3],[428,926,3],[393,852,3],[430,932,3],[402,874,3],[440,956,3]] as const;
for (const [w, h, dpr] of devices) for (const land of [false, true]) {
  const vw = land ? h : w, vh = land ? w : h;
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr });
  const p = await ctx.newPage(); await p.setContent(splashHtml(vw, vh));
  const file = `splash/${vw * dpr}x${vh * dpr}.png`; await p.screenshot({ path: `public/${file}` }); await ctx.close();
  links.push(`<link rel="apple-touch-startup-image" media="screen and (device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: ${land ? 'landscape' : 'portrait'})" href="/${file}">`);
}
```

Also emit the 180×180 opaque `apple-touch-icon.png` (the maskable variant without the rounded `rect`, scaled to fill).

### Fonts
- Import **latin subsets only** (`@fontsource/<font>/latin-400.css`) so the precache stays small. Workbox already precaches woff2.
- Gate the first render on fonts to avoid FOUT:

```ts
Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]).then(() => createRoot(root).render(<App />));
```

- Add `font-synthesis: none;` so a missing weight never renders as faux bold.

---

## 10. Session behaviour (P2)

### Wake lock
Supported in Safari tabs since 16.4. Reportedly fixed for **installed** home-screen apps in iOS 18.4 (WebKit 254545, resolved fixed); earlier iOS silently fails in standalone mode. The lock is released whenever the app is hidden, so re-acquire it. Request it only on the game screen, and make it a setting.

```ts
let lock: WakeLockSentinel | null = null; let want = false;
export async function keepAwake(on: boolean) {
  want = on; if (!('wakeLock' in navigator)) return;
  try {
    if (on && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => (lock = null)); }
    else if (!on && lock) { await lock.release(); lock = null; }
  } catch { /* Low Power Mode, denied, or older iOS standalone */ }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && want) keepAwake(true); });
```

### Lifecycle
iOS kills backgrounded web apps aggressively, and a relaunch restarts at `start_url`.
- Save on every `act()` and on `pagehide`.
- On launch, resume **directly into the game**, or one tap away, at the exact prompt.
- Re-acquire audio and the wake lock on `visibilitychange`.

### Storage
- Installed apps get their own storage container, separate from Safari's.
- Call `navigator.storage?.persist?.()` once.

### Install coaching
iOS has no `beforeinstallprompt`. When the app is not standalone and the user is on iOS, show a one-time card on the title screen: "Share, then Add to Home Screen" with a drawn share glyph. On iOS 26, "Open as Web App" is on by default.

```ts
const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
```

---

## 11. Reduced motion and accessibility (P2)

Reduce motion; do not remove it. The current `animation: none !important` kills feedback, and it would break any logic that waits on `animationend`.

```css
@media (prefers-reduced-motion: reduce) {
  .card-deal, .die.roll, .shake, .token-hop { animation-name: fade-in; animation-duration: 140ms; }
  .sheet { transition-duration: 160ms; }
}
```

In JS, `matchMedia('(prefers-reduced-motion: reduce)')` should:
- default `prefs.speed` to `'fast'`
- jump the killer to its destination with a crossfade instead of stepping
- skip view transitions

Keep `aria-label`s on icon tokens, and keep a **text size** option, since pinch zoom is disabled.

---

## 12. "Web page" tells vs "native app"

| Feels like a web page | Feels native |
|---|---|
| The document scrolls or bounces; panels scroll vertically | Fixed scene; only sheets and the hand scroll, with snap |
| Text gets selected, the loupe or callout appears on long press | Long press = inspect (zoom the card) |
| Blue or underlined links, focus rings after a tap | Buttons and tokens with a pressed "into the board" state |
| A portrait column floating in landscape | A purpose-built table layout per orientation |
| Hover styles that stick after a tap | Hover only under `(hover: hover)` |
| Full-screen route changes with a blank flash | One persistent scene; sheets and card reveals on top |
| Centered modal dialogs, `alert()` | Bottom or side sheets with grabber and drag to dismiss; top banners |
| White flash on launch, late font swap | Splash image matching the table colour; fonts gated |
| Page reloads after an update | Updates applied on the title screen |
| Silence; the screen sleeps | Sound that respects the mute switch, tick haptics, wake lock |
| Small dense text, tiny tap targets | 44 pt minimum targets, 16 px or larger body text, tabular numbers |
| Linear easing, long fades | 80 to 400 ms spring-like transforms |

---

## 13. Top 15 rules for Final Player (ranked)

1. **The document never scrolls.** Use a `position: fixed; inset: 0` shell. Only `.sheet`, `.hand` and the rules page scroll, all with `overscroll-behavior: contain`.
2. **Landscape gets its own "table" grid**: map left, killer/Final Girl/dock right. Portrait gets the "pocket" grid. No `max-width` column. Manifest `orientation: 'any'`. Never block a rotation.
3. **The dock never scrolls.** The prompt, the hand (fan or snap row) and one primary button always fit, with the primary action in the thumb zone (bottom-right in landscape, bottom in portrait).
4. **Every control is inside the `--pad-*` safe-area tokens.** Nothing tappable or draggable sits in the home-indicator band or within 20 px of an edge. Paint a dark band behind a white status bar.
5. **44 pt minimum targets.** Map zones get pixel-sized transparent hit circles, plus snapping to the nearest legal zone.
6. **Tap is primary; gestures are shortcuts.** Swipe up to play a card, drag tokens, long press to inspect, all with Pointer Events and static `touch-action`.
7. **Kill browser behaviours:** `user-select: none`, `-webkit-touch-callout: none`, `text-size-adjust: 100%`, `touch-action: manipulation`, gesture events blocked, no visible links or focus rings on tap.
8. **Animate transform and opacity only.** No SVG filters, gradients or blurred shadows. Pressed states use hard offset edges.
9. **No React re-render per animation frame.** Memoize the static map layer; move tokens with WAAPI or CSS transitions.
10. **Every action gives feedback within 100 ms**: pressed state immediately, a sound, and a haptic tick on iOS where it works. Asynchronous hits get a shake and a sting, never an `alert`.
11. **One persistent scene.** Everything else is a bottom sheet (portrait) or side sheet (landscape), with drag to dismiss and the spring curve `cubic-bezier(.32,.72,0,1)`.
12. **Resume exactly where the player left off.** Save every action and on `pagehide`. Never reload mid-game (`registerType: 'prompt'`).
13. **Launch like an app**: opaque 180 px icon, splash images for both orientations, inline background colour, fonts gated by about 800 ms.
14. **Respect the device**: audio follows the mute switch, the screen stays awake only during play, reduced motion shortens and fades rather than removing.
15. **Physical metaphors in motion**: cards come out of decks and flip, dice tumble and settle, tokens travel along the drawn paths, the killer hops step by step. The motion must tell the rules story, as the physical game does.

---

## 14. How to verify without an iPhone

Use Playwright WebKit with `isMobile: true, hasTouch: true, deviceScaleFactor: 3` at 390×844 and 844×390. It cannot emulate `env()` insets, but the existing variable chain lets tests inject them:

```ts
await page.addStyleTag({ content: ':root{--mnbg-safe-top:0px;--mnbg-safe-left:47px;--mnbg-safe-right:47px;--mnbg-safe-bottom:21px}' }); // 844×390
```

Then screenshot and assert that:
- no element has `scrollHeight > clientHeight` outside the allowed scroll containers;
- every `button` and `[role=button]` has a bounding box of at least 44×44;
- the dock's primary button is fully inside the viewport, above the 21 px band;
- `document.scrollingElement.scrollTop` stays at 0 after swipes.

Haptics, wake lock and splash images still need one check on a real iPhone.

---

Files read: `/home/user/Final-player/index.html`, `/home/user/Final-player/vite.config.ts`, `/home/user/Final-player/src/ui/main.tsx`, `/home/user/Final-player/src/ui/styles.css`, `/home/user/Final-player/src/ui/components/Game.tsx` (rAF loop at lines 90 to 116), `/home/user/Final-player/src/ui/components/MapView.tsx` (gradient and filter at 131 to 137, `R()` at 120), `/home/user/Final-player/scripts/icons.ts`.

Sources:
- [ios-haptics on npm (README 3.1.1 says it works on iOS 17.4 to 26.4, "apple patched it in ios 26.5"; 3.2.0 uses a switch overlay under the finger)](https://npmjs.com/package/ios-haptics)
- [WebKit bug 285120: switch haptics usable from JS, user-activation fix](https://bugs.webkit.org/show_bug.cgi?id=285120)
- [Ionic issue 29942: toggle haptics trick](https://github.com/ionic-team/ionic-framework/issues/29942)
- [Progressier: Screen Wake Lock fixed in iOS 18.4 for installed PWAs](https://progressier.com/pwa-capabilities/screen-wake-lock)
- [WebKit bug 254545: Wake Lock in home-screen web apps](https://bugs.webkit.org/show_bug.cgi?id=254545)
- [Ben Frain: iOS 26 Safari theme-color and tab tinting](https://benfrain.com/ios26-safari-theme-color-tab-tinting-with-fixed-position-elements/)
- [WebKit bug 301994: iOS 26.1 standalone status bar](https://bugs.webkit.org/show_bug.cgi?id=301994)
- [WebKit bug 305546: theme-color with a fixed top element](https://bugs.webkit.org/show_bug.cgi?id=305546)
- [WebKit bug 292603: viewport units and the bottom safe-area strip](https://bugs.webkit.org/show_bug.cgi?id=292603)
- [Apple Developer Forums: DVH/VH gap on iOS 26](https://developer.apple.com/forums/thread/803987)
- [yuvomi v0.17.4 changelog: standalone fixed elements and body scroll](https://newreleases.io/project/github/ulsklyc/yuvomi/release/v0.17.4)
- [yuvomi v0.14.3 changelog: safe-area padding on body](https://newreleases.io/project/github/ulsklyc/yuvomi/release/v0.14.3)
- [WebKit bug 257695: ScreenOrientation.lock](https://bugs.webkit.org/show_bug.cgi?id=257695)
- [MDN BCD issue 19355: orientation lock not supported in Safari](https://github.com/mdn/browser-compat-data/issues/19355)
- [Mendix: manifest orientation not supported on iOS Safari](https://community.mendix.com/link/space/mobile/questions/115035)
- [Node-RED: white space after rotation in an iOS 18 home-screen app](https://discourse.nodered.org/t/iphone-web-app-dashboard-not-anchored-at-top-of-screen/99048)
- [MDN: AudioSession.state](https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/state)
- [WebKit bug 237322: Web Audio and the silent switch](https://auto-bugs.webkit.org/show_bug.cgi?id=237322)
- [bugnet.io: iOS web game audio muted by the silent switch](https://bugnet.io/blog/how-to-fix-ios-web-game-audio-muted-by-the-silent-switch)
- [Discourse Meta: generating iOS PWA splash screens](https://meta.discourse.org/t/generating-splash-screens-for-ios-pwa/112733)
- [iGeeksBlog: Safari features in iOS 26 (Open as Web App)](https://www.igeeksblog.com/safari-ios-26-macos-tahoe-features/)