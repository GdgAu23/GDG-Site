-- Spotlight history: every time someone is featured (won a hackathon, gave a talk, shipped something).
-- The newest entry dated today or earlier is the homepage "member of the week".
CREATE TABLE spotlights (
  id INTEGER PRIMARY KEY,
  person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  title TEXT NOT NULL,          -- e.g. "Won the GDG AU Hackathon 2026"
  quote TEXT,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
  featured_on TEXT NOT NULL,    -- YYYY-MM-DD
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX spotlights_date ON spotlights(featured_on);

-- Carry over anyone flagged with the old single-spotlight checkbox.
INSERT INTO spotlights (person_id, title, quote, featured_on)
  SELECT id, 'Member of the week', spotlight_quote, substr(created_at, 1, 10) FROM people WHERE is_spotlight = 1;
