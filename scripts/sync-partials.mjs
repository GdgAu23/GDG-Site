// Stamps partials/*.html into every page between <!-- name:start --> and <!-- name:end -->.
// Runs as part of `npm run build`; run it alone with `npm run partials` after editing a partial.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const PARTS = ['head', 'nav', 'footer', 'modals'];
const parts = Object.fromEntries(PARTS.map(n => [n, readFileSync(`partials/${n}.html`, 'utf8').trimEnd()]));
const pages = [...readdirSync('.').filter(f => f.endsWith('.html')), ...readdirSync('templates').map(f => `templates/${f}`)]
  .filter(f => !f.endsWith('admin.html'));

for (const file of pages) {
  let html = readFileSync(file, 'utf8');
  for (const [name, body] of Object.entries(parts)) {
    const re = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`);
    if (re.test(html)) html = html.replace(re, () => `<!-- ${name}:start -->\n${body}\n    <!-- ${name}:end -->`);
  }
  writeFileSync(file, html);
}
console.log(`partials stamped into ${pages.length} pages`);
