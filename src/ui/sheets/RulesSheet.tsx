// How to play, as six paper pages in a swipeable pager with dot chits.

import { useRef, useState, type ReactNode } from 'react';
import { Boot, Hand, Hourglass, Knife, Mask, MeepleIcon } from '../pieces/icons';
import { PipDie } from './bits';
import { SheetFrame } from './Sheet';

const PAGES: { title: string; body: ReactNode }[] = [
  {
    title: 'Setup',
    body: (
      <>
        <p className="lead">
          You are the Final Girl. You win the moment the Killer dies. You lose if you die first. Save the victims along the way: every one you get to an exit fills a
          space on your card, and a full card turns into your Ultimate Ability.
        </p>
        <h5>A turn has five phases</h5>
        <ol className="phases">
          <li>
            <b>Action.</b> Play cards from your hand.
          </li>
          <li>
            <b>Planning.</b> Buy new cards with the Time you have left.
          </li>
          <li>
            <b>Killer.</b> He acts, then a Terror card.
          </li>
          <li>
            <b>Panic.</b> After a death, victims near an enemy run.
          </li>
          <li>
            <b>Upkeep.</b> The Finale, when the Terror deck runs out. Rearrange your items.
          </li>
        </ol>
      </>
    ),
  },
  {
    title: 'Action',
    body: (
      <>
        <p>
          Play action cards from your hand. Most make a <b>horror roll</b>: each 5 or 6 is a success; a 3 or 4 counts as one if you discard 2 cards for it. The card's top
          line needs 2+ successes, the middle line 1, the bottom line is a failure. Cards cost <Hourglass className="ico time" /> Time as they resolve. Discard any card
          for +1 Time. The phase ends when you stop, run out of cards, a card says so, or Time drops below zero.
        </p>
        <h5>
          <Mask className="ico" /> Horror
        </h5>
        <p>
          Your Horror level sets how many dice you roll (3 at the green end, 1 at the red end). Below green: +1 Time instead. Above red: +1 Bloodlust instead. If you or
          the Killer are on your last health, roll +1 die for each.
        </p>
        <h5>
          <Boot className="ico" /> Moving and victims
        </h5>
        <p>
          Up to 2 victims in your space can come with you when you move, but never into the Killer's space. Reach an exit with them (or with victims already there) to
          save them.
        </p>
        <h5>
          <Knife className="ico" /> Attacking
        </h5>
        <p>
          Attack cards hit an enemy in your space, or farther with a ranged weapon. A weapon adds its damage once, if the card dealt at least 1. You only have two{' '}
          <Hand className="ico" /> hands; everything else rides in your backpack. Guard and Retaliate are reactions, played when an enemy attacks you.
        </p>
      </>
    ),
  },
  {
    title: 'Planning',
    body: (
      <>
        <p>
          Spend what Time is left on new cards from the tableau (not ones you used this round). Zero-cost cards come back free. Then Time resets and the cards you used
          return to the tableau. Hand limit 10.
        </p>
        <h5>Upkeep</h5>
        <p>When the Terror deck is empty the Finale is revealed (and the Dark Power, if it's still hidden). Rearrange your items.</p>
      </>
    ),
  },
  {
    title: 'Killer',
    body: (
      <>
        <p>
          The Killer does his action (the one on his Finale card once it is revealed), then a Terror card is drawn and resolved top to bottom.
        </p>
        <p>
          <b>Target</b> icons pick who he goes for: the closest victim, you, or whoever is nearest (ties go to the space with more victims, then you choose). Each{' '}
          <b>move</b> takes him as many spaces as his Bloodlust allows, by the shortest path, stopping when he reaches his target. Each <b>attack</b> hits one victim in
          his space (victims before you, unless you are the target), or you for his Bloodlust damage.
        </p>
        <p>Every victim he kills raises Bloodlust: he gets faster, hits harder, and his Dark Power wakes up.</p>
      </>
    ),
  },
  {
    title: 'Panic',
    body: (
      <>
        <p>
          If anyone died this turn, every victim sharing a space with an enemy panics: roll a die and follow the arrow with that number. No arrow, no move.
        </p>
        <div className="eg" aria-hidden="true">
          <span className="eg-v">
            <MeepleIcon color="#f2c230" size={26} />
          </span>
          <span className="faces">
            <PipDie n={1} />
            <PipDie n={2} />
            <PipDie n={3} />
          </span>
          <svg className="arrow" viewBox="0 0 28 14">
            <path d="M1 7h19" stroke="currentColor" strokeWidth="3" />
            <path d="M18 1.5L27 7l-9 5.5z" fill="currentColor" />
          </svg>
          <b>Dock</b>
        </div>
        <p>Tap any space on the map to see its arrows. Victims only panic in a space with an enemy.</p>
      </>
    ),
  },
  {
    title: 'Final Health',
    body: (
      <>
        <p>
          You and the Killer each have a face-down <span className="coin black inl">+1</span> Final Health token as your last health. When it's lost, flip it: hearts
          mean you're back with that much health and the current phase ends at once; blank means dead.
        </p>
        <h5>Tips</h5>
        <ul className="tips">
          <li>Tap the Killer's or your own strip for the full boards. Tap any space on the map to see its panic arrows.</li>
          <li>Tap a 3 or 4 on a roll to pay 2 cards for a success.</li>
          <li>Search spaces show their item deck: orange means the top card is face up.</li>
        </ul>
        <p className="credit">
          Final Player is a fan-made digital version of the Final Girl board game by Van Ryder Games (designed by A.J. Porfirio and Evan Derrick). Buy the game; it's
          great.
        </p>
      </>
    ),
  },
];

export function RulesSheet({ onClose }: { onClose: () => void }) {
  const pager = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const onScroll = () => {
    const el = pager.current;
    if (!el || !el.clientWidth) return;
    const p = Math.round(el.scrollLeft / el.clientWidth);
    if (p !== page) setPage(Math.max(0, Math.min(PAGES.length - 1, p)));
  };
  const go = (i: number) => {
    const el = pager.current;
    if (!el) return;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    setPage(i);
  };
  return (
    <SheetFrame title="How to play" onClose={onClose} wide scroll={false} aside={<span className="vcr pg">{`${page + 1}/${PAGES.length}`}</span>}>
      <div className="rs">
        <div className="rules-pager scroll-x" ref={pager} onScroll={onScroll}>
          {PAGES.map((p, i) => (
            <article className="rpage scroll-y selectable" key={p.title} aria-roledescription="page" aria-label={`${i + 1} of ${PAGES.length}: ${p.title}`}>
              <div className="rp-in">
                <header className="rp-head">
                  <span className="vcr">{String(i + 1).padStart(2, '0')}</span>
                  <h4>{p.title}</h4>
                </header>
                {p.body}
              </div>
            </article>
          ))}
        </div>
        <nav className="dots" aria-label="Pages">
          {PAGES.map((p, i) => (
            <button key={p.title} type="button" className={`dot${i === page ? ' on' : ''}`} aria-label={p.title} aria-current={i === page ? 'page' : undefined} onClick={() => go(i)}>
              <span />
            </button>
          ))}
        </nav>
      </div>
    </SheetFrame>
  );
}
