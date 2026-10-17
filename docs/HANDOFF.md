# Handoff: Final Player UI redesign

The work was paused on 15 October 2026, at the user's request ("Stop everything for now and save a handoff document"). This page says where things stand and how to carry on.

## What the user asked for

1. **The original build.** "Create a pwa install implementation of the single player Final Girl boardgame. Also add it to the game library. Look up official rules and cards and everything so its 1:1". This is done: the app is on `main`, and it is listed in `mnbglibrary` as "Final Player".
2. **The redesign.** "Its not optimized for an iphone app feel, improve the ui experience in general, it needs a rethink and an overhaul. Remove also gradients etc everything looks so ai ish. I needs to be better its too similar to the coldwake i dont like it it doesnt look fun. Analyze how the real game looks and feels and optimize the app for that, maybe in portrait instead of vertical."
3. **The critic loop.** "Spawn in a game designer critic expert in uis and mobile games to critique your work and provide ranked list of issues, loop until the grade he gives you is 8/10 or higher with 10/10 being a proffesional studio mobile game, or if you hit 3 redesign tries".

**Where the loop stands:** redesign try 1 is built and on `main`. Round 1 grading is only partly done. Tries 2 and 3 are still available.

## Update: 16 October 2026, redesign #2 merged (try 2 of 3)

Working under a usage cap (stop at 50% of the five-hour window), I applied the cheapest high-value fixes from the round-1 reviews myself, without subagents.

**Branches.** All of it is on `redesign-r2` and merged into `main` (merge `7191d12`). The `r2-board` and `r2-art` branches are still the stopped, barely started agent work.

**Checks.** Every merge passed typecheck, the 50 unit tests, the build and all 9 end-to-end games.

**Done (numbers refer to the issue list below):**
- **Board (items 1 and 3), partly.**
  - Spaces are tiles in each film's stock, with a place icon printed on them (`src/ui/board/places.ts`: about 55 glyphs mapped per zone).
  - Name plates tuck under their tile.
  - Panic numbers show only during a panic move, for the inspected space, or with the 1-6 toggle.
  - Item decks are orange wrench badges with a count, crossed out once searched.
  - The Sacred Groves stubs are gone.
  - Lit move targets keep their icon.
- **Tips (item 5).** The hand tip's `hand` class clashed with the hand fan's `.hand { height: 100% }`, which made the giant slab. Tips now use `tip-*` classes, are small, and the first real tap dismisses them while still going through. `shots.mjs` no longer pre-seeds them.
- **Dice beat (item 6), partly.** Rolls that need no decision hold for 1.2s and stamp "1 star", "2 stars" or "Fail".
- **Planning (item 9).** All piles show in a 2-column grid with cost coins, and the picked card floats over the other column.
- **Stickers (item 10).** The Terror deck turns red as the Finale nears (no sticker). In portrait, the objective sticker moved into the board header, and the 1-6 and zoom chits moved to the map's bottom-right corner.
- **Choices (item 8), partly.** Two-way choices and lists stack as full-width keys in the thumb zone.
- **Tap targets (item 11).** Header chits and event sleeves have 44pt hit areas.
- **Reveal (item 13), partly.**
  - The continue prompt is a printed pull-tab.
  - The turn tape follows the playback moment.
  - Short reveal cards are less tall.
- **End screen (item 15), partly.**
  - The receipt names the film and the killer.
  - The keys sit at the bottom in portrait.
  - CREDITS is now SCREENPLAY.
- **Smaller fixes (item 16).** The labelled Discard key, dice symbols (or pips for panic) in the dice flash at the board's foot, the move rack, and the objective sticker kept off the stats.

**Still open:**
- **Board:** the landmark shapes and film-idiom paths, a scored label solver with an overlap test (a few plates still touch on Groves and Maple), and notch-tab panic tiles.
- **Poster art (item 4):** not started beyond the WIP branch.
- **Decision objects (item 7):** they still cover the map. The lifted card should lift in place, and react should be decluttered.
- **Prompt keys:** icons and meeple badges on the keys.
- **Cards (item 12):** hand-size card layout.
- **Death beat.**
- **iPhone SE (item 14):** layout.
- **End-screen recap.**
- Not run: the critic panel for round 2. A single lead critic ran instead.

