/**
 * site.js  –  GDG Africa University | public pages
 *   1. UI: nav, mobile menu, modals, reveals, stat counters, photo strip
 *   2. Supabase-rendered sections: projects, team, events, plan, resources, testimonials, spotlight
 *   3. Forms: membership, lead application, collaborate, newsletter
 * Supabase is imported lazily so the UI still works if the CDN or backend is down.
 */

let supabase = null;

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = (v) => /^https?:\/\//i.test(String(v || '')) ? esc(v) : '';
const ROLE_COLORS = ['bg-google-blue', 'bg-google-red', 'bg-google-yellow', 'bg-google-green'];

// Button state sequence: Send -> Sending -> Sent -> Send
function setBusy(btn, busy, label) {
  if (!btn) return;
  btn.dataset.label ??= btn.textContent.trim();
  btn.disabled = busy;
  btn.textContent = busy ? label : btn.dataset.label;
}
function flashDone(btn, text = 'Sent') {
  if (!btn) return;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = btn.dataset.label; }, 1800);
}

// Every form insert goes through here so a missing/unreachable backend gives a human message
async function insert(table, rows) {
  const offline = { error: { friendly: true, message: "We can't reach the server right now. Please try again in a few minutes." } };
  if (!supabase) return offline;
  const res = await supabase.from(table).insert(rows);
  if (res.error && /fetch|network/i.test(res.error.message || '')) return offline;
  return res;
}

const errorText = (e) => e.friendly ? e.message : 'Something went wrong: ' + e.message;

const skeleton = (cls, n) => Array(n).fill(`<div class="${cls} rounded-3xl bg-brandBgSecondary animate-pulse"></div>`).join('');

// ==========================================
//  PROJECTS
// ==========================================
let projectsCache = [];

async function loadProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  grid.innerHTML = skeleton('h-[380px]', 3);

  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    projectsCache = [];
    grid.innerHTML = emptyState('ph-code', 'First projects are in the oven', 'Members are building now. Have an idea of your own? Bring it to the club.') + buildWithUsCard();
    return;
  }
  projectsCache = data;
  renderProjectCards('all');
  wireProjectFilters();
}

function emptyState(icon, title, body) {
  return `
    <div class="rounded-3xl border border-dashed border-brandBorder p-8 flex flex-col justify-center min-h-[260px]">
      <i class="ph ${icon} text-3xl text-brandTextSecondary"></i>
      <h3 class="font-display font-bold text-2xl mt-5">${title}</h3>
      <p class="mt-2 text-brandTextSecondary leading-relaxed max-w-[40ch]">${body}</p>
    </div>`;
}

function projectCardHtml(project, i) {
  const tags = project.tags ? project.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const img = url(project.image);
  const media = img
    ? `<img src="${img}" alt="${esc(project.title)}" loading="lazy" class="w-full h-full object-cover">`
    : `<div class="w-full h-full ${ROLE_COLORS[i % 4]} grid place-items-center"><span class="font-display font-extrabold text-6xl ${i % 4 === 2 ? 'text-[#202124]' : 'text-white'} opacity-90">${esc((project.title || '?').slice(0, 2))}</span></div>`;
  const desc = String(project.description || '');
  const helpHtml = project.needs_help
    ? `<div class="mt-4 rounded-xl bg-google-yellow/15 border border-google-yellow/40 p-3">
        <p class="text-xs font-bold">Collaborators Needed</p>
        <p class="text-xs text-brandTextSecondary mt-1 leading-relaxed">${esc(project.help_description || 'This project is looking for teammates to join the build.')}</p>
      </div>
      <button data-collab-project='${esc(JSON.stringify({ id: project.id, title: project.title }))}' class="btn-press mt-3 w-full py-2.5 rounded-full border border-brandTextPrimary text-sm font-semibold hover:bg-brandTextPrimary hover:text-brandBgPrimary">Join this build</button>`
    : '';
  const startup = project.is_startup ? `<span class="absolute top-3 left-3 bg-brandBgTertiary text-brandTextPrimary text-[11px] font-mono font-medium px-2.5 py-1 rounded-full">Student startup</span>` : '';

  return `
    <article class="group card-hover rounded-3xl border border-brandBorder bg-brandBgTertiary overflow-hidden flex flex-col">
      <a href="project.html?id=${encodeURIComponent(project.id)}" class="img-zoom block aspect-[16/10] relative">${media}${startup}</a>
      <div class="p-6 flex flex-col flex-1">
        <p class="font-mono text-[12px] text-brandTextSecondary">${tags.map(esc).join(' / ')}</p>
        <h3 class="font-display font-bold text-2xl mt-2 leading-tight"><a href="project.html?id=${encodeURIComponent(project.id)}" class="hover:text-google-blue">${esc(project.title)}</a></h3>
        <p class="text-brandTextSecondary text-[15px] leading-relaxed mt-2">${esc(desc.slice(0, 120))}${desc.length > 120 ? '...' : ''}</p>
        ${helpHtml}
      </div>
    </article>`;
}

