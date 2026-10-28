import { useEffect, useRef, useState } from 'react';
import type { Go } from '../App';
import { Avatar, type AvatarState } from '../components/Avatar';
import { Score, TopBar } from '../components/ui';
import type { Scenario } from '../data/scenarios';
import { assessPlacement, friendlyError, reviewSession } from '../lib/claude';
import { applyPlacement, applyReview, LEVEL_LABEL } from '../lib/profile';
import { speak } from '../lib/speech';
import { mergeCards, newCard } from '../lib/srs';
import type { ChatTurn, PlacementResult, SessionReview } from '../lib/types';
import { useApp } from '../state';

export function SessionEnd({ scenario, turns, go }: { scenario: Scenario; turns: ChatTurn[]; go: Go }) {
  const { data, update } = useApp();
  const { settings } = data;
  const isPlacement = scenario.id === 'placement';
  const [review, setReview] = useState<SessionReview | null>(null);
  const [placement, setPlacement] = useState<PlacementResult | null>(null);
  const [error, setError] = useState('');
  const [avatar, setAvatar] = useState<AvatarState>('thinking');
  const ran = useRef(false);

  const cheer = (es: string) =>
    speak(es, {
      rate: settings.speechRate,
      voiceURI: settings.voiceURI,
      onStart: () => setAvatar('speaking'),
      onEnd: () => setAvatar('idle'),
    });

  const run = async () => {
    setError('');
    setAvatar('thinking');
    try {
      if (isPlacement) {
        const r = await assessPlacement(settings.apiKey, turns);
        update((d) => ({ ...d, profile: applyPlacement(d.profile, r) }));
        setPlacement(r);
        cheer('¡Muy bien! Ya sé por dónde empezar contigo.');
      } else {
        const r = await reviewSession(settings.apiKey, scenario, data.profile, turns);
        // Corrections and new words become review cards.
        const fromTurns = turns.flatMap((t) => t.words ?? []);
        const words = [...r.new_words, ...fromTurns].slice(0, 10);
        const fixes = [
          ...r.top_corrections.map((c) => newCard('correction', c.right, c.why_en, c.wrong)),
          ...turns.filter((t) => t.correction).map((t) => newCard('correction', t.correction!.corrected, t.correction!.explanation, t.correction!.original)),
        ];
        update((d) => ({
          ...d,
          profile: applyReview(d.profile, r),
          cards: mergeCards(d.cards, [...fixes, ...words.map((w) => newCard('vocab', w.es, w.en))]),
        }));
        setReview(r);
        cheer(r.fluency + r.accuracy > 130 ? '¡Excelente trabajo!' : '¡Buen trabajo! Sigue practicando.');
      }
    } catch (e) {
      setError(friendlyError(e));
      setAvatar('idle');
    }
  };

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="page">
      <TopBar title={isPlacement ? 'Your level' : 'Review'} onBack={() => go({ name: 'home' })} />
      <div className="center">
        <Avatar state={avatar} size={110} />
      </div>

      {!review && !placement && !error && <p className="center muted">Sofi is looking over your conversation…</p>}

      {error && (
        <div className="card">
          <p className="error">{error}</p>
          <button className="btn primary" onClick={run}>
            Try again
          </button>
        </div>
      )}

      {placement && (
        <>
          <section className="card level-card">
            <span className="level-big">{placement.level}</span>
            <b>{LEVEL_LABEL[placement.level]}</b>
            <p>{placement.message_en}</p>
          </section>
          <section className="card">
            <Score label="Speaking" value={placement.speaking} />
            <Score label="Listening" value={placement.listening} />
            <Score label="Grammar" value={placement.grammar} />
            <Score label="Vocabulary" value={placement.vocabulary} />
          </section>
          <p className="fine">Sofi will keep adjusting after every conversation, so this doesn’t need to be perfect.</p>
          <div className="row">
            <button className="btn primary big" onClick={() => go({ name: 'home' })}>
              Let’s go
            </button>
          </div>
        </>
      )}

      {review && (
        <>
          <section className="card">
            <p>{review.summary_en}</p>
            <Score label="Fluency" value={review.fluency} />
            <Score label="Accuracy" value={review.accuracy} />
            <Score label="Goal" value={review.task_completion} />
          </section>

          {review.top_corrections.length > 0 && (
            <section className="card">
              <h2 className="card-title">Fix these</h2>
              {review.top_corrections.map((c, i) => (
                <div key={i} className="correction">
                  <p className="wrong">{c.wrong}</p>
                  <p className="right">
                    {c.right}{' '}
                    <button className="link" onClick={() => cheer(c.right)} aria-label="Listen">
                      🔊
                    </button>
                  </p>
                  <p className="why">{c.why_en}</p>
                </div>
              ))}
            </section>
          )}

          {review.new_words.length > 0 && (
            <section className="card">
              <h2 className="card-title">New words</h2>
              <div className="chips">
                {review.new_words.map((w) => (
                  <button key={w.es} className="chip" onClick={() => cheer(w.es)}>
                    {w.es} · <i>{w.en}</i>
                  </button>
                ))}
              </div>
              <p className="fine">Added to your daily review.</p>
            </section>
          )}

          <div className="row">
            <button className="btn" onClick={() => go({ name: 'conversation', scenario })}>
              Again
            </button>
            <button className="btn primary" onClick={() => go({ name: 'home' })}>
              Done
            </button>
          </div>
        </>
      )}
    </main>
  );
}
