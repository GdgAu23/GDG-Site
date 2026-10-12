// Small shared helpers for Pages Functions.

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Only http(s) and site-relative URLs survive; anything else (javascript:, data:) becomes ''.
export const safeUrl = (v) => {
  const s = String(v || '').trim();
  return /^https?:\/\//i.test(s) || /^\/(?!\/)/.test(s) ? s : '';
};

export const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) },
});

export const bad = (message, status = 400) => json({ error: message }, { status });

export const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item';

const TZ = 'Africa/Harare';
const hasTime = (iso) => /T\d{2}:\d{2}/.test(String(iso || ''));
// Date-only values ("2026-10-09") are calendar days, not instants: keep them in UTC so they never shift.
const toDate = (iso) => new Date(hasTime(iso) ? iso : `${iso}T12:00:00Z`);

export function formatDate(iso, opts = {}) {
  if (!iso) return '';
  const d = toDate(iso);
  if (isNaN(d)) return '';
  const day = d.toLocaleDateString('en-GB', { weekday: opts.weekday ? 'long' : undefined, day: 'numeric', month: 'long', year: opts.year === false ? undefined : 'numeric', timeZone: hasTime(iso) ? TZ : 'UTC' });
  if (!hasTime(iso) || opts.time === false) return day;
  return `${day}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ })}`;
}

export function dateParts(iso) {
  const d = toDate(iso);
  const zone = hasTime(iso) ? TZ : 'UTC';
  return {
    day: d.toLocaleDateString('en-GB', { day: '2-digit', timeZone: zone }),
    month: d.toLocaleDateString('en-GB', { month: 'short', timeZone: zone }),
    weekday: d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: zone }),
    time: hasTime(iso) ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ }) : '',
  };
}

// "Today" in Harare as YYYY-MM-DD, used to split upcoming/past for date-only events.
export const todayHarare = (now = new Date()) => now.toLocaleDateString('en-CA', { timeZone: TZ });

export async function readJson(request, maxBytes = 20000) {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error('Request too large');
  try { return JSON.parse(text || '{}'); } catch { throw new Error('Invalid JSON'); }
}

// Trim strings and cap their length; returns null for empty.
export const clean = (v, max = 500) => {
  const s = String(v ?? '').trim();
  return s ? s.slice(0, max) : null;
};

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || ''));
