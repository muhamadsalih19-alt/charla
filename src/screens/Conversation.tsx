import { useEffect, useRef, useState } from 'react';
import type { Go } from '../App';
import { Avatar, type AvatarState } from '../components/Avatar';
import type { Scenario } from '../data/scenarios';
import { friendlyError, tutorTurn } from '../lib/claude';
import { canRecognize, listen, speak, stopSpeaking, unlockSpeech, type Listener } from '../lib/speech';
import type { ChatTurn } from '../lib/types';
import { useApp, usePracticeTimer } from '../state';

const MIC_ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked. Allow it in your phone’s settings for this site, or type instead.',
  'service-not-allowed': 'Speech recognition isn’t available here. Use the keyboard’s mic button to dictate instead.',
  'no-speech': 'I didn’t hear anything. Tap the mic and try again.',
  'audio-capture': 'No microphone was found.',
  network: 'Speech recognition needs an internet connection.',
};

export function Conversation({ scenario, go }: { scenario: Scenario; go: Go }) {
  const { data } = useApp();
  const { settings, profile } = data;
  usePracticeTimer();

  const [started, setStarted] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([{ role: 'tutor', es: scenario.opener, en: scenario.openerEn }]);
  const [avatar, setAvatar] = useState<AvatarState>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [live, setLive] = useState('');
  const [typing, setTyping] = useState(!canRecognize());
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showEn, setShowEn] = useState<Record<number, boolean>>({});
  const [openFix, setOpenFix] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(false);
  const listener = useRef<Listener | null>(null);
  const logEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, live, busy]);

  useEffect(
    () => () => {
      stopSpeaking();
      listener.current?.abort();
    },
    [],
  );

  const say = (es: string, slow = false) => {
    speak(es, {
      rate: slow ? Math.max(0.5, settings.speechRate - 0.3) : settings.speechRate,
      voiceURI: settings.voiceURI,
      onStart: () => setAvatar('speaking'),
      onEnd: () => setAvatar((a) => (a === 'speaking' ? 'idle' : a)),
    });
    setAvatar('speaking');
  };

  const begin = () => {
    unlockSpeech();
    setStarted(true);
    if (settings.autoSpeak) setTimeout(() => say(scenario.opener), 150);
  };

  const send = async (raw: string) => {
    const said = raw.trim();
    if (!said || busy) return;
    setError('');
    setShowHelp(false);
    setText('');
    const learnerIndex = turns.length;
    const next: ChatTurn[] = [...turns, { role: 'learner', es: said }];
    setTurns(next);
    setBusy(true);
    setAvatar('thinking');
    try {
      const r = await tutorTurn(settings.apiKey, settings.tutorModel, scenario, profile, settings.learnerName, next);
      setTurns((prev) => {
        const out = [...prev];
        if (r.has_correction && r.corrected.trim()) {
          out[learnerIndex] = {
            ...out[learnerIndex],
            correction: { original: said, corrected: r.corrected, explanation: r.correction_explanation_en, errorType: r.error_type },
          };
        }
        out.push({ role: 'tutor', es: r.reply_es, en: r.reply_en, hint: r.english_hint, words: r.new_words });
        return out;
      });
      setSuggestions(r.suggestions);
      if (r.goal_complete) setDone(true);
      if (settings.autoSpeak) say(r.reply_es);
      else setAvatar('idle');
    } catch (e) {
      setError(friendlyError(e));
      setAvatar('idle');
      // put the learner's words back so they can resend
      setTurns(turns);
      setText(said);
      setTyping(true);
    } finally {
      setBusy(false);
    }
  };

  const toggleMic = () => {
    if (listener.current) {
      listener.current.stop();
      return;
    }
    stopSpeaking();
    setError('');
    setLive('');
    setAvatar('listening');
    const l = listen(
      (t) => setLive(t),
      (final, err) => {
        listener.current = null;
        setLive('');
        setAvatar('idle');
        if (final) send(final);
        else if (err && err !== 'aborted') setError(MIC_ERRORS[err] ?? `Microphone problem (${err}). Try typing instead.`);
        if (err === 'not-allowed' || err === 'service-not-allowed') setTyping(true);
      },
    );
    if (!l) {
      setAvatar('idle');
      setTyping(true);
      setError('Speech recognition isn’t available here. Type, or use the mic button on your keyboard.');
    }
    listener.current = l;
  };

  const finish = () => {
    stopSpeaking();
    listener.current?.abort();
    if (turns.some((t) => t.role === 'learner')) go({ name: 'session-end', scenario, turns });
    else go({ name: scenario.id === 'placement' ? 'home' : 'hablar' });
  };

  const lastTutor = [...turns].reverse().find((t) => t.role === 'tutor');
  const listening = avatar === 'listening';

  return (
    <main className="convo">
      <header className="convo-head">
        <button className="icon-btn" onClick={finish} aria-label="End conversation">
          ✕
        </button>
        <div className="convo-title">
          <b>
            {scenario.emoji} {scenario.title}
          </b>
          <span>{scenario.goalEn}</span>
        </div>
        <button className="btn small" onClick={finish} disabled={busy}>
          {done ? 'Review' : 'End'}
        </button>
      </header>

      <div className="stage">
        <Avatar state={avatar} size={128} />
      </div>

      <div className="log">
        {turns.map((t, i) =>
          t.role === 'tutor' ? (
            <div key={i} className="bubble tutor">
              <p className="es">{t.es}</p>
              {showEn[i] && t.en && <p className="en">{t.en}</p>}
              {t.hint && <p className="hint">{t.hint}</p>}
              {t.words && t.words.length > 0 && (
                <div className="chips">
                  {t.words.map((w) => (
                    <span key={w.es} className="chip" title={w.en}>
                      {w.es} · <i>{w.en}</i>
                    </span>
                  ))}
                </div>
              )}
              <div className="bubble-actions">
                <button onClick={() => say(t.es)} aria-label="Replay">
                  🔊
                </button>
                <button onClick={() => say(t.es, true)} aria-label="Replay slowly">
                  🐢 Más despacio
                </button>
                <button onClick={() => setShowEn((s) => ({ ...s, [i]: !s[i] }))}>{showEn[i] ? 'Ocultar' : 'Traducir'}</button>
              </div>
            </div>
          ) : (
            <div key={i} className="bubble learner">
              <p>{t.es}</p>
              {t.correction && (
                <button className="fix" onClick={() => setOpenFix((s) => ({ ...s, [i]: !s[i] }))}>
                  ✎ {t.correction.corrected}
                  {openFix[i] && <span className="fix-why">{t.correction.explanation}</span>}
                </button>
              )}
            </div>
          ),
        )}
        {live && (
          <div className="bubble learner live">
            <p>{live}…</p>
          </div>
        )}
        {busy && (
          <div className="bubble tutor typing">
            <span />
            <span />
            <span />
          </div>
        )}
        {done && (
          <div className="done-banner">
            <b>{scenario.id === 'placement' ? '¡Listo! Placement chat finished.' : '¡Muy bien! Goal complete.'}</b>
            <button className="btn primary" onClick={finish}>
              {scenario.id === 'placement' ? 'See my level' : 'See my review'}
            </button>
          </div>
        )}
        <div ref={logEnd} />
      </div>

      {error && <p className="error">{error}</p>}

      {showHelp && (
        <div className="help-panel">
          <p className="muted">You could say:</p>
          {(suggestions.length ? suggestions : ['Hola, ¿cómo estás?', 'No entiendo, ¿puedes repetir?', '¿Cómo se dice…?']).map((s) => (
            <button key={s} className="suggestion" onClick={() => (typing ? setText(s) : send(s))}>
              {s}
            </button>
          ))}
          {lastTutor?.en && <p className="muted small">Sofi said: “{lastTutor.en}”</p>}
        </div>
      )}

      <footer className="controls">
        {typing ? (
          <form
            className="type-row"
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
          >
            <button type="button" className="icon-btn" onClick={() => setShowHelp((h) => !h)} aria-label="Help">
              💡
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe en español…"
              lang="es"
              autoCapitalize="sentences"
              enterKeyHint="send"
            />
            <button className="btn primary" disabled={busy || !text.trim()}>
              Send
            </button>
            {canRecognize() && (
              <button type="button" className="icon-btn" onClick={() => setTyping(false)} aria-label="Use microphone">
                🎤
              </button>
            )}
          </form>
        ) : (
          <div className="mic-row">
            <button className="side-btn" onClick={() => setShowHelp((h) => !h)}>
              💡<span>Ayuda</span>
            </button>
            <button className={`mic ${listening ? 'on' : ''}`} onClick={toggleMic} disabled={busy} aria-label={listening ? 'Stop and send' : 'Speak'}>
              {listening ? '■' : '🎤'}
            </button>
            <button className="side-btn" onClick={() => setTyping(true)}>
              ⌨️<span>Escribir</span>
            </button>
          </div>
        )}
        {!typing && <p className="mic-tip">{listening ? 'Listening… tap ■ when you’re done' : 'Tap the mic and speak Spanish'}</p>}
        {typing && !canRecognize() && <p className="mic-tip">Tip: tap the 🎤 on your keyboard to dictate in Spanish.</p>}
      </footer>

      {!started && (
        <div className="start-overlay">
          <div className="start-card">
            <Avatar state="idle" size={110} />
            <h2>{scenario.title}</h2>
            <p>{scenario.goalEn}</p>
            <button className="btn primary big" onClick={begin}>
              Empezar
            </button>
            {!settings.apiKey && <p className="fine">Demo mode — answers are canned until you add an API key.</p>}
          </div>
        </div>
      )}
    </main>
  );
}
