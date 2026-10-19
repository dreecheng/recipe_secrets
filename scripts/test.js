// End-to-end checks in headless Chrome against the built dist/ folder.
// Usage: node scripts/test.js   (set CHROME_PATH if Chrome/Edge is not auto-detected; SHOTS=dir to save screenshots)
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { createServer } = require('./serve');

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const chrome = CANDIDATES.find((p) => fs.existsSync(p));
if (!chrome) { console.error('No Chrome/Edge found. Set CHROME_PATH.'); process.exit(2); }

const PAGES = ['/', '/about/', '/specials/', '/reservation/', '/contact/'];
const VIEWPORTS = { mobile: [390, 844], tablet: [820, 1180], desktop: [1440, 900] };
const failures = [];
const pass = [];
const check = (ok, msg) => (ok ? pass.push(msg) : failures.push(msg));

(async () => {
  const server = createServer().listen(0);
  const base = `http://localhost:${server.address().port}`;
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
  const shots = process.env.SHOTS;
  if (shots) fs.mkdirSync(shots, { recursive: true });

  for (const [vp, [w, h]] of Object.entries(VIEWPORTS)) {
    for (const url of PAGES) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h });
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('requestfailed', (r) => errors.push('request failed: ' + r.url()));
      page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });
      await page.goto(base + url, { waitUntil: 'networkidle0', timeout: 60000 });
      // scroll through to trigger lazy images and reveals
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
        window.scrollTo(0, 0);
      });
      // force every lazy image to load, then wait for each to settle
      await page.evaluate(() => Promise.all([...document.images].map((i) => {
        i.loading = 'eager';
        return i.complete ? 0 : new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); setTimeout(r, 20000); });
      })));
      const info = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        broken: [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src),
        imgs: document.images.length,
      }));
      const tag = `${vp} ${url}`;
      check(errors.length === 0, `${tag}: no console/network errors${errors.length ? ' -> ' + errors.join(' | ') : ''}`);
      check(info.overflow <= 0, `${tag}: no horizontal overflow (${info.overflow}px)`);
      check(info.broken.length === 0, `${tag}: all ${info.imgs} images load${info.broken.length ? ' -> broken: ' + info.broken.join(', ') : ''}`);
      if (shots) await page.screenshot({ path: path.join(shots, `${vp}-${url === '/' ? 'home' : url.replace(/\//g, '')}.png`), fullPage: true });
      await page.close();
    }
  }

  // Navigation: every nav link works and marks the active page; mobile menu toggles.
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    check(!(await page.$eval('#nav', (n) => n.checkVisibility())), 'mobile: menu hidden by default');
    await page.click('.nav-toggle');
    check(await page.$eval('#nav', (n) => n.checkVisibility()), 'mobile: menu opens');
    check((await page.$eval('.nav-toggle', (b) => b.getAttribute('aria-expanded'))) === 'true', 'mobile: aria-expanded updates');
    await page.keyboard.press('Escape');
    check(!(await page.$eval('#nav', (n) => n.checkVisibility())), 'mobile: Escape closes menu');
    await page.setViewport({ width: 1440, height: 900 });
    for (const u of PAGES) {
      await page.goto(base + u, { waitUntil: 'domcontentloaded' });
      const cur = await page.$eval('.nav a[aria-current="page"]', (a) => a.getAttribute('href')).catch(() => null);
      check(cur === u, `desktop ${u}: active nav indicator (${cur})`);
    }
    await page.close();
  }

  // Every internal link and CTA button resolves with 200.
  {
    const page = await browser.newPage();
    const seen = new Set();
    for (const u of PAGES) {
      await page.goto(base + u, { waitUntil: 'domcontentloaded' });
      for (const h of await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')))) seen.add(h.split('#')[0]);
    }
    for (const h of seen) {
      const r = await page.goto(base + h, { waitUntil: 'domcontentloaded' });
      check(r.status() === 200, `link ${h} -> ${r.status()}`);
    }
    await page.close();
  }

  // Specials filter.
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(base + '/specials/', { waitUntil: 'domcontentloaded' });
    const total = await page.$$eval('#specials-grid .card', (c) => c.length);
    await page.click('.chip[data-filter="Dessert"]');
    const visible = await page.$$eval('#specials-grid .card', (c) => c.filter((x) => !x.hidden).length);
    check(total >= 6 && visible >= 1 && visible < total, `specials filter works (${visible}/${total})`);
    await page.close();
  }

  // Forms.
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluateOnNewDocument(() => { window.__nav = []; });
    await page.goto(base + '/reservation/', { waitUntil: 'domcontentloaded' });
    await page.click('#reservation-form button[type=submit]');
    const errs = await page.$$eval('#reservation-form .err', (e) => e.filter((x) => x.textContent).length);
    check(errs >= 6, `reservation: empty submit shows ${errs} field errors`);
    check(await page.$eval('#reservation-form .status', (s) => s.classList.contains('status--err')), 'reservation: error banner shown');

    await page.type('#r-name', 'Test Guest');
    await page.type('#r-email', 'not-an-email');
    await page.type('#r-phone', 'abc');
    await page.$eval('#r-date', (el) => { el.value = '2020-01-01'; });
    await page.$eval('#r-time', (el) => { el.value = '19:00'; });
    await page.select('#r-guests', '2');
    await page.click('#reservation-form button[type=submit]');
    const msgs = await page.$$eval('#reservation-form .err', (e) => e.map((x) => x.textContent));
    check(msgs.some((m) => /valid email/.test(m)), 'reservation: invalid email rejected');
    check(msgs.some((m) => /valid phone/.test(m)), 'reservation: invalid phone rejected');
    check(msgs.some((m) => /future date/.test(m)), 'reservation: past date rejected');
    check((await page.$eval('#r-date', (el) => el.min)).length === 10, 'reservation: date input has min attribute');

    // valid submit -> honest, unsent mailto fallback (block the navigation to mailto:)
    await page.setRequestInterception(true);
    page.on('request', (r) => r.continue());
    const d = new Date(Date.now() + 3 * 864e5);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await page.$eval('#r-email', (el) => { el.value = 'guest@example.com'; });
    await page.$eval('#r-phone', (el) => { el.value = '+65 6123 4567'; });
    await page.$eval('#r-date', (el, v) => { el.value = v; }, ds);
    await page.click('#reservation-form button[type=submit]');
    const st = await page.$eval('#reservation-form .status', (s) => ({ cls: s.className, text: s.textContent, href: s.querySelector('a')?.getAttribute('href') }));
    check(st.cls.includes('status--info') && /has not been sent/.test(st.text) && /not confirmed/.test(st.text), 'reservation: success state does not claim sent/confirmed');
    check(/^mailto:/.test(st.href || '') && /Guests%3A%202/.test(st.href), 'reservation: mailto fallback carries the details');
    await page.close();

    const c = await browser.newPage();
    await c.setViewport({ width: 1440, height: 900 });
    await c.goto(base + '/contact/', { waitUntil: 'domcontentloaded' });
    await c.click('#contact-form button[type=submit]');
    const ce = await c.$$eval('#contact-form .err', (e) => e.filter((x) => x.textContent).length);
    check(ce === 4, `contact: empty submit shows ${ce}/4 errors`);
    check((await c.$$eval('a[href^="mailto:"]', (a) => a.length)) > 0 && (await c.$$eval('a[href^="tel:"]', (a) => a.length)) > 0, 'contact: clickable mailto and tel links');
    await c.close();
  }

  // Reduced motion: content visible.
  {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto(base + '/about/', { waitUntil: 'domcontentloaded' });
    const op = await page.$eval('.reveal', (el) => getComputedStyle(el).opacity);
    check(op === '1', 'reduced motion: reveal elements visible immediately');
    await page.close();
  }

  await browser.close();
  server.close();
  console.log(`${pass.length} checks passed, ${failures.length} failed`);
  if (failures.length) { console.error('FAILURES:\n- ' + failures.join('\n- ')); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(1); });
