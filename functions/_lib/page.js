// Injects server-rendered fragments and SEO meta into a static HTML template.
// Templates mark slots with data-slot="name"; slot values are trusted HTML built in views.js.
import { esc } from './util.js';

export const SITE = 'https://gdg-africa-university.pages.dev';

export async function renderPage(ctx, { template, slots = {}, remove = [], meta = {}, status = 200 }) {
  const { request, env } = ctx;
  const res = template ? await env.ASSETS.fetch(new URL(template, request.url)) : await ctx.next();
  const url = new URL(request.url);
  const canonical = meta.canonical || `${SITE}${url.pathname}`;

  let rw = new HTMLRewriter();
  for (const [name, html] of Object.entries(slots)) {
    rw = rw.on(`[data-slot="${name}"]`, { element(el) { el.setInnerContent(html ?? '', { html: true }); } });
  }
  for (const sel of remove) rw = rw.on(sel, { element(el) { el.remove(); } });

  if (meta.title) {
    const full = `${meta.title} | GDG Africa University`;
    rw = rw.on('title', { element(el) { el.setInnerContent(full); } })
      .on('meta[property="og:title"]', { element(el) { el.setAttribute('content', full); } });
  }
  if (meta.description) {
    for (const sel of ['meta[name="description"]', 'meta[property="og:description"]']) {
      rw = rw.on(sel, { element(el) { el.setAttribute('content', meta.description); } });
    }
  }
  if (meta.image) rw = rw.on('meta[property="og:image"]', { element(el) { el.setAttribute('content', meta.image.startsWith('http') ? meta.image : SITE + meta.image); } });
  if (meta.type) rw = rw.on('meta[property="og:type"]', { element(el) { el.setAttribute('content', meta.type); } });
  rw = rw.on('link[rel="canonical"]', { element(el) { el.setAttribute('href', canonical); } })
    .on('meta[property="og:url"]', { element(el) { el.setAttribute('content', canonical); } });
  if (meta.jsonld) {
    // JSON-LD is data, not HTML: escape "<" so a title can't close the script tag
    const ld = JSON.stringify(meta.jsonld).replace(/</g, '\\u003c');
    rw = rw.on('head', { element(el) { el.append(`<script type="application/ld+json">${ld}</script>`, { html: true }); } });
  }
  if (meta.noindex) rw = rw.on('head', { element(el) { el.append('<meta name="robots" content="noindex">', { html: true }); } });

  const headers = new Headers(res.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=0, must-revalidate');
  return new Response(rw.transform(res).body, { status, headers });
}

export const notFound = (ctx) => renderPage(ctx, { template: '/404', status: 404, meta: { title: 'Page not found', noindex: true } });

export const metaText = (s, max = 160) => {
  const t = String(s || '').replace(/[#*_`>\[\]()]/g, '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}...` : t;
};

export { esc };
