import { renderPage } from '../_lib/page.js';
import { showcasePeople } from '../_lib/db.js';
import { personCard, empty } from '../_lib/views.js';

export async function onRequestGet(ctx) {
  const list = await showcasePeople(ctx.env.DB);
  return renderPage(ctx, {
    slots: {
      people: list.length ? list.map(personCard).join('')
        : empty('Profiles are coming.', 'Speak at a session or ship a project and you get a page here.'),
    },
  });
}
