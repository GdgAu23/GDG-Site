import { renderPage } from '../_lib/page.js';
import { showcasePeople, spotlights } from '../_lib/db.js';
import { personCard, spotlightRow, empty } from '../_lib/views.js';

export async function onRequestGet(ctx) {
  const [list, stars] = await Promise.all([showcasePeople(ctx.env.DB), spotlights(ctx.env.DB)]);
  return renderPage(ctx, {
    slots: {
      people: list.length ? list.map(personCard).join('')
        : empty('Profiles are coming.', 'Speak at a session or ship a project and you get a page here.'),
      spotlights: stars.map((s, i) => spotlightRow(s, i)).join(''),
    },
    remove: stars.length ? [] : ['#spotlights'],
  });
}
