// npm run icons — renders the PWA icons from public/icon.svg with the bundled Chromium.
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const source = readFileSync('public/icon.svg', 'utf8');
/** The hockey mask on its own, for the full-bleed maskable icon (keeps it inside the safe zone). */
const inner = source.replace(/<rect width="512" height="512" rx="112"[^>]*\/>/, '');

function svg(size: number, maskable: boolean): string {
  if (!maskable) return source.replace('<svg ', `<svg width="${size}" height="${size}" `);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0b0507"/>
  <g transform="translate(76.8 76.8) scale(0.7)">${inner.replace(/<\/?svg[^>]*>/g, '')}</g>
</svg>`;
}

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {});
const page = await browser.newPage();
for (const [file, size, maskable] of [
  ['public/icon-192.png', 192, false],
  ['public/icon-512.png', 512, false],
  ['public/icon-maskable.png', 512, true],
] as const) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(size, maskable)}</body></html>`);
  await page.screenshot({ path: file, omitBackground: !maskable, clip: { x: 0, y: 0, width: size, height: size } });
  console.log('wrote', file);
}
await browser.close();
