// site.js: UI behaviour for every public page. Content is rendered on the server
// (functions/), so this file only handles interaction. No dependencies.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Theme: explicit choice stored per visitor, otherwise follow the OS ──
function initTheme() {
  const root = document.documentElement;
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const label = () => $$('[data-theme-toggle]').forEach(b => b.setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode'));
  label();
  $$('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch { /* private mode */ }
    label();
    document.dispatchEvent(new CustomEvent('themechange'));
  }));
}

// ── Nav: current page, background once scrolled, full-screen menu ──
function initNav() {
  const path = location.pathname.replace(/\.html$/, '');
  $$('[data-nav]').forEach(a => {
    const href = a.getAttribute('href');
    if (path === href || path.startsWith(`${href}/`)) a.setAttribute('aria-current', 'page');
  });

  const nav = $('#main-nav');
  const btn = $('#menu-btn');
  const overlay = $('#menu-overlay');
  const setMenu = (open) => {
    overlay?.classList.toggle('open', open);
    btn?.setAttribute('aria-expanded', open);
    btn?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    $('.hamburger-icon', btn)?.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('a', overlay)?.focus({ preventScroll: true });
  };
  btn?.addEventListener('click', () => setMenu(!overlay.classList.contains('open')));
  overlay?.addEventListener('click', (e) => { if (e.target.closest('a, button')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay?.classList.contains('open')) { setMenu(false); btn.focus(); } });
  matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });

  // Sentinel instead of a scroll listener: nav gets its background after ~10px of scroll
  const top = $('#back-to-top');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;height:600px;width:1px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([en]) => {
    nav?.classList.toggle('scrolled', en.intersectionRect.height < 590);
    top?.classList.toggle('opacity-0', en.isIntersecting);
    top?.classList.toggle('invisible', en.isIntersecting);
  }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }).observe(sentinel);
  top?.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
}

