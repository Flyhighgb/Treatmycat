// Static site builder: Markdown in content/ -> HTML in dist/.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { marked } from 'marked';

const config = JSON.parse(readFileSync('site.config.json', 'utf8'));
const OUT = 'dist';

// Topics shown on the homepage. Each has an illustration in public/img/<slug>.svg
// and a share image in public/og/<slug>.png (made by `npm run og`).
const TOPICS = [
  { name: 'Digestion', slug: 'digestion', tint: '#2f8f83', blurb: 'Vomiting, diarrhea, constipation and hairballs.' },
  { name: 'Skin and parasites', slug: 'skin-and-parasites', tint: '#d0632a', blurb: 'Fleas, ear mites, worms and itchy skin.' },
  { name: 'Food and treats', slug: 'food-and-treats', tint: '#d99a1e', blurb: 'What to feed, safe treats and foods to avoid.' },
  { name: 'Behavior', slug: 'behavior', tint: '#7a5bc4', blurb: 'Stress, scratching, over-grooming and litter box problems.' },
  { name: 'Health conditions', slug: 'health-conditions', tint: '#c7466a', blurb: 'Urinary, kidney, thyroid and other ongoing problems.' },
  { name: 'Care and grooming', slug: 'care-and-grooming', tint: '#4f8a3c', blurb: 'Brushing, mats, giving tablets and everyday care.' },
  { name: 'Toys and gear', slug: 'toys-and-gear', tint: '#3f6fc4', blurb: 'The best toys, scratching posts, beds and gear, and how to choose.' },
];
const topicFor = name => TOPICS.find(t => t.name === name);

function parse(file) {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Missing front matter: ${file}`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
  }
  const body = amazonLinks(m[2]);
  const minutes = Math.max(1, Math.round(m[2].split(/\s+/).length / 220));
  const html = callouts(stackTables(headingIds(marked.parse(body))));
  return { ...meta, slug: basename(file, '.md'), faq: faqs(body), minutes, affiliate: body.includes('rel="sponsored'), html,
    toc: [...html.matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/g)].map(([, id, text]) => ({ id, text })).filter(h => h.id !== 'sources') };
}

// [Shop sisal scratching posts](amazon:sisal scratching post) -> an Amazon search link with our Associates tag.
function amazonLinks(md) {
  return md.replace(/\[([^\]]+)\]\(amazon:([^)]+)\)/g, (_, text, query) => {
    if (!config.amazonTag) return text;
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(query.trim()).replace(/%20/g, '+')}&amp;tag=${encodeURIComponent(config.amazonTag)}`;
    return `<a href="${url}" rel="sponsored nofollow noopener" target="_blank">${text}</a>`;
  });
}

// Give h2/h3 headings ids so sections can be linked to, e.g. /about/#how-we-write-our-guides.
const headingIds = html => html.replace(/<h([23])>(.*?)<\/h\1>/g, (_, n, text) =>
  `<h${n} id="${text.replace(/<[^>]+>|&[a-z#0-9]+;/gi, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}">${text}</h${n}>`);

// Label each table cell with its column heading, so tables can stack into cards on phones.
const stackTables = html => html.replace(/<table>([\s\S]*?)<\/table>/g, (_, inner) => {
  const heads = [...(inner.match(/<thead>[\s\S]*?<\/thead>/)?.[0] || '').matchAll(/<th[^>]*>(.*?)<\/th>/g)].map(h => h[1].replace(/<[^>]+>/g, ''));
  const body = inner.replace(/<tbody>([\s\S]*?)<\/tbody>/, (__, rows) => `<tbody>${rows.replace(/<tr>([\s\S]*?)<\/tr>/g, (___, cells) => {
    let i = 0;
    return `<tr>${cells.replace(/<td([^>]*)>/g, (____, attrs) => `<td${attrs} data-label="${esc(heads[i++] || '')}">`)}</tr>`;
  })}</tbody>`);
  return `<div class="table"><table>${body}</table></div>`;
});

// Box "The short version" and "Sources" so they stand out from the body text.
const callouts = html => html
  .replace(/(<h2 id="the-short-version">[\s\S]*?)(?=<h2|$)/, '<section class="summary">$1</section>\n')
  .replace(/(<h2 id="sources">[\s\S]*?)(?=<h2|$)/, '<section class="sources">$1</section>\n');

