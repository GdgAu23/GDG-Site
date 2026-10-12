-- GDG Africa University: D1 schema
-- Apply: npx wrangler d1 migrations apply gdg-au --remote   (use --local for dev)
-- Times are ISO 8601 strings. Event times include the Harare offset (+02:00).

-- People: core team, speakers, and members who showcase work.
CREATE TABLE people (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  headline TEXT,                -- e.g. "Computer Science, class of 2027"
  bio TEXT,
  path TEXT,                    -- web|mobile|game|ai|cloud|design|data|security
  image TEXT,                   -- /media/:id or https URL
  github TEXT, linkedin TEXT, website TEXT,
  core_role TEXT,               -- set => listed on the core team (e.g. "Chapter Lead")
  sort INTEGER NOT NULL DEFAULT 0,
  spotlight_quote TEXT,         -- set + is_spotlight => member of the week
  is_spotlight INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- Events are also the semester plan: every workshop/session is an event.
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'workshop',   -- workshop|study-jam|talk|hackathon|community
  path TEXT,                                -- which learning path it belongs to, if any
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  location TEXT,
  online INTEGER NOT NULL DEFAULT 0,
  register_url TEXT,
  summary TEXT,                             -- one or two sentences for cards
  body TEXT,                                -- markdown: agenda, prep, recap
  cover TEXT,
  status TEXT NOT NULL DEFAULT 'published', -- draft|published|cancelled
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX events_starts ON events(status, starts_at);

-- Slides, code, recordings and links shared for a session.
CREATE TABLE materials (
  id INTEGER PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'link',        -- slides|code|recording|doc|link
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX materials_event ON materials(event_id, sort);

-- Who took part in an event (speaker, organiser, mentor, winner...). Drives profiles.
CREATE TABLE event_people (
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'Speaker',
  PRIMARY KEY (event_id, person_id)
);

CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  story TEXT,                               -- markdown: problem, how it was built, what's next
  tags TEXT,                                -- comma separated
  path TEXT,
  image TEXT,
  demo_url TEXT, repo_url TEXT,
  is_startup INTEGER NOT NULL DEFAULT 0,
  needs_help INTEGER NOT NULL DEFAULT 0,
  help_text TEXT,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,  -- e.g. built at the hackathon
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE project_people (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'Contributor',
  PRIMARY KEY (project_id, person_id)
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,                       -- markdown
  cover TEXT,
  tags TEXT,
  author_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',     -- draft|published
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX posts_pub ON posts(status, published_at);

-- Student packs / free tools.
CREATE TABLE resources (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  badge TEXT,
  sort INTEGER NOT NULL DEFAULT 0
);

-- Inbox: everything the public submits.
CREATE TABLE members (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  academic_year TEXT, department TEXT, interests TEXT, motivation TEXT,
  status TEXT NOT NULL DEFAULT 'new',       -- new|welcomed|archived
  welcomed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE applications (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL,                       -- lead|collab
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,                                -- lead role applied for
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE subscribers (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- Admin-uploaded images, resized client-side to ~60KB WebP. Swap for R2 if it gets enabled.
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  data BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
