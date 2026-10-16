import type { GameState } from '../../game';
import { BOARDS } from '../../game/content/core';
import { finalGirlDef, killerDef } from '../../game/content';
import { diceCount } from '../../game/engine/dice';
import { itemDef } from '../../game/engine/kernel';
import type { DisplayView } from '../game/display';
import { Backpack, Boot, Crow, Emblem, Hand, Heart, HeartOutline, Hourglass, Knife } from '../pieces/icons';

const deckStack = (n: number) =>
  Array.from({ length: Math.min(6, Math.ceil(n / 2)) }, (_, i) => `${i + 1}px ${i + 1}px 0 ${i % 2 ? '#141213' : '#3a3334'}`).join(',') || 'none';

export function FinalCoin({ token }: { token: 'black' | 'white' }) {
  return (
    <span className={`coin ${token}`} title={token === 'black' ? 'Final Health token: face down' : 'Final Health token: already used'}>
      {token === 'black' ? '?' : '0'}
    </span>
  );
}

export function filmSticker(g: GameState, view: DisplayView): { text: string; cls: string } | null {
  if (g.config.killer === 'poltergeist') return { text: g.fg.items.some((i) => i.id === 'carolyn') ? 'Carolyn is with you' : 'Escape with Carolyn', cls: 'yellow' };
  if (g.film.birds) return { text: `Survivors ${g.film.birds.saved}/${g.film.birds.total}`, cls: 'black' };
  if (g.config.killer === 'drFright' && g.film.maple) {
    if (g.film.maple.blurred) return { text: 'Blurred', cls: 'purple' };
    if (g.film.maple.asleep) return { text: `Asleep ${4 - (g.film.maple.br?.deck?.length ?? 4)}/4`, cls: 'purple' };
    return { text: 'Awake', cls: '' };
  }
  if (g.wrath.killer !== undefined || g.wrath.divine !== undefined) return { text: `Wrath ${g.wrath.killer ?? '-'} · Divine ${g.wrath.divine ?? '-'}`, cls: '' };
  if (killerDef(g.config.killer).minion && !g.film.birds) return { text: `${killerDef(g.config.killer).minion!.plural} ${g.minionPool.ready.length} ready`, cls: '' };
  void view;
  return null;
}

export function KillerStrip({ g, view, onOpen }: { g: GameState; view: DisplayView; onOpen: () => void }) {
  const k = killerDef(g.config.killer);
  const sp = k.bloodlust[Math.min(view.bl, k.bloodlust.length - 1)];
  const dp = g.killer.darkPowers.find((d) => d.revealed);
  const dpDef = dp ? k.darkPowers.find((d) => d.id === dp.id) : null;
  const fin = k.finales.find((f) => f.id === g.killer.finale)!;
  const sticker = filmSticker(g, view);
  return (
    <button type="button" className="panel killer" onClick={onOpen} aria-label="Killer board">
      <span className="emb">
        <Emblem name={k.icon} className="emb-i" />
      </span>
      <span className="k-main">
        <span className="k-row">
          <span className={`k-name${k.name.length > 11 ? ' long' : ''}`}>{k.name}</span>
          {k.bodiless ? (
            <span className="stat">
              <Crow className="ico" />
              <b className="num">{view.minions.length}</b>
            </span>
          ) : k.invulnerable ? (
            <span className="stat">
              <Heart className="ico red" />
              <b>∞</b>
            </span>
          ) : (
            <span className="stat">
              <Heart className="ico red" />
              <b className="num">{view.khp}</b>
              <FinalCoin token={view.ktok} />
            </span>
          )}
        </span>
        <span className="k-row">
          <span className="ladder" aria-label={`Bloodlust ${view.bl + 1} of ${k.bloodlust.length}`}>
            {k.bloodlust.map((s, i) => (
              <span key={i} className={`rung${i < view.bl ? ' full' : ''}${i === view.bl ? ' here' : ''}${s.darkPower ? ' dp' : ''}${s.effects?.length ? ' fx' : ''}`} />
            ))}
          </span>
          {k.bodiless ? null : (
            <>
              <span className="stat sm">
                <Knife className="ico" />
                <b className="num">{sp.attack}</b>
              </span>
              <span className="stat sm">
                <Boot className="ico" />
                <b className="num">{sp.move}</b>
              </span>
            </>
          )}
        </span>
      </span>
      <span className={`dpcard${dpDef ? ' up' : ''}`} title={dpDef ? `Dark Power: ${dpDef.name}` : 'Dark Power: face down'}>
        <span className="dpmark" />
      </span>
      <span className={`tdeck${g.killer.finaleRevealed ? ' fin' : view.td <= 3 ? ' soon' : ''}`} style={{ boxShadow: g.killer.finaleRevealed ? undefined : deckStack(view.td) }} title={g.killer.finaleRevealed ? `Finale: ${fin.name}` : `${view.td} Terror cards left${view.td <= 3 ? ', the Finale is near' : ''}`}>
        <span className="tnum">{g.killer.finaleRevealed ? 'FIN' : view.td}</span>
      </span>
      {sticker ? <span className={`sticker sm film-st ${sticker.cls}`}>{sticker.text}</span> : null}
    </button>
  );
}

