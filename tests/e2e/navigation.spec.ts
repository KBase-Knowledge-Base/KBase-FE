import { test, expect } from '@playwright/test';

test.describe('Routing, Guarding, and Error States', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/v1/auth/refresh', (route) =>
      route.fulfill({ status: 401, json: { code: 'AUTHENTICATION_REQUIRED' } })
    );
  });

  test('UI22: Not found page renders on unknown route', async ({ page }) => {
    await page.goto('/unknown-nonexistent-route-xyz');

    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Trang không tồn tại')).toBeVisible();

    const homeLink = page.getByRole('link', { name: 'Về trang chủ' });
    await expect(homeLink).toBeVisible();
  });

  test('UI21: Forbidden page renders with permission warning', async ({ page }) => {
    await page.goto('/forbidden');

    await expect(page.getByText('Không có quyền truy cập')).toBeVisible();
  });

  test('Protected routes redirect unauthenticated users to /login', async ({ page }) => {
    await page.goto('/app/projects');

    // Should redirect to login with returnTo
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });
});
