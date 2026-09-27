import { test, expect } from '@playwright/test';

test.describe('Auth Flow & Form Validations', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept refresh so bootstrap resolves instantly as anonymous
    await page.route('/api/v1/auth/refresh', (route) =>
      route.fulfill({ status: 401, json: { code: 'AUTHENTICATION_REQUIRED' } })
    );
  });

  test('UI02: Login form validation', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Đăng nhập tài khoản' })).toBeVisible();

    // Trigger validation by clicking submit with empty fields
    const submitBtn = page.getByRole('button', { name: 'Đăng nhập' });
    await submitBtn.click();

    // Form validation messages
    await expect(page.getByText('Vui lòng nhập email')).toBeVisible();
    await expect(page.getByText('Vui lòng nhập mật khẩu')).toBeVisible();
  });

  test('UI03: Register form validation and password mismatch', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: 'Tạo tài khoản mới' })).toBeVisible();

    // Fill mismatched passwords
    await page.fill('input[type="email"]', 'newuser@kbase.dev');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'MismatchPassword!');

    const submitBtn = page.getByRole('button', { name: 'Đăng ký tài khoản' });
    await submitBtn.click();

    await expect(page.getByText('Mật khẩu xác nhận không khớp')).toBeVisible();
  });

  test('UI04: Verify email page renders input for OTP', async ({ page }) => {
    await page.goto('/verify-email?email=test%40kbase.dev');

    await expect(page.getByRole('heading', { name: 'Xác thực địa chỉ email' })).toBeVisible();
    await expect(page.locator('input[name="otp"]')).toBeVisible();
  });
});
