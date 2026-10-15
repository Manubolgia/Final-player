# Final Girl: design-research brief for the "Final Player" UI overhaul

**How this was sourced.** WebFetch and curl to review sites were blocked, so everything below comes from search-result snippets. Each claim names its source. Anything marked **[inferred]** is my own design judgement and was not confirmed by a source. All hex values are guesses: no source gave colour values.

---

## 1. The physical object: "a stack of VHS tapes"

- **Feature Film boxes are VHS cassette cases.** Each box is double-sided and about the size of an old VHS tape, "maybe a bit wider". The lids are magnetic and "pop right off" to become the **Location board** on one side and the **Killer board** on the other (Fuzzy Llama review; BGG thread "A Killer Board Game?"; Shelfside: "VHS lookalikes come apart with magnets"). On the shelf they "look a bit like a stack of VHS tapes" (BGG). Both covers carry poster art, for example Laurie on one side and Reiko on the other (Happy Trails retailer listing). Reviewers single out the VHS styling as the game's visual highlight (Above Board; Co-op Board Games: "a nod to the VHS horror era").
- **Art tone.**
  - Meeple Mountain calls it "pulpy, distinctive, bold". Above Board says "dark and gritty, lots of black in the colour scheme". Medium shows heroines "mid-fight for their life".
  - Zatu says that across the series the in-game art is "plain and to the point, function over form". The theme lives in the covers and boards, not the card chrome.
  - Happy Trails' art is "muted compared with other boxes" (location-board search summary).
  - The killers are recognisable homages but legally distinct (Above Board).
  - Artists: Roland MacDonald, Tyler Johnson, Vladyslava Ladkova (Carnival) and Tumo Mere (Wikipedia; Meeple Mountain; Fuzzy Llama).
- **80s horror VHS cover conventions** (Den of Geek; *Videotapes From Hell* blurb): painted monsters, "lurid scenes of people in peril", dark tones, genre lettering, rental-shop sensationalism.
- **App implications [inferred]:**
  - The film picker should be a **shelf of tape spines**: flat colour blocks, condensed title type, a hand-lettered rental sticker.
  - Picking a tape slides it out and flips it to its cover. Starting the game "pops the lids", so the two lids slide apart to become the Killer board and the map.
  - Chrome should be **paper, card and cardboard**, not glassy panels.

## 2. The boards (what's printed on them)

**Location board** (inside of the front lid)
- An illustrated, painted map. Camp Happy Trails has 18 named spaces, including Cabins, Dock, Utility Shed, Cliff, Firepit, Lake and Makeout Point (finalgirl fandom wiki).
- **Search spaces carry an orange wrench icon**: Cabins, Dock and Utility Shed (redesigninsert quick-start; wiki).
- **"The numbers in between adjacent spaces are used to determine which direction victims will panic in"** (rulebook, quoted by the quick-start). The panic numbers sit on the connection *between* two spaces.
- Visual adjacency can mislead: Makeout Point looks adjacent to Cabins but isn't (quick-start). The app must draw connections unambiguously.
- Setup cards use a "Girl" icon (Final Girl start), a "K" icon (Killer start) and numbers (how many yellow victims to place) (Zatu how-to-play).
- Carnival's map has the Big Top in the centre, an outer ring, and the escape area in the middle (Board Game Breakdown and Dude Take Your Turn summaries).

**Killer board** (inside of the back lid)
- The red Bloodlust marker starts at the **bottom of the Bloodlust track on the right side** (Zatu). Each victim death pushes it up, and the Killer gets "faster, stronger" (Fangoria; Dude Take Your Turn).
- The starting Horror level is printed on the Killer board. One Final Health token sits on it (Zatu).
- Each film includes 3 Finale cards and Dark Power cards (Happy Trails: 4, one of them Epic) (beginner guide; Creech Manor listing).

**Player board** (core box)
- A **circular Horror track**. The *second red Killer meeple* is the marker that moves around it (Zatu). The Horror level sets how many dice you roll, up to 3 (Fangoria).
- A **blue Time track**. A blue hourglass-shaped marker starts on the "blue 6" space, and unspent Time carries over (Zatu; Fangoria).
- Space for the Final Girl card and items. One Final Health token sits on it.

