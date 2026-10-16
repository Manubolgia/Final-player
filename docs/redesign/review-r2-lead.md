# Round 2 review: lead critic, 6.4/10

This grades redesign #2 as merged at `7191d12`. It was graded from static contact sheets only: the critic did not play the live app, to keep usage low. So animation, dice timing, the death beats, sound and haptics, measured tap targets and iPhone SE layouts were **not** judged. Round 1 scored 6 for art direction and 5.5 for mobile UX.

## Summary

Round 2 is a real step up:
- The art direction is consistent everywhere and looks nothing like Coldwake.
- The board moved from a node diagram towards printed tiles, with place icons and wrench badges, and the panic numbers are gone.
- The tips are fixed and Planning is usable.

It still reads as a polished fan prototype, though, for five reasons:
- Labels collide on 5 of the 6 boards.
- There is no illustration anywhere.
- Decision panels cover the board while the tray or rail sits empty.
- Card faces clip.
- Some web-kit pieces remain: iOS toggles, segmented controls, checkboxes, the black Killer sheet and a black-void end screen.

**To reach 8/10:**
- Zero label collisions on all 6 boards in both orientations, enforced by a test.
- A small flat-ink illustration set.
- Every decision object moved into the rail or tray.
- A hand-size card layout that never clips.
- The remaining web-kit pieces replaced with printed-component equivalents.
- A sweep that removes every truncation and overflow.

## Round-1 issues

- **Fixed:**
  - tip stickers;
  - the number soup and wrench badges;
  - the "Tap to continue" pill;
  - the receipt (film title, killer, Screenplay);
  - most of Planning.
- **Partly fixed:**
  - the board look (names are still floating tags; the backgrounds are flat with micro-decor);
  - the choice keys;
  - the move keys (the landscape label truncates);
  - stickers (truncated in the header; in landscape they overlap the Girl strip);
  - the table grain.
- **Still open:**
  - label and meeple collisions;
  - illustration;
  - web-kit leftovers;
  - decision states covering the board, and react repeating its damage four times;
  - card clipping;
  - the black end screen;
  - prose choice options;
  - cryptic glyphs;
  - the lifted card covering the map;
  - the portrait board head's height.

## Ranked issues

1. **[blocker] Board labels collide, and meeples sit on space names.**
   - **Where:**
     - Maple: NW House (Top) is stacked on NW House (Big). The Intersection is under Hans. The SE houses and South Exit sit under the 1-6 and zoom chits.
     - Groves: Southeast Exit is under the killer, and The Bridge is under 1-6.
     - Creech: Bay Window Room is under meeples.
     - Carnival: Ferris Wheel is clipped by its icon.
     - Birds: Lakeside Cabin and Cliff are under bird tokens.
     - Zone mode: the chips land on names.
   - **Fix:**
     - A scored label solver: 8 positions plus a 2-line wrap, greedy placement then swap passes.
     - Treat tiles, badges, a reserved meeple zone, the chits and the frame as obstacles.
     - Move the chits off the map. *(Done in part 4: the portrait board footer.)*
     - Add a CI overlap test at 390x844 and 844x390.
2. **[major] There is no illustration.**
   - Draw about 12 flat-ink SVGs: killer busts, Final Girls and location vignettes.
   - Use them on the box header, the 48–56px strip crops, the chapter band, the Terror card back and the end poster.
3. **[major] Decision states bury the board while the tray or rail sits empty.** This covers react, rescue, search, the lifted card and the roll.
   - In landscape, decision objects go in the rail; in portrait, in the tray.
   - React: delete the 5→0 panel and crack the hearts on the strip instead.
   - Lift cards in place at about 1.3x.
4. **[major] Hand card faces clip.** Examples: "WA", "FO", "RETALIAT", "bloc", "nothin", and Persuade's repeated text.
   - Show only the spine and inline rows at hand size.
   - Give text cards a one-line icon summary.
   - Add an overflow test.
5. **[major] The primary key runs off-screen with three keys (Birds).**
   - *(Fixed in part 4: compact Discard and Items keys, and shrinkable keys.)*
   - Add a test that every button sits inside the viewport.
6. **[major] Web-kit components remain.**
   - Menu toggles become flip tokens, speed a VCR rocker, and the text size two stamps.
   - The title-box checkboxes become punch-out tokens.
   - The Killer sheet goes on bone stock laid out like the physical Killer board, with flat +Horror marks.
7. **[major] Prompt trays still look like web forms.**
   - Use a prompt slip: an Anton verb, then full-width 52pt keys with an icon, the place name in UPPER case and meeple badges.
   - Show choices as icon rows.
   - Hide "bring along" when nobody is there. *(Done in part 4.)*
   - Remove the duplicate hint.
   - Scale up small hands.
8. **[major] The end screen is a black void.**
   - Stage it on the dark walnut: the tape ejects, the receipt prints beside it, and the killer silhouette sits behind.
   - Add recap rows (Killer HP left, Terror cards left, Bloodlust reached, best roll).
   - Put the keys at the bottom in both orientations.
9. **[minor] Stickers are truncated or cover stats.**
   - In portrait they're truncated in the header. *(Fixed in part 4 by the footer.)*
   - In landscape, WRATH covers Adelaide's Time, SURVIVORS and ASLEEP sit on the Bloodlust dots, and ESCAPE WITH CAROLYN sits over the dial.
   - Reserve a sticker gutter, and wrap rather than truncate.
10. **[minor] Cryptic glyphs.**
    - The "+?" coin doesn't match the "+1" on the sheet.
    - The red diamond card has no label.
    - The Event chit is blank.
    - Bloodlust boxes are about 9px.
    - The Birds' white tick tokens read as "done".
    - The SAVED circles have no label.
11. **[minor] Title and strip truncation.**
    - The help button and FAN-MADE sticker sit on the "R" of the logo.
    - Tape titles are truncated.
    - The strip shows "THE POLTER…".
12. **[minor] The board backgrounds are still felt with micro-decor.**
    - Add landmark shapes: the lake, Maple's street blocks, the Groves river, the Carnival midway, the Creech walls.
    - Draw paths in each film's idiom.
    - Delete the stray dots on Groves and Maple.
13. **[minor] Planning.**
    - The SHORT stickers clip. *(Fixed in part 4.)*
    - In portrait one pile hides behind the scroll. *(Rows tightened in part 4.)*
    - Better: mini face-up cards.
14. **[minor] Reveals ignore the layout zones.**
    - Centre reveals over the board area.
    - Put CONTINUE in the primary-key slot.
    - The "▸" shorthand is spelled out as "then". *(Done in part 4.)*
15. **[polish] The portrait board head steals map height.**
    - Merge menu and log into the corners of the killer strip.
