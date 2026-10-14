import type { Effect, FilmDef, ItemDef, KillerDef, LocationDef, WrathBy, WrathDef, ZoneDef } from '../types';
import { at, cu, draw, hor, ka, panic, range, time } from './helpers';

const W = 2000;
const H = 1775;
const z = (id: string, name: string, px: number, py: number, arrows: [string, number[]][], extra: Partial<ZoneDef> = {}): ZoneDef => ({
  id,
  name,
  ...at(px, py, W, H),
  panic: panic(arrows),
  ...extra,
});

const zones: ZoneDef[] = [
  z('lookout', 'Lookout Cabin', 560, 470, [['westWoods', [1]], ['rocks', [2]], ['cemetery', range(3, 6)]]),
  z('westWoods', 'West Woods', 230, 700, [['welcome', [1]], ['lookout', [2]], ['cemetery', range(3, 6)]]),
  z('cemetery', 'Cemetery', 720, 780, [['westWoods', [3]], ['lookout', [4]], ['rocks', [5]], ['meadow', [6]]], { sacred: true, landmark: true }),
  z('rocks', 'The Rocks', 1080, 560, [['northExit', [1]], ['lookout', [2]], ['shore', [3]], ['meadow', [4]], ['cemetery', [5, 6]]]),
  z('northExit', 'North Exit', 1390, 440, [['rocks', range(1, 3)], ['shore', range(4, 6)]], { exit: true }),
  z('shed', "Groundskeeper's Shed", 1780, 560, [['shore', range(3, 6)]], { search: true, landmark: true }),
  z('shore', 'Lakeshore', 1620, 700, [['shed', [1]], ['village', [2]], ['northExit', [3]], ['rocks', [4]], ['sacredTrees', [5, 6]]]),
  z('village', 'Village', 1800, 960, [['shore', [1]], ['eastWoods', [2]], ['sacredTrees', range(3, 6)]]),
  z('sacredTrees', 'Sacred Trees', 1530, 1200, [['shore', [3]], ['village', [4]], ['eastWoods', [5]], ['bridge', [6]]], { sacred: true, landmark: true }),
  z('eastWoods', 'East Woods', 1840, 1290, [['village', [1]], ['seExit', [2]], ['bridge', [3]], ['sacredTrees', range(4, 6)]]),
  z('seExit', 'Southeast Exit', 1880, 1600, [['eastWoods', range(1, 6)]], { exit: true }),
  z('bridge', 'The Bridge', 1480, 1560, [['lostFound', [1]], ['eastWoods', [2]], ['sacredTrees', range(3, 6)]]),
  z('lostFound', 'Lost and Found', 1080, 1620, [['southTrail', [1]], ['bridge', [2]], ['meadow', [3]], ['shrine', range(4, 6)]], { search: true, landmark: true }),
  z('meadow', 'The Meadow', 1080, 1120, [['lostFound', [1]], ['rocks', [2]], ['shrine', [3, 4]], ['cemetery', [5, 6]]]),
  z('shrine', 'Sacred Shrine', 730, 1370, [['swTrail', [3]], ['lostFound', [4]], ['southTrail', [5]], ['meadow', [6]]], { sacred: true, landmark: true }),
  z('welcome', 'Welcome Center', 400, 1100, [['westExit', [1]], ['westWoods', range(2, 4)], ['swTrail', [5, 6]]], { search: true, landmark: true }),
  z('westExit', 'West Exit', 120, 1180, [['welcome', range(1, 6)]], { exit: true }),
  z('swTrail', 'Southwest Trail', 300, 1430, [['welcome', [1]], ['southTrail', [2]], ['shrine', range(3, 6)]]),
  z('southTrail', 'South Trail', 600, 1620, [['swTrail', [1]], ['lostFound', [2]], ['shrine', range(3, 6)]]),
];

const bySacred: Effect = { k: 'wrath', which: 'divine', op: 'increase', by: 'sacredVictims' };
const unleashDivine: Effect = { k: 'unleash', which: 'divine' };
const discardCards = (n: number): Effect => ({ k: 'discardRandom', n });

