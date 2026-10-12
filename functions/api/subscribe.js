import { json, bad, clean, isEmail } from '../_lib/util.js';
import { formInput } from '../_lib/forms.js';

export async function onRequestPost(ctx) {
  const { body, error } = await formInput(ctx.request);
  if (error) return error;
  const email = clean(body.email, 200)?.toLowerCase();
  if (!isEmail(email)) return bad('That email doesn\u2019t look right.');
  const r = await ctx.env.DB.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').bind(email).run();
  return json({ ok: true, already: r.meta.changes === 0 });
}
