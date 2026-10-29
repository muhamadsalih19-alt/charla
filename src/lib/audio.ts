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

/** Web Audio is only used to decode speech and drive the 3D lip-sync; it never makes the sound itself. */
export function audioCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

// All sound goes through one <audio> element. iOS mutes Web Audio on silent,
// but plays media elements like a video, so Sofi is heard with the ringer off.
let el: HTMLAudioElement | null = null;

function media(): HTMLAudioElement {
  if (!el) {
    el = new Audio();
    el.setAttribute('playsinline', '');
    el.preload = 'auto';
  }
  return el;
}

function wavUrl(samples: Float32Array, rate: number): string {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const text = (o: number, str: string) => [...str].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  v.setUint32(4, 36 + n * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, n * 2, true);
  samples.forEach((x, i) => v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x)) * 32767, true));
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

let silentUrl = '';
let unlocked = false;

/** iOS only lets a page play sound after a tap. Playing once from a tap unlocks the element for later. */
export function unlockAudio() {
  const c = audioCtx();
  if (c.state !== 'running') c.resume().catch(() => {});
  if (unlocked) return;
  unlocked = true;
  const a = media();
  silentUrl ||= wavUrl(new Float32Array(2205), 22050);
  if (!a.src || a.paused) {
    a.src = silentUrl;
    a.play().catch(() => {
      unlocked = false;
    });
  }
}

let onDone: (() => void) | null = null;

/** Plays a sound file. onPlaying fires when sound actually starts; onEnd always fires once. */
export function playMedia(url: string, cb: { onPlaying?: () => void; onEnd: () => void; onFail?: (m: string) => void }) {
  stopMedia();
  const a = media();
  let ended = false;
  const end = () => {
    if (ended) return;
    ended = true;
    if (onDone === end) onDone = null;
    cb.onEnd();
  };
  onDone = end;
  a.onplaying = () => cb.onPlaying?.();
  a.onended = end;
  a.onerror = () => {
    cb.onFail?.('The phone could not play the audio.');
    end();
  };
  a.src = url;
  a.play().catch((e: unknown) => {
    cb.onFail?.(e instanceof Error && e.name === 'NotAllowedError' ? 'Tap the screen once, then try again.' : 'The phone could not play the audio.');
    end();
  });
}

export function stopMedia() {
  const a = el;
  if (a && !a.paused) a.pause();
  const f = onDone;
  onDone = null;
  f?.();
}

/** A short two-note chime, played the same way as Sofi's voice. */
export function beep(): Promise<string> {
  const rate = 22050;
  const out = new Float32Array(Math.round(rate * 0.55));
  [660, 880].forEach((f, k) => {
    const start = Math.round(k * 0.2 * rate);
    for (let i = 0; i < rate * 0.3 && start + i < out.length; i++) {
      const env = Math.min(1, i / 200) * Math.exp(-i / (rate * 0.09));
      out[start + i] += 0.5 * env * Math.sin((2 * Math.PI * f * i) / rate);
    }
  });
  const url = wavUrl(out, rate);
  return new Promise((resolve) => {
    let msg = 'played';
    playMedia(url, {
      onFail: (m) => (msg = m),
      onEnd: () => {
        URL.revokeObjectURL(url);
        resolve(msg);
      },
    });
  });
}

export interface Speech {
  /** decoded audio, for its length and the lip-sync */
  buf: AudioBuffer;
  /** the mp3, for playback */
  url: string;
}

const cache = new Map<string, Promise<Speech>>();

/** Spanish speech from OpenAI. Repeats (replay buttons) come from memory. */
export function synthesize(key: string, voice: string, text: string, slow = false): Promise<Speech> {
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
    const blob = await res.blob();
    const buf = await audioCtx().decodeAudioData(await blob.arrayBuffer());
    return { buf, url: URL.createObjectURL(blob) };
  })();
  cache.set(id, job);
  job.catch(() => cache.delete(id));
  if (cache.size > 60) {
    const oldest = cache.keys().next().value!;
    cache.get(oldest)?.then((sp) => URL.revokeObjectURL(sp.url)).catch(() => {});
    cache.delete(oldest);
  }
  return job;
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
