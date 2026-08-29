import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'Mobile (375px)', width: 375, height: 667 },
  { name: 'Tablet (768px)', width: 768, height: 1024 },
  { name: 'Desktop (1440px)', width: 1440, height: 900 },
];

test.describe('Responsive Viewport Integrity & Horizontal Overflow', () => {
  for (const vp of VIEWPORTS) {
    test(`should have ZERO horizontal overflow on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      // Check document body width vs window innerWidth
      const overflowDetails = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const hasOverflow = scrollWidth > clientWidth;

        // Find overflowing elements if any
        const overflowingElements: string[] = [];
        if (hasOverflow) {
          const all = document.querySelectorAll('*');
          all.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.right > clientWidth + 1) {
              overflowingElements.push(
                `${el.tagName.toLowerCase()}.${el.className} (width: ${rect.width}px, right: ${rect.right}px > ${clientWidth}px)`
              );
            }
          });
        }

        return {
          scrollWidth,
          clientWidth,
          hasOverflow,
          overflowingElements: overflowingElements.slice(0, 5),
        };
      });

      if (overflowDetails.hasOverflow) {
        console.error(`Horizontal overflow on ${vp.name}:`, overflowDetails);
      }

      expect(overflowDetails.hasOverflow).toBe(false);
    });
  }
});