**App implications [inferred]:**
- Make the Horror track a **real dial**, a ring of spaces with a red meeple sitting on one. It reads at a glance and is tactile.
- Time is a blue hourglass on a strip of numbered spaces.
- Bloodlust is a vertical thermometer-style ladder of boxes on the killer's edge, with flat fills only.
- The current pill-strip "3 3 2 2 2 2 2 1" is too abstract.

## 3. Cards

- **Action cards.**
  - Name at the top. The middle lists results by number of successes ("2+ / 1 / 0" rows).
  - **The hourglass in the bottom-right shows the Time cost.** Zero-cost cards have a **gold hourglass with "0"** and make up the 6-card starting hand: Walk, Rest, Weak Attack, and so on (Zatu how-to-play; GeekDad; Orangerful).
  - "Lose 1 Time" has its own symbol. Cards are bought in the Planning Phase from an **Action Tableau** of piles grouped by name (redesigninsert core rules; Meeple Mountain).
  - The icon reference is on the back of the rulebook (GeekDad).
- **Terror cards.** One is drawn every Killer phase. It names the Killer's target, movement and attack, and can teleport the Killer "right in our space" (Dude Take Your Turn) or kill several victims at once ("Gas Leak killed four", Meeple Mountain summary). The deck mixes the killer's and the location's Terror cards. **When it runs out, the Finale triggers** (Orangerful: a 10-card deck; Wikipedia).
- **Event cards.** Location-specific, kept face-down beside the Location board. Effects include new victims arriving where the Killer started (Zatu; Meeple Mountain).
- **Item cards.** Drawn from searches at wrench spaces (quick-start).
- **App implications [inferred]:**
  - Use a poker-card ratio of about 0.72 (63:88 is my assumption).
  - Each deck gets its own flat **card-back** treatment:
    - Action: off-white with a black frame.
    - Terror: black with a red mark.
    - Event: in the film's palette.
    - Item: a cardboard tan.
  - The Terror deck is the game's **clock** and should always be visible as a physical stack with a count.

## 4. Dice, meeples and tokens

- **Dice.**
  - Six "big, chonky, red" d6 (Orangerful).
  - Faces (Board Game Breakdown; TV Tropes): **1–2 are blank, 3–4 show a pair of card icons (a near-miss), 5–6 show a single star (success)**.
  - A near-miss can be converted to a success by **discarding two action cards** (TV Tropes; Meeple Mountain).
  - The optional Desperation Die rolls success on 1–5; a 6 means game over (Box of Props).
- **Meeples, colour-coded.**
  - Final Girl: **purple** (Board Game Breakdown; Bring Me The Axe: "Laurie, the purple one").
  - Killer: **red**. There are two red meeples; the second is the Horror marker.
  - Victims: **yellow**, 21 of them.
  - **Special Victims: one each in white, orange and blue** (Zatu; BBTS).
  - The base game uses meeples, not standees. Miniatures are sold separately (Asmodee). Above Board found the meeples small, narrow and fiddly.
- **Tokens.**
  - **Final Health tokens**: 9 black and 2 white. They are placed face-down with the "+1 die" side showing, one on the Killer board and one on the Player board, and flipped at the last point of health. They are a chance to "cheat death" (Zatu; rulebook via search; Zatu-hosted review).
  - Also 25 health markers, 8 tracking markers, and victim holding boards (retail listings).
  - Adrenaline Rush: +1 die when on your last heart (Meeple Shelter).

**App implications [inferred]:** Draw a real meeple silhouette (head plus splayed arms and legs) in these exact flat colours. Victims should be yellow meeples, not icon-in-circle badges. Dice are red rounded squares with white star and card-pair glyphs, not numerals.

## 5. Typography

No source identifies the real logo or card typefaces. Suggested free fonts that fit the tone, all available on Fontsource (all choices **[inferred]**):

