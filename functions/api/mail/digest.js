// GET /api/mail/digest: data for the weekly email, called by the Gmail Apps Script.
// Authenticated with the shared APPS_SCRIPT_SECRET (header x-gdg-secret).
import { json, bad } from '../../_lib/util.js';
import { upcomingEvents } from '../../_lib/db.js';
import { SITE } from '../../_lib/page.js';

export async function onRequestGet({ request, env }) {
  if (!env.APPS_SCRIPT_SECRET || request.headers.get('x-gdg-secret') !== env.APPS_SCRIPT_SECRET) return bad('Forbidden', 403);
  const until = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const [events, subs] = await Promise.all([
    upcomingEvents(env.DB),
    env.DB.prepare('SELECT email FROM subscribers ORDER BY created_at').all(),
  ]);
  return json({
    site: SITE,
    events: events.filter(e => String(e.starts_at).slice(0, 10) <= until)
      .map(e => ({ title: e.title, starts_at: e.starts_at, location: e.location, online: !!e.online, summary: e.summary, url: `${SITE}/events/${e.slug}` })),
    subscribers: subs.results.map(r => r.email),
  });
}
