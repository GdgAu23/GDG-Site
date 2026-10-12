// POST /api/mail/weekly: Monday digest, triggered by the cron Worker in workers/weekly-cron.
// Auth: header x-cron-secret must equal CRON_SECRET.
// Sends the WhatsApp-ready post to the club inbox, and the newsletter to subscribers
// (newsletter only once a domain is verified in Resend).
import { json, bad } from '../../_lib/util.js';
import { upcomingEvents } from '../../_lib/db.js';
import { SITE } from '../../_lib/page.js';
import { canMail, canMailPublic, sendNow, sendBatch } from '../../_lib/mail.js';
import { whatsappPostEmail, newsletterEmail } from '../../_lib/emails.js';

export async function onRequestPost({ request, env }) {
  if (!env.CRON_SECRET || request.headers.get('x-cron-secret') !== env.CRON_SECRET) return bad('Forbidden', 403);
  if (!canMail(env)) return bad('RESEND_API_KEY not set', 500);

  const until = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const events = (await upcomingEvents(env.DB))
    .filter(e => String(e.starts_at).slice(0, 10) <= until)
    .map(e => ({ ...e, url: `${SITE}/events/${e.slug}` }));
  if (!events.length) return json({ ok: true, events: 0 });

  await sendNow(env, env.ADMIN_NOTIFY, whatsappPostEmail(events));
  let subscribers = 0;
  if (canMailPublic(env)) {
    const subs = (await env.DB.prepare('SELECT email FROM subscribers').all()).results.map(r => r.email);
    subscribers = await sendBatch(env, subs, newsletterEmail(events));
  }
  return json({ ok: true, events: events.length, subscribers });
}
