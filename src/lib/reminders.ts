// Daily reminders. Push: a GitHub Actions job sends the notification every day at the
// chosen hour (the app has no server of its own). Calendar: a repeating event as a fallback.

export const VAPID_PUBLIC_KEY = 'BHcBxAQB5LHKEgOfCkcEjw5pLUk3SXHS4coFAskeNzxjfovef43uOAOS304TewzQy3ffyj5BResRzHZPGWNgD2Y';
export const REPO_SECRETS_URL = 'https://github.com/muhamadsalih19-alt/charla/settings/secrets/actions/new';

export function isInstalled(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function keyBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Asks permission, subscribes to push, and returns the code to paste into GitHub. */
export async function enablePush(hour: number): Promise<string> {
  if (!pushSupported()) throw new Error('This browser can’t receive notifications. On iPhone, add Charla to your Home Screen first and open it from there.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Notifications are turned off for Charla. Turn them on in your phone’s settings, then try again.');
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) });
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return btoa(JSON.stringify({ sub: sub.toJSON(), hour, tz }));
}

export async function testNotification() {
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification('Charla', { body: '¡Hola! Así se verán tus recordatorios.', icon: 'icons/icon-192.png', tag: 'test' });
}

/** A daily repeating calendar event with an alert, as a no-setup fallback. */
export function downloadCalendarReminder(hour: number, minutes: number) {
  const start = new Date();
  start.setHours(hour, 0, 0, 0);
  if (start.getTime() < Date.now()) start.setDate(start.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, '0');
  const local = (d: Date) => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
  const end = new Date(start.getTime() + minutes * 60_000);
  const url = location.origin + location.pathname;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Charla//Reminder//EN',
    'BEGIN:VEVENT',
    `UID:charla-daily-${Date.now()}@charla`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${local(start)}`,
    `DTEND:${local(end)}`,
    'RRULE:FREQ=DAILY',
    'SUMMARY:Práctica de español con Sofi',
    `DESCRIPTION:${minutes} minutes of Spanish. Open Charla: ${url}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:¿Practicamos español?',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'charla-reminder.ics';
  a.click();
}
