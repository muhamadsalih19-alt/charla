import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as z from 'zod';
import type { Scenario } from '../data/scenarios';
import type { Unit } from '../data/units';
import { drillSystem, gradeSystem, placementSystem, reviewSystem, tutorSystem } from './prompts';
import type { ChatTurn, PlacementResult, Profile, SessionReview, TutorReply } from './types';
import * as demo from './demo';

export const FAST_MODEL = 'claude-haiku-5-5';

export const TUTOR_MODELS = [
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (fast, recommended)' },
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (smartest, slower, about 2x cost)' },
];

let client: Anthropic | null = null;
let clientKey = '';

function getClient(apiKey: string): Anthropic {
  if (!client || clientKey !== apiKey) {
    // The key lives only on this device and is sent straight to Anthropic.
    client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
    clientKey = apiKey;
  }
  return client;
}

export function friendlyError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return 'Your API key was not accepted. Check it in Settings.';
  if (e instanceof Anthropic.PermissionDeniedError) return 'This API key does not have permission for that model.';
  if (e instanceof Anthropic.RateLimitError) return 'Too many requests or out of credit. Check your billing in the Claude Console, then try again.';
  if (e instanceof Anthropic.APIConnectionError) return 'No connection. Check your internet and try again.';
  if (e instanceof Anthropic.BadRequestError) return 'The request was rejected: ' + e.message;
  if (e instanceof Anthropic.APIError) return 'Claude had a problem (' + (e.status ?? '?') + '). Try again in a moment.';
  if (e instanceof Error) return e.message;
  return 'Something went wrong.';
}

async function structured<T extends z.ZodType>(
  apiKey: string,
  model: string,
  system: string,
  messages: Anthropic.MessageParam[],
  schema: T,
  maxTokens = 4000,
): Promise<z.infer<T>> {
  const res = await getClient(apiKey).messages.parse({
    model,
    max_tokens: maxTokens,
    system,
    messages,
    output_config: { effort: 'low', format: zodOutputFormat(schema) },
  });
  if (res.stop_reason === 'refusal') throw new Error('Claude declined to answer that. Try saying it a different way.');
  if (res.stop_reason === 'max_tokens') throw new Error('The answer was cut off. Please try again.');
  if (!res.parsed_output) throw new Error('Could not read Claude’s answer. Please try again.');
  return res.parsed_output as z.infer<T>;
}

const Word = z.object({ es: z.string(), en: z.string() });

const TutorSchema = z.object({
  reply_es: z.string(),
  reply_en: z.string(),
  has_correction: z.boolean(),
  corrected: z.string(),
  correction_explanation_en: z.string(),
  error_type: z.string(),
  english_hint: z.string(),
  new_words: z.array(Word),
  suggestions: z.array(z.string()),
  goal_complete: z.boolean(),
});

function transcriptMessages(turns: ChatTurn[]): Anthropic.MessageParam[] {
  // The API needs a user turn first, so the scene opens with a stage direction.
  const msgs: Anthropic.MessageParam[] = [{ role: 'user', content: '[La conversación empieza. Saluda al estudiante.]' }];
  for (const t of turns) {
    const role = t.role === 'tutor' ? 'assistant' : 'user';
    const last = msgs[msgs.length - 1];
    if (last.role === role) last.content = `${last.content}\n${t.es}`;
    else msgs.push({ role, content: t.es });
  }
  if (msgs[msgs.length - 1].role === 'assistant') msgs.push({ role: 'user', content: '[El estudiante no dijo nada. Continúa.]' });
  return msgs;
}

export async function tutorTurn(
  apiKey: string,
  model: string,
  s: Scenario,
  profile: Profile,
  name: string,
  turns: ChatTurn[],
): Promise<TutorReply> {
  if (!apiKey) return demo.tutorTurn(s, turns);
  return structured(apiKey, model, tutorSystem(s, profile, name), transcriptMessages(turns), TutorSchema, 3000);
}

function plainTranscript(turns: ChatTurn[]): string {
  return turns.map((t) => `${t.role === 'tutor' ? 'Tutor' : 'Learner'}: ${t.es}`).join('\n');
}

const ReviewSchema = z.object({
  summary_en: z.string(),
  fluency: z.number().int(),
  accuracy: z.number().int(),
  task_completion: z.number().int(),
  top_corrections: z.array(z.object({ wrong: z.string(), right: z.string(), why_en: z.string(), error_type: z.string() })),
  new_words: z.array(Word),
  level_change: z.enum(['down', 'same', 'up']),
  english_support: z.enum(['lots', 'some', 'minimal']),
  tutor_notes: z.string(),
});

export async function reviewSession(apiKey: string, s: Scenario, profile: Profile, turns: ChatTurn[]): Promise<SessionReview> {
  if (!apiKey) return demo.review(turns);
  const content = `Learner's current level: ${profile.level}. Current English support: ${profile.englishSupport}.
Current tutor notes: ${profile.notes || 'none'}
Scenario: ${s.titleEn}. Goal: ${s.goalEn}

Conversation:
${plainTranscript(turns)}`;
  return structured(apiKey, FAST_MODEL, reviewSystem(), [{ role: 'user', content }], ReviewSchema);
}

const PlacementSchema = z.object({
  level: z.enum(['A1', 'A1+', 'A2', 'A2+', 'B1']),
  speaking: z.number().int(),
  listening: z.number().int(),
  grammar: z.number().int(),
  vocabulary: z.number().int(),
  english_support: z.enum(['lots', 'some', 'minimal']),
  error_types: z.array(z.string()),
  notes: z.string(),
  message_en: z.string(),
});

export async function assessPlacement(apiKey: string, turns: ChatTurn[]): Promise<PlacementResult> {
  if (!apiKey) return demo.placement(turns);
  return structured(apiKey, FAST_MODEL, placementSystem(), [{ role: 'user', content: plainTranscript(turns) }], PlacementSchema);
}

const DrillSchema = z.object({
  drills: z.array(
    z.object({
      kind: z.enum(['choice', 'fill', 'translate', 'build']),
      prompt_en: z.string(),
      es: z.string(),
      options: z.array(z.string()),
      answer: z.string(),
    }),
  ),
});
export type AiDrill = z.infer<typeof DrillSchema>['drills'][number];

export async function generateDrills(apiKey: string, unit: Unit, profile: Profile): Promise<AiDrill[]> {
  const errors = Object.keys(profile.errorPatterns).slice(0, 5).join(', ') || 'none yet';
  const content = `Unit ${unit.num}: ${unit.titleEn} (${unit.title}).
Key ideas: ${unit.explain.join(' ')}
Example phrases: ${unit.phrases.map((p) => p.es).join(' | ')}
Learner level: ${profile.level}. Recurring mistakes: ${errors}.`;
  const out = await structured(apiKey, FAST_MODEL, drillSystem(), [{ role: 'user', content }], DrillSchema, 6000);
  return out.drills;
}

const GradeSchema = z.object({ correct: z.boolean(), feedback_en: z.string(), best_answer: z.string() });

export async function gradeTranslation(apiKey: string, english: string, expected: string, learner: string) {
  const content = `English: ${english}\nReference Spanish: ${expected}\nLearner's Spanish: ${learner}`;
  return structured(apiKey, FAST_MODEL, gradeSystem(), [{ role: 'user', content }], GradeSchema, 1500);
}

export async function testKey(apiKey: string, model: string): Promise<void> {
  await getClient(apiKey).messages.create({
    model,
    max_tokens: 16,
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: 'Di "hola".' }],
  });
}
