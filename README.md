# Nastya Korenevych — portfolio

Product Designer (UX/UI) with design-to-code skills. This is the source of my portfolio site.

**Live:** https://nastya-korenevych.vercel.app

## How it was made

I designed the site in Figma: variables, components, every state and breakpoint. Then I built it with Claude Code. I set the tasks, read the code and review every state in the browser before anything is committed.

- Plain HTML, CSS and JavaScript. No frameworks, no libraries, no build step.
- **Tokens from Figma.** `assets/css/tokens.css` mirrors the Figma variables one to one. CSS names match the Figma *code syntax*, and the Figma *Mobile* mode becomes `@media (width < 768px)`. Components use only `var(--…)`, never raw values.
- **One CSS file per Figma component** in `assets/css/components/`. Class names follow the component names (`.case-card`, `.text-link`, `.contact-button`), and variants become modifiers (`--featured`).
- **JavaScript only where CSS can't do the job:** the mobile menu, hero motion, the cursor tag, code typing, the before/after slider, interactive demos in the case studies and copying the email. The page is complete and readable without JS.
- **Accessibility:** semantic landmarks, a skip link, visible focus on everything interactive, WCAG AA contrast, and a `prefers-reduced-motion` behaviour for every animation.

## What's inside

| Path | What it is |
|---|---|
| `en/` | The pages: Home, About, three case studies, a "case in progress" page |
| `assets/css/tokens.css` | Design tokens from Figma variables |
| `assets/css/components/` | One stylesheet per component |
| `assets/js/` | One script per behaviour |
| `docs/css-figma-cheatsheet.md` | My CSS ↔ Figma cheat sheet *(in Ukrainian)* |
| `scripts/check.py` | Automated checks: tokens only, no inline styles, links, `alt`, tag balance |

This repository is the published part of my private working repo. A script copies only an allowlist of files here and runs the checks first. Client materials and working notes stay private.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/en/
```

Use a local server rather than opening the file directly: pages link to each other with relative paths.

## License

- **Code** (HTML, CSS, JavaScript, scripts): [MIT](LICENSE).
- **Content** (texts, images, case study materials, CV): © 2026 Nastya Korenevych, all rights reserved. Client work is shown with permission.
- **Font** Commissioner: SIL Open Font License 1.1, see [`assets/fonts/OFL.txt`](assets/fonts/OFL.txt).
- **Icons** Tabler Icons: MIT, see [`THIRD-PARTY.md`](THIRD-PARTY.md).
