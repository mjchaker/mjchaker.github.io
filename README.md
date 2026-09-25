# mjchaker.github.io

My personal website — software projects, music, and contact. Live at
**https://mjchaker.github.io**.

A self-contained static site: no build step, no dependencies. GitHub Pages
publishes the repo root automatically on every push to `main` (the `.nojekyll`
file skips Jekyll processing so files are served as-is).

## Structure

- `index.html` — all content and structure
- `styles.css` — theming (dark/light), layout, animations
- `script.js` — shared by every page: theme toggle, scroll-reveal, card
  spotlight, and party mode (the Konami code)
- `hero.js` — home page only: the live hydrogen-orbital field, the `mj-scheme`
  REPL (a small Scheme with exact bignums and proper tail calls — type
  `(help)`), the scrambling "currently" line, and the count-up stats
- `assets/favicon/` — favicon set; `assets/images/` — photos;
  `assets/documents/` — résumé PDF
- `google1a83046248a4a128.html`, `verification/`, `.well-known/` — Google and
  Bluesky site-verification files (don't delete)

## Updating content

- **Projects** — cards live in `index.html`; keep the `PROJECTS` table in
  `hero.js` (what `(projects)` / `(describe 'x)` return) and the project count
  in the stats strip in sync.
- **Music** — Spotify and Apple Music artist embeds are already wired up.
- **Résumé** — replace `assets/documents/MohamadChakerCV.pdf`.
- **Cache-busting** — bump the `?v=` query on `styles.css` / `script.js` /
  `hero.js` (index and blog pages) when changing them.

The previous Jekyll site (blog posts, about/resume/artistry pages) is
preserved in git history prior to the "Replace Jekyll site" commit.

## Local preview

Open `index.html` in a browser — that's it.
