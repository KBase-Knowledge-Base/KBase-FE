import { apiClient } from '@/shared/api/client';
import { ProjectMemberResponse, PageResponse } from '@/shared/api/types';

export interface GetMembersParams {
  page?: number;
  size?: number;
  sort?: string;
}

export const membersApi = {
  // FEAPI-020: List project members
  getProjectMembers(projectId: string, params: GetMembersParams = {}): Promise<PageResponse<ProjectMemberResponse>> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.sort) searchParams.set('sort', params.sort);

    const qs = searchParams.toString();
    return apiClient.request<PageResponse<ProjectMemberResponse>>(`/projects/${projectId}/members${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  // FEAPI-021: Remove a member (OWNER/ADMIN only)
  removeMember(projectId: string, userId: string): Promise<void> {
    return apiClient.request<void>(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  // FEAPI-022: Leave project (MEMBER only)
  leaveProject(projectId: string): Promise<void> {
    return apiClient.request<void>(`/projects/${projectId}/members/me`, {
      method: 'DELETE',
    });
  },
};
