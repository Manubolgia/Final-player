# Final Player UI audit: checklist for the redesign

Scope covered: every file in `src/ui` and `src/ui/components`, plus `styles.css`, `art/Icons.tsx`, `src/game/engine/state.ts`, the helpers in `types.ts`, `dice.ts`, `stats.ts`, `actionPhase.ts`, `effects.ts`, `combat.ts`, `board.ts` and the films that the UI depends on, all 12 screenshots in `shots/current`, the Coldwake CSS, `e2e/play.spec.ts`, `vite.config.ts`, `index.html` and `public/icon.svg`.

All paths below are relative to `/home/user/Final-player/` unless written in full.

---

## 1. Inventory: screens, sheets, overlays, dock states and prompts

### 1.1 Screens

| # | Screen | Source | What it contains today |
|---|---|---|---|
| S1 | Title / setup | `src/ui/App.tsx` L58–189 | <ul><li>Logo "Final Player" (L84, uses the Creepster font) and a tagline.</li><li>**Continue** button, shown only when a saved game exists and has no outcome (L86–90). It reads "Continue: FG vs Killer, turn N".</li><li>**Feature films** list of 6 (L92–102). Picking a film sets killer, location and the first Final Girl.</li><li>**Killer** grid of 6 (L104–115): emblem, name, health or "Can't be killed".</li><li>**Location** grid of 5 (L117–128): emblem, name, number of spaces.</li><li>**Final Girl** grid of 12 (L130–145): the same generic heart icon for everyone, name, health, blurb.</li><li>**Difficulty** toggle: Normal / Extreme Horror (L147–155).</li><li>Two checkboxes: Epic Dark Power and Signature items (L156–167).</li><li>**Start the night** button (L169–171).</li><li>**How to play** button, which opens the rules sheet (L173, L186).</li><li>**Back to the library**, only inside the mnbg library frame (L176–180).</li><li>Disclaimer line (L182).</li></ul> |
| S2 | Game | `src/ui/components/Game.tsx` L186–344 | Elements from top to bottom:<ul><li>**Top bar** (L188–205): menu button; "Turn N · Phase" with a "FG vs Killer · Location" subtitle; a cards icon with the Terror-deck count badge that opens the killer sheet; a scroll icon that opens the log.</li><li>**KillerPanel** (L207): tapping it opens the killer sheet.</li><li>**Map** (L209–217): `MapView`, a "Bigger map" expand button, and a "Tap a lit space" hint whenever spaces can be picked.</li><li>**PlayerPanel** (L219): tapping it opens the player sheet.</li><li>**Ticker** (L221–228): the last 2 log entries plus the one now playing.</li><li>**Dock area** (L230–241): one of three things — the busy bar, the prompt dock, or nothing once the game has an outcome.</li></ul> |
| S3 | End screen | `Game.tsx` L323–342; CSS L854–878 | <ul><li>"You survived" or "The End", the outcome text, and "Turn N · X saved · Y dead".</li><li>Buttons: Play again, Title, Log.</li><li>**Bug:** the Log button opens the log sheet *behind* the end screen (sheet z-index 30, CSS L681; end screen z-index 40, CSS L857), so nothing visible happens.</li></ul> |

### 1.2 Overlays

| Overlay | Source | Trigger and behaviour |
|---|---|---|
| Card reveal (`BigCard`) | `Game.tsx` L243–256, `cardFor` L27–58, `Cards.tsx` L41–51 | <ul><li>Shown for any log entry with `anim.kind === 'card'`.</li><li>Covers these decks: terror (or "Minor Dark Power" when the terror card has `minor`), event, darkPower, finale, item.</li><li>Playback stops until the player taps; "Tap to continue" is shown.</li><li>No reveal exists for action cards, even though `BigKind` has an `'action'` kind.</li></ul> |
| Hit flash | `Game.tsx` L104, L258; CSS L880–896 | Full-screen red flash when a victim dies (`victimDie`) or when the log text matches `/attacks you/`. |
| Error toast | `Game.tsx` L125–135, L259–265 | <ul><li>A `RuleError` (or any other `Error`) message shown for 2.2 s.</li><li>It is drawn inside an `.overlay` with `pointer-events: none`.</li></ul> |
| Big map | `Game.tsx` L267–288 | <ul><li>Full-screen map.</li><li>Tapping a space closes the big map, then goes through the normal tap routing.</li></ul> |
| Busy bar | `Game.tsx` L231–237 | <ul><li>Shown while the log is playing back.</li><li>Text: "Hans is coming…" during the Killer phase, otherwise "…" (always "…" for The Birds).</li><li>A **Skip ▸▸** button jumps to the end of the log. This also skips card reveals.</li></ul> |

### 1.3 Sheets

All sheets are bottom sheets built on `Sheet` (`Sheets.tsx` L11–25). They close by tapping the backdrop or the X button. There is no drag handle and no swipe to dismiss.

**Menu ("Paused")** — `Game.tsx` L295–321
- How to play
- Animation speed: slow / normal / fast
- Restart this film — **no confirmation**, the current game is lost immediately
- Back to the title

**KillerSheet** — `Sheets.tsx` L27–117
- Health, or "invulnerable", or the Birds count.
- Bloodlust track as about 12 full-width rows (L46–60). It uses emoji 🔪👢, marks the current row with "← now", and shows location bloodlust extras (Groves) and the "past the top" text.
- Killer action description, from `describeAction` (L167–188).
- Minion rules.
- Dark Power: the text, or "face down".
- Minor Dark Powers, with their health.
- Finale: the text, or "face down, N Terror cards left".
- Wrath tracks via `WrathBox` (L150–165).
- Boiler Room grid (L119–148).
- Killer rules and location rules.
- Events and terror cards in play.
- Terror cards played.

**PlayerSheet** — `Sheets.tsx` L190–247
- Health and Final Health token state, Time, Saved count.
- Rescue slots, or the Ultimate text once unlocked.
- Items: hand vs backpack, uses, text.
- Hand as a text list.
- Action tableau, drawn with non-interactive `ActionCard`s.

