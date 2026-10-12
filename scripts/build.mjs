// Copies only public files into dist/ for Cloudflare Pages.
// Whitelist on purpose: the repo root also holds .env, SQL schema and admin scripts.
import { cpSync, rmSync, mkdirSync, readdirSync } from 'node:fs';

const OUT = 'dist';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);

const rootFiles = readdirSync('.').filter(f => f.endsWith('.html'))
  .concat(['manifest.json', 'robots.txt', 'sitemap.xml', '_headers']);
for (const f of rootFiles) cpSync(f, `${OUT}/${f}`);
for (const dir of ['css', 'js']) cpSync(dir, `${OUT}/${dir}`, { recursive: true });
// Raw camera originals (*.JPG) stay out; compressed copies are what the site uses
cpSync('images', `${OUT}/images`, { recursive: true, filter: src => !src.endsWith('.JPG') });

console.log('dist ready:', readdirSync(OUT).join(' '));
