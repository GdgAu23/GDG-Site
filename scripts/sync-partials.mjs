// Stamps partials/{head,nav,footer}.html into every public page between
// <!-- name:start --> / <!-- name:end --> markers. Run after editing a partial:
//   node scripts/sync-partials.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const PAGES = ['index', 'events', 'projects', 'project', 'plan', 'resources', 'blog', '404'];
const parts = Object.fromEntries(['head', 'nav', 'footer'].map(n => [n, readFileSync(`partials/${n}.html`, 'utf8').trimEnd()]));

for (const page of PAGES) {
  const file = `${page}.html`;
  let html;
  try { html = readFileSync(file, 'utf8'); } catch { continue; }
  for (const [name, body] of Object.entries(parts)) {
    let out = body;
    // Mark the current page's nav link
    if (name === 'nav' && page !== 'index') out = out.replaceAll(`href="${page}.html" class="nav-link`, `href="${page}.html" aria-current="page" class="nav-link`);
    const re = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`);
    if (!re.test(html)) { console.warn(`${file}: no ${name} markers`); continue; }
    html = html.replace(re, () => `<!-- ${name}:start -->\n${out}\n    <!-- ${name}:end -->`);
  }
  writeFileSync(file, html);
  console.log('synced', file);
}
