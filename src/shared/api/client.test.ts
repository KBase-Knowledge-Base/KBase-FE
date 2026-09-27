import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient, tokenStorage } from './client';
import { server } from '@/test/server';
import { http, HttpResponse } from 'msw';
import { isApiError } from './errors';

describe('apiClient and tokenStorage', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  describe('tokenStorage (Memory-only)', () => {
    it('stores token in memory only and does not touch localStorage or sessionStorage', () => {
      tokenStorage.setToken('test-memory-token');
      expect(tokenStorage.getToken()).toBe('test-memory-token');

      // Check localStorage & sessionStorage
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(sessionStorage.getItem('token')).toBeNull();
    });

    it('clears token on logout/clear', () => {
      tokenStorage.setToken('test-token');
      expect(tokenStorage.getToken()).toBe('test-token');
      tokenStorage.clear();
      expect(tokenStorage.getToken()).toBeNull();
    });
  });

  describe('Authentication and Replay', () => {
    it('attaches Bearer token to request headers', async () => {
      tokenStorage.setToken('valid-token-123');

      server.use(
        http.get('/api/v1/test-auth', ({ request }) => {
          const auth = request.headers.get('Authorization');
          if (auth === 'Bearer valid-token-123') {
            return HttpResponse.json({ success: true });
          }
          return new HttpResponse(null, { status: 401 });
        })
      );

      const res = await apiClient.get<{ success: boolean }>('/api/v1/test-auth');
      expect(res.success).toBe(true);
    });

    it('performs single-flight refresh on 401 and replays request', async () => {
      let refreshCount = 0;
      let attemptCount = 0;

      server.use(
        http.post('/api/v1/auth/refresh', () => {
          refreshCount++;
          return HttpResponse.json({
            accessToken: 'refreshed-token-999',
            tokenType: 'Bearer',
            expiresIn: 900,
            user: {
              id: 'u1',
              email: 'test@kbase.dev',
              fullName: 'Test User',
              displayName: 'Test User',
              role: 'USER',
              emailVerified: true,
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
          });
        }),
        http.get('/api/v1/protected-data', ({ request }) => {
          attemptCount++;
          const auth = request.headers.get('Authorization');
          if (auth === 'Bearer refreshed-token-999') {
            return HttpResponse.json({ data: 'secret' });
          }
          return HttpResponse.json(
            { code: 'AUTH_UNAUTHORIZED', message: 'Token expired' },
            { status: 401 }
          );
        })
      );

      // Set expired initial token
      tokenStorage.setToken('expired-token');

      // Execute 2 concurrent requests
      const [res1, res2] = await Promise.all([
        apiClient.get<{ data: string }>('/api/v1/protected-data'),
        apiClient.get<{ data: string }>('/api/v1/protected-data'),
      ]);

      expect(res1.data).toBe('secret');
      expect(res2.data).toBe('secret');
      // Single flight: refresh should only be called once!
      expect(refreshCount).toBe(1);
      // Both requests attempted once (401) + replayed once (200) = 4 total attempts
      expect(attemptCount).toBe(4);
    });
  });

  describe('Error handling', () => {
    it('correctly maps 404 response to ApiError', async () => {
      server.use(
        http.get('/api/v1/missing', () => {
          return HttpResponse.json(
            { code: 'RESOURCE_NOT_FOUND', message: 'Item not found' },
            { status: 404 }
          );
        })
      );

      try {
        await apiClient.get('/api/v1/missing');
        expect.unreachable('Should have thrown an ApiError');
      } catch (err) {
        expect(isApiError(err)).toBe(true);
        if (isApiError(err)) {
          expect(err.status).toBe(404);
          expect(err.code).toBe('RESOURCE_NOT_FOUND');
          expect(err.message).toBe('Không tìm thấy dữ liệu yêu cầu hoặc dữ liệu đã bị xóa.');
        }
      }
    });

    it('handles 204 No Content without error', async () => {
      server.use(
        http.delete('/api/v1/items/123', () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const res = await apiClient.delete('/api/v1/items/123');
      expect(res).toBeUndefined();
    });
  });
});
