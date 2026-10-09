// Static site builder: Markdown in content/ -> HTML in dist/.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { marked } from 'marked';

const config = JSON.parse(readFileSync('site.config.json', 'utf8'));
const OUT = 'dist';

function parse(file) {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Missing front matter: ${file}`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
  }
  return { ...meta, slug: basename(file, '.md'), html: marked.parse(m[2]) };
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function layout({ title, description, path, body, schema }) {
  const full = path === '/' ? `${config.name} | ${config.tagline}` : `${title} | ${config.name}`;
  const analytics = config.analytics
    ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${esc(config.analytics)}"}'></script>` : '';
  const ads = config.adsenseClient
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(config.adsenseClient)}" crossorigin="anonymous"></script>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${config.url}${path}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${config.url}${path}">
<meta property="og:type" content="${path.startsWith('/guides/') ? 'article' : 'website'}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : ''}
${ads}
</head>
<body>
<header class="site-header"><div class="wrap">
  <a class="logo" href="/"><img src="/favicon.svg" alt="" width="28" height="28"> ${esc(config.name)}</a>
  <nav><a href="/guides/">Guides</a><a href="/about/">About</a></nav>
</div></header>
<main class="wrap">
${body}
</main>
<footer class="site-footer"><div class="wrap">
  <p>Information on this site is general guidance, not a substitute for a vet. If your cat is unwell, contact your vet.</p>
  <p><a href="/about/">About</a> · <a href="/affiliate-disclosure/">Affiliate disclosure</a> · <a href="/privacy/">Privacy</a></p>
  <p>© ${new Date().getFullYear()} ${esc(config.name)}</p>
</div></footer>
${analytics}
</body>
</html>`;
}

function card(g) {
  return `<li class="card"><a href="/guides/${g.slug}/"><h3>${esc(g.title)}</h3><p>${esc(g.description)}</p></a></li>`;
}

function write(path, html) {
  const dir = join(OUT, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
cpSync('public', OUT, { recursive: true });

const guides = readdirSync('content/guides').filter(f => f.endsWith('.md'))
  .map(f => parse(join('content/guides', f)))
  .filter(g => g.draft !== 'true')
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
const pages = existsSync('content/pages')
  ? readdirSync('content/pages').filter(f => f.endsWith('.md')).map(f => parse(join('content/pages', f))) : [];

for (const g of guides) {
  const path = `/guides/${g.slug}/`;
  const related = guides.filter(o => o.slug !== g.slug && o.category === g.category).slice(0, 3);
  const more = related.length ? related : guides.filter(o => o.slug !== g.slug).slice(0, 3);
  const updated = g.updated || g.date;
  write(path, layout({
    title: g.title, description: g.description, path,
    schema: { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.description,
      datePublished: g.date, dateModified: updated, publisher: { '@type': 'Organization', name: config.name } },
    body: `<article class="post">
<p class="crumbs"><a href="/guides/">Guides</a>${g.category ? ` › ${esc(g.category)}` : ''}</p>
<h1>${esc(g.title)}</h1>
<p class="meta">Updated ${esc(updated)}</p>
<aside class="vet-note"><strong>See a vet straight away</strong> if your cat stops eating for more than a day, is straining to pee, has trouble breathing, or seems very weak.</aside>
${g.html}
</article>
${more.length ? `<section><h2>Related guides</h2><ul class="cards">${more.map(card).join('')}</ul></section>` : ''}`
  }));
}

for (const p of pages) {
  write(`/${p.slug}/`, layout({ title: p.title, description: p.description, path: `/${p.slug}/`,
    body: `<article class="post"><h1>${esc(p.title)}</h1>${p.html}</article>` }));
}

const categories = [...new Set(guides.map(g => g.category).filter(Boolean))].sort();
write('/guides/', layout({ title: 'All guides', description: 'Every Treat My Cat guide, grouped by topic.', path: '/guides/',
  body: `<h1>All guides</h1>` + categories.map(c =>
    `<section><h2>${esc(c)}</h2><ul class="cards">${guides.filter(g => g.category === c).map(card).join('')}</ul></section>`).join('') }));

writeFileSync(join(OUT, 'index.html'), layout({ title: config.name, description: config.tagline, path: '/',
  body: `<section class="hero"><h1>Something up with your cat?</h1>
<p>${esc(config.tagline)} Each guide covers what's causing it, what you can safely do at home, and when it's time for the vet.</p></section>
<section><h2>Latest guides</h2><ul class="cards">${guides.slice(0, 9).map(card).join('')}</ul>
<p><a class="button" href="/guides/">See all guides</a></p></section>` }));

const urls = ['/', '/guides/', ...guides.map(g => `/guides/${g.slug}/`), ...pages.map(p => `/${p.slug}/`)];
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${config.url}${u}</loc></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${config.url}/sitemap.xml\n`);
writeFileSync(join(OUT, '404.html'), layout({ title: 'Page not found', description: 'Page not found', path: '/404',
  body: `<h1>Page not found</h1><p>That page doesn't exist. Try the <a href="/guides/">list of guides</a>.</p>` }));

console.log(`Built ${guides.length} guides and ${pages.length} pages into ${OUT}/`);
