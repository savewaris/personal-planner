import { test, expect } from '@playwright/test';

test.describe('Semantic HTML, Heading Hierarchy & Image Alt Tags', () => {
  test('page must contain exactly one h1 tag for SEO and screen-reader accessibility', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('all img tags must have alt attributes (descriptive or empty aria-hidden for decorative)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const missingAlts = await page.$$eval('img', (imgs) => {
      return imgs
        .filter((img) => !img.hasAttribute('alt'))
        .map((img) => img.src);
    });

    expect(missingAlts).toEqual([]);
  });

  test('external links must have secure rel="noopener noreferrer" and target="_blank"', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const insecureLinks = await page.$$eval('a[target="_blank"]', (links) => {
      return links
        .filter((a) => {
          const rel = a.getAttribute('rel') || '';
          return !rel.includes('noopener') || !rel.includes('noreferrer');
        })
        .map((a) => a.getAttribute('href') || '');
    });

    expect(insecureLinks).toEqual([]);
  });
});
