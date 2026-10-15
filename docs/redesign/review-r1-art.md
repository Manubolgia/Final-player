# Round 1 review: Art direction — 6/10

Specialist review of redesign #1 (commit fce422a on main), produced by the critic workflow in `critic-workflow.js`. Screen names refer to the screenshot set made by `scripts/shots.mjs`.

## Summary

Round 1 gets the direction right and is clearly designed. It has no gradients, glows or emoji, uses flat ink with hard shadows on a warm table, and looks nothing like Coldwake. The video-store title (tape spines, NEW/RENTED stickers, a VCR "Continue" bar, a barcode on the box back) and the Killer-phase playback (a "HANS IS COMING" chapter card, the red meeple hopping along a dashed path, a splat on each kill, the screenplay log in the tray) have real character. Both orientations play end to end. I played turns in both by tapping, with no console errors.

The core screen, the Location board, still looks like a node diagram rather than a printed Final Girl map:
- spaces are blank white discs or squares with black name tags;
- name plates and number chips collide on every board;
- 15 to 25 numbered panic chips plus numbered item-deck tabs make a soup of numbers;
- there is no illustration anywhere. Killers are single glyphs and Final Girls are generic meeples, and the pulpy VHS art that defines the game is missing.

Many panels fall back on one generic "neubrutalist" web-kit treatment: a rounded rectangle with a 2px border and a hard shadow. This shows in the choice buttons, the rescue grid, the iOS-style toggles, the dark "Tap to continue" pill, the dark-list Killer sheet and the black end screen. In several states (react, rescue, search, planning, roll) a panel covers the board while the tray sits half empty. The first-run tip stickers stretch to about 260x260 px and cover the hand they tell you to tap. Text-only cards clip inside the hand.

It is a solid, faithful fan project with noticeable rough edges, not yet a polished adaptation.

## Strengths to keep

- The video-store title is the best screen and should be kept as is. In landscape the tapes are vertical spines on a shelf; in portrait they are flat tape bars. It has Permanent Marker NEW/RENTED stickers, a VT323 'CONTINUE T01 LAURIE vs HANS' VCR bar, and a box-back sheet with a Courier blurb, an R/UNRATED rating and a barcode. It feels like a real rental store, not an AI dark app.
- The palette discipline is real: flat ink, 2px black outlines, hard zero-blur shadows, no gradients, glows or emoji. The warm walnut and bone tones are the opposite of Coldwake's navy and cyan.
- The action card design is faithful and readable. It has a black spine with an icon and a vertical name, a gold 0 coin or blue cost coin, and results drawn as red die-chip rows (two stars, one star, X) with icon effects (boot, hourglass, broken heart). During a roll the matching row gets a yellow ink highlight.
- Meeples use the game's colour code: a purple Final Girl, a red Killer, yellow victims, and coloured special victims. The silhouettes are proper meeples, not letter badges.
- Killer-phase playback is the most fun part of play. A 'HANS IS COMING / 10 Terror cards left' chapter band plays, then the Killer hops along a red dashed path, a splat marks each kill, the Bloodlust marker steps up, Terror and Dark Power cards flip in, and screenplay lines tick into the tray in Courier. FAST and SKIP are always available.
- The primary key always names the outcome: 'PLAY WALK / rolls 2 dice', 'ACCEPT · CHOOSE (boot 1, -1, hourglass -2)', 'TAKE THE HIT 5→0', 'BUY CLOSE CALL -1 Time'. The one input model (tap to lift, tap the key to commit) worked every time I tried it.
- The Girl sheet has a real Horror dial (a ring of segments with the red meeple on it) and a blue Time track with a gold hourglass marker. The Killer sheet has a Bloodlust ladder with a HERE sticker. These are good translations of the physical boards.
- Each film board has its own shape language: round camp clearings, square manor rooms, striped carnival tents, plank stripes for the manor, and per-film flat palettes. Good bones to build on.
- Both orientations really are first class. The same components are rearranged by grid areas, landscape puts the board at full height with a sensible right rail, and portrait keeps the Killer across the table at the top.

## Ranked issues

### 1. [blocker] The Location board looks like a transit diagram, not a printed Final Girl map

*Screens:* 02-game-action, 20-board-maple, 20-board-groves, 20-board-carnival, 20-board-creech, 20-board-birds, 05-move · *Orientation:* both

