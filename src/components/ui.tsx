import type { ReactNode } from 'react';

export function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="topbar">
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ‹
        </button>
      ) : (
        <span className="icon-spacer" />
      )}
      <h1>{title}</h1>
      {right ?? <span className="icon-spacer" />}
    </header>
  );
}

export function GoalRing({ minutes, goal, size = 96 }: { minutes: number; goal: number; size?: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, goal ? minutes / goal : 0);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="goal-ring" role="img" aria-label={`${minutes} of ${goal} minutes today`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--track)" strokeWidth="9" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={pct >= 1 ? 'var(--good)' : 'var(--accent)'}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="49" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--text)">
        {minutes}
      </text>
      <text x="50" y="66" textAnchor="middle" fontSize="11" fill="var(--muted)">
        of {goal} min
      </text>
    </svg>
  );
}

export function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="score">
      <div className="score-bar">
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <div className="score-label">
        <span>{label}</span>
        <b>{value}</b>
      </div>
    </div>
  );
}
