// /events/:slug: one session with its materials, people, calendar and WhatsApp share.
import { renderPage, notFound, metaText, SITE } from '../_lib/page.js';
import { eventBySlug } from '../_lib/db.js';
import { renderMarkdown } from '../_lib/md.js';
import { eventMeta, materialsList, peopleList, projectCard, icon } from '../_lib/views.js';
import { esc, safeUrl, formatDate, todayHarare } from '../_lib/util.js';

export async function onRequestGet(ctx) {
  const ev = await eventBySlug(ctx.env.DB, ctx.params.slug);
  if (!ev) return notFound(ctx);

  const url = `${SITE}/events/${ev.slug}`;
  const past = String(ev.starts_at).slice(0, 10) < todayHarare();
  const when = formatDate(ev.starts_at, { weekday: true });
  const register = safeUrl(ev.register_url);
  const share = whatsappText(ev, when, url);

  const main = `
  <article class="max-w-[1200px] mx-auto px-4 md:px-8 pt-28 md:pt-40 pb-24">
    <a href="/events" class="inline-flex items-center gap-2 text-sm font-semibold text-brandTextSecondary hover:text-brandTextPrimary">${icon('arrow-left', 'w-4 h-4')} All events</a>
    <div class="mt-6 flex flex-wrap gap-1.5">${eventMeta(ev)}</div>
    <h1 class="font-display font-extrabold text-[clamp(2.2rem,6vw,4.8rem)] leading-[0.95] mt-5 max-w-[20ch]">${esc(ev.title)}</h1>
    <p class="mt-5 text-xl md:text-2xl font-display font-semibold">${esc(when)}${ev.ends_at ? ` to ${esc(formatDate(ev.ends_at, { year: false }))}` : ''}</p>
    ${ev.summary ? `<p class="mt-4 text-lg text-brandTextSecondary max-w-[60ch] leading-relaxed">${esc(ev.summary)}</p>` : ''}

    <div class="mt-8 flex flex-wrap gap-2">
      ${register && !past ? `<a href="${esc(register)}" target="_blank" rel="noopener" class="btn-press inline-flex items-center gap-2 bg-google-blue text-white font-semibold px-6 py-3.5 rounded-full hover:bg-google-blue-dark">Register ${icon('arrow-up-right', 'w-4 h-4')}</a>` : ''}
      ${!past ? `<a href="/api/ics/${esc(ev.slug)}" class="btn-press inline-flex items-center gap-2 border border-brandBorder font-semibold px-5 py-3.5 rounded-full hover:border-brandTextPrimary">${icon('calendar-plus', 'w-4 h-4')} Add to calendar</a>` : ''}
      <a href="https://wa.me/?text=${encodeURIComponent(share)}" target="_blank" rel="noopener" class="btn-press inline-flex items-center gap-2 border border-brandBorder font-semibold px-5 py-3.5 rounded-full hover:border-brandTextPrimary">${icon('whatsapp-logo', 'w-4 h-4')} Share</a>
      <button type="button" data-copy="${esc(url)}" class="btn-press inline-flex items-center gap-2 border border-brandBorder font-semibold px-5 py-3.5 rounded-full hover:border-brandTextPrimary">${icon('link', 'w-4 h-4')} <span>Copy link</span></button>
    </div>

    <div class="mt-14 grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-16">
      <div class="min-w-0">
        <section aria-labelledby="materials-h">
          <h2 id="materials-h" class="font-display font-bold text-3xl">Materials</h2>
          <div class="mt-5">${ev.materials.length ? materialsList(ev.materials)
            : `<p class="text-brandTextSecondary">${past ? 'Nothing was shared for this session yet. Ask in the WhatsApp group.' : 'Slides, code and links are posted here during and after the session.'}</p>`}</div>
          <div id="embed-slot" class="mt-4"></div>
        </section>
        ${ev.body ? `<section class="mt-14 prose max-w-[68ch]">${renderMarkdown(ev.body)}</section>` : ''}
      </div>
      <aside class="space-y-10">
        ${ev.people.length ? `<section><h2 class="font-display font-bold text-2xl mb-4">People</h2>${peopleList(ev.people)}</section>` : ''}
        <section class="rounded-3xl bg-brandBgSecondary p-6">
          <h2 class="font-display font-bold text-xl">New here?</h2>
          <p class="mt-2 text-brandTextSecondary leading-relaxed">Every session is free and open to all Africa University students. No experience needed.</p>
          <button data-open-modal="join" class="btn-press mt-4 bg-google-blue text-white font-semibold px-5 py-3 rounded-full hover:bg-google-blue-dark">Join the club</button>
        </section>
      </aside>
    </div>
    ${ev.projects.length ? `<section class="mt-20"><h2 class="font-display font-bold text-3xl">Built here</h2><div class="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">${ev.projects.map(projectCard).join('')}</div></section>` : ''}
  </article>`;

  return renderPage(ctx, {
    template: '/templates/page',
    slots: { main },
    meta: {
      title: ev.title,
      description: metaText(ev.summary || `${ev.title} at GDG Africa University, ${when}.`),
      image: safeUrl(ev.cover) || '/images/club/club-04.webp',
      type: 'website',
      jsonld: eventJsonLd(ev, url),
    },
  });
}

function whatsappText(ev, when, url) {
  return [`*${ev.title}*`, `📅 ${when}`, `📍 ${ev.location || (ev.online ? 'Online' : 'Africa University')}`, ev.summary ? `\n${ev.summary}` : '', `\nDetails and materials: ${url}`]
    .filter(Boolean).join('\n');
}

function eventJsonLd(ev, url) {
  const mode = ev.online && /africa university/i.test(ev.location || '') ? 'Mixed' : ev.online ? 'Online' : 'Offline';
  const place = { '@type': 'Place', name: ev.location || 'Africa University', address: { '@type': 'PostalAddress', addressLocality: 'Mutare', addressCountry: 'ZW' } };
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    description: ev.summary || undefined,
    startDate: ev.starts_at,
    endDate: ev.ends_at || undefined,
    eventStatus: ev.status === 'cancelled' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: `https://schema.org/${mode}EventAttendanceMode`,
    location: mode === 'Online' ? { '@type': 'VirtualLocation', url: safeUrl(ev.register_url) || url } : place,
    image: [`${SITE}${safeUrl(ev.cover) && !ev.cover.startsWith('http') ? ev.cover : '/images/club/club-04.webp'}`],
    organizer: { '@type': 'Organization', name: 'GDG on Campus Africa University', url: SITE },
    isAccessibleForFree: true,
    url,
  };
}
