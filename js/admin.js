// Admin dashboard. Every content type is described by a schema in SCHEMAS; one generic
// form builder renders editors from it. Add a field: add it here AND to functions/_lib/admin-tables.js.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (n, cls = 'w-4 h-4') => `<svg class="${cls}" aria-hidden="true"><use href="/img/icons.svg#${n}"></use></svg>`;
const SITE = location.origin;

// ── API ──
async function api(path, opts = {}) {
  const isJson = opts.body && typeof opts.body === 'string';
  const res = await fetch(`/api/admin/${path}`, { ...opts, headers: { 'x-gdg-admin': '1', ...(isJson ? { 'content-type': 'application/json' } : {}), ...opts.headers } });
  if (res.status === 401) { showSignin('Your session ended. Sign in again.'); throw new Error('Signed out'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
function toast(msg, bad = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('!bg-google-red', bad);
  t.classList.toggle('!text-white', bad);
  t.classList.remove('opacity-0');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.add('opacity-0'), 2600);
}

// ── Schemas ──
const PATHS = [['', 'None'], ['web', 'Web'], ['mobile', 'Mobile'], ['game', 'Game dev'], ['ai', 'AI and ML'], ['cloud', 'Cloud'], ['design', 'UI/UX'], ['data', 'Data'], ['security', 'Security']];
const KINDS = [['workshop', 'Workshop'], ['study-jam', 'Study jam'], ['talk', 'Talk'], ['hackathon', 'Hackathon'], ['community', 'Community']];
const MD_HELP = 'Markdown: **bold**, *italic*, - lists, ## headings, [link text](https://...)';

const SCHEMAS = {
  events: {
    label: 'Events', one: 'event', view: (r) => `/events/${r.slug}`,
    fields: [
      { k: 'title', label: 'Title', req: true },
      { k: 'starts_at', type: 'when', label: 'Date and start time', req: true, help: 'Leave the time empty if it is not set yet. Times are Harare time.' },
      { k: 'ends_at', type: 'when', label: 'End (optional)' },
      { k: 'kind', type: 'select', label: 'Type', options: KINDS },
      { k: 'path', type: 'select', label: 'Learning path', options: PATHS },
      { k: 'location', label: 'Location', placeholder: 'e.g. Africa University, Room 12 or Google Meet' },
      { k: 'online', type: 'check', label: 'Online or hybrid' },
      { k: 'register_url', type: 'url', label: 'Registration link', placeholder: 'https://gdg.community.dev/...' },
      { k: 'summary', type: 'textarea', rows: 2, label: 'Summary', help: 'One or two sentences. Shown on cards, in WhatsApp shares and on Google.' },
      { k: 'materials', type: 'materials', label: 'Materials students can open', help: 'Slides, code, recordings, docs. Google Slides links get an in-page viewer.' },
      { k: 'people', type: 'people', label: 'People', roles: ['Speaker', 'Organiser', 'Mentor', 'Winner', 'Volunteer'], help: 'Shows on the event and on each person’s profile.' },
      { k: 'body', type: 'textarea', rows: 8, label: 'Agenda, prep or recap', help: MD_HELP },
      { k: 'cover', type: 'image', label: 'Cover image' },
      { k: 'status', type: 'select', label: 'Status', options: [['published', 'Published'], ['draft', 'Draft (hidden)'], ['cancelled', 'Cancelled']] },
    ],
  },
  projects: {
    label: 'Projects', one: 'project', view: (r) => `/projects/${r.slug}`,
    fields: [
      { k: 'title', label: 'Title', req: true },
      { k: 'summary', type: 'textarea', rows: 2, label: 'Summary', help: 'One or two sentences.' },
      { k: 'people', type: 'people', label: 'Team', roles: ['Founder', 'Lead', 'Developer', 'Designer', 'Contributor', 'Mentor'] },
      { k: 'story', type: 'textarea', rows: 10, label: 'The story', help: `The problem, how it was built, what's next. ${MD_HELP}` },
      { k: 'tags', label: 'Tags', placeholder: 'Flutter, Firebase, AI' },
      { k: 'path', type: 'select', label: 'Main path', options: PATHS },
      { k: 'image', type: 'image', label: 'Image' },
      { k: 'demo_url', type: 'url', label: 'Live link' },
      { k: 'repo_url', type: 'url', label: 'Code link' },
      { k: 'event_id', type: 'event', label: 'Started at an event (optional)' },
      { k: 'is_startup', type: 'check', label: 'Student startup' },
      { k: 'needs_help', type: 'check', label: 'Looking for teammates' },
      { k: 'help_text', type: 'textarea', rows: 2, label: 'Who do they need?' },
      { k: 'status', type: 'select', label: 'Status', options: [['published', 'Published'], ['draft', 'Draft (hidden)']] },
    ],
  },
  people: {
    label: 'People', one: 'person', view: (r) => `/people/${r.slug}`,
    fields: [
      { k: 'name', label: 'Name', req: true },
      { k: 'headline', label: 'Headline', placeholder: 'Computer Science, class of 2027' },
      { k: 'core_role', label: 'Core team role', placeholder: 'Leave empty unless they are on the core team', help: 'Filled in = shown in "The core team" on the homepage.' },
      { k: 'sort', type: 'number', label: 'Order on core team', help: 'Lower numbers first.' },
      { k: 'image', type: 'image', label: 'Photo' },
      { k: 'bio', type: 'textarea', rows: 3, label: 'Short bio' },
      { k: 'path', type: 'select', label: 'Main path', options: PATHS },
      { k: 'github', type: 'url', label: 'GitHub' },
      { k: 'linkedin', type: 'url', label: 'LinkedIn' },
      { k: 'website', type: 'url', label: 'Website' },
      { k: 'spotlights', type: 'spotlights', label: 'Spotlights', help: 'Won a hackathon, gave a talk, shipped something. Every entry stays on their profile and on /people. The newest one dated today or earlier is featured on the homepage.' },
    ],
  },
  posts: {
    label: 'Blog', one: 'post', view: (r) => `/blog/${r.slug}`,
    fields: [
      { k: 'title', label: 'Title', req: true },
      { k: 'excerpt', type: 'textarea', rows: 2, label: 'Excerpt' },
      { k: 'body', type: 'textarea', rows: 16, label: 'Post', req: true, help: MD_HELP },
      { k: 'author_id', type: 'person', label: 'Author' },
      { k: 'cover', type: 'image', label: 'Cover image' },
      { k: 'tags', label: 'Tags' },
      { k: 'status', type: 'select', label: 'Status', options: [['draft', 'Draft'], ['published', 'Published']] },
      { k: 'published_at', type: 'when', label: 'Publish date', help: 'Set automatically when first published.' },
    ],
  },
  resources: {
    label: 'Packs', one: 'pack',
    fields: [
      { k: 'title', label: 'Name', req: true },
      { k: 'url', type: 'url', label: 'Link', req: true },
      { k: 'badge', label: 'Badge', placeholder: 'Free, Credit...' },
      { k: 'description', type: 'textarea', rows: 2, label: 'What students get' },
      { k: 'sort', type: 'number', label: 'Order' },
    ],
  },
};

const TABS = [['overview', 'Overview'], ['events', 'Events'], ['projects', 'Projects'], ['people', 'People'], ['posts', 'Blog'], ['resources', 'Packs'], ['inbox', 'Inbox']];
const cache = {};
let me = null;

// ── Auth ──
async function boot() {
  const s = await fetch('/api/admin/session').then(r => r.json()).catch(() => ({}));
  me = s;
  if (s.email) return showApp();
  showSignin();
}
function showSignin(msg = '') {
  $('#app').hidden = true;
  $('#signin').hidden = false;
  $('#signin-msg').textContent = msg;
  $('#dev-login').hidden = !me?.devLogin;
  if (!me?.clientId) {
    if (!me?.devLogin) $('#signin-msg').textContent = 'Google sign-in is not configured yet: set GOOGLE_CLIENT_ID (see README).';
    return;
  }
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.onload = () => {
    google.accounts.id.initialize({ client_id: me.clientId, callback: ({ credential }) => signIn({ credential }), ux_mode: 'popup' });
    google.accounts.id.renderButton($('#google-btn'), { theme: 'outline', size: 'large', shape: 'pill', width: 320, text: 'signin_with' });
  };
  document.head.appendChild(s);
}
async function signIn(body) {
  const res = await fetch('/api/admin/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { $('#signin-msg').textContent = data.error || 'Sign-in failed.'; return; }
  me = { ...me, email: data.email };
  showApp();
}
$('#dev-login').addEventListener('click', () => signIn({ dev: true }));
$('#signout').addEventListener('click', async () => { await fetch('/api/admin/session', { method: 'DELETE' }); location.reload(); });

function showApp() {
  $('#signin').hidden = true;
  $('#app').hidden = false;
  $('#tabs').innerHTML = TABS.map(([id, label]) => `<a href="#${id}" data-tab="${id}" class="shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold text-brandTextSecondary hover:text-brandTextPrimary">${label}</a>`).join('');
  route();
}
addEventListener('hashchange', route);

async function route() {
  if ($('#app').hidden) return;
  const tab = (location.hash.slice(1) || 'overview').split('/')[0];
  $$('[data-tab]').forEach(a => {
    const on = a.dataset.tab === tab;
    a.classList.toggle('bg-brandTextPrimary', on);
    a.classList.toggle('!text-brandBgPrimary', on);
    a.setAttribute('aria-current', on ? 'page' : 'false');
  });
  $('#view').innerHTML = '<p class="text-brandTextSecondary">Loading...</p>';
  try {
    if (tab === 'overview') await renderOverview();
    else if (tab === 'inbox') await renderInbox();
    else if (SCHEMAS[tab]) await renderList(tab);
  } catch (e) { if (e.message !== 'Signed out') $('#view').innerHTML = `<p class="text-google-red">${esc(e.message)}</p>`; }
}

const load = async (table, force = false) => (cache[table] && !force ? cache[table] : (cache[table] = await api(table)));
const fmtDate = (iso) => {
  if (!iso) return '';
  const timed = /T\d{2}:\d{2}/.test(iso);
  const d = new Date(timed ? iso : `${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: timed ? 'Africa/Harare' : 'UTC' })
    + (timed ? `, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Harare' })}` : '');
};
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Harare' });

// ── WhatsApp ──
function whatsappText(events) {
  if (events.length === 1) {
    const e = events[0];
    return [`*${e.title}*`, `📅 ${fmtDate(e.starts_at)}`, `📍 ${e.location || (e.online ? 'Online' : 'Africa University')}`, e.summary ? `\n${e.summary}` : '', `\nDetails and materials: ${SITE}/events/${e.slug}`].filter(Boolean).join('\n');
  }
  return [`*Coming up at GDG Africa University*`, ...events.map(e => `\n*${e.title}*\n📅 ${fmtDate(e.starts_at)}\n📍 ${e.location || (e.online ? 'Online' : 'Africa University')}\n${SITE}/events/${e.slug}`), `\nAll sessions and slides: ${SITE}/events`].join('\n');
}
const waLink = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy-text]');
  if (!b) return;
  try { await navigator.clipboard.writeText(b.dataset.copyText); toast('Copied. Paste it into the WhatsApp group.'); } catch { toast('Copy failed', true); }
});

// ── Overview ──
async function renderOverview() {
  const [events, members, applications, subscribers] = await Promise.all([load('events', true), load('members', true), load('applications', true), load('subscribers', true)]);
  const t = today();
  const weekAhead = new Date(Date.now() + 7 * 864e5).toLocaleDateString('en-CA', { timeZone: 'Africa/Harare' });
  const upcoming = events.filter(e => e.status !== 'draft' && e.starts_at.slice(0, 10) >= t).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const thisWeek = upcoming.filter(e => e.starts_at.slice(0, 10) <= weekAhead);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const stat = (n, label, href) => `<a href="${href}" class="rounded-3xl border border-brandBorder bg-brandBgTertiary p-5 hover:border-brandTextPrimary"><p class="font-display font-extrabold text-4xl">${n}</p><p class="text-sm text-brandTextSecondary mt-1">${label}</p></a>`;
  const digest = thisWeek.length ? whatsappText(thisWeek) : '';
  const setup = [
    [!!me.clientId, 'Google sign-in (GOOGLE_CLIENT_ID)'],
    [!!me.mail, 'Admin email alerts (RESEND_API_KEY)'],
    [!!me.cron, 'Monday WhatsApp post and newsletter (cron Worker)'],
    [!!me.mailPublic, 'Emails to students: welcome and newsletter (needs a domain verified in Resend, then MAIL_FROM)'],
  ];

  $('#view').innerHTML = `
    <h1 class="font-display font-extrabold text-4xl md:text-5xl">Hi there.</h1>
    <p class="text-brandTextSecondary mt-2">Signed in as ${esc(me.email)}.</p>
    <div class="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
      ${stat(upcoming.length, 'Upcoming events', '#events')}
      ${stat(members.length, `Members (${members.filter(m => m.created_at > weekAgo).length} this week)`, '#inbox')}
      ${stat(applications.filter(a => a.status === 'new').length, 'New applications', '#inbox')}
      ${stat(subscribers.length, 'Newsletter subscribers', '#inbox')}
    </div>
    <div class="mt-8 grid lg:grid-cols-[1.3fr_1fr] gap-4">
      <section class="rounded-3xl border border-brandBorder bg-brandBgTertiary p-6">
        <h2 class="font-display font-bold text-2xl flex items-center gap-2">${icon('whatsapp-logo', 'w-6 h-6 text-google-green')} This week's WhatsApp post</h2>
        ${digest ? `<pre class="mt-4 whitespace-pre-wrap text-sm bg-brandBgSecondary rounded-2xl p-4 max-h-72 overflow-auto">${esc(digest)}</pre>
          <div class="mt-4 flex flex-wrap gap-2">
            <a href="${waLink(digest)}" target="_blank" rel="noopener" class="btn-press inline-flex items-center gap-2 bg-google-green text-white font-semibold px-5 py-3 rounded-full">${icon('whatsapp-logo')} Open in WhatsApp</a>
            <button type="button" data-copy-text="${esc(digest)}" class="btn-press inline-flex items-center gap-2 border border-brandBorder font-semibold px-5 py-3 rounded-full">${icon('copy')} Copy text</button>
          </div>
          <p class="mt-3 text-sm text-brandTextSecondary">WhatsApp has no safe way for a website to post into a group by itself. One tap here opens it ready to send.</p>`
          : `<p class="mt-3 text-brandTextSecondary">Nothing in the next 7 days. <a href="#events" class="text-google-blue font-semibold">Add an event</a>.</p>`}
      </section>
      <section class="rounded-3xl border border-brandBorder bg-brandBgTertiary p-6">
        <h2 class="font-display font-bold text-2xl">Setup</h2>
        <ul class="mt-4 space-y-3">${setup.map(([ok, label]) => `<li class="flex items-center gap-3">${icon(ok ? 'check' : 'warning', `w-5 h-5 ${ok ? 'text-google-green' : 'text-google-red'}`)}<span>${label}</span></li>`).join('')}</ul>
        <p class="mt-4 text-sm text-brandTextSecondary">Steps are in the README under "Admin setup".</p>
      </section>
    </div>`;
}

// ── Lists ──
async function renderList(table) {
  const s = SCHEMAS[table];
  const rows = await load(table, true);
  if (table === 'events' || table === 'projects' || table === 'posts') await load('people');
  const t = today();
  const line = (r) => {
    if (table === 'events') {
      const past = r.starts_at.slice(0, 10) < t;
      return `<p class="font-mono text-xs text-brandTextSecondary">${esc(fmtDate(r.starts_at))}${r.status !== 'published' ? ` / <span class="text-google-red">${esc(r.status)}</span>` : ''}${past ? ' / past' : ''} / ${r.materials?.length || 0} materials</p>`;
    }
    if (table === 'people') return `<p class="font-mono text-xs text-brandTextSecondary">${esc(r.core_role || r.headline || '')}${r.spotlights?.length ? ` / ${r.spotlights.length} spotlight${r.spotlights.length > 1 ? 's' : ''}` : ''}</p>`;
    if (table === 'posts' || table === 'projects') return `<p class="font-mono text-xs text-brandTextSecondary">${esc(r.status)}${r.published_at ? ` / ${esc(fmtDate(r.published_at))}` : ''}</p>`;
    return `<p class="font-mono text-xs text-brandTextSecondary truncate">${esc(r.url || '')}</p>`;
  };
  $('#view').innerHTML = `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <h1 class="font-display font-extrabold text-4xl md:text-5xl">${s.label}</h1>
      <div class="flex gap-2 w-full sm:w-auto">
        <input type="search" id="list-search" placeholder="Search" class="field !rounded-full flex-1 sm:w-56" aria-label="Search ${s.label}" />
        <button type="button" id="new-btn" class="btn-press shrink-0 bg-google-blue text-white font-semibold px-5 py-3 rounded-full hover:bg-google-blue-dark">New ${s.one}</button>
      </div>
    </div>
    <ul id="rows" class="mt-8 border-t border-brandBorder">
      ${rows.map(r => `<li data-search="${esc(JSON.stringify([r.title, r.name, r.summary, r.headline]).toLowerCase())}" class="flex flex-wrap items-center gap-3 py-4 border-b border-brandBorder">
        <button type="button" data-edit="${r.id}" class="flex-1 min-w-[220px] text-left">
          <span class="block font-display font-bold text-lg leading-snug hover:text-google-blue">${esc(r.title || r.name)}</span>${line(r)}
        </button>
        <div class="flex gap-1.5">
          ${table === 'events' && r.status !== 'draft' ? `<a href="${waLink(whatsappText([r]))}" target="_blank" rel="noopener" title="Post to WhatsApp" class="w-10 h-10 grid place-items-center rounded-full border border-brandBorder hover:border-google-green hover:text-google-green">${icon('whatsapp-logo')}</a>` : ''}
          ${s.view ? `<a href="${s.view(r)}" target="_blank" rel="noopener" title="View on site" class="w-10 h-10 grid place-items-center rounded-full border border-brandBorder hover:border-brandTextPrimary">${icon('arrow-up-right')}</a>` : ''}
          <button type="button" data-edit="${r.id}" title="Edit" class="w-10 h-10 grid place-items-center rounded-full border border-brandBorder hover:border-brandTextPrimary">${icon('pencil-simple')}</button>
        </div>
      </li>`).join('') || `<li class="py-10 text-brandTextSecondary">Nothing yet. Add the first ${s.one}.</li>`}
    </ul>`;
  $('#new-btn').addEventListener('click', () => openEditor(table, null));
  $$('[data-edit]').forEach(b => b.addEventListener('click', () => openEditor(table, rows.find(r => r.id === Number(b.dataset.edit)))));
  $('#list-search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    $$('#rows > li[data-search]').forEach(li => { li.hidden = q && !li.dataset.search.includes(q); });
  });
}