**Critic round 2:** **6.4/10**, graded from contact sheets only (no live play, to save usage).
- Full review: [`review-r2-lead.md`](redesign/review-r2-lead.md).
- Part 4 (merge `8974a82`) already fixed some of its findings:
  - The portrait board footer now holds the objective sticker and the 1-6 and zoom chits, so nothing sits on the map and nothing is truncated.
  - END TURN no longer runs off-screen with three keys.
  - Planning's SHORT stamps no longer clip.
  - The "▸" shorthand is spelled out.
  - The empty bring-along row is hidden.

**Next (try 3, the last):** work through the issues in `review-r2-lead.md`, in this order:
1. The label solver and overlap test.
2. Poster art: start from the `r2-art` WIP or start fresh.
3. Decision objects into the rail or tray, and lifting cards in place.
4. The hand-size card layout.
5. The printed-component replacements for the web-kit pieces.
6. Staging the end screen.

Then run the full critic workflow (`critic-workflow.js`) for the final grade.

## Update: 17 October 2026, finishing pass (merged to `main`, last `9f3b7ad`)

Three agents ran in parallel worktrees and burned the five-hour window in under an hour (weekly usage went from 71% to 84%). Their committed work was merged and checked. The play-surfaces agent saved nothing, so its items were redone inline.

**Done in this pass:**
- **Poster art** (from `fin-art`), in `src/ui/art/*`.
  - Six killers, twelve Final Girls and five locations.
  - Shown on the tapes and box back, the Killer strip, both sheet nameplates, the Terror card, the chapter title card and the end screen (the poster behind the receipt).
  - The Killer sheet is printed as a kraft board, the strips were reworked, and the title collisions are cleared.
- **Board** (from `fin-board`).
  - Pieces stand on pawn pads kept off place names.
  - Landmarks under the spaces, such as the camp lake.
  - Paths drawn in each film's idiom.
  - Streets are kept straight and crowded spaces get more room.
  - Birds perch above a chit.
  - Board layouts are cached per frame size.
  - The layout test grew; the suite is now 100 tests.
- **Inline:**
  - The search items sit in the tray.
  - Revealed Terror and Event cards cover only the board area.
  - Horror rolls land in a kraft dice tray in the hand tray, with the played card small in the board's corner.

**Checks:** 100 unit tests, the build and all 9 end-to-end games pass.

**Still open** (from `review-r3-lead.md`; not re-graded since round 3):
- **Hand cards:** spine names can still clip ("WEAK ATTACI"), and text cards need an icon summary at hand size.
- **Lifted card:** still shown on the stage, not raised in place in the hand.
- **Prompts:**
  - Choice and move keys should use icons and meeple badges.
  - Small hands should scale up.
  - The killer-phase busy tray should show screenplay beats.
- **Landscape stickers:** check that they no longer sit on the girl strip after the strip rework.
- **A final critic grade:** run `docs/redesign/critic-workflow.js`, or a single screenshot-only critic, which is cheaper.

**Usage note for the next session:** run at most one agent at a time, and check the five-hour and weekly meters between steps. In a cloud session, `list_events` with `kinds: ["rate_limit_event"]` on the session shows `five_hour` and `seven_day` utilization.

## Update: 16 October 2026 (afternoon). Try 3 is done, so the critic loop is complete.

**Result:** the three redesign tries are used up. Grades went from 6 and 5.5 (round 1) to **6.4** (round 2) to **6.9** (round 3). That is short of the 8/10 target.

**Try 3** (merged to `main`, last merge `1e9cfdb`):
- **Label solver.**
  - Each space gets about 20 candidate plates: around its tile and beside it, in one or two lines, plus short forms like "NW Mid" or "Bay Window" used only to clear a collision.
  - A greedy pass seats them, then up to 8 improvement passes re-seat each plate.
  - `test/layout.test.ts` checks every board at both frame sizes. All are clean except 2 tight spots on Creech and 3 on Maple in portrait, which the test caps.
- **Decision objects.**
  - The rescue card sits in the tray.
  - React shows one band.
  - The lifted card is smaller and sits low on the board.
- **Hand cards.** In a tight fan, covered cards hide their clipped titles, and rule text and effects are clamped.
- **Menu and end screen.**
  - Menu toggles are flip tokens, and speed and text are stamps.
  - The end screen sits on dark walnut, with recap rows on the receipt.
  - The Final Health coin shows "?".
- **Header and strip.** The EVENT and TERROR chits are labelled, and the Dark Power card reads "DP".
- **Test fix.** The e2e test now reads `.end-screen .outcome`; the old summary line was replaced by recap rows.

