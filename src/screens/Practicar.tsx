import type { Go } from '../App';
import { TopBar } from '../components/ui';
import { UNITS } from '../data/units';
import { dueCards } from '../lib/srs';
import { useApp } from '../state';

export function Practicar({ go }: { go: Go }) {
  const { data } = useApp();
  const done = new Set(data.profile.completedUnits);
  const nextId = UNITS.find((u) => !done.has(u.id))?.id;
  const due = dueCards(data.cards).length;

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

      <h2 className="section">Lessons</h2>
      <div className="path">
        {UNITS.map((u) => {
          const state = done.has(u.id) ? 'done' : u.id === nextId ? 'next' : 'later';
          return (
            <button key={u.id} className={`unit ${state}`} onClick={() => go({ name: 'unit', unit: u })}>
              <span className="unit-num">{state === 'done' ? '✓' : u.num}</span>
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
    </main>
  );
}
