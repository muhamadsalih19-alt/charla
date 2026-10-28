import type { Go } from '../App';
import { Avatar } from '../components/Avatar';
import { GoalRing } from '../components/ui';
import { PLACEMENT } from '../data/scenarios';
import { LEVEL_LABEL } from '../lib/profile';
import { dueCards } from '../lib/srs';
import { minutesToday, streak, useApp } from '../state';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

export function Home({ go }: { go: Go }) {
  const { data } = useApp();
  const { profile, settings } = data;
  const mins = minutesToday(data);
  const days = streak(data);
  const due = dueCards(data.cards).length;

  return (
    <main className="page home">
      <header className="home-head">
        <div>
          <p className="muted">{greeting()},</p>
          <h1>{settings.learnerName || 'amigo'}</h1>
        </div>
        <button className="icon-btn" onClick={() => go({ name: 'settings' })} aria-label="Settings">
          ⚙︎
        </button>
      </header>

      {!settings.apiKey && (
        <button className="banner warn" onClick={() => go({ name: 'settings' })}>
          Demo mode: add your Claude API key in Settings for the real tutor.
        </button>
      )}

      <section className="card today">
        <GoalRing minutes={mins} goal={settings.dailyGoalMinutes} />
        <div className="today-stats">
          <div>
            <b>{profile.placed ? profile.level : '—'}</b>
            <span>{profile.placed ? LEVEL_LABEL[profile.level] : 'Not placed yet'}</span>
          </div>
          <div>
            <b>{days}</b>
            <span>day streak</span>
          </div>
          <div>
            <b>{due}</b>
            <span>cards due</span>
          </div>
        </div>
      </section>

      {!profile.placed && (
        <button className="card placement-cta" onClick={() => go({ name: 'conversation', scenario: PLACEMENT })}>
          <Avatar state="idle" size={56} />
          <div>
            <b>Find your level</b>
            <span>A 5-minute chat with Sofi so the app fits you.</span>
          </div>
        </button>
      )}

      <div className="mode-grid">
        <button className="mode hablar" onClick={() => go({ name: 'hablar' })}>
          <span className="mode-emoji">🗣️</span>
          <b>Hablar</b>
          <span>Talk with Sofi</span>
        </button>
        <button className="mode practicar" onClick={() => go({ name: 'practicar' })}>
          <span className="mode-emoji">📚</span>
          <b>Practicar</b>
          <span>Lessons and drills</span>
        </button>
      </div>

      {due > 0 && (
        <button className="card review-cta" onClick={() => go({ name: 'cards' })}>
          <b>Daily review</b>
          <span>
            {due} card{due === 1 ? '' : 's'} ready, about {Math.max(1, Math.round(due / 4))} min
          </span>
          <span className="chev">›</span>
        </button>
      )}
    </main>
  );
}
