import type { Go } from '../App';
import { TopBar } from '../components/ui';
import { STAGES, UNITS } from '../data/units';
import { dueCards } from '../lib/srs';
import { useApp } from '../state';

export function Practicar({ go }: { go: Go }) {
  const { data } = useApp();
  const done = new Set(data.profile.completedUnits);
  const next = UNITS.find((u) => !done.has(u.id));
  const due = dueCards(data.cards).length;
  const finished = UNITS.filter((u) => done.has(u.id)).length;

  return (
    <main className="page">
      <TopBar title="Practicar" onBack={() => go({ name: 'home' })} />

      <button className="card review-cta" onClick={() => go({ name: 'cards' })} disabled={!data.cards.length}>
        <b>Daily review</b>
        <span>
          {data.cards.length === 0
            ? 'Words and corrections from your conversations will show up here.'
            : due > 0
              ? `${due} card${due === 1 ? '' : 's'} ready`
              : `All caught up · ${data.cards.length} cards in your deck`}
        </span>
        <span className="chev">›</span>
      </button>

      {next ? (
        <button className="card continue-cta" onClick={() => go({ name: 'unit', unit: next })}>
          <span className="muted">Continue · stage {next.stage}</span>
          <b>{next.title}</b>
          <span>{next.titleEn}</span>
          <span className="chev">›</span>
        </button>
      ) : (
        <p className="card">¡Felicidades! You finished every lesson. Keep talking with Sofi to stay sharp.</p>
      )}

      <h2 className="section">
        Course · {finished}/{UNITS.length} lessons
      </h2>
      {STAGES.map((st) => {
        const units = UNITS.filter((u) => u.stage === st.num);
        const count = units.filter((u) => done.has(u.id)).length;
        return (
          <details key={st.num} className="course-stage" open={next?.stage === st.num}>
            <summary>
              <span className="stage-num">{count === units.length ? '✓' : st.num}</span>
              <span className="li-text">
                <b>{st.title}</b>
                <span>
                  {st.titleEn} · {st.level} · {count}/{units.length}
                </span>
              </span>
            </summary>
            <div className="path">
              {units.map((u) => {
                const state = done.has(u.id) ? 'done' : u.id === next?.id ? 'next' : 'later';
                return (
                  <button key={u.id} className={`unit ${state}`} onClick={() => go({ name: 'unit', unit: u })}>
                    <span className="unit-num">{state === 'done' ? '✓' : u.checkpoint ? '★' : u.num}</span>
                    <span className="li-text">
                      <b>{u.title}</b>
                      <span>
                        {u.titleEn} · {u.level}
                      </span>
                    </span>
                    {state === 'next' && <span className="tag">Next</span>}
                  </button>
                );
              })}
            </div>
          </details>
        );
      })}
    </main>
  );
}