**Problem.** Every board is a node-link graph:
- Spaces are identical empty white discs (camp, groves, carnival) or white squares (manor, Maple), with nothing printed on them.
- Names sit on black tags floating beside the spaces.
- The background is one flat colour field with sparse micro-decor: tiny pine triangles, green dots and stone stubs. On Groves the stubs read as stray '0' glyphs (crop-groves-0.png).
- Paths are plain stroked lines.
- Nothing tells you a space is a cabin, a dock, a lake, a Ferris wheel or a boiler room.
The real boards are painted, illustrated maps, and they are the main source of table presence.

**Why it matters.** The board fills 50 to 65% of the screen in every gameplay state. As long as it reads as a diagram, the whole game reads as a UI or prototype rather than 'Final Girl on my phone'. This is the single biggest reason it does not look fun.

**Fix.** Make every space a die-cut printed tile.
- Tile: 46-54 px across, in the film palette (not white), with a 2.5px outline and a 3px darker stock edge below for thickness.
- Icon: a flat 1-2 colour place icon in the centre, generated from the zone id or tags: cabin, pier, waves, firepit, tent, ferris wheel, house, bed, piano, pipes, temple, bridge and so on. About 30 small SVG icons cover all six films.
- Name: print it ON the tile as a curved banner or attached ribbon in Archivo Narrow 11-12px bold, not as a floating tag.
- Background: add 3-5 large flat landmark shapes per film. Camp: lake polygon, tree masses, shoreline. Carnival: big top, midway lanes. Maple: street grid, lawns, house footprints. Groves: river, temple ruins. Manor: floor-plan walls.
- Paths: draw them in the film's idiom, with footprint dashes for trails, boardwalk planks for the carnival, sidewalk kerbs for Maple and corridors for the manor.
- Delete the scattered dots and stubs.

### 2. [major] Name plates, chips and tokens collide on every board

*Screens:* 20-board-maple, 20-board-carnival, 20-board-groves, 20-board-birds, 20-board-creech, 18-zone-sheet, 05-move · *Orientation:* both

**Problem.** Overlaps found on every board:
- Maple: 'THE SMALLEYS HOUSE / SOUTH STREET / SE HOUSE (TOP)' butt into each other and truncate (crop-maple-labels.png); 'NW HOUS NORTH STR'; 'WEST STRE' sits under the '1-3' chip; 'THE INTERSECTION' sits under the '2' chip.
- Carnival: 'EAST PLAZA' is under '2-5', 'SHOOTING GALLERY' is under '3-6', 'POPCORN STAND' is under '5' and '1', and 'FERRIS WHEEL' is clipped by an icon.
- Groves: 'SOUTHEAST EXIT' is under the Killer meeple, and 'SACRED TREES', 'EAST WOODS' and chips pile on top of each other.
- Birds: 'LAKESIDE CABIN' is covered by bird tokens.
- Camp: 'TUNNEL' tags cover 'NORTH WOODS' and 'TU..' collides with the '1-4' chip.
- Creech: 'BAY WINDOW ROOM' sits under meeples.
- Move prompt: the 'MOVES LEFT 1' chip covers 'NORTHWEST WOODS'.

**Why it matters.** Collisions are the clearest marker of amateur work. Players cannot read where they are or where they can go, and the board looks messy in exactly the places the owner will screenshot.

**Fix.** Replace the label placer with a scored solver.
- Candidates: 8 positions around each tile, plus inside for exits and big tiles, plus a 2-line wrap variant.
- Obstacles: tiles (including a reserved token zone about 0.8r above each tile), panic chips, item badges, edges (with a penalty), other labels, and the board frame.
- Method: greedy pass, then 2-3 passes of local swaps. Below 11px use an abbreviation table (NW, SE, 'Smalleys').
- Draw labels above edges and below meeples, and keep meeples out of label boxes.
- Add a test that renders each of the 6 boards at 390x844 and 844x390, zoomed and unzoomed, and fails on any bounding-box overlap between labels, chips and tiles.
- Move 'MOVES LEFT' into the board head or tray.

### 3. [major] Number soup: panic chips and item decks

*Screens:* 02-game-action, 20-board-maple, 20-board-groves, 18-zone-sheet, portrait-b-01-zoomed (1-6 mode) · *Orientation:* both

**Problem.** Even in default mode each board shows roughly 15-25 bone chips ('1-4', '5,6', '3-6', '6'). Which path a chip belongs to depends on a 5px arrow next to it. The '1-6' toggle turns the manor into wall-to-wall chips. Search spaces show their item deck as a tan rectangle with a number ('4', '3'), so the board has two kinds of numbered rectangle with different meanings. The real game marks search spaces with an orange wrench.