**After the round-3 review** (merge `ae60c55`):
- The tray's prompt sits on a printed bone slip, and loose hints are paper slips. The duplicate move hint is gone.
- Planning names wrap.
- Landscape move keys get the full width.
- Rescue rewards are clamped.
- The ON tokens use the palette red.
- Six hearts fit in landscape.

**Tried and reverted: penalising a plate for covering its own space's meeple spot.** It pushed plates into each other on Camp and Groves, which the overlap test caught. Meeples on labels needs the pawn-pad approach: a fixed spot for pieces on each space, opposite its plate, that both the token layer and the solver use.

**Round-3 review:** [`review-r3-lead.md`](redesign/review-r3-lead.md). The biggest remaining gaps, in order:
1. Illustration. The `r2-art` WIP doesn't compile and isn't usable; start fresh.
2. Meeples sitting on labels. The fix is a pawn pad per space included in the solver.
3. Card text clipping.
4. Search, the lifted card and the roll still covering the board.
5. A printed prompt slip instead of text on the wood.
6. A full truncation and overflow sweep with a test.

## Where the code is

| Branch | State |
|---|---|
| `main` (`fce422a`) | **Redesign #1, finished and live.** Typecheck, 50 unit tests, the build and all 9 end-to-end games (portrait and landscape) pass. GitHub Pages deploys from here. |
| `redesign-r2` (`4f7e5e9`) | Redesign #2 has started. It holds one commit of small fixes from the first reviews, and it typechecks. It is **not merged** yet. The fixes: tips no longer cover the hand and a real tap dismisses them; the receipt names the film; the "moves left" chip is gone from the map; the objective sticker sits under the killer's name; the dice flash shows symbols (pips for panic) at the foot of the board; and move destinations stack in a 2-column rack. |
| `r2-board` (`6c2ad33`) | **Work in progress, stopped early.** The board agent had only begun on `src/ui/board/geometry.ts`. Treat it as a scratch start, or drop it. |
| `r2-art` (`6e80ff6`) | **Work in progress, stopped early.** The poster-art agent had only scaffolded `src/ui/art/*` (`kit.tsx`, a part of `killers.tsx`, stubs) and `art-preview.html`. It may not typecheck. |

Branch rules:
- Branch new work from `redesign-r2`.
- Merge it into `main` only once it typechecks and passes the tests and e2e.

Local worktrees from the session (`/home/user/fp-r2`, `fp-board`, `fp-art`) will disappear with the container. Every one of them was pushed.

## The design (redesign #1, "Tabletop")

The full spec is [`docs/redesign/spec.md`](redesign/spec.md). The research behind it is in `docs/redesign/research-*.md`. In short:

- **The look.** The phone is a walnut table at night, and every UI object is a printed, die-cut cardstock component.
  - Flat ink colours with 2–2.5px black (`#141213`) outlines.
  - Hard offset shadows with zero blur.
  - No gradients, glows, blur, emoji or cyan.
- **Fonts.**
  - Anton for display.
  - Archivo and Archivo Narrow for the UI.
  - Courier Prime for script and the log.
  - Permanent Marker for stickers.
  - VT323 for VCR counters.
- **Orientations.** Both are first-class, and only CSS grid areas change between them, so nothing remounts.
  - Landscape ("the Table") puts the board on the left at full height. A right rail holds the killer strip, the girl strip and the tray.
  - Portrait ("the Pocket") stacks the killer strip, the board, the girl strip and the tray.
- **Title screen.** A video store: VHS tapes on a shelf, a box back, Mix & match, and a VCR "Continue" slot.

### Code map (`src/ui`)

