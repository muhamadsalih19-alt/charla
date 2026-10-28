// Text-to-speech and speech-to-text using the phone's built-in engines.

let voicesCache: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  voicesCache = window.speechSynthesis.getVoices();
  return voicesCache;
}
if ('speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
}

/** Spanish voices, Latin American first (Mexico, then US Spanish, then others). */
export function spanishVoices(): SpeechSynthesisVoice[] {
  const all = voicesCache.length ? voicesCache : loadVoices();
  const rank = (v: SpeechSynthesisVoice) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    if (l === 'es-mx') return 0;
    if (l === 'es-us') return 1;
    if (l.startsWith('es-4') || ['es-co', 'es-ar', 'es-cl', 'es-pe'].includes(l)) return 2;
    if (l === 'es-es') return 4;
    return 3;
  };
  return all.filter((v) => v.lang.toLowerCase().startsWith('es')).sort((a, b) => rank(a) - rank(b));
}

function pickVoice(voiceURI: string): SpeechSynthesisVoice | undefined {
  const list = spanishVoices();
  return list.find((v) => v.voiceURI === voiceURI) ?? list[0];
}

/** iOS only allows speech after a tap; call this from a click handler once. */
export function unlockSpeech() {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  window.speechSynthesis.speak(u);
}

export interface SpeakOptions {
  rate?: number;
  voiceURI?: string;
  lang?: string;
  onStart?: () => void;
  onBoundary?: () => void;
  onEnd?: () => void;
}

export function speak(text: string, opts: SpeakOptions = {}) {
  if (!('speechSynthesis' in window) || !text.trim()) {
    opts.onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const lang = opts.lang ?? 'es-MX';
  if (lang.startsWith('es')) {
    const v = pickVoice(opts.voiceURI ?? '');
    if (v) u.voice = v;
  }
  u.lang = u.voice?.lang ?? lang;
  u.rate = opts.rate ?? 0.9;
  let ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    opts.onEnd?.();
  };
  u.onstart = () => opts.onStart?.();
  u.onboundary = () => opts.onBoundary?.();
  u.onend = finish;
  u.onerror = finish;
  synth.speak(u);
  // Safety net: some engines never fire onend.
  const words = text.split(/\s+/).length;
  setTimeout(finish, Math.max(3000, (words / (2.6 * (opts.rate ?? 0.9))) * 1000 + 2500));
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

// ---- Speech recognition ----

type RecognitionCtor = new () => SpeechRecognitionLike;
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function recognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canRecognize(): boolean {
  return recognitionCtor() !== null;
}

export interface Listener {
  stop(): void;
  abort(): void;
}

/**
 * Starts listening in Spanish. onText gets the running transcript,
 * onDone gets the final text (possibly empty) once listening stops.
 */
export function listen(onText: (t: string) => void, onDone: (t: string, error?: string) => void): Listener | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = 'es-MX';
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  let finalText = '';
  let interim = '';
  let error: string | undefined;
  rec.onresult = (e) => {
    interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript + ' ';
      else interim += r[0].transcript;
    }
    onText((finalText + interim).trim());
  };
  rec.onerror = (e) => {
    error = e.error;
  };
  rec.onend = () => onDone((finalText + interim).trim(), error);
  try {
    rec.start();
  } catch {
    return null;
  }
  return { stop: () => rec.stop(), abort: () => rec.abort() };
}
