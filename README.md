# treatmycat.com

A static site of practical cat care guides. Markdown in `content/` is built into plain HTML in `dist/` by `build.mjs`. Its only dependency is `marked`.

## Build

```
npm install
npm run build   # outputs dist/
```

## Deploy (Cloudflare Pages)

- Build command: `npm run build`
- Build output directory: `dist`
- Custom domain: `treatmycat.com` (and `www.treatmycat.com`, redirected to the apex)

Every push to `main` redeploys automatically.

## Adding a guide

Create `content/guides/<slug>.md`:

```
---
title: How to ...
description: One sentence for search results and cards.
category: Digestion | Skin and parasites | Food and treats | Behavior | Health conditions | Care and grooming
date: YYYY-MM-DD
reviewed: YYYY-MM-DD
---
Body in Markdown.
```

Add `draft: true` to keep it unpublished. Read `CONTENT.md` before writing.

## Topics and images

Topics are listed in `TOPICS` at the top of `build.mjs`. Each has a colour (`tint`), an illustration in `public/img/<slug>.svg`, an icon in `public/img/icons/<slug>.svg` (shown on tiles, cards and guide headers) and a share image in `public/og/<slug>.png` (shown when a link is shared). To add a topic, add it to `TOPICS`, add its drawing to `scripts/illustrations.mjs` and run `npm run art`, then run `npm run og` (needs Playwright) to make the share image.

## Settings

`site.config.json` holds the site name and URL, the Cloudflare Web Analytics token (`analytics`) and the AdSense client ID (`adsenseClient`). Leave the last two empty until they exist.
