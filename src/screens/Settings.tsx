import { useEffect, useRef, useState } from 'react';
import type { Go } from '../App';
import { TopBar } from '../components/ui';
import { PLACEMENT } from '../data/scenarios';
import { friendlyError, testKey, TUTOR_MODELS } from '../lib/claude';
import { downloadCalendarReminder, enablePush, isInstalled, REPO_SECRETS_URL, testNotification } from '../lib/reminders';
import { beep, OPENAI_VOICES } from '../lib/audio';
import { speak, spanishVoices } from '../lib/speech';
import { clearData, exportBackup, parseBackup } from '../lib/storage';
import { useApp } from '../state';

function hourLabel(h: number) {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Plays each sound path separately and shows what happened, so audio problems can be pinned down on the phone. */
function SoundCheck({ hasVoiceKey }: { hasVoiceKey: boolean }) {
  const [lines, setLines] = useState<string[]>([]);
  const log = (l: string) => setLines((x) => [...x, l]);

  const tone = async () => {
    const result = await beep();
    log(result === 'played' ? 'Test tone played. Did you hear two notes?' : `Test tone failed: ${result}`);
  };

  const phone = () => {
    if (!('speechSynthesis' in window)) return log('Phone voice: not available in this browser.');
    const synth = window.speechSynthesis;
    const es = synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith('es'));
    const u = new SpeechSynthesisUtterance('Hola, soy Sofi.');
    u.lang = 'es-MX';
    if (es[0]) u.voice = es[0];
    let started = false;
    u.onstart = () => {
      started = true;
      log(`Phone voice started (${es[0]?.name ?? 'default voice'}).`);
    };
    u.onerror = (e) => log(`Phone voice error: ${e.error}.`);
    setTimeout(() => !started && log(`Phone voice never started. Spanish voices found: ${es.length}.`), 3000);
    synth.cancel();
    setTimeout(() => synth.speak(u), 80);
  };

  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  return (
    <section className="card form">
      <h2 className="card-title">Sound check</h2>
      <p className="small">
        No sound? Tap both buttons and tell Claude what shows up below. Natural voice: <b>{hasVoiceKey ? 'on' : 'off (no OpenAI key yet)'}</b> · Opened{' '}
        {standalone ? 'from the Home Screen' : 'in the browser'} · Version {__BUILD__} UTC.
      </p>
      <div className="row">
        <button className="btn" onClick={tone}>
          🔔 Test tone
        </button>
        <button className="btn" onClick={phone}>
          🗣️ Phone voice
        </button>
      </div>
      {lines.map((l, i) => (
        <p key={i} className="fine">
          {l}
        </p>
      ))}
    </section>
  );
}

function ReminderCard({ hour, goal, onHour }: { hour: number; goal: number; onHour: (h: number) => void }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);

  const turnOn = async () => {
    setStatus('');
    try {
      setCode(await enablePush(hour));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not turn on notifications.');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setStatus('Copy failed. Press and hold the code to copy it.');
    }
  };

  return (
    <section className="card form">
      <h2 className="card-title">Daily reminder</h2>
      <label className="field">
        <span>Remind me at</span>
        <select
          value={hour}
          onChange={(e) => {
            onHour(Number(e.target.value));
            setCode('');
          }}
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>
              {hourLabel(h)}
            </option>
          ))}
        </select>
      </label>

      {!isInstalled() && (
        <p className="fine">
          On iPhone, notifications only work after you add Charla to your Home Screen (Share → Add to Home Screen) and open it from there.
        </p>
      )}

      {!code ? (
        <button className="btn primary" onClick={turnOn}>
          🔔 Turn on notifications
        </button>
      ) : (
        <>
          <p className="small">
            Last step, once per phone (and again if you change the time): save this code in your GitHub repo so the reminder job can reach you.
          </p>
          <div className="code-box">{code}</div>
          <ol>
            <li>Tap Copy code.</li>
            <li>Tap Open GitHub, and sign in if asked.</li>
            <li>
              Name: <b>REMINDER_CODE</b>, paste the code as the secret, then tap Add secret.
            </li>
          </ol>
          <div className="row">
            <button className="btn" onClick={copy}>
              {copied ? '✓ Copied' : 'Copy code'}
            </button>
            <a className="btn primary" href={REPO_SECRETS_URL} target="_blank" rel="noreferrer" style={{ textAlign: 'center', textDecoration: 'none' }}>
              Open GitHub
            </a>
          </div>
          <button className="btn" onClick={() => testNotification().catch((e) => setStatus(String(e)))}>
            Send a test notification now
          </button>
        </>
      )}
      {status && <p className="small error">{status}</p>}
      <p className="fine">No GitHub handy? Add a repeating reminder to your phone’s calendar instead:</p>
      <button className="btn" onClick={() => downloadCalendarReminder(hour, goal)}>
        📅 Add daily reminder to my calendar
      </button>
    </section>
  );
}

