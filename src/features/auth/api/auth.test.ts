import { describe, it, expect } from 'vitest';
import { authApi } from './auth';
import { isApiError } from '@/shared/api/errors';

describe('authApi module', () => {
  it('successfully logs in with valid credentials', async () => {
    const res = await authApi.login({
      email: 'test@kbase.dev',
      password: 'Password123!',
    });

    expect(res.accessToken).toBe('mock-access-token-123');
    expect(res.user.email).toBe('test@kbase.dev');
    expect(res.user.systemRole).toBe('USER');
  });

  it('throws ApiError with status 401 on invalid credentials', async () => {
    try {
      await authApi.login({
        email: 'invalid@kbase.dev',
        password: 'wrongpassword',
      });
      expect.unreachable('Should have thrown ApiError');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) {
        expect(err.status).toBe(401);
        expect(err.code).toBe('AUTH_INVALID_CREDENTIALS');
      }
    }
  });

  it('calls logout endpoint and completes', async () => {
    await expect(authApi.logout()).resolves.toBeUndefined();
  });
});
