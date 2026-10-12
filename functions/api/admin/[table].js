// GET /api/admin/:table  list rows (with child rows for events/projects)
// POST /api/admin/:table create a row
import { TABLES } from '../../_lib/admin-tables.js';
import { json, bad, readJson } from '../../_lib/util.js';
import { pick, saveChildren, loadChildren, uniqueSlug } from '../../_lib/admin-rows.js';

export async function onRequestGet({ params, env }) {
  const t = TABLES[params.table];
  if (!t) return bad('Unknown table', 404);
  const rows = (await env.DB.prepare(`SELECT * FROM ${params.table} ORDER BY ${t.order} LIMIT 2000`).all()).results;
  if (t.children) await loadChildren(env.DB, t, rows);
  return json(rows);
}

export async function onRequestPost({ params, env, request }) {
  const t = TABLES[params.table];
  if (!t || t.readOnly) return bad('Not editable', 404);
  const body = await readJson(request, 200000);
  const row = pick(t, body);
  for (const r of t.required || []) if (!row[r]) return bad(`${r} is required`);
  if (t.slugFrom) row.slug = await uniqueSlug(env.DB, params.table, row.slug || row[t.slugFrom]);
  const cols = Object.keys(row);
  const res = await env.DB.prepare(`INSERT INTO ${params.table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')}) RETURNING id`)
    .bind(...Object.values(row)).first();
  if (t.children) await saveChildren(env.DB, t, res.id, body);
  return json({ id: res.id, slug: row.slug }, { status: 201 });
}
