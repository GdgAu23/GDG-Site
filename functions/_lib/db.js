// Read queries for public pages. Writes live in the API handlers.
import { todayHarare } from './util.js';

const all = async (stmt) => (await stmt.all()).results || [];

// Date-only rows compare as strings against today's date; timed rows against now.
// substr(starts_at,1,10) works for both shapes.
export async function upcomingEvents(db, limit = 50) {
  return all(db.prepare(`SELECT * FROM events WHERE status != 'draft' AND substr(starts_at,1,10) >= ?
    ORDER BY starts_at ASC LIMIT ?`).bind(todayHarare(), limit));
}

export async function pastEvents(db, limit = 100) {
  return all(db.prepare(`SELECT e.*, (SELECT COUNT(*) FROM materials m WHERE m.event_id = e.id) AS material_count
    FROM events e WHERE status != 'draft' AND substr(starts_at,1,10) < ?
    ORDER BY starts_at DESC LIMIT ?`).bind(todayHarare(), limit));
}

export async function eventBySlug(db, slug) {
  const ev = await db.prepare(`SELECT * FROM events WHERE slug = ? AND status != 'draft'`).bind(slug).first();
  if (!ev) return null;
  const [materials, people, projects] = await Promise.all([
    all(db.prepare(`SELECT * FROM materials WHERE event_id = ? ORDER BY sort, id`).bind(ev.id)),
    all(db.prepare(`SELECT p.*, ep.role FROM event_people ep JOIN people p ON p.id = ep.person_id WHERE ep.event_id = ? ORDER BY p.name`).bind(ev.id)),
    all(db.prepare(`SELECT * FROM projects WHERE event_id = ? AND status = 'published'`).bind(ev.id)),
  ]);
  return { ...ev, materials, people, projects };
}

export async function projects(db, limit = 100) {
  return all(db.prepare(`SELECT * FROM projects WHERE status = 'published'
    ORDER BY is_startup DESC, created_at DESC LIMIT ?`).bind(limit));
}

export async function projectBySlug(db, slug) {
  const p = await db.prepare(`SELECT * FROM projects WHERE slug = ? AND status = 'published'`).bind(slug).first();
  if (!p) return null;
  const [people, event] = await Promise.all([
    all(db.prepare(`SELECT pe.*, pp.role FROM project_people pp JOIN people pe ON pe.id = pp.person_id WHERE pp.project_id = ? ORDER BY pe.name`).bind(p.id)),
    p.event_id ? db.prepare(`SELECT slug, title, starts_at FROM events WHERE id = ?`).bind(p.event_id).first() : null,
  ]);
  return { ...p, people, event };
}

export const coreTeam = (db) => all(db.prepare(`SELECT * FROM people WHERE core_role IS NOT NULL AND core_role != '' ORDER BY sort, name`));

// Everyone with something to show: core team, speakers, contributors.
export const showcasePeople = (db) => all(db.prepare(`SELECT p.*,
    (SELECT COUNT(*) FROM project_people pp WHERE pp.person_id = p.id) AS project_count,
    (SELECT COUNT(*) FROM event_people ep WHERE ep.person_id = p.id) AS event_count
  FROM people p ORDER BY (core_role IS NULL), sort, name`));

export const spotlight = (db) => db.prepare(`SELECT * FROM people WHERE is_spotlight = 1 ORDER BY id DESC LIMIT 1`).first();

export async function personBySlug(db, slug) {
  const person = await db.prepare(`SELECT * FROM people WHERE slug = ?`).bind(slug).first();
  if (!person) return null;
  const [projectsOf, eventsOf, postsOf] = await Promise.all([
    all(db.prepare(`SELECT p.*, pp.role FROM project_people pp JOIN projects p ON p.id = pp.project_id WHERE pp.person_id = ? AND p.status = 'published' ORDER BY p.created_at DESC`).bind(person.id)),
    all(db.prepare(`SELECT e.*, ep.role FROM event_people ep JOIN events e ON e.id = ep.event_id WHERE ep.person_id = ? AND e.status != 'draft' ORDER BY e.starts_at DESC`).bind(person.id)),
    all(db.prepare(`SELECT slug, title, excerpt, published_at FROM posts WHERE author_id = ? AND status = 'published' ORDER BY published_at DESC`).bind(person.id)),
  ]);
  return { ...person, projects: projectsOf, events: eventsOf, posts: postsOf };
}

export const posts = (db, limit = 50) => all(db.prepare(`SELECT po.*, pe.name AS author_name, pe.slug AS author_slug
  FROM posts po LEFT JOIN people pe ON pe.id = po.author_id
  WHERE po.status = 'published' ORDER BY po.published_at DESC LIMIT ?`).bind(limit));

export const postBySlug = (db, slug) => db.prepare(`SELECT po.*, pe.name AS author_name, pe.slug AS author_slug, pe.image AS author_image, pe.headline AS author_headline
  FROM posts po LEFT JOIN people pe ON pe.id = po.author_id WHERE po.slug = ? AND po.status = 'published'`).bind(slug).first();

export const resources = (db) => all(db.prepare(`SELECT * FROM resources ORDER BY sort, id`));