/** The Horror track as a dial: green to red, the marker on the current space, the dice you'd roll in the middle. */
export function HorrorDial({ g, level, size = 56 }: { g: GameState; level: number; size?: number }) {
  const spaces = BOARDS[g.config.board].horror;
  const n = spaces.length;
  const step = 360 / n;
  const seg = (i: number, r = 21) => {
    const a = (d: number) => ((d - 90) * Math.PI) / 180;
    const p = (d: number) => `${28 + r * Math.cos(a(d))} ${28 + r * Math.sin(a(d))}`;
    return `M ${p(i * step - step / 2 + 4)} A ${r} ${r} 0 0 1 ${p(i * step + step / 2 - 4)}`;
  };
  let dice = spaces[level]?.dice ?? 1;
  try {
    dice = diceCount(g, { kind: 'effect', label: 'preview', id: 'preview' }, false).n;
  } catch {
    // keep the track value
  }
  return (
    <svg viewBox="0 0 56 56" width={size} height={size} className="dial" aria-label={`Horror ${level}, ${dice} dice`}>
      {spaces.map((_, i) => (
        <g key={i}>
          <path d={seg(i)} stroke="#141213" strokeWidth={13} fill="none" />
          <path d={seg(i)} stroke={i === level ? '#c1272d' : i === 0 ? '#3e7a3a' : i === n - 1 ? '#b3161b' : '#dccfb4'} strokeWidth={9} fill="none" />
        </g>
      ))}
      <rect x={16} y={16} width={24} height={24} rx={5} fill="#c1272d" stroke="#141213" strokeWidth={2} />
      <text x={28} y={34} textAnchor="middle" className="dial-n">
        {dice}
      </text>
    </svg>
  );
}

function statusStickers(g: GameState): { text: string; cls: string }[] {
  const out: { text: string; cls: string }[] = [];
  if (g.fg.legTrap) out.push({ text: 'Leg trap', cls: 'red' });
  if (g.fg.cobra) out.push({ text: 'Cobra', cls: 'red' });
  if (g.mods.partialsNext || g.mods.partialsPhase) out.push({ text: '3-4 count', cls: 'yellow' });
  if (g.mods.skipNextAction) out.push({ text: 'Stunned', cls: 'black' });
  if (g.mods.bonusDice) out.push({ text: `+${g.mods.bonusDice} die`, cls: 'yellow' });
  if (g.mods.minusDicePhase) out.push({ text: `-${g.mods.minusDicePhase} dice`, cls: 'black' });
  if (g.film.maple?.asleep && g.config.killer === 'drFright') out.push({ text: 'Asleep', cls: 'purple' });
  return out;
}

export function GirlStrip({ g, view, onOpen }: { g: GameState; view: DisplayView; onOpen: () => void }) {
  const fg = finalGirlDef(g.config.finalGirl);
  const max = g.fg.health.max;
  const hands = g.fg.items.filter((i) => i.inHands);
  const pack = g.fg.items.filter((i) => !i.inHands);
  const slots = g.fg.slots;
  const st = statusStickers(g);
  return (
    <button type="button" className="panel girl" onClick={onOpen} aria-label="Your board">
      <HorrorDial g={g} level={view.fh} />
      <span className="g-main">
        <span className="g-row">
          <span className={`g-name${g.fg.ultimate ? ' ult' : ''}`}>{fg.name}</span>
          <span className="hearts" aria-label={`${view.fhp} of ${max} health`}>
            {max <= 7 ? Array.from({ length: max }, (_, i) => (i < view.fhp ? <Heart key={i} className="ico red" /> : <HeartOutline key={i} className="ico" />)) : (
              <>
                <Heart className="ico red" />
                <b className="num">{view.fhp}</b>
              </>
            )}
            <FinalCoin token={view.ftok} />
          </span>
          <span className="time">
            <Hourglass className="ico blue" />
            <b className="num">{view.ft < 0 ? '-' : view.ft}</b>
          </span>
        </span>
        <span className="g-row">
          <span className="itabs">
            {[0, 1].map((i) => {
              const it = hands[i];
              const twoHanded = hands[0] && itemDef(g, hands[0].id).hands === 2;
              if (i === 1 && twoHanded) return null;
              return it ? (
                <span key={i} className={`itab${itemDef(g, it.id).hands === 2 ? ' two' : ''}`}>
                  <Hand className="ico" />
                  <span className="itab-n">{itemDef(g, it.id).name}</span>
                </span>
              ) : (
                <span key={i} className="itab empty">
                  <Hand className="ico" />
                </span>
              );
            })}
            <span className="itab pack">
              <Backpack className="ico" />
              <b>{pack.length}</b>
            </span>
          </span>
          <span className="saved" aria-label={`${view.saved} saved`}>
            {g.fg.ultimate ? (
              <span className="sticker purple sm">Ultimate</span>
            ) : (
              slots.map((s, i) => <span key={i} className={`pip${s ? ' on' : ''}`} />)
            )}
          </span>
          {st.slice(0, 2).map((s) => (
            <span key={s.text} className={`sticker sm ${s.cls}`}>
              {s.text}
            </span>
          ))}
          {st.length > 2 ? <span className="sticker sm">+{st.length - 2}</span> : null}
        </span>
      </span>
    </button>
  );
}
