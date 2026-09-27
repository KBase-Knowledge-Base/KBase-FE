import { apiClient } from '@/shared/api/client';
import {
  DocumentSummaryResponse,
  DocumentResponse,
  BatchDocumentUploadResponse,
  DocumentMetadataRequest,
  UpdateDocumentRequest,
  DocumentAiIndexResponse,
  PageResponse,
  FileKind,
} from '@/shared/api/types';

export interface GetDocumentsParams {
  q?: string;
  folderId?: string;
  categoryId?: string;
  tagId?: string;
  fileKind?: FileKind;
  uploadedBy?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const documentsApi = {
  // FEAPI-040: Browse/search documents in project
  getDocuments(projectId: string, params: GetDocumentsParams = {}): Promise<PageResponse<DocumentSummaryResponse>> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.folderId) searchParams.set('folderId', params.folderId);
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params.tagId) searchParams.set('tagId', params.tagId);
    if (params.fileKind) searchParams.set('fileKind', params.fileKind);
    if (params.uploadedBy) searchParams.set('uploadedBy', params.uploadedBy);
    if (params.createdFrom) searchParams.set('createdFrom', params.createdFrom);
    if (params.createdTo) searchParams.set('createdTo', params.createdTo);
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.sort) searchParams.set('sort', params.sort);

    const qs = searchParams.toString();
    return apiClient.request<PageResponse<DocumentSummaryResponse>>(`/projects/${projectId}/documents${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  // FEAPI-041: Single upload
  uploadDocument(
    projectId: string,
    file: File,
    metadata?: DocumentMetadataRequest,
    onProgress?: (percent: number) => void
  ): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      formData.append('metadata', metadataBlob);
    }

    if (onProgress && typeof XMLHttpRequest !== 'undefined') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/v1/projects/${projectId}/documents`);
        const token = apiClient.getAccessToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText) as DocumentResponse;
              resolve(res);
            } catch {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(err);
            } catch {
              reject(new Error(xhr.statusText || 'Upload failed'));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });
    }

    return apiClient.request<DocumentResponse>(`/projects/${projectId}/documents`, {
      method: 'POST',
      body: formData,
    });
  },

  // FEAPI-042: Batch upload
  uploadBatchDocuments(
    projectId: string,
    files: File[],
    metadata?: DocumentMetadataRequest,
    onProgress?: (percent: number) => void
  ): Promise<BatchDocumentUploadResponse> {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }
    if (metadata) {
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      formData.append('metadata', metadataBlob);
    }

    if (onProgress && typeof XMLHttpRequest !== 'undefined') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/v1/projects/${projectId}/documents/batch`);
        const token = apiClient.getAccessToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText) as BatchDocumentUploadResponse;
              resolve(res);
            } catch {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(err);
            } catch {
              reject(new Error(xhr.statusText || 'Batch upload failed'));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during batch upload'));
        xhr.send(formData);
      });
    }

    return apiClient.request<BatchDocumentUploadResponse>(`/projects/${projectId}/documents/batch`, {
      method: 'POST',
      body: formData,
    });
  },

  // FEAPI-043: Get document details
  getDocument(documentId: string): Promise<DocumentResponse> {
    return apiClient.request<DocumentResponse>(`/documents/${documentId}`, {
      method: 'GET',
    });
  },

  // FEAPI-044: Update document metadata
  updateDocument(documentId: string, data: UpdateDocumentRequest): Promise<DocumentResponse> {
    return apiClient.request<DocumentResponse>(`/documents/${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // FEAPI-045: Download document with Bearer auth
  async downloadDocument(documentId: string): Promise<{ blob: Blob; fileName?: string }> {
    const res = await apiClient.fetchBinary(`/documents/${documentId}/download`, {
      method: 'GET',
    });
    let fileName: string | undefined;
    if (res.disposition) {
      const match = res.disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      if (match?.[1]) {
        fileName = decodeURIComponent(match[1]);
      }
    }
    return { blob: res.blob, fileName };
  },

  // FEAPI-046: Preview document with Bearer auth and Range
  previewDocument(documentId: string, range?: string) {
    const headers: Record<string, string> = {};
    if (range) {
      headers['Range'] = range;
    }
    return apiClient.fetchBinary(`/documents/${documentId}/preview`, {
      method: 'GET',
      headers,
    });
  },

  // FEAPI-047: Delete document
  deleteDocument(documentId: string): Promise<void> {
    return apiClient.request<void>(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  },

  // FEAPI-055: Get AI index status
  getDocumentAiIndex(projectId: string, documentId: string): Promise<DocumentAiIndexResponse> {
    return apiClient.request<DocumentAiIndexResponse>(`/projects/${projectId}/documents/${documentId}/ai-index`, {
      method: 'GET',
    });
  },

  // FEAPI-056: Retry AI index
  retryDocumentAiIndex(projectId: string, documentId: string): Promise<DocumentAiIndexResponse> {
    return apiClient.request<DocumentAiIndexResponse>(`/projects/${projectId}/documents/${documentId}/ai-index/retry`, {
      method: 'POST',
    });
  },
};
