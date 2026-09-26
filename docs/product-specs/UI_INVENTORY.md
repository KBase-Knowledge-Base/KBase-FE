# KBase FE v1 — UI inventory

## Cách đếm và nguồn

**22 mẫu màn hình: 20 màn hình nghiệp vụ + 2 màn hình hệ thống.** Đây là quyết định tổ chức UI từ capability BE, không phải số trang bắt buộc do BE quy định. Có 23 route pattern nếu tính riêng route conversation đã có ID; `/app` và `/app/settings` chỉ redirect, không tính thêm trang. Dialog, drawer, tab, loading/empty/error là trạng thái của màn hình, không tăng tổng.

Contract pinned: BE `636ea26469823bc475732d1e0f79f147556d1f63`. [Mapping đầy đủ 57 operation](../references/API_UI_COVERAGE.md). Tất cả path FE dưới đây khác path API; không gửi request tới path UI.

## Danh sách toàn bộ màn hình

| ID | Màn hình / FE route | Nội dung và hành động bắt buộc | Dữ liệu/API chính | Quyền |
|---|---|---|---|---|
| UI01 | Landing `/` | Hero, vấn đề tài liệu phân tán, tổ chức kiến thức, AI có nguồn, 3 bước dùng, CTA register/login | Nội dung marketing tĩnh trung thực; minh họa gắn nhãn khi có dữ liệu mẫu | Public |
| UI02 | Đăng nhập `/login` | Email/password, reveal password, pending, disabled/unverified account, returnTo nội bộ | auth/login, auth/refresh; users/me | Public |
| UI03 | Đăng ký `/register` | Tên/email/password/confirm, field errors, chuyển verify sau 201; không auto-login | auth/register | Public |
| UI04 | Xác minh email `/verify-email` | OTP 6 số, paste/autofill, resend cooldown, expired/exhausted, đổi email nhập nhầm | verify-email, resend-verification-otp | Public |
| UI05 | Nhận lời mời `/invitations/accept?token=...` | Giữ token qua login/register, nút xác nhận accept, mismatch email, expired/cancelled | invitations/accept; không có GET preview invitation bằng token | Phải auth trước POST |
| UI06 | Dự án của tôi `/app/projects` | Search q, filter role, page/sort, list/card, create project dialog, empty onboarding | GET/POST projects | USER/ADMIN, list là membership |
| UI07 | Tổng quan project `/app/projects/:projectId` | Tên/mô tả/quyền, lối tắt tài liệu/members/assistant, thông tin có nguồn API | GET project; document/member totals nếu lấy từ PageResponse | MEMBER/OWNER/ADMIN |
| UI08 | Tài liệu `/app/projects/:projectId/documents` | Search metadata, folder breadcrumb/tree, category/tag/kind/uploader/date filters, sort/page, single/batch upload dialog | project documents, folders/categories/tags, members cho uploader selector | MEMBER/OWNER/ADMIN |
| UI09 | Chi tiết tài liệu `/app/documents/:documentId` | Metadata, preview/download, edit/delete, AI index badge/retry, tags, breadcrumb project | documents/{id}, preview/download, ai-index/retry | Read: member/admin; mutate: uploader MEMBER hoặc OWNER/ADMIN |
| UI10 | Thành viên `/app/projects/:projectId/members` | List/page/sort, OWNER badge, remove member, leave project, invite shortcut cho manager | members list/remove/me | Read mọi member/admin; remove OWNER/ADMIN; leave MEMBER |
| UI11 | Lời mời project `/app/projects/:projectId/invitations` | Create, list/status filter, expiry, resend/cancel PENDING, mail failures | 4 project invitations operations | OWNER/ADMIN |
| UI12 | Phân loại `/app/projects/:projectId/organization?tab=folders` | Tabs folders/categories/tags; tree/list; create/rename/move/delete, root move, cycle/nonempty/in-use errors | 12 folder/category/tag operations | Read mọi member/admin; tạo tag MEMBER được; quản lý còn lại OWNER/ADMIN |
| UI13 | Cài đặt project `/app/projects/:projectId/settings` | Sửa tên/mô tả, danger zone hard delete với xác nhận tên project | PATCH/DELETE project | OWNER/ADMIN |
| UI14 | Project Assistant `/app/projects/:projectId/assistant` và `/app/projects/:projectId/assistant/:conversationId` | Private conversation rail, draft new chat, first question tạo chat, rename/delete, message history paging, grounded/citation/no-evidence/errors | 7 conversation operations | Creator + project access; ADMIN không xem chat người khác |
| UI15 | KBase Guide `/app/guide` | Guide stateless, câu hỏi gợi ý về dùng KBase, local session context, clear, nguồn title/section | ai/guide/query | Authenticated |
| UI16 | Hồ sơ `/app/settings/profile` | Current user, email/role read-only, edit displayName | GET/PATCH users/me | Authenticated |
| UI17 | Bảo mật `/app/settings/security` | Đổi password, confirm, thông báo phiên cần login lại | PUT users/me/password; logout | Authenticated |
| UI18 | Admin users `/app/admin/users` | Search/filter status/systemRole, page/sort, detail link, status action | GET admin/users; status PATCH | ADMIN |
| UI19 | Admin user detail `/app/admin/users/:userId` | Profile/status, activate/disable, delete với dependency conflict | GET/status PATCH/DELETE admin user | ADMIN |
| UI20 | Admin projects `/app/admin/projects` | Toàn bộ project, search ownerId/q, page/sort, mở project bằng shared pages | GET admin/projects; shared project operations | ADMIN |
| UI21 | Không có quyền `/forbidden` | Lời giải thích an toàn, quay về project list/logout; không render dữ liệu bị chặn | Không có API riêng | Mọi session |
| UI22 | Không tìm thấy `*` | 404/deep-link invalid, quay về vị trí phù hợp | Không có API riêng | Public hoặc authenticated shell |

