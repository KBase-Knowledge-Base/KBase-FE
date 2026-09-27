import { apiClient } from '@/shared/api/client';
import {
  FolderResponse,
  CreateFolderRequest,
  UpdateFolderRequest,
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  TagResponse,
  CreateTagRequest,
  UpdateTagRequest,
} from '@/shared/api/types';

export const organizationApi = {
  // Folders (FEAPI-028 to FEAPI-031)
  getFolders(projectId: string, parentId?: string | null): Promise<FolderResponse[]> {
    const qs = parentId ? `?parentId=${encodeURIComponent(parentId)}` : '';
    return apiClient.request<FolderResponse[]>(`/projects/${projectId}/folders${qs}`, {
      method: 'GET',
    });
  },

  createFolder(projectId: string, data: CreateFolderRequest): Promise<FolderResponse> {
    return apiClient.request<FolderResponse>(`/projects/${projectId}/folders`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateFolder(projectId: string, folderId: string, data: UpdateFolderRequest): Promise<FolderResponse> {
    return apiClient.request<FolderResponse>(`/projects/${projectId}/folders/${folderId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteFolder(projectId: string, folderId: string): Promise<void> {
    return apiClient.request<void>(`/projects/${projectId}/folders/${folderId}`, {
      method: 'DELETE',
    });
  },

  // Categories (FEAPI-032 to FEAPI-035)
  getCategories(projectId: string): Promise<CategoryResponse[]> {
    return apiClient.request<CategoryResponse[]>(`/projects/${projectId}/categories`, {
      method: 'GET',
    });
  },

  createCategory(projectId: string, data: CreateCategoryRequest): Promise<CategoryResponse> {
    return apiClient.request<CategoryResponse>(`/projects/${projectId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCategory(projectId: string, categoryId: string, data: UpdateCategoryRequest): Promise<CategoryResponse> {
    return apiClient.request<CategoryResponse>(`/projects/${projectId}/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteCategory(projectId: string, categoryId: string): Promise<void> {
    return apiClient.request<void>(`/projects/${projectId}/categories/${categoryId}`, {
      method: 'DELETE',
    });
  },

  // Tags (FEAPI-036 to FEAPI-039)
  getTags(projectId: string, q?: string): Promise<TagResponse[]> {
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    return apiClient.request<TagResponse[]>(`/projects/${projectId}/tags${qs}`, {
      method: 'GET',
    });
  },

  createTag(projectId: string, data: CreateTagRequest): Promise<TagResponse> {
    return apiClient.request<TagResponse>(`/projects/${projectId}/tags`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTag(projectId: string, tagId: string, data: UpdateTagRequest): Promise<TagResponse> {
    return apiClient.request<TagResponse>(`/projects/${projectId}/tags/${tagId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteTag(projectId: string, tagId: string): Promise<void> {
    return apiClient.request<void>(`/projects/${projectId}/tags/${tagId}`, {
      method: 'DELETE',
    });
  },
};