// Questions under a "## Common questions" heading: each "### Question" plus the text after it.
function faqs(md) {
  const section = md.match(/^## Common questions\n([\s\S]*?)(?=^## |(?![\s\S]))/m);
  if (!section) return [];
  return section[1].split(/^### /m).slice(1).map(block => {
    const [q, ...rest] = block.split('\n');
    const answer = marked.parse(rest.join('\n').trim()).replace(/<[^>]+>/g, '').trim();
    return { q: q.trim(), a: answer };
  }).filter(f => f.q && f.a);
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const longDate = d => d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '';
const iconFor = category => `/img/icons/${topicFor(category)?.slug || 'default'}.svg`;
const tintFor = category => topicFor(category)?.tint || '#c2571a';
const ogFor = category => existsSync(`public/og/${topicFor(category)?.slug}.png`) ? `/og/${topicFor(category).slug}.png` : '/og/default.png';

function layout({ title, description, path, body, schema, image = '/og/default.png' }) {
  // Google shows about 60 characters of a title, so long titles drop the site name.
  const full = path === '/' ? `${config.name}: ${config.tagline.replace(/\.$/, '')}` : title.length > 48 ? title : `${title} | ${config.name}`;
  const analytics = config.analytics
    ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${esc(config.analytics)}"}'></script>` : '';
  const ads = config.adsenseClient
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(config.adsenseClient)}" crossorigin="anonymous"></script>` : '';
  const schemas = [].concat(schema || []);
  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${config.url}${path}">
<meta property="og:site_name" content="${esc(config.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${config.url}${path}">
<meta property="og:type" content="${path.startsWith('/guides/') && path !== '/guides/' ? 'article' : 'website'}">
<meta property="og:image" content="${config.url}${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap">
<link rel="stylesheet" href="/style.css">
${schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n')}
${ads}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap">
  <a class="logo" href="/"><img src="/favicon.svg" alt="" width="32" height="32"> ${esc(config.name)}</a>
  <nav aria-label="Main"><a href="/guides/">All guides</a><a class="hide-sm" href="/topics/toys-and-gear/">Toys &amp; gear</a><a href="/about/">About</a></nav>
</div></header>
<main id="main">
${body}
</main>
<footer class="site-footer"><div class="wrap">
  <div class="footer-grid">
    <div><a class="logo" href="/"><img src="/favicon.svg" alt="" width="32" height="32"> ${esc(config.name)}</a>
      <p>${esc(config.tagline)}</p></div>
    <div><h2>Topics</h2><ul>${TOPICS.filter(t => usedNames.has(t.name)).map(t => `<li><a href="/topics/${t.slug}/">${esc(t.name)}</a></li>`).join('')}</ul></div>
    <div><h2>About us</h2><ul><li><a href="/about/">About</a></li><li><a href="/about/#how-we-write-our-guides">How we write our guides</a></li><li><a href="/affiliate-disclosure/">Affiliate disclosure</a></li><li><a href="/privacy/">Privacy</a></li></ul></div>
  </div>
  <p class="footer-note">Information on this site is general guidance, not a substitute for a vet. If your cat is unwell, contact your vet. For a suspected poisoning, call your vet or the ASPCA Animal Poison Control Center at (888) 426-4435.</p>
  <p class="footer-note">© ${new Date().getFullYear()} ${esc(config.name)}</p>
</div></footer>
${analytics}
</body>
</html>`;
}

function card(g) {
  return `<li class="card" style="--tint:${tintFor(g.category)}"><a href="/guides/${g.slug}/">
<span class="thumb"><img src="${iconFor(g.category)}" alt="" width="72" height="72" loading="lazy"></span>
<span class="card-body">${g.category ? `<span class="chip">${esc(g.category)}</span>` : ''}<h3>${esc(g.title)}</h3><p>${esc(g.description)}</p><span class="read">${g.minutes} min read</span></span></a></li>`;
}

function topicTile(t, count) {
  return `<li class="topic" style="--tint:${t.tint}"><a href="/topics/${t.slug}/"><span class="icon"><img src="/img/icons/${t.slug}.svg" alt="" width="48" height="48"></span>
<span><strong>${esc(t.name)}</strong><small>${esc(t.blurb)}</small><span class="count">${count} guide${count === 1 ? '' : 's'} →</span></span></a></li>`;
}

const crumbSchema = items => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${config.url}${path}` })) });