| Role | Font | Why |
|---|---|---|
| VHS titles, big numbers, phase cards | **Anton** (`@fontsource/anton`) | Tall, condensed, heavy poster type, like 80s VHS sleeves |
| Card titles and body | **Archivo Narrow** or variable **Archivo** with the width axis | Readable condensed type that reads as printed, and replaces Barlow |
| Log, Terror and Event flavour text | **Courier Prime** | Screenplay voice, e.g. "INT. CABINS – NIGHT", for the movie framing |
| Time counter, turn number | **VT323** (OFL, Google Fonts) | VCR on-screen-display look: `▶ PLAY 00:06`; true VCR OSD Mono has a licence caveat |
| Rental stickers, spine labels, "SAVED" stamps | **Permanent Marker** | Hand-written rental-store labels |

- Use **Creepster** at most once (the logo) or drop it, because it reads as a Halloween-party font.
- Drop Barlow Condensed. Coldwake uses Chakra Petch, IBM Plex Sans and Spectral, so the new set must avoid all three.

## 6. Palettes (hex guesses)

**Series base:**
- Print black `#141213`
- Bone/paper `#EFE6D2`
- Blood red `#B3161B`
- Victim yellow `#F2C230`
- Final Girl purple `#6E46A0`
- Killer red `#C1272D`
- Time blue `#2F6DB5`
- Gold hourglass `#D4A12A`
- Wrench orange `#E8742A`

Shadows should be hard offset (`2px 2px 0 #000`), never blurred.

**Per film** (inferred from each setting; replace the current green-gradient map):

| Film | Palette | Notes |
|---|---|---|
| **Happy Trails Horror** (summer camp, "muted") | pine `#2F4A32`, lake `#2E5A6B`, canvas khaki `#C9B98F`, campfire `#E07A2E`, trail-sign wood `#6B4423` | |
| **Creech Manor** (Victorian manor, attic/closet, child Carolyn) | plum `#3B2140`, damask mauve `#7A4F7F`, candle gold `#D9A441`, bone `#EDE3D1`, flat ectoplasm `#B8D8B0` | |
| **Carnage at the Carnival** (Big Top, puppets) | circus red `#C8272D`, mustard `#F2B705`, tent cream `#F4E9D0`, midway navy `#1E2A4A`, sawdust `#C49A6C` | Striped tents in flat bands |
| **Frightmare on Maple Lane** (Elm Street homage; Boiler Room of "rusted pipes and gas clouds") | lawn `#5E8C3A`, picket white `#F1EDE4`, brick `#A44A3F`, sweater red/green `#9E2B25`/`#3C5A2E`; Boiler Room rust `#8A4B24` with sickly gas `#A9B04A` | Swap to the Boiler Room palette while she is asleep |
| **Slaughter in the Groves** ("Ancient Groves" in Africa, temples and tourists) | ochre `#C47F2C`, red earth `#8E3B23`, grove green `#1F4D3A`, river teal `#2B6E6A`, stone `#B8A88A` | |
| **Terror from Above** (The Birds; overlays any location; 36 bird tokens, Zatu) | storm slate `#4A5560`, crow black `#1A1A1D`, paper `#E9E6DF`, one red accent | Hitchcock-poster restraint |

## 7. What the player physically does each round

The engine's phase order is action → planning → killer → panic → upkeep.

1. **Setup.** Draw the location setup card, place meeples by the Girl/K/number icons, shuffle the Terror deck, put the Final Health tokens face-down, and reveal the first Event.
2. **Action.**
   - Play a card from hand, then make a **Horror Roll**: grab 1–3 red dice based on the dial, roll, and count stars.
   - Optionally discard 2 cards to convert each card-pair face.
   - Read the matching result row, then move the purple meeple, carry yellow victims along, attack, or search at a wrench space and draw an item.
3. **Planning.** Spend the remaining hourglass Time to take cards from the tableau, or discard cards to gain Time.
4. **Killer.**
   - The Killer acts, then **you flip a Terror card**. The red meeple moves along its path and attacks.
   - Each dead victim is removed and the **Bloodlust marker slides up**. Thresholds reveal a Dark Power.
5. **Panic.** If the Killer is near or someone died, roll a die for each panicking victim. Each one scurries along the connection whose printed number matches.
6. **Upkeep.** When the Terror deck is empty, the **Finale** is revealed.
7. **End.** The game ends only when the Killer dies or the Final Girl dies (Fangoria). At your last heart, flip the Final Health token.

