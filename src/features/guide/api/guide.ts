import { apiClient } from '@/shared/api/client';
import { GuideQueryRequest, GuideQueryResponse } from '@/shared/api/types';

export const guideApi = {
  // FEAPI-057: Query KBase Guide
  queryGuide(data: GuideQueryRequest): Promise<GuideQueryResponse> {
    return apiClient.request<GuideQueryResponse>('/ai/guide/query', {
      method: 'POST',
      body: JSON.stringify(data),
      timeoutMs: 60000,
    });
  },
};
