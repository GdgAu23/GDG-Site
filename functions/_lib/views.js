// HTML fragments rendered on the edge and injected into page templates.
// Tailwind scans this file, so classes here are compiled into css/app.css.
import { esc, safeUrl, formatDate, dateParts } from './util.js';

export const icon = (name, cls = 'w-5 h-5') => `<svg class="${cls} shrink-0" aria-hidden="true"><use href="/img/icons.svg#${name}"></use></svg>`;

export const PATHS = {
  web: { label: 'Web', tone: 'bg-google-blue text-white', icon: 'browser' },
  mobile: { label: 'Mobile', tone: 'bg-google-green text-white', icon: 'device-mobile' },
  game: { label: 'Game dev', tone: 'bg-google-red text-white', icon: 'game-controller' },
  ai: { label: 'AI and ML', tone: 'bg-google-yellow text-[#202124]', icon: 'brain' },
  cloud: { label: 'Cloud', tone: 'bg-google-blue text-white', icon: 'cloud-arrow-up' },
  design: { label: 'UI/UX', tone: 'bg-google-red text-white', icon: 'pen-nib' },
  data: { label: 'Data', tone: 'bg-google-green text-white', icon: 'chart-line-up' },
  security: { label: 'Security', tone: 'bg-brandTextPrimary text-brandBgPrimary', icon: 'shield-check' },
};
const KIND = { workshop: 'Workshop', 'study-jam': 'Study jam', talk: 'Talk', hackathon: 'Hackathon', community: 'Community' };
const FILLS = ['bg-google-blue text-white', 'bg-google-red text-white', 'bg-google-yellow text-[#202124]', 'bg-google-green text-white'];
const TEXTS = ['text-google-blue', 'text-google-red', 'text-google-green'];
const MATERIAL_ICON = { slides: 'presentation-chart', code: 'code', recording: 'video', doc: 'file-text', link: 'link' };

