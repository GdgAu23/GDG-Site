/**
 * GDG Africa University mailer. Runs inside the club Gmail (gdscau2023@gmail.com) as a
 * Google Apps Script web app, so emails come from the club address at no cost.
 * Setup steps: integrations/apps-script/README.md
 *
 * Script properties (Project Settings > Script properties):
 *   SHARED_SECRET  same value as the site's APPS_SCRIPT_SECRET
 *   SITE_URL       https://gdg-africa-university.pages.dev
 *   ADMIN_EMAIL    where new-member and application alerts go (defaults to this account)
 *
 * Limit: consumer Gmail allows ~100 recipients/day through Apps Script. The weekly digest
 * stops at 90 subscribers per run to stay under it. Past that, move to a sending domain.
 */

const P = PropertiesService.getScriptProperties();
const SITE = () => P.getProperty('SITE_URL') || 'https://gdg-africa-university.pages.dev';
const ADMIN = () => P.getProperty('ADMIN_EMAIL') || Session.getEffectiveUser().getEmail();
const WHATSAPP = 'https://chat.whatsapp.com/HMTLxxUu00V3GZ6SEZjxdy';
const DISCORD = 'https://discord.gg/5gepG5Mj';

// ── Webhook from the site ──
function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return reply({ ok: false, error: 'bad json' }); }
  if (!data.secret || data.secret !== P.getProperty('SHARED_SECRET')) return reply({ ok: false, error: 'forbidden' });

  if (data.type === 'welcome') {
    sendWelcome(data.member, data.events || []);
    MailApp.sendEmail(ADMIN(), `New member: ${data.member.name}`,
      [data.member.name, data.member.email, data.member.academic_year, data.member.department, `Interests: ${data.member.interests || '-'}`, '', data.member.motivation || '', '', `${SITE()}/admin#inbox`].join('\n'));
  } else if (data.type === 'application') {
    const a = data.application;
    MailApp.sendEmail(ADMIN(), `New ${data.kind === 'lead' ? 'lead application' : 'project request'}: ${a.name}`,
      [`${a.name} <${a.email}>`, a.role ? `Role: ${a.role}` : '', '', a.details || '', '', `${SITE()}/admin#inbox`].join('\n'));
  }
  return reply({ ok: true });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ── Emails ──
