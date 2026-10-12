// POST /api/admin/upload: raw image body (the admin UI resizes to WebP first). Returns its public URL.
import { json, bad } from '../../_lib/util.js';

const MAX = 600 * 1024;
export async function onRequestPost({ request, env }) {
  const mime = request.headers.get('content-type') || '';
  if (!/^image\/(webp|jpeg|png|gif|svg\+xml)$/.test(mime) || mime.includes('svg')) return bad('Upload a WebP, JPEG, PNG or GIF image.');
  const buf = await request.arrayBuffer();
  if (buf.byteLength > MAX) return bad('Image is over 600KB even after resizing. Try a smaller one.');
  const id = crypto.randomUUID().replace(/-/g, '');
  await env.DB.prepare('INSERT INTO media (id, mime, data) VALUES (?, ?, ?)').bind(id, mime, buf).run();
  return json({ url: `/media/${id}` }, { status: 201 });
}
