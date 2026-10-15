# Final Player redesign: scorecard and final build spec

## 0. Scorecard

The three directions were each scored 1 to 10 on six criteria. Each cell gives the score and a one-line reason.

| Criterion | Tabletop | VHS Pulp | Native-game |
|---|---|---|---|
| (a) Fun and tactile | **9**: every element is a component you handle. Cards lift, dice tumble, the killer meeple hops, the Bloodlust marker clunks, "SAVED" stickers slap on. | **9**: has the best set-pieces: chapter cards, the "HACK!" starburst, the Terror jump cut, rental-store jokes. | **8**: has solid moments, but reads as polished UI more than a toy box. |
| (b) Faithful to Final Girl | **9**: copies the real table: box lids become boards, Killer board beside the map, Horror dial, Bloodlust ladder, Tableau of piles. | **7**: leans on the VHS box more than the boards. Price tags and the "rental wall" are not the game's own vocabulary. | **9**: uses the same component set, with the killer "across the table" convention. |
| (c) Not AI-ish, distinct from Coldwake | **9**: a warm walnut table under light cardstock is the opposite of Coldwake's navy and cyan. | **6**: the warm-black halftone background still reads as a dark app at a glance, which is exactly what the user is reacting against. Day-glo pink adds a fourth accent. | **7**: the per-film table colours include navy (#1E2A4A) and near-black plum, which drift back toward a dark app. |
| (d) iPhone feel, portrait and landscape | **8**: full-height map in landscape and a fixed dock, but the board header and script strip cost map height. | **8**: good grid, but 22 px Anton keys and the box-back sheet flow are heavy. | **9**: best layout thinking: thumb zones, card sizes from container queries, a primary button that names the outcome. |
| (e) Clear information, one-thumb play | **8**: glance strips and "NOT NOW" reasons, but the lifted card hides the whole map. | **8**: icon-based effect lines and hiding panic numbers until needed are the strongest clarity ideas. Stickers risk clutter. | **9**: three tiers of detail, playback that shows the state as it was, and Skip that stops at cards. |
| (f) Feasible in React + CSS + inline SVG | **7**: everything is CSS and SVG. The lid animation and wood grain are extra work. | **7**: pinch zoom and many sticker variants. | **6**: camera tween, press-and-slide move targeting and five hand-drawn decor files make it the heaviest. |
| **Total** | **50** | **45** | **48** |

**Verdict.** Build on **Tabletop**. Add specific ideas from Native-game (layout and playback rigour) and VHS Pulp (effect icons, chapter cards, decluttering).

---

## 1. Decisions at a glance

### 1.1 Base and identity

The phone is a walnut kitchen table at 11 pm. The film's VHS box is open: its lids are the printed Location board and the black Killer board. Around them sit bone cardstock, purple, red and yellow meeples, red dice and a hand of cards. Every on-screen element is a printed, die-cut object:
- flat ink, with 2 to 2.5 px black outlines;
- a hard, unblurred offset edge for thickness.

### 1.2 Orientation strategy

- **Landscape, "the Table", is primary.** The map fills the left column at full height. A right rail holds the Killer strip, the Girl strip and the tray (hand plus keys) under the right thumb.
- **Portrait, "the Pocket", is first-class.** Same components, stacked: Killer strip on top (the opponent across the table), then the board, the Girl strip, and the tray at the bottom.
- The switch is **CSS grid areas only.** The SVG map and the game state never remount on rotation.
- The manifest uses `orientation: 'any'`. Rotation is never blocked.
- The title screen in portrait shows a dismissible sticker: "Best played sideways".

### 1.3 Ideas taken from the other directions

| Idea | From | Where |
|---|---|---|
| Card results drawn as icons, e.g. `[boot]2 [hourglass]−1` (effect lines) | VHS | §2.5 |
| Chapter title cards named after the killer ("HANS IS COMING") | VHS | §4.16 |
| Terror jump cut, plus a "FINALE SOON" sticker when 3 or fewer Terror cards remain | VHS | §4.17, §2.6 |
| Panic numbers shown only where they matter, plus a 1–6 toggle | VHS | §2.7 |
| Objective and film stickers on the Killer strip | VHS | §2.6 |
| Cards in play shown as mini sleeves on the board edge | VHS | §2.7 |
| Fast-forward never skips a card; Skip stops at the next card | VHS + Native | §6 |
| Playback draws the state as it was at each moment (log snapshots) | Native | §6.1 |
| The roll's Accept key names the outcome | Native | §4.6 |
| Three tiers of detail: glance, tap for a sheet, long-press to inspect | Native | §5 |
| Multi-card Discard for Time key `[+hourglass]` | Native | §4.4 |
| Finale darkens the table | Native | §6.5 |
| Killer strip on top in portrait | Native | §3 |
| Board decor generated from zone flags (no hand-drawn decor files) | Native, simplified | §2.7 |

### 1.4 What is cut, and why

| Cut | Replaced by |
|---|---|
| Native's camera tween and press-and-slide move retargeting | One zoom toggle with one-finger pan |
| VHS pinch zoom | The same zoom toggle |
| Swipe-up-to-play (all three) | Tap is the only commit gesture |
| Tabletop's script strip on the board | Script lines live in the tray during playback |
| Tabletop's board header phase track | A tape-counter chit |
| VHS day-glo pink | Removed |
| Native per-film table colours | The table is always walnut; film identity lives on the board, the spines and the Event cards |
| "Rental wall" and price-tag metaphors | A plain Tableau mat |
| Full "pop the lids" choreography | A 900 ms opening |

---

## 2. Visual system

### 2.1 Tokens (`src/ui/styles/tokens.css`)

```css
:root {
  /* the table */
  --table: #4A3324;        /* walnut: app background, status/home bands */
  --table-grain: #57402D;  /* grain strokes */
  --table-deep: #2E2017;   /* table after THE FINALE */
  --chalk: #F3EBDD;        /* text printed directly on the table */
  --chalk-2: #CBBFA8;      /* secondary text on the table (6.1:1) */

  /* print and stock */
  --ink: #141213;          /* every outline, text on light stock, hard shadows */
  --ink-2: #5B524A;        /* secondary text on bone (6.6:1) */
  --bone: #EFE6D2;         /* board frame, strips, keys, sheets */
  --bone-2: #DCCFB4;       /* disabled, pressed rows, empty slots */
  --bone-edge: #C8BC9F;    /* cardstock thickness layer */
  --paper: #F7F1E3;        /* action card face */
  --paper-edge: #D8CDB5;
  --black-stock: #1E1A1B;  /* Killer strip and sheet, Terror cards, title cards, dice tray */
  --black-stock-2: #2C2627;
  --on-black: #EFE6D2;
  --on-black-2: #A89F8E;   /* 7:1 on black stock */
  --kraft: #C9A46A;        /* item cards, backpack */
  --kraft-edge: #94733F;

  /* components */
  --blood: #B3161B;  --blood-edge: #6E0B0F;  /* primary key, damage, Bloodlust fill */
  --killer: #C1272D;                          /* killer meeple, dice, Horror marker */
  --girl: #6E46A0;   --girl-edge: #432A63;    /* Final Girl meeple, after-roll cards, Ultimate */
  --victim: #F2C230; --victim-edge: #A8821A;  /* victim meeples, lit-space ring, panic highlight */
  --sv-white: #F4F1EA; --sv-orange: #E8742A; --sv-blue: #3A7BD5; --sv-green: #5E9C4A;
  --time: #2F6DB5;   /* Time hourglass, cost > 0 */
  --gold: #D4A12A;   /* zero-cost hourglass, SAVED */
  --wrench: #E8742A; /* search spaces, item decks */
  --exit: #3E7A3A;   /* exits, .btn.good, green Horror space */
  --dp: #7A0E12;     /* Dark Power face */
  --scrim: rgb(20 18 19 / .55);  /* the ONLY transparency allowed (plus .35 map dim) */

  /* fonts */
  --f-display: 'Anton', Impact, 'Arial Narrow Bold', sans-serif;
  --f-ui: 'Archivo', system-ui, sans-serif;
  --f-narrow: 'Archivo Narrow', 'Arial Narrow', sans-serif;
  --f-script: 'Courier Prime', 'Courier New', monospace;
  --f-marker: 'Permanent Marker', 'Comic Sans MS', cursive;
  --f-vcr: 'VT323', ui-monospace, monospace;
}
```

### 2.2 Board palettes

The board palette is set per location with `.game[data-loc=…]`. The Birds and Dr. Fright's dream override it.

| `data-loc` | --ground | --water | --decor | --house | --trail | --street | --accent | --event / --event-ink | --ground-finale |
|---|---|---|---|---|---|---|---|---|---|
| campHappyTrails | #4E6B3E | #2E5A6B | #2F4A32 (pines) | #6B4423 | #C9B98F | — | #E07A2E | #C9B98F / #141213 | #2C3D2A |
| creechManor | #5A3A5E | #3B2140 | #4A2D50 (plank lines) | #7A4F7F (room blocks) | #EDE3D1 | — | #D9A441 | #7A4F7F / #EFE6D2 | #3B2140 |
| carnivalOfBlood | #C49A6C (sawdust) | #2E5A6B | #C8272D + #F2B705 (pennants) | #C8272D/#F4E9D0 (tent stripes) | #7A5634 | — | #F2B705 | #F2B705 / #141213 | #8E6A44 |
| mapleLane | #5E8C3A | #2E5A6B | #3C5A2E (hedges) | #A44A3F | #F1EDE4 | #6E6A66 | #9E2B25 | #A44A3F / #EFE6D2 | #3E5E28 |
| mapleLane, `[data-dream]` (asleep) | #8A4B24 | #5C3418 | #5C3418 (pipes) | #5C3418 | #C9B98F | #5C3418 | #A9B04A | #A9B04A / #141213 | #5A3218 |
| sacredGroves | #C47F2C (ochre) | #2B6E6A | #1F4D3A (grove trees) | #B8A88A (stone) | #8E3B23 | — | #8E3B23 | #B8A88A / #141213 | #8E5A1F |
| `[data-killer=birds]` (overrides any location) | #4A5560 | #3A434C | #3A434C | #3A434C | #E9E6DF | #3A434C | #B3161B | #E9E6DF / #141213 | #2E353C |

Put these values in `src/ui/film.ts` as data and apply them as inline CSS variables on `.game`. Do not read `LocationDef.ground` or `LocationDef.accent`, and do not read `KillerDef.color`. The killer meeple is always `--killer`.

**VHS spines (title screen).** Each spine has a background, title colour and a 6 px stripe:

| Film | Background | Title | Stripe |
|---|---|---|---|
| happyTrails | #2F4A32 | #EFE6D2 | #E07A2E |
| creech | #3B2140 | #EFE6D2 | #D9A441 |
| carnival | #C8272D | #F4E9D0 | #F2B705 (flat cream stripes, 12 px) |
| maple | #3C5A2E | #F1EDE4 | #9E2B25 |
| groves | #8E3B23 | #F4E9D0 | #C47F2C |
| terror | #E9E6DF | #1A1A1D | #B3161B |