// ── Inbox ──
async function renderInbox() {
  const [members, applications, subscribers] = await Promise.all([load('members', true), load('applications', true), load('subscribers', true)]);
  const projects = await load('projects');
  const status = (table, r) => `<select data-status="${table}:${r.id}" class="field !py-1.5 !w-auto text-sm" aria-label="Status">${['new', 'welcomed', 'contacted', 'accepted', 'archived'].map(s => `<option ${r.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>`;
  const del = (table, key) => `<button type="button" data-del="${table}:${esc(key)}" class="w-9 h-9 grid place-items-center rounded-full hover:bg-google-red/10 text-google-red" title="Delete">${icon('trash')}</button>`;
  const when = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const section = (title, table, rows, render) => `
    <section class="mt-10">
      <div class="flex flex-wrap items-center justify-between gap-3"><h2 class="font-display font-bold text-2xl">${title} <span class="font-mono text-sm text-brandTextSecondary">${rows.length}</span></h2>
      <a href="/api/admin/export?table=${table}" class="inline-flex items-center gap-2 text-sm font-semibold border border-brandBorder rounded-full px-4 py-2 hover:border-brandTextPrimary">${icon('download-simple')} CSV</a></div>
      <ul class="mt-4 border-t border-brandBorder">${rows.map(render).join('') || '<li class="py-6 text-brandTextSecondary">Nothing yet.</li>'}</ul>
    </section>`;

  $('#view').innerHTML = `<h1 class="font-display font-extrabold text-4xl md:text-5xl">Inbox</h1>` +
    section('New members', 'members', members, m => `<li class="py-4 border-b border-brandBorder grid sm:grid-cols-[1fr_auto] gap-3">
      <div><p class="font-semibold">${esc(m.name)} <a href="mailto:${esc(m.email)}" class="font-normal text-google-blue">${esc(m.email)}</a></p>
      <p class="text-sm text-brandTextSecondary">${esc([m.academic_year, m.department, m.interests].filter(Boolean).join(' / '))} / joined ${when(m.created_at)}</p>
      ${m.motivation ? `<p class="text-sm mt-1">${esc(m.motivation)}</p>` : ''}</div>
      <div class="flex items-center gap-2">${status('members', m)}${del('members', m.id)}</div></li>`) +
    section('Applications', 'applications', applications, a => `<li class="py-4 border-b border-brandBorder grid sm:grid-cols-[1fr_auto] gap-3">
      <div><p class="font-semibold">${esc(a.name)} <a href="mailto:${esc(a.email)}" class="font-normal text-google-blue">${esc(a.email)}</a></p>
      <p class="text-sm text-brandTextSecondary">${a.kind === 'lead' ? `Lead role: ${esc(a.role)}` : `Wants to join ${esc(projects.find(p => p.id === a.project_id)?.title || 'a project')}${a.role ? ` as ${esc(a.role)}` : ''}`} / ${when(a.created_at)}</p>
      ${a.details ? `<p class="text-sm mt-1 whitespace-pre-line">${esc(a.details)}</p>` : ''}</div>
      <div class="flex items-center gap-2">${status('applications', a)}${del('applications', a.id)}</div></li>`) +
    section('Newsletter', 'subscribers', subscribers, s => `<li class="py-3 border-b border-brandBorder flex items-center justify-between gap-3"><span>${esc(s.email)} <span class="text-sm text-brandTextSecondary">${when(s.created_at)}</span></span>${del('subscribers', s.email)}</li>`);

  $$('[data-status]').forEach(sel => sel.addEventListener('change', async () => {
    const [table, id] = sel.dataset.status.split(':');
    try { await api(`${table}/${id}`, { method: 'PUT', body: JSON.stringify({ status: sel.value }) }); toast('Updated'); } catch (e) { toast(e.message, true); }
  }));
  $$('[data-del]').forEach(b => b.addEventListener('click', async () => {
    const [table, key] = b.dataset.del.split(/:(.+)/);
    if (!confirm('Delete this permanently?')) return;
    try { await api(`${table}/${encodeURIComponent(key)}`, { method: 'DELETE' }); toast('Deleted'); renderInbox(); } catch (e) { toast(e.message, true); }
  }));
}

// ── Editor ──
let editing = null;
function fieldHtml(f, v) {
  const id = `f-${f.k}`;
  const label = `<label class="label" for="${id}">${f.label}${f.req ? ' <span class="text-google-red">*</span>' : ''}</label>`;
  const help = f.help ? `<p class="text-xs text-brandTextSecondary mt-1.5">${esc(f.help)}</p>` : '';
  const people = cache.people || [];
  switch (f.type) {
    case 'textarea': return `<div>${label}<textarea id="${id}" name="${f.k}" rows="${f.rows || 4}" class="field">${esc(v)}</textarea>${help}</div>`;
    case 'select': return `<div>${label}<select id="${id}" name="${f.k}" class="field">${f.options.map(([val, l]) => `<option value="${val}" ${String(v ?? f.options[0][0]) === val ? 'selected' : ''}>${l}</option>`).join('')}</select>${help}</div>`;
    case 'check': return `<label class="flex items-center gap-3 font-semibold"><input type="checkbox" name="${f.k}" ${v ? 'checked' : ''} class="w-5 h-5 accent-[#1A73E8]" /> ${f.label}</label>${help}`;
    case 'number': return `<div>${label}<input id="${id}" type="number" name="${f.k}" value="${esc(v ?? 0)}" class="field !w-32" />${help}</div>`;
    case 'url': return `<div>${label}<input id="${id}" type="url" name="${f.k}" value="${esc(v)}" placeholder="${esc(f.placeholder || 'https://')}" class="field" />${help}</div>`;
    case 'when': {
      const [d, t] = v ? [v.slice(0, 10), /T(\d{2}:\d{2})/.exec(v)?.[1] || ''] : ['', ''];
      return `<div>${label}<div class="flex gap-2"><input id="${id}" type="date" name="${f.k}__date" value="${d}" class="field" /><input type="time" name="${f.k}__time" value="${t}" class="field !w-36" aria-label="${f.label} time" /></div>${help}</div>`;
    }
    case 'image': return `<div>${label}<div class="flex gap-2 items-start">
        <input id="${id}" name="${f.k}" value="${esc(v)}" placeholder="https://... or upload" class="field" />
        <label class="btn-press shrink-0 cursor-pointer border border-brandBorder rounded-full px-4 py-3 text-sm font-semibold hover:border-brandTextPrimary">Upload<input type="file" accept="image/*" data-upload="${f.k}" class="sr-only" /></label></div>
        ${v ? `<img src="${esc(v)}" alt="" class="mt-2 h-24 rounded-xl object-cover" data-preview="${f.k}" />` : `<img alt="" class="mt-2 h-24 rounded-xl object-cover hidden" data-preview="${f.k}" />`}${help}</div>`;
    case 'person': return `<div>${label}<select id="${id}" name="${f.k}" class="field"><option value="">None</option>${people.map(p => `<option value="${p.id}" ${Number(v) === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>${help}</div>`;
    case 'event': return `<div>${label}<select id="${id}" name="${f.k}" class="field"><option value="">None</option>${(cache.events || []).map(e => `<option value="${e.id}" ${Number(v) === e.id ? 'selected' : ''}>${esc(e.title)}</option>`).join('')}</select>${help}</div>`;
    case 'materials': return `<fieldset><legend class="label">${f.label}</legend><div data-list="materials" class="space-y-2">${(v || []).map(materialRow).join('')}</div>
        <button type="button" data-add="materials" class="mt-2 text-sm font-semibold text-google-blue">+ Add material</button>${help}</fieldset>`;
    case 'people': return `<fieldset><legend class="label">${f.label}</legend><div data-list="people" data-roles="${esc(f.roles.join('|'))}" class="space-y-2">${(v || []).map(r => personRow(r, f.roles)).join('')}</div>
        <button type="button" data-add="people" class="mt-2 text-sm font-semibold text-google-blue">+ Add person</button>${people.length ? '' : '<p class="text-xs text-brandTextSecondary mt-1.5">Add people in the People tab first.</p>'}${help}</fieldset>`;
    case 'spotlights': return `<fieldset><legend class="label">${f.label}</legend><div data-list="spotlights" class="space-y-2">${[...(v || [])].sort((a, b) => b.featured_on.localeCompare(a.featured_on)).map(spotlightRow).join('')}</div>
        <button type="button" data-add="spotlights" class="mt-2 text-sm font-semibold text-google-blue">+ Add spotlight</button>${help}</fieldset>`;
    default: return `<div>${label}<input id="${id}" name="${f.k}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" class="field" ${f.req ? 'required' : ''} />${help}</div>`;
  }
}
const MAT_KINDS = [['slides', 'Slides'], ['code', 'Code'], ['recording', 'Recording'], ['doc', 'Doc'], ['link', 'Link']];
const materialRow = (m = {}) => `<div data-row class="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1.4fr_auto_auto] gap-2 items-center rounded-2xl bg-brandBgSecondary p-2">
  <input data-f="label" value="${esc(m.label)}" placeholder="Label, e.g. Slides" class="field" aria-label="Material label" />
  <input data-f="url" value="${esc(m.url)}" placeholder="https://" class="field col-span-2 sm:col-span-1 row-start-2 sm:row-start-auto" aria-label="Material link" />
  <select data-f="kind" class="field !w-auto" aria-label="Material type">${MAT_KINDS.map(([v, l]) => `<option value="${v}" ${m.kind === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
  <button type="button" data-remove class="w-9 h-9 grid place-items-center rounded-full hover:bg-google-red/10 text-google-red" aria-label="Remove">${icon('x')}</button></div>`;
const personRow = (r = {}, roles) => `<div data-row class="grid grid-cols-[1fr_auto_auto] gap-2 items-center rounded-2xl bg-brandBgSecondary p-2">
  <select data-f="person_id" class="field" aria-label="Person"><option value="">Choose person</option>${(cache.people || []).map(p => `<option value="${p.id}" ${r.person_id === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
  <select data-f="role" class="field !w-auto" aria-label="Role">${roles.map(x => `<option ${r.role === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
  <button type="button" data-remove class="w-9 h-9 grid place-items-center rounded-full hover:bg-google-red/10 text-google-red" aria-label="Remove">${icon('x')}</button></div>`;

const spotlightRow = (r = {}) => `<div data-row class="grid grid-cols-[1fr_auto] gap-2 rounded-2xl bg-brandBgSecondary p-2">
  <input data-f="title" value="${esc(r.title)}" placeholder="What for, e.g. Won the GDG AU Hackathon" class="field" aria-label="Spotlight title" />
  <button type="button" data-remove class="w-9 h-9 self-center grid place-items-center rounded-full hover:bg-google-red/10 text-google-red" aria-label="Remove">${icon('x')}</button>
  <div class="col-span-2 grid gap-2 sm:grid-cols-[auto_1fr]">
    <input data-f="featured_on" type="date" value="${esc(r.featured_on || today())}" class="field" aria-label="Featured on" />
    <select data-f="event_id" class="field" aria-label="Event (optional)"><option value="">No event</option>${(cache.events || []).map(e => `<option value="${e.id}" ${r.event_id === e.id ? 'selected' : ''}>${esc(e.title)}</option>`).join('')}</select>
  </div>
  <textarea data-f="quote" rows="2" placeholder="Quote (optional)" class="field col-span-2" aria-label="Spotlight quote">${esc(r.quote)}</textarea></div>`;

async function openEditor(table, row) {
  const s = SCHEMAS[table];
  if (s.fields.some(f => f.type === 'event' || f.type === 'spotlights')) await load('events');
  editing = { table, row };
  $('#drawer-title').textContent = row ? `Edit ${s.one}` : `New ${s.one}`;
  $('#editor-fields').innerHTML = s.fields.map(f => fieldHtml(f, row?.[f.k])).join('');
  $('#delete-btn').hidden = !row;
  const d = $('#drawer');
  d.hidden = false;
  requestAnimationFrame(() => d.classList.add('active'));
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#editor-fields input')?.focus(), 60);
}
function closeEditor() {
  const d = $('#drawer');
  d.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(() => { d.hidden = true; }, 300);
}
$$('[data-close-drawer]').forEach(b => b.addEventListener('click', closeEditor));
$('#drawer').addEventListener('click', (e) => { if (e.target.id === 'drawer') closeEditor(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#drawer').hidden) closeEditor(); });

$('#editor-fields').addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (add) {
    const list = $(`[data-list="${add.dataset.add}"]`);
    const kind = add.dataset.add;
    list.insertAdjacentHTML(kind === 'spotlights' ? 'afterbegin' : 'beforeend', kind === 'materials' ? materialRow() : kind === 'spotlights' ? spotlightRow() : personRow({}, list.dataset.roles.split('|')));
    $(`[data-row]:${kind === 'spotlights' ? 'first' : 'last'}-child input, [data-row]:last-child select`, list)?.focus();
  }
  const rm = e.target.closest('[data-remove]');
  if (rm) rm.closest('[data-row]').remove();
});

// Resize to max 1400px WebP in the browser so uploads stay small on slow connections
$('#editor-fields').addEventListener('change', async (e) => {
  const input = e.target.closest('[data-upload]');
  if (!input?.files[0]) return;
  const key = input.dataset.upload;
  try {
    toast('Uploading...');
    const bmp = await createImageBitmap(input.files[0]);
    const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
    const c = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * scale), height: Math.round(bmp.height * scale) });
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    let blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.8));
    if (blob.size > 550 * 1024) blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.6));
    const { url } = await api('upload', { method: 'POST', body: blob, headers: { 'content-type': 'image/webp' } });
    $(`[name="${key}"]`, $('#editor')).value = url;
    const prev = $(`[data-preview="${key}"]`);
    prev.src = url;
    prev.classList.remove('hidden');
    toast('Image uploaded');
  } catch (err) { toast(err.message, true); }
});

$('#editor').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { table, row } = editing;
  const s = SCHEMAS[table];
  const form = $('#editor');
  const body = {};
  for (const f of s.fields) {
    if (f.type === 'check') body[f.k] = $(`[name="${f.k}"]`, form).checked;
    else if (f.type === 'when') {
      const d = $(`[name="${f.k}__date"]`, form).value, t = $(`[name="${f.k}__time"]`, form).value;
      body[f.k] = d ? (t ? `${d}T${t}:00+02:00` : d) : '';
    } else if (f.type === 'materials' || f.type === 'people' || f.type === 'spotlights') {
      body[f.k] = $$(`[data-list="${f.k}"] [data-row]`, form).map(r => Object.fromEntries($$('[data-f]', r).map(i => [i.dataset.f, i.value.trim()])))
        .filter(x => ({ materials: x.url, people: x.person_id, spotlights: x.title })[f.type]);
      if (f.type === 'spotlights') body[f.k] = body[f.k].map(x => ({ ...x, featured_on: x.featured_on || today() }));
      if (f.type === 'people') body[f.k] = body[f.k].map(x => ({ ...x, person_id: Number(x.person_id) }));
    } else body[f.k] = $(`[name="${f.k}"]`, form).value.trim();
  }
  if (table === 'posts' && body.status === 'published' && !body.published_at) body.published_at = new Date().toISOString();
  const missing = s.fields.find(f => f.req && !body[f.k]);
  if (missing) { toast(`${missing.label} is required`, true); return; }
  const bad = s.fields.filter(f => f.type === 'url' && body[f.k] && !/^https?:\/\//.test(body[f.k]));
  if (bad.length) { toast(`${bad[0].label} must start with https://`, true); return; }
  if (body.materials?.some(m => !/^https?:\/\//.test(m.url))) { toast('Material links must start with https://', true); return; }

  const btn = $('button[type=submit]', form);
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    if (row) await api(`${table}/${row.id}`, { method: 'PUT', body: JSON.stringify(body) });
    else await api(table, { method: 'POST', body: JSON.stringify(body) });
    btn.textContent = 'Saved';
    toast('Saved. It is live on the site.');
    delete cache[table];
    closeEditor();
    renderList(table);
  } catch (err) { toast(err.message, true); }
  finally { setTimeout(() => { btn.disabled = false; btn.textContent = 'Save'; }, 800); }
});

$('#delete-btn').addEventListener('click', async () => {
  const { table, row } = editing;
  if (!row || !confirm(`Delete "${row.title || row.name}"? This can't be undone.`)) return;
  try { await api(`${table}/${row.id}`, { method: 'DELETE' }); toast('Deleted'); delete cache[table]; closeEditor(); renderList(table); }
  catch (err) { toast(err.message, true); }
});

// Theme toggle (same behaviour as the public site)
$$('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch { /* ignore */ }
}));

boot();