function write(path, html) {
  const dir = join(OUT, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
cpSync('public', OUT, { recursive: true });

let usedNames = new Set();
const guides = readdirSync('content/guides').filter(f => f.endsWith('.md'))
  .map(f => parse(join('content/guides', f)))
  .filter(g => g.draft !== 'true')
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
const pages = existsSync('content/pages')
  ? readdirSync('content/pages').filter(f => f.endsWith('.md')).map(f => parse(join('content/pages', f))) : [];
usedNames = new Set(guides.map(g => g.category));
const org = { '@type': 'Organization', name: config.name, url: config.url };
const lastmod = {};

for (const g of guides) {
  const path = `/guides/${g.slug}/`;
  const topic = topicFor(g.category);
  const related = guides.filter(o => o.slug !== g.slug && o.category === g.category).slice(0, 3);
  const more = related.length ? related : guides.filter(o => o.slug !== g.slug).slice(0, 3);
  const updated = g.updated || g.date;
  const reviewed = g.reviewed || updated;
  lastmod[path] = [updated, reviewed].sort().pop();
  const schema = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.description,
      image: `${config.url}${ogFor(g.category)}`, mainEntityOfPage: `${config.url}${path}`,
      datePublished: g.date, dateModified: lastmod[path],
      author: { ...org, name: `${config.name} editorial team` }, publisher: org },
    crumbSchema([['Guides', '/guides/'], ...(topic ? [[topic.name, `/topics/${topic.slug}/`]] : []), [g.title, path]]),
  ];
  if (g.faq.length) schema.push({ '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: g.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  write(path, layout({
    title: g.title, description: g.description, path, schema, image: ogFor(g.category),
    body: `<header class="page-head" style="--tint:${tintFor(g.category)}"><div class="wrap page-head-grid">
<div>
<p class="crumbs"><a href="/guides/">Guides</a>${topic ? ` › <a href="/topics/${topic.slug}/">${esc(topic.name)}</a>` : g.category ? ` › ${esc(g.category)}` : ''}</p>
<h1>${esc(g.title)}</h1>
<p class="lead">${esc(g.description)}</p>
<p class="meta"><span>By the ${esc(config.name)} editorial team</span><span>Last reviewed ${esc(longDate(reviewed))}</span><span>${g.minutes} min read</span></p>
</div>
<span class="head-icon"><img src="${iconFor(g.category)}" alt="" width="140" height="140"></span>
</div></header>
<div class="wrap article-grid">
<article class="post">
${g.category === 'Toys and gear' ? '' : `<div class="vet-note" role="note"><strong>See a vet right away</strong> if your cat stops eating for more than a day, is straining to pee, has trouble breathing, or seems very weak.</div>`}
${g.affiliate ? `<p class="disclosure">This guide contains affiliate links. If you buy through them we may earn a small commission, at no extra cost to you. As an Amazon Associate we earn from qualifying purchases. <a href="/affiliate-disclosure/">Learn more</a>.</p>` : ''}
${g.toc.length > 2 ? `<details class="toc toc-inline"><summary>In this guide</summary><ol>${g.toc.map(h => `<li><a href="#${h.id}">${h.text}</a></li>`).join('')}</ol></details>` : ''}
${g.html}
<p class="trust-line">Written from published veterinary guidance. <a href="/about/#how-we-write-our-guides">How we write our guides</a>.</p>
</article>
${g.toc.length > 2 ? `<aside class="sidebar"><nav class="toc" aria-label="In this guide"><p class="toc-title">In this guide</p><ol>${g.toc.map(h => `<li><a href="#${h.id}">${h.text}</a></li>`).join('')}</ol></nav></aside>` : ''}
</div>
${more.length ? `<section class="band"><div class="wrap"><h2>Related guides</h2><ul class="cards">${more.map(card).join('')}</ul></div></section>` : ''}`
  }));
}

for (const p of pages) {
  write(`/${p.slug}/`, layout({ title: p.title, description: p.description, path: `/${p.slug}/`,
    body: `<header class="page-head"><div class="wrap"><h1>${esc(p.title)}</h1></div></header><div class="wrap narrow"><article class="post">${p.html}</article></div>` }));
}

const used = TOPICS.filter(t => guides.some(g => g.category === t.name));
const unknown = [...new Set(guides.map(g => g.category).filter(c => c && !topicFor(c)))];
if (unknown.length) console.warn(`Unknown categories (add them to TOPICS in build.mjs): ${unknown.join(', ')}`);

for (const t of used) {
  const list = guides.filter(g => g.category === t.name);
  write(`/topics/${t.slug}/`, layout({ title: `${t.name} guides`, description: `${t.blurb} Practical guides from ${config.name}.`,
    path: `/topics/${t.slug}/`, image: ogFor(t.name),
    schema: crumbSchema([['Guides', '/guides/'], [t.name, `/topics/${t.slug}/`]]),
    body: `<header class="page-head" style="--tint:${t.tint}"><div class="wrap page-head-grid"><div><p class="crumbs"><a href="/guides/">Guides</a> › ${esc(t.name)}</p><h1>${esc(t.name)}</h1><p class="lead">${esc(t.blurb)}</p></div>
<span class="head-icon"><img src="/img/icons/${t.slug}.svg" alt="" width="140" height="140"></span></div></header>
<div class="wrap section"><h2 class="visually-hidden">Guides</h2><ul class="cards">${list.map(card).join('')}</ul></div>` }));
}

