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
category: Digestion | Skin and parasites | Food and treats | Behaviour | Health conditions | Care and grooming
date: YYYY-MM-DD
---
Body in Markdown.
```

Add `draft: true` to keep it unpublished. Read `CONTENT.md` before writing.

## Settings

`site.config.json` holds the site name and URL, the Cloudflare Web Analytics token (`analytics`) and the AdSense client ID (`adsenseClient`). Leave the last two empty until they exist.
