// Tests for the server logic that would hurt if it broke: auth, sanitising, dates, exports.
import { describe, it, expect } from 'vitest';
import { slugify, safeUrl, formatDate, todayHarare, esc } from '../functions/_lib/util.js';
import { renderMarkdown } from '../functions/_lib/md.js';
import { verifyGoogleToken, createSession, readSession } from '../functions/_lib/auth.js';
import { buildIcs } from '../functions/api/ics/[slug].js';
import { toCsv } from '../functions/api/admin/export.js';
import { pick } from '../functions/_lib/admin-rows.js';
import { TABLES } from '../functions/_lib/admin-tables.js';

describe('util', () => {
  it('slugifies titles', () => {
    expect(slugify('Flutter for Beginners: Build a Weather App!')).toBe('flutter-for-beginners-build-a-weather-app');
    expect(slugify('  Café   Été ')).toBe('cafe-ete');
    expect(slugify('***')).toBe('item');
  });
  it('only allows http(s) and site-relative URLs', () => {
    expect(safeUrl('https://x.org/a')).toBe('https://x.org/a');
    expect(safeUrl('/media/abc')).toBe('/media/abc');
    expect(safeUrl('javascript:alert(1)')).toBe('');
    expect(safeUrl('//evil.com')).toBe('');
    expect(safeUrl('data:text/html,hi')).toBe('');
  });
  it('formats date-only events without shifting the day', () => {
    expect(formatDate('2026-10-09')).toBe('9 October 2026');
    expect(formatDate('2026-10-20T16:30:00+02:00')).toBe('20 October 2026, 16:30');
  });
  it('computes today in Harare, not UTC', () => {
    // 23:30 UTC on 11 Oct is 01:30 on 12 Oct in Harare (UTC+2)
    expect(todayHarare(new Date('2026-10-11T23:30:00Z'))).toBe('2026-10-12');
  });
  it('escapes HTML', () => expect(esc('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;'));
});

describe('markdown', () => {
  it('escapes raw HTML and drops script links', () => {
    const out = renderMarkdown('<script>alert(1)</script>\n\n[ok](https://a.b) [bad](javascript:alert(1)) ![i](javascript:x)');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
    expect(out).toContain('href="https://a.b"');
    expect(out).not.toMatch(/href="javascript:/i);
    expect(out).not.toMatch(/src="javascript:/i);
  });
});

describe('admin sessions', () => {
  it('round-trips and rejects tampering or expiry', async () => {
    const v = await createSession('secret', 'gdscau2023@gmail.com', 1000);
    expect((await readSession('secret', v, 2000)).email).toBe('gdscau2023@gmail.com');
    expect(await readSession('other-secret', v, 2000)).toBeNull();
    const [p, s] = v.split('.');
    expect(await readSession('secret', `${p}x.${s}`, 2000)).toBeNull();
    expect(await readSession('secret', v, 1000 + 13 * 36e5)).toBeNull();
  });
});

describe('Google ID token verification', async () => {
  const kp = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'k1', alg: 'RS256' };
  const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
  const sign = async (claims, kid = 'k1') => {
    const head = `${b64({ alg: 'RS256', kid })}.${b64(claims)}`;
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(head));
    return `${head}.${Buffer.from(sig).toString('base64url')}`;
  };
  const now = Date.UTC(2026, 9, 12);
  const good = { iss: 'https://accounts.google.com', aud: 'client-1', exp: now / 1000 + 600, email: 'gdscau2023@gmail.com', email_verified: true };

  it('accepts a valid token', async () => {
    expect((await verifyGoogleToken(await sign(good), 'client-1', { keys: [jwk], now })).email).toBe('gdscau2023@gmail.com');
  });
  it('rejects wrong audience, expired, unverified, unknown key and forged signatures', async () => {
    const opts = { keys: [jwk], now };
    await expect(verifyGoogleToken(await sign(good), 'other-client', opts)).rejects.toThrow('audience');
    await expect(verifyGoogleToken(await sign({ ...good, exp: now / 1000 - 1 }), 'client-1', opts)).rejects.toThrow('expired');
    await expect(verifyGoogleToken(await sign({ ...good, email_verified: false }), 'client-1', opts)).rejects.toThrow('verified');
    await expect(verifyGoogleToken(await sign(good, 'nope'), 'client-1', opts)).rejects.toThrow('key');
    const t = await sign(good);
    const forged = `${t.split('.')[0]}.${b64({ ...good, email: 'attacker@gmail.com' })}.${t.split('.')[2]}`;
    await expect(verifyGoogleToken(forged, 'client-1', opts)).rejects.toThrow('signature');
  });
});

describe('calendar export', () => {
  it('writes all-day events for date-only sessions and UTC times for timed ones', () => {
    const allDay = buildIcs({ slug: 'a', title: 'Jam, day 1', starts_at: '2026-10-09', online: 0 }, new Date('2026-10-01T00:00:00Z'));
    expect(allDay).toContain('DTSTART;VALUE=DATE:20261009');
    expect(allDay).toContain('DTEND;VALUE=DATE:20261010');
    expect(allDay).toContain('SUMMARY:Jam\\, day 1');
    const timed = buildIcs({ slug: 'b', title: 'Talk', starts_at: '2026-10-20T16:30:00+02:00' });
    expect(timed).toContain('DTSTART:20261020T143000Z');
    expect(timed).toContain('DTEND:20261020T163000Z');
  });
});

describe('CSV export', () => {
  it('quotes and neutralises spreadsheet formulas', () => {
    const csv = toCsv([{ name: '=HYPERLINK("x")', note: 'a,b', ok: 'plain' }]);
    expect(csv.split('\n')[1]).toBe(`"'=HYPERLINK(""x"")","a,b",plain`);
  });
});

describe('admin column whitelist', () => {
  it('drops unknown columns and normalises types', () => {
    const row = pick(TABLES.events, { title: 'T', online: 'on', sort: '3', hacked: 'x', id: 99, location: '' });
    expect(row).toEqual({ title: 'T', online: 1, location: null });
    expect(pick(TABLES.members, { status: 'welcomed', email: 'change@me' })).toEqual({ status: 'welcomed' });
  });
});

import { canMail, canMailPublic } from '../functions/_lib/mail.js';
import { welcomeEmail, applicationAlert, whatsappDigestText } from '../functions/_lib/emails.js';

describe('email', () => {
  it('only mails students once a real domain is the sender', () => {
    expect(canMail({})).toBe(false);
    expect(canMailPublic({ RESEND_API_KEY: 'k' })).toBe(false);
    expect(canMailPublic({ RESEND_API_KEY: 'k', MAIL_FROM: 'GDG AU <onboarding@resend.dev>' })).toBe(false);
    expect(canMailPublic({ RESEND_API_KEY: 'k', MAIL_FROM: 'GDG AU <hello@gdgau.org>' })).toBe(true);
  });
  it('escapes member input in emails', () => {
    const w = welcomeEmail({ name: '<img src=x onerror=alert(1)> Bob' }, []);
    expect(w.html).not.toContain('<img src=x');
    const a = applicationAlert('lead', { name: 'A', email: 'a@b.co', role: 'Lead', details: '<script>x</script>' });
    expect(a.html).toContain('&lt;script&gt;');
  });
  it('builds the WhatsApp post', () => {
    const t = whatsappDigestText([{ title: 'Jam', starts_at: '2026-10-16', location: 'Online', url: 'https://x/events/jam' }]);
    expect(t).toContain('*Jam*');
    expect(t).toContain('https://x/events/jam');
  });
});
