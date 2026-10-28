import type { Go } from '../App';
import { TopBar } from '../components/ui';
import { FREE_CHAT, PLACEMENT, SCENARIOS, TUTOR_MODE, type Scenario } from '../data/scenarios';
import { LEVELS, type Level } from '../lib/types';
import { useApp } from '../state';

export function HablarList({ go }: { go: Go }) {
  const { data } = useApp();
  const lvl = LEVELS.indexOf(data.profile.level);
  const start = (s: Scenario) => go({ name: 'conversation', scenario: s });

  const item = (s: Scenario, tag?: string) => (
    <button key={s.id} className="list-item" onClick={() => start(s)}>
      <span className="li-emoji">{s.emoji}</span>
      <span className="li-text">
        <b>{s.title}</b>
        <span>{s.goalEn}</span>
      </span>
      {tag && <span className="tag">{tag}</span>}
    </button>
  );

  return (
    <main className="page">
      <TopBar title="Hablar" onBack={() => go({ name: 'home' })} />
      <h2 className="section">Just talk</h2>
      <div className="list">
        {item(FREE_CHAT)}
        {item(TUTOR_MODE)}
      </div>
      <h2 className="section">Scenarios</h2>
      <div className="list">
        {SCENARIOS.map((s) => {
          const need = LEVELS.indexOf(s.minLevel as Level);
          return item(s, need > lvl + 1 ? 'Later' : need > lvl ? 'Stretch' : need === lvl ? 'Your level' : undefined);
        })}
      </div>
      <h2 className="section">Level check</h2>
      <div className="list">{item(PLACEMENT, data.profile.placed ? 'Redo' : 'Start here')}</div>
    </main>
  );
}
