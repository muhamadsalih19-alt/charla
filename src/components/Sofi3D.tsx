import { useEffect, useRef, useState } from 'react';
import type { TalkingHead } from '@met4citizen/talkinghead';
import { Avatar, type AvatarState } from './Avatar';
import { audioCtx, lipSync } from '../lib/audio';
import { setSpeechSink } from '../lib/speech';
import type { TutorGesture, TutorMood } from '../lib/types';

/** A face and hand gesture for Sofi; `n` changes each time so the same gesture can play twice. */
export interface Expression {
  mood: TutorMood;
  gesture: TutorGesture;
  n: number;
}

function webglOk() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

/** Sofi as a 3D character that lip-syncs to her voice. Falls back to the drawing if 3D can't load. */
export function Sofi3D({ state, expression }: { state: AvatarState; expression?: Expression }) {
  const host = useRef<HTMLDivElement>(null);
  const head = useRef<TalkingHead | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(webglOk() ? 'loading' : 'failed');

  useEffect(() => {
    if (status === 'failed') return;
    let alive = true;
    let h: TalkingHead | null = null;

    (async () => {
      try {
        const { TalkingHead } = await import('@met4citizen/talkinghead');
        if (!alive || !host.current) return;
        h = new TalkingHead(host.current, {
          lipsyncModules: [],
          cameraView: 'upper',
          cameraRotateEnable: false,
          audioCtx: audioCtx(),
          // the voice plays through an <audio> element (heard on silent); Sofi only moves her lips to it
          mixerGainSpeech: 0,
          modelFPS: 30,
          modelPixelRatio: Math.min(2, window.devicePixelRatio || 1),
          avatarIdleEyeContact: 0.6,
          avatarSpeakingEyeContact: 0.8,
          lightAmbientIntensity: 2.2,
          lightDirectIntensity: 25,
        });
        await h.showAvatar({ url: `${import.meta.env.BASE_URL}avatars/sofi.glb`, body: 'F', avatarMood: 'happy', lipsyncLang: 'fi' });
        if (!alive) return;
        head.current = h;
        setStatus('ready');
        const th = h;
        setSpeechSink({
          animate(buf, text) {
            th.stopSpeaking();
            // mouth shapes are computed here, so no lip-sync language module is needed
            th.speakAudio({ audio: buf, ...lipSync(text, buf.duration * 1000) }, { lipsyncLang: 'fi' });
          },
          stop() {
            th.stopSpeaking();
          },
        });
      } catch (e) {
        console.warn('3D avatar failed, using the drawing instead', e);
        if (alive) setStatus('failed');
      }
    })();

    return () => {
      alive = false;
      setSpeechSink(null);
      head.current = null;
      try {
        h?.stop();
        h?.dispose();
      } catch {
        /* already gone */
      }
    };
    // only build the scene once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const h = head.current;
    if (!h || !expression) return;
    h.setMood(expression.mood);
    if (expression.gesture !== 'none') h.playGesture(expression.gesture, 2.5, Math.random() < 0.5);
  }, [expression, status]);

  useEffect(() => {
    const h = head.current;
    if (!h) return;
    if (state === 'listening') h.makeEyeContact(8000);
  }, [state, status]);

  if (status === 'failed') {
    return (
      <div className="sofi3d flat">
        <Avatar state={state} size={128} />
      </div>
    );
  }

  return (
    <div className={`sofi3d ${status}`}>
      <div ref={host} className="sofi3d-canvas" aria-label={`Sofi is ${state}`} role="img" />
      {status === 'loading' && (
        <div className="sofi3d-loading">
          <Avatar state="idle" size={96} />
          <span>Sofi is getting ready…</span>
        </div>
      )}
      {state === 'thinking' && status === 'ready' && (
        <div className="avatar-dots sofi3d-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      {state === 'listening' && status === 'ready' && <div className="sofi3d-listening" aria-hidden="true" />}
    </div>
  );
}
