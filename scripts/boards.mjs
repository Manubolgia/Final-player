// node boards.mjs <outDir> — one shot per board, both orientations
import { chromium } from '/home/user/Final-player/node_modules/@playwright/test/index.mjs';
import { mkdirSync } from 'node:fs';
const out = process.argv[2];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const sizes = { portrait: { width: 390, height: 844 }, landscape: { width: 844, height: 390 } };
for (const o of ['portrait', 'landscape']) {
  const page = await browser.newPage({ viewport: sizes[o], deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.on('pageerror', (e) => console.log(o, e.message));
  await page.addInitScript((o) => {
    const css = o === 'portrait' ? '--mnbg-safe-top:47px;--mnbg-safe-bottom:34px;' : '--mnbg-safe-left:47px;--mnbg-safe-right:47px;--mnbg-safe-bottom:21px;';
    const put = () => document.documentElement?.setAttribute('style', css + 'background:#4a3324');
    if (document.documentElement) put(); else document.addEventListener('readystatechange', put, { once: true });
    localStorage.setItem('final-player:prefs:v1', JSON.stringify({ speed: 'fast', tips: ['hand', 'move', 'deck'], seenSideways: true, seenInstall: true, panicAll: false }));
  }, o);
  await page.goto('http://localhost:5179/Final-player/?debug');
  await page.waitForTimeout(1000);
  for (const [k, l, f, name] of [
    ['hans', 'campHappyTrails', 'laurie', 'trails'],
    ['poltergeist', 'creechManor', 'alice', 'creech'],
    ['geppetto', 'carnivalOfBlood', 'asami', 'carnival'],
    ['drFright', 'mapleLane', 'nancy', 'maple'],
    ['inkanyamba', 'sacredGroves', 'adelaide', 'groves'],
  ]) {
    await page.evaluate(({ k, l, f }) => window.__fp.start({ killer: k, location: l, finalGirl: f, seed: 5 }), { k, l, f });
    await page.waitForTimeout(1600);
    for (let i = 0; i < 20; i++) {
      const ov = page.locator('.overlay.reveal, .titlecard');
      if (!(await ov.count())) break;
      await ov.first().click().catch(() => undefined);
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/${o}-${name}.png` });
  }
  await page.close();
}
await browser.close();
