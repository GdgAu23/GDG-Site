// GET /api/ics/:slug: .ics file so students can add a session to any calendar.
import { eventBySlug } from '../../_lib/db.js';
import { SITE } from '../../_lib/page.js';

const icsEscape = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
// Timed: UTC stamp. Date-only: all-day event (VALUE=DATE, end = next day).
function stamp(iso) {
  if (/T\d{2}:\d{2}/.test(iso)) return `:${new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`;
  return `;VALUE=DATE:${iso.slice(0, 10).replace(/-/g, '')}`;
}
const nextDay = (iso) => new Date(new Date(`${iso.slice(0, 10)}T00:00:00Z`).getTime() + 864e5).toISOString().slice(0, 10);

export function buildIcs(ev, now = new Date()) {
  const timed = /T\d{2}:\d{2}/.test(ev.starts_at);
  const end = ev.ends_at || (timed ? new Date(new Date(ev.starts_at).getTime() + 2 * 36e5).toISOString() : nextDay(ev.starts_at));
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GDG Africa University//Events//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${ev.slug}@gdg-africa-university.pages.dev`,
    `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART${stamp(ev.starts_at)}`, `DTEND${stamp(end)}`,
    `SUMMARY:${icsEscape(ev.title)}`,
    `DESCRIPTION:${icsEscape(`${ev.summary || ''}\n\nMaterials and details: ${SITE}/events/${ev.slug}`)}`,
    `LOCATION:${icsEscape(ev.location || (ev.online ? 'Online' : 'Africa University'))}`,
    `URL:${SITE}/events/${ev.slug}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

export async function onRequestGet(ctx) {
  const ev = await eventBySlug(ctx.env.DB, ctx.params.slug);
  if (!ev) return new Response('Not found', { status: 404 });
  return new Response(buildIcs(ev), { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="${ev.slug}.ics"` } });
}
