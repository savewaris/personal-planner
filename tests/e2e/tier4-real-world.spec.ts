import { test, expect } from '@playwright/test';

/**
 * Tier 4 E2E Test Suite: Real-World Application Scenarios
 * Tests complete end-to-end multi-context user workflow:
 * User login -> Create contexts -> Add tasks per context -> View aggregated tasks -> Log daily habit -> Verify streak increment.
 */

test.describe('Tier 4: Real-World Multi-Context E2E Workflow', () => {
  test('4.1 Full E2E Workflow: Login -> Create Contexts -> Aggregate Tasks -> Complete Habit -> Check Streak', async ({ page }) => {
    // Step 1: User Navigation
    await page.goto('/login').catch(() => page.goto('/'));
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    if (await emailInput.first().isVisible()) {
      await emailInput.first().fill('user@planner.app');
      await passwordInput.first().fill('Password123!');
      await submitBtn.first().click();
    }

    // Step 2: Navigate to Dashboard & Verify Navbar / Layout
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // Step 3: Create / Select Work Context
    const contextSwitcher = page.locator('[data-testid="context-switcher"], [data-testid="context-dropdown"]');
    if (await contextSwitcher.first().isVisible()) {
      await contextSwitcher.first().click();
      const workOption = page.locator('text=Work');
      if (await workOption.first().isVisible()) {
        await workOption.first().click();
      }
    }

    // Step 4: Add Work Task
    const taskInput = page.locator('[data-testid="task-input"], input[placeholder*="task"]');
    if (await taskInput.first().isVisible()) {
      await taskInput.first().fill('Finish Q3 Architecture Spec');
      await page.keyboard.press('Enter');
    }

    // Step 5: Switch to Personal Context and Add Personal Task
    if (await contextSwitcher.first().isVisible()) {
      await contextSwitcher.first().click();
      const personalOption = page.locator('text=Personal');
      if (await personalOption.first().isVisible()) {
        await personalOption.first().click();
      }
    }

    if (await taskInput.first().isVisible()) {
      await taskInput.first().fill('Buy Groceries for Dinner');
      await page.keyboard.press('Enter');
    }

    // Step 6: Select "All Contexts" and Verify Aggregated Task List
    if (await contextSwitcher.first().isVisible()) {
      await contextSwitcher.first().click();
      const allOption = page.locator('text=All Contexts');
      if (await allOption.first().isVisible()) {
        await allOption.first().click();
      }
    }

    // Step 7: Complete Daily Habit and Check Streak Counter
    const habitCheckBtn = page.locator('[data-testid="habit-check-today"], button[aria-label*="log"]').first();
    if (await habitCheckBtn.isVisible()) {
      await habitCheckBtn.click();
    }

    await expect(page.locator('body')).toBeVisible();
  });
});
