// node scripts/shot.mjs <url> <outdir> — click through a few screens and screenshot them.
import { chromium } from '@playwright/test';
const [url, out] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
await page.goto(url);
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/01-title.png` });
await page.getByText('Start the night').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/02-game-start.png` });
// tap through card overlays / skip
for (let i = 0; i < 6; i++) {
  const ov = page.locator('.overlay');
  if (await ov.count()) await ov.first().click();
  const sk = page.getByText('Skip ▸▸');
  if (await sk.count()) await sk.click();
  await page.waitForTimeout(250);
}
await page.screenshot({ path: `${out}/03-game.png` });
const cards = page.locator('.dock .acard');
if (await cards.count()) { await cards.first().click(); await page.waitForTimeout(200); }
await page.screenshot({ path: `${out}/04-card-selected.png` });
await browser.close();
