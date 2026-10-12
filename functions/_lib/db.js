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
// `search` holds everything they did (talks, wins, spotlights, projects) so /people can filter on it.
export const showcasePeople = (db) => all(db.prepare(`SELECT p.*,
    (SELECT COUNT(*) FROM project_people pp WHERE pp.person_id = p.id) AS project_count,
    (SELECT COUNT(*) FROM event_people ep WHERE ep.person_id = p.id) AS event_count,
    (SELECT title FROM spotlights s WHERE s.person_id = p.id AND s.featured_on <= ?1 ORDER BY featured_on DESC LIMIT 1) AS spotlight_title,
    concat_ws(' ', p.name, p.headline, p.core_role, p.path,
      (SELECT group_concat(ep.role || ' ' || e.title, ' ') FROM event_people ep JOIN events e ON e.id = ep.event_id WHERE ep.person_id = p.id AND e.status != 'draft'),
      (SELECT group_concat(pr.title || ' ' || COALESCE(pr.tags, ''), ' ') FROM project_people pp JOIN projects pr ON pr.id = pp.project_id WHERE pp.person_id = p.id AND pr.status = 'published'),
      (SELECT group_concat(s.title, ' ') FROM spotlights s WHERE s.person_id = p.id AND s.featured_on <= ?1)) AS search
  FROM people p ORDER BY (core_role IS NULL), sort, name`).bind(todayHarare()));

// Spotlights dated today or earlier, newest first. The first one is the current member of the week.
export const spotlights = (db, limit = 100) => all(db.prepare(`SELECT s.*, p.slug, p.name, p.image, p.headline, p.core_role, e.slug AS event_slug, e.title AS event_title
  FROM spotlights s JOIN people p ON p.id = s.person_id LEFT JOIN events e ON e.id = s.event_id
  WHERE s.featured_on <= ? ORDER BY s.featured_on DESC, s.id DESC LIMIT ?`).bind(todayHarare(), limit));

export const spotlight = async (db) => (await spotlights(db, 1))[0] || null;

export async function personBySlug(db, slug) {
  const person = await db.prepare(`SELECT * FROM people WHERE slug = ?`).bind(slug).first();
  if (!person) return null;
  const [projectsOf, eventsOf, postsOf, spotlightsOf] = await Promise.all([
    all(db.prepare(`SELECT p.*, pp.role FROM project_people pp JOIN projects p ON p.id = pp.project_id WHERE pp.person_id = ? AND p.status = 'published' ORDER BY p.created_at DESC`).bind(person.id)),
    all(db.prepare(`SELECT e.*, ep.role FROM event_people ep JOIN events e ON e.id = ep.event_id WHERE ep.person_id = ? AND e.status != 'draft' ORDER BY e.starts_at DESC`).bind(person.id)),
    all(db.prepare(`SELECT slug, title, excerpt, published_at FROM posts WHERE author_id = ? AND status = 'published' ORDER BY published_at DESC`).bind(person.id)),
    all(db.prepare(`SELECT s.*, e.slug AS event_slug, e.title AS event_title FROM spotlights s LEFT JOIN events e ON e.id = s.event_id
      WHERE s.person_id = ? AND s.featured_on <= ? ORDER BY s.featured_on DESC`).bind(person.id, todayHarare())),
  ]);
  return { ...person, projects: projectsOf, events: eventsOf, posts: postsOf, spotlights: spotlightsOf };
}

export const posts = (db, limit = 50) => all(db.prepare(`SELECT po.*, pe.name AS author_name, pe.slug AS author_slug
  FROM posts po LEFT JOIN people pe ON pe.id = po.author_id
  WHERE po.status = 'published' ORDER BY po.published_at DESC LIMIT ?`).bind(limit));

export const postBySlug = (db, slug) => db.prepare(`SELECT po.*, pe.name AS author_name, pe.slug AS author_slug, pe.image AS author_image, pe.headline AS author_headline
  FROM posts po LEFT JOIN people pe ON pe.id = po.author_id WHERE po.slug = ? AND po.status = 'published'`).bind(slug).first();

export const resources = (db) => all(db.prepare(`SELECT * FROM resources ORDER BY sort, id`));
