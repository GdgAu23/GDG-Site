// POST /api/join: membership sign-up. Sends the welcome email via Apps Script.
import { json, bad, clean, isEmail } from '../_lib/util.js';
import { formInput } from '../_lib/forms.js';
import { sendMail } from '../_lib/mail.js';
import { upcomingEvents } from '../_lib/db.js';
import { SITE } from '../_lib/page.js';

export async function onRequestPost(ctx) {
  const { body, error } = await formInput(ctx.request);
  if (error) return error;
  const m = {
    name: clean(body.name, 120), email: clean(body.email, 200)?.toLowerCase(),
    academic_year: clean(body.academic_year, 40), department: clean(body.department, 120),
    interests: clean(body.interests, 600), motivation: clean(body.motivation, 1500),
  };
  if (!m.name || !isEmail(m.email)) return bad('Please add your name and a valid email.');

  const existing = await ctx.env.DB.prepare('SELECT id FROM members WHERE email = ?').bind(m.email).first();
  if (existing) return json({ ok: true, already: true });

  await ctx.env.DB.prepare(`INSERT INTO members (name, email, academic_year, department, interests, motivation) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(m.name, m.email, m.academic_year, m.department, m.interests, m.motivation).run();
  const next = (await upcomingEvents(ctx.env.DB, 3)).map(e => ({ title: e.title, starts_at: e.starts_at, location: e.location, url: `${SITE}/events/${e.slug}` }));
  const mailed = sendMail(ctx, { type: 'welcome', member: m, events: next });
  if (mailed) ctx.waitUntil(ctx.env.DB.prepare(`UPDATE members SET status = 'welcomed', welcomed_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE email = ?`).bind(m.email).run());
  return json({ ok: true });
}