**Why it's fun** (reviews):
- Push-your-luck rolls with only about a 50/50 chance per roll (Zatu-hosted review).
- The near-miss decision.
- "Tension mounts as more cards are put out" (Dude Take Your Turn).
- Bloodlust escalation: "can quickly slip away from you" (Bring Me The Axe).
- Emergent story: "build a narrative as it unfolded" (Bring Me The Axe); "plays like a movie" (Film Stories).

## 8. Lessons from digital board-game ports on iPhone

- **Slay the Spire (iOS).** Reviewers found card selection "flaky" because tap-to-select and drag-to-play compete with each other, and the text "tiny" (TouchArcade, Tapsmart, TheSixthAxis). → Use **one input model**: tap to lift the card and show it enlarged, tap a big PLAY button or the lifted card again to commit. Never let a hand card react to both tap and drag.
- **Wingspan (iOS).** On iPhone, "text a bit too small", "tiny button touch targets", easy-to-miss tutorial arrows (TouchArcade). → Minimum 44pt targets, body text of at least 15px, and the next action always shown as one large, labelled button.
- **Balatro (mobile).** Landscape only, light haptics on tap and on deal, satisfying drag-and-drop (Shacknews, Engadget). → Landscape-first is normal for card games on phones. iOS Safari has no Vibration API **[inferred]**, so replace haptics with short sound and a squash animation.
- **Dicey Dungeons (iPhone 13 Pro).** Drag dice into boxes; "never once felt cramped" (Tapsmart). → Use dice trays with clear slots, so a near-miss die is dragged or tapped onto two cards to convert it.
- **Roll for the Galaxy.** Dice movement felt "mechanical and sterile", and auto-resolve was valued (iPhone Life). → Give dice a tumble with a settle bounce, and add a fast-forward for Killer and Panic sequences.
- **Root and Inscryption.** Fidelity and vivid colour make up for lost tactility (iPhone Life; A Most Agreeable Pastime). Inscryption feels "tangible" through sound and visuals (wlhspawprint).
- **The real table is wide.** Location board in the centre, Killer and Player boards beside it, Tableau and hand in front **[inferred from component layout]**. → **Use landscape as the primary layout**:
  - The map fills the left 60–65%.
  - The right column is a "tabletop" holding the dice tray, hand fan and action button.
  - The Killer board strip runs along the top edge, the Player board (dial and hourglass) along the bottom edge.
  - Respect `env(safe-area-inset-left/right)` for the notch.
  - Portrait stacks the same items: map → Killer strip → hand.

## 9. Fixes the current screenshots need (from portrait-03 and landscape-03)

- Panic numbers collide with space names ("1-North Trail", "Lakeside1-4"), the map floats in an empty frame, and in landscape the map uses about 30% of the screen.
- The cards are text walls instead of result rows.
- The hand cuts off its 5th card with no affordance to show there are more.
- The phase label is duplicated (header, plus "— Turn 1 — Action Phase").
- Victims, the Killer and the Final Girl appear as letter or number badges rather than meeples.

## 10. Signature moments to dramatise

1. **Tape → lids.** Choose a spine from the shelf, the tape slides out and flips, the VCR shows `▶ PLAY`, and the lids snap apart to become the boards with a hard-edged "magnet thunk".
2. **Horror Roll.** Red dice tumble into a tray. Stars stamp in. Card-pair faces wobble, with an offer to "Discard 2 → ★". The matching result row on the card gets an ink-stamp highlight.
3. **Terror flip.** The deck counter ticks down ("4 LEFT"), the card flips full-screen with a stinger, and the red meeple hops along each space of its path.
4. **Kill and Bloodlust.** The yellow meeple tips over, the Bloodlust marker clunks up a box, and at a threshold a Dark Power card slams onto the Killer board.
5. **Panic scramble.** Each panicking victim gets a die, the matching numbered connection lights up as a printed highlight, and the meeple scurries along it.
6. **Final Health flip.** At the last heart, the token flips like a coin to reveal its result.
7. **Finale.** The Terror deck runs out and a black screen reads "THE FINALE" as a movie title card, then the palette shifts.
8. **Rescue and ending.** A hand-lettered "SAVED" sticker slaps onto a victim slot. Victory rolls end credits from the screenplay-style log. Death shows "THE END?" with a rewind button.