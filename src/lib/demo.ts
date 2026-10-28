// Canned answers so the app can be tried without an API key.
import type { Scenario } from '../data/scenarios';
import type { ChatTurn, PlacementResult, SessionReview, TutorReply } from './types';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const LINES: Record<string, [string, string][]> = {
  taqueria: [
    ['¡Claro! Tenemos pastor, bistec y suadero. ¿De cuál quiere?', 'Sure! We have pastor, steak and suadero. Which one do you want?'],
    ['Muy bien, ¿y para tomar? Tenemos agua de horchata, jamaica y refrescos.', 'Very good, and to drink? We have horchata, hibiscus water and sodas.'],
    ['¡Ahorita se los traigo! ¿Algo más?', 'I’ll bring them right away! Anything else?'],
    ['Son ochenta pesos. ¡Gracias, que le vaya bien!', 'That’s eighty pesos. Thanks, take care!'],
  ],
  default: [
    ['¡Qué interesante! Cuéntame más, por favor.', 'How interesting! Tell me more, please.'],
    ['Muy bien. ¿Y qué te gusta hacer los fines de semana?', 'Very good. And what do you like to do on weekends?'],
    ['¡Me encanta! ¿Desde cuándo estudias español?', 'I love it! How long have you been studying Spanish?'],
    ['Hablas muy bien. ¡Seguimos practicando otro día!', 'You speak very well. Let’s keep practicing another day!'],
  ],
};

export async function tutorTurn(s: Scenario, turns: ChatTurn[]): Promise<TutorReply> {
  await wait(700);
  const learnerTurns = turns.filter((t) => t.role === 'learner');
  const lastRaw = learnerTurns[learnerTurns.length - 1]?.es ?? '';
  const last = lastRaw.toLowerCase();
  const lines = LINES[s.id] ?? LINES.default;
  const i = Math.min(learnerTurns.length - 1, lines.length - 1);
  const [es, en] = lines[Math.max(0, i)];
  const wrongSoy = /soy (cansad|bien|mal|feliz|content)/.test(last);
  return {
    reply_es: wrongSoy ? '¡Ah, estás cansado! ' + es : es,
    reply_en: wrongSoy ? 'Ah, you’re tired! ' + en : en,
    has_correction: wrongSoy,
    corrected: wrongSoy ? lastRaw.replace(/\bsoy\b/i, 'estoy') : '',
    correction_explanation_en: wrongSoy ? 'Use "estar" for how you feel right now.' : '',
    error_type: wrongSoy ? 'ser vs estar' : '',
    english_hint: 'Demo mode: add your API key in Settings for a real tutor.',
    new_words: i === 0 ? [{ es: 'ahorita', en: 'right now (Mexico)' }] : [],
    suggestions: ['Sí, por favor.', 'No, gracias.', '¿Cuánto cuesta?'],
    goal_complete: learnerTurns.length >= lines.length,
  };
}

export async function review(turns: ChatTurn[]): Promise<SessionReview> {
  await wait(600);
  const corrections = turns
    .filter((t) => t.correction)
    .map((t) => ({ wrong: t.correction!.original, right: t.correction!.corrected, why_en: t.correction!.explanation, error_type: t.correction!.errorType }));
  return {
    summary_en: 'Demo review: you kept the conversation going. Add your API key for a real review.',
    fluency: 60,
    accuracy: 70,
    task_completion: 80,
    top_corrections: corrections.slice(0, 3),
    new_words: [
      { es: 'ahorita', en: 'right now (Mexico)' },
      { es: 'la cuenta', en: 'the bill' },
    ],
    level_change: 'same',
    english_support: 'some',
    tutor_notes: 'Demo session.',
  };
}

export async function placement(turns: ChatTurn[]): Promise<PlacementResult> {
  await wait(600);
  const words = turns.filter((t) => t.role === 'learner').reduce((n, t) => n + t.es.split(/\s+/).length, 0);
  return {
    level: words > 40 ? 'A2' : 'A1+',
    speaking: 40,
    listening: 45,
    grammar: 35,
    vocabulary: 40,
    english_support: 'some',
    error_types: ['ser vs estar'],
    notes: 'Demo placement.',
    message_en: 'Demo mode estimate. Add your API key in Settings and redo placement for a real assessment.',
  };
}
