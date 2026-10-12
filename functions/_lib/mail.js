// Email through Resend (https://resend.com). Config:
//   RESEND_API_KEY  secret, a send-only key is enough
//   MAIL_FROM       e.g. "GDG Africa University <hello@yourdomain>"; must be on a domain verified in Resend
//   ADMIN_NOTIFY    where member/application alerts go
// Until a domain is verified, Resend only delivers from onboarding@resend.dev to the account owner,
// so mail to students is skipped and only admin alerts are sent.

const DEFAULT_FROM = 'GDG Africa University <onboarding@resend.dev>';
export const mailFrom = (env) => env.MAIL_FROM || DEFAULT_FROM;
export const canMail = (env) => !!env.RESEND_API_KEY;
// Public mail (welcome, newsletter) needs a verified domain: the resend.dev sandbox sender can't reach students.
export const canMailPublic = (env) => canMail(env) && !/@resend\.dev>?\s*$/i.test(mailFrom(env));

async function resend(env, path, body) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

const message = (env, to, { subject, html, text }, replyTo) => ({
  from: mailFrom(env), to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}),
});

// Fire-and-forget from request handlers: a slow mail API never delays the form response.
export function sendMail(ctx, to, email, { replyTo } = {}) {
  if (!canMail(ctx.env) || !to) return false;
  ctx.waitUntil(resend(ctx.env, '/emails', message(ctx.env, to, email, replyTo)).catch(e => console.error('mail failed', e.message)));
  return true;
}

export const sendNow = (env, to, email, opts = {}) => resend(env, '/emails', message(env, to, email, opts.replyTo));

// Up to 100 messages per Resend batch call; one email per recipient (no shared To/BCC lists).
export async function sendBatch(env, recipients, email) {
  let sent = 0;
  for (let i = 0; i < recipients.length; i += 100) {
    const chunk = recipients.slice(i, i + 100);
    await resend(env, '/emails/batch', chunk.map(to => message(env, to, email, env.ADMIN_NOTIFY)));
    sent += chunk.length;
  }
  return sent;
}