const divine: WrathDef = {
  kind: 'divine',
  name: 'Divine Wrath',
  start: 2,
  levels: [
    { effects: [time(-1), { k: 'wrath', which: 'divine', op: 'increase', n: 1 }], text: '−1 Time ▸ raise the Divine Wrath by 1.' },
    { effects: [time(-2)], text: '−2 Time.' },
    { effects: [hor(1)], text: '+1 Horror.' },
    { effects: [discardCards(1)], text: 'Discard 1 random action card.' },
    { effects: [time(-4)], text: '−4 Time.' },
    { effects: [hor(2)], text: '+2 Horror.' },
    { effects: [discardCards(1), hor(1), time(-2)], text: 'Discard 1 random action card ▸ +1 Horror ▸ −2 Time.' },
    { effects: [discardCards(2), time(-5)], text: 'Discard 2 random action cards ▸ −5 Time.' },
    { effects: [hor(2), time(-4)], text: '+2 Horror ▸ −4 Time.' },
    { effects: [cu('gr.purge')], text: 'Discard EVERY action card in hand but Atone; lower the Divine Wrath by the number discarded.' },
  ],
};

const items: ItemDef[] = [
  { id: 'trashLid', name: 'Trash Can Lid', hands: 1, uses: 3, ability: 'item.trashLid', text: 'Ignore 1 damage from an attack. 3 uses.' },
  { id: 'ceremonialDagger', name: 'Ceremonial Dagger', hands: 1, range: [0, 0], damage: 1, modifies: 'any', ability: 'item.ceremonialDagger', text: 'Weapon: range 0, +1 damage. Whenever you damage the Killer, lower the Killer Wrath or the Divine Wrath by 1.' },
  { id: 'mysteryPills', name: 'Mystery Pills', hands: 0, ability: 'item.pills', text: 'Discard during the Action Phase: −1 Horror, or heal 2.' },
  { id: 'shamanBones', name: "Shaman's Bones", hands: 1, uses: 3, ability: 'item.shamanBones', text: 'Look at the next Terror card and put it on the top or the bottom of the deck. 3 uses.' },
  { id: 'tribalMask', name: 'Tribal Mask', hands: 0, ability: 'item.tribalMask', text: 'Whenever you lose health, lower the Killer Wrath or the Divine Wrath by that much.' },
  { id: 'energyDrink', name: 'Energy Drink', hands: 0, ability: 'item.energyDrink', text: 'Discard during the Action Phase: +3 Time, or move 1 space.' },
  { id: 'oldRifle', name: 'Old Rifle', hands: 2, range: [1, 2], damage: 0, modifies: ['weakAttack'], ability: 'item.oldRifle', text: 'Weapon: range 1–2, no extra damage. Only with Weak Attack. From a sacred space, +2 to its maximum range.' },
  { id: 'warClub', name: 'War Club', hands: 2, range: [0, 0], damage: 1, modifies: 'any', ability: 'item.warClub', text: 'Weapon: range 0, +1 damage. Whenever you deal damage with it, lower the Killer Wrath or the Divine Wrath by that much.' },
  { id: 'firstAid', name: 'First Aid Kit', hands: 1, ability: 'item.firstAid', text: 'Whenever you heal with an action card, heal 1 more.' },
  { id: 'outOfOrder', name: 'Out of Order Signs', hands: 0, ability: 'item.outOfOrder', text: 'For 1 Time, put or take back a sign on the connection between your space and an adjacent one (2 signs). Victims won\'t cross it unless they\'re following you.' },
  { id: 'airHorn', name: 'Air Horn', hands: 0, ability: 'item.airHorn', text: 'For 1 Time, every victim in your space and the adjacent ones panics.' },
  { id: 'incense', name: 'Incense', hands: 0, ability: 'item.incense', text: 'Whenever the Killer Wrath or the Divine Wrath rises, it rises 1 less (at least 1).' },
  { id: 'pepperSpray', name: 'Pepper Spray', hands: 1, ability: 'item.pepperSpray', text: 'If the Killer is in your space, discard to end the Killer Phase at once.' },
  { id: 'metalBat', name: 'Metal Bat', hands: 2, range: [0, 0], damage: 1, modifies: 'any', ability: 'item.metalBat', text: 'Weapon: range 0, +1 damage. Whenever you damage the Killer with it, you may also discard a Minor Dark Power.' },
  { id: 'map', name: 'Map', hands: 0, ability: 'item.map', text: 'Discard during the Action Phase. For each item deck: turn up a face-down top card, or remove a face-up one and turn up the next.' },
  { id: 'prayerBook', name: 'Prayer Book', hands: 0, uses: 2, ability: 'item.prayerBook', text: 'When you play Atone, add 1 success. 2 uses.' },
  { id: 'whip', name: 'Whip', hands: 1, range: [0, 0], damage: 1, modifies: 'any', ability: 'item.whip', text: 'Weapon: range 0, +1 damage. If you damage an enemy with it, you may drag it 1 space.' },
];