const pill = (text, cls = 'border border-brandBorder text-brandTextSecondary') => `<span class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cls}">${text}</span>`;
const initials = (name) => esc(String(name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase());

export function avatar(person, cls = 'w-12 h-12 text-base', i = 0) {
  const img = safeUrl(person.image);
  return img
    ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async" class="${cls} rounded-full object-cover bg-brandBgSecondary">`
    : `<span class="${cls} rounded-full grid place-items-center font-display font-bold ${FILLS[i % 4]}" aria-hidden="true">${initials(person.name)}</span>`;
}

export function eventMeta(ev) {
  const parts = [pill(KIND[ev.kind] || 'Event')];
  if (ev.path && PATHS[ev.path]) parts.push(pill(PATHS[ev.path].label, PATHS[ev.path].tone));
  parts.push(pill(`${icon(ev.online ? 'video-camera' : 'map-pin', 'w-3.5 h-3.5')}${esc(ev.location || (ev.online ? 'Online' : 'Africa University'))}`));
  if (ev.status === 'cancelled') parts.push(pill('Cancelled', 'bg-google-red text-white'));
  return parts.join('');
}

// Date-led row used on /events and the homepage.
export function eventRow(ev, i = 0, { past = false } = {}) {
  const d = dateParts(ev.starts_at);
  const n = Number(ev.material_count || 0);
  return `
  <article class="event-row group relative grid grid-cols-[64px_1fr] sm:grid-cols-[96px_1fr_auto] gap-x-4 sm:gap-x-8 gap-y-3 py-6 md:py-8 border-b border-brandBorder" data-path="${esc(ev.path || 'general')}">
    <div class="leading-none">
      <p class="font-mono text-xs text-brandTextSecondary uppercase">${esc(d.month)}</p>
      <p class="font-display font-extrabold text-4xl sm:text-6xl ${past ? 'text-brandTextSecondary' : TEXTS[i % 3]}">${esc(d.day)}</p>
      <p class="font-mono text-xs text-brandTextSecondary mt-1">${esc(d.weekday)}${d.time ? ` ${esc(d.time)}` : ''}</p>
    </div>
    <div class="min-w-0">
      <div class="flex flex-wrap gap-1.5">${eventMeta(ev)}</div>
      <h3 class="font-display font-bold text-xl sm:text-2xl md:text-3xl mt-3 leading-tight"><a href="/events/${esc(ev.slug)}" class="after:absolute after:inset-0 hover:text-google-blue">${esc(ev.title)}</a></h3>
      ${ev.summary ? `<p class="text-brandTextSecondary mt-2 leading-relaxed max-w-[62ch]">${esc(ev.summary)}</p>` : ''}
      ${past && n ? `<p class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-google-blue">${icon('folder-open', 'w-4 h-4')}${n} ${n === 1 ? 'material' : 'materials'} shared</p>` : ''}
    </div>
    <span class="hidden sm:grid self-center w-12 h-12 place-items-center rounded-full border border-brandBorder group-hover:bg-brandTextPrimary group-hover:text-brandBgPrimary group-hover:border-brandTextPrimary transition-colors">${icon('arrow-right', 'w-5 h-5')}</span>
  </article>`;
}

export function materialsList(materials) {
  if (!materials.length) return '';
  return `<ul class="grid grid-cols-1 gap-2 sm:grid-cols-2">${materials.map(m => {
    const url = safeUrl(m.url);
    const slides = /docs\.google\.com\/presentation\/d\/([\w-]+)/.exec(url);
    return `<li class="min-w-0 rounded-2xl border border-brandBorder bg-brandBgTertiary">
      <a href="${esc(url)}" target="_blank" rel="noopener" class="flex items-center gap-3 p-4 min-w-0 hover:text-google-blue">
        <span class="w-10 h-10 rounded-xl bg-brandBgSecondary grid place-items-center">${icon(MATERIAL_ICON[m.kind] || 'link', 'w-5 h-5')}</span>
        <span class="min-w-0 flex-1"><span class="block font-semibold truncate">${esc(m.label)}</span><span class="block text-xs text-brandTextSecondary truncate">${esc(url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60))}</span></span>
        ${icon('arrow-up-right', 'w-4 h-4')}
      </a>
      ${slides ? `<button type="button" data-embed="https://docs.google.com/presentation/d/${esc(slides[1])}/embed" class="w-full text-left px-4 pb-3 text-sm font-semibold text-google-blue">View slides here</button>` : ''}
    </li>`;
  }).join('')}</ul>`;
}

export function projectCard(p, i = 0) {
  const img = safeUrl(p.image);
  const tags = String(p.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const media = img
    ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async" class="w-full h-full object-cover">`
    : `<div class="w-full h-full grid place-items-center ${FILLS[i % 4]}"><span class="font-display font-extrabold text-5xl">${initials(p.title)}</span></div>`;
  return `
  <article class="project-card group card-hover relative rounded-3xl border border-brandBorder bg-brandBgTertiary overflow-hidden flex flex-col" data-help="${p.needs_help ? 1 : 0}">
    <div class="img-zoom aspect-[16/10] relative">${media}
      ${p.is_startup ? `<span class="absolute top-3 left-3 bg-brandBgTertiary text-brandTextPrimary text-xs font-semibold px-2.5 py-1 rounded-full">Student startup</span>` : ''}
    </div>
    <div class="p-5 sm:p-6 flex flex-col flex-1">
      ${tags.length ? `<p class="font-mono text-xs text-brandTextSecondary">${tags.map(esc).join(' / ')}</p>` : ''}
      <h3 class="font-display font-bold text-2xl mt-2 leading-tight"><a href="/projects/${esc(p.slug)}" class="after:absolute after:inset-0 hover:text-google-blue">${esc(p.title)}</a></h3>
      ${p.summary ? `<p class="text-brandTextSecondary leading-relaxed mt-2 line-clamp-3">${esc(p.summary)}</p>` : ''}
      ${p.needs_help ? `<p class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">${icon('users-three', 'w-4 h-4 text-google-green')}Looking for teammates</p>` : ''}
    </div>
  </article>`;
}

export function personCard(p, i = 0) {
  const img = safeUrl(p.image);
  return `
  <a href="/people/${esc(p.slug)}" class="group block">
    <div class="img-zoom aspect-[4/5] rounded-3xl overflow-hidden ${img ? 'bg-brandBgSecondary' : FILLS[i % 4]}">
      ${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async" class="w-full h-full object-cover">` : `<div class="w-full h-full grid place-items-center font-display font-extrabold text-6xl">${initials(p.name)}</div>`}
    </div>
    <h3 class="font-display font-bold text-xl mt-4 leading-tight group-hover:text-google-blue">${esc(p.name)}</h3>
    <p class="text-sm text-brandTextSecondary mt-1">${esc(p.core_role || p.headline || '')}</p>
  </a>`;
}

export function postCard(post, i = 0) {
  const img = safeUrl(post.cover);
  return `
  <article class="group relative flex flex-col">
    ${img ? `<div class="img-zoom aspect-[16/9] rounded-3xl overflow-hidden bg-brandBgSecondary"><img src="${esc(img)}" alt="" loading="lazy" decoding="async" class="w-full h-full object-cover"></div>`
      : `<div class="aspect-[16/9] rounded-3xl ${FILLS[i % 4]} p-6 flex items-end"><span class="font-display font-extrabold text-2xl leading-tight line-clamp-3">${esc(post.title)}</span></div>`}
    <p class="font-mono text-xs text-brandTextSecondary mt-4">${esc(formatDate(post.published_at))}${post.author_name ? ` / ${esc(post.author_name)}` : ''}</p>
    <h3 class="font-display font-bold text-xl mt-1 leading-snug"><a href="/blog/${esc(post.slug)}" class="after:absolute after:inset-0 group-hover:text-google-blue">${esc(post.title)}</a></h3>
    ${post.excerpt ? `<p class="text-brandTextSecondary mt-2 leading-relaxed line-clamp-3">${esc(post.excerpt)}</p>` : ''}
  </article>`;
}

// External article from the tech feed. Text-only on purpose: no third-party images on slow networks.
export function feedCard(a) {
  return `
  <article class="feed-card group relative rounded-3xl border border-brandBorder bg-brandBgTertiary p-5 sm:p-6 flex flex-col card-hover" data-path="${esc(a.path)}">
    <p class="font-mono text-xs text-brandTextSecondary flex flex-wrap gap-x-2"><span>${esc(a.source)}</span><span>${esc(a.readingTime ? `${a.readingTime} min read` : '')}</span></p>
    <h3 class="font-display font-bold text-lg sm:text-xl mt-2 leading-snug"><a href="${esc(a.url)}" target="_blank" rel="noopener" class="after:absolute after:inset-0 group-hover:text-google-blue">${esc(a.title)}</a></h3>
    ${a.description ? `<p class="text-sm text-brandTextSecondary mt-2 leading-relaxed line-clamp-3">${esc(a.description)}</p>` : ''}
    <p class="mt-auto pt-4 text-xs text-brandTextSecondary flex items-center gap-1.5">${esc(a.author || '')}${icon('arrow-up-right', 'w-3.5 h-3.5 ml-auto')}</p>
  </article>`;
}

export const resourceCard = (r) => `
  <a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener" class="group card-hover rounded-3xl border border-brandBorder bg-brandBgTertiary p-5 flex gap-4 items-start">
    <span class="w-11 h-11 shrink-0 rounded-2xl bg-google-blue text-white grid place-items-center">${icon('gift', 'w-5 h-5')}</span>
    <span class="min-w-0">
      <span class="font-display font-bold text-lg flex items-center gap-1.5 group-hover:text-google-blue">${esc(r.title)} ${icon('arrow-up-right', 'w-4 h-4')}</span>
      ${r.badge ? `<span class="block font-mono text-xs text-google-green mt-0.5">${esc(r.badge)}</span>` : ''}
      <span class="block text-sm text-brandTextSecondary mt-1.5 leading-relaxed">${esc(r.description)}</span>
    </span>
  </a>`;

export const empty = (title, body, action = '') => `
  <div class="rounded-3xl border border-dashed border-brandBorder p-8 col-span-full">
    <p class="font-display font-bold text-2xl">${title}</p>
    <p class="text-brandTextSecondary mt-2 max-w-[52ch] leading-relaxed">${body}</p>${action}
  </div>`;

export const peopleList = (people) => people.length ? `<ul class="grid gap-3 sm:grid-cols-2">${people.map((p, i) => `
  <li><a href="/people/${esc(p.slug)}" class="flex items-center gap-3 rounded-2xl border border-brandBorder bg-brandBgTertiary p-3 hover:border-brandTextPrimary">
    ${avatar(p, 'w-12 h-12 text-base', i)}
    <span class="min-w-0"><span class="block font-semibold truncate">${esc(p.name)}</span><span class="block text-sm text-brandTextSecondary truncate">${esc(p.role || p.core_role || p.headline || '')}</span></span>
  </a></li>`).join('')}</ul>` : '';
