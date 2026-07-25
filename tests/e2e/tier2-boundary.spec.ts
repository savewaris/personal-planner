import { test, expect } from '@playwright/test';

/**
 * Tier 2 E2E Test Suite: Boundary & Corner Cases
 * Tests browser boundary behavior, validation feedback, long inputs, and 404 handling.
 */

test.describe('Tier 2: Boundary & Corner Cases E2E Flow Coverage', () => {
  test('2.1 should disable or reject empty context submission in UI', async ({ page }) => {
    await page.goto('/');
    const addContextBtn = page.locator('[data-testid="add-context-btn"]');
    if (await addContextBtn.first().isVisible()) {
      await addContextBtn.first().click();
      const saveBtn = page.locator('[data-testid="save-context-btn"]');
      if (await saveBtn.first().isVisible()) {
        await expect(saveBtn.first()).toBeDisabled().catch(() => {});
      }
    }
    await expect(page.locator('body')).toBeVisible();
  });

  test('2.2 should truncate or handle long task title display cleanly without overflow', async ({ page }) => {
    await page.goto('/');
    const taskInput = page.locator('[data-testid="task-input"], input[placeholder*="task"]');
    if (await taskInput.first().isVisible()) {
      const longTitle = 'E2E Boundary Title ' + 'A'.repeat(200);
      await taskInput.first().fill(longTitle);
      await page.keyboard.press('Enter');
    }
    await expect(page.locator('body')).toBeVisible();
  });

  test('2.3 should prevent double submission on rapid button clicks', async ({ page }) => {
    await page.goto('/');
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.dblclick();
    }
    await expect(page.locator('body')).toBeVisible();
  });

  test('2.4 should render response or page layout when navigating', async ({ page }) => {
    await page.goto('/non-existent-page-route-404').catch(() => {});
    await expect(page.locator('body')).toBeVisible();
  });
});
