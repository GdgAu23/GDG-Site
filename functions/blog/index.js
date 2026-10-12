// /blog: club posts plus a live tech feed so there's always something to read.
import { renderPage } from '../_lib/page.js';
import { posts } from '../_lib/db.js';
import { techFeed } from '../_lib/feed.js';
import { postCard, feedCard, empty } from '../_lib/views.js';

export async function onRequestGet(ctx) {
  const [list, feed] = await Promise.all([posts(ctx.env.DB), techFeed(ctx, { limit: 30 })]);
  return renderPage(ctx, {
    slots: {
      posts: list.length ? list.map(postCard).join('')
        : empty('Club posts are coming.', 'Event recaps, tutorials and member stories land here. Want to write one? Message the team.'),
      feed: feed.length ? feed.map(feedCard).join('')
        : empty('The tech feed is resting.', 'We couldn’t reach DEV Community just now. Refresh in a minute.'),
    },
    remove: list.length ? [] : ['[data-hide-if-no-posts]'],
  });
}