**Special victims.** The colour depends on the role (the meeple's fill):

| Colour | Roles |
|---|---|
| `--sv-white` | girlfriend, sister, superTourist, ghostHunter, survivor |
| `--sv-blue` | boyfriend, mlBoyfriend, fiance, holyMan |
| `--sv-orange` | cursed, werewolf, smalley |
| `--sv-green` | tourGuide |

### 2.3 Typography

Install exact versions and import the Latin subsets only (`main.tsx`):

```ts
import '@fontsource/anton/latin-400.css';
import '@fontsource/archivo/latin-500.css';
import '@fontsource/archivo/latin-600.css';
import '@fontsource/archivo/latin-700.css';
import '@fontsource/archivo-narrow/latin-500.css';
import '@fontsource/archivo-narrow/latin-700.css';
import '@fontsource/courier-prime/latin-400.css';
import '@fontsource/courier-prime/latin-700.css';
import '@fontsource/permanent-marker/latin-400.css';
import '@fontsource/vt323/latin-400.css';
```

Install: `npm i -E @fontsource/anton@5.3.0 @fontsource/archivo@5.3.0 @fontsource/archivo-narrow@5.3.0 @fontsource/courier-prime@5.3.0 @fontsource/permanent-marker@5.3.0 @fontsource/vt323@5.3.0`. Remove `@fontsource/barlow-condensed` and `@fontsource/creepster`.

| Role | Font, weight | Portrait 390 | Landscape 844×390 | Case and notes |
|---|---|---|---|---|
| Title cards ("KILLER PHASE", "THE FINALE", "THE END?") | Anton 400 | 44 px | 40 px | UPPER. `text-shadow: 3px 3px 0 var(--blood)` (the only text shadow allowed: a hard misregistration offset) |
| Logo `.logo` | Anton | 48 px | 40 px | UPPER via CSS, blood offset |
| Strip names (HANS, LAURIE), sheet titles | Anton | 20 px (sheets 26 px) | 18 px | UPPER |
| Big numerals (HP, Time, successes) | Anton, `tabular-nums` | 24 px (successes 36 px) | 22 px (32 px) | — |
| Keys (`.btn`) | Archivo 700 | 16 px (primary 18 px) | 15 px (primary 16 px) | UPPER via CSS, `letter-spacing: .02em`; DOM text stays sentence case |
| Key sub-line | Archivo Narrow 700 | 13 px | 12 px | sentence case |
| Tray prompt `h4` | Archivo 600 | 16 px | 15 px | sentence case |
| Body, sheets, options | Archivo 500 | 16 px | 15 px | sentence case, line-height 1.35 |
| Card title, hand size | Archivo Narrow 700 | 13 px | 12 px | UPPER, 2 lines max |
| Card title, lifted | Anton | 24 px | 22 px | UPPER |
| Card result rows | Archivo Narrow 700 | 12 px hand / 16 px lifted | 11 px hand / 15 px lifted | sentence case |
| Card spine name (vertical) | Archivo Narrow 700 | 12 px | 11 px | UPPER |
| Map space names | Archivo Narrow 700 | 11 px screen px | 11 px | UPPER, on an ink plate |
| Panic tiles | Archivo Narrow 700 | 11 px | 11 px | ink on bone |
| Log, Terror/Event flavour, choice detail slip, VCR script | Courier Prime 400/700 | 15 px | 14 px | sluglines UPPER bold: `INT. DOCK – NIGHT` |
| Stickers | Permanent Marker | 13–22 px | 12–20 px | UPPER, rotated −4° |
| Tape counter, deck count, VCR labels, end stats | VT323 | 20–24 px | 20 px | UPPER: `T01 ▶ ACTION` |

Rules:
- `font-synthesis: none` globally.
- **No rendered text below 11 px. Body text is 15 px or larger.**
- No letter-spaced eyebrow labels.
- No Creepster, Barlow, Chakra Petch, IBM Plex or Spectral.

### 2.4 Materials, edges and press states (`pieces.css`)

**Global rules**
- Every object has a 2 px `--ink` outline (2.5 px on keys and dice).
- Thickness is drawn with **stacked hard box-shadows with zero blur**.
- Radii: boards and cards 6 px; keys 10 px; chits round; dice 12 px.

```css
.stock { background: var(--bone); color: var(--ink); border: 2px solid var(--ink); border-radius: 6px;
  box-shadow: 0 3px 0 var(--bone-edge), 0 5px 0 var(--ink), 4px 8px 0 rgb(0 0 0 / .25); }
.stock.black { background: var(--black-stock); color: var(--on-black);
  box-shadow: 0 3px 0 #000, 0 5px 0 var(--ink), 4px 8px 0 rgb(0 0 0 / .25); }

.btn { appearance: none; display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 48px; min-width: 48px; padding: 0 16px; gap: 2px;
  background: var(--bone); color: var(--ink); border: 2.5px solid var(--ink); border-radius: 10px;
  font: 700 16px/1 var(--f-ui); text-transform: uppercase; letter-spacing: .02em;
  box-shadow: 0 4px 0 var(--ink);
  transition: transform 90ms cubic-bezier(.2,.8,.2,1), box-shadow 90ms cubic-bezier(.2,.8,.2,1); }
.btn:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 0 0 var(--ink); }
.btn.primary { background: var(--blood); color: var(--paper); min-height: 52px; font-size: 18px; }
.btn.good { background: var(--exit); color: var(--paper); }
.btn.dark { background: var(--black-stock-2); color: var(--on-black); box-shadow: 0 4px 0 #000; }
.btn.small { min-height: 44px; padding: 0 12px; font-size: 14px; box-shadow: 0 3px 0 var(--ink); }
.btn:disabled { background: var(--bone-2); color: var(--ink-2); border-style: dashed; box-shadow: none; }
.btn .sub { font: 700 13px/1 var(--f-narrow); text-transform: none; letter-spacing: 0; }
.btn .glyph { width: 16px; height: 16px; } /* SVG play/ff/skip glyphs, aria-hidden */

.chit { position: relative; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
  background: var(--bone); color: var(--ink); border: 2px solid var(--ink); box-shadow: 0 3px 0 var(--ink); }
.chit::after { content: ''; position: absolute; inset: -4px; } /* 48 px hit area */
.chit:active { transform: translateY(3px); box-shadow: none; }

.sticker { display: inline-block; font: 400 15px/1 var(--f-marker); text-transform: uppercase; padding: 5px 9px 4px;
  background: var(--paper); color: var(--ink); border: 2px solid var(--ink); border-radius: 4px;
  transform: rotate(-4deg); box-shadow: 2px 2px 0 var(--ink); }
.sticker.red { background: var(--blood); color: var(--paper); }
.sticker.gold { background: var(--gold); }
.sticker.yellow { background: var(--victim); }
.sticker.purple { background: var(--girl); color: var(--paper); }
.sticker.black { background: var(--black-stock); color: var(--on-black); }

@media (hover: hover) and (pointer: fine) { .btn:hover { background: var(--paper); } .btn.primary:hover { background: #C41E23; } }
```

**Table texture.** Body and `.app` use a flat colour plus an SVG pattern. This is not a gradient.

```css
.app { background: var(--table) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='60'%3E%3Cpath d='M0 12c40-6 80 6 120 0s80-6 120 0M0 31c50 5 90-4 130 2s70 3 110-2M0 49c30-4 70 4 120 1s90-3 120 1' fill='none' stroke='%2357402D' stroke-width='2'/%3E%3C/svg%3E"); }
.game[data-finale] { --table: var(--table-deep); }
```

**Banned everywhere** (enforced by `scripts/style-audit.ts`, see §11):
- `linear-gradient`, `radial-gradient`, `conic-gradient`, `<linearGradient>`, `<radialGradient>`
- `filter:`, `backdrop-filter`, `feGaussianBlur`, `drop-shadow`
- any box-shadow or text-shadow with a blur radius above 0
- `opacity` used to dim cards (use `--bone-2` stock instead)
- emoji
- cyan values (#79e2ff, #9be7ff, #5ce1e6)

### 2.5 Pieces

#### Meeple (`pieces/Meeple.tsx`)

One `<symbol>` defined once in a hidden `<svg>` sprite in `App`:

```svg
<symbol id="meeple" viewBox="0 0 24 24"><path d="M12 2a3.3 3.3 0 0 1 2.3 5.7l5.4 2.1c1 .4 1.4 1.5.9 2.4l-.3.5a1.6 1.6 0 0 1-1.9.7L16 12.6l2.6 8c.2.7-.3 1.4-1 1.4h-3.2L12 17.6 9.6 22H6.4c-.7 0-1.2-.7-1-1.4l2.6-8-2.4.8a1.6 1.6 0 0 1-1.9-.7l-.3-.5c-.5-.9-.1-2 .9-2.4l5.4-2.1A3.3 3.3 0 0 1 12 2z"/></symbol>
```

```tsx
export const Meeple = ({ size, color, base }: { size: number; color: string; base?: boolean }) => (
  <g className="meeple">
    {base && <ellipse cx={0} cy={size * 0.46} rx={size * 0.42} ry={size * 0.12} fill="#141213" />}
    <use href="#meeple" x={-size / 2 + size * 0.06} y={-size / 2 + size * 0.08} width={size} height={size} fill="#141213" />
    <use href="#meeple" x={-size / 2} y={-size / 2} width={size} height={size} fill={color} stroke="#141213" strokeWidth={1.4} paintOrder="stroke" />
  </g>
);
```

Sizes on the map are in screen px, divided by px-per-unit inside the SVG:

| Meeple | Size | Colour | Notes |
|---|---|---|---|
| Final Girl | 28 px | `--girl` | |
| Killer | 32 px | `--killer` | with base |
| Victim | 18 px | `--victim` | |
| Special victim | 18 px | per the role table in §2.2 | |

- A dead victim tips over: `rotate(90deg)` for 300 ms, then a flat splat stays on the space until the next Action phase.
- Minions (Puppets) are 16 px kraft square chits with hit-point pips.
- Birds are 18 px slate round chits with a crow silhouette.
- More than 3 victims on a space: draw 2 meeples plus a 22×16 bone "×5" chit (Archivo Narrow 700 11 px).

#### Dice (`pieces/Die.tsx`, HTML)

```css
.die { position: relative; width: 52px; height: 52px; border-radius: 12px; display: grid; place-items: center;
  background: var(--killer); color: var(--paper); border: 2.5px solid var(--ink);
  box-shadow: 0 4px 0 var(--blood-edge), 0 6px 0 var(--ink); }
.die svg { width: 30px; height: 30px; }
.die.fail { background: #7A2A2C; color: #C9A9A3; }
.die.near { animation: wobble 600ms ease-in-out infinite alternate; }
.die.picked { outline: 3px dashed var(--victim); outline-offset: 3px; animation: none; }
.die.sm { width: 40px; height: 40px; } .die.sm svg { width: 24px; height: 24px; }
.die .won { position: absolute; top: -8px; right: -8px; } /* gold star sticker when converted */
@keyframes wobble { from { transform: rotate(-4deg); } to { transform: rotate(4deg); } }
```

Faces (viewBox 0 0 24 24). **Numerals are never shown.**
- 1–2: blank.
- 3–4: card pair:
  ```svg
  <rect x="3.5" y="5" width="10" height="14" rx="1.5" transform="rotate(-12 8.5 12)" fill="none" stroke="currentColor" stroke-width="2"/>
  <rect x="10.5" y="5" width="10" height="14" rx="1.5" transform="rotate(10 15.5 12)" fill="var(--killer)" stroke="currentColor" stroke-width="2"/>
  ```
- 5–6: star:
  ```svg
  <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="currentColor"/>
  ```
- Classification reuses the current `Dice` logic: success = 5–6, or converted, or 3–4 under `auto34`; near = 3–4; fail = 1–2. Keep the per-die remount key so only rerolled dice animate.

#### Action card (`cards/ActionCard.tsx`)

A `<button class="acard">` with a coloured **spine** on the left. In a crowded fan, cards read like VHS spines.

```
┌──┬──────────────────┐
│ic│ WALK             │  title (horizontal)
│  │ ┌─┐ boot2 ⧗−1    │  result rows: mini red die label + effect line
│W │ └─┘              │
│A │ ┌─┐ boot1 ⧗−1    │
│L │ ┌─┐ boot1 ♥−1 ⧗−2│
│K │     OR ⧗−2       │
│ⓞ│                  │  ⓞ = cost hourglass disc (gold when 0, blue otherwise)
└──┴──────────────────┘
```

```css
.acard { --cw: 112px; --sp: 26px; width: var(--cw); aspect-ratio: 63/88; padding: 0; text-align: left;
  display: grid; grid-template-columns: var(--sp) minmax(0,1fr); overflow: hidden;
  background: var(--paper); color: var(--ink); border: 2px solid var(--ink); border-radius: 6px;
  box-shadow: 0 2px 0 var(--paper-edge), 0 4px 0 var(--ink);
  transition: transform 160ms cubic-bezier(.2,.9,.3,1.2); }
.acard .spine { display: grid; grid-template-rows: auto 1fr auto; justify-items: center; gap: 4px; padding: 5px 0;
  background: var(--ink); color: var(--bone); }
.acard[data-timing=reaction] .spine { background: var(--blood); }
.acard[data-timing=afterRoll] .spine { background: var(--girl); }
.acard .vname { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; overflow: hidden;
  font: 700 12px/1 var(--f-narrow); text-transform: uppercase; letter-spacing: .03em; }
.acard .cost { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid var(--bone);
  background: var(--time); color: var(--paper); font: 400 12px/17px var(--f-display); text-align: center; }
.acard .cost.zero { background: var(--gold); color: var(--ink); }
.acard .face { display: flex; flex-direction: column; gap: 3px; padding: 5px 6px; min-width: 0; }
.acard .title { font: 700 13px/1.05 var(--f-narrow); text-transform: uppercase; }
.acard .row { display: grid; grid-template-columns: 18px minmax(0,1fr); gap: 4px; align-items: start;
  border-top: 1.5px solid var(--ink); padding-top: 3px; font: 700 12px/1.15 var(--f-narrow); }
.acard .lbl { width: 18px; height: 18px; border-radius: 4px; background: var(--killer); color: var(--paper);
  border: 1.5px solid var(--ink); display: grid; place-items: center; }  /* mini die with 0–3 stars */
.acard .row.hit { background: var(--victim); }          /* the matching row after a roll ("ink stamp") */
.acard.sel { transform: translateY(-24px); z-index: 5; }
.acard.hover { transform: translateY(-12px); z-index: 4; }
.acard.off { background: var(--bone-2); color: var(--ink-2); }
.acard.off .spine { background: var(--ink-2); }
.acard.marked { transform: translateY(-12px); } .acard .xmark { position: absolute; inset: 20% 10%; color: var(--blood); } /* SVG X, stroke 5 */
.acard.big { --cw: 220px; --sp: 40px; }                  /* portrait lifted; landscape lifted uses --cw: 200px; --sp: 36px */
.acard.big .title { font: 400 24px/1 var(--f-display); }
.acard.big .row { font-size: 16px; grid-template-columns: 26px 1fr; } .acard.big .lbl { width: 26px; height: 26px; }
.acard.big .vname { font-size: 15px; } .acard.big .cost { width: 30px; height: 30px; font-size: 17px; line-height: 26px; }
```

**Sizes** (`--cw` / `--sp`):

| Context | Portrait | Landscape | Other |
|---|---|---|---|
| Hand | 112 / 26 | 88 / 22 | Portrait at `max-height: 700px` (SE): 92 / 22. Portrait at `min-height: 900px`: 124 / 28 |
| Lifted (stage) | 220 / 40 | 200 / 36 | |
| Detail (Planning, Roll mat) | 150 / 30 | 160 / 30 | |

**Card glyph** (spine icon), from the first effect found in the card's results:

| First effect, in order of priority | Glyph |
|---|---|
| `timing === 'reaction'` | shield |
| `damage` | knife |
| `move` | boot |
| `horror` < 0 | eye |
| `heal` | heart |
| `search` / `itemAny` | wrench |
| `time` | hourglass |
| otherwise | card |

**Result rows** come from `card(id).results`:
- With `triple`: rows 3+, 2, 1, 0.
- Without `triple`: rows 2+, 1, 0.
- The label is a mini red die showing 3, 2, 1 or 0 stars. The top row means "or more".
- Each row's `Effect[][]` alternatives render as lines; lines after the first are prefixed by an ink `OR` tag (Archivo Narrow 700 11 px on `--bone-2`).
- A card with no `results` shows `card.text` in Archivo 13 px (lifted: 16 px).
- The matching row for a success count `s`:
  - with triple: s ≥ 3 → triple, s = 2 → double, s = 1 → single, s = 0 → fail;
  - without triple: s ≥ 2 → double, s = 1 → single, s = 0 → fail.

**Effect line** (`cards/EffectLine.tsx`). Inline icons are 1.1em, `currentColor` unless noted:

| Effect | Rendered as |
|---|---|
| move n | Boot + `n` |
| time n | Hourglass (`--time`) + `+n` / `−n` |
| horror n | Mask + `+n` / `−n` |
| heal n | Heart (`--blood`) + `+n` |
| lose n | broken Heart (`--blood`) + `−n` |
| damage n | Knife + `n` |
| bonusDice n | Die + `+n` |
| partials | tag `3–4 = ★` |
| search n | Wrench + `n` |
| itemAny | Wrench + `ANY` |
| takeCard | Card + `+1` |
| ignoreAttack | Shield + `BLOCK` |
| reduceAttack n | Shield + `−n` |
| endAction | tag `END` |
| anything else | `describe(g, [e])` in Archivo Narrow |

#### Card backs and reveal faces (`cards/RevealCard.tsx`, `cards/CardBack.tsx`)

**Backs** (63:88, 2 px ink, 6 px radius):

| Deck | Back |
|---|---|
| Action | bone with an inner 4 px ink frame |
| Terror | black stock with a 10 px blood diagonal slash and VT323 "TERROR" |
| Event | `--event` with an ink frame |
| Item | kraft with a wrench |
| Dark Power | `--dp` with a bone diamond |
| Finale | black stock with Anton "FINALE" |

**Reveal faces** (240×336 portrait, 200×280 landscape):

| Deck | Band and title | Body and extras |
|---|---|---|
| Terror | black stock; 28 px blood band with VT323 `TERROR · 9 LEFT`; title Anton 26 bone with 2 px blood offset | Courier Prime 15 bone |
| Event | `--event` face, `--event-ink` text; band `EVENT` | Courier |
| Dark Power | `--dp` face, bone text; band `DARK POWER` or `MINOR DARK POWER` | Archivo 15 |
| Finale | black stock; band `THE FINALE` | Archivo 15 |
| Item | kraft face, ink text; band `ITEM` | text in Archivo 15; stats row of chits: hands (1 or 2 hand icons), range `0–1`, damage `+1`, uses `×3` |

The footer of every reveal reads "Tap to continue" (Archivo 600 14 px, 70% of the card colour).

### 2.6 Strips (`strips/*`), class `panel`

**Killer strip** (`.panel.killer`, black stock)

Contents:
- **Emblem** (portrait only): a 44 px black-stock-2 square with the killer's emblem (`killerDef.icon`) in bone.
- **Name**: Anton 20 bone.
- **Health**: heart icon plus Anton 24 numeral, then the Final Health token chit.
  - The token is a 20 px coin: black with bone "+1" (Archivo Narrow 700 11 px) while `token === 'black'`, white with ink "+1" when white.
  - Invulnerable killers show "∞" and the sticker `CAN'T BE HURT`.
  - The Birds show a crow plus the bird count.
- **Bloodlust ladder**: one box per `k.bloodlust` space, 12×16 px with a 2 px gap (landscape 10×16).
  - Filled `--blood` up to the current index; empty boxes `--black-stock-2` with a 1.5 px `--on-black-2` border.
  - The current box carries the **marker**: a 14 px `--killer` cube with an ink border, sitting 2 px proud.
  - Dark Power spaces have a 6 px gold diamond notch above the box.
  - Spaces with effects have a 3 px bone dot below.
  - The marker moves with `transform` (250 ms, `cubic-bezier(.3,1.4,.5,1)`).
- **Current attack and move**: Knife + Anton 18 `2`, Boot + Anton 18 `1`.
- **Dark Power slot**: a 22×30 card. A back until revealed, then the face: dp colour with a diamond. Show the **revealed** one (fixes the `dp[0]` bug).
- **Terror deck**: 30×42 black-stock card with VT323 22 count. Thickness is `box-shadow: deckStack(n)`.
  - At 3 or fewer, a `FINALE SOON` red sticker sits over the deck.
  - After the Finale, the slot shows the Finale face mini.

```ts
export const deckStack = (n: number) => Array.from({ length: Math.min(6, Math.ceil(n / 2)) },
  (_, i) => `${i + 1}px ${i + 1}px 0 ${i % 2 ? '#141213' : '#3A3334'}`).join(',') || 'none';
```

**Film sticker.** At most one, on the strip's bottom edge, centred, `transform: translateY(50%) rotate(-3deg)`:

| Film | Sticker |
|---|---|
| Creech | `ESCAPE WITH CAROLYN` (yellow) |
| Birds | `OUTLAST THE FLOCK · {saved}/{total}` (black) |
| Maple | `ASLEEP {n}/4` (purple) or `AWAKE` (paper); `BLURRED` replaces it while blurred |
| Groves | `WRATH {k} · DIVINE {d}` (paper) |
| Carnival | `PUPPETS {ready} READY` (paper) |

The whole strip is one button (`aria-label="Killer board"`) that opens the Killer sheet.

**Girl strip** (`.panel.girl`, bone stock)

Contents:
- **Horror dial**: SVG, 56 px portrait / 52 px landscape (code below).
- **Name**: Anton 18; it turns into a purple plate with an `ULTIMATE` sticker once unlocked.
- **Hearts**: 14 px, filled `--blood` up to hp, outline after. Above 7 maximum, show heart + numeral. Then the Final Health token chit.
- **Time**: Hourglass (`--time`) + Anton 24 numeral. Portrait also shows `/12` (`/max`) in Archivo 13 `--ink-2`.
- **Item tabs**: two hand slots of 64×28 each (hand icon + item name, Archivo Narrow 700 12, kraft fill; an empty slot is dashed `--bone-2`) and a backpack tab 40×28 (backpack icon + count).
- **Saved**: `SAVED` + one 10 px circle per `fg.slots` entry (gold with an ink tick when filled).
- **Status stickers**, at most 2 plus `+N`:

| Condition | Sticker |
|---|---|
| leg trap | `LEG TRAP` (red) |
| cobra | `COBRA` (red) |
| partials (next or phase) | `3–4 = ★` (yellow) |
| skip next action | `STUNNED` (black) |
| bonus dice | `+N DIE` (yellow) |
| minus dice this phase | `−N DICE` (black) |
| Time at next action | `⧗→N` (paper) |

**Horror dial** (`strips/HorrorDial.tsx`):

```tsx
const seg = (i: number, r = 21) => {
  const a = (d: number) => ((d - 90) * Math.PI) / 180, p = (d: number) => `${28 + r * Math.cos(a(d))} ${28 + r * Math.sin(a(d))}`;
  return `M ${p(i * 45 - 19)} A ${r} ${r} 0 0 1 ${p(i * 45 + 19)}`;
};
// <svg viewBox="0 0 56 56">: for i in 0..7, draw seg(i) twice:
//   ink stroke 13, then colour stroke 9 (butt caps).
//   Colour: i==0 → --exit, i==7 → --blood, i==fg.horror → --killer, else --bone-2.
// The current segment also gets a 12 px red meeple centred on the arc midpoint.
// Centre: an 22 px --killer rounded square (ink border) holding an Anton 15 bone numeral.
// The numeral is diceCount(g, { kind: 'effect', label: 'preview', id: 'preview' }, false).n.
// diceCount and every diceMods entry are side-effect free when consume === false (verified).
```

### 2.7 The Location board (`board/*`)

**Measuring.** `usePxPerUnit(svgRef, view)` uses a ResizeObserver to get `ppu = min(w / view.w, h / view.h)`, multiplied by the zoom factor. Every size below is in **screen px** and converted to SVG units with `/ ppu`. Strokes use `vector-effect: non-scaling-stroke`.

**Layer 1, StaticLayer** (`React.memo`, keyed on location id + ppu + zoom + blocked/tokens/tunnel/lock signature + dream/finale flags). Drawn in this order:

1. **Ground**: `<rect>` fill `--ground` (or `--ground-finale` with `data-finale`) covering the whole interior, so there is never a letterbox band.
2. **Decor** (`board/decor.ts`, deterministic, seeded by a hash of the location id).
   - Placement: 60 candidate points; keep those at least 10 units from every zone centre and at least 5 units from every edge segment; keep at most 18.
   - Glyph per location:

     | Location | Glyph |
     |---|---|
     | Happy Trails | pine: 2 stacked triangles, `--decor` fill, ink 1.2 px |
     | Creech | none; instead horizontal plank lines every 6 units in `--decor`, 1 px |
     | Carnival | pennant string: 3 triangles alternating red/mustard |
     | Maple | hedge: circle r 2.2 units |
     | Groves | grove tree: circle r 2.6 units, `--decor`, plus standing stones (rect 1.4×3, `--house`) |
     | Birds | none |

   - Each `water` zone gets a blob: `<circle r=8u fill=--water>` with three 1.5 px bone wave strokes.
   - Each `house` zone (and every Creech zone) gets a block: `<rect 10×9u rx=1u fill=--house stroke=ink 1.5px>`.
   - Carnival `landmark` zones get a tent: `<circle r=9u>` filled with an SVG `<pattern>` of 2-unit stripes `#C8272D` / `#F4E9D0`.
   - Groves `sacred` zones get a 3 px `--house` outer ring.
3. **Trails** (deduped edges):
   - an ink stroke 9 px, then a `--trail` stroke 5.5 px;
   - Maple edges between two `street` zones use `--street` at 8 px over ink at 12 px;
   - blocked edges and the Creech lock: trail dashed `6 4` plus a red X tape at the midpoint (two 10 px rects rotated ±45°, `--blood`, ink border);
   - one-way edges: an ink chevron (8 px) at the midpoint pointing along the allowed direction;
   - Secret Tunnel: a dashed ink quadratic arc (control point offset 18% of the length) with a `TUNNEL` chit at the apex.
4. **Spaces**:
   - radius `rv = max(R(z) * ppu, 15)` px, landmark `max(…, 18)`;
   - an ink copy offset (0, 2 px), then a bone disc with a 2.5 px ink ring;
   - exits: a 16×20 `--exit` door plate (ink border, bone door icon) at the upper-left at 45°;
   - search: a 16 px `--wrench` badge (wrench icon) at the upper-right, plus an item-deck chit 14×18 at the right whose thickness is `deckStack(count)` and which holds the count (Archivo Narrow 700 11). A face-up top card adds a kraft tab with its name (Archivo Narrow 700 11, max 70 px, ellipsis) under the chit;
   - window spaces (Creech): a 12 px window glyph badge at the lower-right.
5. **Labels** (`board/labels.ts`):
   - an ink plate (radius 3, padding 2×4 px) with bone Archivo Narrow 700 11 px UPPER text, max 72 px wide, wrapping to 2 lines;
   - placement solver: process zones by y then x; try positions S, N, E, W, SE, SW at 4 px from the disc; accept the first box that intersects no disc and no placed label; if none fits, keep S;
   - an optional override table `LABEL_SIDE[locId][zoneId]` is applied before the solver.
6. **Panic tiles** (§2.8).
7. **Tokens** (`TOKEN_GLYPH` stays as data): 30×18 chits (kraft fill, ink 1.5 px, radius 3, label Archivo Narrow 700 11 UPPER, at most 4 letters).
   - Tokens with `to` sit at the midpoint of their edge.
   - Others sit at the upper-right of their zone, stacking 20 px down.

**Layer 2, TokenLayer.** Meeples, minions, birds, death splats and the lit-space rings.
- Every token is a `<g data-tok=id style={{ transform: \`translate(${x}px, ${y}px)\` }}>`. CSS px equals SVG user units.
- Motion uses WAAPI on that `<g>` (§6).
- Arrangement relative to the disc centre (screen px):
  - Final Girl at (−9, −16);
  - Killer at (+11, −18);
  - victims in a row at (0, +6), spaced 10 px, at most 3 drawn plus a "×N" chit;
  - minions at (−rv − 6, 0) going left;
  - birds at (+rv + 6, 0) going right.

**Layer 3, HitLayer.**
- One transparent `<circle>` per visible zone with `r = clamp(rv + 6, 22, nearestNeighbourDistPx / 2)` px, `pointer-events: all`.
- Selection uses one `onClick` on the `<svg>`:
  1. Convert the event to board units with `svg.getScreenCTM().inverse()`.
  2. If the prompt has targets (move `to[]`, or choice options with `zone`), pick the **nearest target within 40 px**.
  3. Otherwise pick the zone whose hit circle contains the point and open its Zone sheet.
- A long-press (380 ms, under 8 px of movement) on any zone opens its Zone sheet, even while a prompt is active.

**Lit spaces** (move or choice targets):
- A flat `rect` (ink at opacity .35) over the static layer, then each target redrawn above it: bone disc, a 3 px `--victim` dashed ring (dash `5 4`) at `rv + 6` px, and a bone footprint chit.
- The ring bounces with `transform: scale(1)` → `scale(1.08)` (1.2 s alternate) using `transform-box: fill-box; transform-origin: center`.
- Pressing a `.opt` row in the tray (`pointerdown`) gives that space's ring a 4 px ink ring for as long as the press lasts.

**Zoom.** The `[⤢]` chit toggles zoom 1.7× centred on the Final Girl, clamped to the board, by transforming a wrapper `<g>` with a 300 ms CSS transition.
- While zoomed, a one-finger drag pans: the svg gets `touch-action: none` and the pan is clamped.
- Unzoomed, the svg has `touch-action: manipulation`.
- Labels and tiles re-solve at the zoomed ppu, so they stay 11 px.
- There is no "Bigger map" overlay any more.

**Board frame** (`.board`, bone stock, 4 px padding):
- **Portrait**: a 44 px header band inside the frame:
  `[≡ menu] [VT323 "T01 ▶ ACTION"] … [in-play sleeves] … [1–6] [⤢] [LOG]`, with chits 40 px (48 px hit).
- **Landscape**: a 48 px **tool edge** column on the left inside the frame, top to bottom: `[≡] [LOG] [⤢] [1–6]`, then up to 2 in-play sleeves plus "+N", then at the bottom a VT323 tape counter `T01` over `ACT` (abbreviations ACT, PLAN, KILL, PANIC, UPKP).
- **In-play sleeves** (active Events and active Terror): 24×32 card backs rotated −3° (`--event` or black stock with a blood slash). Tapping one opens a non-blocking reveal of that card.

### 2.8 Panic tiles

**Visibility.** A direction's tile is drawn only when one of these holds:
1. its source space currently shows at least one victim (display state);
2. the source is the space whose Zone sheet is open, or the zone being long-pressed;
3. the `[1–6]` toggle is on (`prefs.panicAll`, shown pressed);
4. a panic `victimMove` is playing on that edge. That tile fills `--victim` and scales 1.15 for the move.

**Tile.**
- 22 px or wider (fits text) × 16 px, bone fill, 1.5 px ink border, radius 3.
- Text: `faces()` output ("1-4", "5,6"), Archivo Narrow 700 11 ink.
- A 6 px ink chevron sits 13 px further along the edge, pointing at the destination.

**Placement:**

```ts
const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, rx = -uy, ry = ux; // right of travel (y down)
const d = (rvSrc + 14 + push) / ppu, off = 7 / ppu;
tile = { x: a.x + ux * d + rx * off, y: a.y + uy * d + ry * off };   // push = 0, or 22 if it hits the source label box
```

Each direction sits near its own source, so the two tiles of an edge never overlap.

---

## 3. Layout

### 3.1 Shell (`base.css`)

```css
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; height: 100%; overflow: hidden; overscroll-behavior: none; background: #4A3324; }
body { margin: 0; position: fixed; inset: 0; overflow: hidden; overscroll-behavior: none; font: 500 16px/1.35 var(--f-ui); color: var(--chalk); font-synthesis: none; -webkit-tap-highlight-color: transparent; }
#root, .app { position: fixed; inset: 0; }
*, *::before, *::after { box-sizing: border-box; touch-action: manipulation; }
.app, .app * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
.selectable { -webkit-user-select: text; user-select: text; }
img, svg { -webkit-user-drag: none; }
:focus:not(:focus-visible) { outline: none; }
:focus-visible { outline: 3px solid var(--victim); outline-offset: 2px; }
.num { font-variant-numeric: tabular-nums; }
.scroll-y { overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; }
.scroll-x { overflow-x: auto; overscroll-behavior-x: contain; touch-action: pan-x; scrollbar-width: none; }
.scroll-x::-webkit-scrollbar { display: none; }
:root {
  --sa-t: var(--mnbg-safe-top, env(safe-area-inset-top, 0px));
  --sa-r: var(--mnbg-safe-right, env(safe-area-inset-right, 0px));
  --sa-b: var(--mnbg-safe-bottom, env(safe-area-inset-bottom, 0px));
  --sa-l: var(--mnbg-safe-left, env(safe-area-inset-left, 0px));
  --gut: 12px;
  --pad-t: max(var(--sa-t), 8px); --pad-b: max(var(--sa-b), 8px);
  --pad-l: max(var(--sa-l), var(--gut)); --pad-r: max(var(--sa-r), var(--gut));
}
html[data-text=large] { --tray-h4: 18px; --body: 17px; }
```

**Positioning rule for the e2e hooks.** `.overlay`, `.end-screen`, sheets and toasts are `position: absolute` children of `.app`, never `position: fixed`. The e2e `visible()` helper uses `offsetParent`, which is null for fixed elements.

### 3.2 Game grid (`table.css`)

```css
.game { position: absolute; inset: 0; display: grid; gap: 6px;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: 60px minmax(0, 1fr) 68px 252px;
  grid-template-areas: "killer" "board" "girl" "tray";
  padding: calc(var(--pad-t) + 4px) var(--pad-r) var(--pad-b) var(--pad-l); }
.panel.killer { grid-area: killer; } .board { grid-area: board; } .panel.girl { grid-area: girl; }
.dock { display: contents; }                       /* e2e hook element; its children are grid items */
.dock > .tray { grid-area: tray; display: grid; grid-template-rows: 26px 1fr 52px; gap: 8px; }
.dock > .stage { grid-area: board; position: relative; z-index: 5; pointer-events: none; }
.dock > .stage > * { pointer-events: auto; }

@media (orientation: portrait) and (max-height: 700px) { .game { grid-template-rows: 60px minmax(0,1fr) 68px 224px; } } /* SE: cards 92×128 */
@media (orientation: portrait) and (min-height: 900px) { .game { grid-template-rows: 64px minmax(0,1fr) 72px 270px; } } /* Pro Max: cards 124×173 */

@media (orientation: landscape) and (max-height: 500px) {
  .game { grid-template-columns: minmax(0, 1fr) clamp(280px, 36vw, 340px);
    grid-template-rows: 64px 64px minmax(0, 1fr);
    grid-template-areas: "board killer" "board girl" "board tray";
    column-gap: 8px; row-gap: 6px;
    padding: 6px var(--pad-r) var(--pad-b) var(--pad-l); }
  .dock > .tray { grid-template-rows: 22px 1fr 48px; gap: 6px; }
  .game[data-hand=left] { grid-template-columns: clamp(280px, 36vw, 340px) minmax(0, 1fr);
    grid-template-areas: "killer board" "girl board" "tray board"; }
}
@media (min-width: 900px) and (min-height: 600px) {
  .game { grid-template-columns: minmax(0, 1fr) 380px; grid-template-rows: 72px 76px minmax(0, 1fr);
    grid-template-areas: "board killer" "board girl" "board tray"; }
}
```

- `useTable()` (the `useSyncExternalStore` matchMedia hook from the iOS research) is used **only** for sheet side, lifted-card size and hand card size. It never decides which components mount.
- The tray and stage are always the same size, so **the board never moves or resizes during play.**

### 3.3 Exact geometry

**Portrait, iPhone 12–14 (390×844, insets T47 B34):**

| Region | Rect | Notes |
|---|---|---|
| Status band | y 0–47 | walnut; white status text stays readable |
| Killer strip | 366×60 | y 51–111 |
| Board | 366×361 | y 117–478. Interior 358×353; header 44; map area 358×309; HT map drawn 342×309 |
| Girl strip | 366×68 | y 484–552 |
| Tray | 366×252 | y 558–810. h4 26 (558–584), hand 156 (592–748), keys 52 (756–808) |
| Home band | y 810–844 | wood only; no controls |

**Landscape (844×390, insets L47 R47 B21):**

| Region | Rect | Notes |
|---|---|---|
| Board | 438×363 at (47, 6) | Interior 430×355; tool edge 48; map area 382×355; HT map drawn 382×345 |
| Rail | 304 wide at x 493 | |
| Killer strip | 304×64 | y 6–70 |
| Girl strip | 304×64 | y 76–140 |
| Tray | 304×223 | y 146–369. h4 22, hand 124 (cards 88×124), keys 48 (y 312–360) |
| Home band | y 369–390 | wood only |

**Hand fan**
- Cards overlap left to right; the step is `min(cw + 6, (W − cw) / (n − 1))`.
- Portrait (W = 366, cw = 112): 6 cards → step 50.8; 10 cards → step 28.2 (spine 26).
- Landscape (W = 288, cw = 88): 10 cards → step 22.2 (spine 22).
- **The hand never scrolls.** Cards sit in a 3° total arc: `rotate((i − (n−1)/2) * 0.6deg)` with `translateY` of `|i − mid| * 1.5px`.

---

## 4. Wireframes, every screen and state

Notation:
- `[TEXT]` is a key; `(x)` is a chit.
- `♥` heart, `⧗` hourglass, `▤` deck, `■` filled box and `□` empty box. These glyphs are wireframe notation only; the build draws all of them as SVG icons.
- Regions the state does not change are written "unchanged".

### 4.1 Title: the video store (`store/VideoStore.tsx`)

**Portrait 390×844**

```
y0   walnut status band (47)
y59  FINAL PLAYER            ← .logo, Anton 48 chalk, 3px blood offset; DOM text exactly "Final Player"
y95    [FAN-MADE] sticker (paper, -6°)                         (?) chit = How to play, right
y119 ┌ VCR SLOT (black stock) 366×56 ───────────────────┐     only when a save exists
     │ ▶ CONTINUE   T04 · LAURIE vs HANS   (VT323 22)   │     tap = continue
y175 └───────────────────────────────────────────────────┘
y187  HORROR  ← shelf label: bone sticker, Anton 16, -2°
y211 ┌ spine 366×64  .film-card ─────────────────────────┐
     │▌[emblem 40] HAPPY TRAILS HORROR    #01  [RENTED]  │  spine colour + 6px stripe; title Anton 22 UPPER
     └────────────────────────────────────────────────────┘
      … 5 more spines, 6px gaps (spines y211–625)
y625 ═══ shelf plank: 10px --bone-edge, 2px ink top/bottom ═══
y647 [BEST PLAYED SIDEWAYS ↻] sticker (yellow, dismissible ✕; portrait only; prefs.seenSideways)
y691 [MIX & MATCH]                    [HOW TO PLAY]       48px keys, two columns
y751 Fan-made, unofficial. Final Girl © Van Ryder Games.   Archivo 12 chalk-2   [Back to the library] (library frame only)
y810 home band
```

- The title root is `.scroll-y` (allowed on short screens such as the SE).
- `RENTED` marks the last film played (`prefs.last`). `NEW` marks films never played (`prefs.played[]`).
- Tapping a spine slides it 24 px right (200 ms) and opens the **box back** as a bottom sheet at 88% height.

**Box back (portrait bottom sheet, bone stock)**

```
[grabber]
▌▌▌ spine-colour band 12px with stripe
HAPPY TRAILS HORROR                         Anton 30
"Summer camp. Lake. A man with a cleaver." Courier 15 (film.tagline)
HANS · THE BUTCHER   vs   CAMP HAPPY TRAILS · 18 SPACES   Archivo 14 ink-2
STARRING                                    Anton 16
[meeple LAURIE ♥5 ][meeple REIKO ♥5 ]       .pick chips 2-col, 56px, selected = 3px ink + girl fill + bone text
RATING
[ NORMAL  (R sticker) ][ EXTREME HORROR (UNRATED sticker) ]   segmented, 48px
[☐ Epic Dark Power ]  [☐ Signature items ]                    toggles, 48px, checkbox drawn as bone square + ink tick
[            ▶ START THE NIGHT            ]   .btn.primary 56px full width; DOM text "Start the night"
```

**Landscape (750×363 content)**

```
┌ LEFT 400 ─────────────────────────────────────┐┌ RIGHT: BOX BACK 342 (bone stock, always shown) ┐
│ FINAL PLAYER (Anton 40) [FAN-MADE]   (?)       ││ HAPPY TRAILS HORROR (Anton 26)                 │
│ [▶ CONTINUE T04 · LAURIE vs HANS] 44 (if save) ││ tagline Courier 14, 2 lines                    │
│ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐  spines 56×220, 8 gap ││ HANS vs CAMP HAPPY TRAILS · 18 SPACES          │
│ │H ││C ││C ││F ││S ││T │  vertical Anton 20    ││ STARRING  [chip][chip]… .scroll-x              │
│ │A ││R ││A ││R ││L ││E │  selected lifts 16px  ││ [NORMAL][EXTREME]  [☐ EPIC][☐ SIGNATURE]       │
│ └──┘└──┘└──┘└──┘└──┘└──┘                       ││ [MIX & MATCH]        [▶ START THE NIGHT]       │
│ ═══ shelf plank ═══        [HOW TO PLAY]       ││                                                │
└────────────────────────────────────────────────┘└────────────────────────────────────────────────┘
```

**Mix & match sheet** (bone; bottom sheet in portrait, right side sheet in landscape):
- `KILLER`: 6 chips, emblem + name + "♥12" or "Can't be killed".
- `LOCATION`: 5 chips, emblem + name + "18 spaces".
- `FINAL GIRL`: 12 chips, a purple meeple + name + "♥5"; long-press shows the blurb.
- Footer: `[Use this bill]` (primary). It sets the config and closes the sheet; the box back shows "CUSTOM BILL".

**Install coach.** Shown on iOS when not standalone and `!prefs.seenInstall`: a paper card under the logo reading "Add to Home Screen: tap Share, then Add to Home Screen", with a drawn share glyph and a dismiss `(✕)` chit.

### 4.2 Opening, "insert tape" (`overlays/Opening.tsx`, `.overlay`)

| Time | What happens |
|---|---|
| 0–350 ms | A black VCR slot bar (366×64 portrait, 400×64 landscape) slides in centred. VT323 `▶ PLAY` blinks twice (steps, not fades). Sound: tape whir. |
| 350–900 ms | The overlay drops away. The Killer strip slides from `translateY(-110%)`; the Girl strip and tray slide from `translateY(110%)` (300 ms, `cubic-bezier(.2,.9,.3,1.2)`). The board goes `scale(.92)` → `1.02` → `1` in 3 steps and lands with a "thunk" sound and a 2 px shake. |

Tap skips it. With reduced motion it is a 150 ms crossfade. It plays only on a new game, not on Continue.

### 4.3 Action phase, `main` prompt

**Portrait**

```
┌ KILLER STRIP 366×60 (black) ──────────────────────────────────┐
│[emb] HANS            ♥ 12 (+1)              [DP] ┌▤┐          │  row 1
│ 44   ■■■□□◆□□□□□     knife 2  boot 1            │10│          │  row 2: ladder + atk/mov; deck spans rows
└──────────────────────[ESCAPE WITH CAROLYN]─────────└──┘─────────┘  film sticker on bottom edge (Creech only)
┌ BOARD 366×361 (bone frame) ───────────────────────────────────┐
│(≡) T01 ▶ ACTION         [ev][tr]            (1-6)(⤢)(LOG)     │  header 44
│┌ map: ground fills 358×309 ─────────────────────────────────┐│
││  pines   (o)N.TRAIL ══ (o)CAMP ENTR.[door]                  ││  discs ≥30px, ink name plates
││  (o)CABINS[wrench][▤4]   meeples on discs                   ││  panic tiles only on victim spaces
│└─────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
┌ GIRL STRIP 366×68 (bone) ─────────────────────────────────────┐
│(dial  ) LAURIE   ♥♥♥♥♥ (+1)                     ⧗ 6 /12        │
│(  2   ) [hand Knife][hand —][pack 1]  SAVED ○○○○○○  [3–4=★]   │
└───────────────────────────────────────────────────────────────┘
 Your move                                          hand 6/10   ← h4 (Archivo 600 16) + right meta (Archivo 14 chalk-2)
 ┌─┬───┐┌─┬───┐┌─┬───┐┌─┬───┐┌─┬───┐┌─┬──────────┐
 │ │WAL││ │WAL││ │FOC││ │FOC││ │WEA││ │SHORT REST│   fan 112×156, step 50
 └─┴───┘└─┴───┘└─┴───┘└─┴───┘└─┴───┘└─┴──────────┘
 [⧗+] [ITEMS 2] [SAVE]                     [END TURN ▶]   keys 52; End turn = .btn (bone), primary slot
```

**Landscape**

```
┌ BOARD 438×363 ────────────────────────────┐ ┌ KILLER 304×64 ───────────────────────┐
│(≡) │                                       │ │HANS ♥12(+1)  ■■■□◆□□□□□  [DP] ┌▤┐    │
│(LOG)│      map 382×345                    │ │              knife2 boot1     │10│   │
│(⤢) │      (height-limited, centred)       │ └──────────────────────────────────────┘
│(1-6)│                                     │ ┌ GIRL 304×64 ─────────────────────────┐
│[ev] │                                     │ │(dial) LAURIE ♥♥♥♥♥(+1)   ⧗6          │
│[tr] │                                     │ │(  2 ) [Knife][ — ][pack1] SAVED ○○○○ │
│     │                                     │ └──────────────────────────────────────┘
│T01  │                                     │  Your move                    hand 6/10
│ACT  │                                     │  ┌┬──┐┌┬──┐┌┬──┐┌┬──┐┌┬──┐┌┬─────┐ 88×124
└─────┴─────────────────────────────────────┘  [⧗+] [ITEMS]          [END TURN ▶]  48
```

**Keys (main):**
- `[⧗+]`: 52×52 key, aria-label "Discard for Time".
- `[Items N]`: only when `p.items.length`.
- `[Save victims]`: `.btn.good`, only when `p.canRescue`.
- `[<ultimate label>]`: `.btn` with a purple fill, only when `p.ultimate`.
- `[End turn]`: rightmost.
- Strike mode:
  - h4 is `Strike!`;
  - a Courier paper slip at the stage bottom explains it;
  - the rightmost key is `[Don't strike]`;
  - `[⧗+]` is hidden;
  - only attack cards are not `.off`.

### 4.4 Card lifted, weapon pick, Discard for Time

**Lifted (portrait).** The stage shows a scrim over the board.

```
┌ STAGE = board area 366×361 ─────────────────────────────┐
│ ┌ WALK (lifted 220×307) ──────┐  ┌ side column 130 ────┐ │
│ │sp│ WALK          Anton 24   │  │ ROLLS               │ │
│ │  │ ACTION tag               │  │ [die][die] 2 DICE   │ │  diceCount(g,{kind:'action',card},false)
│ │  │ ★★  boot2 ⧗−1            │  │ notes: +1 Planning  │ │  Archivo 13 on bone slip
│ │  │ ★   boot1 ⧗−1            │  │                     │ │
│ │  │ ✕   boot1 ♥−1 ⧗−2        │  │ WEAPON (attack only)│ │
│ │  │     OR ⧗−2               │  │ [Bare hands  ]      │ │  item tabs 44px, kraft, selected = ink 3px + lift
│ │ⓞ│                          │  │ [Machete +1  ]      │ │
│ └──┴──────────────────────────┘  └─────────────────────┘ │
└──────────────────────────────────────────────────────────┘
 tray: h4 "Walk"   hand: the Walk card .sel (−24px)
 keys: [DISCARD +1⧗]                   [PLAY WALK ▶ / rolls 2 dice]   ← .btn.primary, DOM "Play Walk"
```

- **Landscape**: the card is 200×280 at stage (12, 41) and the side column is 200 wide at x 224. The tray is the same as portrait.
- **Unplayable card**: the face carries a diagonal `--bone-2` band with an ink border and Permanent Marker 16 `NOT NOW`. The reason in Archivo 13 is shown in the side column:

  | Situation | Reason text |
  |---|---|
  | `timing === 'reaction'` | "Played when you're attacked." |
  | `timing === 'afterRoll'` | "Played after a horror roll." |
  | `isAttackCard` with no target | "Nothing to attack here." |
  | search card, not `canSearchHere` | "Needs a search space." |
  | otherwise | "Can't play it right now." |

  Keys: `[Discard +1⧗]` and `[Put down]`.
- **Weapon**: preselect the weapon with the highest `damage`. The `needsWeapon` case hides Bare hands. The primary reads `Play Weapon attack` with the sub-line "with Machete". The DOM text must start with "Play ".
- **Put the card down** by tapping the scrim or the selected hand card again. Tapping the big card plays it, the same as the primary.
- **Discard for Time mode** (`[⧗+]` with nothing lifted):
  - h4: `Discard for Time: tap cards`;
  - each tapped card gets `.marked` (lifted 12 px with a blood SVG X);
  - keys: `[Cancel]` and `[Discard 2 → +2⧗]` (`.btn.primary`, disabled at 0);
  - each card gives +1, or +2 with Sheila's Ultimate (`timeEach`);
  - it sends **one** `discardForTime {cards}`.

### 4.5 Items, Ultimate, Save

- `[Items N]` opens an **item mat** in the stage: kraft item cards (140×196 portrait, 120×168 landscape) in a row, each with its actions as `.opt` buttons under it (44 px, Archivo 600 15).
- Tapping an action sends `item {uid, action}`. Tapping the scrim closes the mat.
- `[Save victims]` sends `rescue`; see §4.10.

### 4.6 Roll (`roll` prompt)

**Portrait stage** (scrim over the board, mat objects on top):

```
┌ STAGE 366×361 ──────────────────────────────────────────┐
│ ┌ played card 150×210 ┐ ┌ TRAY black stock 200×210 ────┐ │
│ │sp│ WALK             │ │  [★]   [⧉~]   [ ]            │ │ dice 52, gap 10 (≥4 dice: .sm 40, 2 rows)
│ │  │ ★★ boot2 ⧗−1 ◀hit│ │                              │ │
│ │  │ ★  boot1 ⧗−1     │ │   2 ★  Anton 36 + "SUCCESSES" │ │
│ │  │ ✕  …             │ │   Tap a wobbling die to       │ │ Archivo 13 on-black-2 (only when convertible)
│ └──┴──────────────────┘ │   discard 2 cards → ★         │ │
│                          └──────────────────────────────┘ │
│ [CLOSE CALL · uses card] [LUCKY DIE] [SISTER · −2⧗]       │ .btn.small row at stage bottom, only those allowed
└────────────────────────────────────────────────────────────┘
 tray: h4 "Horror roll — Walk"   hand: dimmed (.off look via .tray[data-mode=roll]) unless converting
 keys:                                   [ACCEPT / boot2 ⧗−1]   ← .btn.primary, sub-line = effect line of matching row
```

- **Landscape**: the card is 160×224 at (12, 20) and the tray 240×224 at (186, 20). The modifier row sits at y 262–306.
- **Roll title**: action or reaction → card name; item → item name; effect → `purpose.label`.
- **Non-card rolls** have no card mat. The tray is centred and the effect is shown as a bone slip ("Panic roll", etc.).
- **Accept** sends `confirm`. If the matching row has alternatives, the sub-line shows "choose next". The engine then asks a `choice`.

### 4.7 Move

**Stage.** No scrim beyond the map dim. Legal spaces are lit (§2.7). The Final Girl's space shows its meeples. Along the tray's top edge, a VT323 counter reads `MOVES LEFT 2`.

**Tray:**

```
 h4: "Walk · 2 moves left"            (p.title + remaining)
 BRING ALONG                 2/2      Archivo 13 ink-2 label + counter
 [meeple Victim✓][meeple Boyfriend✓][meeple Victim]   .btn.small 56×60, meeple 24 + name 11; .good when on
 GO TO  [Go to Dock][Go to Cabins][Go to Lake] →   .opt chips 44px .scroll-x (each pulses its space on press)
 keys: [STAY HERE]  (only canStop)                 "Tap a lit space" hint (Archivo 14 chalk-2) fills the rest
```

- Bring defaults to the **first `followLimit` followers, special roles first, then ordinary victims** (fixes the leave-behind bug).
- A tap on a lit space, or a `.opt`, sends `moveTo {zone, bring}`.
- With no followers, the bring row reads "Nobody here to bring."
- Mode titles come from `p.title`. Boat and panic modes hide `[Stay here]`.

### 4.8 Choice

**Stage**
- Options with `zone` are lit (§2.7).
- If `p.detail` is set, a paper slip is pinned at the stage bottom (portrait 350 wide; landscape 400 wide): Courier 15 ink, at most 4 lines, then "…" with a tap to expand into a sheet.

**Tray:** the h4 is `p.title`; the hand area and keys row merge into one 216 px (portrait) / 178 px (landscape) option area.

| Options | Layout |
|---|---|
| 2 | Two big `.opt` side by side, 72 px tall, Archivo 700 17 |
| 3–6 | 2-column grid of `.opt`, 48 px, label 15 px plus detail 13 px on a second line (2-line clamp) |
| 7 or more | One column, `.scroll-y`, 56 px rows with label and detail. If options have zones, the area's first line reads "Tap a lit space or pick below" |

Tapping a `.opt` or its lit space sends `choose {id}`. Long-pressing a `.opt` opens the full detail in a sheet.

### 4.9 React (you are attacked)

**Stage, portrait:**

```
┌ black-stock band 366×56 at stage top ────────────────────┐
│ HANS ATTACKS          [2 DAMAGE] red sticker              │ Anton 26 bone, blood offset
└───────────────────────────────────────────────────────────┘
        ┌ bone chit 120×64 ┐
        │ ♥ 5 → 3          │  Anton 32; "→ 0" shows [FINAL HEALTH TOKEN!] red sticker below
        └──────────────────┘
 (map visible below the band; killer meeple plays its lunge: translate 30% toward FG and back, 300ms)
```

**Tray:**
- h4: `Hans attacks — 2 damage`.
- Hand: reaction cards normal, the first one preselected (`.sel`); all others `.off`.
- Keys: item reactions as `.btn` `[Use <item>]` (sends `reactItem`), then `[Take the hit]` (`.btn`, sub "5 → 3"), then the primary `[Play Guard]` (sends `react {card}`).
- With no reaction card and no item, `[Take the hit]` becomes the `.btn.primary`.
- The Girl strip hearts that would break get a dashed blood outline while this prompt is up.

**Landscape:** the same band at 438 wide; the chit is centred in the board.

### 4.10 Rescue

**Stage.** The rescue card, bone stock 350×236 portrait / 400×236 landscape, centred:

```
┌ purple header band: LAURIE — RESCUE CARD (Anton 18 bone) ─┐
│ [slot][slot][SAVED][slot][slot][slot]   .slot 50×64 each   │  empty: dashed bone-2 + slot number; full: meeple + gold SAVED sticker
│ ▲ next free slot ringed in --victim                         │
│ Slot 4: Heal 1 and take an action card (Archivo 15, 3 lines)│  reward of the ringed or selected slot
└─────────────────────────────────────────────────────────────┘
```

- **Ultimate** (`p.ultimate`): the card flips (rotateY 300 ms) to a purple face with `ULTIMATE`, `fgDef.ultimate.text` and "Each save: " + `fgDef.extraText`. It has no slots; the victim toggles alone drive it.
- **Tray**:
  - h4: `Save victims · 3 here`;
  - hand area: victim toggles (`.btn.small`, single select, the first preselected `.good`), meeple + name via `victimName`;
  - keys: `[Done]` (`.btn`, sends `rescueDone`).
- **Flow**: with a victim selected, tapping a free `.slot` sends `rescueOne {victim, slot}`. The meeple hops into the slot (300 ms) and the SAVED sticker slaps on. In Ultimate mode, tapping a victim toggle sends `rescueOne {victim, slot: 0}` directly.
- **Events** that change rescues (for example Clingy Campers) appear as a yellow sticker on the card corner with the event name; tapping it reveals the card.

### 4.11 Search

**Stage.** The drawn items as kraft cards:
- portrait: 2 cards at 150×210 side by side, 3 cards at 112×157;
- landscape: 160×224, or 120×168 for 3.

The first card is preselected: lifted 16 px, with a `KEEP` stamp (Permanent Marker 22, blood, −8°). Tapping another card moves the selection.

**Tray:**
- h4: `Search: keep 1 of 2`.
- Hand area: a kraft slip with the selected item's full text and its stats chits.
- Keys: `[Rest to the bottom]` (sub "face down") and `[Rest on top]` (sub "face up"), both `.btn`. Each sends `searchPick {keep, otherTo}`.

### 4.12 Arrange

**Stage.** Bone mat 350×300 portrait / 410×330 landscape:

```
 HANDS                                  BACKPACK
 ┌ hand outline 160×90 ┐┌ hand outline ┐ ┌ kraft pocket 340×110 ─────────────┐
 │ [Machete ✋]          ││ [—]          │ │ [Flare gun ✋][Rope ✋✋]           │
 └──────────────────────┘└──────────────┘ └────────────────────────────────────┘
 item tabs 104×44 kraft, name Archivo Narrow 700 13, hand pips (1 or 2 hand icons), uses ×N
```

- Tapping a tab moves it between the hands and the backpack. A 2-hand item takes both slots.
- An item that won't fit shakes (300 ms) and shows a `NEEDS 2 HANDS` or `HANDS FULL` sticker.
- A `noBackpack` item in the backpack carries a red `WILL BE DISCARDED` sticker.
- **Tray**:
  - h4: `Arrange your items` (optional) or `Hands full — rearrange` (forced);
  - hand area: the tapped item's text;
  - keys: `[Done]` (`.btn.primary`, sends `arrange {inHands}`). Its sub-line reads "1 item will be discarded" when that applies.

### 4.13 Discard down

- Stage: nothing (the board is visible).
- Tray:
  - h4: `Too many cards — discard 2` (exact format: "Too many cards — discard {excess}");
  - hand in multi-select: `.sel` plus `.marked` with an X;
  - keys: `[Discard 0/2]` (`.btn.primary`, enabled only when exactly `excess` cards are marked; sends `discardDown {cards}`).

### 4.14 Planning

**Stage**: the Tableau mat (bone stock, covering the board area).

```
PORTRAIT 366×361                               LANDSCAPE 438×363
┌ ACTION TABLEAU   Anton 18 ───────────────┐   ┌ list 236 ───────────────┬ detail 190 ─────┐
│ ┌ list 196 (.scroll-y) ┐┌ detail 160 ────┐│   │ ⧗1                      │ GUARD 160×224   │
│ │ ⧗1 ─────────────────  ││ GUARD 150×210  ││   │ [▌Close Call   ×2  (1)] │ full card       │
│ │ [▌Close Call  ×2 (1)] ││ full card      ││   │ ⧗2 …                    │ "2 left"        │
│ │ ⧗2 ─────────────────  ││                ││   │                         │                 │
│ │ [▌Guard       ×2 (2)]◀││ "2 left"       ││   │                         │                 │
│ │ [▌Search      ×1 (2)] ││                ││   │                         │                 │
│ │ ⧗4 … [▌Planning ×1 SHORT]                ││   └─────────────────────────┴─────────────────┘
└──────────────────────────────────────────┘
```

**Pile rows** (`.acard.pile`, so the e2e `.acard` hook works):
- 44 px tall bone stock, timing-colour spine 8 px, name Archivo Narrow 700 14 UPPER, `×count`, and a cost disc showing the **actual `cost(g, c)`**;
- stack thickness is `deckStack(count * 2)`;
- grouped by actual cost under ink rules `⧗1`, `⧗2` and so on (Anton 14);
- rows that can't be bought are `.off`, dashed, with a sticker: `SHORT 1⧗` (too costly), `HAND FULL` (10 cards), or `OUT` (count 0, listed last);
- a selected row gets a 3 px ink border and slides 6 px right; the detail pane shows the full card.

**Tray:**
- h4: `Planning · 6⧗ to spend` with right meta `hand 7/10`.
- Hand fan for reference only (`.acard.ref`, `pointer-events: none`).
- Keys: `[Done planning]` (`.btn`, sends `endPlanning`) and, only when a buyable pile is selected, `[Buy Guard / −2⧗]` (`.btn.primary`, sends `buy {card}`).
- A buy plays a ka-ching and the card flies from the pile to the fan (FLIP, 300 ms).
- Log lines about zero-cost cards returning appear as a paper slip at the top of the mat for 2 s: "Your 0-cost cards came back."

### 4.15 Killer and Panic playback (the VCR bar, `dock/VcrBar.tsx`)

**Tray while busy** (same rectangle, so the layout never jumps):

```
 h4: ▶ KILLER   Hans is hunting · Terror 9 left        VT323 20 "▶ KILLER" + Archivo 15
 ┌ script slip (paper) fills the hand area ────────────┐
 │ INT. CABINS – NIGHT                                  │  Courier Prime 15; slugline = phase change
 │ Hans moves 2 toward the nearest victim.              │  last 6 lines, newest at bottom
 │ Hans attacks: a victim dies.                         │  newest line ink, older lines ink-2;
 │ Bloodlust rises to 4.                                │  tone 'bad'/'killer' lines bold
 └──────────────────────────────────────────────────────┘
 keys: [▶▶ Fast]  (toggle, pressed = .btn.dark)              [Skip ▸▸]   DOM texts "Fast", "Skip"
```

- **h4 per phase**: `▶ ACTION` (your effects playing), `▶ PLAN`, `▶ KILLER · {name} is hunting`, `▶ PANIC`, `▶ UPKEEP`. The Birds read "The birds are gathering".
- **Landscape**: the slip holds 4 lines (Courier 14).

### 4.16 Phase title cards (`overlays/TitleCard.tsx`, `.overlay`)

- A black band across the board area, `100%` × 120 px, vertically centred over the board.
- Anton 44 (landscape 40) bone with a 3 px blood offset, plus a Courier 15 sub-line.

| Phase | Title | Sub-line |
|---|---|---|
| action | `TURN 2` | "Your move." |
| planning | `PLANNING` | "Spend your Time." |
| killer | `HANS IS COMING` (Birds: `THE BIRDS ARE COMING`) | "Terror 9 left." |

- Panic gets no title card; instead a yellow `PANIC!` sticker slams top-centre (400 ms) when the phase contains a `victimMove`. Upkeep gets nothing.
- Duration: in 160 ms (slide from `translateX(-100%)`), hold 380, out 160, multiplied by the speed. A tap dismisses it.

### 4.17 Card reveal (`overlays/Reveal.tsx`, `.overlay`)

1. The scrim covers the whole `.app`.
2. **Terror cards only**: an 80 ms full black frame (the jump cut).
3. The card flies from its source (the Terror deck in the Killer strip, or the Event sleeve slot) to the centre of the board area: 260 ms, then a `rotateY` flip of 280 ms. It lands at `scale(1.15) rotate(-3deg)` and settles to `1, 0deg` (260 ms).
4. The deck count ticks down in VT323 at the moment the card leaves.
5. **Portrait**: 240×336 centred in the board area. **Landscape**: 200×280 centred in the board area; the strips stay visible beside it.
6. It waits for a tap. Under Fast it auto-continues after 900 ms.

**The Finale.** First a full-board black title card, `THE FINALE` (Anton 52), "The tape's almost over." (1200 ms × speed). Then the Finale card reveal. `.game[data-finale]` is set from then on.

### 4.18 Sheets (`sheets/Sheet.tsx`)

**Portrait bottom sheet**
- `max-height: calc(100% - var(--pad-t) - 24px)`, top radius 14 px.
- A grabber bar (36×5 ink-2) inside a 44 px handle zone; drag to dismiss.
- Flat scrim; `inert` on `.game` while open; the body is `.scroll-y`; padding-bottom `--pad-b`.

**Landscape side sheet**
- From the right, `width: min(420px, 55vw)`, full height, left radius 14 px, padding-right `--pad-r`.
- In left-handed mode it comes from the left.

**Dismissal and z-order**
- Close by dragging past 25% of the size, flicking faster than 0.5 px/ms, tapping the scrim, or the `(✕)` chit.
- Opening any sheet pauses playback.
- Sheets sit at z-index 50, above the end screen (35) and overlays (40).

**Killer sheet** (black stock):
1. Header: emblem, Anton 26 `HANS — THE BUTCHER`, HP + token.
2. **Bloodlust ladder**, vertical, one 36 px row per space from top (max) to bottom (1): box with marker, `knife N boot N`, effect text, ◆ `DARK POWER` tag, and a `HERE` sticker on the current row. The top row is followed by `k.maxText`. Groves extras come from `loc.bloodlustTrack[i-1].text`.
3. Killer Action as a mini card (`describeAction`). After the Finale, `fin.action`.
4. Dark Power: a back, or face plus text. Epic is marked with a gold `EPIC` sticker.
5. Finale: a back with "9 Terror cards left", or the face.
6. Minor Dark Powers with hit-point pips.
7. Minions: name, pool "3 ready · 2 out", each minion with hp.
8. Wrath tracks (Groves): a 10-box track per kind with the level text.
9. Boiler Room grid (Maple): the reused cell math, drawn as ink-ruled 44 px cells on rust.
10. `IN PLAY`: active events and active Terror as mini cards; tap to reveal.
11. `TERROR PLAYED`: collapsed list.
12. Killer rules and location rules: collapsible `details`, Archivo 15.

**Girl sheet** (bone): header (meeple, name, hearts, token); Horror track as a 160 px dial with the dice per space, killer start labels 1–6 and two explanation lines; Time track 0–max as 14 boxes with the hourglass marker; items as kraft cards with full text and hands/backpack state; rescue card (all slots with reward text, Ultimate text); hand as mini cards (`--cw` 92); Action tableau (piles, read-only).

**Zone sheet** (bone, auto height up to 60%):
- name in Anton 24, tags as stickers (EXIT green, SEARCH orange, SACRED, WINDOW, WATER, HOUSE, STREET, OUTSIDE);
- who is here: meeples plus names (Final Girl, killer, victims with roles, minions with hp, birds n/3);
- item deck: count plus the face-up top card's name;
- `PANIC`: one row per arrow, with mini die faces for the numbers, an arrow, and the destination name. While open, this zone's panic tiles show on the map.

**Log sheet, "Screenplay"** (paper):
- Courier Prime 15. Turn groups start with a slugline `INT. CAMP HAPPY TRAILS – TURN 3`. Phase lines are bold UPPER.
- Tone is shown as a 4 px left rule: good `--exit`, bad `--blood`, killer `--killer` plus bold, info none.
- **Opens scrolled to the newest entry** (bottom).

**Menu sheet, "Paused"** (bone):
- `[Resume]` (primary) and `[How to play]`.
- Segmented controls: Speed Slow / Normal / Fast; Text Normal / Large.
- Toggles: Sound, Haptics, Keep screen awake, Left-handed (landscape).
- `[Restart this film]`: the first tap turns it into a red `[Tap again to restart]` for 3 s; the second tap restarts.
- `[Back to the title]`: the game is saved, so no confirmation is needed.
- `[Back to the library]`: library frame only.

**Rules sheet**: the `Rules.tsx` text restyled as 6 paper pages with a `.scroll-x` snap pager and dot chits (Setup, Action, Planning, Killer, Panic, Final Health and Tips). It is `.selectable` text. Landscape width `min(560px, 70vw)`.

### 4.19 End screen (`overlays/EndScreen.tsx`, `.end-screen`, absolute inset 0, black stock)

```
PORTRAIT                                        LANDSCAPE (two columns)
          THE END?   (Anton 64, blood offset)    ┌ left 360 ──────────────┐┌ right ───────────────────┐
   Hans got you at the Dock.  ← <p> Archivo 17   │ THE END? (Anton 56)     ││ RENTAL RECEIPT (paper)    │
 ┌ RENTAL RECEIPT (paper, Courier 15) ┐          │ <p> outcome text        ││ FILM … HAPPY TRAILS       │
 │ FILM ......... HAPPY TRAILS HORROR │          │ [◀◀ REWIND]             ││ TURNS 7 · SAVED 3 …       │
 │ STARRING ..... LAURIE              │          │ [⏏ EJECT]               ││ [BE KIND, REWIND] sticker │
 │ TURN 07 · SAVED 3 · DEAD 9 · ♥ 4   │ ← .muted │ [CREDITS]               ││                           │
 │ [BE KIND, REWIND] sticker          │          └─────────────────────────┘└───────────────────────────┘
 └────────────────────────────────────┘
 [◀◀ REWIND]  [⏏ EJECT]  [CREDITS]   48px keys
```

- **Win**: the title is `SHE SURVIVED` (bone, no blood offset) and a gold `SURVIVOR` sticker sits on the receipt. Credits auto-scroll the log as screenplay lines (20 px/s, tap to pause).
- **Keys**: Rewind = play again; Eject = title; Credits = the Log sheet, which opens **above** the end screen (z-index 50).
- **Hooks**: the `<p>` holds `outcome.text`; `.muted` holds the stats line.

### 4.20 Toasts (`overlays/Toast.tsx`, `.toast`)

- A black-stock banner at the top inside `--pad-t`: Archivo 600 15 bone, ink border, hard shadow.
- Slides in 200 ms, auto-dismisses after 2200 ms, `pointer-events: none`.
- Used for `RuleError` messages and "Saved".

### 4.21 First-run tips (`prefs.seenHelp`)

Three paper stickers, each shown once on the first game and dismissed by a tap:
1. "Tap a card to pick it up", pointing at the hand.
2. "Tap a lit space to move", on the first move prompt.
3. "The Terror deck is the clock", on the deck.

---

## 5. Interaction model

### 5.1 Global rules

- **One input model: tap.** Tap picks up or selects; a labelled key, or tapping the big lifted card, commits.
- **The hand uses scrub-select.** `pointerdown` on `.hand` (which has `touch-action: none`) gives the card under the finger `.hover`. `pointermove` retargets. `pointerup` selects that card and suppresses the following `click` for 60 ms. A synthetic `click` (keyboard, e2e) also selects. Tapping the selected card again deselects.
- **Long-press** (380 ms, under 8 px of movement) inspects:
  - a hand card → the big card in the stage in inspect mode, keys unchanged;
  - a map space → Zone sheet;
  - a `.opt` → detail sheet;
  - a pile → its card.
  The next click is swallowed.
- **Three tiers of information**: glance (strips and board), tap (a sheet), long-press (inspect).
- **Never act on `pointerdown`.** The pressed state comes from `:active`; the action happens on `click`.
- **No drags** except hand scrub, sheet dismiss and map pan while zoomed. Nothing draggable starts within 20 px of a screen edge.

### 5.2 Prompt table

DOM texts are exact; CSS upper-cases them.

| Prompt | Stage | Tray h4 | Hand area | Keys (class) | Inputs sent | Defaults and rules |
|---|---|---|---|---|---|---|
| `main` | Lifted card plus side column; item mat; strike slip | `Your move` / `Strike!` | Hand fan (`.acard`, `.off` for unplayable) | `⧗+` (`.btn`), `Items N` (`.btn`), `Save victims` (`.btn.good`), ultimate (`.btn`), `End turn` / `Don't strike` (`.btn`). With a card lifted: `Discard +1⧗` (`.btn`) and `Play <Card>` (`.btn.primary`) | `play {card, weapon?}`, `discardForTime {cards[]}`, `item`, `ultimate`, `rescue`, `endPhase` | Best weapon preselected; discard is multi-card; deselect when the log length changes |
| `roll` | Card mat, dice tray, modifier keys | `Horror roll — <title>` | Hand: dimmed, active in convert mode | `Accept` (`.btn.primary`, with sub effect line); modifiers `.btn.small`: `Close call · uses card`, `Reroll all · uses card, −2⧗`, `Lucky die`, `Sister · −2⧗` | `convert {die, discard[2]}`, `closeCall {die?}`, `lucky {dice[]}`, `sister {die}`, `confirm` | Tap a `.near` die → convert mode (h4 `Discard 2 → ★ (0/2)`); the second card pick sends after 200 ms; tap the die again to cancel. Modifier key → "Tap a die" mode for the single-die ones. Lucky: tap dice to toggle, then `[Reroll N]` |
| `move` | Lit spaces, `MOVES LEFT n` chip | `<title> · n moves left` | Bring toggles (`.btn.small`, `.good`) plus Go-to chips (`.opt`) | `Stay here` (`.btn`) when `canStop` | `moveTo {zone, bring}`, `stop` | Bring = first `followLimit` followers; snap to the nearest lit space within 40 px |
| `choice` | Lit zone options; detail slip | `p.title` | Option area (`.opt`; merged with the keys row) | none | `choose {id}` | 2 options → big pair; 3–6 → grid; 7+ → scrolling list plus the map |
| `planning` | Tableau mat (piles `.acard.pile`, detail) | `Planning · n⧗ to spend` | Hand, reference only (`.acard.ref`) | `Done planning` (`.btn`), `Buy <Card>` (`.btn.primary`, sub `−n⧗`) | `buy {card}`, `endPlanning` | Actual `cost(g, c)`; one tap to select, one to buy |
| `react` | Attack band, health preview chit | `<By> attacks — n damage` | Hand: reaction cards live (first `.sel`), others `.off` | `Use <item>` (`.btn`), `Take the hit` (`.btn`, or `.btn.primary` if alone), `Play <Card>` (`.btn.primary`) | `react {card}`, `reactItem {uid}`, `takeHit` | Hearts preview; Final Health sticker |
| `rescue` | Rescue card (`.slot`, `.slot.full`) or Ultimate face | `Save victims · n here` | Victim toggles (`.btn.small`, single select, `.good`) | `Done` (`.btn`) | `rescueOne {victim, slot}`, `rescueDone` | First victim preselected; the next free slot is ringed |
| `search` | Item fan with KEEP stamp | `Search: keep 1 of n` | Item text slip | `Rest to the bottom` (`.btn`), `Rest on top` (`.btn`) | `searchPick {keep, otherTo}` | First item preselected |
| `arrange` | Hands and backpack mat (`.itab`) | `Arrange your items` / `Hands full — rearrange` | Item text and warnings | `Done` (`.btn.primary`) | `arrange {inHands[]}` | Two-hand capacity check; `noBackpack` warning |
| `discardDown` | none | `Too many cards — discard n` | Hand multi-select (`.sel`) | `Discard k/n` (`.btn.primary`) | `discardDown {cards[]}` | Enabled only when exactly n are marked |
| busy | Map animates | `▶ <PHASE> …` | Script slip | `Fast` (`.btn`), `Skip` (`.btn`) | — | Skip stops at the next card |
| null prompt | — | `…` | empty | — | — | Never shown longer than 1 frame |

**Rules that keep the e2e hooks working**
- The only `h4` inside `.dock` is the tray prompt title, and `.tray` comes before `.stage` in the DOM.
- Item cards, item tabs and modifier keys never use `.opt`.
- Glyphs (▶ ▸▸ ✕ ★) are SVG with `aria-hidden`, never text inside buttons.

---

## 6. Playback, motion and feedback

### 6.1 Display state (small engine change)

**`src/game/engine/state.ts`:** add

```ts
export interface Snap { fz: ZoneId; kz: ZoneId; fhp: number; ftok: 'black' | 'white'; ft: number; fh: number;
  khp: number; ktok: 'black' | 'white'; bl: number; td: number; saved: number; dead: number;
  vic: [string, ZoneId, SpecialRole?][]; min: [string, ZoneId, number][] }
// and on LogEntry:
snap?: Snap;
```

**`kernel.ts` `log()`:** after pushing, set `entry.snap = takeSnap(g)` from the fields above.

**`src/game/index.ts` `act()`:** after `structuredClone`, run `for (const e of next.log) delete e.snap;` so only the entries this input produced carry snapshots.

**`hooks/useDisplay.ts`**
- `display(g, prevG, cur)` returns a GameState view. Positions and counters come from `cur.snap`, or from the previous entry's snap or `prevG` for the starting point. Everything else comes from `g`.
- For an entry with a move anim, the moved token's position after the entry is the **last zone of `anim.path`**.
- After a `victimDie` at zone Z, the victims shown in Z = `min(count in snap, count in the next snap or g)`.
- Entries without a snap (old saves) fall back to `g`.

### 6.2 `hooks/usePlayback.ts`

- **Keep from the current code**: the `played` / `cur` cursor and waiting for a tap on `card` entries.
- **Replace** the per-frame `setT` loop. React re-renders **once per entry**; motion runs through WAAPI on token `<g>` elements (`el.animate(..., { fill: 'forwards' }).finished`), and the cursor advances after the timer.
- **Speed multiplier**: slow 1.6, normal 1, fast 0.55. `▶▶ Fast` multiplies by a further 0.25.
- Playback is **paused** while a sheet is open.
- **Skip** advances `played` to just before the next `card` entry (or to the end), snapping positions. It never jumps past a card.

### 6.3 Timing and choreography (ms at normal speed)

| Event | Duration | Choreography |
|---|---|---|
| Key press | 90 | `translateY(4px)`, shadow to 0 |
| Card hover / lift | 160 | `translateY(-12px)` / `(-24px)`, `cubic-bezier(.2,.9,.3,1.2)` |
| Stage card appears | 220 | FLIP from the hand card's rect, `scale(.5)` → 1 |
| Sheet | 380 | `translate` with `cubic-bezier(.32,.72,0,1)` |
| Phase title card | 700 | in 160 / hold 380 / out 160 |
| Dice tumble | 520 + 80 per extra die | keyframes `translate(-40px,-20px) rotate(-360deg)` → `0, 0deg`, then a settle squash `scale(1.12,.88)` → 1 over the last 100 ms; stars stamp `scale(1.6)` → 1 in 160 ms; the matching row `.hit` stamps in 180 ms |
| Non-prompt `dice` anim | 520 + 200 hold | A transient mini tray (`.die.sm`) at the stage top centre shows the faces |
| `killerMove` | 260 per step + 140 | A hop per segment: translate along the edge with `scale(1.08)` at the midpoint; footstep sound per step; the trail behind is drawn as an ink dashed path that fades after 600 ms |
| `fgMove` | 240 per step + 100 | The Final Girl walks; followers trail one step behind (120 ms delay) |
| `victimMove` (panic) | 300 + 300 per step | A 22 px die pops above the meeple showing the face; the matching panic tile fills yellow; the meeple runs |
| `victimDie` | 700 | Meeple tips `rotate(90deg)` (300 ms), splat appears, Bloodlust marker clunk (250 ms), death sound |
| Attack on the Final Girl | 300 | Killer lunge plus a ±6 px `.game` shake; the hearts that break pop `scale(1.3)` → 0 (240 ms); sting |
| Card reveal | 80 + 260 + 280 + 260 | Jump cut (Terror only), fly, flip, settle |
| Final Health flip | 700 | `rotateY` 3 turns on the token chit, landing on the revealed side |
| SAVED sticker | 200 | `scale(1.4) rotate(-8deg)` → `1, -4deg` |
| Bloodlust threshold | 600 | The Dark Power back slams onto the strip slot (`scale(1.3)` → 1), then flips |
| Default entry | 90 | Script slip line appears |
| Tone `killer` text | 300 | |

**Rules**
- Animate only `transform` and `opacity`. Never `box-shadow`, `filter`, layout properties or SVG geometry attributes.
- Splats persist until the next Action phase.
- Counters (hearts, Time, ladder, deck count) update when the display state changes. Time and deck numerals tick with a 200 ms `translateY` roll.

### 6.4 Reduced motion

`matchMedia('(prefers-reduced-motion: reduce)')` changes:
- default speed is `fast`;
- hops become a 140 ms crossfade to the destination;
- dice fade in, with no tumble;
- title cards last 300 ms;
- no shake;
- no view transitions.

Do **not** use `animation: none !important`. Delete that rule from the current CSS.

### 6.5 Finale

`.game[data-finale]` switches `--table` to `--table-deep` and the board ground to `--ground-finale` as a flat swap with no fade.

### 6.6 Sound (`fx/sound.ts`, Web Audio synthesis, no assets)

- **Session**: master gain 0.5. Keep permanent unlock listeners on `pointerup`, `touchend`, `click` and `keydown`. Set `navigator.audioSession.type = 'ambient'` when available, so the mute switch is respected. Resume on `visibilitychange`.
- **Pref**: `prefs.sound`, default true.

| Event | Recipe |
|---|---|
| Key press | 6 ms noise, highpass 2 kHz, gain .15 |
| Card lift | 40 ms noise, bandpass 3 kHz |
| Card play / slap | 70 ms noise, lowpass 1.2 kHz, plus a 90 Hz sine 50 ms |
| Dice rattle | 6 noise clicks (8 ms, bandpass 2.5–4 kHz) at random spacing over 300 ms |
| Star stamp | 140 Hz sine 60 ms + 20 ms noise |
| Killer footstep | sine 110 → 60 Hz over 80 ms |
| Attack sting | saws at 220 and 233 Hz, 400 ms, lowpass sweeping 3 kHz → 600 Hz |
| Victim death | 200 ms noise, lowpass 800 Hz, + 70 Hz sine |
| Bloodlust clunk | square 90 Hz 60 ms + 30 ms noise |
| Terror stinger | saws at 110 and 117 Hz, 600 ms, + highpass noise swell |
| Sticker slap | 50 ms noise, bandpass 1.5 kHz |
| Buy (ka-ching) | sines at 1318 and 1760 Hz, 60 ms each, 40 ms apart |
| Tape whir (opening) | saw 60 → 180 Hz, 500 ms, lowpass |
| Board thunk (opening) | 70 Hz sine 90 ms + noise |
| Rule error | two square blips at 180 Hz, 50 ms |

### 6.7 Haptics (`fx/haptics.ts`)

- Dependency: `ios-haptics@3.2.0`, exact pin (published 2026-09-22). Use `hapticTrigger` as a ref callback, only when `prefs.haptics` (default true).
- **Attach it on direct taps only**:
  - hand cards;
  - tray dice;
  - `.opt` Go-to chips and choice options;
  - bring and rescue toggles;
  - `.slot`;
  - the tray's `.btn.primary`.
- **Never** on the map SVG, sheets, scrolling lists or for asynchronous events. Asynchronous hits get the shake and the sound instead.
- **Acceptance**: the `:active` pressed style still shows. Check this once on an iPhone.

### 6.8 Visual feedback rule

Every tap gives a pressed state in under 100 ms. Every rule outcome is shown as a component moving. The script slip states the cause in words.

---

## 7. iPhone PWA rules

### 7.1 `index.html`

```html
<html lang="en" style="background:#4A3324">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
<meta name="theme-color" content="#4A3324" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Final Player" />
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />   <!-- 180×180, opaque, full-bleed -->
<!-- generated apple-touch-startup-image links (§7.6) -->
```

### 7.2 `vite.config.ts`

- `registerType: 'prompt'` and `orientation: 'any'`.
- `background_color` and `theme_color`: `#4A3324`.
- Add the `apple-touch-icon.png` icon at 180×180.
- `workbox.globIgnores: ['**/splash/**']`.
- Keep `base`.

### 7.3 `main.tsx`

- Import the fonts (§2.3) and the CSS files.
- Gate the first render: `Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 800))]).then(render)`.
- Block pinch gestures: `gesturestart`, `gesturechange` and `gestureend` → `preventDefault` (passive: false).
- Service worker: `registerSW({ onNeedRefresh() { applyUpdate = () => updateSW(true); } })`. The title screen calls `applyUpdate?.()` on mount. **Never reload mid-game.**

### 7.4 Session

- **Wake lock** (`fx/wakeLock.ts`): requested on GameScreen mount when `prefs.awake` (default true), released on unmount, re-acquired on `visibilitychange`; errors are swallowed.
- **Saving**: save on every state change (already done) and on `pagehide`. Call `navigator.storage?.persist?.()` once.
- **Resume**: on launch with a save that has no outcome, the title shows the VCR Continue slot first. One tap resumes at the exact prompt with no playback (`startAt` = last n).

### 7.5 Safe areas

- Controls live only inside the `--pad-*` tokens. The walnut background fills the status and home bands.
- Status text in portrait is white on walnut, which is readable. No band needs repainting.

### 7.6 Icons and splash (extend `scripts/icons.ts`)

- **Icon** (`public/icon.svg`): walnut full-bleed. A centred purple meeple 60% tall with an ink 4% outline and a hard ink offset copy. A red die (star face) at the lower-right, 26%. No gradient and no rounded rect in the source.
- **Generated outputs**: `icon-192.png`, `icon-512.png`, `icon-maskable.png` (meeple at 50% safe zone) and an opaque `apple-touch-icon.png` (180).
- **Splash**: render `splashHtml` (walnut, Anton "FINAL PLAYER" bone with blood offset, centred, fonts loaded from `node_modules/@fontsource/anton/files`) for the 10 device sizes in the research, in both orientations. Write them to `public/splash/` and inject the `<link rel="apple-touch-startup-image">` tags with a Vite `transformIndexHtml` hook.

### 7.7 Library frame

Keep `library.ts` and the `--mnbg-safe-*` variable chain unchanged.

---

## 8. Delete list

### `src/ui/styles.css`
Delete the whole file. It is replaced by `src/ui/styles/{tokens,base,pieces,table,board,cards,tray,sheets,store,overlays}.css`. These items must not reappear in any form:

| Lines | What |
|---|---|
| 1–24 | Tokens `--bg/--bg2/--panel/--panel2/--line/--line2/--text/--muted/--dim/--fg(#79e2ff)/--blood-hi` and the neon chip colours |
| 52–56 | `body` radial-gradient |
| 65–74 | `.app { height: 100dvh; max-width: 600px }` |
| 95–100 | `.btn.primary` gradient and text-shadow |
| 153–156 | `.logo` glow |
| 165–171, 267–274, 605–611 | Uppercase letter-spaced eyebrow labels |
| 204–208 | `.pick.on` gradient and glow |
| 239–244 | `.film-card` gradient |
| 298–312 | Deck badge |
| 367–394 | `.chip` colour-border pill family |
| 400–415 | Horror pill track and `.on` glow |
| 427–440 | `.map-wrap` box, `min-height: 200px`, `touch-action: none` |
| 450–459 | 36 px map tools |
| 472–487 | Ticker |
| 505–511 | `.dock` gradient, `max-height: 52dvh`, `overflow-y: auto` |
| 531–571, 916–924 | Old card sizes |
| 601 | `.bigcard` blurred shadow |
| 621–645 | Five bigcard gradients |
| 746–756 | `.die.win` glow, `.die.sel` cyan |
| 854–878 | `.end-screen` radial gradient and title glows |
| 880–896 | Hit flash (replaced by the shake) |
| 819–840, 898–903 | Dead `.items-row`, `.item-tile`, `.skip` |
| — | `prefers-reduced-motion { animation: none !important }` |
| — | The `.icon-btn`, `.title-screen`, `.tagline`, `.btn.ghost` names (Coldwake vocabulary) |

### Source files

| File | Delete |
|---|---|
| `src/ui/main.tsx` | Creepster and Barlow imports; `registerSW({ immediate: true })` |
| `src/ui/components/MapView.tsx` | `<radialGradient id="ground">`, `<filter id="glow">`, cyan selection pulse (`#79e2ff33`), translucent pills (`#0b0507cc`, `#000c`), letter-in-circle standees, role dots, both-ends panic labels. Replaced by `board/*` |
| `src/ui/components/Game.tsx` | Big map overlay (L267–288), hit flash, rAF `setT` loop, ticker, busy bar, inline `#300` / `#000` fills, role-only bring default |
| `src/ui/components/Dock.tsx`, `Panels.tsx`, `Cards.tsx`, `Sheets.tsx` | Replaced. Keep the logic ported per §10. Remove the emoji (🔪👢🎲✋🎒) and text glyphs (☠ ✓ ✕ ▸) |
| `src/ui/art/Icons.tsx` | Cyan defaults (L36, L97); all defaults become `currentColor` |
| `package.json` | `@fontsource/barlow-condensed`, `@fontsource/creepster` |
| `public/icon.svg` | Radial gradient. Regenerate the PNGs |
| `vite.config.ts` | `orientation: 'portrait'`, `registerType: 'autoUpdate'`, `#0b0507` |
| `index.html` | `#0b0507` theme colour; the `icon-192.png` apple-touch-icon |

---

## 9. File map

```
src/game/engine/state.ts            + Snap, LogEntry.snap
src/game/engine/kernel.ts           log(): attach snap
src/game/index.ts                   act(): strip old snaps
src/ui/main.tsx                     fonts, gating, gesture block, SW prompt
src/ui/App.tsx                      keep flow L12–56; render VideoStore | GameScreen; sprite <svg> with #meeple
src/ui/persistence.ts               Prefs += sound, haptics, awake, text, hand, panicAll, seenSideways, seenInstall, played[]
src/ui/film.ts                      per-location board palettes, spines, objective/film stickers, role colours, card glyph
src/ui/styles/*.css                 (§8)
src/ui/hooks/useTable.ts usePlayback.ts useDisplay.ts usePxPerUnit.ts useLongPress.ts useSheetDrag.ts
src/ui/pieces/Meeple.tsx Die.tsx Chit.tsx Sticker.tsx Key.tsx Mark.tsx(X, tick, star, play, ff, skip, eject, rewind)
src/ui/store/VideoStore.tsx Spine.tsx BoxBack.tsx MixMatchSheet.tsx InstallCoach.tsx
src/ui/game/GameScreen.tsx          grid, header/tool edge, sheets state, toasts
src/ui/board/Board.tsx StaticLayer.tsx TokenLayer.tsx HitLayer.tsx geometry.ts(zonePoint, viewBox fit, edge dedupe, faces, blocked/lock, killerShown — ported) labels.ts decor.ts panic.ts
src/ui/strips/KillerStrip.tsx GirlStrip.tsx HorrorDial.tsx BloodlustLadder.tsx Hearts.tsx DeckStack.tsx FinalToken.tsx
src/ui/cards/ActionCard.tsx ResultTable.tsx EffectLine.tsx RevealCard.tsx CardBack.tsx ItemCard.tsx
src/ui/dock/Dock.tsx(display:contents switch) Hand.tsx Keys.tsx MainPrompt.tsx RollPrompt.tsx DiceTray.tsx MovePrompt.tsx ChoicePrompt.tsx PlanningPrompt.tsx ReactPrompt.tsx RescuePrompt.tsx SearchPrompt.tsx ArrangePrompt.tsx DiscardPrompt.tsx ItemMat.tsx VcrBar.tsx
src/ui/sheets/Sheet.tsx KillerSheet.tsx GirlSheet.tsx ZoneSheet.tsx LogSheet.tsx MenuSheet.tsx RulesSheet.tsx
src/ui/overlays/Opening.tsx TitleCard.tsx Reveal.tsx EndScreen.tsx Toast.tsx Tips.tsx
src/ui/fx/sound.ts haptics.ts wakeLock.ts
src/ui/art/Icons.tsx                currentColor + new: TerrorDeck, EventCard, Cube, FinalToken, Footprint, Shield, Eye, Star, CardPair, Padlock, Crow, Puppet, Splat, Menu, Scroll, Zoom, PanicDie, HeartBroken, Share
src/ui/gallery.tsx                  ?gallery: every piece, both orientations; ?gallery=board&loc=<id>
scripts/style-audit.ts              ban checks (§11)
e2e/play.spec.ts                    + landscape project; e2e/audit.spec.ts (targets, text, scroll, stability)
```

**Ported logic.** Keep these, with new rendering:
- `cardFor`;
- `describeAction` + `CUSTOM_LABEL`;
- Boiler Room cell math;
- WrathBox data;
- ZoneSheet tags and panic list;
- log grouping by turn;
- the per-prompt state machines in `Dock.tsx`: main sel/weapon/showItems/timeEach, roll modes and partials, move bring limit, planning sel, rescue who, search keep, arrange inHands capacity, discardDown picked;
- the `Dice` classification and remount key.

---

## 10. Implementation plan and acceptance checks

Each step ends with `npm run typecheck && npm test && npm run build` passing.

1. **Dependencies and foundation.**
   - Install the exact packages (§2.3, §6.7); remove the old fonts.
   - Write tokens, base, pieces, `main.tsx`, `index.html`, `vite.config.ts`, `Icons` set to `currentColor`, `pieces/*`, and `gallery.tsx`.
   - *Check:* `npx tsx scripts/style-audit.ts` finds 0 violations.
   - *Check:* `?gallery` screenshots at 390×844 and 844×390 show every key state (normal, pressed, disabled, primary, good, dark, small), stock, chits, every sticker colour, meeples in all colours, dice (blank, pair, star, fail, near, picked, converted), action cards (Walk, Weak Attack, Guard, Close Call in hand, lifted, `.off`, `.sel`, `.marked` sizes), 6 card backs, 5 reveal faces, the dial at all 8 positions, the ladder at 0, 5 and max, and deck stacks at 10, 3 and 0.
2. **Engine snapshots.**
   - *Check:* a unit test proves `act()` output carries `snap` only on new entries and that the snap fields equal the state at log time for a killer move and a death.
   - *Check:* the existing sims and tests pass unchanged.
3. **Board.** Geometry port, static layer, decor, labels, panic tiles, token layer, hit layer, zoom.
   - *Check:* a unit test runs the label solver for all 5 locations plus the Birds at ppu = 342/W and 382/W; no label box intersects another label or a disc.
   - *Check:* every hit radius is at least 22 px or at least half the nearest-neighbour distance.
   - *Check:* every panic tile's box misses its source label (after `push`).
   - *Check:* `?gallery=board` screenshots for each location in both orientations.
4. **Game grid, strips, dock skeleton.** `.dock` as `display: contents`, tray and stage, header and tool edge, Killer and Girl strips with all film stickers.
   - *Check (`e2e/audit.spec.ts` at 390×844 and 844×390, with insets injected through the `--mnbg-safe-*` variables):* `document.scrollingElement.scrollTop === 0` and `scrollHeight <= innerHeight`.
   - *Check:* the `.board` bounding rect is identical at every step of a 200-step bot game.
   - *Check:* the tray's last key bottom is at or above `innerHeight - inset-bottom`.
5. **Cards, hand and the core prompts.** ActionCard, ResultTable, EffectLine, Hand (scrub, long-press), MainPrompt (lift, weapon, multi-discard, items, save, ultimate, strike), RollPrompt (tray, convert, modifiers, Accept sub-line), MovePrompt (bring default, Go-to chips, snapping).
   - *Check:* the existing e2e passes for all 6 films in portrait.
   - *Check:* a new test drives to `move` with followers and asserts `bring.length === min(followLimit, followers)` by default.
6. **Remaining prompts.** Choice, Planning (actual cost, piles as `.acard`), React (preview), Rescue (`.slot`), Search, Arrange (warnings), DiscardDown.
   - *Check:* the e2e passes for all 6 films in **both** orientations. Add a Playwright project `landscape` with `viewport: { width: 844, height: 390 }` to `playwright.config.ts`.
7. **Playback.** `usePlayback`, `useDisplay`, WAAPI hops and walks, deaths, panic dice, title cards, reveals with jump cut, VCR bar with Fast and Skip, shake, Finale swap, reduced motion.
   - *Check:* an e2e test confirms Skip never passes a `card` entry: after Skip, `.overlay` is present whenever an unplayed card entry exists.
   - *Check:* a React Profiler count shows no more than 1 GameScreen commit per log entry during a killer move.
8. **Sheets.** Sheet with drag to dismiss, side sheets in landscape, Killer, Girl, Zone, Log (opens at the newest entry), Menu (restart confirmation, all toggles), Rules pager.
   - *Check:* opening the Log from the end screen shows it above `.end-screen`.
   - *Check:* `inert` is set while a sheet is open.
9. **Title, opening, end.** VideoStore (spines, box back, Mix & match, Continue slot, sideways sticker, install coach), Opening, EndScreen (receipt, credits), first-run tips.
   - *Check:* e2e: `.logo` has text "Final Player", `.film-card` is clicked by film name, and the button "Start the night" works in both orientations.
10. **Feel and PWA.** `fx/sound`, haptics, wake lock, `pagehide` save, storage persistence, icons, apple-touch-icon, splash generation, update on the title screen.
    - *Check:* the manifest has `orientation: "any"` and 4 icons; the e2e install test passes.
    - *Check:* `public/apple-touch-icon.png` is 180×180 with no alpha.
    - *Check:* the splash links exist for 20 device/orientation pairs.
11. **QA and critic screenshots.**
    - `audit.spec.ts` uses `window.__fp.start` / `driveTo` to reach every prompt type in both orientations and asserts:
      - every visible `button`, `.opt`, `.chit` and `[role=button]` is at least 44×44, except hand `.acard` (scrub) and pile rows (44 tall, full width);
      - no visible text node has a computed font-size below 11 px;
      - no element other than `.scroll-y`, `.scroll-x`, the sheet body, the choice list and the tableau list has `scrollHeight > clientHeight + 1`.
    - Update `scripts/shot.mjs` to save these PNGs at @2x for **both** 390×844 and 844×390:
      `01-title`, `02-boxback`, `03-game-action`, `04-card-lifted`, `05-roll`, `06-move`, `07-killer-playback`, `08-terror-reveal`, `09-planning`, `10-react`, `11-rescue`, `12-killer-sheet`, `13-end`.
      Each film's board also gets one shot.

### `scripts/style-audit.ts`

Fails on any match in `src/**`, `index.html` or `public/icon.svg`:

```
/(linear|radial|conic)-gradient|<(linear|radial)Gradient|feGaussianBlur|drop-shadow|backdrop-filter|\bfilter\s*:/
/(box|text)-shadow\s*:[^;]*\b\d+px\s+-?\d+px\s+[1-9]/            (any blur radius)
/#79e2ff|#9be7ff|#5ce1e6|Creepster|Barlow|Chakra|Plex|Spectral/i
/[\u{1F300}-\u{1FAFF}\u2620\u2713\u2715\u25B8]/u                  (emoji and text glyphs in src/ui)
```

### Definition of done

Every check above passes. The 26 critic screenshots show:
- no gradients, glows, blur or cyan;
- light cardstock objects on walnut in every frame;
- in landscape, a map at least 382 px wide at full height with the tray visible;
- a board that never moves between states;
- meeples, red dice and card result rows readable without zooming.