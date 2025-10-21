import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    window.__TROLLEY_TEST_MODE = true;
  });
});

test('shows the nearest stop badge on load', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Nearest stop').first()).toBeVisible();
});

test('allows setting an alert when service is on', async ({ baseURL, context, page }) => {
  if (baseURL) {
    const origin = new URL(baseURL).origin;
    await context.grantPermissions(['notifications'], { origin });
  }
  await page.goto('/');
  const alertButton = page.getByRole('button', { name: /5 min/i });
  await alertButton.click();
  await expect(page.getByText(/Alert set for/i)).toBeVisible();
});

test('disables alerts when service is off', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.__trolleyTestHooks));
  await page.evaluate(() => {
    window.__trolleyTestHooks.setServiceState('off');
  });
  const alertButton = page.getByRole('button', { name: /5 min/i });
  await expect(alertButton).toBeDisabled();
});

test('falls back to schedule estimates when live feed fails', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Live ETA').first()).toBeVisible();
  await page.waitForFunction(() => Boolean(window.__trolleyTestHooks));
  await page.evaluate(() => {
    window.__trolleyTestHooks.simulateLiveError();
  });
  await expect(page.getByText('Schedule estimate').first()).toBeVisible();
});