**Why it matters.** Numbers everywhere bury the meeples and the action. Ambiguous chip ownership defeats the purpose of showing panic numbers at all.

**Fix.** Show panic numbers only during panic playback, in the zone sheet, and on spaces holding victims next to the Killer. Draw each one as a small notch tab sitting on the path itself, at the midpoint, rotated along the edge, 18x14px, with a direction wedge built into the tab shape. Replace the item-deck tab with an orange wrench badge (20px die-cut disc) plus a small count pip. Show a crossed-out wrench when the space has been searched.

### 4. [major] No illustration anywhere, so the game's pulpy character is missing

*Screens:* 01-title, store-p-05-box-carnival, 02-game-action, 08-killer-playback, 09-terror-reveal, 13-killer-sheet, 14-end · *Orientation:* both

**Problem.** Killers appear only as small line glyphs in a box (hammer, ghost, trident, puppet cross, birds). Final Girls are identical purple meeples on the Starring buttons and the Girl sheet. Locations have no art. The box-back header is a coloured bar with a stripe 'slider'. Terror cards, chapter cards and the end screen are type on flat black. The physical game sells on painted VHS-cover art of killers and heroines.

**Why it matters.** The owner said it 'doesn't look fun'. Character art is what turns a correct UI into a slasher game. Without it, even perfect layout tops out around a 6-7.

**Fix.** Make a flat-ink poster illustration set in the house style: 2-3 spot colours plus black, no gradients, hard shapes, like 80s one-colour VHS sleeves.
- One bust silhouette per Killer: Hans with cleaver, the Poltergeist girl, Geppetto with strings, Dr. Fright's glove, Inkanyamba's coils, a crow flock.
- One per Final Girl.
- One establishing vignette per location.
- Use them on: spine faces, the box-back header (replacing the stripe bar), a 56px crop on the Killer strip, the Girl strip, chapter title bands ('HANS IS COMING' with the silhouette sliding in), Terror card backs and the end-screen poster.
- Even 12 well-drawn SVGs would change the whole feel.

### 5. [major] Many panels use a generic neubrutalist web kit, not game components

*Screens:* 17-menu-sheet, 06-choice, 12-rescue, 13-killer-sheet, 08-killer-playback ('Tap to continue' pill), store-p-05-box-carnival · *Orientation:* both

**Problem.** Buttons, choice options, rescue slots, settings rows, segmented controls and sheets all share one treatment: a rounded rectangle with a 2px black border and a 4px hard shadow. The Paused sheet has iOS-style green ON/OFF toggles. The Starring and Rating pickers are web segmented controls. The Epic and Signature options are form checkboxes. The 'Tap to continue / Tap to close' prompt is a dark rounded app pill. The Killer sheet is a dark scrolling settings-style list. 'Rounded box plus offset shadow' is itself a recognisable trendy web and AI-generated look.

**Why it matters.** This is exactly the 'AI-ish' feel the owner asked to remove. Components should feel like different printed materials (cards, tokens, boards, stickers), not one UI kit restyled.

**Fix.** Define 4 material families and stop sharing one box style:
- Cards: 6px corners, printed inner frame, corner index.
- Tokens: circular die-cut with a 3px stock edge.
- Board stock: square corners, a thick edge, printed rule lines.
- Paper slips: torn or perforated edge, Courier.
Then apply them:
- Toggles become flip tokens with 'ON' printed on one side and 'OFF' on the other.
- Speed becomes a 3-position VCR rocker.
- The Rating picker becomes two rating stamps.
- Checkboxes become punch-out tokens.
- 'Tap to continue' becomes a small printed tab on the revealed card's bottom edge.
- Give the Killer sheet the physical Killer-board layout: a vertical Bloodlust ladder on the right, Dark Power card slots, killer art top left.
- Add a very low-opacity inline SVG paper-fibre texture (3-4%, no blur, no gradient) to bone stock only.

### 6. [major] First-run tip stickers are 260x260 px slabs that hide the hand

*Screens:* portrait-a-06-first-turn, landscape-a-02-after-event, landscape-d-01-move-prompt · *Orientation:* both

**Problem.** Measured live: the 'Tap a card to pick it up' sticker is 261x263 css px in portrait and 259x230 in landscape. It is stretched to the grid row height, runs past the bottom of the viewport, and covers the whole hand and the END TURN key. Because the sticker is a button, the player's first tap on a card only dismisses it. The 'Tap a lit space to move' sticker sits on top of the Southwest Exit target.

**Why it matters.** This is the first thing a new player sees after the opening event. It hides the very thing it describes and swallows input, so the first impression is broken.

