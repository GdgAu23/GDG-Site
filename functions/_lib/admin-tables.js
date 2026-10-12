// What the admin may read and write. Columns not listed here are never touched.
export const TABLES = {
  events: {
    cols: ['slug', 'title', 'kind', 'path', 'starts_at', 'ends_at', 'location', 'online', 'register_url', 'summary', 'body', 'cover', 'status'],
    required: ['title', 'starts_at'], slugFrom: 'title', order: 'starts_at DESC', touch: true,
    children: {
      materials: { table: 'materials', fk: 'event_id', cols: ['label', 'url', 'kind', 'sort'] },
      people: { table: 'event_people', fk: 'event_id', cols: ['person_id', 'role'] },
    },
  },
  projects: {
    cols: ['slug', 'title', 'summary', 'story', 'tags', 'path', 'image', 'demo_url', 'repo_url', 'is_startup', 'needs_help', 'help_text', 'event_id', 'status'],
    required: ['title'], slugFrom: 'title', order: 'created_at DESC',
    children: { people: { table: 'project_people', fk: 'project_id', cols: ['person_id', 'role'] } },
  },
  people: {
    cols: ['slug', 'name', 'headline', 'bio', 'path', 'image', 'github', 'linkedin', 'website', 'core_role', 'sort'],
    required: ['name'], slugFrom: 'name', order: '(core_role IS NULL), sort, name',
    children: { spotlights: { table: 'spotlights', fk: 'person_id', cols: ['title', 'quote', 'event_id', 'featured_on'] } },
  },
  posts: {
    cols: ['slug', 'title', 'excerpt', 'body', 'cover', 'tags', 'author_id', 'status', 'published_at'],
    required: ['title', 'body'], slugFrom: 'title', order: 'COALESCE(published_at, created_at) DESC',
  },
  resources: { cols: ['title', 'description', 'url', 'badge', 'sort'], required: ['title', 'url'], order: 'sort, id' },
  // Inbox: public submissions. Admin can only change status or delete.
  members: { cols: ['status'], order: 'created_at DESC', readOnly: true },
  applications: { cols: ['status'], order: 'created_at DESC', readOnly: true },
  subscribers: { cols: [], order: 'created_at DESC', readOnly: true, key: 'email' },
};