function buildWithUsCard() {
  return `
    <div class="rounded-3xl bg-brandTextPrimary text-brandBgPrimary p-8 flex flex-col justify-between min-h-[260px]">
      <h3 class="font-display font-extrabold text-3xl leading-[0.95]">Got an idea? Build it with us.</h3>
      <div>
        <p class="opacity-75 mb-5">Pitch it at a session and we'll help you find a team.</p>
        <button data-open-modal class="btn-press bg-google-blue text-white px-6 py-3 rounded-full font-semibold hover:bg-[#1765cc]">Join the club</button>
      </div>
    </div>`;
}

function renderProjectCards(filter) {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  const isFull = grid.dataset.full === 'true';
  let list = filter === 'collab' ? projectsCache.filter(p => p.needs_help) : projectsCache;
  // Pin student startups to the front of the homepage preview
  if (!isFull) list = [...list].sort((a, b) => (b.is_startup ? 1 : 0) - (a.is_startup ? 1 : 0));
  const visible = isFull ? list : list.slice(0, 5);

  const hint = document.getElementById('projects-count-hint');
  if (hint && !isFull && projectsCache.length > visible.length) hint.textContent = `Showing ${visible.length} of ${projectsCache.length} projects`;

  grid.innerHTML = visible.length
    ? visible.map(projectCardHtml).join('') + buildWithUsCard()
    : emptyState('ph-users-three', 'Nobody is recruiting right now', 'No projects are looking for teammates this week. Check back soon or start your own.') + buildWithUsCard();
}

function wireProjectFilters() {
  const all = document.getElementById('filter-all');
  const collab = document.getElementById('filter-collab');
  if (!all || !collab) return;
  const on = 'filter-btn btn-press px-5 py-2.5 rounded-full text-sm font-semibold bg-brandTextPrimary text-brandBgPrimary';
  const off = 'filter-btn btn-press px-5 py-2.5 rounded-full text-sm font-semibold border border-brandBorder text-brandTextSecondary hover:text-brandTextPrimary';
  const set = (f) => {
    all.className = f === 'all' ? on : off;
    collab.className = f === 'collab' ? on : off;
    all.setAttribute('aria-pressed', f === 'all');
    collab.setAttribute('aria-pressed', f === 'collab');
    renderProjectCards(f);
  };
  all.addEventListener('click', () => set('all'));
  collab.addEventListener('click', () => set('collab'));
}

// ==========================================
//  TEAM
// ==========================================
const socialLinks = (m, size = 'w-9 h-9') => [
  m.linkedin && `<a href="${url(m.linkedin)}" target="_blank" rel="noopener" aria-label="${esc(m.name)} on LinkedIn" class="${size} grid place-items-center rounded-full border border-brandBorder text-brandTextSecondary hover:text-brandTextPrimary hover:border-brandTextPrimary"><i class="ph ph-linkedin-logo"></i></a>`,
  m.github && `<a href="${url(m.github)}" target="_blank" rel="noopener" aria-label="${esc(m.name)} on GitHub" class="${size} grid place-items-center rounded-full border border-brandBorder text-brandTextSecondary hover:text-brandTextPrimary hover:border-brandTextPrimary"><i class="ph ph-github-logo"></i></a>`,
].filter(Boolean).join('');

