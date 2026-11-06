# vrishaliwedsvedant

Wedding invitation website for Vrishali & Vedant, in English (`/en/`) and Marathi (`/ma/`).

## Edit and build

1. Edit `src/template.html` (English text, layout, styles). Marathi text lives in `build.mjs`.
2. Run `node build.mjs`. It writes the finished site into `dist/`.
3. Preview by opening `dist/index.html`, or run `python -m http.server 8080 -d dist` and visit http://localhost:8080.

## Deploy on Cloudflare Pages

Workers & Pages → Create → Pages → Connect to Git → pick this repository, then:

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `node build.mjs` |
| Build output directory | `dist` |

Every push to `main` redeploys the site.

Link previews use `https://vrishaliwedsvedant.pages.dev` by default. If the project gets a different
address or a custom domain, add an environment variable `SITE_URL` (for example `https://vrishaliwedsvedant.com`)
under Settings → Variables and Secrets, then redeploy.

The Google Maps link for the Directions buttons is `CONFIG.MAPS_URL` near the bottom of `src/template.html`.
