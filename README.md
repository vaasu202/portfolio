# Vaasu Sohee — Portfolio

A responsive portfolio for Vaasu Sohee, focused on production machine learning, data engineering, GenAI systems, applied research, and measurable business impact.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Build

```bash
pnpm build
```

The static site is written to `out/`.

## Publish with GitHub Pages

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. The included workflow publishes the site automatically after every push to `main`.

The workflow handles both project sites (`username.github.io/repository`) and user sites (`username.github.io`).

## Main content

- `app/page.tsx` — portfolio content
- `app/globals.css` — visual system and responsive layout
- `public/resume.pdf` — downloadable résumé
- `public/og.png` — social sharing artwork
- `.github/workflows/deploy-pages.yml` — GitHub Pages deployment
