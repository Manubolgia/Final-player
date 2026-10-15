# Round 1 review: Mobile UX and ergonomics — 5.5/10

Specialist review of redesign #1 (commit fce422a on main), produced by the critic workflow in `critic-workflow.js`. Screen names refer to the screenshot set made by `scripts/shots.mjs`.

## Summary

The redesign has its own look. The walnut table and the flat, outlined cardstock pieces look nothing like Coldwake and nothing like a generic AI app. The video-store title flow is the best screen and could ship. The landscape "Table" layout is set up well, and the main keys name their result ("PLAY WALK rolls 2 dice", "TAKE THE HIT 5 → 0", "BUY GUARD −2 Time"). In play, though, it still feels like a fan prototype.

I played several turns by tapping in both orientations (390x844, 844x390, and iPhone SE 375x667 and 667x375). The very first game screen covers the hand and END TURN with a broken full-tray yellow tip. The automated screenshots never showed this because their script pre-dismisses the tips. The map is the heart of the game, but its place names collide with the panic number tiles (23 overlaps measured on the simplest board), and Carnival, Maple Lane and Creech on an SE are hard to read. The most common roll, one with no decision to make, shows its dice for well under a second, then asks you to "Choose the result" with text buttons that never say you failed. In portrait, half the Planning tableau is hidden behind an inner scroll. Stickers sit on top of stats and strips. Several prompts (move, choice, rescue, search) leave large empty areas filled with sentence-case web-style buttons. The header buttons are 38pt and the event sleeves 26pt, so targets are small.

The basics are right: safe areas, swipe-down sheets, side sheets in landscape, rotation that keeps game state, primary keys in thumb reach. But the rough edges show on every turn, so this sits a little below "solid fan project".

## Strengths to keep

