// Natural voice: OpenAI text-to-speech, played through Web Audio so it works with the phone on silent.

export const OPENAI_VOICES = [
  { id: 'coral', label: 'Coral (warm, friendly)' },
  { id: 'nova', label: 'Nova (bright, upbeat)' },
  { id: 'shimmer', label: 'Shimmer (soft, calm)' },
  { id: 'sage', label: 'Sage (clear, relaxed)' },
];

const TTS_MODEL = 'gpt-4o-mini-tts';
const STYLE =
  'Eres Sofi, una tutora de español de 27 años de la Ciudad de México. Habla en español latinoamericano con acento mexicano natural, cálida, alegre y expresiva, como una amiga que sonríe al hablar. Pronuncia con claridad para alguien que está aprendiendo.';

let ctx: AudioContext | null = null;

/** One shared audio context. "playback" tells iOS this is media, so the silent switch doesn't mute it. */
export function audioCtx(): AudioContext {
  if (!ctx) {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = 'playback';
    ctx = new AudioContext();
  }
  return ctx;
}

/** iOS starts audio suspended until a tap; call from a tap handler. */
export function unlockAudio() {
  const c = audioCtx();
  if (c.state !== 'running') c.resume().catch(() => {});
  const src = c.createBufferSource();
  src.buffer = c.createBuffer(1, 1, 22050);
  src.connect(c.destination);
  src.start(0);
}

const cache = new Map<string, Promise<AudioBuffer>>();

/** Spanish speech as decoded audio. Repeats (replay buttons) come from memory. */
export function synthesize(key: string, voice: string, text: string, slow = false): Promise<AudioBuffer> {
  const id = `${voice}|${slow ? 's' : 'n'}|${text}`;
  const hit = cache.get(id);
  if (hit) return hit;
  const job = (async () => {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TTS_MODEL,
        voice,
        input: text,
        instructions: slow ? `${STYLE} Habla muy despacio, separando bien cada palabra.` : STYLE,
        response_format: 'mp3',
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(res.status === 401 ? 'Your OpenAI key was not accepted.' : `OpenAI voice error ${res.status}: ${detail.slice(0, 120)}`);
    }
    return audioCtx().decodeAudioData(await res.arrayBuffer());
  })();
  cache.set(id, job);
  job.catch(() => cache.delete(id));
  if (cache.size > 60) cache.delete(cache.keys().next().value!);
  return job;
}

let current: AudioBufferSourceNode | null = null;

export function playBuffer(buf: AudioBuffer, onEnd: () => void) {
  stopBuffer();
  const c = audioCtx();
  if (c.state !== 'running') c.resume().catch(() => {});
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(c.destination);
  src.onended = () => {
    if (current === src) current = null;
    onEnd();
  };
  current = src;
  src.start();
}

export function stopBuffer() {
  const src = current;
  current = null;
  try {
    src?.stop();
  } catch {
    /* already stopped */
  }
}

// ── Lip-sync ────────────────────────────────────────────────
// Spanish spelling is close to its sound, so letters map to mouth shapes (Oculus visemes) well enough.

const VOWEL: Record<string, string> = { a: 'aa', á: 'aa', e: 'E', é: 'E', i: 'I', í: 'I', o: 'O', ó: 'O', u: 'U', ú: 'U', ü: 'U' };
const DIGRAPH: Record<string, string> = { ch: 'CH', ll: 'CH', rr: 'RR' };

function wordVisemes(word: string): string[] {
  const w = word.toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
  const out: string[] = [];
  for (let i = 0; i < w.length; i++) {
    const c = w[i];
    const n = w[i + 1] ?? '';
    const pair = DIGRAPH[c + n];
    if (pair) {
      out.push(pair);
      i++;
    } else if (VOWEL[c]) out.push(VOWEL[c]);
    else if (c === 'y') out.push(i === w.length - 1 ? 'I' : 'CH');
    else if ('bpmv'.includes(c)) out.push('PP');
    else if (c === 'f') out.push('FF');
    else if (c === 'c') out.push('eéií'.includes(n) ? 'SS' : 'kk');
    else if ('sz'.includes(c)) out.push('SS');
    else if ('kqgjx'.includes(c)) out.push('kk');
    else if ('dtl'.includes(c)) out.push('DD');
    else if ('nñ'.includes(c)) out.push('nn');
    else if (c === 'r') out.push('RR');
    // h is silent
  }
  return out;
}

export interface LipSync {
  words: string[];
  wtimes: number[];
  wdurations: number[];
  visemes: string[];
  vtimes: number[];
  vdurations: number[];
}

/** Spreads the text's mouth shapes over the audio's length, pausing at punctuation. */
export function lipSync(text: string, durationMs: number): LipSync {
  const words = text.split(/\s+/).filter(Boolean);
  const per = words.map(wordVisemes);
  // vowels hold longer than consonants
  const weight = (v: string) => (['aa', 'E', 'I', 'O', 'U'].includes(v) ? 1 : 0.7);
  const pauses = words.map((w) => (/[.?!…]$/.test(w) ? 3 : /[,;:]$/.test(w) ? 1.6 : 0.5));
  const units = per.reduce((n, vs, i) => n + vs.reduce((m, v) => m + weight(v), 0) + pauses[i], 0) || 1;
  const lead = 120;
  const unit = Math.max(30, (durationMs - lead - 200) / units);
  const out: LipSync = { words: [], wtimes: [], wdurations: [], visemes: [], vtimes: [], vdurations: [] };
  let t = lead;
  per.forEach((vs, i) => {
    const start = t;
    for (const v of vs) {
      const d = weight(v) * unit;
      out.visemes.push(v);
      out.vtimes.push(Math.round(t));
      out.vdurations.push(Math.round(d));
      t += d;
    }
    out.words.push(words[i]);
    out.wtimes.push(Math.round(start));
    out.wdurations.push(Math.max(1, Math.round(t - start)));
    t += pauses[i] * unit;
  });
  return out;
}
