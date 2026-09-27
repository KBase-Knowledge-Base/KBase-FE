/**
 * Exact KBase API contract types and enums.
 * Pinned backend commit: 636ea26469823bc475732d1e0f79f147556d1f63
 */

// ==========================================
// Enums
// ==========================================

export type SystemRole = 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'DISABLED';
export type ProjectRole = 'OWNER' | 'MEMBER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED';
export type FileKind = 'DOCUMENT' | 'IMAGE' | 'VIDEO';
export type DocumentAiIndexStatus = 'PENDING' | 'INDEXING' | 'READY' | 'FAILED' | 'UNSUPPORTED';
export type AiMessageRole = 'USER' | 'ASSISTANT';
export type AiChatRole = 'USER' | 'ASSISTANT';
export type AiGenerationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type AiAnswerType = 'GROUNDED' | 'NO_EVIDENCE';

// ==========================================
// Shared & Pagination
// ==========================================

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
  requestId: string;
  errors?: Record<string, string>;
}

// ==========================================
// Auth & User DTOs
// ==========================================

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  displayName: string;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface ResendVerificationOtpRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseUser {
  id: string;
  email: string;
  displayName: string;
  systemRole: SystemRole;
  status: UserStatus;
  emailVerified: boolean;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: LoginResponseUser;
}

export interface AccessTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  systemRole: SystemRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  displayName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeUserStatusRequest {
  status: UserStatus;
}

// ==========================================
// Project, Member & Invitation DTOs
// ==========================================

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  currentUserRole: ProjectRole | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMemberResponse {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface CreateInvitationRequest {
  email: string;
}

export interface InvitationResponse {
  id: string;
  projectId: string;
  email: string;
  role: ProjectRole;
  status: InvitationStatus;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
}

export interface AcceptInvitationRequest {
  token: string;
}

export interface AcceptInvitationResponse {
  projectId: string;
  role: ProjectRole;
  joinedAt: string;
}

// ==========================================
// Folder, Category, Tag DTOs
// ==========================================

export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
}

export interface UpdateFolderRequest {
  name?: string;
  parentId?: string | null;
}

export interface FolderResponse {
  id: string;
  projectId: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

export interface CategoryResponse {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
}

export interface CreateTagRequest {
  name: string;
}

export interface UpdateTagRequest {
  name: string;
}

export interface TagResponse {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
}

// ==========================================
// Document DTOs
// ==========================================

export interface DocumentMetadataRequest {
  displayName?: string;
  description?: string;
  folderId?: string | null;
  categoryId?: string | null;
  tagIds?: string[];
}

export interface UpdateDocumentRequest {
  displayName?: string;
  description?: string;
  folderId?: string | null;
  categoryId?: string | null;
  tagIds?: string[];
}

export interface DocumentSummaryResponse {
  id: string;
  projectId: string;
  folderId: string | null;
  fileName: string;
  displayName: string;
  fileKind: FileKind;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentUserResponse {
  id: string;
  email: string;
  displayName: string;
}

export interface DocumentCategoryResponse {
  id: string;
  name: string;
}

export interface DocumentTagResponse {
  id: string;
  name: string;
}

export interface DocumentResponse {
  id: string;
  projectId: string;
  folderId: string | null;
  fileName: string;
  displayName: string;
  description: string | null;
  fileKind: FileKind;
  mimeType: string;
  sizeBytes: number;
  uploader: DocumentUserResponse;
  category: DocumentCategoryResponse | null;
  tags: DocumentTagResponse[];
  aiIndexStatus: DocumentAiIndexStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BatchDocumentUploadResponse {
  documents: DocumentResponse[];
}

export interface DocumentAiIndexResponse {
  documentId: string;
  status: DocumentAiIndexStatus;
  failureReason: string | null;
  indexedAt: string | null;
  retryAllowed: boolean;
}

// ==========================================
// AI DTOs (Project Assistant & Guide)
// ==========================================

export interface CreateAiConversationRequest {
  message: string;
}

export interface RenameAiConversationRequest {
  title: string;
}

export interface SendAiMessageRequest {
  message: string;
}

export interface AiConversationResponse {
  id: string;
  projectId: string;
  creatorId: string;
  title: string;
  lastMessagePreview: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessageResponse {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  status: AiGenerationStatus;
  failureReason: string | null;
  createdAt: string;
}

export interface AiSourceResponse {
  id: string;
  messageId: string;
  documentId: string | null;
  documentName: string;
  pageNumber: number | null;
  slideNumber: number | null;
  sectionTitle: string | null;
  excerpt: string;
  confidenceScore: number | null;
  sourceAvailable: boolean;
}

export interface AiTurnResponse {
  message: AiMessageResponse;
  sources: AiSourceResponse[];
}

export interface CreateAiConversationResponse {
  conversation: AiConversationResponse;
  message: AiMessageResponse;
  sources: AiSourceResponse[];
}

export interface GuideContextMessage {
  role: AiChatRole;
  content: string;
}

export interface GuideQueryRequest {
  message: string;
  context?: GuideContextMessage[];
}

export interface GuideSourceResponse {
  sourceKey: string;
  title: string;
  section: string;
}

export interface GuideQueryResponse {
  answer: string;
  answerType: AiAnswerType;
  sources: GuideSourceResponse[];
}