- A distinct, consistent art direction: flat inks, 2px black outlines, hard offset shadows, a walnut table, no gradients or glows. It reads as printed game pieces and looks nothing like Coldwake.
- The title flow is excellent in every orientation. Tapes are on a shelf (vertical list in portrait), the box sheet has a big START THE NIGHT key in the thumb zone, landscape splits shelf and box, and it fits on the iPhone SE in both orientations. Swipe-down to dismiss works.
- The landscape Table layout: the map runs full height on the left, utility buttons sit in a left rail under the left thumb, and the Killer strip, Girl strip, hand and keys sit in a right rail under the right thumb. Notch and home-indicator insets are respected on both sides.
- Primary keys name what will happen ('PLAY WALK rolls 2 dice', 'TAKE THE HIT 5 → 0', 'BUY GUARD −2 Time', 'REST ON TOP face up'). This is real one-tap clarity, and the primary key always sits bottom-right.
- Lifting a card you can't play now shows a 'NOT NOW' banner and a reason chip ('Played after a horror roll.'). This is a great way to teach timing.
- Sheets behave like iOS: bottom sheets with a grabber and swipe-to-dismiss in portrait, side sheets in landscape. The Bloodlust ladder with its HERE sticker and the Horror dial on the girl sheet are faithful and easy to read.
- Rotating mid-game keeps the state and even the lifted card. Nothing remounts.
- Lit spaces get dashed yellow rings and the rest of the map dims for move and tie-break prompts. The zoom toggle centres on the girl, and one-finger pan works.
- Killer-phase playback is well paced (about 7s, a dashed red path for the killer's move, Fast/Skip, 'HANS IS COMING' chapter cards), and the 'Screenplay' log has charm.
- Card faces use compact icon rows (star dice faces, boot, hourglass, heart) that match the real cards.

## Ranked issues

### 1. [blocker] First-run tip sticker is a giant yellow slab that covers the hand and END TURN

*Screens:* first game screen (live), 02-game-action (only with tips not yet seen), move prompt (live), turn 2 (deck tip, live) · *Orientation:* both

**Problem.** On a fresh install the 'Tap a card to pick it up' sticker fills the whole tray row: 261x263pt in portrait, 259x230pt in landscape. The text sits small at the bottom-left, and the arrow points off-screen below the home indicator. It hides five of the six cards and the END TURN key. Computed style: align-self:start but height 252px, the full tray grid row, so something is stretching it. The 'Tap a lit space to move' sticker sits over the bottom of the board and hides one of the lit targets it tells you to tap (South Trail). The deck tip appears unprompted on turn 2 and covers the Killer strip and the menu/turn chit. The shots harness pre-dismisses all tips, so the review screenshots never showed this.

**Why it matters.** It is literally the first thing every new player sees, and it looks broken. It blocks the action it is teaching.

**Fix.** Give .tip-sticker height:auto; height:fit-content; max-height:120px; max-width:min(250px, 70vw). Better: position:absolute, anchored to the element it teaches, with the arrow pointing at it. For the hand tip, sit it above the hand row overlapping the girl strip, never over the keys row. Never overlap a lit target or a .btn. Put the move tip in the tray instead of on the board. Dismiss on any tap anywhere and on doing the taught action (lifting a card, moving). Show the deck tip only during the Killer phase, after the Terror reveal. Remove the localStorage tips pre-seed from scripts/shots.mjs so future reviews catch this.

### 2. [major] Map labels, panic tiles and meeples collide everywhere; some boards are unreadable at default zoom

*Screens:* 02-game-action, 05-move, 18-zone-sheet, 20-board-carnival, 20-board-maple, 20-board-creech, 20-board-birds, iPhone SE portrait Creech (live) · *Orientation:* both

**Problem.** On the live Happy Trails portrait board I measured 23 overlaps between space labels (11px), panic tiles and tokens. Examples: 'NORTH WOODS' under tile 6, 'NORTHWEST WOODS' under 1-4, tiles stacked on tiles (3,4 over 4,5, 5,6 over 1-3). Carnival hides 'SOUTH MIDWAY', 'TICKET BOOTH', 'CLOWN CAR', 'SHOOTING GALLERY' and 'POPCORN STAND'. Maple Lane stacks 'NW HOUSE (MIDDLE)' on 'NORTH STREET' and 'SE HOUSE (TOP)' on 'SE HOUSE (BIG)'. On the Birds board, bird tokens cover 'LAKESIDE CABIN'. On the iPhone SE in portrait, the 21-space Creech map is 336x213pt with rooms about 30pt square, and half the labels are covered. Meeples also cover labels ('NORTHWEST WOODS' under Hans, Cliff under the killer).

**Why it matters.** The board is the game. When you can't read where victims will panic to, or which space is which, you can't plan. Players see this every turn, and it makes the board look amateur next to the clean components around it.

**Fix.** Add a label-placement pass: per-location authored label anchors (N/S/E/W plus an offset) checked for collisions in a unit test that fails on any bounding-box overlap at 390 and 844 widths. Default panic tiles to only the spaces that matter now (the killer's space and its neighbours after a death, or the victims the next panic will move). Otherwise show them only with the 1-6 toggle or on long-press of a space. Pin each tile to the edge it points along, at a fixed distance from the space circle, and draw it below labels. Draw meeples offset inside the circle so they never cover the label plate. When spaces render under 36pt (SE portrait, 21-space boards), open the map at 1.4x zoom centred on the girl, with pan, and hide empty-space labels until zoomed.

### 3. [major] Rolls with no decision are nearly invisible, and the outcome screen never says you failed

*Screens:* play Walk (live), 06-choice · *Orientation:* both

**Problem.** When a roll needs no decision, the engine auto-finishes it (frames.roll.step calls finishRoll). The player taps 'PLAY WALK', a small 'ROLL 2 1' chip flashes over the board header for well under a second (gone by the first frame 300ms later), and the tray jumps to 'Choose the result' with two sentence-case buttons: 'move up to 1, lose 1 health, -2 Time' and '-2 Time'. You never see the dice settle, nothing says FAILURE, and the card row that applied isn't shown. When there is a decision, a big dice tray with '0 SUCCESSES' appears instead, so the same action gives two very different kinds of feedback.

**Why it matters.** Rolling the horror dice is the core tension of Final Girl. Hiding it removes the fun and leaves the player unsure why they lost Time or health.

**Fix.** Always run the dice beat: show the dice tray (or tray-area dice row) for at least 900ms at normal speed (tumble, land, count). Stamp the result as a sticker ('2 STARS', '1 STAR', 'FAIL') and highlight the matching row on the played card, then continue automatically. For an X-row with OR choices, title the prompt 'Walk failed: pick one'. Show the options as the card's own icon rows in full-width 52pt keys ([boot]1 [heart]−1 [hourglass]−2 | [hourglass]−2), with the card shown above in the tray.

### 4. [major] Portrait Planning hides more than half the tableau behind an inner scroll

*Screens:* 07-planning, planning (live) · *Orientation:* portrait

**Problem.** The Action Tableau is a single 180pt-wide column. The live tab-list is 720pt tall in a 287pt viewport. Only Close Call, Guard, Search and Sprint are visible. The 3-cost and 4-cost piles (Distraction, Improvise, Furious Strike, Planning, Retaliate, Long Rest) sit below the fold with only a '⌛ 3' header peeking. The right half holds a static help paragraph. The selected pile also spills past its column edge.

**Why it matters.** Buying cards is the strategic heart of the turn. Players won't know the expensive cards exist unless they discover the inner scroll, and nested scroll areas feel like a web page.

**Fix.** Lay the tableau out as a 2-column grid of 44 to 48pt pile rows grouped by cost (cost chip at the row start), so all 10 piles fit in the 359pt board area (5 rows x 2 columns x 52pt plus headers). Drop the help paragraph after the first visit, or show it as a one-time sticker. Show the selected card's preview as an overlay card anchored over the opposite column, or lifted in the tray, rather than in a fixed column.

### 5. [major] Stickers sit on top of stats, strips and the board header

*Screens:* 11-search, 20-board-carnival, 20-board-maple, 20-board-creech, 20-board-birds, iPhone SE portrait (live) · *Orientation:* both

**Problem.** 'FINALE SOON' covers the killer's boot stat and deck count. 'PUPPETS 0 READY' and 'ASLEEP 2/4' hang over the board header next to the menu and turn chit. 'ESCAPE WITH CAROLYN' and 'SURVIVORS 0/2' cover the top edge of the Girl strip in landscape. On the SE, 'ESCAPE WITH CAROLYN' hides the Poltergeist's move value.

**Why it matters.** The stickers carry objectives and urgency, but they hide numbers you need every turn, and they make the layout look accidental rather than playful.

**Fix.** Give stickers a reserved slot. In portrait, an 18 to 22pt gutter under the Killer strip (between strip and board), with the sticker at most 50% of the strip width and right-aligned under the deck. In landscape, tuck them into the 8pt gap between the killer and girl strips, or inside the Killer strip's free right area. Stack more than one sticker horizontally. Never overlay a numeral or a tappable chit: z-index below interactive elements, and pointer-events:none.

### 6. [major] Many tap targets are below 44pt, and big hands expose only 30pt card slivers

*Screens:* 02-game-action, hand of 10 (live), 01-title · *Orientation:* both

**Problem.** Measured: the board-header chits Menu, 1-6, Zoom and Log are 38x38. Event sleeves (Girlfriend, Boyfriend, Death Wish) are 26x33. The title help button is 40x40, the sheet close is 40x40 and the sideways dismiss is 36x36. With 10 cards in portrait each card exposes about 30pt, and with 6 cards in SE landscape about 41pt. A forced tap on the first card in SE landscape lifted the second.

**Why it matters.** Mis-taps on cards you meant to lift, and fiddly chits, are the main things that make a touch board game feel cheap. Apple's minimum is 44pt.

**Fix.** Keep the 38pt visual but give every chit a 44x44 hit box (padding or an ::before inset of −3px). Make sleeves at least 44x44 by hit area (visual 26x33 centred). For the hand, compute the overlap so each card shows at least 44pt. Above 7 cards, use a tighter fan with drag-to-scrub (slide a finger across, the card under it rises, release to lift) or a second row. Make the sideways-sticker dismiss 44x44.

### 7. [major] Prompt trays look like a web form: empty space, sentence-case text buttons, clipped scroller

*Screens:* 05-move, 06-choice, 11-search, 12-rescue · *Orientation:* both

**Problem.** In move, choice, rescue and search, the tray is plain white Archivo text on wood ('Tie: where does Hans go?') over about 150 to 200pt of empty walnut. The keys are bone boxes in sentence case that wrap badly ('Sports Courts · 1 victim · Laurie'). In move, the 'Go to …' buttons sit in a horizontal scroller whose third button ('Go to Southeast Exit') is cut off at the right edge with no affordance. The same hint is printed twice ('Tap a lit space on the board.'). Rescue shows a lone green 'Victim' chip and the copy 'Pick a victim, then tap a slot', but with one victim, tapping a slot saves it directly.

**Why it matters.** These are the moments with the most decisions, and they look the least like a game. One-thumb flow suffers when options float mid-screen or overflow sideways.

**Fix.** Render every prompt as a bone 'prompt slip' component: a 15 to 16pt Archivo 600 title (Anton for the verb), with options as full-width 52pt keys stacked from the bottom of the tray up into the thumb zone. Each key gets an icon plus the location name in UPPER case, and the victim count as a meeple badge. Allow at most 4 visible, then a vertical scroll with a fade. Delete the duplicate hint. In move, keep tapping lit spaces as the main path and show the keys as backup. In rescue with one victim, hide the Victim chip and use 'Tap a reward to save the victim'. With several, show victim meeples in the tray, the picked one lifted. Slap a 'SAVED!' sticker on the slot.

### 8. [major] The lifted card covers most of the map while you decide

*Screens:* 03-card-lifted, 04-roll, iPhone SE landscape lift (live) · *Orientation:* both

**Problem.** Lifting a card puts a 214x299pt copy over the board, about 75% of the map in portrait and about 60% in landscape, and dims the board. The full card is already readable in the hand. During the roll, the card reference pop-up covers the board header (turn chit, 1-6).

**Why it matters.** With movement and attack cards you need the map to decide (where can I walk, is Hans in range). Hiding it makes you lift, put down, look, lift again.

**Fix.** Lift the card in place: raise it about 40pt and scale it 1.3x from the hand, overlapping only the girl strip. Keep the map visible, and preview the effect on it: lit ring on spaces in reach for Walk/Sprint, crosshair on the killer for attacks when in range. Keep the full-size card for a long-press inspect (tier 3).

### 9. [major] Reveals and playback: duplicated text, overlapping pill, wrong turn chit, no death beat

*Screens:* first reveal (live), 08-killer-playback, 09-terror-reveal, death to THE END (live) · *Orientation:* both

**Problem.** The opening Event card ('GIRLFRIEND') is shown on the board and its whole text is repeated in the tray in ALL-CAPS Courier. A dark 'Tap to continue' pill overlaps both the card and the log. The portrait Terror card is about 600pt tall with two lines of text and a big empty black area. During Turn 1's killer playback the board chit already reads 'T02 ▶ ACT' (the review shot shows 'T03 ▶ ACT' with 'KILLER PHASE'). After 'TAKE THE HIT' with lethal damage, the game cuts to 'THE END?' in about 1s with only a log line. Victim deaths in playback are only a log line.

**Why it matters.** The shocks (Terror cards, kills, your death) are the slasher-movie payoff. Clutter and missing beats flatten them, and the wrong chit makes the timeline confusing.

**Fix.** Size reveal cards to their content (max-height 60vh, about 300pt wide in portrait). While a reveal is up, the tray shows only a counter ('TERROR · 8 LEFT') and a 'CONTINUE ▶' key in the primary-key slot, so the thumb doesn't move; delete the floating pill. Drive the chit from the playback snapshot ('T01 ▶ KILLER'). Add a death beat of about 1.2s: girl meeple knocked over, splat, 'CUT!' title card, then the end screen. Add a short splat plus a strike-through sticker on the space when a victim dies.

### 10. [minor] The dice tray covers the board and the Girl strip, and its hint is repeated

*Screens:* 04-roll, pay 2 cards (live) · *Orientation:* both

**Problem.** The roll tray is a black panel on top of the lower map and the Girl strip, hiding your Time and part of the horror dial. 'Pick 2 cards from your hand to pay for it' appears twice, in the tray and in the roll panel. The hand cards look unchanged when you pick a card to pay with.

**Why it matters.** Time and dice count matter while you decide whether to pay cards or Close Call. Covering them forces guesswork.

**Fix.** Dock the dice in the tray row (the hand is greyed during the roll anyway), or at the bottom edge of the board, and keep the Girl strip visible. In pay mode, give eligible hand cards a dashed 'PAY' outline and a 0/2 counter on the primary key ('PAY 2 → ★'). Print the hint once.

### 11. [minor] Card faces clip and truncate at hand size

*Screens:* 02-game-action, 07-planning, 10-react, 20-board-maple, rescue aftermath (live) · *Orientation:* both

**Problem.** Overlapping hand cards show 'WA', 'FO', 'WE ATT'. Hourglass results wrap onto second lines. The Furious Strike X row is cut at the bottom. The Weak Attack 'END' badge clips in landscape. Persuade wraps 'go into the house' over three lines and clips. In the landscape react prompt, Retaliate's title and 'block', and Close Call's 'one die', are cut off.

**Why it matters.** Clipped text looks unfinished and makes players lift every card to read it.

**Fix.** Hand-size layout: a single line per result row (dice icon then up to 3 icon/value pairs inline at 11px), the title in the spine only when overlapped, and a 2-line title with no ellipsis when fully visible. Text cards (Close Call, Persuade, Guard) get a one-line icon summary at hand size ('↻1 die / ↻all −2⌛'), with the full text on lift. Add a visual test that fails if any .acard child overflows.

### 12. [minor] iPhone SE portrait leaves too little room for the map

*Screens:* iPhone SE portrait (live) · *Orientation:* portrait

**Problem.** At 375x667 the stack (killer 58 + board header + map + girl 66 + tray) leaves the map at 336x213pt. On Creech, rooms are about 30pt and labels overlap heavily. The board header row (menu, turn chit, 1-6, zoom, log) takes about 48pt of map height.

**Why it matters.** Plenty of players still use an SE or mini-class phone, and the brief says portrait must be fully playable.

**Fix.** Below 700pt height: move the header chits into a 36pt row merged with the Killer strip (menu at left, zoom/log at right), shrink the Girl strip to 56pt and hand cards to 100pt, and open the map zoomed (see the map-collision fix) with one-finger pan.

### 13. [minor] End screen: wrong receipt label, keys mid-screen, no real recap

*Screens:* 14-end, death (live) · *Orientation:* both

**Problem.** The receipt reads 'FILM: Hans' (the killer, not the film). 'CREDITS' opens the log, which nobody would guess. In portrait the keys sit in the middle of the screen above the receipt. The recap is only 'Turn 5 · 0 saved · 1 dead'. The plain black screen drops the table metaphor.

**Why it matters.** The end screen is where players decide to play again. Wrong data and a thin recap undercut the rental-tape charm.

**Fix.** FILM = the film title, and add KILLER. Add rows for Killer HP left, Terror cards left, Bloodlust reached and best roll. Put REWIND (primary) and EJECT at the bottom in the thumb zone in portrait. Rename CREDITS to 'SCREENPLAY'. Keep the darkened walnut table behind the receipt.

### 14. [polish] The Killer strip and several keys carry unlabeled icons

*Screens:* 02-game-action, 13-killer-sheet · *Orientation:* both

**Problem.** The Bloodlust track is 11 squares about 16pt wide with tiny dot markers. The red diamond card and the '10' deck card have no labels. The '+?' chips on both strips are cryptic. The 'Discard for Time' key is an icon-only '⌛+'. The '+1 Horror' chips in the killer sheet look like buttons but aren't.

**Why it matters.** Reading at arm's length and first-time understanding suffer. A glance should tell you the clock (Terror deck) and the threat (Bloodlust).

**Fix.** Put a 'TERROR' caption under the deck in VT323. Show 'BL 2/11' as a numeral beside the track, or enlarge the squares to 20pt. Replace '+?' with a hidden-health token icon and explain it on long-press. Label the discard key 'DISCARD +⌛'. Style non-interactive chips in the killer sheet flat (no border or shadow) so they don't read as tappable.
