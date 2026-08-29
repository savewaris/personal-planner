import { test, expect } from '@playwright/test';

test.describe('Touch Target Ergonomics & Tap Spacing', () => {
  test('interactive mobile buttons and links meet minimum touch target area (>= 24px WCAG 2.5.8)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const smallTargets = await page.$$eval('button, a[href], input, select', (elements) => {
      return elements
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          // Filter out hidden/display:none elements
          if (rect.width === 0 || rect.height === 0) return false;
          // WCAG 2.5.8 minimum target size is 24x24 CSS pixels
          return rect.width < 24 || rect.height < 24;
        })
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return `${el.tagName.toLowerCase()}.${el.className} [${Math.round(rect.width)}x${Math.round(rect.height)}px] - text: "${(el.textContent || '').trim().slice(0, 20)}"`;
        });
    });

    if (smallTargets.length > 0) {
      console.warn('Elements below 24px minimum touch target size:', smallTargets);
    }

    // Strict assertion: no critical interactive elements under 24px
    expect(smallTargets).toEqual([]);
  });
});