const location: LocationDef = {
  id: 'sacredGroves',
  name: 'Sacred Groves',
  film: 'groves',
  aspect: W / H,
  zones,
  itemDecks: ['welcome', 'lostFound', 'shed'],
  setups: [
    { id: 'familyDay', name: 'Family Day', fg: 'meadow', killer: 'swTrail', victims: { welcome: 2, lookout: 2, shrine: 2, cemetery: 2, bridge: 2, shore: 2 } },
    { id: 'swampThing', name: 'The Swamp Thing', fg: 'meadow', killer: 'sacredTrees', victims: { swTrail: 1, lookout: 1, shrine: 1, cemetery: 1, lostFound: 2, rocks: 2, eastWoods: 1, village: 1, shed: 2 } },
    { id: 'griefTour', name: 'Grief Tour', fg: 'seExit', killer: 'shed', victims: { shrine: 1, cemetery: 1, lostFound: 4, rocks: 4, bridge: 1, shore: 1 } },
    { id: 'touristHordes', name: 'Tourist Hordes', fg: 'westExit', killer: 'seExit', victims: { welcome: 1, shrine: 1, cemetery: 1, lostFound: 1, meadow: 6, rocks: 1, shore: 1 } },
    { id: 'worship', name: 'Worship Service', fg: 'swTrail', killer: 'meadow', victims: { westWoods: 1, lookout: 1, bridge: 2, sacredTrees: 2, shore: 2, eastWoods: 2, village: 2 } },
  ],
  events: [
    { id: 'closed', name: 'Closed for Maintenance', persistent: true, ability: 'ev.closed', text: 'You may discard ALL your action cards except Atone to close a sacred space: put the Closed token there and spread its victims into the adjacent spaces. Victims can\'t go in for any reason; you and enemies can.' },
    { id: 'fireBrimstone', name: 'Fire and Brimstone', persistent: true, ability: 'ev.fireBrimstone', text: 'Roll a die: 1–2 Cemetery, 3–4 Sacred Shrine, 5–6 Sacred Trees gets the token. Each victim there counts as 2 for Divine Wrath rises.' },
    { id: 'sacredGround', name: 'Sacred Ground', persistent: true, ability: 'ev.sacredGround', text: 'Roll a die: 1–2 Cemetery, 3–4 Sacred Shrine, 5–6 Sacred Trees gets the token. Whenever you end an Action Phase there, gain 2 Time.' },
    { id: 'superTourist', name: 'The Super Tourist', persistent: true, special: true, ability: 'ev.superTourist', text: 'The victim farthest from the Killer is the Super Tourist. Whenever the Killer picks a target, he picks the Super Tourist. Save him: lower a Wrath by 4. If he dies: Divine Wrath +4.' },
    { id: 'holyMan', name: 'The Holy Man', persistent: true, special: true, ability: 'ev.holyMan', text: 'The victim farthest from the Killer is the Holy Man. He won\'t follow you; each Upkeep he walks 1 space toward the Killer. When they meet he\'s gone: if you were there, set a Wrath to 4; if not, raise the two Wraths by 10 in total (you split it).' },
    { id: 'tourGuide', name: 'The Tour Guide', persistent: true, special: true, ability: 'ev.tourGuide', text: 'The victim closest to you is the Tour Guide. While he\'s with you, once a turn when you move at least 1 space you may move 1 more. If he dies: Divine Wrath +6.' },
    { id: 'loudObnoxious', name: 'Loud and Obnoxious', persistent: true, ability: 'ev.loudObnoxious', text: 'Whenever the Divine Wrath rises, it rises 1 more.' },
    { id: 'godsHateFailure', name: 'The Gods Hate Failure', persistent: true, ability: 'ev.godsHateFailure', text: 'Whenever a horror roll of yours ends with no successes at all, Divine Wrath +1.' },
    { id: 'unholySlaughter', name: 'Unholy Slaughter', persistent: true, ability: 'ev.unholySlaughter', text: 'Whenever a victim is killed in a sacred space, unleash the Divine Wrath.' },
    { id: 'flashPhoto', name: 'Flash Photography', persistent: true, ability: 'ev.flashPhoto', text: 'Whenever at least 1 victim in your space panics, discard a random action card.' },
  ],
  terror: [
    { id: 'wrathOfGods', name: 'The Wrath of the Gods', copies: 1, text: 'Draw an Event ▸ Divine Wrath + victims in sacred spaces ▸ the Killer appears in the sacred space with the most victims (yours if none) ▸ nearest ▸ attack ▸ attack.', effects: [draw.event, bySacred, cu('gr.killerToSacred'), ka('nearest', 0, 2)] },
    { id: 'furyOfGods', name: 'The Fury of the Gods', copies: 1, text: 'Draw an Event ▸ Divine Wrath + victims in sacred spaces ▸ unleash it ▸ raise it by the victims in sacred spaces again.', effects: [draw.event, bySacred, unleashDivine, bySacred] },
    { id: 'initials', name: '"Let me carve my initials right here…"', copies: 1, text: 'Divine Wrath + victims in sacred spaces ▸ unleash it ▸ 2 new victims in the Sacred Shrine ▸ every victim next to the Shrine moves in.', effects: [bySacred, unleashDivine, { k: 'victims', n: 2, at: 'shrine' }, cu('gr.gather:shrine')] },
    { id: 'branches', name: '"Nobody will notice one little branch"', copies: 1, text: 'Divine Wrath + victims in sacred spaces ▸ unleash it ▸ 2 new victims in the Sacred Trees ▸ every victim next to the Trees moves in.', effects: [bySacred, unleashDivine, { k: 'victims', n: 2, at: 'sacredTrees' }, cu('gr.gather:sacredTrees')] },
    { id: 'touristTrap', name: 'Tourist Trap', copies: 1, text: 'Every victim next to a sacred space moves into it ▸ Divine Wrath + victims in sacred spaces ▸ nearest ▸ move ▸ attack.', effects: [cu('gr.gather:sacred'), bySacred, ka('nearest', 1, 1)] },
    { id: 'selfie', name: '"From up on that statue, what a selfie!"', copies: 1, text: 'Divine Wrath + victims in sacred spaces ▸ unleash it ▸ 2 new victims in the Cemetery ▸ every victim next to the Cemetery moves in.', effects: [bySacred, unleashDivine, { k: 'victims', n: 2, at: 'cemetery' }, cu('gr.gather:cemetery')] },
    { id: 'divinePunishment', name: 'Divine Punishment', copies: 1, text: 'Unleash the Divine Wrath ▸ unleash it again ▸ nearest ▸ move ▸ attack ▸ draw an Event.', effects: [unleashDivine, unleashDivine, ka('nearest', 1, 1), draw.event] },
    { id: 'fickleGods', name: 'The Fickleness of the Gods', copies: 1, stays: 'tr.fickleGods', text: 'Stays in play. At the end of each Upkeep make a horror roll. 2+: lower a Wrath by 1. 1: nothing. None: unleash the Divine Wrath and raise it by the victims in sacred spaces. Spend 3 Time in an Action Phase to discard this.', effects: [] },
  ],
  items,
  rules: 'Divine Wrath: starts at 2 (1–10); unleashing it applies its current level. Each Bloodlust rise also triggers that line of the Groves track. Sacred spaces: Cemetery, Sacred Shrine and Sacred Trees. Two Atone cards join the tableau.',
  wrath: divine,
  bloodlustTrack: [
    { effects: [bySacred], text: 'Divine Wrath + victims in sacred spaces.' },
    { effects: [], text: '' },
    { effects: [unleashDivine], text: 'Unleash the Divine Wrath.' },
    { effects: [bySacred], text: 'Divine Wrath + victims in sacred spaces.' },
    { effects: [], text: '' },
    { effects: [unleashDivine], text: 'Unleash the Divine Wrath.' },
    { effects: [bySacred, unleashDivine], text: 'Divine Wrath + victims in sacred spaces, then unleash it.' },
  ],
  finaleToken: { effects: [unleashDivine, { k: 'wrath', which: 'divine', op: 'increase', n: 1 }], text: 'After the Killer acts: unleash the Divine Wrath, then raise it by 1.' },
  ground: '#183323',
  accent: '#c7a6ff',
  icon: 'tombstone',
};

