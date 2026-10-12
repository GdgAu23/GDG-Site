// Admin auth: Google Sign-In ID token -> verified here -> short-lived signed session cookie.
// Only emails in ADMIN_EMAILS (comma separated) get in. No passwords stored anywhere.

const enc = new TextEncoder();
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));

export const COOKIE = 'gdg_admin';
const SESSION_HOURS = 12;

export const adminEmails = (env) => String(env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

let jwksCache = { keys: null, until: 0 };
async function googleKeys() {
  if (jwksCache.keys && Date.now() < jwksCache.until) return jwksCache.keys;
  const res = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600);
  jwksCache = { keys: (await res.json()).keys, until: Date.now() + maxAge * 1000 };
  return jwksCache.keys;
}

// Verifies a Google ID token (RS256) and returns its claims, or throws.
export async function verifyGoogleToken(token, clientId, { keys, now = Date.now() } = {}) {
  const [h, p, s] = String(token || '').split('.');
  if (!h || !p || !s) throw new Error('Malformed token');
  const header = JSON.parse(new TextDecoder().decode(fromB64url(h)));
  const claims = JSON.parse(new TextDecoder().decode(fromB64url(p)));
  const jwk = (keys || await googleKeys()).find(k => k.kid === header.kid);
  if (!jwk || header.alg !== 'RS256') throw new Error('Unknown signing key');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, fromB64url(s), enc.encode(`${h}.${p}`));
  if (!ok) throw new Error('Bad signature');
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss)) throw new Error('Wrong issuer');
  if (claims.aud !== clientId) throw new Error('Wrong audience');
  if (claims.exp * 1000 < now) throw new Error('Token expired');
  if (!claims.email_verified) throw new Error('Email not verified');
  return claims;
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

export async function createSession(secret, email, now = Date.now()) {
  const payload = b64url(enc.encode(JSON.stringify({ email, exp: now + SESSION_HOURS * 36e5 })));
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function readSession(secret, value, now = Date.now()) {
  const [payload, sig] = String(value || '').split('.');
  if (!payload || !sig || !secret) return null;
  const expected = await hmac(secret, payload);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff) return null;
  const data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
  return data.exp > now ? data : null;
}

export const getCookie = (request, name) => {
  const m = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(request.headers.get('cookie') || '');
  return m ? m[1] : null;
};

export const sessionCookie = (value, maxAgeSec) =>
  `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;

export const SESSION_MAX_AGE = SESSION_HOURS * 3600;
