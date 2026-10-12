// Guards every /api/admin/* route except the sign-in endpoint.
import { COOKIE, getCookie, readSession, adminEmails } from '../../_lib/auth.js';
import { bad } from '../../_lib/util.js';

export async function onRequest(ctx) {
  const { pathname } = new URL(ctx.request.url);
  if (pathname === '/api/admin/session') return ctx.next();
  const session = await readSession(ctx.env.SESSION_SECRET, getCookie(ctx.request, COOKIE));
  if (!session || !adminEmails(ctx.env).includes(session.email)) return bad('Sign in required', 401);
  // CSRF: browsers can't send this custom header cross-site without a CORS preflight we never allow
  if (ctx.request.method !== 'GET' && ctx.request.headers.get('x-gdg-admin') !== '1') return bad('Missing admin header', 403);
  ctx.data.admin = session.email;
  try { return await ctx.next(); } catch (e) { return bad(e.message || 'Server error', 500); }
}
