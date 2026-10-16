import { expect, test, type Page } from '@playwright/test';

// Plays whole games through the real interface, tapping whatever the dock
// offers, until the end screen or a step cap. Fails on any page error.

/** One tap: overlays and skips first, then something from the dock. */
async function step(page: Page, seed: number): Promise<'end' | 'tap' | 'idle'> {
  return page.evaluate((n) => {
    const visible = (el: Element) => (el as HTMLElement).offsetParent !== null && !(el as HTMLButtonElement).disabled;
    const all = (s: string) => [...document.querySelectorAll(s)].filter(visible) as HTMLElement[];
    if (document.querySelector('.end-screen')) return 'end';
    const overlay = all('.overlay').find((o) => getComputedStyle(o).pointerEvents !== 'none');
    if (overlay) {
      overlay.click();
      return 'tap';
    }
    const skip = all('.dock .btn').find((b) => b.textContent?.includes('Skip'));
    if (skip) {
      skip.click();
      return 'tap';
    }
    const pick = <T,>(xs: T[]): T => xs[Math.floor(((n * 9301 + 49297) % 233280) / 233280 * xs.length)];
    const dock = document.querySelector('.dock');
    if (!dock) return 'idle';
    const head = dock.querySelector('h4')?.textContent ?? '';
    const btn = (t: string) => all('.dock .btn').find((b) => b.textContent?.includes(t));
    if (head.startsWith('Too many cards')) {
      const need = Number(head.match(/discard (\d+)/)?.[1] ?? 1);
      const sel = all('.dock .acard.sel').length;
      if (sel < need) all('.dock .acard:not(.sel)')[0]?.click();
      else btn('Discard')?.click();
      return 'tap';
    }
    const slot = all('.dock .slot:not(.full)');
    const who = all('.dock .btn.small');
    if (slot.length && who.length) {
      if (!all('.dock .btn.small.good').length) who[0].click();
      else slot[0].click();
      return 'tap';
    }
    const play = all('.dock .btn.primary').find((b) => b.textContent?.startsWith('Play '));
    if (play) {
      play.click();
      return 'tap';
    }
    const end = btn('End turn') ?? btn("Don't strike");
    if (end) {
      const cards = all('.dock .acard:not(.off)');
      if (cards.length && n % 4 !== 0) pick(cards).click();
      else end.click();
      return 'tap';
    }
    const done = btn('Done');
    if (done) {
      const buy = btn('Buy');
      const cards = all('.dock .acard:not(.off)');
      if (buy && n % 3) buy.click();
      else if (cards.length && n % 2) pick(cards).click();
      else done.click();
      return 'tap';
    }
    const opts = all('.dock .opt');
    if (opts.length) {
      pick(opts).click();
      return 'tap';
    }
    const primary = all('.dock .btn.primary, .dock .btn.good');
    if (primary.length) {
      primary[0].click();
      return 'tap';
    }
    const any = all('.dock .btn');
    if (any.length) {
      pick(any).click();
      return 'tap';
    }
    return 'idle';
  }, seed);
}

async function playFilm(page: Page, film: string) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.logo')).toHaveText('Final Player');
  await page.locator('.film-card', { hasText: film }).first().click();
  await page.getByRole('button', { name: 'Start the night' }).click();
  await expect(page.locator('.panel').first()).toBeVisible();

  let ended = false;
  let idle = 0;
  for (let i = 0; i < 1500 && !ended; i++) {
    const r = await step(page, i);
    if (r === 'end') ended = true;
    else if (r === 'idle') {
      idle++;
      await page.waitForTimeout(60);
      expect(idle, 'the interface stopped offering anything to do').toBeLessThan(200);
    } else idle = 0;
    if (i % 25 === 0) expect(errors).toEqual([]);
  }
  expect(errors).toEqual([]);
  if (ended) console.log(`${film}: ${await page.locator('.end-screen .outcome').textContent()}`);
  return ended;
}

for (const film of ['Happy Trails', 'Creech', 'Carnival', 'Maple', 'Groves', 'Terror from Above']) {
  test(`a game of ${film} plays through the interface`, async ({ page }) => {
    const ended = await playFilm(page, film);
    if (ended) await expect(page.locator('.end-screen')).toBeVisible();
  });
}

test('it installs: manifest and service worker', async ({ page }) => {
  await page.goto('./');
  const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifest).toBeTruthy();
  const res = await page.request.get(new URL(manifest!, page.url()).toString());
  const json = await res.json();
  expect(json.name).toBe('Final Player');
  expect(json.icons.length).toBeGreaterThanOrEqual(3);
  await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())), { timeout: 15_000 }).toBe(true);
});
