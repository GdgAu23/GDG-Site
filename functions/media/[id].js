// GET /media/:id: admin-uploaded images stored in D1. Immutable ids, so cache hard.
export async function onRequestGet(ctx) {
  const row = await ctx.env.DB.prepare('SELECT mime, data FROM media WHERE id = ?').bind(ctx.params.id).first();
  if (!row) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(row.data), { headers: { 'content-type': row.mime, 'cache-control': 'public, max-age=31536000, immutable' } });
}