// ── Modals ──
let lastFocus = null;
function openModal(id, data = {}) {
  const m = document.getElementById(`${id}-modal`);
  if (!m) return;
  lastFocus = document.activeElement;
  if (id === 'collab') {
    $('input[name="project_id"]', m).value = data.projectId || '';
    $('[data-collab-desc]', m).textContent = `Lend your skills to ${data.projectTitle || 'this team'} and help build something real.`;
  }
  m.hidden = false;
  requestAnimationFrame(() => m.classList.add('active'));
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('input:not([type=hidden]):not([name=website]), select, textarea', m)?.focus({ preventScroll: true }), 80);
}
function closeModal(m) {
  if (!m) return;
  m.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(() => { m.hidden = true; }, 300);
  lastFocus?.focus?.({ preventScroll: true });
}
function initModals() {
  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open-modal]');
    if (open) { e.preventDefault(); openModal(open.dataset.openModal, open.dataset); return; }
    if (e.target.closest('[data-close-modal]') || e.target.classList.contains('modal-overlay')) closeModal(e.target.closest('.modal-overlay'));
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.modal-overlay.active').forEach(closeModal); });
  if (location.hash === '#join') openModal('join');
  $('[data-reveal="apply"]')?.addEventListener('click', () => {
    const s = $('#apply');
    s.hidden = false;
    s.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  if (location.hash === '#apply' && $('#apply')) $('#apply').hidden = false;
}

// ── Forms: every [data-form] posts JSON to /api/<name>. Send -> Sending -> Sent ──
const ENDPOINT = { join: '/api/join', apply: '/api/apply', collab: '/api/apply', subscribe: '/api/subscribe' };
const SUCCESS = {
  join: "Welcome in. Join the WhatsApp group for session updates.",
  apply: "Application received. We'll reply by email.",
  collab: 'Sent. The team lead will be in touch.',
  subscribe: "You're subscribed. See you on Monday.",
};
function initForms() {
  $$('form[data-form]').forEach(form => form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const kind = form.dataset.form;
    const btn = $('button[type=submit]', form);
    const status = $('[data-form-status]', form) || $('[data-form-status]', form.parentElement);
    const say = (msg, ok) => {
      status.textContent = msg;
      status.classList.toggle('text-google-green', ok);
      status.classList.toggle('text-google-red', !ok);
    };

    const invalid = $$('[required]', form).find(el => !el.value.trim() || (el.type === 'email' && !el.checkValidity()));
    $$('[aria-invalid]', form).forEach(el => el.removeAttribute('aria-invalid'));
    if (invalid) {
      invalid.setAttribute('aria-invalid', 'true');
      say(invalid.type === 'email' ? 'Please enter a valid email.' : `Please fill in "${$(`label[for="${invalid.id}"]`)?.textContent.trim() || 'this field'}".`, false);
      invalid.focus();
      return;
    }

    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending...';
    status.textContent = '';
    try {
      const res = await fetch(ENDPOINT[kind], { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      form.reset();
      btn.textContent = 'Sent';
      say(data.already && kind === 'join' ? "You're already a member. We've got you." : data.already ? "You're already subscribed." : SUCCESS[kind], true);
      const modal = form.closest('.modal-overlay');
      if (modal) setTimeout(() => closeModal(modal), 2200);
    } catch (err) {
      say(navigator.onLine === false ? "You're offline. Your details are still in the form; try again when you're back." : err.message, false);
    } finally {
      setTimeout(() => { btn.disabled = false; btn.textContent = label; }, 1800);
    }
  }));
}

// ── Filter chips (events and articles by path, projects by "needs help") ──
function initFilters() {
  $$('[data-filter-group]').forEach(group => {
    const name = group.dataset.filterGroup;
    const chips = $$('[data-filter-value]', group);
    const set = (value) => {
      chips.forEach(c => {
        const on = c.dataset.filterValue === value;
        c.setAttribute('aria-pressed', on);
        c.classList.toggle('bg-brandTextPrimary', on);
        c.classList.toggle('text-brandBgPrimary', on);
        c.classList.toggle('border-brandTextPrimary', on);
      });
      $$(`[data-filter-target="${name}"] > [data-path], [data-filter-target="${name}"] > [data-help]`).forEach(item => {
        const show = value === 'all' || (value === 'help' ? item.dataset.help === '1' : item.dataset.path === value);
        item.toggleAttribute('data-filter-hidden', !show);
      });
    };
    chips.forEach(c => c.addEventListener('click', () => set(c.dataset.filterValue)));
    set('all');
  });
}

// ── Search (/people): matches name, roles, events, wins. ?q= links straight to results ──
function initSearch() {
  const input = $('[data-search-input]');
  if (!input) return;
  const items = $$('[data-search]');
  const run = () => {
    const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    items.forEach(el => {
      const hit = words.every(w => el.dataset.search.includes(w));
      el.toggleAttribute('data-filter-hidden', !hit);
      shown += hit;
    });
    // Hide a section whose list has no matches left
    $$('section').forEach(sec => {
      const list = $$('[data-search]', sec);
      if (list.length) sec.toggleAttribute('data-filter-hidden', !list.some(el => !el.hasAttribute('data-filter-hidden')));
    });
    $('[data-search-empty]').hidden = shown > 0 || !items.length;
    const url = new URL(location.href);
    input.value.trim() ? url.searchParams.set('q', input.value.trim()) : url.searchParams.delete('q');
    history.replaceState(null, '', url);
  };
  input.value = new URLSearchParams(location.search).get('q') || '';
  input.addEventListener('input', run);
  if (input.value) run();
}

// ── Small things: copy link, slides viewer, year ──
function initExtras() {
  document.addEventListener('click', async (e) => {
    const copy = e.target.closest('[data-copy]');
    if (copy) {
      const span = $('span', copy) || copy;
      try { await navigator.clipboard.writeText(copy.dataset.copy); span.textContent = 'Copied'; } catch { span.textContent = 'Copy failed'; }
      setTimeout(() => { span.textContent = 'Copy link'; }, 1600);
    }
    // The Google Slides viewer only loads when asked: it's heavy on slow connections
    const embed = e.target.closest('[data-embed]');
    if (embed && /^https:\/\/docs\.google\.com\/presentation\/d\/[\w-]+\/embed$/.test(embed.dataset.embed)) {
      const slot = $('#embed-slot');
      slot.innerHTML = `<div class="aspect-video rounded-2xl overflow-hidden border border-brandBorder bg-brandBgSecondary"><iframe src="${embed.dataset.embed}" title="Slides" class="w-full h-full" allowfullscreen loading="lazy"></iframe></div>`;
      slot.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    }
  });
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
}

function initReveal() {
  const io = new IntersectionObserver((entries) => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('revealed'); io.unobserve(en.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.scroll-reveal').forEach(el => io.observe(el));
}

function initCounters() {
  if (reduceMotion) return;
  const io = new IntersectionObserver((entries) => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target, target = parseInt(el.dataset.count, 10), t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / 1400, 1);
      el.textContent = Math.round(target * (1 - (1 - p) ** 3));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    io.unobserve(el);
  }), { threshold: 0.6 });
  $$('.stat-number[data-count]').forEach(el => io.observe(el));
}

function initPhotoTrack() {
  const track = $('#photo-track');
  if (!track) return;
  const photos = Array.from({ length: 14 }, (_, i) => `/images/club/club-${String(i + 1).padStart(2, '0')}.webp`);
  // Duplicated once for a seamless CSS loop; the copies are hidden from screen readers
  track.innerHTML = [...photos, ...photos].map((src, i) => `<img src="${src}" ${i < photos.length ? 'alt="GDG Africa University members at a club event"' : 'alt="" aria-hidden="true"'} loading="lazy" decoding="async" class="h-56 md:h-80 w-auto rounded-3xl object-cover shrink-0 ${i % 3 === 1 ? 'md:translate-y-6' : ''}">`).join('');
}

initTheme();
initNav();
initModals();
initForms();
initFilters();
initSearch();
initExtras();
initReveal();
initCounters();
initPhotoTrack();
