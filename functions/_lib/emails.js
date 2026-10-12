// Email content. Plain inline styles (email clients ignore stylesheets); every value is escaped.
import { esc, formatDate } from './util.js';
import { SITE } from './page.js';

export const WHATSAPP = 'https://chat.whatsapp.com/HMTLxxUu00V3GZ6SEZjxdy';
export const DISCORD = 'https://discord.gg/5gepG5Mj';

const layout = (title, inner) => `<!doctype html><html><body style="margin:0;background:#f5f6f9">
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#16181d;background:#ffffff">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="height:6px;background:#1A73E8"></td><td style="height:6px;background:#EA4335"></td><td style="height:6px;background:#FBBC04"></td><td style="height:6px;background:#34A853"></td>
  </tr></table>
  <h1 style="font-size:28px;line-height:1.15;margin:28px 0 12px">${title}</h1>
  ${inner}
  <p style="color:#5f6368;font-size:13px;margin-top:32px;line-height:1.5">GDG on Campus, Africa University. Mutare, Zimbabwe.<br><a href="${SITE}" style="color:#5f6368">${SITE.replace('https://', '')}</a></p>
</div></body></html>`;

const button = (href, label, bg = '#1A73E8') => `<a href="${esc(href)}" style="display:inline-block;background:${bg};color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:999px;margin:4px 6px 4px 0">${esc(label)}</a>`;
const p = (html) => `<p style="font-size:16px;line-height:1.6;margin:0 0 14px">${html}</p>`;
const eventItems = (events) => events.map(e => `<li style="margin:0 0 12px"><a href="${esc(e.url)}" style="color:#1A73E8;font-weight:bold">${esc(e.title)}</a><br><span style="color:#5f6368">${esc(formatDate(e.starts_at, { weekday: true }))}, ${esc(e.location || (e.online ? 'Online' : 'Africa University'))}</span></li>`).join('');

export function welcomeEmail(member, events) {
  const first = String(member.name || '').trim().split(/\s+/)[0] || 'there';
  return {
    subject: 'Welcome to GDG Africa University',
    html: layout(`Welcome in, ${esc(first)}.`, `
      ${p("You're now part of GDG Africa University. Every session is free, no experience needed, and the slides stay online afterwards.")}
      ${p('<b>Three things to do this week:</b>')}
      <ol style="font-size:16px;line-height:1.6;padding-left:20px;margin:0 0 14px">
        <li>Join the WhatsApp group. Sessions are announced there first.</li>
        <li>Pick a path to try on the <a href="${SITE}/learn" style="color:#1A73E8">learning hub</a>.</li>
        <li>Come to the next session and say hi.</li>
      </ol>
      <p>${button(WHATSAPP, 'Join the WhatsApp group', '#34A853')}${button(DISCORD, 'Discord')}</p>
      ${events.length ? `<h2 style="font-size:20px;margin:28px 0 10px">Coming up</h2><ul style="padding-left:18px;font-size:15px">${eventItems(events)}</ul>` : ''}`),
    text: `Welcome in, ${first}.\n\nJoin the WhatsApp group: ${WHATSAPP}\nLearning hub: ${SITE}/learn\nEvents: ${SITE}/events`,
  };
}

export function memberAlert(m) {
  const rows = [['Email', m.email], ['Year', m.academic_year], ['Department', m.department], ['Interests', m.interests], ['Wants to build', m.motivation]]
    .filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#5f6368;vertical-align:top">${k}</td><td style="padding:4px 0">${esc(v)}</td></tr>`).join('');
  return {
    subject: `New member: ${m.name}`,
    html: layout(`${esc(m.name)} joined`, `<table style="font-size:15px">${rows}</table><p style="margin-top:20px">${button(`${SITE}/admin#inbox`, 'Open the inbox')}</p>`),
    text: `${m.name} <${m.email}> joined.\n${SITE}/admin#inbox`,
  };
}

export function applicationAlert(kind, a, projectTitle) {
  const what = kind === 'lead' ? `wants to be ${a.role}` : `wants to join ${projectTitle || 'a project'}`;
  return {
    subject: `${a.name} ${what}`,
    html: layout(`${esc(a.name)} ${esc(what)}`, `${p(`<a href="mailto:${esc(a.email)}" style="color:#1A73E8">${esc(a.email)}</a>${kind === 'collab' && a.role ? `, can help with ${esc(a.role)}` : ''}`)}
      ${a.details ? `<p style="font-size:15px;line-height:1.6;white-space:pre-line;background:#f1f3f4;padding:14px;border-radius:12px">${esc(a.details)}</p>` : ''}
      <p style="margin-top:20px">${button(`${SITE}/admin#inbox`, 'Open the inbox')}</p>`),
    text: `${a.name} <${a.email}> ${what}.\n\n${a.details || ''}\n\n${SITE}/admin#inbox`,
  };
}

export function whatsappDigestText(events) {
  return ['*This week at GDG Africa University*',
    ...events.map(e => `\n*${e.title}*\n📅 ${formatDate(e.starts_at, { weekday: true })}\n📍 ${e.location || (e.online ? 'Online' : 'Africa University')}\n${e.url}`),
    `\nSlides and all sessions: ${SITE}/events`].join('\n');
}

export function whatsappPostEmail(events) {
  const text = whatsappDigestText(events);
  return {
    subject: `WhatsApp post for this week (${events.length} ${events.length === 1 ? 'event' : 'events'})`,
    html: layout('Post this to the WhatsApp group', `<p>${button(`https://wa.me/?text=${encodeURIComponent(text)}`, 'Open in WhatsApp', '#34A853')}</p>
      <pre style="white-space:pre-wrap;background:#f1f3f4;padding:16px;border-radius:12px;font-size:14px;font-family:Arial,sans-serif">${esc(text)}</pre>`),
    text,
  };
}

export function newsletterEmail(events) {
  return {
    subject: `This week: ${events[0].title}${events.length > 1 ? ` and ${events.length - 1} more` : ''}`,
    html: layout('This week at the club', `<ul style="padding-left:18px;font-size:15px">${eventItems(events)}</ul><p>${button(`${SITE}/events`, 'All sessions and slides')}</p>
      <p style="color:#5f6368;font-size:13px">You subscribed on the GDG Africa University site. Reply "unsubscribe" to stop these emails.</p>`),
    text: events.map(e => `${e.title}, ${formatDate(e.starts_at)}: ${e.url}`).join('\n'),
  };
}
