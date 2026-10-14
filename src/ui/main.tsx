import '@fontsource/creepster/400.css';
import '@fontsource/barlow-condensed/400.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import './styles.css';
import './library';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });
createRoot(document.getElementById('root')!).render(<App />);
