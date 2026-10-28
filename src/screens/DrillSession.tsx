import { useEffect, useRef, useState } from 'react';
import type { Go } from '../App';
import { TopBar } from '../components/ui';
import { UNITS, type Unit } from '../data/units';
import { friendlyError, generateDrills, gradeTranslation } from '../lib/claude';
import { localDrills, mixDrills } from '../lib/drills';
import { applyDrills } from '../lib/profile';
import { canRecognize, listen, speak, type Listener } from '../lib/speech';
import { mergeCards, newCard, norm } from '../lib/srs';
import type { Card, Drill } from '../lib/types';
import { useApp, usePracticeTimer } from '../state';

interface Result {
  correct: boolean;
  right: string;
  note?: string;
}

function overlap(said: string, target: string): { score: number; missed: string[] } {
  const want = norm(target).split(' ');
  const got = new Set(norm(said).split(' '));
  const missed = want.filter((w) => !got.has(w));
  return { score: want.length ? (want.length - missed.length) / want.length : 0, missed };
}

export function DrillSession({ unit, go }: { unit: Unit; go: Go }) {
  const { data, update } = useApp();
  const { settings } = data;
  usePracticeTimer();

  const [drills, setDrills] = useState<Drill[] | null>(null);
  const [notice, setNotice] = useState('');
  const [i, setI] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState<Card[]>([]);
  const [checking, setChecking] = useState(false);
  const [finished, setFinished] = useState(false);

  // per-drill input state
  const [text, setText] = useState('');
  const [built, setBuilt] = useState<number[]>([]);
  const [heard, setHeard] = useState('');
  const [listening, setListening] = useState(false);
  const listener = useRef<Listener | null>(null);

  useEffect(() => {
    let alive = true;
    if (!settings.apiKey) {
      setDrills(localDrills(unit));
      return;
    }
    generateDrills(settings.apiKey, unit, data.profile)
      .then((ai) => alive && setDrills(mixDrills(unit, ai)))
      .catch((e) => {
        if (!alive) return;
        setNotice(friendlyError(e) + ' Using offline drills instead.');
        setDrills(localDrills(unit));
      });
    return () => {
      alive = false;
      listener.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drill = drills?.[i];
  const play = (es: string, slow = false) => speak(es, { rate: slow ? 0.6 : settings.speechRate, voiceURI: settings.voiceURI });

  useEffect(() => {
    if (!drill) return;
    if (drill.type === 'listen') play(drill.es);
    if (drill.type === 'choice' && drill.audio) play(drill.audio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, drills]);

  const mark = (r: Result, card?: Card) => {
    setResult(r);
    if (r.correct) setCorrect((c) => c + 1);
    else if (card) setMistakes((m) => [...m, card]);
  };

  const check = async (answer?: string) => {
    if (!drill || result) return;
    switch (drill.type) {
      case 'choice': {
        const ok = answer === drill.answer;
        mark({ correct: ok, right: drill.answer }, drill.audio ? newCard('vocab', drill.audio, drill.answer) : undefined);
        break;
      }
      case 'fill': {
        const full = drill.sentence.replace('___', drill.answer);
        mark({ correct: answer === drill.answer, right: full }, newCard('vocab', full, drill.en));
        break;
      }
      case 'build': {
        const said = built.map((k) => drill.words[k]).join(' ');
        mark({ correct: norm(said) === norm(drill.answer), right: drill.answer }, newCard('vocab', drill.answer, drill.en));
        break;
      }
      case 'listen': {
        const { score } = overlap(text, drill.es);
        mark({ correct: score >= 0.85, right: drill.es, note: drill.en }, newCard('vocab', drill.es, drill.en));
        break;
      }
      case 'translate': {
        if (norm(text) === norm(drill.answer)) {
          mark({ correct: true, right: drill.answer });
          break;
        }
        if (!settings.apiKey) {
          mark({ correct: false, right: drill.answer, note: 'Other wordings can be right too. With an API key, Sofi grades these properly.' }, newCard('vocab', drill.answer, drill.en));
          break;
        }
        setChecking(true);
        try {
          const g = await gradeTranslation(settings.apiKey, drill.en, drill.answer, text);
          mark({ correct: g.correct, right: g.best_answer || drill.answer, note: g.correct ? undefined : g.feedback_en }, newCard('vocab', g.best_answer || drill.answer, drill.en));
        } catch (e) {
          mark({ correct: false, right: drill.answer, note: friendlyError(e) });
        } finally {
          setChecking(false);
        }
        break;
      }
      case 'say': {
        const { score, missed } = overlap(answer ?? heard, drill.es);
        mark(
          { correct: score >= 0.7, right: drill.es, note: missed.length ? `Words that didn’t come through: ${missed.join(', ')}` : undefined },
          newCard('vocab', drill.es, drill.en),
        );
        break;
      }
    }
  };

  const startSay = () => {
    if (listener.current) {
      listener.current.stop();
      return;
    }
    setHeard('');
    setListening(true);
    listener.current = listen(
      (t) => setHeard(t),
      (final) => {
        listener.current = null;
        setListening(false);
        if (final) check(final);
      },
    );
    if (!listener.current) setListening(false);
  };

  const next = () => {
    setResult(null);
    setText('');
    setBuilt([]);
    setHeard('');
    if (drills && i + 1 >= drills.length) {
      const total = drills.length;
      const passed = (correct / total) * 100 >= 70;
      update((d) => ({
        ...d,
        profile: {
          ...applyDrills(d.profile, correct, total),
          completedUnits: passed && !d.profile.completedUnits.includes(unit.id) ? [...d.profile.completedUnits, unit.id] : d.profile.completedUnits,
        },
        cards: mergeCards(d.cards, mistakes),
      }));
      setFinished(true);
    } else setI(i + 1);
  };

  if (!drills) {
    return (
      <main className="page">
        <TopBar title={unit.title} onBack={() => go({ name: 'unit', unit })} />
        <p className="center muted">Sofi is preparing drills for your level…</p>
      </main>
    );
  }

  if (finished) {
    const pct = Math.round((correct / drills.length) * 100);
    const nextUnit = UNITS[UNITS.indexOf(unit) + 1];
    return (
      <main className="page">
        <TopBar title="Results" onBack={() => go({ name: 'practicar' })} />
        <section className="card level-card">
          <span className="level-big">{pct}%</span>
          <b>
            {correct} of {drills.length} correct
          </b>
          <p>{pct >= 70 ? '¡Muy bien! Unit complete.' : 'Almost there. Score 70% to complete the unit.'}</p>
          {mistakes.length > 0 && <p className="fine">{mistakes.length} item(s) added to your daily review.</p>}
        </section>
        <div className="row">
          <button className="btn" onClick={() => go({ name: 'drills', unit })}>
            Again
          </button>
          {pct >= 70 && nextUnit ? (
            <button className="btn primary" onClick={() => go({ name: 'unit', unit: nextUnit })}>
              Next unit
            </button>
          ) : (
            <button className="btn primary" onClick={() => go({ name: 'practicar' })}>
              Done
            </button>
          )}
        </div>
      </main>
    );
  }

  if (!drill) return null;

  return (
    <main className="page drill-page">
      <TopBar title={unit.title} onBack={() => go({ name: 'unit', unit })} />
      <div className="progress">
        <span style={{ width: `${(i / drills.length) * 100}%` }} />
      </div>
      {notice && <p className="fine">{notice}</p>}

      <section className="drill">
        {drill.type === 'choice' && (
          <>
            <p className="drill-kind">{drill.prompt}</p>
            {drill.audio && (
              <button className="say-big" onClick={() => play(drill.audio!)}>
                🔊 {drill.audio}
              </button>
            )}
            <div className="options">
              {drill.options.map((o) => (
                <button
                  key={o}
                  className={`option ${result && o === drill.answer ? 'right' : ''}`}
                  onClick={() => check(o)}
                  disabled={!!result}
                >
                  {o}
                </button>
              ))}
            </div>
          </>
        )}

        {drill.type === 'fill' && (
          <>
            <p className="drill-kind">Fill in the blank</p>
            <p className="drill-es">{drill.sentence.replace('___', '_____')}</p>
            <p className="muted">{drill.en}</p>
            <div className="options">
              {drill.options.map((o) => (
                <button key={o} className={`option ${result && o === drill.answer ? 'right' : ''}`} onClick={() => check(o)} disabled={!!result}>
                  {o}
                </button>
              ))}
            </div>
          </>
        )}

        {drill.type === 'build' && (
          <>
            <p className="drill-kind">Build the sentence</p>
            <p className="drill-en">{drill.en}</p>
            <div className="built">
              {built.map((k, n) => (
                <button key={n} className="tile" onClick={() => !result && setBuilt(built.filter((_, m) => m !== n))}>
                  {drill.words[k]}
                </button>
              ))}
              {!built.length && <span className="muted">Tap the words in order</span>}
            </div>
            <div className="tiles">
              {drill.words.map((w, k) => (
                <button key={k} className="tile" disabled={built.includes(k) || !!result} onClick={() => setBuilt([...built, k])}>
                  {w}
                </button>
              ))}
            </div>
            {!result && (
              <button className="btn primary big" disabled={built.length !== drill.words.length} onClick={() => check()}>
                Check
              </button>
            )}
          </>
        )}

        {(drill.type === 'translate' || drill.type === 'listen') && (
          <>
            <p className="drill-kind">{drill.type === 'listen' ? 'Type what you hear' : 'Translate into Spanish'}</p>
            {drill.type === 'listen' ? (
              <div className="row">
                <button className="say-big" onClick={() => play(drill.es)}>
                  🔊 Play
                </button>
                <button className="say-big" onClick={() => play(drill.es, true)}>
                  🐢 Slow
                </button>
              </div>
            ) : (
              <p className="drill-en">{drill.en}</p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) check();
              }}
            >
              <input
                className="answer-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe aquí…"
                lang="es"
                autoCapitalize="sentences"
                disabled={!!result}
              />
              {!result && (
                <button className="btn primary big" disabled={!text.trim() || checking}>
                  {checking ? 'Checking…' : 'Check'}
                </button>
              )}
            </form>
          </>
        )}

        {drill.type === 'say' && (
          <>
            <p className="drill-kind">Say it out loud</p>
            <button className="say-big" onClick={() => play(drill.es)}>
              🔊 {drill.es}
            </button>
            <p className="muted">{drill.en}</p>
            {heard && <p className="heard">“{heard}”</p>}
            {!result &&
              (canRecognize() ? (
                <button className={`mic ${listening ? 'on' : ''}`} onClick={startSay} aria-label="Record">
                  {listening ? '■' : '🎤'}
                </button>
              ) : (
                <button className="btn primary big" onClick={() => check(drill.es)}>
                  I said it
                </button>
              ))}
          </>
        )}
      </section>

      {result && (
        <div className={`feedback ${result.correct ? 'good' : 'bad'}`}>
          <b>{result.correct ? '¡Correcto!' : 'Not quite'}</b>
          {!result.correct && (
            <p>
              {result.right}{' '}
              <button className="link" onClick={() => play(result.right)} aria-label="Listen">
                🔊
              </button>
            </p>
          )}
          {result.note && <p className="small">{result.note}</p>}
          <button className="btn primary big" onClick={next}>
            Continue
          </button>
        </div>
      )}
    </main>
  );
}
