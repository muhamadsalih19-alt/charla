import type { Go } from '../App';
import { TopBar } from '../components/ui';
import { SCENARIOS } from '../data/scenarios';
import type { Unit } from '../data/units';
import { speak } from '../lib/speech';
import { useApp } from '../state';

export function UnitScreen({ unit, go }: { unit: Unit; go: Go }) {
  const { data } = useApp();
  const scenario = SCENARIOS.find((s) => s.id === unit.scenario);
  const done = data.profile.completedUnits.includes(unit.id);

  return (
    <main className="page">
      <TopBar title={`Unit ${unit.num}`} onBack={() => go({ name: 'practicar' })} />
      <h1 className="unit-title">{unit.title}</h1>
      <p className="muted">
        {unit.titleEn} · {unit.level} {done && '· ✓ completed'}
      </p>

      <section className="card explain">
        {unit.explain.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>

      <h2 className="section">Key phrases</h2>
      <div className="list">
        {unit.phrases.map((p) => (
          <button key={p.es} className="phrase" onClick={() => speak(p.es, { rate: data.settings.speechRate, voiceURI: data.settings.voiceURI })}>
            <span className="li-text">
              <b>{p.es}</b>
              <span>{p.en}</span>
            </span>
            <span aria-hidden="true">🔊</span>
          </button>
        ))}
      </div>

      <div className="sticky-actions">
        <button className="btn primary big" onClick={() => go({ name: 'drills', unit })}>
          Start drills
        </button>
        {scenario && (
          <button className="btn big" onClick={() => go({ name: 'conversation', scenario })}>
            {scenario.emoji} Use it in a conversation
          </button>
        )}
      </div>
    </main>
  );
}
