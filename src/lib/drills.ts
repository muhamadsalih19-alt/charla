import type { Unit } from '../data/units';
import { UNITS } from '../data/units';
import type { AiDrill } from './claude';
import type { Drill } from './types';

function shuffle<T>(a: T[]): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const words = (s: string) => s.replace(/[¿?¡!.,]/g, '').split(/\s+/).filter(Boolean);

/** Drills built from a unit's own phrases. Works offline and without an API key. */
export function localDrills(unit: Unit): Drill[] {
  const ph = shuffle(unit.phrases);
  const others = UNITS.flatMap((u) => u.phrases).filter((p) => !unit.phrases.includes(p));
  const out: Drill[] = [];
  ph.forEach((p, i) => {
    const kind = i % 5;
    if (kind === 0) {
      const wrong = shuffle([...unit.phrases.filter((x) => x !== p), ...others]).slice(0, 3).map((x) => x.en);
      out.push({ type: 'choice', prompt: 'What does this mean?', audio: p.es, options: shuffle([p.en, ...wrong]), answer: p.en });
    } else if (kind === 1) {
      const w = words(p.es);
      if (w.length >= 3 && w.length <= 8) out.push({ type: 'build', en: p.en, words: shuffle(w), answer: w.join(' ') });
      else out.push({ type: 'translate', en: p.en, answer: p.es });
    } else if (kind === 2) {
      out.push({ type: 'listen', es: p.es, en: p.en });
    } else if (kind === 3) {
      out.push({ type: 'say', es: p.es, en: p.en });
    } else {
      out.push({ type: 'translate', en: p.en, answer: p.es });
    }
  });
  return out;
}

export function fromAi(d: AiDrill): Drill | null {
  if (!d.answer.trim()) return null;
  if (d.kind === 'choice' && d.options.length >= 2 && d.options.includes(d.answer)) {
    return { type: 'choice', prompt: d.prompt_en, options: shuffle(d.options), answer: d.answer };
  }
  if (d.kind === 'fill' && d.es.includes('___') && d.options.includes(d.answer)) {
    return { type: 'fill', sentence: d.es, en: d.prompt_en, options: shuffle(d.options), answer: d.answer };
  }
  if (d.kind === 'translate' && d.prompt_en) return { type: 'translate', en: d.prompt_en, answer: d.answer };
  if (d.kind === 'build') {
    const w = words(d.answer);
    if (w.length >= 2 && w.length <= 10) return { type: 'build', en: d.prompt_en, words: shuffle(w), answer: w.join(' ') };
  }
  return null;
}

/** Interleaves AI drills with local listening/speaking drills for a ~12 item set. */
export function mixDrills(unit: Unit, ai: AiDrill[]): Drill[] {
  const local = localDrills(unit);
  const aiDrills = ai.map(fromAi).filter((d): d is Drill => d !== null);
  if (!aiDrills.length) return local;
  const audio = local.filter((d) => d.type === 'listen' || d.type === 'say' || d.type === 'choice').slice(0, 4);
  const out: Drill[] = [];
  const a = [...aiDrills];
  const b = [...audio];
  while (a.length || b.length) {
    if (a.length) out.push(a.shift()!);
    if (a.length) out.push(a.shift()!);
    if (b.length) out.push(b.shift()!);
  }
  return out.slice(0, 12);
}
