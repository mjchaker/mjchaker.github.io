# mjchaker.github.io

My personal website — software projects, music, and contact. Live at
**https://mjchaker.github.io**.

A self-contained static site: no build step, no dependencies. GitHub Pages
publishes the repo root automatically on every push to `main` (the `.nojekyll`
file skips Jekyll processing so files are served as-is).

## Structure

- `index.html` — all content and structure
- `styles.css` — theming (dark/light), layout, animations
- `script.js` — theme toggle + scroll-reveal animations
- `assets/favicon/` — favicon set; `assets/images/` — photos;
  `assets/documents/` — résumé PDF
- `google1a83046248a4a128.html`, `verification/`, `.well-known/` — Google and
  Bluesky site-verification files (don't delete)

## Updating content

- **Projects** — the "Project Two" / "Project Three" cards in `index.html` are
  placeholders; swap in real work with links and outcome-focused blurbs.
- **Music** — Spotify and Apple Music artist embeds are already wired up.
- **Résumé** — replace `assets/documents/resume_public.pdf`.

The previous Jekyll site (blog posts, about/resume/artistry pages) is
preserved in git history prior to the "Replace Jekyll site" commit.

## Local preview

Open `index.html` in a browser — that's it.
