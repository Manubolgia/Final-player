// Dev-only proof sheet for the poster art (art-preview.html). Not imported by
// the app. Query: ?view=proof|sheet|mock|big  &id=hans  &tone=film|mono|night|blood
//                &set=killers|girls|places

import '@fontsource/anton/latin-400.css';
import '@fontsource/archivo/latin-500.css';
import '@fontsource/archivo/latin-700.css';
import '@fontsource/archivo-narrow/latin-700.css';
import '@fontsource/courier-prime/latin-400.css';
import '@fontsource/permanent-marker/latin-400.css';
import '@fontsource/vt323/latin-400.css';
import '../styles/tokens.css';
import './preview.css';
import type { CSSProperties, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { FILMS, FINAL_GIRLS, KILLERS, LOCATIONS } from '../../game/content';
import { SPINES } from '../film';
import { GirlArt, KillerArt, PlaceArt, hasGirlArt, hasKillerArt, hasPlaceArt, type Tone } from './posters';

const q = new URLSearchParams(location.search);
const view = q.get('view') ?? 'proof';
const tone = (q.get('tone') ?? 'film') as Tone;
const only = q.get('id');
const set = q.get('set');

type Item = { kind: 'killer' | 'girl' | 'place'; id: string; name: string; film: string };

const ITEMS: Item[] = [
  ...KILLERS.map((k) => ({ kind: 'killer' as const, id: k.id, name: k.name, film: FILMS.find((f) => f.killer.id === k.id)!.id })),
  ...FINAL_GIRLS.map((g) => ({ kind: 'girl' as const, id: g.id, name: g.name, film: g.film })),
  ...LOCATIONS.map((l) => ({ kind: 'place' as const, id: l.id, name: l.name, film: FILMS.find((f) => f.location?.id === l.id)!.id })),
].filter((i) => (!only || i.id === only) && (!set || `${i.kind}s` === set || (set === 'places' && i.kind === 'place')));

const has = (i: Item) => (i.kind === 'killer' ? hasKillerArt(i.id) : i.kind === 'girl' ? hasGirlArt(i.id) : hasPlaceArt(i.id));

function Art({ i, crop, fit, t = tone }: { i: Item; crop?: string; fit?: 'slice' | 'meet'; t?: Tone }) {
  if (i.kind === 'killer') return <KillerArt id={i.id} crop={crop as 'face'} fit={fit} tone={t} />;
  if (i.kind === 'girl') return <GirlArt id={i.id} crop={crop as 'face'} fit={fit} tone={t} />;
  return <PlaceArt id={i.id} crop={crop as 'focus'} fit={fit} tone={t} />;
}

const Frame = ({ w, h, children, round, className = '' }: { w: number; h: number; children: ReactNode; round?: boolean; className?: string }) => (
  <div className={`pv-frame${round ? ' round' : ''} ${className}`} style={{ width: w, height: h }}>
    {children}
  </div>
);

function Proof() {
  return (
    <main className="pv-proof">
      {ITEMS.map((i) => {
        const wide = i.kind === 'place';
        return (
          <section key={i.kind + i.id} className="pv-item">
            <h2>
              {i.name} <small>{i.kind} · {i.id}</small>
              {has(i) ? null : <span className="pv-todo">no art</span>}
            </h2>
            <div className="pv-row">
              <Frame w={300} h={wide ? 150 : 375}>
                <Art i={i} />
              </Frame>
              <div className="pv-col">
                <Frame w={120} h={wide ? 60 : 150}>
                  <Art i={i} />
                </Frame>
                <div className="pv-chips">
                  <Frame w={56} h={56}>
                    <Art i={i} crop={wide ? 'focus' : 'face'} />
                  </Frame>
                  <Frame w={56} h={56} round>
                    <Art i={i} crop={wide ? 'focus' : 'face'} />
                  </Frame>
                  <Frame w={wide ? 112 : 56} h={56}>
                    <Art i={i} />
                  </Frame>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </main>
  );
}

function Sheet() {
  return (
    <main className="pv-sheet">
      <div className="pv-grid">
        {ITEMS.filter((i) => i.kind !== 'place').map((i) => (
          <figure key={i.id}>
            <Frame w={120} h={150}>
              <Art i={i} />
            </Frame>
            <figcaption>{i.name}</figcaption>
          </figure>
        ))}
      </div>
      <div className="pv-grid wide">
        {ITEMS.filter((i) => i.kind === 'place').map((i) => (
          <figure key={i.id}>
            <Frame w={240} h={120}>
              <Art i={i} />
            </Frame>
            <figcaption>{i.name}</figcaption>
          </figure>
        ))}
      </div>
      <div className="pv-strip">
        {ITEMS.map((i) => (
          <Frame key={i.id} w={56} h={56}>
            <Art i={i} crop={i.kind === 'place' ? 'focus' : 'face'} />
          </Frame>
        ))}
      </div>
    </main>
  );
}

function Big() {
  const i = ITEMS[0];
  if (!i) return <p>Nothing to show.</p>;
  const wide = i.kind === 'place';
  return (
    <main className="pv-big">
      <div className="pv-frame" style={{ width: '100%', aspectRatio: wide ? '2 / 1' : '4 / 5' }}>
        <Art i={i} fit="meet" />
      </div>
    </main>
  );
}

/** The art in place: VHS spines on a shelf, a box back, a strip, the end poster. */
function Mock() {
  return (
    <main className="pv-mock">
      <div className="pv-shelf">
        {FILMS.map((f, n) => {
          const sp = SPINES[f.id];
          const style = { '--sp-bg': sp.bg, '--sp-ink': sp.title, '--sp-stripe': sp.stripe } as CSSProperties;
          return (
            <div key={f.id} className="pv-spine" style={style}>
              <span className="pv-cap">
                <KillerArt id={f.killer.id} crop="face" tone={tone} />
              </span>
              <span className="pv-stripe" />
              <span className="pv-title">{sp.short}</span>
              <span className="pv-girls">
                {f.finalGirls.map((g) => (
                  <span key={g.id} className="pv-girlchip">
                    <GirlArt id={g.id} crop="face" tone={tone} />
                  </span>
                ))}
              </span>
              <span className="pv-num">#{String(n + 1).padStart(2, '0')}</span>
            </div>
          );
        })}
      </div>
      <div className="pv-boxes">
        {FILMS.filter((f) => f.location).map((f) => {
          const sp = SPINES[f.id];
          return (
            <article key={f.id} className="pv-boxback" style={{ '--sp-bg': sp.bg, '--sp-ink': sp.title, '--sp-stripe': sp.stripe } as CSSProperties}>
              <div className="pv-bbart">
                <PlaceArt id={f.location!.id} tone={tone} />
              </div>
              <div className="pv-bbhead">
                <span className="pv-bbkiller">
                  <KillerArt id={f.killer.id} tone={tone} />
                </span>
                <h3>{f.name}</h3>
              </div>
            </article>
          );
        })}
      </div>
      <div className="pv-ends">
        <article className="pv-end">
          <KillerArt id="hans" tone="blood" />
          <h3>The end?</h3>
        </article>
        <article className="pv-end win">
          <GirlArt id="laurie" tone={tone} />
          <h3>She lived</h3>
        </article>
        <article className="pv-end">
          <KillerArt id="birds" tone="night" />
          <h3>Terror card</h3>
        </article>
      </div>
      <div className="pv-strips">
        {FILMS.map((f) => (
          <div key={f.id} className="pv-strip-mock">
            <span className="pv-sq">
              <KillerArt id={f.killer.id} crop="face" tone={tone} />
            </span>
            <b>{f.killer.name}</b>
            <span className="pv-sq girl">
              <GirlArt id={f.finalGirls[0].id} crop="face" tone={tone} />
            </span>
            <b>{f.finalGirls[0].name}</b>
          </div>
        ))}
      </div>
    </main>
  );
}

function Page() {
  return (
    <div className="pv">
      <header className="pv-head">
        <h1>Poster art</h1>
        <nav>
          {['proof', 'sheet', 'mock'].map((v) => (
            <a key={v} href={`?view=${v}&tone=${tone}`} aria-current={v === view}>
              {v}
            </a>
          ))}
          {(['film', 'mono', 'night', 'blood'] as const).map((t) => (
            <a key={t} href={`?view=${view}&tone=${t}${only ? `&id=${only}` : ''}`} aria-current={t === tone}>
              {t}
            </a>
          ))}
        </nav>
      </header>
      {view === 'sheet' ? <Sheet /> : view === 'mock' ? <Mock /> : view === 'big' ? <Big /> : <Proof />}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Page />);
