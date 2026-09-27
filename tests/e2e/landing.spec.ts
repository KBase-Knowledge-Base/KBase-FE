import { test, expect } from '@playwright/test';

test.describe('UI01: Landing Page and Responsive Design', () => {
  test('renders hero section, workflow story, and feature pillars', async ({ page }) => {
    // Intercept refresh so bootstrap is instant
    await page.route('/api/v1/auth/refresh', (route) =>
      route.fulfill({ status: 401, json: { code: 'AUTHENTICATION_REQUIRED' } })
    );

    await page.goto('/');

    // Check title and hero
    await expect(page).toHaveTitle(/KBase/);
    await expect(page.locator('h1')).toContainText('Tri thức của nhóm');

    // Check CTA buttons
    const getStartedBtn = page.getByRole('link', { name: 'Tạo tài khoản miễn phí' });
    await expect(getStartedBtn).toBeVisible();

    // Check problem section
    await expect(page.getByText('Thực trạng tài liệu rời rạc trong các nhóm làm việc')).toBeVisible();

    // Check 3 pillars
    await expect(page.getByText('1. Tổ chức tri thức khoa học')).toBeVisible();
    await expect(page.getByText('2. Phân quyền và bảo mật chặt chẽ')).toBeVisible();
    await expect(page.getByText('3. Trợ lý AI có trích dẫn nguồn')).toBeVisible();

    // Check 3-step workflow story
    await expect(page.getByText('Tải lên tài liệu')).toBeVisible();
    await expect(page.getByText('Sắp xếp & Lập chỉ mục')).toBeVisible();
    await expect(page.getByText('Hỏi đáp có nguồn dẫn')).toBeVisible();

    // Check footer
    await expect(page.locator('footer')).toContainText('KBase');
  });

  test('responsive viewport checks (360px, 390px, 768px, 1280px)', async ({ page }) => {
    // 360px Mobile (Android small)
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();

    // 390px Mobile (iPhone modern)
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('h1')).toBeVisible();

    // 768px Tablet (iPad portrait)
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();

    // 1280px Desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('h1')).toBeVisible();
  });
});
