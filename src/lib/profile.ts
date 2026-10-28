import { UNITS } from '../data/units';
import { LEVELS, type Level, type PlacementResult, type Profile, type SessionReview } from './types';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function shiftLevel(level: Level, dir: 'down' | 'same' | 'up'): Level {
  const i = LEVELS.indexOf(level);
  if (dir === 'up') return LEVELS[Math.min(LEVELS.length - 1, i + 1)];
  if (dir === 'down') return LEVELS[Math.max(0, i - 1)];
  return level;
}

function addErrors(patterns: Record<string, number>, tags: string[]) {
  const out = { ...patterns };
  for (const raw of tags) {
    const t = raw.trim().toLowerCase();
    if (t) out[t] = (out[t] ?? 0) + 1;
  }
  return out;
}

export function applyPlacement(p: Profile, r: PlacementResult): Profile {
  return {
    ...p,
    placed: true,
    level: r.level,
    skills: { speaking: clamp(r.speaking), listening: clamp(r.listening), grammar: clamp(r.grammar), vocabulary: clamp(r.vocabulary) },
    englishSupport: r.english_support,
    errorPatterns: addErrors(p.errorPatterns, r.error_types),
    notes: r.notes,
    completedUnits: unitsBelow(r.level),
  };
}

/** Units the placement shows you already know, so the path starts in the right place. */
function unitsBelow(level: Level): string[] {
  const placed = LEVELS.indexOf(level);
  return UNITS.filter((u) => LEVELS.indexOf(u.level) < placed).map((u) => u.id);
}

/** Moves skills gently toward this session's scores, and applies the reviewer's level call. */
export function applyReview(p: Profile, r: SessionReview): Profile {
  const blend = (old: number, now: number) => clamp(old * 0.75 + now * 0.25);
  // A level change needs two sessions in a row pointing the same way, so one bad day doesn't demote you.
  let level = p.level;
  let pendingLevel: Profile['pendingLevel'];
  if (r.level_change !== 'same') {
    if (p.pendingLevel === r.level_change) level = shiftLevel(p.level, r.level_change);
    else pendingLevel = r.level_change;
  }
  return {
    ...p,
    level,
    pendingLevel,
    sessions: p.sessions + 1,
    skills: {
      speaking: blend(p.skills.speaking, r.fluency),
      listening: blend(p.skills.listening, (r.fluency + r.task_completion) / 2),
      grammar: blend(p.skills.grammar, r.accuracy),
      vocabulary: blend(p.skills.vocabulary, (r.accuracy + r.fluency) / 2),
    },
    englishSupport: r.english_support,
    errorPatterns: addErrors(p.errorPatterns, r.top_corrections.map((c) => c.error_type)),
    notes: r.tutor_notes || p.notes,
  };
}

export function applyDrills(p: Profile, correct: number, total: number): Profile {
  if (!total) return p;
  const pct = (correct / total) * 100;
  return {
    ...p,
    skills: {
      ...p.skills,
      grammar: clamp(p.skills.grammar * 0.85 + pct * 0.15),
      vocabulary: clamp(p.skills.vocabulary * 0.85 + pct * 0.15),
    },
  };
}

export const LEVEL_LABEL: Record<Level, string> = {
  A1: 'Beginner',
  'A1+': 'Beginner+',
  A2: 'Elementary',
  'A2+': 'Elementary+',
  B1: 'Intermediate',
  'B1+': 'Intermediate+',
  B2: 'Upper intermediate',
  'B2+': 'Upper intermediate+',
  C1: 'Advanced',
};
