// Monday 07:00 Harare (05:00 UTC): asks the site to send the weekly WhatsApp post and newsletter.
// Pages has no scheduler, so this tiny Worker is the clock. Logic lives in functions/api/mail/weekly.js.
export default {
  async scheduled(event, env, ctx) {
    const res = await fetch(`${env.SITE_URL}/api/mail/weekly`, { method: 'POST', headers: { 'x-cron-secret': env.CRON_SECRET } });
    const body = await res.text();
    if (!res.ok) throw new Error(`weekly mail failed: ${res.status} ${body}`); // shows in Worker logs
    console.log('weekly mail', body);
  },
};