**Fix.** In table.css set `.tip-sticker { height: max-content; align-self: start; }` and position it absolutely: anchor its bottom 8px above the top edge of the hand fan, max-width 240px, max-height 72px, with the arrow pointing at the first card. Anchor the move tip to the top edge of the board, away from lit targets. Make it `pointer-events: none` and dismiss it on the first real game tap, so taps pass through to the cards.

### 7. [major] Decision states cover the board while the tray sits empty, and react repeats itself four times

*Screens:* 10-react, 12-rescue, 11-search, 07-planning, 04-roll · *Orientation:* both

**Problem.** The decision panel covers the board while the tray sits mostly empty:
- React: the board is buried under a 'HANS ATTACKS 6 DAMAGE' title band plus a large, mostly empty '5 → 0 FINAL HEALTH TOKEN!' panel. The tray header repeats 'Hans attacks · 6 damage' and the key repeats '5→0', so the same fact appears four times.
- Rescue (both orientations): the rescue card covers the board while the tray holds one small 'Victim' button and a small DONE key over about 60% empty walnut.
- Search (landscape): the item cards sit over the board and the right rail is empty between the instructions and the keys.
- Planning (portrait): the tableau list uses the left half and helper text floats in the empty right half.

**Why it matters.** The player loses the spatial context exactly when deciding. Empty trays next to covered boards look unfinished and waste the iPhone's tiny canvas.

**Fix.** Put the decision object where the free space is:
- Landscape: rescue card, item choice and damage summary go in the right rail (the rail is 400px wide), and the board stays visible.
- Portrait: they go in the tray area above the keys.
- React: drop the separate damage panel. Animate the hearts on the Girl strip (the lost hearts crack and fall off, and the Final Health token flips like a coin), keep a single 'FINAL HEALTH TOKEN!' sticker slapped on the strip, and let the title band auto-clear after 900 ms.
- Make the DONE and Victim keys full width.

### 8. [major] Card layouts clip and truncate

*Screens:* 20-board-maple (Persuade), 10-react (Close Call), 02-game-action, portrait-d-01-lift-short-rest, landscape-b-04-walk-lifted · *Orientation:* both

**Problem.** Card layouts clip and truncate:
- Text-only cards overflow the hand card. Portrait Persuade repeats 'go into the house' three times and clips mid-word; the landscape Close Call cuts off at 'one die'.
- Landscape hand titles truncate ('FOCU', 'WEA ATTA') because the horizontal title is drawn under the next card.
- The lifted card leaves its bottom 40% blank while the result rows are crammed against the right border (the hourglass '-1' touches the edge).
- Rule text in the hand is about 9-10px.

**Why it matters.** Cards are the player's main interface and the most 'printed' object. Clipped text breaks the component illusion and slows play.

**Fix.** Use a container-query card layout:
- In the fan, show only the spine (icon, vertical name, cost) and the first result row. Hide the horizontal title when the card is overlapped.
- Give text cards a 1-line icon summary (reroll-die icon, 'any roll') and keep the full text for the lifted view.
- Lifted card: size rows to fill the height (icons 28px, numerals 22px Anton), place rule text under the rows, and add 12px right padding.
- Enforce a 12px minimum for any text on a card.

### 9. [minor] Dice are drawn three different ways

*Screens:* portrait-d-02-roll-a, 04-roll, 18-zone-sheet, 16-log-sheet · *Orientation:* both

**Problem.** The horror roll tray correctly shows blank, card-pair and star faces. The auto-resolved roll flash (Short Rest) shows dice with numerals '1' and '5', and it sits over the board-head buttons. Panic tables in the zone sheet use pip faces. The log prints 'Horror roll (2 dice): 3 1.'

**Why it matters.** The dice are the game's signature push-your-luck object. Mixed glyph systems make the player relearn what a face means and undercut the printed-component consistency.

**Fix.** Use one Die component everywhere. Horror dice always show symbols: blank for 1-2, card-pair for 3-4, star for 5-6. Panic uses a separate bone d6 with pips. Write symbols in the log ('Roll: ★ ▢'). Show the flash inside the dice-tray position (lower board centre) and never over the board head.

### 10. [minor] The planning tableau is a spreadsheet list, not piles of cards

*Screens:* 07-planning, landscape-g-02-pile-open · *Orientation:* both

**Problem.** The Action Tableau is a vertical list of white tabs with a colour strip, a '×2' count and a blue cost coin, grouped under hourglass headers. In portrait it fills half the width; the 3-cost and higher groups fall below the fold and the right half holds helper text. The opened pile shows a separate card beside the list. It does not resemble the physical tableau of face-up piles.

