# Final Player

A solo slasher board game for your phone. You are the Final Girl: survive the
night, get the victims to an exit, and kill the Killer before he (or it, or
they) kills you. It installs to the home screen as its own app and plays
offline.

Final Player is a fan-made digital version of **Final Girl** by Van Ryder
Games (designed by A.J. Porfirio and Evan Derrick). It follows the published
rules and the cards of the core box and the first series of Feature Films.
Card text is rewritten in plain words and there is no original art. If you
like it, buy the game.

**Play it:** <https://manubolgia.github.io/Final-player/>. It's also on the
[MNBG tape library](https://manubolgia.github.io/mnbglibrary/).

---

## What's in it

Six films, each with its Killer, its location (with its own map, events,
Terror cards and item decks) and two Final Girls:

| Film | Killer | Location | Final Girls |
| --- | --- | --- | --- |
| The Happy Trails Horror | Hans | Camp Happy Trails | Laurie, Reiko |
| The Haunting of Creech Manor | The Poltergeist | Creech Manor | Alice, Selena |
| Carnage at the Carnival | Geppetto and his Puppets | Carnival of Blood | Asami, Charlie |
| Frightmare on Maple Lane | Dr. Fright | Maple Lane | Nancy, Sheila |
| Slaughter in the Groves | Inkanyamba | Sacred Groves | Adelaide, Barbara |
| Terror from Above (vignette) | The Birds | any location | Paula, Melanie |

Any Killer can be played in any location, as in the box. Every film's own
rules are in:

- **Hans**: the plain slasher. Fire, the secret tunnel, dark waters.
- **The Poltergeist** can't be hurt. Find Carolyn hidden in the item decks and
  get her out an exit. One-way doors, a rope ladder, a helicopter.
- **Geppetto** sends Puppets ahead of him and turns the dead into puppets; the
  Carnival hides a trap in every item deck.
- **Dr. Fright** only gets you while you sleep. Awake, neither of you can hurt
  the other; asleep, you're in his Boiler Room until you slide through its
  four cards. Houses with victims inside need Persuade.
- **Inkanyamba** answers to Killer Wrath and Divine Wrath; Atone to calm them.
- **The Birds** have no body: a flock that piles up three to a space. Save the
  hidden survivors before the birds cover everything.

Each Killer has its Bloodlust track, three Finales, three Dark Powers (plus
the Epic Dark Power where the film has one), and its own Terror cards. Normal and Extreme
Horror boards, and the Final Girls' signature items as an option.

## How the app plays

- **One screen.** The Killer's board on top, the map in the middle, your board
  and your hand below. Tap a panel for the full board, tap a space for its
  panic arrows, open the log for everything that happened.
- **The game keeps the rules.** It rolls the horror dice, moves the Killer
  along the shortest path, works out targets and ties (you choose when the
  rules say you do), panics victims, flips Final Health tokens, reveals the
  Dark Power and the Finale. You make every decision the board game asks of
  you: which card, which weapon, where to go, who follows you, whether to pay
  two cards to turn a 3 or 4 into a success.
- **Killer turns play out** card by card on the map. Skip them if you like.
- **Saves itself** after every step. Close the app and carry on later.
- **How to play** is built in.

## Under the hood

- [`src/game`](src/game) is the rules, with no UI in it. The state is a plain
  JSON object and the engine is a stack machine: each rule is a frame that
  runs, asks the player something, or finishes. Every die comes from a seeded
  generator, so a game replays the same from its seed.
- [`src/game/content`](src/game/content) is every card, board and character as
  data. Behaviour data can't say is an `ability` or `custom` id, written in the
  film modules in [`src/game/films`](src/game/films).
- [`src/ui`](src/ui) is React: the map is SVG drawn from each location's
  spaces and panic arrows.

## Develop

```sh
npm install
npm run dev          # http://localhost:5173/Final-player/
npm test             # rules tests: hundreds of whole games, every Killer in every location
npm run sim          # random-player results per Killer and location
npm run sim:smart    # a greedy player, per film
npm run build        # dist/, served from /Final-player/
npm run e2e          # plays a game of every film through the real interface
npm run icons        # re-render the PNG icons from public/icon.svg
```

`FINAL_PLAYER_BASE=/ npm run build` builds for a different base path. Pushes
to `main` run the checks and deploy `dist/` to GitHub Pages.

## Accuracy

The rules and the card data come from fan-made transcriptions of the cards
and rule summaries, cross-checked against each other and rewritten in plain
words. Where a card was unclear the app goes with the community's reading and
the log says what it did. If a card plays differently from your copy, open an
issue with the card's name.

MIT licensed code. Final Girl and its names belong to Van Ryder Games.
