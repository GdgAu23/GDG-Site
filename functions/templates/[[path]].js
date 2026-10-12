// Page templates are internal; they're fetched via env.ASSETS by the route functions.
export const onRequest = () => new Response('Not found', { status: 404 });