**ZoneSheet** — `Sheets.tsx` L249–282
- Tags for the space (exit, search, sacred, window, water, house, street, outside).
- Who is in the space (Final Girl, Killer, victims and special roles).
- Item deck size and its top card.
- Panic arrows, shown as "🎲 faces → space".

**LogSheet** — `Sheets.tsx` L284–302
- The full log grouped by turn.
- It opens at the **oldest** entry. The engine keeps at most 400 entries (`kernel.ts` L123).

**RulesSheet** — `Rules.tsx`
- Static rules prose: 5 phases, Horror, Moving, Killer, Attacking, Final Health, Tips.

### 1.4 Dock states

All in `Dock.tsx`:
- busy
- prompt is null: "…" (L21)
- `main`: normal or strike mode
- `roll`, with sub-modes none / convert / lucky / close1 / sister
- `move`
- `choice`
- `planning`
- `react`
- `rescue`: slot mode or ultimate mode
- `search`
- `arrange`: optional or forced
- `discardDown`

### 1.5 Every prompt: what the player must see and what they can send

The Prompt union is in `state.ts` L115–153 and the Input union in L157–181. The engine handlers I checked are in `actionPhase.ts`, `dice.ts`, `combat.ts`, `effects.ts` and `kernel.ts`.

#### `main` — Action Phase menu

Normal mode comes from `mainPrompt`, `actionPhase.ts` L123. Strike mode is the Creech Manor forced strike, L197.

**Prompt fields**
- `playable[]` entries of `{card, weapons: itemUid[], needsWeapon}`
- `items[]` entries of `{uid, action, label}` (includes extra actions such as "Pry the trap off your leg")
- `ultimate: label | null`
- `canRescue`
- `strike?: 'victims' | 'enemy'`

**Inputs**
- `play {card, weapon?}`. `weapon` must be in `weapons`. When `needsWeapon` is set, a ranged weapon is required.
- `discardForTime {cards[]}`. The engine accepts **several** cards at once. Each card gives +1 Time, or +2 with Sheila's Ultimate.
- `item {uid, action}`
- `ultimate`
- `rescue` (pushes the rescue prompt)
- `endPhase`
- In strike mode only `play` (attack cards only) and `endPhase` ("Don't strike") are accepted. The UI already hides discard in that mode.

**What the player must see**
- The whole hand, with playable and unplayable cards marked, and *why* a card can't be played (wrong timing, needs an enemy, needs a search space, and so on).
- On each card: name, cost, timing (action / reaction / after-roll) and the **result table** (3+, 2+, 1, fail, and the "— or —" alternatives). Use `card(id).results` with `describe()`.
- Current Time, and how many dice the roll will use. `diceCount(g, purpose, false)` in `dice.ts` L17 can preview this; first confirm the `diceMods` are free of side effects.
- For attack cards: the weapon picker (bare hands, or each eligible weapon by item name).
- Item action list, the Ultimate button, "Save victims" when standing on a rescue space with rescuable victims, and End turn.
- In strike mode: an explanation that each damage point kills a victim here ('victims'), or that damage goes to the thing in your space ('enemy').

#### `roll` — Horror roll

Comes from `dice.ts` L77–150.

**Prompt fields**
- `purpose`: action card, reaction card, item `{id, uid}`, or effect `{label}`
- `dice[]`, `converted[]` (indices), `auto34`
- `convertible`, `canCloseCall`, `canLucky`, `canSister`
- `successes`

**Inputs**
- `convert {die, discard: exactly 2 hand cards}` — the die must be an unconverted 3 or 4.
- `closeCall {die?}` — consumes a Close Call card from the hand. With `die` it rerolls one die; without it, it rerolls all dice for −2 Time.
- `lucky {dice[]}` — Lucky Die or Super Lucky Dice item. Super Lucky triggers its own roll to decide whether the item is kept.
- `sister {die}` — rerolls one die for −2 Time.
- `confirm`

**What the player must see**
- Each die face and its state: success (5–6, converted, or 3–4 under `auto34`), partial (3–4), or fail.
- The success count.
- The outcome line for that count from the card's results, including alternatives.
- Which modifiers are available and what each costs (a card, Time, an item).
- The hand, so two cards can be picked when converting.
- The roll's title (card name, effect label, or "Horror roll").

#### `move`

Comes from `actionPhase.ts` L391–406.

**Prompt fields**
- `remaining`, `to[]`
- `followers[]` (victim ids allowed to follow), `followLimit` (2 ± events and items)
- `mode`: walk / free / boat / persuade / panic
- `canStop` (walk and persuade only), `title`

**Inputs**
- `moveTo {zone, bring[]}` — `bring` must be a subset of the victims in the current space.
- `stop`

**What the player must see**
- Lit destinations on the map, tappable.
- The moves left.
- Which victims can come along (special roles named), with toggles capped at `followLimit`.
- "Stay here" when `canStop` is true.
- The title, which differs by mode.

#### `choice`

Comes from `kernel.ts` L139/L211. There are 107 call sites across the engine and films.

**Prompt fields:** `title`, `detail?`, `options[]` entries of `{id, label, detail?, zone?}`.

**Input:** `choose {id}`.

**What the player must see**
- The question, the detail text, and every option with its own detail. For example, "Take which action card?" gives the full card text as the detail.
- Options that carry a `zone` must be lit and tappable on the map.

Kinds of choice that occur:
- yes / no
- tie-breaks between spaces
- action card picks
- item discards
- Paula's die pick
- golf-cart riders and destination
- birds placement
- Knives damage split
- Out of Order signs
- card picks by cost ("That's enough" ends it)

Some lists are long: for example "Go to any space" has about 20 options.

#### `planning`

Comes from `phases.ts` L131–135 and `actionPhase.ts` L568–588.

**Prompt fields:** `buyable[]`. A card is buyable when its count is above 0, its **actual** cost `cost(g, c)` is above 0 and within the Time left, and the hand has fewer than 10 cards.

**Inputs:** `buy {card}` (one at a time) and `endPlanning`.

