// Map tokens as printed chits: a short label and a fill. Chits sit in a space's
// token slot (50 px wide), so long names print on two lines.

export const TOKEN_CHIT: Record<string, { label: string; fill: string; ink?: string; lines?: [string, string] }> = {
  bearTrap: { label: 'TRAP', fill: '#c9a46a' },
  fireworks: { label: 'FIREWORKS', fill: '#f2c230', lines: ['FIRE-', 'WORKS'] },
  motorboat: { label: 'BOAT', fill: '#efe6d2' },
  darkWaters: { label: 'DARK WATERS', fill: '#1e1a1b', ink: '#efe6d2', lines: ['DARK', 'WATERS'] },
  tunnel: { label: 'TUNNEL', fill: '#c9a46a' },
  skull: { label: 'DEATH', fill: '#1e1a1b', ink: '#efe6d2' },
  helicopter: { label: 'HELI', fill: '#efe6d2' },
  brokenLadder: { label: 'BROKEN', fill: '#b3161b', ink: '#f7f1e3' },
  ropeLadder: { label: 'ROPE', fill: '#c9a46a' },
  padlock: { label: 'LOCK', fill: '#d4a12a' },
  closed: { label: 'CLOSED', fill: '#b3161b', ink: '#f7f1e3' },
  fireBrimstone: { label: 'BRIMSTONE', fill: '#e8742a', lines: ['BRIM-', 'STONE'] },
  sacredGround: { label: 'SACRED', fill: '#d4a12a' },
  acidTrap: { label: 'ACID', fill: '#a9b04a' },
  netTrap: { label: 'NET', fill: '#c9a46a' },
  sawTrap: { label: 'SAWS', fill: '#c9a46a' },
  golfCart: { label: 'CART', fill: '#f2c230' },
  policeCar: { label: 'POLICE', fill: '#3a7bd5', ink: '#f7f1e3' },
  mlFire: { label: 'FIRE', fill: '#e8742a' },
  barrier: { label: 'ROAD CLOSED', fill: '#b3161b', ink: '#f7f1e3', lines: ['ROAD', 'CLOSED'] },
  bicycle: { label: 'BIKE', fill: '#efe6d2' },
  boobyTrap: { label: 'BOOBY TRAP', fill: '#c9a46a', lines: ['BOOBY', 'TRAP'] },
  outOfOrder: { label: 'OUT OF ORDER', fill: '#d4a12a', lines: ['OUT OF', 'ORDER'] },
};

/** A perched crow, facing right, in a 24-unit box: printed on the bird tokens. */
export const BIRD =
  'M22.6 8.4 L19.8 9.7 C20 12.6 17.9 15.7 13.8 16.5 L14.8 20.2 H13.4 L12.4 16.7 C11.2 16.7 9.6 16.3 8.2 15.7 L2.4 18.4 L3.5 16.1 L1.4 15.3 L7.9 12 C9.7 9.5 12.5 7.7 15.1 7.3 C15.7 5.4 17.2 4.6 18.7 4.8 C20 5 20.8 6.3 21 7.3 Z';
