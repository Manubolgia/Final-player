// Dev-only proof sheet: every drawing at 300, 120 and 48 px, plus its band
// crop. Open /Final-player/art-preview.html?only=hans,laurie on the dev server.

import { createRoot } from 'react-dom/client';
import { Art, type Drawing } from './kit';
import { KILLER_ART } from './killers';
import { GIRL_ART } from './girls';
import { PLACE_ART } from './places';

const q = new URLSearchParams(location.search);
const only = q.get('only')?.split(',');
const sizes = (q.get('sizes') ?? '300,120,48').split(',').map(Number);
const all: [string, Drawing][] = [...Object.entries(KILLER_ART), ...Object.entries(GIRL_ART), ...Object.entries(PLACE_ART)];
const list = only ? all.filter(([id]) => only.includes(id)) : all;

const cell: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start', font: '12px monospace', color: '#efe6d2' };

function Proof({ id, d }: { id: string; d: Drawing }) {
  const [, , w, h] = d.box;
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 10, borderBottom: '2px solid #2e2017', flexWrap: 'wrap' }}>
      <div style={cell}>
        {id}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {sizes.map((s) => (
            <div key={s} style={{ width: w >= h ? s : (s * w) / h, height: w >= h ? (s * h) / w : s, border: '2px solid #141213' }}>
              <Art d={d} />
            </div>
          ))}
          <div style={{ width: 48, height: 48, border: '2px solid #141213', borderRadius: 6, overflow: 'hidden' }}>
            <Art d={d} crop="bust" />
          </div>
          <div style={{ width: 120, height: 120, border: '2px solid #141213' }}>
            <Art d={d} crop="bust" />
          </div>
          <div style={{ width: 300, height: (300 * d.crops.band[3]) / d.crops.band[2], border: '2px solid #141213' }}>
            <Art d={d} crop="band" />
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <div style={{ background: '#4a3324', minHeight: '100vh' }}>
    {list.map(([id, d]) => (
      <Proof key={id} id={id} d={d} />
    ))}
  </div>,
);
