// GET /api/admin/export?table=members  CSV download of an inbox table.
import { bad } from '../../_lib/util.js';

const ALLOWED = { members: 'created_at DESC', applications: 'created_at DESC', subscribers: 'created_at DESC' };
// Leading = + - @ would run as a formula in Excel/Sheets; prefix with ' to neutralise.
const cell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCsv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  return [cols.join(','), ...rows.map(r => cols.map(c => cell(r[c])).join(','))].join('\n');
}

export async function onRequestGet({ request, env }) {
  const table = new URL(request.url).searchParams.get('table');
  if (!ALLOWED[table]) return bad('Unknown table');
  const rows = (await env.DB.prepare(`SELECT * FROM ${table} ORDER BY ${ALLOWED[table]}`).all()).results;
  return new Response(toCsv(rows), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${table}-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