`/app` redirect UI06; `/app/settings` redirect UI16. Unexpected runtime error dùng route error boundary (retry/reload), offline dùng banner/inline state; không cần route riêng. Không thêm trang quên mật khẩu vì chưa có endpoint.

## Dialog / drawer / component dùng chung

CreateProjectDialog; UploadDocumentsDialog (single/batch); EditDocumentDialog; ConfirmDangerDialog; InviteMemberDialog; FolderEditorDialog (create/rename/move); CategoryEditorDialog; TagEditorDialog; RenameConversationDialog; CitationPanel; FilterDrawer; MobileNavDrawer; SessionExpiredNotice; CopyableRequestId.

Tất cả dialog có label/description, focus trap, Escape (trừ khi đang xử lý không thể an toàn đóng), trả focus về trigger; thao tác destroy có mô tả hậu quả. Không dùng browser alert/confirm làm UI cuối.

## Acceptance từng nhóm

### Auth / invitation

- Không gửi systemRole từ register. Confirm password chỉ FE, không gửi BE. Verify thành công dẫn login; OTP không phải login/MFA.
- Countdown resend 60s là feedback, server là authority; không giả vờ biết thời gian còn lại chính xác nếu BE không trả. Tránh double submit và auto-resend.
- Accept invitation chỉ sau thao tác user, không chạy mutation trong mount/effect. Token lấy từ query `token`; đưa vào memory/sessionStorage riêng cho pending invite nếu cần qua reload, xóa khỏi URL bằng replaceState càng sớm càng tốt, không log, không analytics, clear sau accept/cancel/expiry. Không lưu access/refresh token theo cách này.
- ReturnTo chỉ pathname nội bộ đã allowlist, không external URL/protocol-relative. Sau login khôi phục invitation flow; mismatch email cho phép đổi account, không tự dùng account khác.
- Logout ở global menu; đổi password thành công xóa FE session và yêu cầu login lại (BE revoke refresh sessions; không khẳng định mọi access JWT đã bị thu hồi).

### Projects / organization / admin

