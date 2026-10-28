import { useState } from 'react';
import type { Go } from '../App';
import { Avatar } from '../components/Avatar';
import { PLACEMENT } from '../data/scenarios';
import { unlockSpeech } from '../lib/speech';
import { useApp } from '../state';

export function Welcome({ go }: { go: Go }) {
  const { data, update } = useApp();
  const [name, setName] = useState(data.settings.learnerName);
  const [key, setKey] = useState(data.settings.apiKey);

  const start = () => {
    unlockSpeech();
    update((d) => ({ ...d, settings: { ...d.settings, learnerName: name.trim() || 'amigo', apiKey: key.trim() } }));
    go({ name: 'conversation', scenario: PLACEMENT });
  };

  return (
    <main className="page welcome">
      <Avatar state="idle" size={150} />
      <h1 className="hero-title">Charla</h1>
      <p className="lead">Hola, I’m Sofi. We’ll talk in Spanish, and I’ll adjust to your level as we go.</p>

      <label className="field">
        <span>What should I call you?</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" autoComplete="given-name" />
      </label>

      <label className="field">
        <span>Claude API key</span>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-ant-…"
          type="password"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <small>
          Stored only on this phone. Get one at{' '}
          <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noreferrer">
            platform.claude.com
          </a>
          . Leave it empty to try demo mode.
        </small>
      </label>

      <button className="btn primary big" onClick={start}>
        Start my placement chat
      </button>
      <p className="fine">About 5 minutes. Speak or type, whatever’s comfortable.</p>
    </main>
  );
}