**What the player must see**
- The tableau with the remaining count and **actual** cost of each card. The Creech finale "Nothing Easy" turns cost 0 into 1.
- Which cards are affordable, the Time left, and the hand size out of 10.
- Card details.
- That cards played this round are out until the round resets, and that zero-cost cards came back for free. Those free returns are log lines before the prompt.

#### `react` — the player is attacked

Comes from `combat.ts` L541–567.

**Prompt fields:** `damage`, `by` (enemy name), `cards[]` (reaction cards in hand), `items[]` (`ItemAction`s that can react).

**Inputs:** `react {card}` (then a reaction roll follows), `reactItem {uid}`, `takeHit`.

**What the player must see**
- The attacker and the damage.
- The resulting health, and whether the hit reaches the Final Health token.
- Reaction cards with their result tables (Guard and similar).
- Item reactions, and "Take the hit".

#### `rescue`

Comes from `actionPhase.ts` L477–491.

**Prompt fields:** `victims[]` (rescuable victims here; the engine already filters out the werewolf and the cursed unless last), `slots[]` (free slot indices), `ultimate`.

**Inputs:** `rescueOne {victim, slot}` (slot is ignored when `ultimate` is true) and `rescueDone`.

**What the player must see**
- The victims here, with special roles told apart.
- The Final Girl's rescue card: every slot's reward text, filled and empty slots.
- After the Ultimate, the per-save reward (`fg.extraText`).
- Events that affect rescues, such as Clingy Campers (health cost).

#### `search`

Comes from `effects.ts` L355–372. The prompt only appears with two or more cards drawn.

**Prompt fields:** `drawn[]` (item ids).

**Input:** `searchPick {keep: index, otherTo: 'top' | 'bottom'}`. "Top" goes back face up; "bottom" goes face down.

**What the player must see:** each item as a card (name, text, hands, range, damage, uses), the "keep" choice, and where the rest go.

#### `arrange` — items in hands

Comes from `effects.ts` L373–397.

**Prompt fields:** `optional`.

**Input:** `arrange {inHands[] uids}`. The total `hands` must be at most 2, and items with `hands === 0` are not allowed.

**What the player must see**
- Every item with `hands > 0`, its hand cost (1 or 2), and the two-hand capacity.
- Which items are in hands and which are in the backpack.
- **A warning that a `noBackpack` item left out of the hands gets discarded.** The current UI never warns about this.

#### `discardDown`

Comes from `effects.ts` L398–410.

**Prompt fields:** `excess`.

**Input:** `discardDown {cards[]}` with exactly `excess` cards.

**What the player must see:** the hand, a way to pick exactly N cards, and the hand limit of 10.

### 1.6 Interactions outside the prompt dock (all must survive the redesign)

- Tap a card reveal to continue.
- Skip the playback.
- Tap a space to inspect it (ZoneSheet) when that space isn't a prompt target.
- Open the killer board, player board and log.
- Menu: rules, speed, restart, quit.
- Bigger map.
- End screen: play again, title, log.
- Continue a saved game.
- Return to the library.

### 1.7 Test hooks a redesign must keep, or else update `e2e/play.spec.ts`

`e2e/play.spec.ts` runs at 390×844 portrait only and depends on:
- Classes: `.logo`, `.film-card`, `.panel`, `.overlay` (clickable, without `pointer-events: none`), `.dock`, `.dock h4`, `.dock .btn`, `.acard`, `.acard.sel`, `.acard.off`, `.slot`, `.slot.full`, `.btn.small`, `.btn.small.good`, `.opt`, `.btn.primary`, `.btn.good`, `.end-screen` (plus its `p` and `.muted`).
- Button text: "Start the night", "Skip", "End turn", "Don't strike", "Done", "Buy", "Discard", "Play …".
- Header texts beginning "Too many cards" and "discard N".

---

## 2. Game information the UI must be able to show

For each item: the physical-game equivalent, where the current UI shows it, and the gaps. **Bold "Gap"** marks information that is missing or hidden on the main screen.

### 2.1 Killer — the Killer board

**Identity**
- Physical: killer board art.
- State: name and title (`k.name`, `k.title`), `k.color`, `k.icon`.
- Today: KillerPanel.

**Health**
- State: `killer.health.hp`, plus `token` (black: face-down Final Health still to come; white: already back once).
- Invulnerable (Poltergeist: ∞). Bodiless (Birds: no health; birds count instead).
- Today: KillerPanel shows hp and a "+?" at 12 px in the dim color (`Panels.tsx` L41).
- Physical: health tokens.
- **Gap:** there is no clear "last health" or Final-token state on the main screen.

**Bloodlust track** (the most important board element in the physical game)
- State: `killer.bloodlust` index; each space has attack (`sp.attack`), move (`sp.move`), effects (+Horror, draw an Event), and a Dark Power space.
- `k.maxText` is the "past the top" text.
- Groves adds `loc.bloodlustTrack` extras (index − 1).
- Physical: a marker climbing a track.
- Today: the main screen shows only the current attack and move numbers. The track exists only in the sheet, as 12 rows.
- **Gap:** no track position and no "next space" on the main screen.

**Killer Action**
- Physical: the Killer Action card.
- State: `k.action` and `k.minionAction`; after the Finale, `fin.action` and `fin.minionAction`.
- Today: the sheet, as text.
- **Gap:** no "what he does next" on the main screen.
- Opportunity: `closestVictims` and `shortestPaths` in `board.ts` could preview the killer's target.

**Dark Power**
- Physical: face-down card, flipped later.
- State: `killer.darkPowers[]` entries of `{id, revealed}`; epic variants exist.
- Today: chip "Dark Power ?" or the power's name.
- Bug: `Panels.tsx` L57 always shows `dp[0]`'s name, even when a different power is the revealed one.

**Finale**
- Physical: face-down card, flipped when the Terror deck empties.
- State: `killer.finale`, `finaleRevealed`.
- Today: chip once revealed. Before that, "N Terror cards left" appears only in the sheet.

**Minor Dark Powers**
- Physical: cards with health tokens.
- State: `killer.minors[]` entries of `{id, hp}`.
- Today: chips "Name ♥hp".