async function loadTeam() {
  const grid = document.getElementById('team-grid');
  if (!grid) return;
  grid.innerHTML = skeleton('aspect-[4/5]', 4);

  const { data, error } = await supabase.from('team').select('*').order('created_at', { ascending: true });
  if (error || !data || data.length === 0) {
    grid.innerHTML = `<p class="col-span-full text-brandTextSecondary">The 2026 core team will be announced soon.</p>`;
    return;
  }

  grid.innerHTML = data.map((m, i) => {
    const initials = String(m.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const img = url(m.image);
    const photo = img
      ? `<img src="${img}" alt="${esc(m.name)}" loading="lazy" class="w-full h-full object-cover">`
      : `<div class="w-full h-full ${ROLE_COLORS[i % 4]} grid place-items-center"><span class="font-display font-extrabold text-6xl ${i % 4 === 2 ? 'text-[#202124]' : 'text-white'}">${esc(initials)}</span></div>`;
    return `
      <div class="group scroll-reveal revealed">
        <div class="img-zoom aspect-[4/5] rounded-3xl bg-brandBgSecondary">${photo}</div>
        <h3 class="font-display font-bold text-xl mt-4 leading-tight">${esc(m.name)}</h3>
        <p class="font-mono text-[12px] text-brandTextSecondary mt-1">${esc(m.role)}</p>
        ${m.bio ? `<p class="text-sm text-brandTextSecondary mt-2 leading-relaxed">${esc(m.bio)}</p>` : ''}
        <div class="flex gap-2 mt-3">${socialLinks(m)}</div>
      </div>`;
  }).join('');
}

// ==========================================
//  EVENTS  (date-led rows)
// ==========================================
async function loadEvents() {
  const grid = document.getElementById('events-grid');
  if (!grid) return;
  grid.innerHTML = Array(3).fill('<div class="h-28 border-b border-brandBorder animate-pulse"><div class="h-6 w-1/2 mt-8 rounded bg-brandBgSecondary"></div></div>').join('');

  const { data, error } = await supabase.from('events').select('*').eq('status', 'approved').order('date', { ascending: true });

  if (error || !data || data.length === 0) {
    grid.innerHTML = `
      <div class="py-12 border-b border-brandBorder">
        <p class="font-display font-bold text-2xl">Nothing on the calendar this week.</p>
        <p class="text-brandTextSecondary mt-2">New sessions land in the WhatsApp group first. <a href="https://gdg.community.dev/" target="_blank" rel="noopener" class="text-google-blue font-semibold">See past events on Bevy</a></p>
      </div>`;
    return;
  }

  const isFull = grid.dataset.full === 'true';
  const visible = isFull ? data : data.slice(0, 4);
  const hint = document.getElementById('events-count-hint');
  if (hint && !isFull && data.length > visible.length) hint.textContent = `Showing ${visible.length} of ${data.length} events`;

  grid.innerHTML = visible.map((ev, i) => {
    const d = new Date(ev.date);
    const valid = !isNaN(d);
    const month = valid ? d.toLocaleString('en-US', { month: 'short' }) : '';
    const day = valid ? String(d.getDate()).padStart(2, '0') : 'TBA';
    // location_type: 'online' (default) | 'inperson'
    const online = String(ev.location_type || 'online').toLowerCase() !== 'inperson';
    const link = url(ev.link);
    return `
      <article class="group grid grid-cols-[72px_1fr] md:grid-cols-[120px_1fr_auto] gap-x-5 md:gap-x-10 gap-y-3 py-7 md:py-9 border-b border-brandBorder items-start">
        <div class="leading-none">
          <p class="font-mono text-[12px] text-brandTextSecondary uppercase">${month}</p>
          <p class="font-display font-extrabold text-5xl md:text-7xl ${['text-google-blue', 'text-google-red', 'text-google-green'][i % 3]}">${day}</p>
        </div>
        <div>
          <p class="font-mono text-[12px] text-brandTextSecondary flex flex-wrap gap-x-3">
            <span><i class="ph ${online ? 'ph-video-camera' : 'ph-map-pin'}"></i> ${online ? 'Online' : 'In-Person'}</span>
            ${ev.location ? `<span>${esc(ev.location)}</span>` : ''}
          </p>
          <h3 class="font-display font-bold text-2xl md:text-3xl mt-2 leading-tight">${esc(ev.title)}</h3>
          <p class="text-brandTextSecondary mt-2 leading-relaxed max-w-[60ch]">${esc(ev.description)}</p>
        </div>
        ${link ? `<a href="${link}" target="_blank" rel="noopener" class="btn-press col-start-2 md:col-start-auto self-center justify-self-start inline-flex items-center gap-2 border border-brandTextPrimary rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-brandTextPrimary hover:text-brandBgPrimary">Register <i class="ph-bold ph-arrow-up-right"></i></a>` : ''}
      </article>`;
  }).join('');
}

// ==========================================
//  TESTIMONIALS
// ==========================================
async function loadTestimonials() {
  const grid = document.getElementById('testimonials-grid');
  if (!grid) return;
  grid.innerHTML = skeleton('h-56', 3);

  const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
  if (error || !data || data.length === 0) {
    grid.innerHTML = '';
    document.getElementById('testimonials')?.classList.add('hidden');
    return;
  }

  grid.innerHTML = data.slice(0, 6).map((t, i) => `
    <figure class="rounded-3xl bg-brandBgTertiary border border-brandBorder p-7 flex flex-col">
      <i class="ph-bold ph-quotes text-3xl ${['text-google-blue', 'text-google-red', 'text-google-green'][i % 3]}"></i>
      <blockquote class="mt-4 text-lg leading-relaxed flex-1">“${esc(t.content)}”</blockquote>
      <figcaption class="mt-6 flex items-center gap-3">
        ${url(t.image) ? `<img src="${url(t.image)}" alt="" class="w-11 h-11 rounded-full object-cover">` : `<span class="w-11 h-11 rounded-full ${ROLE_COLORS[i % 4]} grid place-items-center text-white font-bold">${esc(String(t.name || '?')[0])}</span>`}
        <span><span class="block font-semibold">${esc(t.name)}</span><span class="block text-sm text-brandTextSecondary">${esc(t.role)}</span></span>
      </figcaption>
    </figure>`).join('');
}

// ==========================================
//  SEMESTER PLAN
// ==========================================
async function loadSemesterPlan() {
  const container = document.getElementById('timeline-container');
  if (!container) return;
  const isFull = container.dataset.full === 'true';
  const cardSize = isFull ? '' : 'shrink-0 w-[82vw] sm:w-[320px]';
  container.innerHTML = Array(4).fill(`<div class="${cardSize} h-64 rounded-3xl bg-brandBgSecondary animate-pulse"></div>`).join('');

  const { data, error } = await supabase.from('semester_plan').select('*').order('date', { ascending: true });

  if (error || !data || data.length === 0) {
    container.innerHTML = `<div class="${cardSize || 'col-span-full'} rounded-3xl border border-dashed border-brandBorder p-8"><p class="font-display font-bold text-2xl">The plan is being drawn up.</p><p class="text-brandTextSecondary mt-2">Check back at the start of semester.</p></div>`;
    return;
  }

  const visible = isFull ? data : data.slice(0, 8);
  const hint = document.getElementById('plan-count-hint');
  if (hint && !isFull && data.length > visible.length) hint.textContent = `Showing ${visible.length} of ${data.length} activities`;

  container.innerHTML = visible.map((plan) => {
    const done = plan.status === 'completed';
    const live = plan.status === 'live' || plan.status === 'ongoing';
    const type = plan.activity_type || 'Activity';
    const tone = type === 'Workshop' ? 'bg-google-blue text-white' : type === 'Community' ? 'bg-google-green text-white' : 'bg-google-red text-white';
    const d = plan.date ? new Date(plan.date) : null;
    return `
      <article class="${cardSize} rounded-3xl border border-brandBorder bg-brandBgTertiary p-6 flex flex-col min-h-[260px] ${done ? 'opacity-70' : ''}">
        <div class="flex items-center justify-between gap-3">
          <span class="text-[12px] font-semibold px-3 py-1 rounded-full ${tone}">${esc(type)}</span>
          ${live ? '<span class="text-[12px] font-semibold text-google-red flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-google-red animate-pulse"></span>Live Now</span>' : done ? '<span class="text-[12px] font-mono text-brandTextSecondary">Completed</span>' : ''}
        </div>
        <h3 class="font-display font-bold text-2xl mt-5 leading-tight">${esc(plan.title)}</h3>
        <p class="text-brandTextSecondary text-[15px] leading-relaxed mt-2 flex-1">${esc(plan.description)}</p>
        ${d && !isNaN(d) ? `<p class="mt-5 font-mono text-[12px] text-brandTextSecondary">${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>` : ''}
      </article>`;
  }).join('');
}

// ==========================================
//  STUDENT RESOURCES
// ==========================================
const RESOURCE_COLORS = { blue: 'bg-google-blue', red: 'bg-google-red', green: 'bg-google-green', yellow: 'bg-google-yellow', purple: 'bg-google-blue', orange: 'bg-google-red' };

async function loadResources() {
  const grid = document.getElementById('resources-grid');
  if (!grid) return;
  grid.innerHTML = skeleton('h-32', 4);

  const { data, error } = await supabase.from('resources').select('*').order('sort_order', { ascending: true });
  if (error || !data || data.length === 0) {
    grid.innerHTML = '<p class="col-span-full text-brandTextSecondary">Packs are being added. Ask in the WhatsApp group for the current list.</p>';
    return;
  }

  const isFull = grid.dataset.full === 'true';
  const visible = isFull ? data : data.slice(0, 6);
  const hint = document.getElementById('resources-count-hint');
  if (hint && !isFull && data.length > visible.length) hint.textContent = `Showing ${visible.length} of ${data.length} resources`;

  grid.innerHTML = visible.map(res => `
    <a href="${url(res.url) || '#'}" target="_blank" rel="noopener" class="group card-hover rounded-3xl border border-brandBorder bg-brandBgTertiary p-5 flex gap-4 items-start">
      <span class="w-11 h-11 shrink-0 rounded-2xl ${RESOURCE_COLORS[res.color_key] || RESOURCE_COLORS.blue} grid place-items-center text-white"><i class="ph-bold ph-gift text-xl ${res.color_key === 'yellow' ? 'text-[#202124]' : ''}"></i></span>
      <span class="min-w-0">
        <span class="font-display font-bold text-lg flex items-center gap-1.5 group-hover:text-google-blue">${esc(res.title)} <i class="ph-bold ph-arrow-up-right text-sm"></i></span>
        ${res.badge ? `<span class="block font-mono text-[12px] text-google-green mt-0.5">${esc(res.badge)}</span>` : ''}
        <span class="block text-sm text-brandTextSecondary mt-1.5 leading-relaxed">${esc(res.description)}</span>
      </span>
    </a>`).join('');
}

// ==========================================
//  SPOTLIGHT
// ==========================================
async function loadSpotlight() {
  if (!document.getElementById('spotlight-container')) return;
  // Single source of truth: newest active row in spotlight_members. No team fallback.
  const { data } = await supabase.from('spotlight_members').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1);
  if (data && data.length > 0) renderSpotlight(data[0]);
  else document.getElementById('spotlight')?.classList.add('hidden');
}

function renderSpotlight(member) {
  if (!member || typeof member !== 'object') return;
  const safe = (v) => (v === null || v === undefined) ? '' : String(v);
  const $ = (id) => document.getElementById(id);
  if ($('spotlight-avatar')) { $('spotlight-avatar').src = url(member.image) || 'images/club/club-09.webp'; $('spotlight-avatar').alt = safe(member.name); }
  if ($('spotlight-name')) $('spotlight-name').textContent = safe(member.name) || 'Community Member';
  if ($('spotlight-role')) $('spotlight-role').textContent = safe(member.role);
  if ($('spotlight-quote')) $('spotlight-quote').textContent = `“${safe(member.spotlight_quote) || 'Proud to be part of the GDG Africa University community.'}”`;
  if ($('spotlight-project')) $('spotlight-project').innerHTML = member.spotlight_project
    ? `<p class="text-brandTextSecondary">Currently building <strong class="text-brandTextPrimary">${esc(member.spotlight_project)}</strong></p>` : '';
  if ($('spotlight-socials')) $('spotlight-socials').innerHTML = socialLinks(member, 'w-11 h-11');
}

// ==========================================
//  FORMS
// ==========================================
function handleApplicationForm() {
  const form = document.getElementById('apply-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('apply-submit-btn');
    const ok = document.getElementById('apply-success');
    const err = document.getElementById('apply-error');
    setBusy(btn, true, 'Submitting...');
    err.classList.add('hidden'); ok.classList.add('hidden');

    const fd = new FormData(form);
    const { error } = await insert('applications', [{
      name: fd.get('name'), email: fd.get('email'), role: fd.get('role'),
      skills: `[${fd.get('level')}] ${fd.get('skills')}`,
    }]);
    setBusy(btn, false);
    if (error) { err.textContent = errorText(error); err.classList.remove('hidden'); return; }
    form.reset();
    ok.classList.remove('hidden');
    btn.classList.add('hidden');
  });
}