export function SettingsScreen({ go }: { go: Go }) {
  const { data, update } = useApp();
  const s = data.settings;
  const [keyDraft, setKeyDraft] = useState(s.apiKey);
  const [keyStatus, setKeyStatus] = useState('');
  const [voices, setVoices] = useState(spanishVoices());
  const [voiceDraft, setVoiceDraft] = useState(s.openaiKey);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setVoices(spanishVoices()), 500);
    return () => clearTimeout(t);
  }, []);

  const set = (patch: Partial<typeof s>) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));

  const saveKey = async () => {
    const k = keyDraft.trim();
    set({ apiKey: k });
    if (!k) {
      setKeyStatus('Key removed. Demo mode is on.');
      return;
    }
    setKeyStatus('Checking…');
    try {
      await testKey(k, s.tutorModel);
      setKeyStatus('✓ Key works. Sofi is ready.');
    } catch (e) {
      setKeyStatus(friendlyError(e));
    }
  };

  const testVoice = (key = s.openaiKey) => {
    if (key) setVoiceStatus('Loading Sofi’s voice…');
    speak('¡Hola! Soy Sofi. ¿Qué tal suena mi voz?', {
      rate: s.speechRate,
      voiceURI: s.voiceURI,
      onStart: () => key && setVoiceStatus('✓ Natural voice is on. It plays even with your phone on silent.'),
      onError: (m) => setVoiceStatus(m),
    });
  };

  const saveVoiceKey = () => {
    const k = voiceDraft.trim();
    set({ openaiKey: k });
    // configureVoice runs on the next render, so test with the new key directly
    if (!k) setVoiceStatus('Natural voice off. Sofi uses the phone’s voice.');
    else setTimeout(() => testVoice(k), 50);
  };

  const download = () => {
    const blob = new Blob([exportBackup(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `charla-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const restore = async (f: File) => {
    try {
      const restored = parseBackup(await f.text(), data);
      update(() => restored);
      setMsg('Backup restored.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not read that file.');
    }
  };

  return (
    <main className="page">
      <TopBar title="Settings" onBack={() => go({ name: 'home' })} />

      <section className="card form">
        <h2 className="card-title">Claude API key</h2>
        <input
          value={keyDraft}
          onChange={(e) => setKeyDraft(e.target.value)}
          placeholder="sk-ant-…"
          type="password"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <div className="row">
          <button className="btn primary" onClick={saveKey}>
            Save and test
          </button>
        </div>
        {keyStatus && <p className="small">{keyStatus}</p>}
        <p className="fine">
          Stored only on this phone and sent only to Anthropic. Create one at{' '}
          <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noreferrer">
            platform.claude.com/settings/keys
          </a>{' '}
          and set a monthly spend limit under Billing.
        </p>
      </section>

      <section className="card form">
        <h2 className="card-title">You</h2>
        <label className="field">
          <span>Name</span>
          <input value={s.learnerName} onChange={(e) => set({ learnerName: e.target.value })} />
        </label>
        <label className="field">
          <span>Daily goal: {s.dailyGoalMinutes} minutes</span>
          <input type="range" min={5} max={60} step={5} value={s.dailyGoalMinutes} onChange={(e) => set({ dailyGoalMinutes: Number(e.target.value) })} />
        </label>
        <p className="small">
          Level <b>{data.profile.level}</b> · English help <b>{data.profile.englishSupport}</b> · {data.profile.sessions} conversations. Sofi adjusts these as you
          practice.
        </p>
        <button className="btn" onClick={() => go({ name: 'conversation', scenario: PLACEMENT })}>
          Redo placement chat
        </button>
      </section>

      <SoundCheck hasVoiceKey={!!s.openaiKey} />

      <ReminderCard hour={s.reminderHour} goal={s.dailyGoalMinutes} onHour={(h) => set({ reminderHour: h })} />

      <section className="card form">
        <h2 className="card-title">Sofi’s voice</h2>
        <p className="small">
          <b>Natural voice (recommended).</b> A realistic voice that also lip-syncs with Sofi and plays with your phone on silent. Needs an OpenAI API key, about
          1 to 2 cents per minute of Sofi talking.
        </p>
        <input
          value={voiceDraft}
          onChange={(e) => setVoiceDraft(e.target.value)}
          placeholder="OpenAI key (sk-…)"
          type="password"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <div className="row">
          <button className="btn primary" onClick={saveVoiceKey}>
            Save and test
          </button>
        </div>
        {voiceStatus && <p className="small">{voiceStatus}</p>}
        <p className="fine">
          Stored only on this phone and sent only to OpenAI. Create one at{' '}
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
            platform.openai.com/api-keys
          </a>{' '}
          and set a monthly budget under Limits.
        </p>
        {s.openaiKey && (
          <label className="field">
            <span>Natural voice</span>
            <select value={s.openaiVoice} onChange={(e) => set({ openaiVoice: e.target.value })}>
              {OPENAI_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          <span>{s.openaiKey ? 'Backup phone voice' : 'Phone voice'}</span>
          <select value={s.voiceURI} onChange={(e) => set({ voiceURI: e.target.value })}>
            <option value="">Automatic (Latin American first)</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </label>
        {!voices.length && <p className="fine">No Spanish voices found yet. On iPhone: Settings → Accessibility → Spoken Content → Voices → Spanish (Mexico).</p>}
        <label className="field">
          <span>Phone voice speed: {s.speechRate.toFixed(2)}x</span>
          <input type="range" min={0.5} max={1.2} step={0.05} value={s.speechRate} onChange={(e) => set({ speechRate: Number(e.target.value) })} />
        </label>
        <label className="check">
          <input type="checkbox" checked={s.autoSpeak} onChange={(e) => set({ autoSpeak: e.target.checked })} />
          Sofi speaks her replies automatically
        </label>
        <button className="btn" onClick={() => testVoice()}>
          🔊 Test voice
        </button>
      </section>

      <section className="card form">
        <h2 className="card-title">Tutor model</h2>
        <select value={s.tutorModel} onChange={(e) => set({ tutorModel: e.target.value })}>
          {TUTOR_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="fine">Reviews, placement and drills use Claude Haiku 5.5 to keep costs low.</p>
      </section>

      <section className="card form">
        <h2 className="card-title">Your data</h2>
        <p className="fine">Progress lives on this phone. Download a backup to move it to another phone (your API key is not included).</p>
        <div className="row">
          <button className="btn" onClick={download}>
            Download backup
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Restore backup
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
        {msg && <p className="small">{msg}</p>}
        <button
          className="btn danger"
          onClick={async () => {
            if (!confirm('Erase all progress, cards and settings on this phone?')) return;
            await clearData();
            location.reload();
          }}
        >
          Erase everything
        </button>
      </section>
      <p className="fine center">Charla v1.0</p>
    </main>
  );
}