const raiseK = (n: number): Effect => ({ k: 'wrath', which: 'killer', op: 'increase', n });
const byK = (by: WrathBy): Effect => ({ k: 'wrath', which: 'killer', op: 'increase', by });
const unleashK: Effect = { k: 'unleash', which: 'killer' };
const healK = (n: number): Effect => ({ k: 'killerHeal', n });

const killer: KillerDef = {
  id: 'inkanyamba',
  name: 'Inkanyamba',
  title: 'the Avenger',
  film: 'groves',
  startHorror: 4,
  health: 9,
  bloodlust: [
    { attack: 1, move: 2 },
    { attack: 1, move: 2 },
    { attack: 1, move: 3 },
    { attack: 2, move: 3, darkPower: true },
    { attack: 2, move: 3 },
    { attack: 2, move: 3 },
    { attack: 2, move: 4 },
    { attack: 2, move: 4 },
    { attack: 3, move: 5 },
  ],
  maxEffect: [cu('discardNextTerror'), cu('discardNextTerror')],
  maxText: 'discard the next 2 Terror cards.',
  action: [cu('gr.initialWrath'), ka('nearest', 0, 1)],
  wrath: {
    kind: 'killer',
    name: 'Killer Wrath',
    start: 2,
    levels: [
      { effects: [raiseK(1)], text: 'Raise the Killer Wrath by 1.' },
      { effects: [raiseK(2)], text: 'Raise the Killer Wrath by 2.' },
      { effects: [hor(1)], text: '+1 Horror.' },
      { effects: [hor(1), ka('nearest', 1, 0)], text: '+1 Horror ▸ nearest ▸ move.' },
      { effects: [hor(2)], text: '+2 Horror.' },
      { effects: [ka('nearest', 1, 1)], text: 'Nearest ▸ move ▸ attack.' },
      { effects: [healK(1), ka('nearest', 1, 1)], text: 'Inkanyamba heals 1 ▸ nearest ▸ move ▸ attack.' },
      { effects: [healK(1), hor(1), ka('nearest', 1, 1)], text: 'Heals 1 ▸ +1 Horror ▸ nearest ▸ move ▸ attack.' },
      { effects: [healK(2), hor(1), ka('nearest', 1, 1)], text: 'Heals 2 ▸ +1 Horror ▸ nearest ▸ move ▸ attack.' },
      { effects: [healK(2), hor(1), ka('nearest', 1, 2)], text: 'Heals 2 ▸ +1 Horror ▸ nearest ▸ move ▸ attack ▸ attack.' },
    ],
  },
  finales: [
    { id: 'savageCyclone', name: 'Savage Cyclone', action: [unleashK, raiseK(1), ka('nearest', 1, 2)], text: 'Killer action: unleash the Killer Wrath ▸ raise it by 1 ▸ nearest ▸ move ▸ attack ▸ attack.' },
    { id: 'violentTantrum', name: 'Violent Tantrum', action: [unleashK, raiseK(3), ka('nearest', 1, 1)], text: 'Killer action: unleash the Killer Wrath ▸ raise it by 3 ▸ nearest ▸ move ▸ attack.' },
    { id: 'miracle', name: 'We Need a Miracle', action: [unleashK, ka('nearest', 1, 1)], ability: 'fin.miracle', text: 'When revealed the Killer Wrath goes to 10; then take action cards into your hand worth up to 6 in total. Killer action: unleash the Killer Wrath ▸ nearest ▸ move ▸ attack.' },
  ],
  darkPowers: [
    { id: 'wrathFeast', name: 'Feast of Wrath', ability: 'dp.wrathFeast', text: 'Whenever the Killer Wrath rises, Inkanyamba heals 1.' },
    { id: 'growingFear', name: 'Growing Fear', ability: 'dp.growingFear', text: 'Whenever the Killer Wrath rises, +1 Horror.' },
    { id: 'volatileTemper', name: 'Volatile Temper', ability: 'dp.volatileTemper', text: 'After each Upkeep Phase, make a horror roll: with no successes, unleash the Killer Wrath.' },
    { id: 'darkLightning', name: 'Dark Lightning', epic: true, ability: 'dp.darkLightning', text: 'Epic. Whenever Inkanyamba kills a victim, a second victim in that space or an adjacent one dies too.' },
  ],
  terror: [
    { id: 'nothingWeCanDo', name: '"He\'s coming, and there\'s nothing we can do!"', copies: 4, requiresVictims: true, text: '+1 Horror ▸ closest victim ▸ move ▸ attack.', effects: [hor(1), ka('victim', 1, 1)] },
    { id: 'fickleTemper', name: 'Fickle Temper', copies: 2, text: 'Horror roll. 2+: halve a Wrath (round up). 1: lower a Wrath by 1. None: unleash the Killer Wrath, then roll a die and raise it by that much ▸ closest victim (else you) ▸ move ▸ attack.', effects: [cu('gr.fickleTemper'), ka('victimElseFG', 1, 1)] },
    { id: 'wrathBlood', name: 'Wrath of Blood', copies: 1, text: 'Unleash the Killer Wrath ▸ raise it by the Bloodlust level ▸ closest victim (else you) ▸ move ▸ attack.', effects: [unleashK, byK('bloodlustLevel'), ka('victimElseFG', 1, 1)] },
    { id: 'wrathOpportunity', name: 'Wrath of Opportunity', copies: 1, text: 'Unleash the Killer Wrath ▸ raise it by the cards in your hand ▸ closest victim (else you) ▸ move ▸ attack.', effects: [unleashK, byK('handSize'), ka('victimElseFG', 1, 1)] },
    { id: 'wrathDeath', name: 'Wrath of Death', copies: 1, text: 'Unleash the Killer Wrath ▸ raise it by your health ▸ closest victim (else you) ▸ move ▸ attack.', effects: [unleashK, byK('fgHealth'), ka('victimElseFG', 1, 1)] },
    { id: 'wrathDesecrators', name: 'Wrath of the Desecrators', copies: 1, text: 'Unleash the Killer Wrath ▸ raise it by the victims you\'ve saved ▸ closest victim (else you) ▸ move ▸ attack.', effects: [unleashK, byK('saved'), ka('victimElseFG', 1, 1)] },
    { id: 'wrathHorror', name: 'Wrath of Horror', copies: 1, text: 'Unleash the Killer Wrath ▸ raise it by your Horror level (green 0 … red 7) ▸ closest victim (else you) ▸ move ▸ attack.', effects: [unleashK, byK('horrorLevel'), ka('victimElseFG', 1, 1)] },
    { id: 'punishmentMercy', name: 'Punishment or Mercy', copies: 1, text: 'By the Killer Wrath: 1–3 raise it by 2 and unleash it; 4–5 raise it by 2; 6–9 halve it (round up); 10 set it to 1.', effects: [cu('gr.punishmentMercy')] },
    { id: 'disrespected', name: '"They disrespected him. Now he wants blood."', copies: 1, requiresVictims: true, text: 'Closest victim ▸ move ▸ attack ▸ attack ▸ raise the Killer Wrath by the victims killed this turn.', effects: [ka('victim', 1, 2), byK('killedThisTurn')] },
    { id: 'madeHimAngry', name: '"Somehow we made him angry"', copies: 1, text: 'Final Girl ▸ move ▸ attack ▸ attack ▸ raise the Killer Wrath by the damage you took.', effects: [cu('gr.markDamage'), ka('finalGirl', 1, 2), byK('damageSinceMark')] },
    { id: 'boilingWrath', name: 'Boiling Wrath', copies: 1, minor: { hp: 2, ability: 'mdp.boilingWrath' }, text: 'Minor Dark Power (2 health). Each Upkeep make a horror roll: with no successes, raise the Killer Wrath by 1.', effects: [] },
    { id: 'outrageAddict', name: 'Outrage Addict', copies: 1, minor: { hp: 3, ability: 'mdp.outrageAddict' }, text: 'Minor Dark Power (3 health). Whenever the Killer Wrath rises, it rises 1 more.', effects: [] },
  ],
  rules: 'Killer Wrath: starts at 2 (1–10); unleashing it applies its current level. Two Atone cards join the tableau to calm it.',
  color: '#ff8a1e',
  icon: 'claw',
};

