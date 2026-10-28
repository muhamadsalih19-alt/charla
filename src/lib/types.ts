export type Level = 'A1' | 'A1+' | 'A2' | 'A2+' | 'B1';
export const LEVELS: Level[] = ['A1', 'A1+', 'A2', 'A2+', 'B1'];

export type EnglishSupport = 'lots' | 'some' | 'minimal';

export interface Profile {
  placed: boolean;
  level: Level;
  skills: { speaking: number; listening: number; grammar: number; vocabulary: number };
  /** error tag -> how many times it has come up */
  errorPatterns: Record<string, number>;
  englishSupport: EnglishSupport;
  /** short running notes the tutor keeps about the learner */
  notes: string;
  sessions: number;
  /** a level change waits for a second session agreeing with it */
  pendingLevel?: 'down' | 'up';
  /** unit ids finished in Practicar */
  completedUnits: string[];
}

export interface Settings {
  apiKey: string;
  learnerName: string;
  dailyGoalMinutes: number;
  speechRate: number;
  voiceURI: string;
  tutorModel: string;
  autoSpeak: boolean;
  /** local hour (0-23) for the daily reminder */
  reminderHour: number;
}

export interface Card {
  id: string;
  kind: 'vocab' | 'correction';
  /** Spanish side (correct form) */
  es: string;
  /** English meaning, or the explanation for a correction */
  en: string;
  /** for corrections: what the learner originally said */
  wrong?: string;
  created: number;
  due: number;
  interval: number; // days
  ease: number;
  reps: number;
  lapses: number;
}

export interface ChatTurn {
  role: 'tutor' | 'learner';
  es: string;
  en?: string;
  correction?: Correction | null;
  hint?: string;
  words?: { es: string; en: string }[];
}

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
  errorType: string;
}

export interface TutorReply {
  reply_es: string;
  reply_en: string;
  has_correction: boolean;
  corrected: string;
  correction_explanation_en: string;
  error_type: string;
  english_hint: string;
  new_words: { es: string; en: string }[];
  suggestions: string[];
  goal_complete: boolean;
}

export interface SessionReview {
  summary_en: string;
  fluency: number;
  accuracy: number;
  task_completion: number;
  top_corrections: { wrong: string; right: string; why_en: string; error_type: string }[];
  new_words: { es: string; en: string }[];
  level_change: 'down' | 'same' | 'up';
  english_support: EnglishSupport;
  tutor_notes: string;
}

export interface PlacementResult {
  level: Level;
  speaking: number;
  listening: number;
  grammar: number;
  vocabulary: number;
  english_support: EnglishSupport;
  error_types: string[];
  notes: string;
  message_en: string;
}

export type Drill =
  | { type: 'choice'; prompt: string; audio?: string; options: string[]; answer: string }
  | { type: 'fill'; sentence: string; en: string; options: string[]; answer: string }
  | { type: 'build'; en: string; words: string[]; answer: string }
  | { type: 'translate'; en: string; answer: string }
  | { type: 'listen'; es: string; en: string }
  | { type: 'say'; es: string; en: string };

export interface DayLog {
  date: string; // YYYY-MM-DD
  seconds: number;
}
