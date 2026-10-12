// "From the tech world": top recent DEV.to articles per learning path.
// Cached at the edge for an hour so a page view never waits on DEV.to more than once.
const TAGS = {
  web: 'webdev', mobile: 'android', game: 'gamedev', ai: 'ai', cloud: 'devops',
  design: 'ux', data: 'datascience', security: 'security', career: 'career', beginners: 'beginners',
};
const TTL = 3600;

async function fetchTag(path, tag) {
  const res = await fetch(`https://dev.to/api/articles?tag=${tag}&top=7&per_page=6`, {
    headers: { 'user-agent': 'gdg-africa-university-site (+https://gdg-africa-university.pages.dev)', accept: 'application/json' },
  });
  if (!res.ok) return [];
  const list = await res.json();
  return list.map(a => ({
    title: a.title,
    url: a.url,
    description: a.description,
    author: a.user?.name,
    readingTime: a.reading_time_minutes,
    publishedAt: a.published_at,
    reactions: a.positive_reactions_count || 0,
    source: 'DEV Community',
    path,
  }));
}

export async function techFeed(ctx, { limit = 24 } = {}) {
  const cache = caches.default;
  const key = new Request('https://cache.internal/tech-feed-v1');
  const hit = await cache.match(key);
  if (hit) return (await hit.json()).slice(0, limit);

  const groups = await Promise.all(Object.entries(TAGS).map(([path, tag]) => fetchTag(path, tag).catch(() => [])));
  // Interleave paths so no single topic floods the page, then dedupe by URL
  const seen = new Set();
  const merged = [];
  for (let i = 0; i < 6; i++) for (const g of groups) {
    const a = g[i];
    if (a && !seen.has(a.url)) { seen.add(a.url); merged.push(a); }
  }
  if (merged.length) {
    ctx.waitUntil(cache.put(key, new Response(JSON.stringify(merged), { headers: { 'cache-control': `public, max-age=${TTL}` } })));
  }
  return merged.slice(0, limit);
}