export const GROVES: FilmDef = {
  id: 'groves',
  name: 'Slaughter in the Groves',
  tagline: 'Sacred ground, tourists everywhere, and an angry god.',
  killer,
  location,
  finalGirls: [
    {
      id: 'adelaide',
      name: 'Adelaide',
      film: 'groves',
      health: 6,
      blurb: 'Steady nerves. Her ultimate is a miracle.',
      slots: [
        { effects: [time(2)], text: '+2 Time' },
        { effects: [hor(-1)], text: '−1 Horror' },
        { effects: [hor(-1)], text: '−1 Horror' },
        { effects: [time(2)], text: '+2 Time' },
        { effects: [{ k: 'move', n: 1 }], text: 'Move 1' },
      ],
      ultimate: { ability: 'ult.adelaide', text: 'When it unlocks, pick one: set a Wrath to 1, heal fully, or take action cards worth up to 6.' },
      extra: [hor(-1)],
      extraText: '−1 Horror',
      bonusItem: 'adelaidesBat',
    },
    {
      id: 'barbara',
      name: 'Barbara',
      film: 'groves',
      health: 7,
      blurb: 'Toughest of them all. Victims follow her anywhere.',
      slots: [
        { effects: [hor(-1)], text: '−1 Horror' },
        { effects: [time(2)], text: '+2 Time' },
        { effects: [{ k: 'heal', n: 1 }], text: 'Heal 1' },
        { effects: [{ k: 'itemAny' }], text: 'Take the top item of any deck' },
        { effects: [{ k: 'move', n: 1 }], text: 'Move 1' },
      ],
      ultimate: { ability: 'ult.barbara', text: 'Victims follow you into the Killer\'s space. When you damage an enemy in your space you may add 1 damage per victim there; each extra point kills one of them (no Bloodlust).' },
      extra: [time(1)],
      extraText: '+1 Time',
      bonusItem: 'barbarasRifle',
    },
  ],
  bonusItems: [
    { id: 'adelaidesBat', name: "Adelaide's Bat and Shield", hands: 2, range: [0, 0], damage: 2, modifies: 'any', onlyFor: 'adelaide', ability: 'item.adelaideBat', text: 'Adelaide only. Weapon: range 0, +2 damage. Whenever Guard gets at least 1 success, deal 1 damage to the enemy that attacked you.' },
    { id: 'barbarasRifle', name: "Barbara's Rifle", hands: 2, range: [1, 4], damage: 1, uses: 4, modifies: ['weakAttack'], onlyFor: 'barbara', text: 'Barbara only. Weapon: range 1–4, +1 damage, 4 uses. Only with Weak Attack.' },
  ],
};
