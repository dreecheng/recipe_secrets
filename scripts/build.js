// Dependency-free static site builder: src/ -> dist/
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');
const dist = path.join(root, 'dist');
const read = (p) => fs.readFileSync(path.join(src, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const site = json('data/site.json');
const images = json('data/images.json');
const specials = json('data/specials.json');

const NAV = [
  ['/', 'Home', 'home'],
  ['/about/', 'About', 'about'],
  ['/specials/', 'Specials', 'specials'],
  ['/reservation/', 'Reservation', 'reservation'],
  ['/contact/', 'Contact', 'contact'],
];

const unsplash = (key, w, h) => {
  const i = images[key];
  if (!i) throw new Error(`Unknown image key: ${key}`);
  return `https://images.unsplash.com/photo-${i.id}?auto=format&fit=crop&fm=jpg&q=70&w=${w}${h ? `&h=${h}` : ''}`;
};

// {{img:key:width:height[:eager]}}
const img = (key, w, h, eager) => {
  const w2 = Math.round(w / 2);
  const h2 = h ? Math.round(h / 2) : 0;
  const alt = esc(images[key].alt);
  return `<img src="${unsplash(key, w, h)}" srcset="${unsplash(key, w2, h2)} ${w2}w, ${unsplash(key, w, h)} ${w}w" sizes="(min-width: 900px) ${Math.round(w / 1.6)}px, 100vw" alt="${alt}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" data-fallback>`;
};

const BASE = (process.env.BASE_PATH || '').replace(/\/+$/, '');
const money = (n) => `${site.currency}${n}`;

const card = (s) => `
<article class="card" data-category="${esc(s.category)}">
  <div class="card__media">${img(s.image, 800, 600)}<span class="tag">${esc(s.category)}</span></div>
  <div class="card__body">
    <div class="card__head"><h3>${esc(s.name)}</h3><span class="price" title="Sample price">${money(s.price)}</span></div>
    <p>${esc(s.description)}</p>
    <p class="card__avail">${esc(s.availability)}</p>
  </div>
</article>`;

const hoursList = () => `<dl class="hours">${site.hours.map((h) => `<div><dt>${esc(h.days)}</dt><dd>${esc(h.time)}</dd></div>`).join('')}</dl>`;

const header = (active) => `
<a class="skip" href="#main">Skip to content</a>
<header class="site-header" id="top">
  <div class="wrap site-header__in">
    <a class="brand" href="/" aria-label="${esc(site.name)} - home"><span class="brand__mark" aria-hidden="true">R</span><span>${esc(site.name)}</span></a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav" aria-label="Menu"><span></span><span></span><span></span></button>
    <nav id="nav" class="nav" aria-label="Main">
      <ul>${NAV.map(([href, label, id]) => `<li><a href="${href}"${id === active ? ' class="is-active" aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul>
      <a class="btn btn--small" href="/reservation/">Book a table</a>
    </nav>
  </div>
</header>`;

const footer = () => `
<footer class="site-footer">
  <div class="wrap footer__grid">
    <div>
      <a class="brand brand--light" href="/"><span class="brand__mark" aria-hidden="true">R</span><span>${esc(site.name)}</span></a>
      <p>${esc(site.tagline)}.</p>
    </div>
    <div>
      <h2>Explore</h2>
      <ul>${NAV.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h2>Visit</h2>
      <address>${site.address.map(esc).join('<br>')}<br>
        <a href="tel:${esc(site.phoneHref)}">${esc(site.phone)}</a><br>
        <a href="mailto:${esc(site.email)}">${esc(site.email)}</a></address>
      <p class="placeholder-note">Placeholder details &mdash; edit src/data/site.json</p>
    </div>
  </div>
  <div class="wrap footer__base"><small>&copy; ${new Date().getFullYear()} ${esc(site.name)}. Sample website content.</small></div>
</footer>`;

const render = (tpl, ctx) =>
  tpl
    .replace(/\{\{img:(\w+):(\d+):(\d+)(:eager)?\}\}/g, (_, k, w, h, e) => img(k, +w, +h, !!e))
    .replace(/\{\{imgurl:(\w+):(\d+):(\d+)\}\}/g, (_, k, w, h) => unsplash(k, +w, +h))
    .replace(/\{\{header\}\}/g, () => header(ctx.active))
    .replace(/\{\{footer\}\}/g, () => footer())
    .replace(/\{\{hours\}\}/g, () => hoursList())
    .replace(/\{\{specials_all\}\}/g, () => specials.items.map(card).join(''))
    .replace(/\{\{specials_featured\}\}/g, () => specials.featured.map((n) => specials.items.find((s) => s.name === n)).filter(Boolean).map(card).join(''))
    .replace(/\{\{specials_filters\}\}/g, () => ['All', ...new Set(specials.items.map((s) => s.category))].map((c, i) => `<button type="button" class="chip${i === 0 ? ' is-on' : ''}" data-filter="${esc(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`).join(''))
    .replace(/\{\{address\}\}/g, () => site.address.map(esc).join('<br>'))
    .replace(/\{\{email\}\}/g, () => esc(site.email))
    .replace(/\{\{phone\}\}/g, () => esc(site.phone))
    .replace(/\{\{phoneHref\}\}/g, () => esc(site.phoneHref))
    .replace(/\{\{name\}\}/g, () => esc(site.name))
    .replace(/\{\{title\}\}/g, () => esc(ctx.title))
    .replace(/\{\{description\}\}/g, () => esc(ctx.description))
    .replace(/\{\{canonical\}\}/g, () => esc(site.url + ctx.url))
    .replace(/\{\{ogimage\}\}/g, () => esc(unsplash('hero', 1200, 630)))
    .replace(/\{\{map\}\}/g, () => site.mapQuery
      ? `<iframe title="Map showing our location" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(site.mapQuery)}&output=embed"></iframe>`
      : `<div class="map-ph"><p><strong>Map coming soon.</strong><br>Add the restaurant address to <code>mapQuery</code> in src/data/site.json and a map will appear here.</p></div>`);

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.cpSync(path.join(src, 'assets'), path.join(dist, 'assets'), { recursive: true });

const layout = read('partials/layout.html');
const pages = {
  home: { url: '/', out: 'index.html' },
  about: { url: '/about/', out: 'about/index.html' },
  specials: { url: '/specials/', out: 'specials/index.html' },
  reservation: { url: '/reservation/', out: 'reservation/index.html' },
  contact: { url: '/contact/', out: 'contact/index.html' },
};

const build = (id, tplName, ctx, outFile) => {
  const raw = read(`pages/${tplName}.html`);
  const m = raw.match(/^<!--\s*title:(.*?)\|\s*description:(.*?)-->\s*/s);
  if (!m) throw new Error(`pages/${tplName}.html is missing its title/description header`);
  const full = { ...ctx, title: m[1].trim(), description: m[2].trim() };
  let html = render(layout.replace('{{content}}', () => raw.slice(m[0].length)), full);
  // Optional sub-path hosting (e.g. GitHub Pages project sites): BASE_PATH=/repo-name npm run build
  if (BASE) html = html.replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`);
  const left = html.match(/\{\{[^}]+\}\}/);
  if (left) throw new Error(`Unresolved placeholder ${left[0]} in ${id}`);
  const out = path.join(dist, outFile);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
};

for (const [id, p] of Object.entries(pages)) build(id, id, { active: id, url: p.url }, p.out);
build('404', '404', { active: '', url: '/404.html' }, '404.html');

fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.values(pages).map((p) => `  <url><loc>${site.url}${p.url}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log('Built', Object.keys(pages).length, 'pages ->', dist);
