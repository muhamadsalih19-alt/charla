import { useEffect, useState } from 'react';

export type AvatarState = 'idle' | 'speaking' | 'listening' | 'thinking';

/** Sofi, the tutor: an illustrated face that blinks, talks and listens. */
export function Avatar({ state, size = 160 }: { state: AvatarState; size?: number }) {
  const [mouth, setMouth] = useState(0);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (state !== 'speaking') {
      setMouth(0);
      return;
    }
    const seq = [1, 2, 1, 2, 0, 1, 2, 2, 1, 0];
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1 + Math.floor(Math.random() * 3)) % seq.length;
      setMouth(seq[i]);
    }, 115);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      timer = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        setTimeout(() => alive && setBlink(false), 140);
        loop();
      }, 2500 + Math.random() * 3000);
    };
    loop();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const mouthPath =
    mouth === 0
      ? <path d="M86 128 Q100 138 114 128" stroke="#8a3b3b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      : mouth === 1
        ? <ellipse cx="100" cy="131" rx="11" ry="6" fill="#7a2e33" />
        : <g><ellipse cx="100" cy="132" rx="13" ry="10" fill="#7a2e33" /><ellipse cx="100" cy="137" rx="8" ry="4" fill="#e07b84" /></g>;

  return (
    <div className={`avatar avatar-${state}`} style={{ width: size, height: size }} aria-label={`Sofi is ${state}`} role="img">
      <svg viewBox="0 0 200 200" width={size} height={size}>
        <defs>
          <clipPath id="avatar-circle">
            <circle cx="100" cy="100" r="96" />
          </clipPath>
        </defs>
        <g clipPath="url(#avatar-circle)">
          <rect width="200" height="200" fill="var(--avatar-bg)" />
          {/* hair back */}
          <ellipse cx="100" cy="92" rx="66" ry="70" fill="#2b1a14" />
          {/* bun */}
          <circle cx="100" cy="26" r="22" fill="#2b1a14" />
          {/* neck and sweater */}
          <rect x="84" y="150" width="32" height="26" fill="#c98a62" />
          <path d="M30 210 Q40 168 100 166 Q160 168 170 210 Z" fill="#e0573f" />
          <path d="M84 168 Q100 182 116 168" stroke="#c94730" strokeWidth="4" fill="none" />
          {/* face */}
          <ellipse cx="100" cy="102" rx="50" ry="58" fill="#d99a6c" />
          {/* ears and earrings */}
          <ellipse cx="51" cy="106" rx="8" ry="12" fill="#d0905f" />
          <ellipse cx="149" cy="106" rx="8" ry="12" fill="#d0905f" />
          <circle cx="51" cy="124" r="5" fill="#f2c14e" />
          <circle cx="149" cy="124" r="5" fill="#f2c14e" />
          {/* fringe */}
          <path d="M52 92 Q58 44 100 42 Q144 44 150 92 Q132 64 100 62 Q70 62 52 92 Z" fill="#2b1a14" />
          {/* brows */}
          <path d={state === 'listening' ? 'M70 80 Q80 72 90 78' : 'M70 84 Q80 78 90 82'} stroke="#2b1a14" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d={state === 'listening' ? 'M110 78 Q120 72 130 80' : 'M110 82 Q120 78 130 84'} stroke="#2b1a14" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* eyes */}
          {blink ? (
            <g stroke="#2b1a14" strokeWidth="3.5" strokeLinecap="round">
              <path d="M72 100 Q80 104 88 100" fill="none" />
              <path d="M112 100 Q120 104 128 100" fill="none" />
            </g>
          ) : (
            <g>
              <ellipse cx="80" cy="99" rx="7" ry="8" fill="#fff" />
              <ellipse cx="120" cy="99" rx="7" ry="8" fill="#fff" />
              <circle cx={state === 'thinking' ? 83 : 80} cy={state === 'thinking' ? 96 : 100} r="4.5" fill="#3a2418" />
              <circle cx={state === 'thinking' ? 123 : 120} cy={state === 'thinking' ? 96 : 100} r="4.5" fill="#3a2418" />
              <circle cx={state === 'thinking' ? 84.5 : 81.5} cy={state === 'thinking' ? 94.5 : 98.5} r="1.5" fill="#fff" />
              <circle cx={state === 'thinking' ? 124.5 : 121.5} cy={state === 'thinking' ? 94.5 : 98.5} r="1.5" fill="#fff" />
            </g>
          )}
          {/* nose and cheeks */}
          <path d="M100 104 Q96 116 100 118" stroke="#b97650" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="70" cy="118" r="8" fill="#e8846f" opacity="0.35" />
          <circle cx="130" cy="118" r="8" fill="#e8846f" opacity="0.35" />
          {mouthPath}
        </g>
      </svg>
      {state === 'thinking' && (
        <div className="avatar-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