**Minions** (Puppets, Birds)
- State: `g.minions[]` `{id, zone, hp, hit}`; `minionPool` ready/exhausted; `k.minion` def (name, plural, count, hp, attack, text).
- Today: purple 5×8 px rectangles on the map; birds as glyphs, at most 3.
- **Gap:** minion health is not shown; the pool size is not shown.

**Wrath** (Groves)
- State: `wrath.killer`, `wrath.divine` (levels 1–10, each with text); `k.wrath` and `loc.wrath`.
- Today: chips "Wrath N" and "Divine N"; the level table is in the sheet.

**Dr. Fright** (Maple)
- Asleep / awake: `film.maple.asleep`.
- Boiler Room: `boilerView(g)` gives cells `{x, y, card, fright}` and `left`.
- Also `film.maple.blurred`, `film.maple.offBoard` (killer not drawn), and `spareTokens` (Nancy).
- Today: chips "Asleep · n/4" or "You're awake" and "Blurred"; the grid is in the sheet.
- **Gap:** `spareTokens` is not shown.

**The Birds**
- Birds on the board, survivors `film.birds.saved / total / hidden`, birds per space out of 3, and the lose condition.
- Today: panel shows the bird count and saved/total.
- **Gap:** the objective is not stated anywhere on the game screen.

**Creech Manor**
- Locked connection `film.creech.lock` (drawn as a red dashed edge).
- Strike mode.
- The helicopter hidden zone appears with its token.
- Carolyn and Mr. Floppy are *items*, so they appear only as item chips.
- **Gap:** the win condition "escape with Carolyn" is not shown on the main screen.

### 2.2 Final Girl — player board and character card

**Health**
- State: `fg.health.hp / max`, plus `token` (black or white).
- Today: "5/5" in the PlayerPanel.
- **Gap:** the Final Health token state is shown only in the sheet.

**Time**
- State: `fg.time`; the start value and maximum (12 normal) come from `BOARDS[board]`.
- Physical: an hourglass track running 0–12.
- Today: a number; negative shows as "−".
- **Gap:** no track and no maximum shown.

**Horror track**
- State: `fg.horror` index 0–7. Each space has dice 3/3/2/2/2/2/2/1 on Normal (Extreme differs) and a killer start label 1–6. Going below the green space gives +1 Time; going above red gives +1 Bloodlust.
- Today: track of 12×16 px boxes with 10 px dice numbers (`Panels.tsx` L101–110).
- **Gap:** it is illegible and never explained.

**Dice for the next roll**
- State: `diceCount(...)` combines horror dice, adrenaline (`adrenaline(g)`), Planning bonus `mods.bonusDice`, Girlfriend +1, Reiko's Axe, film modifiers, Better Stay Awake `mods.minusDicePhase`, and Alice's 5 dice.
- **Gap:** never shown before a roll.

**Status modifiers**
- `mods.partialsNext` / `mods.partialsPhase` (3–4 counts as a success), `mods.skipNextAction`, `mods.timeAtNextAction`.
- Carnival: `fg.legTrap` (blocks moving; "Pry the trap" action) and `fg.cobra` (lose 1 health each Upkeep).
- **Gap:** none of these is shown anywhere in the UI.

**Hand**
- State: `fg.hand` (limit 10).
- Today: the dock in the main / roll / react / discard prompts; a text list in the sheet.
- **Gap:** the hand count is shown only during Planning.

**Items**
- State: `fg.items[]` `{uid, id, inHands, uses}`; item defs give name, text, hands 0/1/2, range, damage, uses, noBackpack.
- Physical: two hand slots and a backpack.
- Today: chips (12 px) on the PlayerPanel, where in hand vs backpack differs only by border color.
- **Gap:** item text is in the sheet only.

**Rescue card**
- State: `fg.slots[]` booleans; `fgDef.slots[].text` rewards; `fg.saved`; `fg.ultimate` (and `fgDef.ultimate.text`, `extraText`).
- Physical: the character card flips to its Ultimate.
- Today: "Saved n/m" or "Ultimate!".
- **Gap:** rewards are visible only in the sheet and the rescue dock.

**Action tableau**
- State: `tableau` (card → count) and `actionDiscard` (played this round).
- Physical: cards laid out by cost.
- Today: the Planning dock and the sheet.

### 2.3 Board — location board and tokens

**Spaces**
- `loc.zones` with x/y in 0–100 (converted with `zonePoint`, y divided by `aspect`), names, and flags: exit, search (+ `deck`), sacred, window, water, house (drawn as a square), street, outside, floor, landmark (larger), hidden.
- Location sizes: Happy Trails 18 spaces, Creech 22 (including the helicopter), Carnival 17, Maple 21, Groves 19. Board aspect is about 1.11–1.13.

**Connections and panic arrows**
- Each `panic[]` entry is `{to, faces}`. Edges can be one-way (draw an arrowhead).
- Blocked edges come from `g.blocked` and the Creech lock.
- The Secret Tunnel `g.tunnel` (Happy Trails) links distant spaces for the Final Girl. **Gap:** today it appears only as "TUNNEL" token labels, never as a link.

**Item decks**
- `itemDecks[deck]` entries of `{id, up}`: count, and whether the top card is face up (showing its name).
- Today: an orange or brown square with the count. **Gap:** the face-up card's name is shown only in the ZoneSheet.

**Tokens**
- 24 token kinds in `TOKEN_GLYPH` (`MapView.tsx` L40–65): bearTrap, fireworks, motorboat, darkWaters, tunnel, skull, helicopter, brokenLadder, ropeLadder, padlock, closed, fireBrimstone, sacredGround, acidTrap, netTrap, sawTrap, golfCart, policeCar, mlFire, barrier, bicycle, boobyTrap, searched, outOfOrder.
- The padlock has a `to` and sits **on a connection**. MapView ignores `t.to` (L253–267).

**Final Girl standee**
- `fg.zone`. Today: a 2.1-unit cyan circle with an initial letter.

**Killer standee**
- `killer.zone`. Hidden for the Birds and for Maple off-board (L123).

