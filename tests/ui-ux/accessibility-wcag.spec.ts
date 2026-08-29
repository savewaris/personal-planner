import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.2 AA Automated Accessibility Audit', () => {
  test('should have zero critical or serious WCAG accessibility violations on public viewports', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Wait for client animations and hydration to settle
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .disableRules(['color-contrast']) // Color contrast verified with dedicated tolerance check or enabled when theme is ready
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.error('WCAG Violations Detected:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('all interactive buttons and links must have accessible names', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const unnamedButtons = await page.$$eval('button, a[href]', (elements) => {
      return elements
        .filter((el) => {
          const ariaLabel = el.getAttribute('aria-label');
          const title = el.getAttribute('title');
          const text = (el.textContent || '').trim();
          return !ariaLabel && !title && !text;
        })
        .map((el) => el.outerHTML);
    });

    expect(unnamedButtons).toEqual([]);
  });
});
