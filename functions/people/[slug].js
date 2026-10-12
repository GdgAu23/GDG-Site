// /people/:slug: a member's story at the club. What they built, spoke at and wrote.
import { renderPage, notFound, metaText, SITE } from '../_lib/page.js';
import { personBySlug } from '../_lib/db.js';
import { PATHS, projectCard, icon } from '../_lib/views.js';
import { esc, safeUrl, formatDate } from '../_lib/util.js';

export async function onRequestGet(ctx) {
  const p = await personBySlug(ctx.env.DB, ctx.params.slug);
  if (!p) return notFound(ctx);
  const img = safeUrl(p.image);
  const links = [['github', 'github-logo', 'GitHub'], ['linkedin', 'linkedin-logo', 'LinkedIn'], ['website', 'globe', 'Website']]
    .filter(([k]) => safeUrl(p[k]))
    .map(([k, ic, label]) => `<a href="${esc(safeUrl(p[k]))}" target="_blank" rel="noopener me" class="btn-press inline-flex items-center gap-2 border border-brandBorder rounded-full px-4 py-2.5 font-semibold hover:border-brandTextPrimary">${icon(ic, 'w-4 h-4')} ${label}</a>`).join('');
  const path = PATHS[p.path];

  // Timeline: everything they took part in, newest first
  const timeline = [
    ...p.events.map(e => ({ date: e.starts_at, html: `<span class="font-mono text-xs text-brandTextSecondary">${esc(e.role)}</span><a href="/events/${esc(e.slug)}" class="block font-display font-bold text-xl hover:text-google-blue">${esc(e.title)}</a>` })),
    ...p.posts.map(po => ({ date: po.published_at, html: `<span class="font-mono text-xs text-brandTextSecondary">Wrote</span><a href="/blog/${esc(po.slug)}" class="block font-display font-bold text-xl hover:text-google-blue">${esc(po.title)}</a>` })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const main = `
  <article class="max-w-[1200px] mx-auto px-4 md:px-8 pt-28 md:pt-40 pb-24">
    <div class="grid md:grid-cols-[280px_1fr] gap-8 md:gap-14 items-end">
      <div class="aspect-[4/5] w-48 md:w-full rounded-3xl overflow-hidden ${img ? 'bg-brandBgSecondary' : 'bg-google-blue text-white grid place-items-center'}">
        ${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" class="w-full h-full object-cover">` : `<span class="font-display font-extrabold text-7xl">${esc(p.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2))}</span>`}
      </div>
      <div>
        ${p.core_role ? `<p class="font-mono text-sm text-google-blue">${esc(p.core_role)}</p>` : ''}
        <h1 class="font-display font-extrabold text-[clamp(2.6rem,8vw,6rem)] leading-[0.9] mt-2">${esc(p.name)}</h1>
        ${p.headline ? `<p class="mt-3 text-lg text-brandTextSecondary">${esc(p.headline)}</p>` : ''}
        ${path ? `<p class="mt-4"><span class="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${path.tone}">${icon(path.icon, 'w-4 h-4')} ${path.label}</span></p>` : ''}
        ${links ? `<div class="mt-6 flex flex-wrap gap-2">${links}</div>` : ''}
      </div>
    </div>
    ${p.bio ? `<p class="mt-12 font-display text-2xl md:text-3xl leading-snug font-medium max-w-[34ch]">${esc(p.bio)}</p>` : ''}
    ${p.projects.length ? `<section class="mt-20"><h2 class="font-display font-bold text-3xl">Built</h2><div class="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">${p.projects.map(projectCard).join('')}</div></section>` : ''}
    ${timeline.length ? `<section class="mt-20"><h2 class="font-display font-bold text-3xl">At the club</h2>
      <ol class="mt-6 border-l-2 border-brandBorder ml-2">${timeline.map(t => `<li class="relative pl-8 pb-8"><span class="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-google-blue"></span><p class="font-mono text-xs text-brandTextSecondary">${esc(formatDate(t.date))}</p>${t.html}</li>`).join('')}</ol></section>` : ''}
    ${!p.projects.length && !timeline.length ? `<p class="mt-16 text-brandTextSecondary">Nothing here yet. Projects, talks and posts show up as they happen.</p>` : ''}
  </article>`;

  return renderPage(ctx, {
    template: '/templates/page',
    slots: { main },
    meta: {
      title: p.name,
      description: metaText(p.bio || `${p.name}${p.core_role ? `, ${p.core_role}` : ''} at GDG Africa University.`),
      image: img || undefined,
      type: 'profile',
      jsonld: {
        '@context': 'https://schema.org', '@type': 'ProfilePage',
        mainEntity: { '@type': 'Person', name: p.name, description: p.bio || undefined, image: img || undefined,
          sameAs: ['github', 'linkedin', 'website'].map(k => safeUrl(p[k])).filter(Boolean),
          memberOf: { '@type': 'Organization', name: 'GDG on Campus Africa University', url: SITE } },
      },
    },
  });
}
