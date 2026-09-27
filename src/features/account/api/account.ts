import { apiClient } from '@/shared/api/client';
import {
  UserResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '@/shared/api/types';

export const accountApi = {
  // FEAPI-007: Get current user profile
  getCurrentUser(): Promise<UserResponse> {
    return apiClient.request<UserResponse>('/users/me', {
      method: 'GET',
    });
  },

  // FEAPI-008: Update displayName
  updateProfile(data: UpdateProfileRequest): Promise<UserResponse> {
    return apiClient.request<UserResponse>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // FEAPI-009: Change password
  changePassword(data: ChangePasswordRequest): Promise<void> {
    return apiClient.request<void>('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
