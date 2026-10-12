// PUT /api/admin/:table/:id  update.  DELETE /api/admin/:table/:id  remove.
import { TABLES } from '../../../_lib/admin-tables.js';
import { json, bad, readJson } from '../../../_lib/util.js';
import { pick, saveChildren, uniqueSlug } from '../../../_lib/admin-rows.js';

const keyOf = (t) => t.key || 'id';

export async function onRequestPut({ params, env, request }) {
  const t = TABLES[params.table];
  if (!t) return bad('Unknown table', 404);
  const body = await readJson(request, 200000);
  const row = pick(t, body);
  if (t.slugFrom && 'slug' in row) row.slug = await uniqueSlug(env.DB, params.table, row.slug || body[t.slugFrom], Number(params.id));
  if (t.touch) row.updated_at = new Date().toISOString();
  const cols = Object.keys(row);
  if (cols.length) {
    await env.DB.prepare(`UPDATE ${params.table} SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE ${keyOf(t)} = ?`)
      .bind(...Object.values(row), params.id).run();
  }
  if (t.children) await saveChildren(env.DB, t, Number(params.id), body);
  return json({ ok: true, slug: row.slug });
}

export async function onRequestDelete({ params, env }) {
  const t = TABLES[params.table];
  if (!t) return bad('Unknown table', 404);
  await env.DB.prepare(`DELETE FROM ${params.table} WHERE ${keyOf(t)} = ?`).bind(params.id).run();
  return json({ ok: true });
}