write('/guides/', layout({ title: 'All guides', description: `Every ${config.name} guide to cat health, care, toys and gear, grouped by topic so you can find help fast.`, path: '/guides/',
  body: `<header class="page-head"><div class="wrap"><h1>All guides</h1><p class="lead">${guides.length} practical guides, grouped by topic.</p></div></header><div class="wrap">` + [...used.map(t => t.name), ...unknown].map(c => {
    const t = topicFor(c);
    return `<section class="section"><h2>${t ? `<a href="/topics/${t.slug}/">${esc(c)}</a>` : esc(c)}</h2><ul class="cards">${guides.filter(g => g.category === c).map(card).join('')}</ul></section>`;
  }).join('') + '</div>' }));

// Inline the hero so its background blob can follow light and dark mode.
const heroArt = readFileSync('public/img/hero.svg', 'utf8').replace('<svg ', '<svg class="hero-art" aria-hidden="true" ').replace('fill="#fbe9dc"', 'style="fill:var(--hero-blob)"');
const SHORT = { 'how-to-treat-cat-fleas': 'Fleas', 'how-to-treat-cat-diarrhea': 'Diarrhea', 'how-to-treat-cat-hairballs': 'Hairballs',
  'how-to-treat-cat-constipation': 'Constipation', 'best-toys-for-indoor-cats': 'Best toys', 'how-to-treat-cat-ear-mites': 'Ear mites' };
const popular = Object.entries(SHORT).map(([slug, short]) => ({ ...guides.find(g => g.slug === slug), short })).filter(g => g.slug).slice(0, 5);

writeFileSync(join(OUT, 'index.html'), layout({ title: config.name, description: config.tagline, path: '/',
  schema: { '@context': 'https://schema.org', '@type': 'WebSite', name: config.name, url: config.url },
  body: `<section class="hero"><div class="wrap hero-grid">
<div>
<p class="eyebrow">Vet-minded cat care, in plain English</p>
<h1>Something up with your cat?</h1>
<p class="lead">Practical guides to everyday cat problems: what's causing it, what you can safely do at home, and when it's time for the vet.</p>
<p class="quick"><span>Popular:</span> ${popular.map(g => `<a href="/guides/${g.slug}/">${esc(g.short)}</a>`).join('')}</p>
</div>
${heroArt}
</div></section>
<section class="trust"><div class="wrap"><ul>
<li><strong>Based on vet sources</strong><span>Every guide lists the veterinary organizations it draws on.</span></li>
<li><strong>Safety first</strong><span>Clear signs for when to see a vet, and no medicine doses.</span></li>
<li><strong>Kept up to date</strong><span>Each guide shows when it was last reviewed.</span></li>
</ul></div></section>
<section class="section"><div class="wrap"><h2>Find help by problem</h2><ul class="topics">${used.map(t => topicTile(t, guides.filter(g => g.category === t.name).length)).join('')}</ul></div></section>
<section class="section band"><div class="wrap"><div class="section-head"><h2>Latest guides</h2><a href="/guides/">See all guides →</a></div><ul class="cards">${guides.slice(0, 6).map(card).join('')}</ul></div></section>` }));

const newest = guides.map(g => lastmod[`/guides/${g.slug}/`]).sort().pop();
const urls = [['/', newest], ['/guides/', newest], ...used.map(t => [`/topics/${t.slug}/`]),
  ...guides.map(g => [`/guides/${g.slug}/`, lastmod[`/guides/${g.slug}/`]]), ...pages.map(p => [`/${p.slug}/`])];
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, d]) => `  <url><loc>${config.url}${u}</loc>${d ? `<lastmod>${d}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${config.url}/sitemap.xml\n`);
writeFileSync(join(OUT, '404.html'), layout({ title: 'Page not found', description: 'Page not found', path: '/404',
  body: `<div class="wrap narrow section"><h1>Page not found</h1><p>That page doesn't exist. Try the <a href="/guides/">list of guides</a>.</p></div>` }));

console.log(`Built ${guides.length} guides, ${used.length} topics and ${pages.length} pages into ${OUT}/`);
