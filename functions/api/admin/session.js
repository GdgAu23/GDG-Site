// GET: who am I (+ public sign-in config). POST: exchange a Google ID token for a session. DELETE: sign out.
import { verifyGoogleToken, createSession, readSession, getCookie, sessionCookie, adminEmails, COOKIE, SESSION_MAX_AGE } from '../../_lib/auth.js';
import { json, bad, readJson } from '../../_lib/util.js';

const isLocal = (req) => ['localhost', '127.0.0.1'].includes(new URL(req.url).hostname);

export async function onRequestGet({ request, env }) {
  const s = await readSession(env.SESSION_SECRET, getCookie(request, COOKIE));
  const signedIn = s && adminEmails(env).includes(s.email);
  return json({
    email: signedIn ? s.email : null,
    clientId: env.GOOGLE_CLIENT_ID || null,
    devLogin: isLocal(request) && !!env.DEV_ADMIN_EMAIL,
    mail: !!(env.APPS_SCRIPT_URL && env.APPS_SCRIPT_SECRET),
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.SESSION_SECRET) return bad('SESSION_SECRET is not configured', 500);
  const body = await readJson(request).catch(() => ({}));
  let email;
  if (body.dev && isLocal(request) && env.DEV_ADMIN_EMAIL) {
    email = env.DEV_ADMIN_EMAIL.toLowerCase(); // local development only
  } else {
    if (!env.GOOGLE_CLIENT_ID) return bad('GOOGLE_CLIENT_ID is not configured', 500);
    try { email = (await verifyGoogleToken(body.credential, env.GOOGLE_CLIENT_ID)).email.toLowerCase(); }
    catch (e) { return bad(`Sign-in failed: ${e.message}`, 401); }
  }
  if (!adminEmails(env).includes(email)) return bad(`${email} isn't an admin account.`, 403);
  return json({ email }, { headers: { 'set-cookie': sessionCookie(await createSession(env.SESSION_SECRET, email), SESSION_MAX_AGE) } });
}

export const onRequestDelete = () => json({ ok: true }, { headers: { 'set-cookie': sessionCookie('', 0) } });
