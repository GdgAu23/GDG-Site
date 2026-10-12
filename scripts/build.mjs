// Production build -> dist/ (what Cloudflare Pages serves).
//   1. stamp shared partials into every page
//   2. compile + minify Tailwind into css/app.css
//   3. build an SVG sprite with only the Phosphor icons the code references
//   4. copy public files (whitelist: the repo root also holds .env, migrations, tests)
import { cpSync, rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const OUT = 'dist';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/css`, { recursive: true });
mkdirSync(`${OUT}/img`, { recursive: true });

execFileSync('node', ['scripts/sync-partials.mjs'], { stdio: 'inherit' });
execFileSync('npx', ['tailwindcss', '-i', 'css/app.css', '-o', `${OUT}/css/app.css`, '--minify'], { stdio: 'inherit' });

// ── Icon sprite ──
const walk = (dir) => readdirSync(dir).flatMap(f => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const sources = [...readdirSync('.').filter(f => f.endsWith('.html')), ...walk('templates'), ...walk('partials'), ...walk('js'), ...walk('functions')]
  .filter(f => /\.(html|js)$/.test(f));
// Icons chosen at runtime (lookup tables) can't be found by the scan, so list them here.
const DYNAMIC = ['browser', 'device-mobile', 'game-controller', 'brain', 'cloud-arrow-up', 'pen-nib', 'chart-line-up', 'shield-check',
  'presentation-chart', 'code', 'video', 'file-text', 'link', 'github-logo', 'linkedin-logo', 'globe', 'sun', 'moon', 'check', 'warning'];
const ICONS = 'node_modules/@phosphor-icons/core/assets/regular';
const names = new Set(DYNAMIC);
for (const f of sources) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/icons\.svg#([a-z0-9-]+)/g)) names.add(m[1]);
  // Any quoted kebab-case name on a line that calls icon(...) (covers ternaries)
  for (const line of src.split('\n').filter(l => l.includes('icon('))) {
    for (const m of line.matchAll(/'([a-z0-9]+(?:-[a-z0-9]+)*)'/g)) if (existsSync(`${ICONS}/${m[1]}.svg`)) names.add(m[1]);
  }
}
const symbols = [...names].sort().map(n => {
  const file = `${ICONS}/${n}.svg`;
  if (!existsSync(file)) throw new Error(`Unknown Phosphor icon "${n}" (see https://phosphoricons.com)`);
  const inner = readFileSync(file, 'utf8').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/ fill="currentColor"/g, '');
  return `<symbol id="${n}" viewBox="0 0 256 256">${inner}</symbol>`;
});
writeFileSync(`${OUT}/img/icons.svg`, `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>`);

// ── Copy public files ──
for (const f of readdirSync('.').filter(f => f.endsWith('.html'))) cpSync(f, `${OUT}/${f}`);
for (const f of ['manifest.json', 'robots.txt', '_headers', '_redirects']) if (existsSync(f)) cpSync(f, `${OUT}/${f}`);
for (const dir of ['js', 'templates']) cpSync(dir, `${OUT}/${dir}`, { recursive: true });
cpSync('images', `${OUT}/images`, { recursive: true, filter: src => !/\.JPG$/.test(src) });

const kb = (p) => `${Math.round(statSync(p).size / 1024)}KB`;
console.log(`dist ready. css ${kb(`${OUT}/css/app.css`)}, icons ${names.size} (${kb(`${OUT}/img/icons.svg`)})`);
