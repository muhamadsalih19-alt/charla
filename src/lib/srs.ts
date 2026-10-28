import type { Card } from './types';
import { uid } from './storage';

const DAY = 86_400_000;

export type Grade = 'again' | 'hard' | 'good' | 'easy';

/** SM-2 style scheduling: each card waits a little longer every time you remember it. */
export function schedule(card: Card, grade: Grade, now = Date.now()): Card {
  let { interval, ease, reps, lapses } = card;
  if (grade === 'again') {
    reps = 0;
    lapses += 1;
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
    return { ...card, interval, ease, reps, lapses, due: now + 10 * 60_000 };
  }
  reps += 1;
  if (grade === 'hard') ease = Math.max(1.3, ease - 0.15);
  if (grade === 'easy') ease += 0.15;
  if (reps === 1) interval = grade === 'easy' ? 3 : 1;
  else if (reps === 2) interval = grade === 'hard' ? 2 : grade === 'easy' ? 6 : 4;
  else interval = Math.round(interval * (grade === 'hard' ? 1.2 : grade === 'easy' ? ease * 1.3 : ease));
  return { ...card, interval, ease, reps, lapses, due: now + interval * DAY };
}

export function newCard(kind: Card['kind'], es: string, en: string, wrong?: string): Card {
  const now = Date.now();
  return { id: uid(), kind, es, en, wrong, created: now, due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0 };
}

export function dueCards(cards: Card[], now = Date.now()): Card[] {
  return cards.filter((c) => c.due <= now).sort((a, b) => a.due - b.due);
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:"'()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Adds cards for words/corrections not already in the deck. */
export function mergeCards(existing: Card[], incoming: Card[]): Card[] {
  const seen = new Set(existing.map((c) => c.kind + '|' + norm(c.es)));
  const out = [...existing];
  for (const c of incoming) {
    const k = c.kind + '|' + norm(c.es);
    if (!c.es.trim() || seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}

export { norm };
