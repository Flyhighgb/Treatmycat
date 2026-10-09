// Static site builder: Markdown in content/ -> HTML in dist/.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { marked } from 'marked';

const config = JSON.parse(readFileSync('site.config.json', 'utf8'));
const OUT = 'dist';

// Topics shown on the homepage. Each has an illustration in public/img/<slug>.svg
// and a share image in public/og/<slug>.png (made by `npm run og`).
const TOPICS = [
  { name: 'Digestion', slug: 'digestion', blurb: 'Vomiting, diarrhea, constipation and hairballs.' },
  { name: 'Skin and parasites', slug: 'skin-and-parasites', blurb: 'Fleas, ear mites, worms and itchy skin.' },
  { name: 'Food and treats', slug: 'food-and-treats', blurb: 'What to feed, safe treats and foods to avoid.' },
  { name: 'Behavior', slug: 'behavior', blurb: 'Stress, scratching, over-grooming and litter box problems.' },
  { name: 'Health conditions', slug: 'health-conditions', blurb: 'Urinary, kidney, thyroid and other ongoing problems.' },
  { name: 'Care and grooming', slug: 'care-and-grooming', blurb: 'Brushing, mats, giving tablets and everyday care.' },
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
  return { ...meta, slug: basename(file, '.md'), faq: faqs(m[2]), html: headingIds(marked.parse(m[2])) };
}

// Give h2/h3 headings ids so sections can be linked to, e.g. /about/#how-we-write-our-guides.
const headingIds = html => html.replace(/<h([23])>(.*?)<\/h\1>/g, (_, n, text) =>
  `<h${n} id="${text.replace(/<[^>]+>|&[a-z#0-9]+;/gi, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}">${text}</h${n}>`);

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
const imgFor = category => existsSync(`public/img/${topicFor(category)?.slug}.svg`) ? `/img/${topicFor(category).slug}.svg` : '/img/default.svg';
const ogFor = category => existsSync(`public/og/${topicFor(category)?.slug}.png`) ? `/og/${topicFor(category).slug}.png` : '/og/default.png';

function layout({ title, description, path, body, schema, image = '/og/default.png' }) {
  const full = path === '/' ? `${config.name} | ${config.tagline}` : `${title} | ${config.name}`;
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
<link rel="stylesheet" href="/style.css">
${schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n')}
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
  <p>Information on this site is general guidance, not a substitute for a vet. If your cat is unwell, contact your vet. For a suspected poisoning, call your vet or the ASPCA Animal Poison Control Center at (888) 426-4435.</p>
  <p><a href="/about/">About</a> · <a href="/about/#how-we-write-our-guides">How we write our guides</a> · <a href="/affiliate-disclosure/">Affiliate disclosure</a> · <a href="/privacy/">Privacy</a></p>
  <p>© ${new Date().getFullYear()} ${esc(config.name)}</p>
</div></footer>
${analytics}
</body>
</html>`;
}

function card(g) {
  return `<li class="card"><a href="/guides/${g.slug}/"><img src="${imgFor(g.category)}" alt="" width="320" height="180" loading="lazy"><h3>${esc(g.title)}</h3><p>${esc(g.description)}</p></a></li>`;
}

function topicTile(t, count) {
  return `<li class="topic"><a href="/topics/${t.slug}/"><img src="/img/${t.slug}.svg" alt="" width="320" height="180" loading="lazy"><span><strong>${esc(t.name)}</strong><small>${esc(t.blurb)}${count ? ` ${count} guide${count === 1 ? '' : 's'}.` : ''}</small></span></a></li>`;
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

const guides = readdirSync('content/guides').filter(f => f.endsWith('.md'))
  .map(f => parse(join('content/guides', f)))
  .filter(g => g.draft !== 'true')
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
const pages = existsSync('content/pages')
  ? readdirSync('content/pages').filter(f => f.endsWith('.md')).map(f => parse(join('content/pages', f))) : [];
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
    body: `<article class="post">
<p class="crumbs"><a href="/guides/">Guides</a>${topic ? ` › <a href="/topics/${topic.slug}/">${esc(topic.name)}</a>` : g.category ? ` › ${esc(g.category)}` : ''}</p>
<h1>${esc(g.title)}</h1>
<p class="meta">By the ${esc(config.name)} editorial team · Last reviewed ${esc(longDate(reviewed))} · <a href="/about/#how-we-write-our-guides">How we write our guides</a></p>
<img class="hero-img" src="${imgFor(g.category)}" alt="" width="640" height="360">
<aside class="vet-note"><strong>See a vet right away</strong> if your cat stops eating for more than a day, is straining to pee, has trouble breathing, or seems very weak.</aside>
${g.html}
</article>
${more.length ? `<section><h2>Related guides</h2><ul class="cards">${more.map(card).join('')}</ul></section>` : ''}`
  }));
}

for (const p of pages) {
  write(`/${p.slug}/`, layout({ title: p.title, description: p.description, path: `/${p.slug}/`,
    body: `<article class="post"><h1>${esc(p.title)}</h1>${p.html}</article>` }));
}

const used = TOPICS.filter(t => guides.some(g => g.category === t.name));
const unknown = [...new Set(guides.map(g => g.category).filter(c => c && !topicFor(c)))];
if (unknown.length) console.warn(`Unknown categories (add them to TOPICS in build.mjs): ${unknown.join(', ')}`);

for (const t of used) {
  const list = guides.filter(g => g.category === t.name);
  write(`/topics/${t.slug}/`, layout({ title: `${t.name} guides`, description: `${t.blurb} Practical guides from ${config.name}.`,
    path: `/topics/${t.slug}/`, image: ogFor(t.name),
    schema: crumbSchema([['Guides', '/guides/'], [t.name, `/topics/${t.slug}/`]]),
    body: `<p class="crumbs"><a href="/guides/">Guides</a> › ${esc(t.name)}</p><h1>${esc(t.name)}</h1><p class="lead">${esc(t.blurb)}</p>
<ul class="cards">${list.map(card).join('')}</ul>` }));
}

write('/guides/', layout({ title: 'All guides', description: `Every ${config.name} guide, grouped by topic.`, path: '/guides/',
  body: `<h1>All guides</h1>` + [...used.map(t => t.name), ...unknown].map(c => {
    const t = topicFor(c);
    return `<section><h2>${t ? `<a href="/topics/${t.slug}/">${esc(c)}</a>` : esc(c)}</h2><ul class="cards">${guides.filter(g => g.category === c).map(card).join('')}</ul></section>`;
  }).join('') }));

writeFileSync(join(OUT, 'index.html'), layout({ title: config.name, description: config.tagline, path: '/',
  schema: { '@context': 'https://schema.org', '@type': 'WebSite', name: config.name, url: config.url },
  body: `<section class="hero"><h1>Something up with your cat?</h1>
<p>${esc(config.tagline)} Each guide covers what's causing it, what you can safely do at home, and when it's time for the vet.</p></section>
<section><h2>Find help by problem</h2><ul class="topics">${used.map(t => topicTile(t, guides.filter(g => g.category === t.name).length)).join('')}</ul></section>
<section><h2>Latest guides</h2><ul class="cards">${guides.slice(0, 6).map(card).join('')}</ul>
<p><a class="button" href="/guides/">See all guides</a></p></section>` }));

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
  body: `<h1>Page not found</h1><p>That page doesn't exist. Try the <a href="/guides/">list of guides</a>.</p>` }));

console.log(`Built ${guides.length} guides, ${used.length} topics and ${pages.length} pages into ${OUT}/`);
