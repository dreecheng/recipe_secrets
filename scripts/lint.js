// Static checks on dist/: required SEO tags, labels, alt text, internal links.
const fs = require('fs');
const path = require('path');
const dist = path.join(__dirname, '..', 'dist');
const pages = ['index.html', 'about/index.html', 'specials/index.html', 'reservation/index.html', 'contact/index.html'];
const problems = [];
const base = (process.env.BASE_PATH || '').replace(/\/+$/, '');

for (const f of pages) {
  const html = fs.readFileSync(path.join(dist, f), 'utf8');
  const need = (cond, msg) => { if (!cond) problems.push(`${f}: ${msg}`); };
  need(/<title>[^<]+<\/title>/.test(html), 'missing <title>');
  need(/<meta name="description" content="[^"]{20,}"/.test(html), 'missing meta description');
  need(/property="og:title"/.test(html), 'missing Open Graph tags');
  need((html.match(/<h1[ >]/g) || []).length === 1, 'must have exactly one h1');
  need(/<html lang=/.test(html), 'missing lang');
  need(/<main id="main">/.test(html), 'missing main landmark');
  for (const m of html.matchAll(/<img\b[^>]*>/g)) need(/\balt="[^"]+"/.test(m[0]), `img without alt: ${m[0].slice(0, 80)}`);
  for (const m of html.matchAll(/<(input|select|textarea)\b[^>]*\bid="([^"]+)"/g)) need(html.includes(`for="${m[2]}"`), `no label for #${m[2]}`);
  for (const m of html.matchAll(/href="(\/[^"#]*)"/g)) {
    let h = m[1];
    if (base && h.startsWith(base + '/')) h = h.slice(base.length);
    const target = path.join(dist, h.endsWith('/') ? h + 'index.html' : h);
    need(fs.existsSync(target), `broken internal link ${m[1]}`);
  }
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('Lint OK:', pages.length, 'pages');