- UI07 không có biểu đồ/stats giả; không có dashboard aggregate API. Nếu hiển thị count thì từ totalElements API đúng scope, không dùng độ dài một page.
- UI12 folder tree xây từ flat FolderResponse; load một lần theo project, giữ selected folder. Root move của **folder** gửi `{parentId:null}`. Không dùng cùng semantics cho document.
- Owner không được leave/remove. Không có API transfer owner hoặc promote member. ADMIN override hiển thị là quyền hệ thống, không tạo role giả.
- Delete user bị `USER_OWNS_PROJECT`/`USER_HAS_DEPENDENCIES`: giữ dialog, giải thích dependency; không cascade thủ công từ FE.

### Documents

- Danh sách `DocumentSummaryResponse` không có uploader/category/tags/AI status. Không tự vẽ dữ liệu thiếu, không tạo N+1 fetch toàn bộ list để giả table đầy đủ. Detail load on demand; filters lấy từ nguồn API đúng scope.
- Search `q` tìm metadata, không quảng cáo semantic/full-text file search. `folderId` absent là không lọc theo folder, không tự coi là chỉ root. Filter ngày chuyển timezone rõ ràng sang UTC ISO.
- Batch dùng một request `/documents/batch` với metadata chung. Không chia thành n single POST nhưng gọi đó là batch atomic. Không hỗ trợ metadata riêng từng file trong cùng batch nếu contract không có.
- Core upload hỗ trợ tài liệu, ảnh, video; AI indexing chỉ PDF/DOC/DOCX/PPT/PPTX/MD/TXT. Nhãn UNSUPPORTED là không hỗ trợ AI, không phải upload thất bại.
- Document PATCH hiện `folderId:null` và `categoryId:null` giữ giá trị cũ. Có thể đổi sang ID khác; không đưa thao tác gỡ folder/category về null như đã hoạt động. `tagIds:[]` xóa tags, `description:""` có thể xóa mô tả. Ghi limitation ở issue log.
- Văn bản/Markdown render an toàn; Office/MOV/AVI có download fallback khi preview không được BE hỗ trợ. Xem chiến lược binary auth trong INTEGRATION.

### AI

- Draft New chat không gọi create API. First submit `{message}` tạo conversation và first turn; tối đa 5 conversation/user/project. Mọi mutation AI tắt automatic retry.
- Message history là PageResponse<AiTurnResponse>, mỗi phần tử chứa `message` và `sources`; không coi là một cặp user+assistant. Sort BE tăng theo createdAt/id; tải page mới nhất rồi prepend page cũ, không đảo lịch sử tùy ý. Dedupe bằng message.id.
- GROUNDED hiển thị backend sources có order, tên, page/slide/section. AVAILABLE có documentId mới mở detail; UNAVAILABLE hoặc ID null chỉ hiển thị snapshot, không phát minh URL. Không coi link do Markdown model tạo là citation đáng tin.
- NO_EVIDENCE là câu trả lời thành công, giữ nội dung BE, đề nghị thêm tài liệu/đợi index; không dùng general AI fallback.
- PROCESSING, COMPLETED, FAILED hiển thị riêng. Khi response lost/503, refetch metadata/messages/list trước retry; create 503 có thể đã tạo conversation. Không tự submit lại.
- Guide chỉ context USER/ASSISTANT tối đa 8 message, mỗi message tối đa 4000 chars, câu hỏi tối đa 8000 theo DTO; nội dung chỉ trong memory, reset khi logout/reload/clear. Không gọi Guide trên landing chưa login, không tạo library/history persistent.
- Không fake streaming/typewriter cho response JSON. Cho loading indicator yên tĩnh, thời gian chờ và trạng thái thực tế; user có thể điều hướng khi request còn chạy, không hứa browser abort hủy server generation.

## States chung bắt buộc

Initial skeleton; loading mutation; data; empty lần đầu; no search results; validation error; network/server error + retry an toàn; permission denied; resource removed; session expired; offline/stale data; responsive narrow view. Không show success trước response xác nhận. Giữ input khi lỗi, focus field lỗi đầu tiên, lỗi quan trọng phải inline ngoài toast.
