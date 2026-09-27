import { apiClient } from '@/shared/api/client';
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectResponse,
  PageResponse,
  ProjectRole,
} from '@/shared/api/types';

export interface GetProjectsParams {
  q?: string;
  role?: ProjectRole;
  page?: number;
  size?: number;
  sort?: string;
}

export const projectsApi = {
  // FEAPI-014: Create project
  createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
    return apiClient.request<ProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // FEAPI-015: Get user's projects list
  getProjects(params: GetProjectsParams = {}): Promise<PageResponse<ProjectResponse>> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.role) searchParams.set('role', params.role);
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.sort) searchParams.set('sort', params.sort);

    const qs = searchParams.toString();
    return apiClient.request<PageResponse<ProjectResponse>>(`/projects${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  // FEAPI-016: Get single project details
  getProject(projectId: string): Promise<ProjectResponse> {
    return apiClient.request<ProjectResponse>(`/projects/${projectId}`, {
      method: 'GET',
    });
  },

  // FEAPI-017: Update project
  updateProject(projectId: string, data: UpdateProjectRequest): Promise<ProjectResponse> {
    return apiClient.request<ProjectResponse>(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // FEAPI-018: Delete project
  deleteProject(projectId: string): Promise<void> {
    return apiClient.request<void>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  },
};
