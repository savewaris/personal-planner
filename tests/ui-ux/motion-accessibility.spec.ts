import { test, expect } from '@playwright/test';

test.describe('Motion Accessibility & Reduced Motion Safety', () => {
  test('should render content gracefully when prefers-reduced-motion is active', async ({ page }) => {
    // Emulate user preference for reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Verify main landmarks are immediately visible without motion delays
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Verify no persistent opacity 0 or transform bugs on animated elements
    const invisibleHeadings = await page.$$eval('h1, h2, h3', (headings) => {
      return headings
        .filter((h) => {
          const style = window.getComputedStyle(h);
          return style.opacity === '0' || style.visibility === 'hidden' || style.display === 'none';
        })
        .map((h) => h.textContent);
    });

    expect(invisibleHeadings).toEqual([]);
  });
});
