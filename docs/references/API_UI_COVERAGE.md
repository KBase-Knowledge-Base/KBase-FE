# API → UI coverage — 57 operations

Baseline BE `636ea26469823bc475732d1e0f79f147556d1f63`. Independently parsed source controllers match the [API snapshot](backend/api-schema.md): **38 paths /57 operations**. Every row is planned, not runtime-tested.

Read [DTO excerpts](backend/dto-source.md), [controller annotations/query parameters](backend/controller-source.md), [policy excerpts](backend/policy-source.md), [FE conventions](../API_CONVENTIONS.md) and [UI inventory](../product-specs/UI_INVENTORY.md).

| ID | Method | API path | Purpose | Auth | Request | Response | UI surface | Evidence |
|---|---|---|---|---|---|---|---|---|
| FEAPI-001 | POST | `/api/v1/auth/register` | Đăng ký tài khoản chưa verify và phát OTP | Public | RegisterRequest | 201 RegisterResponse | UI03 | NOT RUN |
| FEAPI-002 | POST | `/api/v1/auth/verify-email` | Xác minh email bằng OTP | Public | VerifyEmailRequest | 200 VerifyEmailResponse | UI04 | NOT RUN |
| FEAPI-003 | POST | `/api/v1/auth/resend-verification-otp` | Gửi lại OTP verify (cooldown 60s) | Public | ResendVerificationOtpRequest | 204 No Content | UI04 | NOT RUN |
| FEAPI-004 | POST | `/api/v1/auth/login` | Đăng nhập, phát access JWT + refresh cookie | Public | LoginRequest | 200 LoginResponse + Set-Cookie | UI02 | NOT RUN |
| FEAPI-005 | POST | `/api/v1/auth/refresh` | Đổi refresh cookie lấy access JWT mới | Refresh cookie | Không body | 200 AccessTokenResponse | UI02 / shared session | NOT RUN |
| FEAPI-006 | POST | `/api/v1/auth/logout` | Revoke refresh session hiện tại và clear cookie | Refresh cookie (không bắt buộc) | Không body | 204 No Content + Set-Cookie clear | shared global menu / UI17 | NOT RUN |
| FEAPI-007 | GET | `/api/v1/users/me` | Xem profile hiện tại | Bearer JWT | Không body | 200 UserResponse | UI16 / shared session | NOT RUN |
| FEAPI-008 | PATCH | `/api/v1/users/me` | Cập nhật displayName | Bearer JWT | UpdateProfileRequest | 200 UserResponse | UI16 / shared session | NOT RUN |
| FEAPI-009 | PUT | `/api/v1/users/me/password` | Đổi mật khẩu + revoke refresh sessions | Bearer JWT | ChangePasswordRequest | 204 No Content | UI17 | NOT RUN |
| FEAPI-010 | GET | `/api/v1/admin/users` | Danh sách user (q/status/systemRole + pagination) | ADMIN | Không body | 200 PageResponse&lt;UserResponse&gt; | UI18 / UI19 | NOT RUN |
| FEAPI-011 | GET | `/api/v1/admin/users/{userId}` | Xem một user | ADMIN | Không body | 200 UserResponse | UI18 / UI19 | NOT RUN |
| FEAPI-012 | PATCH | `/api/v1/admin/users/{userId}/status` | Đổi ACTIVE/DISABLED (disable revoke sessions) | ADMIN | ChangeUserStatusRequest | 200 UserResponse | UI18 / UI19 | NOT RUN |
| FEAPI-013 | DELETE | `/api/v1/admin/users/{userId}` | Hard delete theo dependency rules | ADMIN | Không body | 204 No Content | UI18 / UI19 | NOT RUN |
| FEAPI-014 | POST | `/api/v1/projects` | Tạo project + OWNER membership (một transaction) | Bearer JWT | CreateProjectRequest | 201 ProjectResponse | UI06 | NOT RUN |
| FEAPI-015 | GET | `/api/v1/projects` | Danh sách project user đang tham gia (q/role + pagination) | Bearer JWT | Không body | 200 PageResponse&lt;ProjectResponse&gt; | UI06 | NOT RUN |
| FEAPI-016 | GET | `/api/v1/projects/{projectId}` | Xem project (MEMBER/OWNER/ADMIN) | Bearer JWT | Không body | 200 ProjectResponse | UI07 / UI13 / shared project context | NOT RUN |
| FEAPI-017 | PATCH | `/api/v1/projects/{projectId}` | Cập nhật project (OWNER/ADMIN) | Bearer JWT | UpdateProjectRequest | 200 ProjectResponse | UI07 / UI13 / shared project context | NOT RUN |
| FEAPI-018 | DELETE | `/api/v1/projects/{projectId}` | Hard delete storage-first (OWNER/ADMIN) | Bearer JWT | Không body | 204 No Content | UI07 / UI13 / shared project context | NOT RUN |
| FEAPI-019 | GET | `/api/v1/admin/projects` | Danh sách toàn bộ project (q/ownerId + pagination) | ADMIN | Không body | 200 PageResponse&lt;ProjectResponse&gt; | UI20 | NOT RUN |
| FEAPI-020 | GET | `/api/v1/projects/{projectId}/members` | Danh sách members (MEMBER/OWNER/ADMIN) | Bearer JWT | Không body | 200 PageResponse&lt;ProjectMemberResponse&gt; | UI10 / UI08 uploader filter | NOT RUN |
| FEAPI-021 | DELETE | `/api/v1/projects/{projectId}/members/{userId}` | Remove MEMBER (OWNER/ADMIN) | Bearer JWT | Không body | 204 No Content | UI10 / UI08 uploader filter | NOT RUN |
| FEAPI-022 | DELETE | `/api/v1/projects/{projectId}/members/me` | Rời project (MEMBER; OWNER bị từ chối) | Bearer JWT | Không body | 204 No Content | UI10 / UI08 uploader filter | NOT RUN |
| FEAPI-023 | POST | `/api/v1/projects/{projectId}/invitations` | Tạo invitation PENDING + gửi email token | Bearer JWT (OWNER/ADMIN) | CreateInvitationRequest | 201 InvitationResponse | UI11 / UI10 invite shortcut | NOT RUN |
| FEAPI-024 | GET | `/api/v1/projects/{projectId}/invitations` | Danh sách invitation (status + pagination) | Bearer JWT (OWNER/ADMIN) | Không body | 200 PageResponse&lt;InvitationResponse&gt; | UI11 / UI10 invite shortcut | NOT RUN |
| FEAPI-025 | POST | `/api/v1/projects/{projectId}/invitations/{invitationId}/resend` | Resend: token mới + reset expiry + gửi lại email | Bearer JWT (OWNER/ADMIN) | Không body | 200 InvitationResponse | UI11 / UI10 invite shortcut | NOT RUN |
| FEAPI-026 | DELETE | `/api/v1/projects/{projectId}/invitations/{invitationId}` | Cancel: PENDING → CANCELLED | Bearer JWT (OWNER/ADMIN) | Không body | 204 No Content | UI11 / UI10 invite shortcut | NOT RUN |
| FEAPI-027 | POST | `/api/v1/invitations/accept` | Accept invitation bằng raw token | Bearer JWT | AcceptInvitationRequest | 200 AcceptInvitationResponse | UI05 | NOT RUN |
| FEAPI-028 | GET | `/api/v1/projects/{projectId}/folders` | Liệt kê flat folder structure hoặc children theo `parentId` | Bearer JWT (MEMBER/OWNER/ADMIN) | Query `parentId` tùy chọn | 200 `FolderResponse[]` | UI12 / UI08 | NOT RUN |
| FEAPI-029 | POST | `/api/v1/projects/{projectId}/folders` | Tạo folder root hoặc nested | Bearer JWT (OWNER/ADMIN) | CreateFolderRequest | 201 FolderResponse | UI12 / UI08 | NOT RUN |
| FEAPI-030 | PATCH | `/api/v1/projects/{projectId}/folders/{folderId}` | Rename hoặc move folder | Bearer JWT (OWNER/ADMIN) | UpdateFolderRequest | 200 FolderResponse | UI12 / UI08 | NOT RUN |
| FEAPI-031 | DELETE | `/api/v1/projects/{projectId}/folders/{folderId}` | Xóa folder rỗng | Bearer JWT (OWNER/ADMIN) | Không body | 204 No Content | UI12 / UI08 | NOT RUN |
| FEAPI-032 | GET | `/api/v1/projects/{projectId}/categories` | Liệt kê category trong project | Bearer JWT (MEMBER/OWNER/ADMIN) | Không body | 200 `CategoryResponse[]` | UI12 / UI08 / UI09 | NOT RUN |
| FEAPI-033 | POST | `/api/v1/projects/{projectId}/categories` | Tạo category | Bearer JWT (OWNER/ADMIN) | CreateCategoryRequest | 201 CategoryResponse | UI12 / UI08 / UI09 | NOT RUN |
| FEAPI-034 | PATCH | `/api/v1/projects/{projectId}/categories/{categoryId}` | Rename category | Bearer JWT (OWNER/ADMIN) | UpdateCategoryRequest | 200 CategoryResponse | UI12 / UI08 / UI09 | NOT RUN |
| FEAPI-035 | DELETE | `/api/v1/projects/{projectId}/categories/{categoryId}` | Xóa category chưa được dùng | Bearer JWT (OWNER/ADMIN) | Không body | 204 No Content | UI12 / UI08 / UI09 | NOT RUN |
| FEAPI-036 | GET | `/api/v1/projects/{projectId}/tags` | Liệt kê/tìm tag trong project | Bearer JWT (MEMBER/OWNER/ADMIN) | Query `q` tùy chọn | 200 `TagResponse[]` | UI12 / UI08 / UI09 | NOT RUN |
| FEAPI-037 | POST | `/api/v1/projects/{projectId}/tags` | Tạo shared tag | Bearer JWT (MEMBER/OWNER/ADMIN) | CreateTagRequest | 201 TagResponse | UI12 / UI08 / UI09 | NOT RUN |
| FEAPI-038 | PATCH | `/api/v1/projects/{projectId}/tags/{tagId}` | Rename shared tag | Bearer JWT (OWNER/ADMIN) | UpdateTagRequest | 200 TagResponse | UI12 / UI08 / UI09 | NOT RUN |
| FEAPI-039 | DELETE | `/api/v1/projects/{projectId}/tags/{tagId}` | Xóa tag và các DocumentTag relation | Bearer JWT (OWNER/ADMIN) | Không body | 204 No Content | UI12 / UI08 / UI09 | NOT RUN |
| FEAPI-040 | GET | `/api/v1/projects/{projectId}/documents` | Browse/search metadata document trong project | Bearer JWT (MEMBER/OWNER/ADMIN) | Query `q`, `folderId`, `categoryId`, `tagId`, `fileKind`, `uploadedBy`, `createdFrom`, `createdTo`, pagination/sort | 200 `PageResponse<DocumentSummaryResponse>` | UI08 upload/browse | NOT RUN |
| FEAPI-041 | POST | `/api/v1/projects/{projectId}/documents` | Upload một file với metadata tùy chọn | Bearer JWT (MEMBER/OWNER/ADMIN) | multipart `file`, optional `metadata` JSON | 201 DocumentResponse | UI08 upload/browse | NOT RUN |
| FEAPI-042 | POST | `/api/v1/projects/{projectId}/documents/batch` | Upload batch atomic-at-application-level khi khả thi | Bearer JWT (MEMBER/OWNER/ADMIN) | multipart `files`, optional common `metadata` JSON | 201 BatchDocumentUploadResponse | UI08 upload/browse | NOT RUN |
| FEAPI-043 | GET | `/api/v1/documents/{documentId}` | Xem document metadata | Bearer JWT (project member/ADMIN) | Không body | 200 DocumentResponse | UI09 | NOT RUN |
| FEAPI-044 | PATCH | `/api/v1/documents/{documentId}` | Update metadata (MEMBER chỉ file của mình) | Bearer JWT | UpdateDocumentRequest | 200 DocumentResponse | UI09 | NOT RUN |
| FEAPI-045 | GET | `/api/v1/documents/{documentId}/download` | Stream attachment đã authorize | Bearer JWT (project member/ADMIN) | Không body | 200 binary stream | UI09 | NOT RUN |
| FEAPI-046 | GET | `/api/v1/documents/{documentId}/preview` | Stream inline preview; MP4 single Range | Bearer JWT (project member/ADMIN) | Optional `Range` | 200/206 binary stream | UI09 | NOT RUN |
| FEAPI-047 | DELETE | `/api/v1/documents/{documentId}` | Hard delete storage-first (MEMBER chỉ file của mình) | Bearer JWT | Không body | 204 No Content | UI09 | NOT RUN |
| FEAPI-048 | POST | `/api/v1/projects/{projectId}/ai/conversations` | Tạo private conversation và first turn | Bearer JWT + current project access | CreateAiConversationRequest | 201 CreateAiConversationResponse; 429 `AI_RATE_LIMIT_EXCEEDED`; 503 `AI_PROVIDER_UNAVAILABLE` hoặc `AI_USAGE_GUARD_UNAVAILABLE`; provider failure vẫn giữ conversation/USER/FAILED marker | UI14 | NOT RUN |
| FEAPI-049 | GET | `/api/v1/projects/{projectId}/ai/conversations` | List conversation của chính creator | Bearer JWT + current project access | `page=0`, `size=20` | 200 PageResponse&lt;AiConversationResponse&gt; | UI14 | NOT RUN |
| FEAPI-050 | GET | `/api/v1/projects/{projectId}/ai/conversations/{conversationId}` | Metadata conversation của creator | Bearer JWT + creator | Không body | 200 AiConversationResponse | UI14 | NOT RUN |
| FEAPI-051 | PATCH | `/api/v1/projects/{projectId}/ai/conversations/{conversationId}` | Rename conversation | Bearer JWT + creator | RenameAiConversationRequest | 200 AiConversationResponse | UI14 | NOT RUN |
| FEAPI-052 | DELETE | `/api/v1/projects/{projectId}/ai/conversations/{conversationId}` | Hard delete conversation/messages/sources | Bearer JWT + creator | Không body | 204 No Content | UI14 | NOT RUN |
| FEAPI-053 | POST | `/api/v1/projects/{projectId}/ai/conversations/{conversationId}/messages` | Gửi câu hỏi; grounded hoặc NO_EVIDENCE | Bearer JWT + creator | SendAiMessageRequest | 200 AiTurnResponse; 429 `AI_RATE_LIMIT_EXCEEDED`; 503 `AI_PROVIDER_UNAVAILABLE` hoặc `AI_USAGE_GUARD_UNAVAILABLE` | UI14 | NOT RUN |
| FEAPI-054 | GET | `/api/v1/projects/{projectId}/ai/conversations/{conversationId}/messages` | Paged messages/sources | Bearer JWT + creator | `page=0`, `size=50` | 200 PageResponse&lt;AiTurnResponse&gt; | UI14 | NOT RUN |
| FEAPI-055 | GET | `/api/v1/projects/{projectId}/documents/{documentId}/ai-index` | Trạng thái AI index an toàn | Bearer JWT + document read | Không body | 200 DocumentAiIndexResponse | UI09 / UI08 recent upload panel | NOT RUN |
| FEAPI-056 | POST | `/api/v1/projects/{projectId}/documents/{documentId}/ai-index/retry` | Retry bất đồng bộ từ FAILED | Bearer JWT + document modify | Không body | 202 DocumentAiIndexResponse | UI09 / UI08 recent upload panel | NOT RUN |
| FEAPI-057 | POST | `/api/v1/ai/guide/query` | Query stateless KBase Guide từ approved product specifications | Bearer JWT | GuideQueryRequest | 200 GuideQueryResponse (`GROUNDED`/`NO_EVIDENCE`); 429 `AI_RATE_LIMIT_EXCEEDED`; 503 `AI_PROVIDER_UNAVAILABLE` hoặc `AI_USAGE_GUARD_UNAVAILABLE` | UI15 | NOT RUN |

## Completion rule

Replace Evidence with a test ID or sanitized evidence link. Distinguish mock/live explicitly. Shared refresh/logout operations still require verification. Do not remove an operation because its UI is incomplete. UI01 marketing and UI21/UI22 system screens have no business API of their own.