| Path | What it holds |
|---|---|
| `styles/` | `tokens`, `base` (shell, safe areas), `pieces` (`.btn`, `.chit`, `.sticker`, `.die`, `.coin`), `table` (the game grid, stage, tips), `board`, `strips`, `cards`, `tray`, `overlays`, `sheets`, `store`. |
| `board/` | `Board.tsx` (SVG map, memoized static layer, panic tiles, tokens, targets, zoom, long-press inspect), `layout.ts` (label and panic-tile placement by scoring, `relax()` spreading of crowded spaces), `geometry.ts`. The map stretches to fill its frame. |
| `game/GameScreen.tsx` | Playback of log snapshots (`LogEntry.snap`), title cards, reveals, first-run tips, sheets. |
| `dock/` | `Dock.tsx` has one tray per prompt type, plus the stage for lifted things. `Hand.tsx` is the fanned hand with scrub-select. `parts.tsx` has `Tray` and `Key`. |
| `strips/Strips.tsx` | The killer and girl strips, with the horror dial. |
| `cards/Cards.tsx` | Action, reveal and item cards. |
| `overlays/Overlays.tsx` | Reveal, `TitleCard`, `EndScreen` (the rental receipt), `Toast`, `DiceFlash`. |
| `sheets/` | Killer, Girl, Zone, Log ("Screenplay"), Menu ("Paused") and Rules sheets, built on `Sheet.tsx`. They are bottom sheets in portrait and side sheets in landscape, and can be dragged to dismiss. |
| `store/` | The video-store title screen. |
| `fx/` | Synthesized sound, haptics and wake lock. |
| `film.ts` | Per-film palettes (`boardInk` / `boardVars`) and spine colours. |
| `debug.ts` | `window.__fp`, available in dev or with `?debug`: `start(cfg)`, `driveTo(promptType, {test, max})`, `replay(n)`, `finish(winner)`, `patch(js)`, `state()`, `title()`. |

## How to run and check things

- `npm run dev`. Open `/Final-player/?debug` to get `window.__fp`.
- `npm run typecheck`, `npm test` (vitest), and `npm run build`.
- **End-to-end games:**
  1. `npm run build`
  2. `PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npx playwright test`
  - This plays all six films in portrait, two in landscape, and an install check. CI runs it too.
- **Screenshot every state:**
  - Run `node scripts/shots.mjs http://localhost:5179/Final-player/ <outDir> both`. It gives title, action, lifted card, roll, move, choice, planning, killer playback, terror reveal, react, search, rescue, every sheet, the end screen and every board.
  - `scripts/boards.mjs <outDir>` shoots just the five boards in both orientations.
  - **Note:** `shots.mjs` pre-seeds `prefs.tips` so the first-run tips are hidden. The UX reviewer asked that this be removed so reviews catch tip problems.
- **Icons.** Run `npm run icons`, with `PLAYWRIGHT_CHROMIUM` set as above. It regenerates the PNGs, including `apple-touch-icon.png`, from `public/icon.svg`.

## The critic loop

- **The script.** The workflow is in [`docs/redesign/critic-workflow.js`](redesign/critic-workflow.js).
  - Three specialist reviewers each play the live app on port 5179 and read the screenshot set: art direction, mobile UX, and game feel.
  - A lead critic then gives the official grade and one ranked list.
  - Run it with `args: { round, shots: <screenshot dir>, prev: <earlier rounds' grades and issues> }`.
  - Before using it, change its `SCRATCH` constant to a real folder.

### Round 1 results so far (redesign #1)

| Reviewer | Grade | Notes |
|---|---|---|
| Art direction | **6/10** | Full list in [`review-r1-art.md`](redesign/review-r1-art.md). |
| Mobile UX | **5.5/10** | Full list in [`review-r1-ux.md`](redesign/review-r1-ux.md). |
| Game feel | not run | It hit the usage limit, then was stopped. |
| **Lead critic (official grade)** | **not run** | |

Both finished reviewers say the same thing:
- The video-store title flow, the palette discipline, the action cards and the killer-phase playback are strong, and it no longer looks like Coldwake or an AI app.
- In play it still reads as a fan prototype.

### Agreed top issues, merged from both reviews

1. **The board looks like a transit diagram.**
   - What's wrong: blank white discs, floating name tags, sparse decor (on Groves the stubs look like stray "0"s), and no place art.
   - The fix: printed tiles in the film's palette with a place icon in each (cabin, pier, tent, ferris wheel, bed, tombstone, and so on), names on ribbons attached to their tile, 3–5 large landmark shapes per film, and paths drawn in each film's idiom.
2. **Labels, panic tiles and meeples collide on every board.**
   - What's wrong: the UX reviewer measured 23 overlaps on Happy Trails.
   - The fix: a scored label solver, plus a vitest test that fails on any overlap at both board sizes.
3. **There are too many numbers on the board.**
   - Show panic tiles only during panic playback, on long-press or the zone sheet, or with the 1-6 toggle. Draw them as notch tabs on their path.
   - Replace the numbered item-deck tab with an orange wrench badge.
4. **There is no illustration anywhere.**
   - The fix: flat-ink poster art for each killer, Final Girl and location.
   - Use it on the spines, the box back, the strips, the chapter cards, the terror card backs and the end screen.
