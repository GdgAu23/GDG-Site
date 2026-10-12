// /projects/:slug: the story of a project and the people who built it.
import { renderPage, notFound, metaText, SITE } from '../_lib/page.js';
import { projectBySlug } from '../_lib/db.js';
import { renderMarkdown } from '../_lib/md.js';
import { peopleList, icon } from '../_lib/views.js';
import { esc, safeUrl, formatDate } from '../_lib/util.js';

export async function onRequestGet(ctx) {
  const p = await projectBySlug(ctx.env.DB, ctx.params.slug);
  if (!p) return notFound(ctx);
  const img = safeUrl(p.image);
  const demo = safeUrl(p.demo_url), repo = safeUrl(p.repo_url);
  const tags = String(p.tags || '').split(',').map(t => t.trim()).filter(Boolean);

  const main = `
  <article class="max-w-[1200px] mx-auto px-4 md:px-8 pt-28 md:pt-40 pb-24">
    <a href="/projects" class="inline-flex items-center gap-2 text-sm font-semibold text-brandTextSecondary hover:text-brandTextPrimary">${icon('arrow-left', 'w-4 h-4')} All projects</a>
    ${tags.length ? `<p class="mt-6 font-mono text-sm text-brandTextSecondary">${tags.map(esc).join(' / ')}${p.is_startup ? ' / Student startup' : ''}</p>` : ''}
    <h1 class="font-display font-extrabold text-[clamp(2.4rem,7vw,5.5rem)] leading-[0.92] mt-3 max-w-[16ch]">${esc(p.title)}</h1>
    ${p.summary ? `<p class="mt-5 text-lg md:text-xl text-brandTextSecondary max-w-[60ch] leading-relaxed">${esc(p.summary)}</p>` : ''}
    <div class="mt-8 flex flex-wrap gap-2">
      ${demo ? `<a href="${esc(demo)}" target="_blank" rel="noopener" class="btn-press inline-flex items-center gap-2 bg-google-blue text-white font-semibold px-6 py-3.5 rounded-full hover:bg-google-blue-dark">Visit ${icon('arrow-up-right', 'w-4 h-4')}</a>` : ''}
      ${repo ? `<a href="${esc(repo)}" target="_blank" rel="noopener" class="btn-press inline-flex items-center gap-2 border border-brandBorder font-semibold px-5 py-3.5 rounded-full hover:border-brandTextPrimary">${icon('github-logo', 'w-4 h-4')} Code</a>` : ''}
      ${p.needs_help ? `<button type="button" data-open-modal="collab" data-project-id="${p.id}" data-project-title="${esc(p.title)}" class="btn-press inline-flex items-center gap-2 border border-brandTextPrimary font-semibold px-5 py-3.5 rounded-full hover:bg-brandTextPrimary hover:text-brandBgPrimary">${icon('users-three', 'w-4 h-4')} Join this build</button>` : ''}
    </div>
    ${img ? `<div class="mt-12 rounded-3xl overflow-hidden bg-brandBgSecondary aspect-[16/9]"><img src="${esc(img)}" alt="" class="w-full h-full object-cover"></div>` : ''}
    <div class="mt-14 grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-16">
      <div class="prose max-w-[68ch] min-w-0">${p.story ? renderMarkdown(p.story) : `<p class="text-brandTextSecondary">The team hasn't written up the story yet.</p>`}</div>
      <aside class="space-y-10">
        ${p.needs_help ? `<section class="rounded-3xl bg-google-green/10 border border-google-green/30 p-6"><h2 class="font-display font-bold text-xl">Looking for teammates</h2><p class="mt-2 text-brandTextSecondary leading-relaxed">${esc(p.help_text || 'This team could use more hands.')}</p></section>` : ''}
        ${p.people.length ? `<section><h2 class="font-display font-bold text-2xl mb-4">Built by</h2>${peopleList(p.people)}</section>` : ''}
        ${p.event ? `<section><h2 class="font-display font-bold text-2xl mb-3">Started at</h2><a href="/events/${esc(p.event.slug)}" class="font-semibold text-google-blue">${esc(p.event.title)}</a><p class="text-sm text-brandTextSecondary mt-1">${esc(formatDate(p.event.starts_at))}</p></section>` : ''}
      </aside>
    </div>
  </article>`;

  return renderPage(ctx, {
    template: '/templates/page',
    slots: { main },
    meta: {
      title: p.title,
      description: metaText(p.summary || p.story || `${p.title}, built by GDG Africa University members.`),
      image: img || '/images/club/club-05.webp',
      jsonld: {
        '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.title, description: p.summary || undefined,
        url: `${SITE}/projects/${p.slug}`, creator: p.people.map(x => ({ '@type': 'Person', name: x.name, url: `${SITE}/people/${x.slug}` })),
      },
    },
  });
}
