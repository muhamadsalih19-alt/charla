import { get, set, del } from 'idb-keyval';
import type { Card, DayLog, Profile, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  learnerName: '',
  dailyGoalMinutes: 15,
  speechRate: 0.9,
  voiceURI: '',
  tutorModel: 'claude-sonnet-5-5',
  autoSpeak: true,
  reminderHour: 19,
};

export const DEFAULT_PROFILE: Profile = {
  placed: false,
  level: 'A1+',
  skills: { speaking: 30, listening: 30, grammar: 30, vocabulary: 30 },
  errorPatterns: {},
  englishSupport: 'some',
  notes: '',
  sessions: 0,
  completedUnits: [],
};

export interface AppData {
  settings: Settings;
  profile: Profile;
  cards: Card[];
  days: DayLog[];
}

const KEY = 'charla-data-v1';

export async function loadData(): Promise<AppData> {
  try {
    const saved = (await get(KEY)) as Partial<AppData> | undefined;
    return {
      settings: { ...DEFAULT_SETTINGS, ...(saved?.settings ?? {}) },
      profile: { ...DEFAULT_PROFILE, ...(saved?.profile ?? {}) },
      cards: saved?.cards ?? [],
      days: saved?.days ?? [],
    };
  } catch {
    return { settings: DEFAULT_SETTINGS, profile: DEFAULT_PROFILE, cards: [], days: [] };
  }
}

export async function saveData(data: AppData) {
  try {
    await set(KEY, data);
  } catch (e) {
    console.warn('save failed', e);
  }
}

export async function clearData() {
  await del(KEY);
}

/** Backup excludes the API key so the file is safe to keep anywhere. */
export function exportBackup(data: AppData): string {
  return JSON.stringify({ ...data, settings: { ...data.settings, apiKey: '' }, exported: new Date().toISOString() }, null, 2);
}

export function parseBackup(text: string, current: AppData): AppData {
  const b = JSON.parse(text) as Partial<AppData>;
  if (!b.profile || !Array.isArray(b.cards)) throw new Error('This file is not a Charla backup.');
  return {
    settings: { ...current.settings, ...(b.settings ?? {}), apiKey: current.settings.apiKey },
    profile: { ...DEFAULT_PROFILE, ...b.profile },
    cards: b.cards,
    days: b.days ?? [],
  };
}

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
