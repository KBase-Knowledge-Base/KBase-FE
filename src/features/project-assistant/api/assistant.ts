import { apiClient } from '@/shared/api/client';
import {
  CreateAiConversationRequest,
  CreateAiConversationResponse,
  AiConversationResponse,
  RenameAiConversationRequest,
  SendAiMessageRequest,
  AiTurnResponse,
  PageResponse,
} from '@/shared/api/types';

export interface GetAiMessagesParams {
  page?: number;
  size?: number;
}

export const assistantApi = {
  // FEAPI-048: Create conversation and first turn
  createConversation(projectId: string, data: CreateAiConversationRequest): Promise<CreateAiConversationResponse> {
    return apiClient.request<CreateAiConversationResponse>(`/projects/${projectId}/ai/conversations`, {
      method: 'POST',
      body: JSON.stringify(data),
      timeoutMs: 180000, // 180s for embedding and AI generation
    });
  },

  // FEAPI-049: List creator's conversations
  getConversations(projectId: string, params: { page?: number; size?: number } = {}): Promise<PageResponse<AiConversationResponse>> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    const qs = searchParams.toString();

    return apiClient.request<PageResponse<AiConversationResponse>>(`/projects/${projectId}/ai/conversations${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  // FEAPI-050: Get conversation metadata
  getConversation(projectId: string, conversationId: string): Promise<AiConversationResponse> {
    return apiClient.request<AiConversationResponse>(`/projects/${projectId}/ai/conversations/${conversationId}`, {
      method: 'GET',
    });
  },

  // FEAPI-051: Rename conversation
  renameConversation(projectId: string, conversationId: string, data: RenameAiConversationRequest): Promise<AiConversationResponse> {
    return apiClient.request<AiConversationResponse>(`/projects/${projectId}/ai/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // FEAPI-052: Delete conversation
  deleteConversation(projectId: string, conversationId: string): Promise<void> {
    return apiClient.request<void>(`/projects/${projectId}/ai/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  },

  // FEAPI-053: Send message to existing conversation
  sendMessage(projectId: string, conversationId: string, data: SendAiMessageRequest): Promise<AiTurnResponse> {
    return apiClient.request<AiTurnResponse>(`/projects/${projectId}/ai/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
      timeoutMs: 180000,
    });
  },

  // FEAPI-054: Get conversation messages
  getMessages(projectId: string, conversationId: string, params: GetAiMessagesParams = {}): Promise<PageResponse<AiTurnResponse>> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    const qs = searchParams.toString();

    return apiClient.request<PageResponse<AiTurnResponse>>(`/projects/${projectId}/ai/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },
};
