// Dynamic sitemap: static pages plus every published event, project, person and post.
import { SITE } from './_lib/page.js';

export async function onRequestGet(ctx) {
  const db = ctx.env.DB;
  const q = (sql) => db.prepare(sql).all().then(r => r.results || []);
  const [events, projects, people, posts] = await Promise.all([
    q(`SELECT slug, updated_at AS m FROM events WHERE status != 'draft'`),
    q(`SELECT slug, created_at AS m FROM projects WHERE status = 'published'`),
    q(`SELECT slug, created_at AS m FROM people`),
    q(`SELECT slug, published_at AS m FROM posts WHERE status = 'published'`),
  ]);
  const urls = [
    ['/', null, '1.0'], ['/events', null, '0.9'], ['/learn', null, '0.9'], ['/projects', null, '0.8'], ['/people', null, '0.6'], ['/blog', null, '0.8'],
    ...events.map(r => [`/events/${r.slug}`, r.m, '0.7']), ...projects.map(r => [`/projects/${r.slug}`, r.m, '0.6']),
    ...people.map(r => [`/people/${r.slug}`, r.m, '0.4']), ...posts.map(r => [`/blog/${r.slug}`, r.m, '0.6']),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([path, m, pr]) =>
    `  <url><loc>${SITE}${encodeURI(path)}</loc>${m ? `<lastmod>${String(m).slice(0, 10)}</lastmod>` : ''}<priority>${pr}</priority></url>`).join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
