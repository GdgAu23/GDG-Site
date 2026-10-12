# Club emails via Gmail (Apps Script)

The site can't send email on its own without a domain, so a small Google Apps Script runs inside
the club Gmail (`gdscau2023@gmail.com`) and sends from that address. Free; about 100 recipients/day.

It sends:
- a **welcome email** to every new member (with the next 3 sessions and the WhatsApp/Discord links)
- an **alert to the club inbox** for every new member and application
- every **Monday at 07:00**: a WhatsApp-ready post to the club inbox (one tap opens WhatsApp with the message),
  plus the weekly email to newsletter subscribers

## Setup (about 10 minutes, once)

1. Sign in to Google as **gdscau2023@gmail.com** and open <https://script.google.com> > **New project**.
   Name it `GDG AU mailer`.
2. Replace the contents of `Code.gs` with this folder's `Code.gs`. Save.
3. **Project Settings** (gear icon) > **Script properties** > add:
   - `SHARED_SECRET`: a long random string (e.g. run `openssl rand -hex 24`)
   - `SITE_URL`: `https://gdg-africa-university.pages.dev`
4. In the editor, pick the function `testWelcome` and click **Run**. Google asks for permission
   (send email as you, connect to external services): allow it. You should receive a sample welcome email.
5. Pick `installTriggers` and **Run** once. This schedules the Monday digest.
6. **Deploy** > **New deployment** > type **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone** (the shared secret is what protects it)
   Copy the **Web app URL**.
7. Give the site the URL and secret (from the repo folder):
   ```bash
   npx wrangler pages secret put APPS_SCRIPT_URL --project-name gdg-africa-university     # paste the web app URL
   npx wrangler pages secret put APPS_SCRIPT_SECRET --project-name gdg-africa-university  # paste SHARED_SECRET
   ```
   Then redeploy (`npm run deploy`). The admin Overview shows "Welcome emails connected" when it works.

If you edit `Code.gs` later: **Deploy > Manage deployments > Edit > New version**, or the old code keeps running.