**Why it matters.** Buying cards is the game's deck-building moment. A list makes it feel like a settings menu rather than shopping a table.

**Fix.** Render a grid of mini face-up cards, 62x88 css px, using the same ActionCard at mini size: name, icon and three result chips. Group them into cost rows labelled with hourglass coins, show stack thickness as count x 2px offset layers, and dim unaffordable piles with a 'SHORT 2' sticker. Tapping lifts the card into the same lifted-card view used for the hand, with the BUY key. In portrait use 4 columns and let it scroll vertically.

### 11. [minor] Stickers and micro-info collide on the strips, and several glyphs are cryptic

*Screens:* portrait-a-06-first-turn, 20-board-maple, 20-board-groves, 02-game-action · *Orientation:* both

**Problem.** Stickers cover information and several glyphs need a legend:
- The objective sticker 'ESCAPE WITH CAROLYN' covers the Poltergeist's move stat in portrait (the '2' is hidden).
- 'ASLEEP 2/4' covers the Bloodlust tick dots.
- 'WRATH 4 · DIVINE 5' overlaps the strip edge.
- The Final Health token is a cryptic '+?' circle on both strips.
- The Event chit in the board head is a blank coloured rectangle.
- A red diamond card next to the Terror deck is unexplained.
- Bloodlust boxes are about 9px.

**Why it matters.** The strips are the glanceable state of the game. Hidden numbers and unexplained glyphs force the player to open sheets.

**Fix.** Give the sticker its own slot hanging below the strip's bottom edge, centred under the name, and never over stats. Draw the Final Health token as a black die-cut coin with a white '?', and explain it in a first-view sticker. Make the Event chit a mini card with the film icon and 'EVENT' in 9px Anton. Label or remove the red diamond. Bloodlust boxes need at least 12px, with the threshold markers drawn as printed notches.

### 12. [minor] The end screen and Killer sheet fall back to the black-void dark-app look

*Screens:* 14-end, 13-killer-sheet · *Orientation:* both

**Problem.** 'THE END?' floats on flat #1e1a1b with three keys and a receipt. There is no table, tape or art. The receipt says 'FILM: Hans' when it should give the film title. The Killer sheet is a near-black full sheet listing ladder rows. Both look like the dark generic app the owner disliked.

**Why it matters.** The ending is the emotional payoff and the screenshot people share. Reverting to a black void at that moment undoes the tabletop identity.

**Fix.** Stage the end on the walnut table. The film's tape ejects (its spine slides up), the receipt prints beside it, and the killer poster silhouette sits behind it. On a win, a 'SURVIVED' sticker lands on the spine. Fix the receipt to FILM = film title and KILLER = name. Lay the Killer sheet out as the physical Killer board (see the neubrutalism issue).

### 13. [minor] Choice prompts are plain paragraphs, not the game's icon language

*Screens:* 06-choice, landscape-c-01-after-accept, landscape-i-01-resume · *Orientation:* both

**Problem.** Roll results become text buttons ('move up to 1, lose 1 health, -2 Time' / '-2 Time') in 17px Archivo. Killer ties become 'Sports Courts · 1 victim · Laurie', wrapping over 2 lines, inside large white boxes with big empty gaps below.

**Why it matters.** The cards teach an icon language (boot, broken heart, hourglass). Switching to prose at decision time is inconsistent and slower to parse.

**Fix.** Render each option with the card's result-row component (boot 1 · broken heart -1 · hourglass -2) and put the source card's die chip on the left. For location ties, make the lit board spaces the main tap targets, and replace the buttons with compact tags (space name plus victim meeples).

### 14. [polish] Move rail clips its options and the table texture reads as flat brown

*Screens:* landscape-d-01-move-prompt, 02-game-action · *Orientation:* landscape

**Problem.** In the move state the 'Go to …' buttons scroll sideways and the second one is clipped ('Go to Northwest…') with no scroll affordance. The walnut table is a flat #4a3324 with faint wavy hairlines and reads as a brown background. The board head (menu, tape counter, event chit, 1-6, zoom, log) takes about 50px of portrait height above the board.

**Why it matters.** Small, but they add up to 'web page' rather than 'table', and portrait board space is precious.

**Fix.** Stack the destinations vertically (or 2 columns) in the rail. Draw grain as 8-12 long darker strokes with two knots and plank seams every about 180px. In portrait, move menu and log into small tabs on the Killer strip corners, and put 1-6 and zoom on the board frame's corner, to give about 40px back to the map.
