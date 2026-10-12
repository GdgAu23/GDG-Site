// /events: the whole semester. Upcoming sessions first, then past ones with their materials.
import { renderPage } from '../_lib/page.js';
import { upcomingEvents, pastEvents } from '../_lib/db.js';
import { eventRow, empty } from '../_lib/views.js';

export async function onRequestGet(ctx) {
  const [upcoming, past] = await Promise.all([upcomingEvents(ctx.env.DB), pastEvents(ctx.env.DB)]);
  return renderPage(ctx, {
    slots: {
      upcoming: upcoming.length ? upcoming.map((e, i) => eventRow(e, i)).join('')
        : empty('Nothing scheduled yet.', 'The next sessions are being planned. Join the WhatsApp group to hear first.'),
      past: past.length ? past.map((e, i) => eventRow(e, i, { past: true })).join('')
        : empty('No past sessions yet.', 'Slides, code and recordings appear here after each session.'),
      'upcoming-count': String(upcoming.length),
      'past-count': String(past.length),
    },
  });
}