function openModal(m) { if (!m) return; m.classList.add('active'); document.body.style.overflow = 'hidden'; setTimeout(() => m.querySelector('input:not([type=hidden]),select,textarea')?.focus({ preventScroll: true }), 60); }
function closeModal(m) { if (!m) return; m.classList.remove('active'); document.body.style.overflow = ''; }

function openCollabModal(project) {
  const modal = document.getElementById('collab-modal');
  if (!modal) return;
  document.getElementById('collab-project-id').value = project.id || '';
  document.getElementById('collab-project-title').value = project.title || '';
  document.getElementById('collab-modal-desc').textContent = `Lend your skills to ${project.title || 'this team'} and help build something real.`;
  openModal(modal);
}

function initCollabForm() {
  const form = document.getElementById('collab-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('collab-submit-btn');
    const ok = document.getElementById('collab-success');
    const err = document.getElementById('collab-error');
    setBusy(btn, true, 'Sending...');
    err.classList.add('hidden'); ok.classList.add('hidden');
    const fd = new FormData(form);
    const { error } = await insert('collab_applications', [{
      name: fd.get('name'), email: fd.get('email'),
      project_id: fd.get('project_id') || null, project_title: fd.get('project_title') || null,
      skills: fd.get('skills') || '', motivation: fd.get('motivation') || '', status: 'pending',
    }]);
    setBusy(btn, false);
    if (error) { err.textContent = errorText(error); err.classList.remove('hidden'); return; }
    form.reset();
    ok.classList.remove('hidden');
    flashDone(btn);
    setTimeout(() => { closeModal(document.getElementById('collab-modal')); ok.classList.add('hidden'); }, 1600);
  });
}

function handleNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('newsletter-submit-btn');
    const ok = document.getElementById('newsletter-success');
    const err = document.getElementById('newsletter-error');
    setBusy(btn, true, 'Subscribing...');
    err.classList.add('hidden'); ok.classList.add('hidden');
    const { error } = await insert('newsletter_subscribers', [{ email: new FormData(form).get('email') }]);
    setBusy(btn, false);
    if (error) {
      // 23505 = UNIQUE violation, already subscribed
      err.textContent = error.code === '23505' ? 'This email is already subscribed!' : errorText(error);
      err.classList.remove('hidden');
      return;
    }
    form.reset();
    form.classList.add('hidden');
    ok.classList.remove('hidden');
  });
}

function handleMembershipForm() {
  const form = document.getElementById('membership-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('membership-submit-btn');
    const ok = document.getElementById('membership-success');
    const err = document.getElementById('membership-error');
    setBusy(btn, true, 'Submitting...');
    err.classList.add('hidden'); ok.classList.add('hidden');
    const fd = new FormData(form);
    const { error } = await insert('membership_applications', [{
      name: fd.get('name'), email: fd.get('email'), academic_year: fd.get('academic_year'),
      department: fd.get('department'), interests: fd.get('interests') || '', motivation: fd.get('motivation') || '',
      status: 'pending',
    }]);
    setBusy(btn, false);
    if (error) { err.textContent = errorText(error); err.classList.remove('hidden'); return; }
    form.reset();
    ok.classList.remove('hidden');
    flashDone(btn, 'Welcome in');
    setTimeout(() => { closeModal(document.getElementById('membership-modal')); ok.classList.add('hidden'); }, 2200);
  });
}

