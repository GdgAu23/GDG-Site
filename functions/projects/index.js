import { renderPage } from '../_lib/page.js';
import { projects } from '../_lib/db.js';
import { projectCard, empty } from '../_lib/views.js';

export async function onRequestGet(ctx) {
  const list = await projects(ctx.env.DB);
  return renderPage(ctx, {
    slots: {
      projects: list.length ? list.map(projectCard).join('')
        : empty('The first projects are on their way.', 'Members are building now. Bring your own idea to any session.'),
    },
  });
}
