import type { FilmDef, KillerDef } from '../types';
import { cu, draw, hor } from './helpers';

const spawn = cu('tb.spawn');
const attack = cu('tb.attack');

const killer: KillerDef = {
  id: 'birds',
  name: 'The Birds',
  film: 'terror',
  startHorror: 4,
  health: 1,
  invulnerable: true,
  bodiless: true,
  bloodlust: [
    { attack: 0, move: 0 },
    { attack: 0, move: 0, effects: [draw.event] },
    { attack: 0, move: 0, effects: [hor(1)] },
    { attack: 0, move: 0, darkPower: true },
    { attack: 0, move: 0, effects: [hor(1)] },
  ],
  maxEffect: [cu('tb.max')],
  maxText: 'before the Finale the next Terror card is discarded; after it, you lose 1 health.',
  action: [],
  minionAction: [attack, spawn],
  minion: {
    name: 'Bird',
    plural: 'Birds',
    count: 36,
    hp: 1,
    attack: 1,
    text: 'Birds never move. At most 3 share a space. A flock attacks ONE target in its space for as much damage as there are birds, going for ordinary victims before you. Each point of damage you deal kills a bird. If every space holds 3 birds, you lose.',
  },
  finales: [
    { id: 'birdAttack', name: 'Bird Attack', action: [], minionAction: [spawn, attack, spawn], ability: 'fin.birdAttack', text: 'From now on, to spawn birds roll one die and put that many in your space. Each Killer Phase: spawn ▸ attack ▸ spawn.' },
    { id: 'pests', name: 'Insufferable Pests', action: [], minionAction: [spawn, attack, spawn], ability: 'fin.pests', text: 'When birds spawn, the higher die is ALWAYS the number of birds. Each Killer Phase: spawn ▸ attack ▸ spawn.' },
    { id: 'endlessSwarm', name: 'Endless Swarm', action: [], minionAction: [spawn], ability: 'fin.endlessSwarm', text: 'Whenever you move into a space with 3 birds, lose 1 health (it can\'t be prevented). Each Killer Phase: spawn.' },
  ],
  darkPowers: [
    { id: 'waiting', name: 'They\'re Waiting to Attack', ability: 'dp.birdsWaiting', text: 'In the Upkeep, if 3 birds are in your space: +2 Horror.' },
    { id: 'birdnado', name: 'Birdnado', ability: 'dp.birdnado', text: 'In the Upkeep, if your space and the ones next to it hold 10 or more birds, lose 3 health (it can\'t be prevented).' },
    { id: 'runForLife', name: 'Run for Your Life', ability: 'dp.runForLife', text: 'In the Upkeep the victim farthest from you panics. If it panics into a space with 2 or more birds, it dies.' },
  ],
  terror: [
    { id: 'whereFrom', name: '"Where are they all coming from?"', copies: 3, text: 'Spawn birds. If 3 or fewer came, spawn birds again.', effects: [spawn, cu('tb.spawnIfFew')] },
    { id: 'hopeless', name: '"It\'s hopeless"', copies: 4, text: '+2 Horror. If any special victim is in play, spawn birds.', effects: [hor(2), cu('tb.spawnIfSpecial')] },
    { id: 'attacking', name: '"The birds are attacking!"', copies: 6, text: 'Birds attack in your space and in every space where they outnumber the victims. If there were no attacks: spawn birds and +1 Bloodlust.', effects: [cu('tb.attackOutnumber'), cu('tb.ifNoAttacks')] },
    { id: 'gettingIn', name: '"They\'re trying to get in!"', copies: 3, text: '+1 Horror. Instead of the usual spawn, roll a die and put that many birds in the search space closest to you.', effects: [hor(1), cu('tb.spawnSearch')] },
    { id: 'wall', name: 'Wall of Birds', copies: 1, stays: 'tb.wall', text: 'No victim can be saved at an exit with birds in it. Each bird killed puts a token here; at 5 it is removed from the game.', effects: [] },
  ],
  rules: 'There is no Killer on the board, just the flock. Bloodlust only triggers its track. Spawning birds: roll 2 dice; one is how many, the other where — 1 spread out as you like, 2 any one space, 3 the search space closest to you, 4 the exit closest to you, 5 the closest victim\'s space, 6 your space. Birds that don\'t fit spill into the nearest spaces. Win by saving every special victim: they hide until your ultimate is unlocked or no ordinary victim is left, then come out at the search spaces farthest from you. You lose if you die or every space holds 3 birds.',
  color: '#cfd8dc',
  icon: 'bird',
};

export const BIRDS: FilmDef = {
  id: 'terror',
  name: 'Terror from Above',
  tagline: 'No mask, no knife: just a sky full of birds that won\'t stop coming.',
  killer,
  finalGirls: [
    {
      id: 'paula',
      name: 'Paula',
      film: 'terror',
      health: 5,
      blurb: 'Her ultimate rolls two dice whenever one is called for.',
      slots: [
        { effects: [{ k: 'itemAny' }], text: 'Take the top item of any deck' },
        { effects: [hor(-1)], text: '−1 Horror' },
        { effects: [{ k: 'time', n: 2 }], text: '+2 Time' },
        { effects: [{ k: 'heal', n: 1 }], text: 'Heal 1' },
        { effects: [{ k: 'move', n: 2 }], text: 'Move up to 2' },
      ],
      ultimate: { ability: 'ult.paula', text: 'Whenever you would roll 1 die, roll 2 instead; when a particular result matters, you pick which die counts.' },
      extra: [{ k: 'time', n: 2 }],
      extraText: '+2 Time',
    },
    {
      id: 'melanie',
      name: 'Melanie',
      film: 'terror',
      health: 5,
      blurb: 'Can trade health for damage.',
      slots: [
        { effects: [{ k: 'heal', n: 1 }], text: 'Heal 1' },
        { effects: [{ k: 'heal', n: 1 }], text: 'Heal 1' },
        { effects: [hor(-1)], text: '−1 Horror' },
        { effects: [{ k: 'move', n: 2 }], text: 'Move up to 2' },
        { effects: [{ k: 'move', n: 1 }], text: 'Move 1' },
        { effects: [{ k: 'takeCard', card: 'guard' }], text: 'Take a Guard card' },
      ],
      ultimate: { ability: 'ult.melanie', text: 'Once per Action Phase you may lose 1 health (it can\'t be prevented) to deal 2 damage, split as you like, among the enemies in your space.' },
      extra: [{ k: 'heal', n: 1 }],
      extraText: 'Heal 1',
    },
  ],
  bonusItems: [],
};