// ==========================================
//  UI
// ==========================================
function initUI() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (btn && menu) {
    const icon = btn.querySelector('.hamburger-icon');
    const set = (open) => {
      menu.classList.toggle('hidden', !open);
      icon?.classList.toggle('active', open);
      btn.setAttribute('aria-expanded', open);
      document.getElementById('main-nav')?.classList.toggle('scrolled', open || window.scrollY > 10);
    };
    btn.addEventListener('click', () => set(menu.classList.contains('hidden')));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));
  }

  // One delegated handler for every modal trigger, including cards rendered later
  document.addEventListener('click', (e) => {
    const collab = e.target.closest('[data-collab-project]');
    if (collab) {
      e.preventDefault();
      try { openCollabModal(JSON.parse(collab.dataset.collabProject)); } catch { openCollabModal({ id: '', title: 'this team' }); }
      return;
    }
    const opener = e.target.closest('[data-open-modal]');
    const membership = document.getElementById('membership-modal');
    if (opener) {
      e.preventDefault();
      if (membership) openModal(membership); else location.href = 'index.html#join';
      return;
    }
    if (e.target.closest('[data-close-modal]') || e.target.classList.contains('modal-overlay')) closeModal(e.target.closest('.modal-overlay'));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(closeModal);
  });
  // Sub-pages link to index.html#join; open the form on arrival
  if (location.hash === '#join') openModal(document.getElementById('membership-modal'));

  document.getElementById('show-apply-btn')?.addEventListener('click', () => {
    const s = document.getElementById('apply');
    s.classList.remove('hidden');
    s.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
}

// Nav background + back-to-top driven by a sentinel, no scroll listeners
function initScrollState() {
  const nav = document.getElementById('main-nav');
  const top = document.getElementById('back-to-top');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;height:600px;width:1px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([en]) => {
    const scrolled = en.intersectionRect.height < 590;
    nav?.classList.toggle('scrolled', scrolled || !document.getElementById('mobile-menu')?.classList.contains('hidden'));
    top?.classList.toggle('opacity-0', en.isIntersecting);
    top?.classList.toggle('invisible', en.isIntersecting);
  }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }).observe(sentinel);
}

