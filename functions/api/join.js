// POST /api/join: membership sign-up. Welcome email to the member (needs a verified domain)
// and an alert to the club inbox.
import { json, bad, clean, isEmail } from '../_lib/util.js';
import { formInput } from '../_lib/forms.js';
import { sendMail, canMailPublic } from '../_lib/mail.js';
import { welcomeEmail, memberAlert } from '../_lib/emails.js';
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

  const db = ctx.env.DB;
  if (await db.prepare('SELECT id FROM members WHERE email = ?').bind(m.email).first()) return json({ ok: true, already: true });

  await db.prepare(`INSERT INTO members (name, email, academic_year, department, interests, motivation) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(m.name, m.email, m.academic_year, m.department, m.interests, m.motivation).run();

  sendMail(ctx, ctx.env.ADMIN_NOTIFY, memberAlert(m), { replyTo: m.email });
  if (canMailPublic(ctx.env)) {
    const events = (await upcomingEvents(db, 3)).map(e => ({ ...e, url: `${SITE}/events/${e.slug}` }));
    sendMail(ctx, m.email, welcomeEmail(m, events), { replyTo: ctx.env.ADMIN_NOTIFY });
    ctx.waitUntil(db.prepare(`UPDATE members SET status = 'welcomed', welcomed_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE email = ?`).bind(m.email).run());
  }
  return json({ ok: true });
}
