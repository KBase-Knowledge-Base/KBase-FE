import { apiClient } from '@/shared/api/client';
import {
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationOtpRequest,
  LoginRequest,
  LoginResponse,
  AccessTokenResponse,
} from '@/shared/api/types';

export const authApi = {
  // FEAPI-001: Register
  register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },

  // FEAPI-002: Verify email
  verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    return apiClient.request<VerifyEmailResponse>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },

  // FEAPI-003: Resend verification OTP
  resendVerificationOtp(data: ResendVerificationOtpRequest): Promise<void> {
    return apiClient.request<void>('/auth/resend-verification-otp', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },

  // FEAPI-004: Login
  login(data: LoginRequest): Promise<LoginResponse> {
    return apiClient.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },

  // FEAPI-005: Refresh token
  refreshToken(): Promise<AccessTokenResponse> {
    return apiClient.request<AccessTokenResponse>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    });
  },

  // FEAPI-006: Logout
  logout(): Promise<void> {
    return apiClient.request<void>('/auth/logout', {
      method: 'POST',
    });
  },
};
