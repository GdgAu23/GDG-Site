// POST /api/apply: lead-role applications and "join this build" requests. Alerts the club inbox.
import { json, bad, clean, isEmail } from '../_lib/util.js';
import { formInput } from '../_lib/forms.js';
import { sendMail } from '../_lib/mail.js';
import { applicationAlert } from '../_lib/emails.js';

export async function onRequestPost(ctx) {
  const { body, error } = await formInput(ctx.request);
  if (error) return error;
  const kind = body.kind === 'collab' ? 'collab' : 'lead';
  const a = {
    name: clean(body.name, 120), email: clean(body.email, 200)?.toLowerCase(),
    role: clean(body.role, 120), details: clean(body.details, 3000),
    project_id: Number.isInteger(Number(body.project_id)) && body.project_id ? Number(body.project_id) : null,
  };
  if (!a.name || !isEmail(a.email)) return bad('Please add your name and a valid email.');
  if (kind === 'lead' && !a.role) return bad('Pick the role you want to lead.');

  const db = ctx.env.DB;
  await db.prepare(`INSERT INTO applications (kind, name, email, role, project_id, details) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(kind, a.name, a.email, a.role, a.project_id, a.details).run();
  const project = a.project_id ? await db.prepare('SELECT title FROM projects WHERE id = ?').bind(a.project_id).first() : null;
  sendMail(ctx, ctx.env.ADMIN_NOTIFY, applicationAlert(kind, a, project?.title), { replyTo: a.email });
  return json({ ok: true });
}