5. **First-run tips covered the hand.** Mostly fixed on `redesign-r2`. Still to check: the move tip goes in the tray, and the deck tip shows only after a Terror reveal.
6. **Rolls with no decision flash by in under a second, and the result never says you failed.**
   - Always run a dice beat of at least 900ms.
   - Stamp the result (2 STARS, 1 STAR, FAIL) and highlight the matching row on the card.
   - Show the options as the card's own icon rows.
7. **Decision states cover the map while the tray sits empty.** This affects react, rescue, search, planning, roll and the lifted card.
   - Put the decision object in the tray or the right rail, and keep the map visible.
   - React states the same fact four times; cut it to one.
   - Lift cards in place rather than as a big copy over the map.
8. **Prompt trays look like a web form.**
   - What's wrong: sentence-case text buttons over empty walnut, and a duplicated hint.
   - The fix: full-width 52pt keys stacked into the thumb zone, with icons and meeple badges.
   - Choice options should use the card's icon rows.
9. **Planning hides half the tableau behind an inner scroll in portrait.**
   - The fix: a 2-column grid of piles (or mini face-up cards) that shows all 10 piles.
10. **Stickers sit on top of stats.** This covers FINALE SOON, objectives, ASLEEP and WRATH, and is partly fixed on `redesign-r2`.
    - Give stickers a reserved slot. Never put one over a numeral or a chit.
11. **Tap targets.**
    - Header chits are 38pt and event sleeves 26pt; give them 44pt hit boxes.
    - With 10 cards, each card shows only about 30pt.
12. **Card faces clip at hand size.** For example "WA", "FO", Persuade and Close Call.
    - Use a hand-size layout and a one-line icon summary for text cards.
    - Add an overflow test.
13. **Reveals and playback.**
    - The turn chit reads the next turn during playback.
    - The terror card is too tall, and the "Tap to continue" pill should move to the primary-key slot.
    - Add a death beat and a victim-death sticker.
14. **Too little map on the iPhone SE in portrait.**
    - Merge the board-head chits into the killer strip.
    - Open zoomed on dense boards.
15. **End screen.**
    - The receipt label is fixed on `redesign-r2`.
    - Move the keys to the thumb zone, rename CREDITS to SCREENPLAY, add a richer recap, and keep the table metaphor.
16. **Smaller items.**
    - Dice are drawn three different ways.
    - Glyphs are cryptic: "+?" coin, the red diamond Dark Power card, the icon-only discard key.
    - The table grain reads as flat brown.
    - Non-interactive chips in the killer sheet look tappable.

## Suggested next steps

1. Optionally, re-run the critic workflow on `main` to get the official round-1 grade. Both finished reviewers (6 and 5.5) agree, though, so going straight to redesign #2 is reasonable.
2. **Build redesign #2 on `redesign-r2`.** Split the work into file-disjoint parts, each in its own worktree:
   - **board** (`src/ui/board/*`, `styles/board.css`, `film.ts`, plus a layout overlap test), covering items 1–3;
   - **poster art** (`src/ui/art/*`), then integrate it into the store, strips, title cards and end screen, covering item 4;
   - **tray and prompts** (`dock/*`, `styles/tray.css`), covering items 6–9 and 11;
   - **cards** (`cards/*`, `styles/cards.css`), covering item 12;
   - **strips, overlays and end screen**, covering items 10, 13, 15 and 16.
3. Merge, then run typecheck, tests, build, e2e and `shots.mjs` in both orientations. Commit and push to `main`.
4. **Run critic round 2.** Pass round 1's issues in `prev`. Stop if the lead grade is at least 8/10. Otherwise do redesign #3, which is the last try, and report the final grade either way.

## Conventions

- Commit as `Claude <noreply@anthropic.com>`. End every message with:
  - `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
  - `Claude-Session: https://claude.ai/code/session_01R3q4P3D1f7Xcy7RdzFUYjY`
- Never put model IDs in commits or PRs.
- Push straight to `main`. Don't open PRs unless asked.
- The game library entry keeps our own title, "Final Player".
- The style audit must stay clean in `src/ui`, `index.html` and `public/icon.svg`. It bans gradients, blur, `drop-shadow`, `backdrop-filter`, `filter:`, blurred shadows, cyan, Creepster or Barlow, emoji, and text glyphs such as ✓ ✕ ▸ ☠.
