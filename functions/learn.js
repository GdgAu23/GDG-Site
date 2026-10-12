// /learn: mostly static guide; student packs come from the database so admins can edit them.
import { renderPage } from './_lib/page.js';
import { resources } from './_lib/db.js';
import { resourceCard } from './_lib/views.js';

export async function onRequestGet(ctx) {
  const list = await resources(ctx.env.DB);
  return renderPage(ctx, { slots: { packs: list.map(resourceCard).join('') } });
}
