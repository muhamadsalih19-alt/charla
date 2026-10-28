// Sends the daily push reminder. Run hourly by .github/workflows/reminder.yml.
// Secrets: REMINDER_CODE (from the app's Settings), VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY.
import webpush from 'web-push';

const { REMINDER_CODE, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, FORCE } = process.env;
if (!REMINDER_CODE) {
  console.log('No REMINDER_CODE secret yet; nothing to send.');
  process.exit(0);
}

const { sub, hour, tz } = JSON.parse(Buffer.from(REMINDER_CODE.trim(), 'base64').toString('utf8'));
const localHour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(new Date()));
if (FORCE !== 'true' && localHour !== hour) {
  console.log(`Local hour in ${tz} is ${localHour}; reminder is set for ${hour}. Skipping.`);
  process.exit(0);
}

const messages = [
  '¿Practicamos un poquito hoy? Sofi te espera.',
  '¡Hola! Diez minutos de español y listo.',
  'Tus tarjetas de repaso te están esperando.',
  '¿Qué tal una charla rápida con Sofi?',
  '¡No pierdas tu racha! Practica un ratito.',
  'Hoy es un buen día para hablar español.',
];
const body = messages[new Date().getDate() % messages.length];

webpush.setVapidDetails('mailto:charla-reminders@users.noreply.github.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
try {
  await webpush.sendNotification(sub, JSON.stringify({ title: 'Charla', body }), { TTL: 6 * 3600 });
  console.log('Reminder sent.');
} catch (e) {
  console.error('Push failed:', e.statusCode, e.body);
  if (e.statusCode === 404 || e.statusCode === 410) console.error('The phone unsubscribed. Turn reminders on again in Settings and update REMINDER_CODE.');
  process.exit(1);
}