function fmtDate(iso) {
  const timed = /T\d{2}:\d{2}/.test(iso);
  const d = new Date(timed ? iso : iso + 'T12:00:00Z');
  return Utilities.formatDate(d, timed ? 'Africa/Harare' : 'UTC', timed ? "EEE d MMM, HH:mm" : 'EEE d MMM');
}
const escapeHtml = (s) => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function layout(title, inner) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#16181d">
    <div style="height:6px;background:linear-gradient(90deg,#1A73E8 25%,#EA4335 25% 50%,#FBBC04 50% 75%,#34A853 75%)"></div>
    <h1 style="font-size:28px;line-height:1.1;margin:28px 0 12px">${title}</h1>${inner}
    <p style="color:#5f6368;font-size:13px;margin-top:32px">GDG on Campus, Africa University. Mutare, Zimbabwe.<br><a href="${SITE()}" style="color:#5f6368">${SITE().replace('https://', '')}</a></p></div>`;
}
const button = (href, label, bg) => `<a href="${href}" style="display:inline-block;background:${bg || '#1A73E8'};color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:999px;margin:4px 6px 4px 0">${label}</a>`;
const eventList = (events) => events.map(e => `<li style="margin:0 0 12px"><a href="${e.url}" style="color:#1A73E8;font-weight:bold">${escapeHtml(e.title)}</a><br><span style="color:#5f6368">${fmtDate(e.starts_at)}, ${escapeHtml(e.location || 'Online')}</span></li>`).join('');

function sendWelcome(m, events) {
  const first = escapeHtml(String(m.name || '').split(' ')[0] || 'there');
  const html = layout(`Welcome in, ${first}.`, `
    <p style="font-size:16px;line-height:1.6">You're now part of GDG Africa University. Every session is free, no experience needed, and the slides stay online afterwards.</p>
    <p style="font-size:16px;line-height:1.6"><b>Three things to do this week:</b></p>
    <ol style="font-size:16px;line-height:1.6;padding-left:20px">
      <li>Join the WhatsApp group. Sessions are announced there first.</li>
      <li>Pick a path to try on the <a href="${SITE()}/learn" style="color:#1A73E8">learning hub</a>.</li>
      <li>Come to the next session and say hi.</li>
    </ol>
    <p>${button(WHATSAPP, 'Join the WhatsApp group', '#34A853')}${button(DISCORD, 'Discord')}</p>
    ${events.length ? `<h2 style="font-size:20px;margin:28px 0 10px">Coming up</h2><ul style="padding-left:18px;font-size:15px">${eventList(events)}</ul>` : ''}`);
  MailApp.sendEmail({
    to: m.email, name: 'GDG Africa University', replyTo: ADMIN(),
    subject: 'Welcome to GDG Africa University',
    htmlBody: html,
    body: `Welcome in, ${m.name}. Join the WhatsApp group: ${WHATSAPP}\nLearning hub: ${SITE()}/learn\nEvents: ${SITE()}/events`,
  });
}

// ── Weekly digest: run by a Monday-morning trigger (see installTriggers) ──
function weeklyDigest() {
  const res = UrlFetchApp.fetch(`${SITE()}/api/mail/digest`, { headers: { 'x-gdg-secret': P.getProperty('SHARED_SECRET') }, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error(`Digest fetch failed: ${res.getResponseCode()} ${res.getContentText()}`);
  const { events, subscribers } = JSON.parse(res.getContentText());
  if (!events.length) return;

  // 1. WhatsApp post for the admin: one tap opens WhatsApp with the message ready
  const wa = ['*This week at GDG Africa University*', ...events.map(e => `\n*${e.title}*\n📅 ${fmtDate(e.starts_at)}\n📍 ${e.location || 'Online'}\n${e.url}`), `\nSlides and all sessions: ${SITE()}/events`].join('\n');
  MailApp.sendEmail({
    to: ADMIN(), name: 'GDG AU site',
    subject: `WhatsApp post for this week (${events.length} ${events.length === 1 ? 'event' : 'events'})`,
    htmlBody: layout('Post this to the WhatsApp group', `<p>${button('https://wa.me/?text=' + encodeURIComponent(wa), 'Open in WhatsApp', '#34A853')}</p><pre style="white-space:pre-wrap;background:#f1f3f4;padding:16px;border-radius:12px;font-size:14px">${escapeHtml(wa)}</pre>`),
    body: wa,
  });

  // 2. Subscriber newsletter, BCC in one send (each address still counts toward the daily quota)
  const list = subscribers.slice(0, 90);
  if (!list.length) return;
  MailApp.sendEmail({
    to: ADMIN(), bcc: list.join(','), name: 'GDG Africa University', replyTo: ADMIN(),
    subject: `This week: ${events[0].title}${events.length > 1 ? ` and ${events.length - 1} more` : ''}`,
    htmlBody: layout('This week at the club', `<ul style="padding-left:18px;font-size:15px">${eventList(events)}</ul><p>${button(SITE() + '/events', 'All sessions and slides')}</p>`),
    body: events.map(e => `${e.title} - ${fmtDate(e.starts_at)} - ${e.url}`).join('\n'),
  });
}

// Run once from the editor: schedules weeklyDigest every Monday ~07:00 Harare time.
function installTriggers() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'weeklyDigest').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('weeklyDigest').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).inTimezone('Africa/Harare').create();
}

// Run once from the editor to check the setup: emails a sample welcome to yourself.
function testWelcome() {
  sendWelcome({ name: 'Test Member', email: ADMIN() }, [{ title: 'Sample session', starts_at: '2026-10-20T16:30:00+02:00', location: 'Africa University', url: SITE() + '/events' }]);
}
