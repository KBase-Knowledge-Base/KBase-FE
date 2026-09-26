# API_CONVENTIONS — FE consumer contract

## Authority

1. Runtime OpenAPI **trùng commit pinned hoặc baseline mới được owner chấp thuận**, cùng source/controller/DTO tại commit tương ứng. Runtime khác pin chỉ là bằng chứng drift; ghi issue và không tự chuyển baseline.
2. Source excerpt và registry hash trong bundle này.
3. [Snapshot API Markdown](references/backend/api-schema.md) của baseline BE.
4. FE design/plan. Nếu mâu thuẫn, ghi issue, không bịa endpoint/field.

Snapshot này không phải OpenAPI JSON và chưa có code-generated TS types. Khi `/v3/api-docs` được owner cung cấp, lưu sanitized JSON tại `docs/generated/openapi.json`, ghi commit/runtime provenance rồi dùng openapi-typescript hoặc equivalent đã kiểm tra. Không khởi động BE chỉ để lấy spec. Nếu chưa có JSON, viết types từ exact DTO và snapshot, ghi rõ manual, không claim generated.

## Transport

- Base FE config `/api/v1`; append relative resource path, tránh `/api/v1/api/v1`. JSON bình thường không có envelope `data` chung.
- `204` không parse JSON. Binary preview/download không parse như DTO. Error có thể là JSON ngay cả khi request kỳ vọng binary; kiểm tra status/content-type trước tạo blob.
- Auth Bearer access token trên protected API; `credentials: 'include'` cho cookie flow và same-origin client. Public auth không đính kèm stale Bearer.
- UUID là string; thời gian ISO UTC; enum đúng chữ hoa. `null` có nghĩa theo DTO, không tự loại bỏ hoặc chuyển thành `"null"`.
- `ApiErrorResponse`: timestamp, status, code, message, path, requestId, optional errors map field→message; header X-Request-Id. UI dùng safe translated message theo code + requestId, không raw stack.

## Pagination / sort / filter

`PageResponse<T> = {content:T[], page:number, size:number, totalElements:number, totalPages:number, first:boolean, last:boolean}`. Index API từ 0; UI có thể hiện từ 1. Default size 20, max100; AI messages default50. Folders/categories/tags là array, không có PageResponse.

| Resource | Query filters | Sort whitelist |
|---|---|---|
| my projects | q, role | name, createdAt, updatedAt |
| admin projects | q, ownerId | name, createdAt, updatedAt |
| admin users | q, status, systemRole | email, displayName, createdAt, updatedAt |
| members | không có q server | joinedAt, email, displayName |
| invitations | status | createdAt, email, status, expiresAt |
| documents | q, folderId, categoryId, tagId, fileKind, uploadedBy, createdFrom, createdTo | displayName, createdAt, updatedAt, sizeBytes |
| conversations | page, size | fixed updatedAt DESC, id DESC; không gửi sort |
| messages | page, size | fixed createdAt ASC, id ASC; không gửi sort |
| folders / tags | parentId / q tương ứng | không tự thêm sort query |

Core `sort=field,asc|desc` một field; defaults Core createdAt DESC trừ members joinedAt ASC. Không tự chế multi-tag OR filter, folder recursive flag hoặc root sentinel khi chưa có contract.

## Shapes dễ nhầm

- Login user DTO không có timestamps giống GET users/me; dùng types riêng hoặc map rõ.
- ProjectResponse có currentUserRole nullable; không có ownerId trong payload response để giả avatar owner.
- DocumentSummaryResponse khác DocumentResponse: xem field trong source excerpt; không ép cast summary thành detail.
- CreateAiConversationRequest chỉ `{message}`; response `{conversation,message,sources}`. Không tạo bằng title rồi gửi first turn lần nữa.
- AiTurnResponse là `{message,sources}`; message.role xác định USER/ASSISTANT. GET messages trả page các record này.
- Guide response `{answer,answerType,sources:[{sourceKey,title,section}]}`; không có documentId/url; show source info, không tạo link tài liệu project.
- DocumentAiIndexResponse `{documentId,status,failureReason,indexedAt,retryAllowed}`; không có percentage progress. Status có thể PENDING lâu khi provider/worker chưa sẵn sàng.

## Mutation serialization

Dirty fields cho PATCH. Folder parent null là root move, omitted là unchanged. Document folder/category null là unchanged theo baseline; tagIds[] là clear. Không gửi các field `...Provided` nội bộ của UpdateFolderRequest.

Upload: FormData `file` cho single hoặc nhiều part cùng tên `files` cho batch, `metadata` Blob với type application/json; không tự set Content-Type multipart để browser đặt boundary. Batch response `{documents:[...]}`. Contract không có resumable upload, idempotency key hoặc replacement binary.

Với signed contract đã pinned, mọi thay đổi FE adapter phải có test serialization/response handling liên quan. Không sửa snapshot BE vì UI đang cần field khác.
