# GDG Africa University: Design System

Direction: bold Google poster. Big tight display type, the four Google colours as flat
shapes, real club photos, light and dark mode via `prefers-color-scheme`.

## Tokens (`css/styles.css`, exposed to Tailwind in `js/tw.js`)

| Token | Light | Dark | Tailwind |
|---|---|---|---|
| `--bg-primary` page | `225 20% 97%` | `225 14% 7%` | `bg-brandBgPrimary` |
| `--bg-secondary` alt section | `225 18% 93%` | `225 12% 10%` | `bg-brandBgSecondary` |
| `--bg-tertiary` cards | white | `225 11% 13%` | `bg-brandBgTertiary` |
| `--text-primary` | `225 22% 9%` | `225 20% 95%` | `text-brandTextPrimary` |
| `--text-secondary` | `225 9% 34%` | `225 9% 70%` | `text-brandTextSecondary` |
| `--border-color` | `225 14% 86%` | `225 9% 21%` | `border-brandBorder` |

Google colours: blue `#1A73E8` (the **only** CTA colour, passes AA with white text),
red `#EA4335`, yellow `#FBBC04` (dark text only), green `#34A853`. Red/yellow/green are
role colours for tiles, tags and accents, never buttons.

## Type
- Display: **Bricolage Grotesque** 700/800, tracking -0.035em, leading 0.9-0.95
- Body: **Geist** 400-600
- Labels/meta: **Geist Mono** 12-13px, sentence case (no uppercase eyebrows)

## Shape
Cards and tiles `rounded-3xl` (24px). Buttons and chips full pill. Inputs `rounded-xl` (12px).
No drop shadows; elevation is a 1px border.

## Motion
- Hero: role tiles fall into a pile (Matter.js). Drag/throw with mouse, flick on touch, click a tile to jump to its path. Loop stops when the pile is still or off-screen. Reduced motion renders a pre-settled static frame.
- Reveal: `.scroll-reveal` fade + lift, staggered with `style="--i:N"`.
- Hover: image zoom inside a clipped frame (`.img-zoom`), arrow nudge (`.btn-arrow`).
- Press: `.btn-press` scales to 0.97 with a spring release. Forms show Send, Sending, Sent.
- One marquee per page (club photos). Everything collapses under `prefers-reduced-motion`.

## Page structure
- Shared `partials/head.html`, `nav.html`, `footer.html` are stamped into pages by `npm run partials`.
- Section IDs and form field names are relied on by `js/site.js` and Supabase. Don't rename them.
- `admin.html` is a separate dashboard with its own styles and is not part of this system.
