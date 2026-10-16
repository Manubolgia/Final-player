# Round 3 review: lead critic, 6.9/10

This grades redesign try 3, the last of the three, at `1e9cfdb`. Earlier rounds scored 6 (art) and 5.5 (UX) in round 1, then 6.4 in round 2. The critic graded from contact sheets and the round-2 review only, so animation, sound, haptics, real tap targets and the iPhone SE were not judged.

## Summary

This is the best version so far. The tabletop language is coherent and distinctive, and nothing about it reads as Coldwake.

**Solved for real:**
- the end screen;
- rescue and react now sit in the tray or rail;
- labels no longer collide with each other;
- three-key rows fit on screen;
- long killer names show in full.

**Still short of a studio adaptation:**
- There is no illustration.
- Small defects show in most gameplay frames: meeples on place names, card text cut off, truncated labels.
- Some screens still behave like a web page: search, the lifted card and the roll still cover the board, and prompt text floats on the wood.

**To reach 8/10:**
- Add a small flat-ink illustration set.
- Get to zero clipped text, enforced by an overflow test.
- Give meeples a fixed pad on each space, and include it in the label test.
- Move every remaining decision object into the tray or rail.
- Put every prompt on a printed prompt slip.
- Add one or two landmark shapes per board.

## Ranked issues

1. **[major] No illustration anywhere.**
   - Draw 12–15 flat-ink SVGs: killer busts, the girls, and tape-cover vignettes.
   - Use them on the tapes, the strips, the Terror card and the end screen.
2. **[major] Meeples and tokens sit on place names.** Examples: Sports Courts, West Street, Northwest Woods, The Intersection, and Cliff under the Birds checkmarks.
   - Give each space a fixed pawn pad opposite its label, and give tokens their own slot.
   - Add both to the label solver and its test.
3. **[major] Card faces still clip at hand size.** Examples: Persuade, Retaliate in the react tray, and spine names like "WEAK ATTACI".
   - Shrink spine text to fit.
   - Show icon tokens at hand size and full text only when lifted.
   - Add a text-overflow test.
4. **[major] Search, the lifted card and the dice roll still cover the board.**
   - Put the search items in the tray or rail.
   - Lift the card in place in the hand.
   - Dock the dice in a cardstock tray.
5. **[major] Text floats on the walnut.** Examples: "Your move", "hand 6/10", the search paragraph, and choice titles.
   - Use one printed prompt-slip component.
   - Delete duplicate hints.
6. **[major] The truncation sweep is incomplete.**
   - The landscape move key truncates its place name.
   - Planning names are cut off (DISTRACTIO, FURIOUS ST).
   - Portrait tape titles are truncated.
   - The rescue reward "Take a Planning card" spills out of its box.
   - The title checkbox subtitles are cut.
   - The Final Health tape runs past its banner.
7. **[minor] Reveals ignore the layout zones.**
   - Centre them in the board area.
   - Put CONTINUE in the primary-key slot.
8. **[minor] Landscape stickers sit on the girl strips.**
9. **[minor] The landscape Adelaide strip overflows with six hearts.**
10. **[minor] Web-kit pieces remain.**
    - The title checkboxes are still square.
    - The ON tokens are green, which is off-palette.
    - Speed and text still read as segmented controls.
    - The Killer sheet is still a black app panel.
11. **[minor] Small hands float in an empty tray.** Scale the hand up when it holds three cards or fewer.
12. **[minor] Cryptic glyphs remain.** The DP chip, the deck count, 1-6, the unlabelled SAVED circles, the Birds checkmarks, and tiny Bloodlust pips.
13. **[minor] Boards are flat colour.**
    - Add a lake, a river, street blocks and Creech walls.
    - Give Birds its own map treatment.
14. **[polish] Logo collisions on the title.** The "?" sits on the R, and FAN-MADE covers "ER".
15. **[polish] The killer-phase log reads as a console.** Show only the last 2–3 beats as slips.

## Strengths to keep

- One consistent printed-cardstock system across every screen, with no gradients and no blur.
- The landscape VHS shelf and tape-box panel.
- The action cards.
- The Girl sheet, with its dial and Time track.
- The theme writing: the Screenplay log, the rental receipt, BE KIND REWIND, and the KEEP stamp.
- Both orientations are genuinely designed.
- The Creech and Carnival boards read well.
- The zone sheet's panic table.
- The killer sheet's bloodlust ladder.