**Victims**
- `g.victims` `{id, zone, role}`, `victimPool` (left in the box), `g.dead` (count shown only at the end).
- Special roles (13): boyfriend, girlfriend, cursed, superTourist, holyMan, tourGuide, fiance, sister, werewolf, ghostHunter, mlBoyfriend, smalley, survivor.
- Names come from `victimName`.
- Today: role dots of r = 0.8 (about 6 px) with no legend. `survivor` has no color entry in `VICTIM_COLORS` (L25–38).

### 2.4 Decks, cards in play and the log

**Terror deck**
- `terrorDeck.length` (the game's clock: when it is empty, the Finale arrives), `terrorDiscard`, `activeTerror` (stays in play).
- Today: a badge on an ambiguous cards icon. **Gap:** `activeTerror` appears only in the sheet.

**Events**
- `eventDeck` count, `activeEvents` (persistent), `eventDiscard`.
- **Gap:** active events appear only in the sheet's "In play" section, so a player easily forgets them (Clingy Campers, Girlfriend). The event deck count is never shown.

**Item discard**
- `itemDiscard`. Not shown; low priority.

**Turn and phase**
- `turn`, `phase` (setup / action / planning / killer / panic / upkeep), `setupName`, `config.board`.
- Today: top bar plus gold ticker lines. **Gap:** the setup name is not shown.

**Log**
- `log[]` entries `{n, turn, phase, text, tone (info/good/bad/killer/phase), anim}`.
- Animation hints: `dice {faces}`, `killerMove {path, minion?}`, `fgMove {path, victims?}`, `victimMove {victim, path}`, `victimDie {zone}`, `card {deck, id}`.

**Outcome**
- `outcome {winner, text}`, plus `fg.saved` and `dead.length`.

---

## 3. iPhone UX problems, ranked

### P0 — breaks play or is very disorienting

1. **Landscape is unplayable.**
   - `.app` is `height: 100dvh; overflow: hidden; max-width: 600px` (`styles.css` L65–74). The map has `min-height: 200px` (L429), the panels and ticker have fixed heights, and the dock has `max-height: 52dvh` (L509).
   - At 390 px tall the dock ends up **below the fold and cannot be scrolled** (`landscape-03-game.png` has no dock at all). `landscape-04` only shows it because Playwright scrolled it into view programmatically.
   - The ticker lines are cut through the glyphs (`landscape-05`).
   - The 600 px column leaves about 122 px of empty black on each side, while the map gets about 200 px of height.
   - The manifest forces `orientation: 'portrait'` (`vite.config.ts` L33).

2. **The layout jumps on every action.**
   - The dock's height changes with each prompt and with the busy bar (`Game.tsx` L230–241). The map is `flex: 1`, so it **resizes and moves**: compare `portrait-03` (map at y ≈ 165–460 pt) with `portrait-05` (y ≈ 245–540 pt).
   - The "table" never stays put.

3. **Playback replays text over the final state.**
   - Only the killer's position is interpolated (`Game.tsx` L139–167).
   - The Final Girl, victims, health, bloodlust and tokens already show their end-of-action values while the log is still playing.
   - `fgMove` is never animated: it falls through to the 70 ms default (L96–102).
   - Minion moves are not tweened (L146 checks `!a.minion`).
   - `dice` animations never draw dice; they only pause 520 ms while the ticker shows "Horror roll: 5 6".
   - `victimMove` only animates 2-step paths (L164).
   - As a result the Killer and Panic phases feel like things "just happen" with no readable cause and effect.

4. **The map is illegible and hard to tap at phone size.** Measured on Happy Trails: the viewBox is about 94 units wide, so a 374 px map gives about 3.96 px per unit in portrait.

   | Element | Source | Size in portrait | Size in current landscape |
   |---|---|---|---|
   | Zone names (2.4 units) | `MapView.tsx` L240 | ≈ 9.5 px | ≈ 6.5 px |
   | Panic labels (2.25 units) | L164 | ≈ 9 px | ≈ 6 px |
   | Token labels (1.8 units) | L262 | ≈ 7 px | ≈ 5 px |
   | Special-victim dots | L282 | ≈ 6 px | — |
   | Minions | L307 | 5×9 px | — |
   | Zone tap targets (r 3.4 / 4.3, L120) | — | 27–34 px | 18–23 px |

   Further problems:
   - Panic labels sit at both ends of every edge and collide with names: the screenshots show "1-North Trail", "1-North Woods", "Lakeside1-4 Cabin" and "Northwest-4 Woods", with labels stacked on top of "Utility Shed".
   - Only one-way edges get arrowheads (L182–183), so the direction of a label is guessed from where it sits.
   - The tap handler is a `<g onClick>` covering only the circle and the text glyphs (L215).
   - There is no pinch or pan: the SVG has `touch-action: none` (CSS L440).
   - In portrait "Bigger map" is only about 4% bigger (map width 374 → 390 px; `Game.tsx` L267–288), and tapping a space in it closes it.
   - `preserveAspectRatio meet` in a `flex: 1` box letterboxes the map with large empty black bands (`portrait-02` and `portrait-05` waste about 150 pt).

5. **Victims are left behind by default.**
   - When a move prompt opens, `bring` is set to followers that *have a special role* (`Game.tsx` L75–79: `.filter(... v.role)`).
   - Tapping a lit space therefore moves the Final Girl **without** ordinary victims, which is the main way to rescue.
   - The follower chips all read "Victim" (`Dock.tsx` L338).

### P1 — wrong information density, too many taps, poor feedback

6. **Feedback is a 2-line ticker with ellipsis** (`Game.tsx` L180, L221–228; CSS L472–487 `white-space: nowrap; text-overflow: ellipsis`).
   - Long lines such as "Event: … text" are cut off.
   - There is no on-screen history.
   - Phase changes show only as gold text; there is no phase banner or phase track.
   - **Skip** jumps past card reveals as well (`Game.tsx` L119–123), so drawn Terror and Event cards are never seen.

7. **Important state is hidden in sheets.**
   - Bloodlust position and next space, killer action, Dark Power text, Finale countdown, events and terror cards in play, rescue rewards, item texts, hand size, Final Health token, objective / win condition, mods, leg trap and cobra (see §2).
   - The Terror deck lives behind an unlabeled cards icon with a badge (`Game.tsx` L198–201). Its `aria-label` says "Terror deck", but it opens the killer sheet.

8. **The hand is cramped.**
   - Cards are 92–100 × 118–128 px with 11–12 px text cut to 120 characters (`Cards.tsx` L35–37; CSS L531–571, L916–924).
   - Results are written as one prose line, not as the real card's three-row result table.
   - The hand scrolls sideways with nothing showing that more cards exist: about 3.6 of 6 are visible (`portrait-03`).
   - Unplayable cards are dimmed to 55% with no reason until tapped (`Dock.tsx` L119; the reason is at L163).
   - Selecting a card repeats its text below the hand (L130–134).
   - Playing takes 2 taps (select, then Play).
   - "Discard +1 Time" works on one selected card at a time, although the engine accepts several (`Input.discardForTime.cards[]`).
   - There is no dice preview.

9. **Text is small and low-contrast.** The base font is condensed Barlow at 17 px, but much of the UI is far smaller:

   | Element | Source | Size |
   |---|---|---|
   | Chips | CSS L367–375 | 12 px |
   | Horror track | L400–410 | 10 px |
   | Deck badge | L298–312 | 12 px |
   | Panel subtitles | L343–349 | 13 px |
   | Section titles | L165–171 | 13 px, letter-spaced |
   | Card text | L567–571 | 11 px |
   | Bigcard kind | L605–611 | 12 px |

   Contrast is poor too: muted `#a99094` on `#1a0c10`, and dim `#6f5a5e` (CSS L11) on the panel color — the "+?" in `Panels.tsx` L41 is about 2.6:1, which fails WCAG.

10. **Tap targets are below 44 pt.**
    - `.btn.small` is 34 px (CSS L108–112) and is used for follower, weapon and rescue-victim picks.
    - `.map-tools` buttons are 36 px (L450–459).
    - Each panel is one big button, so its chips and track are not separately tappable.
    - Map zones are 18–34 px (see #4).

11. **The title / setup screen is one long scroll** (`App.tsx` L81–185).
    - "Start the night" is about 3 screens down, below 6 film cards, 6 killers, 5 locations, 12 Final Girls, difficulty and 2 toggles.
    - Picking a film does nothing visible beyond highlighting it.
    - The mix-and-match grids are always expanded.
    - All Final Girls use the same Heart icon (L135).
    - In landscape only about 1.5 film cards fit on screen (`landscape-01`).

12. **Planning is awkward** (`Dock.tsx` L362–396).
    - The whole tableau (up to 23 card types) wraps into rows inside a dock capped at 52dvh, which means scrolling inside a scroll.
    - Cards are not sorted by cost.
    - The displayed cost is the base `card().cost` (L385; `Cards.tsx` L27), not `cost(g, c)`. The `costOverride` prop exists but is never passed.
    - Buying takes 2 taps per card.

13. **Roll options are hard to find** (`Dock.tsx` L209–315).
    - Converting a 3 or 4 means tapping the die, which is only mentioned in a hint line (L284).
    - The Close Call buttons don't say they use up the card.
    - Dice are 46 px and sit inside the dock, not on the table.
    - There is no tumble or settle moment beyond a CSS spin (CSS L758–768).
    - "Accept" is the only primary button.

14. **Sheets.**
    - No drag handle or swipe to close (`Sheets.tsx` L11–25).
    - The Bloodlust "track" is 12 rows of 44 px with emoji (L46–60), instead of a compact horizontal track.
    - The LogSheet opens at the oldest entry (L284–301).
    - The ZoneSheet is reachable only by tapping a space that isn't a current target.
    - The big map closes after each tap (`Game.tsx` L280–283).

15. **Broken or risky end and menu flows.**
    - The end screen's Log button opens the log behind the end screen (see S3).
    - "Restart this film" has no confirmation (`Game.tsx` L311–314).
    - The busy bar text is "…" for most phases (L233).

16. **React dock** (`Dock.tsx` L46–69).
    - The primary red button is "Take N damage", the do-nothing option.
    - No preview of the resulting health or of reaching the Final Health token.
    - Reaction cards are tiny paper cards in a scrolling row.

17. **Rescue dock** (L400–438).
    - Two steps: pick a victim chip (shown only when special roles are present), then a slot.
    - Slots are dashed 14 px boxes.
    - There is no link to the Final Girl card's look.

18. **Search and Arrange docks.**
    - Search uses radio rows, then the destination buttons submit, phrased as a question (L457–465).
    - Arrange uses ✋/🎒 emoji (L488).
    - Arrange gives **no warning** when a `noBackpack` item will be discarded.
    - Arrange items that don't fit are only `disabled`, with no reason given.

19. **Choice dock** (L29–43).
    - Long option lists, about 20 for "Go to any space", scroll inside the dock.
    - Zone choices are duplicated as list buttons and lit spaces, with no tie between them (the list doesn't highlight the space when you touch a row).

20. **iOS feel.**
    - No `user-select: none` or `-webkit-touch-callout: none`, so long-pressing a card selects text or opens the callout.
    - No sound.
    - No haptics are possible on iOS web, which is all the more reason for strong visual feedback.
    - Only `.btn` and `.opt` have `:active` feedback.
    - `.app` bottom padding is 0, so the safe area is handled only by the dock and sheets.
    - `Prefs.seenHelp` exists but is never used: there is no first-run guidance.

21. **Accessibility.**
    - Map spaces are `<g onClick>`: not focusable, no role, inside `<svg role="img">` (L129, L215).
    - Space types are told apart only by stroke color (exit green, search orange, window cyan, sacred purple) with no legend (L210).
    - Ticker tones are color only.

22. **Wasted chrome.**
    - The top bar uses about 50 pt for "TURN 1 · ACTION" plus the matchup subtitle, which repeats the ticker's phase line.
    - The killer and player panels are separate bordered boxes with large margins.
    - The ticker reserves 40–64 px.

---

## 4. Visual-style problems: what reads as "AI-ish" and Coldwake-like

### 4.1 Gradients, glows and blurred shadows (all must go)

**`src/ui/styles.css`**
- L52–56: `body` uses `radial-gradient(120% 60% at 50% 0%, #2a0c12, transparent)`.
- L95–100: `.btn.primary` uses `linear-gradient(180deg, #e3303c, #a3141f)` plus a `text-shadow`.
- L153–156: `.logo` has a `text-shadow: 0 0 18px #ff1e2d77, 0 3px 0 #4a0007` neon glow.
- L204–208: `.pick.on` uses `linear-gradient(180deg, #3a1118, #22090e)` plus `box-shadow … 0 0 18px #ff1e2d33`.
- L239–244: `.film-card` uses `linear-gradient(160deg, panel2, panel)`.
- L411–415: `.track span.on` has a `box-shadow: 0 0 8px #ff2b3a99` glow.
- L505–511: `.dock` uses `linear-gradient(180deg, #170a0d, #0e0608)`.
- L601: `.bigcard` has `box-shadow: 0 18px 50px #000c` (blurred drop shadow).
- L621–645: five bigcard kinds each use a `linear-gradient(170deg, …)` (terror, event, darkPower, finale, item).
- L746–750: `.die.win` has a `box-shadow: 0 0 10px #3ccf6b88` glow.
- L854–859: `.end-screen` uses `radial-gradient(80% 60% at 50% 40%, #3b0910ee, #000f)`.
- L868–878: `.end-screen .big` has text-shadow glows (red, and cyan `#79e2ffaa` on a win).

**`src/ui/components/MapView.tsx`**
- L131–134: `<radialGradient id="ground">` fades the location color to near black; used at L142.
- L135–137 and L361: `<filter id="glow">` with `feGaussianBlur` for the death bloom.
- L216: cyan selection pulse, `fill="#79e2ff33" stroke="#79e2ff"`.
- L163, L261: translucent pills (`#0b0507cc`, `#000c`).

**`public/icon.svg`**
- L3–5: radial-gradient background, which is also baked into the PNGs generated by `scripts/icons.ts`.

### 4.2 Palette and color

- `styles.css` L1–24 is a generic "dark theme": near-black reds `--bg #0b0507`, `--bg2 #12080b`, `--panel #1a0c10`, `--panel2 #231116`, hairline borders `--line #3d1e25` and `--line2 #5a2b34`, one hot accent `--blood-hi #ff4552`, plus a neon rainbow for chips and tones.
- **Cyan `--fg: #79e2ff` (L13) is effectively Coldwake's `--cyan #5ce1e6`.** It is used for:
  - the Final Girl token (`MapView.tsx` L325)
  - the selection pulse (L216)
  - the Hourglass default color (`Icons.tsx` L36)
  - the Hand default color (L97)
  - the Person icon in both panels (`Panels.tsx` L31, L82)
  - `.die.sel` (CSS L756) and `.chip.hand` (L393)
  - the win glow (L877)
- The Poltergeist's killer color is also cyan (`#9be7ff`).
- Inline hard-coded dark fills: `Game.tsx` L261 (`#300`), L268 (`#000`); `Sheets.tsx` L49 and L158 (`#3a1118`); Boiler Room fills (L136).
- `index.html` theme-color is `#0b0507`.

### 4.3 Typography

- **Creepster** (`main.tsx` L1; CSS L30) is the stock "dripping horror" font. It is used for the logo (L148), film titles (L246), sheet titles (L697) and the end screen (L869). It is the cliché that makes the app look templated.
- **Barlow Condensed** (L29) is used for everything else, including 11–13 px body text, where a condensed face hurts legibility.
- Uppercase letter-spaced "eyebrow" labels — `.section-title` (L165–171), `.bigcard .kind` (L605–611), `.topbar .phase` (L267–274) — are the same pattern as Coldwake's `.eyebrow`.

### 4.4 Generic UI patterns

- **Box soup:** the same rounded dark rectangle with a 1 px hairline border and 9–18 px radius everywhere: `.btn` (L78–87), `.pick` (L177–187), `.film-card`, `.icon-btn` (L283–297), `.panel` (L314–325), `.map-wrap` (L427–435), `.opt` (L781–788), `.slot` (L803–811), `.sheet-body` (L688–695).
- Colored-border pill chips: `.chip.dp`, `.fin`, `.ev`, `.it`, `.hand` (L367–394).
- Emoji mixed with the SVG icon set: 🔪👢 (`Sheets.tsx` L50), 🎲 (L273), ✋🎒 (`Dock.tsx` L488); ☠ ✓ ✕ ▸ as text glyphs.
- Tokens drawn as a letter in a circle ("L", "H"; `MapView.tsx` L325–340) instead of something that reads as a standee or meeple.
- Dead CSS: `.items-row`, `.item-tile` (L819–840) and `.skip` (L898–903) are never used.

### 4.5 Why it reads as Coldwake

Coldwake source: `/tmp/claude-0/-home-user/f162495e-1d49-5057-a91b-ee2f08d08edc/scratchpad/ext/coldwake/src/ui/styles.css`. "FP" below is this app's `styles.css`.

| Similarity | Final Player | Coldwake |
|---|---|---|
| Same token names | `--bg/--bg2/--panel/--panel2/--line/--line2/--text/--muted/--dim` (FP L2–10) | same names (L11–20) |
| Same safe-area variables (`--safe-t/--safe-b` via `--mnbg-safe-*`) | FP L25–28 | L35–36 |
| Same class vocabulary | `.app`, `.title-screen`, `.logo`, `.tagline`, `.btn.primary`, `.btn.ghost`, `.icon-btn`, `.chip(s)`, `.sheet`, `.die.sel`, a flash overlay | the same names |
| Gradient primary button | FP L96 | L91 |
| Glowing selected card | FP L207 | `.role-card.sel` L166 |
| Radial-gradient map backdrop | `MapView.tsx` L131 | `.railmap` L234 |
| Color-bordered chip family | FP L376–394 | L347–351 |
| Glowing end-screen title | FP L868–878 | L781–783 |
| Red hurt flash | FP L880–896 | `.hurt-flash` L811 |
| Near-black base plus one neon accent, with cyan as the "player" color | FP L13 | `--cyan` |
| Same skeleton | HUD bar → map card → bottom drawer → bottom sheets, in one centered column | same (Coldwake column max 760 px; FP max 600 px, L67) |

---

## 5. What to reuse and what to rewrite

### 5.1 Reuse as-is

- **The whole engine, `src/game/**`.** It is independent of the UI and its public API is `newGame`, `act` and `RuleError` (`src/game/index.ts`). Helpers worth wiring into a richer UI:
  - `diceCount` (dice preview)
  - `describe` (effect text)
  - `cost(g, c)` (actual card cost)
  - `bloodlustSpace`, `killerAttack`, `horrorDice`, `horrorLabel`, `adrenaline`
  - `boilerView`, `victimName`, `zoneName`
  - `itemDef`, `terrorDef`, `eventDef`, `zoneDef`
  - `adjacent`, `distances`, `shortestPaths`, `closestVictims` (to preview the killer's target and path)
  - `BOARDS` (horror track labels and dice, start and max Time)
- **`src/ui/persistence.ts`**: save, load and prefs. Extend `Prefs` if needed (layout or orientation preference, handedness, a working `seenHelp`).
- **`src/ui/library.ts`**: library-frame integration.
- **`src/ui/main.tsx`**: keep the service-worker registration; swap the font imports.
- **Game flow in `App.tsx`**: the start / continue / restart / quit logic and saving on every change (L12–56). Only the `Title` UI needs replacing.

### 5.2 Reuse the logic, rewrite the presentation

**Playback system in `Game.tsx` L61–135**
- Reuse: the `played` / `cur` cursor, the requestAnimationFrame tween `t`, the speed setting, `skip`, wait-for-tap on card entries, and `send()` with error toasts.
- Pull these into a `usePlayback` hook.
- Fix the gaps:
  - tween `fgMove` and minion moves
  - show dice for `dice` animations
  - draw state as it was at the time of the playing entry, not the final state
  - make skip stop at cards (or show "last card drawn")
  - add a phase banner

**Map effects and targets in `Game.tsx`**
- `fx` computation (L139–167): killer interpolation along the path, the trail, deaths, the runner, and the "next killer move start" trick.
- `selectable` / `onTap` routing (L169–178): move targets, choice zones, else the zone inspector.
- `bring` state (L66, L75–79): reuse it, but fix the default so it brings victims up to `followLimit`.
- `cardFor` (L27–58): maps a log entry to a card face.

**MapView geometry (`MapView.tsx`)**
- Reuse:
  - `zonePoint` (L80–82)
  - viewBox fitting (L90–98)
  - visible-zone rule including the helicopter (L87)
  - edge de-duplication with per-direction faces (L100–117)
  - `faces()` compression ("1-4", "5,6") (L67–78)
  - blocked-edge and Creech-lock detection (L125–126, L155)
  - `killerShown` rule (L123)
  - item-deck top state (L211)
  - per-zone grouping of victims, minions and birds
  - `TOKEN_GLYPH` and `VICTIM_COLORS` as *data* (add `survivor`)
- Rewrite all rendering:
  - sizes and tap targets
  - label placement: one arrow per direction with the faces at the source end, no collisions with names
  - tokens on connections (`t.to`)
  - tunnel links
  - standees and meeples
  - pinch / pan / zoom
  - landscape fit
  - no gradient or blur

**Dock state machines (`Dock.tsx`)** — keep the per-prompt logic:
- Main: `sel`, `weapon`, `showItems`, timeEach for Sheila.
- Roll: modes convert / close1 / lucky / sister; the partials calculation (L219); the outcome line from `card().results` and `describe` (L220–229).
- Move: `bring` limit.
- Planning: `sel`.
- Rescue: `who`.
- Search: `keep`.
- Arrange: `inHands` with the two-hand capacity check (L475–476, L485).
- DiscardDown: `picked`.

Rewrite every one of these visually, and add multi-card discard for Time.

**Sheets logic (`Sheets.tsx`)**
- Reuse: `describeAction` and `CUSTOM_LABEL` (L167–188), the Boiler Room cell math (L119–148), the WrathBox data, ZoneSheet's tags and panic list, and the log grouping by turn.
- Rewrite the presentation.

**`Dice` (`Panels.tsx` L125–145)**
- Reuse the success / partial / win classification and the per-die remount key, which makes only rerolled dice re-animate.

**`Icons.tsx`**
- Keep the SVG path geometry: Heart, Skull, Knife, Boot, Hourglass, Mask, Door, Wrench, Person, Hand, Backpack, DieFace pips, and 11 emblems.
- Change their default colors to `currentColor`; drop the cyan defaults at L36 and L97.
- Add any icons that are missing (Terror deck, Event, Bloodlust marker, Final Health token, standees).

**`Rules.tsx`**
- The rules text is good; restyle it, and possibly split it into steps or pages.

### 5.3 Rewrite completely

- `styles.css` (all 931 lines): new tokens, no gradients or glows, new type, no Coldwake idioms.
- The Game screen layout (`Game.tsx` JSX L186–344). It needs separate portrait and landscape layouts with fixed, stable regions; the landscape layout must keep the dock visible.
- The Title / setup screen (`App.tsx` L58–189).
- `KillerPanel` and `PlayerPanel` (`Panels.tsx` L8–123). Turn them into a killer board strip (bloodlust track, health, Dark Power, Finale, deck clock) and a player board (health, Time track, horror track with dice, items in hands and backpack, rescue card).
- `ActionCard` and `BigCard` (`Cards.tsx`). Cards should show the cost, timing and a three-row result table, with a distinct look for each deck.
- The end screen and the menu: confirm before restarting, and fix the Log button.
- `public/icon.svg` and the generated PNGs (remove the gradient).
- `vite.config.ts` manifest `orientation: 'portrait'`: change to `'any'` (or landscape) to match the chosen layout.