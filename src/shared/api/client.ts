import { ApiError } from './errors';
import { ApiErrorResponse, AccessTokenResponse } from './types';

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

class ApiClient {
  private accessToken: string | null = null;
  private sessionEpoch: number = 0;
  private refreshPromise: Promise<string | null> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private onUnauthorizedCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('kbase_auth_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'LOGOUT') {
            this.clearSession(false);
            if (this.onUnauthorizedCallback) {
              this.onUnauthorizedCallback();
            }
          }
        };
      } catch {
        // Fallback for environments where BroadcastChannel is unavailable
      }
    }
  }

  public getSessionEpoch(): number {
    return this.sessionEpoch;
  }

  public setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public setOnUnauthorized(callback: () => void): void {
    this.onUnauthorizedCallback = callback;
  }

  public clearSession(broadcast: boolean = true): void {
    this.accessToken = null;
    this.sessionEpoch += 1;
    this.refreshPromise = null;
    if (broadcast && this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'LOGOUT', epoch: this.sessionEpoch });
    }
  }

  /**
   * Single-flight token refresh
   */
  public async refreshToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const currentEpoch = this.sessionEpoch;

    this.refreshPromise = (async () => {
      try {
        const response = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (this.sessionEpoch !== currentEpoch) {
          // Session changed during refresh, discard result
          return null;
        }

        if (!response.ok) {
          this.setAccessToken(null);
          return null;
        }

        const data = (await response.json()) as AccessTokenResponse;
        this.setAccessToken(data.accessToken);
        return data.accessToken;
      } catch {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Main request method
   */
  public async request<T = unknown>(
    path: string,
    options: RequestOptions = {},
    isReplay: boolean = false
  ): Promise<T> {
    const currentEpoch = this.sessionEpoch;
    const url = path.startsWith('http') ? path : path.startsWith('/api') ? path : `/api/v1${path.startsWith('/') ? path : `/${path}`}`;

    const headers = new Headers(options.headers || {});

    // Attach Bearer token if not explicitly skipped and available
    if (!options.skipAuth && this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    // Default JSON Content-Type if body is an object (and not FormData)
    if (options.body && !(options.body instanceof FormData) && !(options.body instanceof Blob)) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }

    // Optional timeout controller
    let signal = options.signal;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const isJsdom = typeof navigator !== 'undefined' && navigator.userAgent?.includes('jsdom');
    if (options.timeoutMs && !isJsdom) {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);
      if (signal) {
        signal.addEventListener('abort', () => controller.abort());
      }
      signal = controller.signal;
    }

    try {
      const fetchOptions: RequestInit = {
        ...options,
        headers,
        credentials: 'include',
      };
      if (signal) {
        fetchOptions.signal = signal;
      }
      const response = await fetch(url, fetchOptions);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Check session epoch
      if (this.sessionEpoch !== currentEpoch) {
        throw new Error('Response discarded due to session change');
      }

      // 204 No Content
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      // Check for 401 Unauthorized for possible token refresh replay
      if (response.status === 401 && !options.skipAuth && !isReplay && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
        const errorBody = await response.clone().json().catch(() => null);
        const code = errorBody?.code;

        // Only refresh on token expiry or explicit token rejection, NEVER on invalid credentials
        if (code !== 'INVALID_CREDENTIALS' && code !== 'AUTH_INVALID_CREDENTIALS') {
          const newToken = await this.refreshToken();
          if (newToken) {
            // Replay original request exactly once
            return this.request<T>(path, options, true);
          } else {
            this.clearSession(true);
            if (this.onUnauthorizedCallback) {
              this.onUnauthorizedCallback();
            }
          }
        }
      }

      // Handle non-OK status
      if (!response.ok) {
        let errorData: ApiErrorResponse;
        try {
          errorData = await response.json();
          if (!errorData.status) {
            errorData.status = response.status;
          }
        } catch {
          errorData = {
            timestamp: new Date().toISOString(),
            status: response.status,
            code: response.status === 403 ? 'ACCESS_DENIED' : response.status === 404 ? 'RESOURCE_NOT_FOUND' : 'SERVER_ERROR',
            message: response.statusText || 'Server Error',
            path,
            requestId: response.headers.get('X-Request-Id') || 'unknown',
          };
        }
        throw new ApiError(errorData);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (err instanceof ApiError) {
        throw err;
      }
      if ((err as Error)?.name === 'AbortError') {
        throw new ApiError({
          timestamp: new Date().toISOString(),
          status: 408,
          code: 'REQUEST_TIMEOUT',
          message: 'Yêu cầu hết thời gian chờ (timeout). Vui lòng thử lại.',
          path,
          requestId: 'client-timeout',
        });
      }
      throw err;
    }
  }

  public async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  /**
   * Authenticated binary fetch (for preview, download, Range requests)
   */
  public async fetchBinary(
    path: string,
    options: RequestOptions = {}
  ): Promise<{ blob: Blob; contentType: string; contentRange?: string | null; disposition?: string | null }> {
    const url = path.startsWith('http') ? path : path.startsWith('/api') ? path : `/api/v1${path.startsWith('/') ? path : `/${path}`}`;
    const headers = new Headers(options.headers || {});

    if (!options.skipAuth && this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      let errorData: ApiErrorResponse;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          timestamp: new Date().toISOString(),
          status: response.status,
          code: response.status === 403 ? 'ACCESS_DENIED' : response.status === 404 ? 'RESOURCE_NOT_FOUND' : 'SERVER_ERROR',
          message: response.statusText || 'Lỗi tải tệp tin.',
          path,
          requestId: response.headers.get('X-Request-Id') || 'unknown',
        };
      }
      throw new ApiError(errorData);
    }

    const blob = await response.blob();
    return {
      blob,
      contentType: response.headers.get('Content-Type') || 'application/octet-stream',
      contentRange: response.headers.get('Content-Range'),
      disposition: response.headers.get('Content-Disposition'),
    };
  }
}

export const apiClient = new ApiClient();

export const tokenStorage = {
  getToken: () => apiClient.getAccessToken(),
  setToken: (token: string | null) => apiClient.setAccessToken(token),
  clear: () => apiClient.clearSession(),
};
