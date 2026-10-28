import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.tsx';
import { unlockAudio } from './lib/audio';
import { unlockSpeech } from './lib/speech';

// iOS only lets a page play sound after a tap, so unlock on the first touch anywhere,
// and re-arm audio on later taps in case iOS paused it while the app was in the background.
document.addEventListener('pointerup', unlockSpeech, { once: true });
document.addEventListener('pointerup', unlockAudio);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
