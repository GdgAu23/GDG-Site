# GDG Africa University

The website of Google Developer Groups on Campus, Africa University (Mutare, Zimbabwe):
events with their slides and recordings, member projects and profiles, a learning hub, and a blog
that always has something new.

**Live:** <https://gdg-africa-university.pages.dev> · **Admin:** `/admin` (club Google account only)

## How it's built

Plain HTML, Tailwind and a little vanilla JS, served by **Cloudflare Pages**. Dynamic pages are
rendered on Cloudflare's edge by **Pages Functions** reading a **D1** (SQLite) database, so visitors
get finished HTML in one request (fast on slow connections, readable by Google).

```
index.html, events.html, ...   Page shells. Static copy lives here; data-slot="x" marks where data goes
templates/page.html            Shell for detail pages (event, project, person, post)
partials/                      Shared head, nav, footer, modals. Stamped into every page on build
css/app.css                    Design tokens + Tailwind entry (compiled on build, no CDN)
js/site.js                     Public UI: theme toggle, menu, modals, forms, filters
js/hero.js                     Homepage physics hero (Matter.js, skipped on data-saver/2G)
js/admin.js                    Admin dashboard
functions/                     Server routes (file path = URL)
  index.js, events/, projects/, people/, blog/, learn.js, sitemap.xml.js
  api/join.js, apply.js, subscribe.js     Public form endpoints
  api/admin/                   Admin API (Google sign-in session required)
  _lib/                        Shared: db queries, HTML views, auth, markdown, tech feed
migrations/                    D1 schema and seed (numbered, applied in order)
workers/weekly-cron/           Tiny Worker that triggers the Monday email (Pages has no scheduler)
scripts/build.mjs              Build: partials -> Tailwind -> icon sprite -> dist/
tests/                         Vitest tests for the server logic
```

## Work on it locally

Needs Node 20+.

```bash
npm install
cp .dev.vars.example .dev.vars        # local secrets; lets you sign into /admin without Google
npm run db:migrate:local              # creates a local copy of the database
npm run dev                           # http://localhost:8788  (admin: /admin -> "Dev sign-in")
npm test
```

`npm run dev` builds once. After editing HTML, CSS or a partial, run `npm run build` again
(functions reload by themselves).

## Common changes

| I want to... | Do this |
|---|---|
| Add or edit events, slides, projects, people, posts, packs | Use `/admin`. No code. |
| Change wording on a page | Edit the matching `.html` file |
| Change the nav or footer | Edit `partials/nav.html` / `footer.html`, then `npm run build` |
| Change how an event/project card looks | `functions/_lib/views.js` |
| Add a database column | New file in `migrations/` (e.g. `0003_add_x.sql`), add the column to `functions/_lib/admin-tables.js` and a field in `SCHEMAS` in `js/admin.js` |
| Add an icon | Use `icon('name')` (server) or `<use href="/img/icons.svg#name">`. Names from <https://phosphoricons.com>; the build adds it to the sprite |
| Update the Learn page rankings | Regenerate the numbers from the cited sources and edit `learn.html` |

Design rules (colours, type, shapes, motion) are in [DESIGN.md](DESIGN.md).

## Deploy

```bash
npm run db:migrate:remote   # only when migrations/ changed
npm run deploy              # builds dist/ and uploads it with the functions
```

Needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in your environment (Pages + D1 edit permissions).
**Never deploy the repo root**: only `dist/` (the build whitelists public files).

To deploy automatically on every push instead: Cloudflare dashboard > Workers & Pages >
`gdg-africa-university` > Settings > Builds > connect `GdgAu23/GDG-Site`, build command
`npm run build`, output directory `dist`.

## Admin setup (once)

### 1. Session secret
```bash
openssl rand -hex 32 | npx wrangler pages secret put SESSION_SECRET --project-name gdg-africa-university
```

### 2. Google sign-in
Only accounts listed in `ADMIN_EMAILS` (`wrangler.jsonc`) can get in. To create the client ID:

1. As **gdscau2023@gmail.com**, open <https://console.cloud.google.com>, create a project (e.g. "GDG AU site").
2. Go to **Google Auth Platform** (older consoles: APIs & Services > OAuth consent screen). Set the app
   name and support email, audience **External**. Under **Audience > Test users**, add
   `gdscau2023@gmail.com`. Basic sign-in (name, email) doesn't need Google's review.
3. **Clients > Create client > Web application**. Under **Authorized JavaScript origins** add
   `https://gdg-africa-university.pages.dev` and `http://localhost:8788` (and your domain later).
4. Copy the **Client ID** into `GOOGLE_CLIENT_ID` in `wrangler.jsonc`, commit, and deploy. (The client
   *secret* is not used: the site verifies Google's signed token with Google's public keys.)

If the button shows but sign-in fails, the browser console says "The given origin is not allowed":
the site's address is missing from Authorized JavaScript origins. Changes can take a few minutes.

To add another admin, add their Gmail to `ADMIN_EMAILS` (comma separated) and deploy.

### 3. Emails (Resend)

The site sends mail through [Resend](https://resend.com): new-member and application alerts to
`ADMIN_NOTIFY`, a welcome email to each new member, and every Monday at 07:00 (Harare) the
WhatsApp-ready post plus the newsletter to subscribers.

```bash
npx wrangler pages secret put RESEND_API_KEY --project-name gdg-africa-university   # send-only key is enough
openssl rand -hex 32   # use the same value for both:
npx wrangler pages secret put CRON_SECRET --project-name gdg-africa-university
npx wrangler secret put CRON_SECRET --config workers/weekly-cron/wrangler.jsonc
npx wrangler deploy --config workers/weekly-cron/wrangler.jsonc
```

**Emails to students need your own domain.** Until one is verified, Resend only delivers from
`onboarding@resend.dev` to the Resend account owner, so the site sends admin alerts only and skips
welcome emails and the newsletter (the admin Overview shows this). To switch them on:

1. Buy a domain (Cloudflare dashboard > Domain Registration, about US$10/yr for .com/.org).
2. Resend > Domains > Add domain > copy the DNS records it shows into Cloudflare DNS for that domain. Wait for "Verified".
3. In `wrangler.jsonc` set `MAIL_FROM` to e.g. `GDG Africa University <hello@yourdomain.org>`, then `npm run deploy`.
4. Optional but recommended: Cloudflare Pages > Custom domains > add the domain; add it to the Google
   client's Authorized JavaScript origins; update `SITE` in `functions/_lib/page.js` and `SITE_URL` in
   `workers/weekly-cron/wrangler.jsonc`.

Resend's free plan allows 100 emails a day and 3,000 a month.

## WhatsApp

WhatsApp doesn't allow websites to post into an existing group safely (its official API only works
for verified business numbers and groups of up to 8). Instead, every event in admin has a
**WhatsApp** button that opens WhatsApp with the message ready, the Overview page has "This week's
WhatsApp post", and the Monday email to the club inbox has the same one-tap link.

## Content sources

- Tech feed on the blog and homepage: [DEV Community API](https://developers.forem.com/api), cached
  for an hour at the edge.
- Learn page rankings: Stack Overflow Developer Survey 2025, TIOBE Index (October 2026), GitHub
  Octoverse 2025 and the WEF Future of Jobs Report 2025, each linked next to its chart.
