import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.tsx';
import { unlockSpeech } from './lib/speech';

// iOS only lets a page speak after a tap, so unlock the voice on the first touch anywhere.
document.addEventListener('pointerup', unlockSpeech, { once: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
