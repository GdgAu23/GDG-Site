import { slugify } from './util.js';

const BOOL = new Set(['online', 'is_startup', 'needs_help', 'is_spotlight']);
const INT = new Set(['sort', 'author_id', 'event_id', 'person_id']);

// Keep whitelisted columns only; '' becomes NULL so optional fields clear cleanly.
export function pick(t, body, cols = t.cols) {
  const row = {};
  for (const c of cols) {
    if (!(c in body)) continue;
    let v = body[c];
    if (BOOL.has(c)) v = v ? 1 : 0;
    else if (INT.has(c)) v = v === '' || v == null ? null : Number(v);
    else v = v === '' || v == null ? null : String(v).slice(0, 100000);
    row[c] = v;
  }
  return row;
}

export async function uniqueSlug(db, table, base, id = null) {
  const root = slugify(base);
  for (let n = 1; n < 50; n++) {
    const slug = n === 1 ? root : `${root}-${n}`;
    const hit = await db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).bind(slug).first();
    if (!hit || hit.id === id) return slug;
  }
  return `${root}-${Date.now()}`;
}

// Children (materials, linked people) are replaced as a set on every save.
export async function saveChildren(db, t, parentId, body) {
  const stmts = [];
  for (const [key, c] of Object.entries(t.children)) {
    if (!Array.isArray(body[key])) continue;
    stmts.push(db.prepare(`DELETE FROM ${c.table} WHERE ${c.fk} = ?`).bind(parentId));
    body[key].slice(0, 100).forEach((item, i) => {
      const row = pick({ cols: c.cols }, { sort: i, ...item });
      if (Object.values(row).every(v => v == null)) return;
      const cols = [c.fk, ...Object.keys(row)];
      stmts.push(db.prepare(`INSERT OR IGNORE INTO ${c.table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).bind(parentId, ...Object.values(row)));
    });
  }
  if (stmts.length) await db.batch(stmts);
}

export async function loadChildren(db, t, rows) {
  for (const [key, c] of Object.entries(t.children)) {
    const all = (await db.prepare(`SELECT * FROM ${c.table}`).all()).results;
    for (const r of rows) r[key] = all.filter(x => x[c.fk] === r.id).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  }
}
