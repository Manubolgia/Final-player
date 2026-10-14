import { BOARDS } from '../../game/content/core';
import { finalGirlDef, killerDef, locationDef } from '../../game/content';
import type { GameState } from '../../game';
import { itemDef, terrorDef } from '../../game/engine/kernel';
import { Boot, DieFace, Emblem, Heart, Hourglass, Knife, Mask, Person } from '../art/Icons';

export function KillerPanel({ g, onOpen }: { g: GameState; onOpen: () => void }) {
  const k = killerDef(g.config.killer);
  const sp = k.bloodlust[g.killer.bloodlust];
  const dp = g.killer.darkPowers;
  const fin = k.finales.find((f) => f.id === g.killer.finale)!;
  const minors = g.killer.minors;
  return (
    <button className="panel" onClick={onOpen} type="button" aria-label="Killer board">
      <div className="who">
        <Emblem name={k.icon} color={k.color} />
        <div style={{ minWidth: 0 }}>
          <div className="name">{k.name}</div>
          <div className="sub">{k.title ?? locationDef(g.config.location).name}</div>
        </div>
      </div>
      <div className="grow" />
      {k.invulnerable ? (
        <span className="stat dim">∞</span>
      ) : (
        <span className="stat" title="Health">
          <Heart />
          {g.killer.health.hp}
          {g.killer.health.token === 'black' ? <span className="dim" style={{ fontSize: 12 }}>+?</span> : null}
        </span>
      )}
      <span className="stat" title="Attack">
        <Knife />
        {sp.attack}
      </span>
      <span className="stat" title="Movement">
        <Boot />
        {sp.move}
      </span>
      <div className="chips" style={{ maxWidth: 120, justifyContent: 'flex-end' }}>
        <span className={`chip ${dp.some((d) => d.revealed) ? 'dp' : ''}`}>{dp.some((d) => d.revealed) ? k.darkPowers.find((d) => d.id === dp[0].id)!.name : 'Dark Power ?'}</span>
        {g.killer.finaleRevealed ? <span className="chip fin">{fin.name}</span> : null}
        {minors.map((m) => (
          <span key={m.id} className="chip dp">
            {terrorDef(g, m.id).name} {m.hp ? `♥${m.hp}` : ''}
          </span>
        ))}
        {g.wrath.killer !== undefined ? <span className="chip fin">Wrath {g.wrath.killer}</span> : null}
        {g.wrath.divine !== undefined ? <span className="chip dp">Divine {g.wrath.divine}</span> : null}
      </div>
    </button>
  );
}

export function PlayerPanel({ g, onOpen }: { g: GameState; onOpen: () => void }) {
  const fg = finalGirlDef(g.config.finalGirl);
  const b = BOARDS[g.config.board];
  const savedSlots = g.fg.slots.filter(Boolean).length;
  return (
    <button className="panel" onClick={onOpen} type="button" aria-label="Your board" style={{ flexWrap: 'wrap', rowGap: 4 }}>
      <div className="who">
        <Person color="#79e2ff" />
        <div>
          <div className="name">{fg.name}</div>
          <div className="sub">
            {g.fg.ultimate ? 'Ultimate!' : `Saved ${savedSlots}/${g.fg.slots.length}`}
            {g.fg.saved > savedSlots ? ` (+${g.fg.saved - savedSlots})` : ''}
          </div>
        </div>
      </div>
      <span className="stat" title="Health">
        <Heart />
        {g.fg.health.hp}
        <span className="dim" style={{ fontSize: 13 }}>/{g.fg.health.max}</span>
      </span>
      <span className="stat" title="Time">
        <Hourglass />
        {g.fg.time < 0 ? '−' : g.fg.time}
      </span>
      <div className="grow" />
      <div className="row" style={{ gap: 4 }} title="Horror">
        <Mask className="" />
        <div className="track">
          {b.horror.map((h, i) => (
            <span key={i} className={[i === g.fg.horror ? 'on' : '', i === 0 ? 'green' : i === b.horror.length - 1 ? 'red' : ''].join(' ')}>
              {h.dice}
            </span>
          ))}
        </div>
      </div>
      {g.fg.items.length ? (
        <div className="chips" style={{ width: '100%' }}>
          {g.fg.items.map((it) => (
            <span key={it.uid} className={`chip ${it.inHands ? 'hand' : 'it'}`}>
              {itemDef(g, it.id).name}
              {it.uses !== undefined ? ` ·${it.uses}` : ''}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}

export function Dice({ dice, converted = [], auto34, onTap, selected = [], rolling }: { dice: number[]; converted?: number[]; auto34?: boolean; onTap?: (i: number) => void; selected?: number[]; rolling?: boolean }) {
  return (
    <div className="dice">
      {dice.map((d, i) => {
        const win = d >= 5 || converted.includes(i) || (auto34 && (d === 3 || d === 4));
        const part = !win && (d === 3 || d === 4);
        return (
          <button
            key={`${i}-${d}`}
            type="button"
            className={['die', win ? 'win' : '', part ? 'part' : '', selected.includes(i) ? 'sel' : '', rolling ? 'roll' : ''].join(' ')}
            onClick={() => onTap?.(i)}
            aria-label={`Die showing ${d}${win ? ', success' : part ? ', partial' : ''}`}
          >
            <DieFace n={d} />
          </button>
        );
      })}
    </div>
  );
}
