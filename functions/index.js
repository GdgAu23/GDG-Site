// Homepage: static index.html with upcoming events, projects, team, spotlight and writing injected.
import { renderPage } from './_lib/page.js';
import { upcomingEvents, projects, coreTeam, spotlight, posts } from './_lib/db.js';
import { techFeed } from './_lib/feed.js';
import { eventRow, projectCard, personCard, postCard, feedCard, empty, icon } from './_lib/views.js';
import { esc, safeUrl } from './_lib/util.js';

export async function onRequestGet(ctx) {
  const db = ctx.env.DB;
  const [events, projectList, team, star, postList] = await Promise.all([
    upcomingEvents(db, 4), projects(db, 5), coreTeam(db), spotlight(db), posts(db, 3),
  ]);
  // Always something to read: club posts first, topped up from the tech feed
  const feed = postList.length < 3 ? await techFeed(ctx, { limit: 3 - postList.length }) : [];

  return renderPage(ctx, {
    slots: {
      upcoming: events.length ? events.map((e, i) => eventRow(e, i)).join('')
        : empty('Nothing on the calendar this week.', 'New sessions land in the WhatsApp group first. Past sessions and their slides are on the events page.',
          `<a href="/events" class="mt-4 inline-flex items-center gap-2 font-semibold text-google-blue">See past sessions ${icon('arrow-right', 'w-4 h-4')}</a>`),
      projects: projectList.map(projectCard).join('') + buildCard(),
      team: team.length ? team.map(personCard).join('') : `<p class="col-span-full text-brandTextSecondary">The core team for this year is being announced soon.</p>`,
      writing: postList.map(postCard).join('') + feed.map(feedCard).join(''),
      spotlight: star ? spotlightHtml(star) : '',
    },
    remove: star ? [] : ['#spotlight'],
  });
}

const buildCard = () => `
  <div class="rounded-3xl bg-brandTextPrimary text-brandBgPrimary p-7 sm:p-8 flex flex-col justify-between min-h-[260px]">
    <p class="font-display font-extrabold text-3xl leading-[0.95]">Got an idea? Build it with us.</p>
    <div>
      <p class="opacity-75 mb-5">Pitch it at any session and we'll help you find a team.</p>
      <button data-open-modal="join" class="btn-press bg-google-blue text-white px-6 py-3 rounded-full font-semibold hover:bg-google-blue-dark">Join the club</button>
    </div>
  </div>`;

// p is a spotlights row joined with the person (see db.spotlights)
function spotlightHtml(p) {
  const img = safeUrl(p.image);
  return `
  <div class="max-w-[1200px] mx-auto px-4 md:px-8 grid md:grid-cols-[0.9fr_1.1fr] gap-10 md:gap-16 items-center">
    <div class="relative">
      <div class="aspect-[4/5] rounded-3xl overflow-hidden bg-google-yellow text-[#202124] grid place-items-center">${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy" class="w-full h-full object-cover">` : `<span class="font-display font-extrabold text-8xl" aria-hidden="true">${esc(p.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span>`}</div>
      <span class="absolute -top-4 right-2 md:-right-6 rotate-6 bg-google-yellow text-[#202124] font-display font-extrabold text-lg px-5 py-2.5 rounded-full">Spotlight</span>
    </div>
    <div>
      <p class="font-mono text-sm text-google-blue">${esc(p.title)}${p.event_title ? ` / <a href="/events/${esc(p.event_slug)}" class="underline underline-offset-4">${esc(p.event_title)}</a>` : ''}</p>
      <h2 class="mt-3 font-display font-extrabold text-5xl md:text-7xl leading-[0.92]">${esc(p.name)}</h2>
      <p class="mt-3 font-mono text-sm text-brandTextSecondary">${esc(p.headline || p.core_role || '')}</p>
      ${p.quote ? `<blockquote class="mt-8 font-display text-2xl md:text-3xl leading-snug font-medium max-w-[26ch]">“${esc(p.quote)}”</blockquote>` : ''}
      <div class="mt-8 flex flex-wrap gap-3">
        <a href="/people/${esc(p.slug)}" class="btn-press inline-flex items-center gap-2 border border-brandTextPrimary rounded-full px-6 py-3 font-semibold hover:bg-brandTextPrimary hover:text-brandBgPrimary">See their work ${icon('arrow-right', 'w-4 h-4')}</a>
        <a href="/people#spotlights" class="btn-press inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-brandTextSecondary hover:text-brandTextPrimary">Past spotlights</a>
      </div>
    </div>
  </div>`;
}
