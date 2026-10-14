import { Sheet } from './Sheets';

export function RulesSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="How to play" onClose={onClose}>
      <div className="rules">
        <p>
          You are the Final Girl. You win the moment the Killer dies. You lose if you die first. Save the victims along the way: every one you get to an exit fills a space on
          your card, and a full card turns into your Ultimate Ability.
        </p>
        <h4>A turn has five phases</h4>
        <ol>
          <li>
            <b>Action.</b> Play action cards from your hand. Most make a <b>horror roll</b>: each 5 or 6 is a success; a 3 or 4 counts as one if you discard 2 cards for it.
            The card's top line needs 2+ successes, the middle line 1, the bottom line is a failure. Cards cost Time as they resolve. Discard any card for +1 Time. The phase
            ends when you stop, run out of cards, a card says so, or Time drops below zero.
          </li>
          <li>
            <b>Planning.</b> Spend what Time is left on new cards from the tableau (not ones you used this round). Zero-cost cards come back free. Then Time resets and the
            cards you used return to the tableau. Hand limit 10.
          </li>
          <li>
            <b>Killer.</b> The Killer does his action (the one on his Finale card once it is revealed), then a Terror card is drawn and resolved top to bottom.
          </li>
          <li>
            <b>Panic.</b> If anyone died this turn, every victim sharing a space with an enemy panics: roll a die and follow the arrow with that number. No arrow, no move.
          </li>
          <li>
            <b>Upkeep.</b> When the Terror deck is empty the Finale is revealed (and the Dark Power, if it's still hidden). Rearrange your items.
          </li>
        </ol>
        <h4>Horror</h4>
        <p>
          Your Horror level sets how many dice you roll (3 at the green end, 1 at the red end). Below green: +1 Time instead. Above red: +1 Bloodlust instead. If you or the
          Killer are on your last health, roll +1 die for each.
        </p>
        <h4>Moving and victims</h4>
        <p>
          Up to 2 victims in your space can come with you when you move, but never into the Killer's space. Reach an exit with them (or with victims already there) to save
          them.
        </p>
        <h4>The Killer</h4>
        <p>
          <b>Target</b> icons pick who he goes for: the closest victim, you, or whoever is nearest (ties go to the space with more victims, then you choose). Each{' '}
          <b>move</b> takes him as many spaces as his Bloodlust allows, by the shortest path, stopping when he reaches his target. Each <b>attack</b> hits one victim in his
          space (victims before you, unless you are the target), or you for his Bloodlust damage. Every victim he kills raises Bloodlust: he gets faster, hits harder, and his
          Dark Power wakes up.
        </p>
        <h4>Attacking</h4>
        <p>
          Attack cards hit an enemy in your space, or farther with a ranged weapon. A weapon adds its damage once, if the card dealt at least 1. You only have two hands;
          everything else rides in your backpack. Guard and Retaliate are reactions, played when an enemy attacks you.
        </p>
        <h4>Final Health</h4>
        <p>
          You and the Killer each have a face-down Final Health token as your last health. When it's lost, flip it: hearts mean you're back with that much health and the
          current phase ends at once; blank means dead.
        </p>
        <h4>Tips</h4>
        <ul>
          <li>Tap the Killer's or your own panel for the full boards. Tap any space on the map to see its panic arrows.</li>
          <li>Tap a 3 or 4 on a roll to pay 2 cards for a success.</li>
          <li>Search spaces show their item deck: orange means the top card is face up.</li>
        </ul>
        <p className="muted">
          Final Player is a fan-made digital version of the Final Girl board game by Van Ryder Games (designed by A.J. Porfirio and Evan Derrick). Buy the game; it's
          great.
        </p>
      </div>
    </Sheet>
  );
}