function initScrollReveal() {
  const io = new IntersectionObserver((entries) => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('revealed'); io.unobserve(en.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.scroll-reveal:not(.revealed)').forEach(el => io.observe(el));
}

function initStatCounters() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver((entries) => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target, target = parseInt(el.dataset.count, 10), t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / 1400, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    io.unobserve(el);
  }), { threshold: 0.6 });
  document.querySelectorAll('.stat-number[data-count]').forEach(el => io.observe(el));
}

function initPhotoTrack() {
  const track = document.getElementById('photo-track');
  if (!track) return;
  const photos = Array.from({ length: 14 }, (_, i) => `images/club/club-${String(i + 1).padStart(2, '0')}.webp`);
  // Duplicated once so the CSS loop is seamless; copies are hidden from screen readers
  track.innerHTML = [...photos, ...photos].map((src, i) => `
    <img src="${src}" ${i < photos.length ? 'alt="GDG Africa University members at a club event"' : 'alt="" aria-hidden="true"'} loading="lazy" decoding="async"
      class="h-56 md:h-80 w-auto rounded-3xl object-cover shrink-0 ${i % 3 === 1 ? 'md:translate-y-6' : ''}">`).join('');
}

async function checkBlogUpdates() {
  const { count, error } = await supabase.from('blog').select('id', { count: 'exact', head: true });
  if (error || count === null) return;
  let seen = 0;
  try { seen = parseInt(localStorage.getItem('blog_seen_count') || '0', 10); } catch { /* storage blocked */ }
  const fresh = count - seen;
  if (fresh <= 0) return;
  for (const id of ['blog-badge', 'mobile-blog-badge']) {
    const b = document.getElementById(id);
    if (b) { b.textContent = fresh; b.classList.remove('hidden'); b.classList.add('inline-flex'); }
  }
}

// ==========================================
//  INIT
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  initUI();
  initScrollState();
  initPhotoTrack();
  initScrollReveal();
  initStatCounters();
  handleApplicationForm();
  handleMembershipForm();
  handleNewsletterForm();
  initCollabForm();

  try {
    ({ supabase } = await import('./supabase-config.js'));
  } catch (err) {
    console.error('Supabase failed to load', err);
    return;
  }
  await Promise.allSettled([loadProjects(), loadTeam(), loadEvents(), loadTestimonials(), loadSpotlight(), loadSemesterPlan(), loadResources(), checkBlogUpdates()]);
  initScrollReveal();
});
