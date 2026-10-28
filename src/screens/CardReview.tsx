import { useState } from 'react';
import type { Go } from '../App';
import { TopBar } from '../components/ui';
import { speak } from '../lib/speech';
import { dueCards, schedule, type Grade } from '../lib/srs';
import { useApp, usePracticeTimer } from '../state';

export function CardReview({ go }: { go: Go }) {
  const { data, update } = useApp();
  usePracticeTimer();
  // Fix the queue when the screen opens; "again" cards come back at the end.
  const [queue, setQueue] = useState(() => dueCards(data.cards).slice(0, 30).map((c) => c.id));
  const [shown, setShown] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  const card = data.cards.find((c) => c.id === queue[0]);
  const play = (es: string) => speak(es, { rate: data.settings.speechRate, voiceURI: data.settings.voiceURI });

  const grade = (g: Grade) => {
    if (!card) return;
    update((d) => ({ ...d, cards: d.cards.map((c) => (c.id === card.id ? schedule(c, g) : c)) }));
    setQueue((q) => (g === 'again' ? [...q.slice(1), q[0]] : q.slice(1)));
    if (g !== 'again') setDoneCount((n) => n + 1);
    setShown(false);
  };

  if (!card) {
    return (
      <main className="page">
        <TopBar title="Daily review" onBack={() => go({ name: 'home' })} />
        <section className="card level-card">
          <span className="level-big">✓</span>
          <b>{doneCount ? `${doneCount} cards reviewed` : 'Nothing due right now'}</b>
          <p>New cards come from your conversations and drills.</p>
        </section>
        <div className="row">
          <button className="btn primary big" onClick={() => go({ name: 'home' })}>
            Done
          </button>
        </div>
      </main>
    );
  }

  const isFix = card.kind === 'correction';

  return (
    <main className="page">
      <TopBar title="Daily review" onBack={() => go({ name: 'home' })} right={<span className="muted small">{queue.length} left</span>} />
      <section className="flashcard" onClick={() => !shown && setShown(true)}>
        {isFix ? (
          <>
            <p className="drill-kind">Fix this sentence</p>
            <p className="drill-es wrong">{card.wrong}</p>
          </>
        ) : (
          <>
            <p className="drill-kind">How do you say…</p>
            <p className="drill-en">{card.en}</p>
          </>
        )}
        {shown ? (
          <div className="answer">
            <p className="drill-es">{card.es}</p>
            {isFix && <p className="muted">{card.en}</p>}
            <button
              className="link"
              onClick={(e) => {
                e.stopPropagation();
                play(card.es);
              }}
            >
              🔊 Listen
            </button>
          </div>
        ) : (
          <p className="muted tap">Say it out loud, then tap to check</p>
        )}
      </section>

      {shown && (
        <div className="grades">
          <button className="grade again" onClick={() => grade('again')}>
            Otra vez<span>forgot</span>
          </button>
          <button className="grade hard" onClick={() => grade('hard')}>
            Difícil<span>hard</span>
          </button>
          <button className="grade good" onClick={() => grade('good')}>
            Bien<span>got it</span>
          </button>
          <button className="grade easy" onClick={() => grade('easy')}>
            Fácil<span>easy</span>
          </button>
        </div>
      )}
    </main>
  );
}
