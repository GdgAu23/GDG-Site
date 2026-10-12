// Hands email work to the Google Apps Script running in the club Gmail
// (integrations/apps-script). Fire-and-forget: a slow or missing script never blocks a form.
export function sendMail(ctx, payload) {
  const { APPS_SCRIPT_URL, APPS_SCRIPT_SECRET } = ctx.env;
  if (!APPS_SCRIPT_URL || !APPS_SCRIPT_SECRET) return false;
  ctx.waitUntil(fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...payload, secret: APPS_SCRIPT_SECRET }),
    redirect: 'manual', // Apps Script answers with a 302; the mail is already sent by then
  }).catch(() => {}));
  return true;
}
