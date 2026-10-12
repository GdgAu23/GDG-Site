// GET /api/events?days=7: upcoming events as JSON (used by the weekly WhatsApp digest email).
import { json } from '../_lib/util.js';
import { upcomingEvents } from '../_lib/db.js';
import { SITE } from '../_lib/page.js';

export async function onRequestGet(ctx) {
  const days = Math.min(Number(new URL(ctx.request.url).searchParams.get('days')) || 7, 90);
  const until = new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
  const list = (await upcomingEvents(ctx.env.DB)).filter(e => String(e.starts_at).slice(0, 10) <= until);
  return json(list.map(e => ({ title: e.title, starts_at: e.starts_at, location: e.location, online: !!e.online, summary: e.summary, url: `${SITE}/events/${e.slug}` })),
    { headers: { 'cache-control': 'public, max-age=300' } });
}
