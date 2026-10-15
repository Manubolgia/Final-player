import '@fontsource/anton/latin-400.css';
import '@fontsource/archivo/latin-500.css';
import '@fontsource/archivo/latin-600.css';
import '@fontsource/archivo/latin-700.css';
import '@fontsource/archivo-narrow/latin-500.css';
import '@fontsource/archivo-narrow/latin-700.css';
import '@fontsource/courier-prime/latin-400.css';
import '@fontsource/courier-prime/latin-700.css';
import '@fontsource/permanent-marker/latin-400.css';
import '@fontsource/vt323/latin-400.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/pieces.css';
import './styles/table.css';
import './styles/board.css';
import './styles/strips.css';
import './styles/cards.css';
import './styles/tray.css';
import './styles/overlays.css';
import './styles/sheets.css';
import './styles/store.css';
import './library';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App, setUpdate } from './App';

// a game, not a page: no pinch-zoom
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });

const updateSW = registerSW({
  onNeedRefresh() {
    setUpdate(() => void updateSW(true));
  },
});
try {
  void navigator.storage?.persist?.();
} catch {
  // not available
}

const render = () => createRoot(document.getElementById('root')!).render(<App />);
Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 800))]).then(render, render);
