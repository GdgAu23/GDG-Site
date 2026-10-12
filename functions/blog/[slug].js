import { renderPage, notFound, metaText, SITE } from '../_lib/page.js';
import { postBySlug } from '../_lib/db.js';
import { renderMarkdown } from '../_lib/md.js';
import { avatar, icon } from '../_lib/views.js';
import { esc, safeUrl, formatDate } from '../_lib/util.js';

export async function onRequestGet(ctx) {
  const post = await postBySlug(ctx.env.DB, ctx.params.slug);
  if (!post) return notFound(ctx);
  const cover = safeUrl(post.cover);
  const url = `${SITE}/blog/${post.slug}`;

  const main = `
  <article class="max-w-[760px] mx-auto px-4 md:px-8 pt-28 md:pt-40 pb-24">
    <a href="/blog" class="inline-flex items-center gap-2 text-sm font-semibold text-brandTextSecondary hover:text-brandTextPrimary">${icon('arrow-left', 'w-4 h-4')} Blog</a>
    <p class="mt-6 font-mono text-sm text-brandTextSecondary">${esc(formatDate(post.published_at))}</p>
    <h1 class="font-display font-extrabold text-[clamp(2.2rem,6vw,4rem)] leading-[0.95] mt-3">${esc(post.title)}</h1>
    ${post.excerpt ? `<p class="mt-5 text-xl text-brandTextSecondary leading-relaxed">${esc(post.excerpt)}</p>` : ''}
    ${post.author_name ? `<a href="/people/${esc(post.author_slug)}" class="mt-8 inline-flex items-center gap-3 group">${avatar({ name: post.author_name, image: post.author_image }, 'w-11 h-11 text-sm')}<span><span class="block font-semibold group-hover:text-google-blue">${esc(post.author_name)}</span><span class="block text-sm text-brandTextSecondary">${esc(post.author_headline || '')}</span></span></a>` : ''}
    ${cover ? `<div class="mt-10 rounded-3xl overflow-hidden bg-brandBgSecondary aspect-[16/9]"><img src="${esc(cover)}" alt="" class="w-full h-full object-cover"></div>` : ''}
    <div class="prose mt-10 text-[17px]">${renderMarkdown(post.body)}</div>
    <div class="mt-14 pt-8 border-t border-brandBorder flex flex-wrap gap-2">
      <a href="https://wa.me/?text=${encodeURIComponent(`${post.title}\n${url}`)}" target="_blank" rel="noopener" class="btn-press inline-flex items-center gap-2 border border-brandBorder font-semibold px-5 py-3 rounded-full hover:border-brandTextPrimary">${icon('whatsapp-logo', 'w-4 h-4')} Share</a>
      <button type="button" data-copy="${esc(url)}" class="btn-press inline-flex items-center gap-2 border border-brandBorder font-semibold px-5 py-3 rounded-full hover:border-brandTextPrimary">${icon('link', 'w-4 h-4')} <span>Copy link</span></button>
    </div>
  </article>`;

  return renderPage(ctx, {
    template: '/templates/page',
    slots: { main },
    meta: {
      title: post.title,
      description: metaText(post.excerpt || post.body),
      image: cover || undefined,
      type: 'article',
      jsonld: {
        '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.excerpt || undefined,
        datePublished: post.published_at, image: cover ? [cover.startsWith('http') ? cover : SITE + cover] : undefined, url,
        author: post.author_name ? { '@type': 'Person', name: post.author_name, url: `${SITE}/people/${post.author_slug}` } : { '@type': 'Organization', name: 'GDG Africa University' },
        publisher: { '@type': 'Organization', name: 'GDG on Campus Africa University', url: SITE },
      },
    },
  });
}
