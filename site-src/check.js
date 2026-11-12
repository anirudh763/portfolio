// Measures dist/index.html, writes audit.json (the sentences shown in the page's "This page, checked" panel),
// and fails (exit code 1) unless every measurement passes AND the built page shows exactly those sentences.
// Order of use: node check.js ; python3 build.py ; node check.js   (the second run must print "ok": true)
// Usage: node check.js [--shots]      DIST=path/to/index.html overrides the page under test.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const distPath = process.env.DIST ? path.resolve(process.env.DIST) : path.join(__dirname, 'dist/index.html');
const file = 'file://' + distPath;
const distHtml = fs.readFileSync(distPath, 'utf8');
const axeSrc = fs.readFileSync(path.join(__dirname, 'node_modules/axe-core/axe.min.js'), 'utf8');
const shots = process.argv.includes('--shots');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

// helpers that run inside the page
const inPage = () => {
  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const rgb = s => { const m = s.match(/[\d.]+/g).map(Number); return { c: m.slice(0, 3), a: m.length > 3 ? m[3] : 1 }; };
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const b = rgb(getComputedStyle(e).backgroundColor); if (b.a > 0) return b.c; } return [255, 255, 255]; };
  const ratio = (a, b) => { a = L(a); b = L(b); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
  window.__m = {
    contrast() {
      let min = { r: 99 };
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n; (n = w.nextNode());) {
        if (!n.textContent.trim()) continue;
        const el = n.parentElement, cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const r = ratio(rgb(cs.color).c, bgOf(el));
        if (r < min.r) min = { r, text: n.textContent.trim().slice(0, 40) };
      }
      return min;
    },
    targets() {
      const r = [...document.querySelectorAll('a, summary, button, input, select, textarea')].map(a => { const b = a.getBoundingClientRect(); return { h: Math.round(b.height), w: Math.round(b.width), t: a.textContent.trim().slice(0, 30) }; });
      return { n: r.length, minH: r.reduce((m, x) => x.h < m.h ? x : m), minW: r.reduce((m, x) => x.w < m.w ? x : m) };
    },
    sideways() {
      const d = document.documentElement;
      const wide = [...document.querySelectorAll('body *')].filter(e => !e.closest('.skip') && (e.getBoundingClientRect().right > innerWidth + 0.5 || (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible'))).map(e => e.tagName + '.' + e.className).slice(0, 5);
      return { sw: d.scrollWidth, cw: d.clientWidth, wide };
    },
    focused() {
      const e = document.activeElement; if (!e || e === document.body) return null;
      const cs = getComputedStyle(e), b = e.getBoundingClientRect();
      const ringOn = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2;
      const ringContrast = ringOn ? ratio(rgb(cs.outlineColor).c, bgOf(e.parentElement)) : 0;
      return { t: e.textContent.trim().slice(0, 30), ring: ringOn && rgb(cs.outlineColor).a === 1 && ringContrast >= 3, ringContrast, vis: b.bottom > 0 && b.top < innerHeight && b.width > 0 };
    },
  };
};
const open = async (browser, opts) => {
  const page = await browser.newPage(opts);
  await page.goto(file); await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
  await page.evaluate(inPage);
  return page;
};

(async () => {
  const browser = await chromium.launch();
  const out = { axe: {}, contrast: {}, keyboard: {}, targets: {}, sideways: {} };
  for (const scheme of ['light', 'dark']) {
    const page = await open(browser, { viewport: { width: 1280, height: 900 }, colorScheme: scheme });
    await page.addScriptTag({ content: axeSrc });
    const res = await page.evaluate(tags => axe.run(document, { runOnly: { type: 'tag', values: tags } }), TAGS);
    out.axeVersion = res.testEngine.version;
    out.axe[scheme] = { violations: res.violations.map(v => v.id + ' x' + v.nodes.length + ': ' + v.nodes[0].html.slice(0, 90)), incomplete: res.incomplete.map(v => v.id + ' x' + v.nodes.length), passes: res.passes.length };
    out.contrast[scheme] = await page.evaluate(() => __m.contrast());
    if (scheme === 'light') {
      out.targets.w1280 = await page.evaluate(() => __m.targets());
      out.images = await page.evaluate(async () => { const im = [...document.images]; await Promise.all(im.map(i => i.decode().catch(() => 0))); return im.map(i => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0, alt: (i.getAttribute('alt') || '').length })); });
      out.fontsLoaded = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').length);
    }
    // keyboard: Tab through everything, in this theme
    await page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0); });
    const n = out.targets.w1280.n, seen = [], bad = []; let minRing = 99;
    for (let i = 0; i < n + 3; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(450);
      const f = await page.evaluate(() => __m.focused());
      if (!f) break; if (seen.length && f.t === seen[0] && i > 2) break;
      seen.push(f.t); minRing = Math.min(minRing, f.ringContrast);
      if (!f.ring || !f.vis) bad.push((f.ring ? '' : 'weak or no ring: ') + (f.vis ? '' : 'off screen: ') + f.t);
      if (shots && scheme === 'light' && i === 3) await page.screenshot({ path: 'shot-focus.png' });
    }
    out.keyboard[scheme] = { stops: seen.length, problems: bad, minRingContrast: +minRing.toFixed(2) };
    if (scheme === 'light') { // text size doubled at 1280
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      out.sideways.text200at1280 = await page.evaluate(() => __m.sideways());
      await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    }
    if (shots) { await page.evaluate(() => { document.querySelectorAll('details').forEach(d => d.open = false); window.scrollTo(0, 0); }); await page.screenshot({ path: `shot-${scheme}-top.png` }); await page.screenshot({ path: `shot-${scheme}-full.png`, fullPage: true }); }
    await page.close();
  }
  // 320 px wide (phone, or 400% zoom) and 640 px wide (200% zoom on a 1280 px screen)
  for (const [key, vp] of [['w320', { width: 320, height: 640 }], ['zoom200', { width: 640, height: 450 }]]) {
    const m = await open(browser, { viewport: vp });
    out.sideways[key] = await m.evaluate(() => __m.sideways());
    out.targets[key] = await m.evaluate(() => __m.targets());
    if (shots && key === 'w320') { await m.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = false)); await m.screenshot({ path: 'shot-320-top.png' }); await m.screenshot({ path: 'shot-320-full.png', fullPage: true }); }
    await m.close();
  }
  // JavaScript off: the content must still be there
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const nj = await ctx.newPage(); await nj.goto(file);
  out.noJs = { headings: await nj.locator('h1, h2, h3').count(), links: await nj.locator('a').count() };
  await ctx.close();
  await browser.close();

  out.scripts = (distHtml.match(/<script(?![^>]*ld\+json)|\son[a-z]+\s*=\s*["']|javascript:/gi) || []).length;
  const minC = Math.min(out.contrast.light.r, out.contrast.dark.r);
  const minH = Math.min(...Object.values(out.targets).map(t => t.minH.h));
  const noSide = Object.values(out.sideways).every(s => s.sw <= s.cw && s.wide.length === 0);
  const kb = ['light', 'dark'].every(s => out.keyboard[s].problems.length === 0 && out.keyboard[s].stops === out.targets.w1280.n);
  const measured = out.axe.light.violations.length + out.axe.dark.violations.length === 0 && minC >= 4.5 && minH >= 24 && noSide && kb && out.scripts === 0
    && out.images.length > 0 && out.images.every(i => i.ok && i.alt > 20) && out.noJs.headings > 10 && out.noJs.links === out.targets.w1280.n - 1;
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Chicago' });
  const audit = {
    items: [
      `axe-core ${out.axeVersion} finds no violations, in the light or the dark theme.`,
      `The lowest text contrast is ${(Math.floor(minC * 10) / 10).toFixed(1)} to 1. WCAG AA asks for 4.5.`,
      `Every link and control is at least ${minH} pixels tall, on a phone and on a desktop. WCAG AA asks for 24.`,
      `Nothing scrolls sideways at 320 pixels wide, at 200% zoom, or with the text size doubled.`,
      `All ${out.keyboard.light.stops} links and controls take keyboard focus with a visible ring, in both themes.`,
      `No scripts run. With JavaScript off, every heading and link is still there.`],
    summary: 'No axe-core violations. Not yet tested by hand with a screen reader.',
    how: `Measured on ${date} with axe-core and a Playwright script. Automated checks find only some problems. I have not yet tested this page by hand with TalkBack, VoiceOver or NVDA.`,
  };
  if (measured && !process.env.DIST) fs.writeFileSync(path.join(__dirname, 'audit.json'), JSON.stringify(audit, null, 1));
  out.measured = measured;
  out.pageSaysWhatWasMeasured = [...audit.items, audit.summary, audit.how].every(t => distHtml.includes(t));
  out.ok = measured && out.pageSaysWhatWasMeasured;
  console.log(JSON.stringify(out, null, 1));
  process.exitCode = out.ok ? 0 : 1;
})();
