import { apiClient } from '@/shared/api/client';
import {
  CreateInvitationRequest,
  InvitationResponse,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  InvitationStatus,
  PageResponse,
} from '@/shared/api/types';

export interface GetInvitationsParams {
  status?: InvitationStatus;
  page?: number;
  size?: number;
  sort?: string;
}

export const invitationsApi = {
  // FEAPI-023: Create project invitation
  createInvitation(projectId: string, data: CreateInvitationRequest): Promise<InvitationResponse> {
    return apiClient.request<InvitationResponse>(`/projects/${projectId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // FEAPI-024: List invitations
  getInvitations(projectId: string, params: GetInvitationsParams = {}): Promise<PageResponse<InvitationResponse>> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.sort) searchParams.set('sort', params.sort);

    const qs = searchParams.toString();
    return apiClient.request<PageResponse<InvitationResponse>>(`/projects/${projectId}/invitations${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  // FEAPI-025: Resend invitation
  resendInvitation(projectId: string, invitationId: string): Promise<InvitationResponse> {
    return apiClient.request<InvitationResponse>(`/projects/${projectId}/invitations/${invitationId}/resend`, {
      method: 'POST',
    });
  },

  // FEAPI-026: Cancel invitation
  cancelInvitation(projectId: string, invitationId: string): Promise<void> {
    return apiClient.request<void>(`/projects/${projectId}/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  },

  // FEAPI-027: Accept invitation (requires authenticated session)
  acceptInvitation(data: AcceptInvitationRequest): Promise<AcceptInvitationResponse> {
    return apiClient.request<AcceptInvitationResponse>('/invitations/accept', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
