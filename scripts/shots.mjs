// node scripts/shots.mjs <baseUrl> <outDir> [portrait|landscape|both]
// Drives the real UI through the debug hook (window.__fp) into every main
// state and saves @2x screenshots, for design reviews.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [base = 'http://localhost:5179/Final-player/', out = 'shots', which = 'both'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const sizes = { portrait: { width: 390, height: 844 }, landscape: { width: 844, height: 390 } };
const orients = which === 'both' ? ['portrait', 'landscape'] : [which];
const errors = [];

for (const o of orients) {
  const page = await browser.newPage({ viewport: sizes[o], deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.on('pageerror', (e) => errors.push(`${o}: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`${o} console: ${m.text()}`);
  });
  // simulate notch / home-indicator insets the way the library frame does
  await page.addInitScript((o) => {
    const css = o === 'portrait' ? '--mnbg-safe-top:47px;--mnbg-safe-bottom:34px;' : '--mnbg-safe-left:47px;--mnbg-safe-right:47px;--mnbg-safe-bottom:21px;';
    const put = () => document.documentElement?.setAttribute('style', css + 'background:#4a3324');
    if (document.documentElement) put();
    else document.addEventListener('readystatechange', put, { once: true });
    if (!sessionStorage.getItem('fp-shots')) {
      sessionStorage.setItem('fp-shots', '1');
      localStorage.clear();
      localStorage.setItem('final-player:prefs:v1', JSON.stringify({ speed: 'normal', seenSideways: false }));
    }
  }, o);
  const shot = async (name) => {
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${out}/${o}-${name}.png` });
  };
  const fp = (fn, arg) => page.evaluate(fn, arg);
  const settle = async () => {
    for (let i = 0; i < 60; i++) {
      const busy = await page.locator('.tray[data-mode=busy], .overlay.reveal, .titlecard').count();
      if (!busy) return;
      const ov = page.locator('.overlay.reveal');
      if (await ov.count()) await ov.first().click().catch(() => undefined);
      const sk = page.locator('.tray .btn', { hasText: 'Skip' });
      if (await sk.count()) await sk.first().click().catch(() => undefined);
      await page.waitForTimeout(120);
    }
  };
  /** Start fresh games (new seeds) until the bot reaches a prompt of this type. */
  const reach = async (type, opts = {}, cfg = { killer: 'hans', location: 'campHappyTrails', finalGirl: 'laurie' }) => {
    for (let seed = 11; seed < 70; seed++) {
      await fp(({ cfg, seed }) => window.__fp.start({ ...cfg, seed }), { cfg, seed });
      if (await fp(({ type, opts }) => window.__fp.driveTo(type, opts), { type, opts })) return true;
    }
    return false;
  };
  await page.goto(base + '?debug');
  await page.waitForTimeout(1200);
  await shot('01-title');
  // a game in progress
  await fp(() => window.__fp.start({ killer: 'hans', location: 'campHappyTrails', finalGirl: 'laurie', seed: 11 }));
  await page.waitForTimeout(400);
  await settle();
  await shot('02-game-action');
  const card = page.locator('.hand .acard:not(.off)').first();
  if (await card.count()) {
    await card.click({ force: true });
    await shot('03-card-lifted');
    await card.click({ force: true });
  }
  if (await reach('roll')) {
    await settle();
    await shot('04-roll');
  }
  if (await reach('move')) {
    await settle();
    await shot('05-move');
  }
  if (await reach('choice')) {
    await settle();
    await shot('06-choice');
  }
  if (await reach('planning')) {
    await settle();
    await shot('07-planning');
  }
  if (await reach('main', { test: 'g.turn >= 3' })) {
    await fp(() => window.__fp.replay(14));
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/${o}-08-killer-playback.png` });
    await settle();
    // a terror card reveal: replay from just before the latest one
    const n = await fp(() => {
      const g = window.__fp.state();
      const i = [...g.log].reverse().findIndex((e) => e.anim?.kind === 'card' && e.anim.deck === 'terror');
      return i < 0 ? -1 : i + 1;
    });
    if (n > 0) {
      await fp((n) => window.__fp.replay(n), n);
      for (let i = 0; i < 40 && !(await page.locator('.overlay.reveal:not(.cut)').count()); i++) await page.waitForTimeout(150);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${out}/${o}-09-terror-reveal.png` });
      await settle();
    }
  }
  if (await reach('react')) {
    await settle();
    await shot('10-react');
  }
  if (await reach('search')) {
    await settle();
    await shot('11-search');
  }
  if (await reach('rescue', { max: 8000 }, { killer: 'hans', location: 'campHappyTrails', finalGirl: 'reiko' })) {
    await settle();
    await shot('12-rescue');
  }
  // sheets want a live game with some history
  await reach('main', { test: 'g.turn >= 3 && g.fg.items.length > 0' });
  await settle();
  await page.locator('.panel.killer').click();
  await shot('13-killer-sheet');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.locator('.panel.girl').click().catch(() => undefined);
  await shot('15-girl-sheet');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const head = page.locator('.board-head button, .board-head .chit');
  const nHead = await head.count();
  if (nHead) {
    await head.last().click().catch(() => undefined);
    await shot('16-log-sheet');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await head.first().click().catch(() => undefined);
    await shot('17-menu-sheet');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }
  // a space on the board
  const box = await page.locator('.board-svg').boundingBox();
  const fz = await fp(() => window.__fp.state().fg.zone);
  if (box && fz) {
    const pt = await page.evaluate((fz) => {
      const svg = document.querySelector('.board-svg');
      const g = [...svg.querySelectorAll('use')][0];
      const r = (g ?? svg).getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height };
    }, fz);
    await page.mouse.click(pt.x, pt.y);
    await shot('18-zone-sheet');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }
  await fp(() => window.__fp.finish('killer'));
  await page.waitForTimeout(500);
  await shot('14-end');
  // other films' boards
  for (const [k, l, f, name] of [
    ['poltergeist', 'creechManor', 'alice', 'creech'],
    ['geppetto', 'carnivalOfBlood', 'asami', 'carnival'],
    ['drFright', 'mapleLane', 'nancy', 'maple'],
    ['inkanyamba', 'sacredGroves', 'adelaide', 'groves'],
    ['birds', 'campHappyTrails', 'paula', 'birds'],
  ]) {
    await fp(({ k, l, f }) => window.__fp.start({ killer: k, location: l, finalGirl: f, seed: 5 }), { k, l, f });
    await fp(() => window.__fp.driveTo('main', { test: 'g.turn >= 2' }));
    await settle();
    await shot(`20-board-${name}`);
  }
  await fp(() => window.__fp.title());
  await page.waitForTimeout(500);
  await shot('00-title-after');
  await page.close();
}
await browser.close();
if (errors.length) console.log('PAGE ERRORS:\n' + [...new Set(errors)].join('\n'));
console.log('done');
