import { readJson, bad, json } from './util.js';

// Shared front door for public forms: JSON only, size-capped, honeypot-checked.
export async function formInput(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) return { error: bad('Expected JSON', 415) };
  let body;
  try { body = await readJson(request); } catch (e) { return { error: bad(e.message) }; }
  // Bots fill every field; humans never see "website". Pretend success.
  if (body.website) return { error: json({ ok: true }) };
  return { body };
}
