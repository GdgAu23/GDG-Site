-- Real content carried over from the old Supabase seeds (semester schedule,
-- student packs, student startups). Placeholder people/testimonials were left out.
-- Event times were never recorded, so starts_at holds dates only; set times in admin.

INSERT INTO people (slug, name, headline, path, github, core_role, sort) VALUES
  ('lesley-mutsambiwa', 'Lesley Mutsambiwa', 'Computer Science, class of 2027', 'web', 'https://github.com/Le-e-lab', 'Chapter Lead', 1);

INSERT INTO events (slug, title, kind, path, starts_at, location, online, summary) VALUES
  ('welcome-week-2026', 'Welcome Week: Semester Kickoff and Orientation', 'community', NULL, '2026-09-04', 'Africa University', 0, 'An intro to GDG Africa University, the roadmap for the term, and how to get involved in projects and startups.'),
  ('git-and-github-workflow', 'Intro to Git and GitHub Workflow', 'workshop', 'web', '2026-09-11', 'Online', 1, 'Branch, commit and open pull requests on a real group repo. Join from anywhere.'),
  ('web-dev-crash-course', 'Web Dev Crash Course: HTML, CSS and JavaScript', 'workshop', 'web', '2026-09-18', 'Africa University', 0, 'Build a responsive landing page from scratch and learn how the modern web stack fits together.'),
  ('cloud-study-jam-fundamentals', 'Cloud Study Jam: Google Cloud Fundamentals', 'study-jam', 'cloud', '2026-09-25', 'Online', 1, 'Earn your first Google Cloud skill badge with guided labs.'),
  ('android-and-kotlin', 'Mobile with Android and Kotlin', 'workshop', 'mobile', '2026-10-02', 'Online', 1, 'Hands-on Kotlin and Jetpack Compose: ship your first Android screen.'),
  ('flutter-weather-app', 'Flutter for Beginners: Build a Weather App', 'workshop', 'mobile', '2026-10-09', 'Africa University', 0, 'Cross-platform mobile development with Flutter by shipping a working weather app.'),
  ('ai-ml-study-group', 'AI and Machine Learning Study Group', 'study-jam', 'ai', '2026-10-16', 'Online', 1, 'ML fundamentals with TensorFlow and practical Kaggle exercises.'),
  ('hackathon-bootcamp', 'Hackathon Bootcamp: Team Formation and Ideation', 'community', NULL, '2026-10-23', 'Africa University', 0, 'Form teams, brainstorm problem statements and prepare for the AU Hackathon with mentors.'),
  ('gdg-au-hackathon-2026', 'GDG AU Hackathon 2026: 48-Hour Build Sprint', 'hackathon', NULL, '2026-10-30', 'Africa University', 0, '48 hours to design, build and demo a solution to a real campus problem.'),
  ('firebase-auth-database-hosting', 'Firebase Workshop: Auth, Database and Hosting', 'workshop', 'cloud', '2026-11-06', 'Online', 1, 'Add sign-in and a database, then deploy your hackathon project.'),
  ('portfolio-and-github-profile', 'Portfolio and GitHub Profile Mastery', 'workshop', NULL, '2026-11-13', 'Online', 1, 'Build a portfolio, write READMEs people actually read, and tidy up your GitHub.'),
  ('careers-in-tech-alumni-talk', 'Guest Talk: Careers in Tech from AU Alumni', 'talk', NULL, '2026-11-20', 'Online and Africa University', 1, 'Alumni working in software, data and cloud share how they got there.'),
  ('semester-showcase-2026', 'Semester Showcase: Project Demos and Wrap Party', 'community', NULL, '2026-11-27', 'Africa University', 0, 'Demo everything you built this semester and plan for next term.');

INSERT INTO projects (slug, title, summary, tags, demo_url, is_startup, needs_help, help_text) VALUES
  ('elevate-value-partners', 'Elevate Value Partners (EVP)', 'A Harare-based design and engineering studio founded by AU students, building brand identity through to production code for startups.', 'Startup, Web, AI', 'https://www.elevatevaluepartners.co.zw/', 1, 1, 'Looking for Flutter, AI and design collaborators this semester.'),
  ('tarisai', 'Tarisai', 'A creator valuation tool for Zimbabwe: a valuation based on live Instagram, TikTok or YouTube data, for African brands.', 'Startup, AI, Data', 'https://www.tarisai.co.zw/', 1, 1, 'Needs data engineering, brand partnerships and product volunteers.');

INSERT INTO resources (title, description, url, badge, sort) VALUES
  ('GitHub Student Developer Pack', 'GitHub Pro, Copilot, Codespaces and a long list of partner tools.', 'https://education.github.com/pack', 'Free', 1),
  ('Google Cloud for students', 'Free credits, always-free products and skill badges.', 'https://cloud.google.com/edu', 'Free credits', 2),
  ('JetBrains IDEs', 'IntelliJ IDEA, PyCharm, WebStorm and every JetBrains IDE.', 'https://www.jetbrains.com/community/education/', 'Free', 3),
  ('Figma Education', 'The professional Figma plan for students.', 'https://www.figma.com/education/', 'Free', 4),
  ('Microsoft Azure for Students', 'Azure credit plus free services, no card needed.', 'https://azure.microsoft.com/en-us/free/students/', 'Credit', 5),
  ('DigitalOcean', 'Platform credit for hosting and databases via the GitHub pack.', 'https://www.digitalocean.com/github-students', 'Credit', 6),
  ('MongoDB for Students', 'Atlas credit and free clusters for learning.', 'https://www.mongodb.com/students', 'Credit', 7),
  ('Notion for students', 'Free Plus plan for notes, projects and study planning.', 'https://www.notion.com/product/notion-for-education', 'Free', 8);
