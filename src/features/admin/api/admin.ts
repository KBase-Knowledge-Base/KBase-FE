import { apiClient } from '@/shared/api/client';
import {
  UserResponse,
  ProjectResponse,
  ChangeUserStatusRequest,
  PageResponse,
  UserStatus,
  SystemRole,
} from '@/shared/api/types';

export interface GetAdminUsersParams {
  q?: string;
  status?: UserStatus;
  systemRole?: SystemRole;
  page?: number;
  size?: number;
  sort?: string;
}

export interface GetAdminProjectsParams {
  q?: string;
  ownerId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const adminApi = {
  // FEAPI-010: List all users in system
  getAdminUsers(params: GetAdminUsersParams = {}): Promise<PageResponse<UserResponse>> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.status) searchParams.set('status', params.status);
    if (params.systemRole) searchParams.set('systemRole', params.systemRole);
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.sort) searchParams.set('sort', params.sort);

    const qs = searchParams.toString();
    return apiClient.request<PageResponse<UserResponse>>(`/admin/users${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  // FEAPI-011: Get single user details
  getAdminUser(userId: string): Promise<UserResponse> {
    return apiClient.request<UserResponse>(`/admin/users/${userId}`, {
      method: 'GET',
    });
  },

  // FEAPI-012: Change user status (ACTIVE / DISABLED)
  changeUserStatus(userId: string, data: ChangeUserStatusRequest): Promise<UserResponse> {
    return apiClient.request<UserResponse>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // FEAPI-013: Delete user (hard delete subject to dependency rules)
  deleteAdminUser(userId: string): Promise<void> {
    return apiClient.request<void>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // FEAPI-019: List all projects in system
  getAdminProjects(params: GetAdminProjectsParams = {}): Promise<PageResponse<ProjectResponse>> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.ownerId) searchParams.set('ownerId', params.ownerId);
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.sort) searchParams.set('sort', params.sort);

    const qs = searchParams.toString();
    return apiClient.request<PageResponse<ProjectResponse>>(`/admin/projects${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },
};
