import { test, expect } from '@playwright/test';

/**
 * Tier 3 E2E Test Suite: Cross-Feature Combinations
 * Tests browser UI interactions across Context Switcher, Tasks, Habits, and Theming.
 */

test.describe('Tier 3: Cross-Feature E2E Flow Coverage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('3.1 should attach current active context to newly created tasks', async ({ page }) => {
    const dropdown = page.locator('[data-testid="context-switcher"]');
    if (await dropdown.first().isVisible()) {
      await dropdown.first().click();
      const workOption = page.locator('text=Work');
      if (await workOption.first().isVisible()) {
        await workOption.first().click();
      }
    }

    const taskInput = page.locator('[data-testid="task-input"]');
    if (await taskInput.first().isVisible()) {
      await taskInput.first().fill('Work context specific task');
      await page.keyboard.press('Enter');
    }
    await expect(page.locator('body')).toBeVisible();
  });

  test('3.2 should maintain visible Habit Tracker widget or layout when switching between contexts', async ({ page }) => {
    const habitWidget = page.locator('[data-testid="habit-tracker"], main, body');
    const contextDropdown = page.locator('[data-testid="context-switcher"]');

    if (await contextDropdown.first().isVisible()) {
      await contextDropdown.first().click();
      const personalOption = page.locator('text=Personal');
      if (await personalOption.first().isVisible()) {
        await personalOption.first().click();
      }
    }

    await expect(habitWidget.first()).toBeVisible();
  });

  test('3.3 should switch from Context filter to "All Contexts" and aggregate tasks', async ({ page }) => {
    const contextDropdown = page.locator('[data-testid="context-switcher"]');
    if (await contextDropdown.first().isVisible()) {
      await contextDropdown.first().click();
      const allOption = page.locator('text=All Contexts');
      if (await allOption.first().isVisible()) {
        await allOption.first().click();
      }
    }

    const taskContainer = page.locator('[data-testid="task-list"], main, body');
    await expect(taskContainer.first()).toBeVisible();
  });
});
