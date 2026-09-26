# INTEGRATION — FE ↔ KBase BE

## 1. Runtime boundary và parallel work

FE owner: repository KBase-FE. BE owner: phiên backend/RAG riêng. BE được đọc qua pinned contract; FE không chạy Maven, docker-compose, SQL, Redis/MinIO CLI, migrations hoặc provider smoke. Không stop/restart/kill process không do phiên FE tạo.

Chỉ cấu hình FE proxy tới endpoint owner cung cấp. Defaults dành cho local: FE `http://localhost:3000`, BE `http://localhost:8080`; BE đã mặc định CORS allow localhost:3000 và invitation accept URL `/invitations/accept`. Dùng Vite `port:3000`, `strictPort:true`; nếu port bận báo owner/chọn explicit port theo owner, không kill process và không tự sửa CORS BE.

FE dev proxy `/api` giữ nguyên prefix, forward tới KBASE_FE_PROXY_TARGET. `/v3/api-docs` chỉ lấy ở preflight khi allowed; không bắt buộc expose trong production. Same-origin proxy cũng giúp binary header access. Production cần SPA + `/api` reverse proxy cùng origin; cấu hình đó là deployment handoff, không quyền sửa infrastructure BE.

## 2. Session state machine

States: bootstrapping → authenticated / anonymous / temporarily-unavailable. Trên protected route, thử refresh có credentials một lần, rồi GET users/me. Không flash app private trước khi xong bootstrap. Trên landing public không cần gọi protected APIs chỉ để vẽ trang.

Access token giữ memory; refresh token HttpOnly cookie `kbase_refresh_token`, Path=/api/v1/auth, SameSite=Lax, Secure theo môi trường. Không đọc cookie bằng JS, không lưu access token localStorage/sessionStorage, không đưa token vào URL hay service-worker cache.

Refresh single-flight cho nhiều request đồng thời. Chỉ retry một lần request bị reject do `ACCESS_TOKEN_EXPIRED`/`INVALID_ACCESS_TOKEN`/`AUTHENTICATION_REQUIRED`, sau refresh thành công. Không refresh với `INVALID_CREDENTIALS`, `CURRENT_PASSWORD_INVALID`, 403, 429 hoặc các refresh failure code. Request auth/refresh không tự gọi lại interceptor của chính nó.

Chỉ replay mutation sau **explicit auth rejection** trước business processing; timeout/disconnect/5xx là kết quả chưa chắc chắn, không replay. Nếu signal đã abort, không replay. FormData cần body factory khi replay, không tái sử dụng consumed stream.

Refresh 401/403 terminal → clear session/caches và login; network/503 → state unavailable + retry explicit, không kết luận user logout vĩnh viễn. Dùng session epoch để bỏ response cũ sau logout/account switch. BroadcastChannel chỉ truyền event logout/account-change, không token; tab khác clear cache/refresh phù hợp.

Logout gọi BE; clear memory ở mọi outcome nhưng báo nếu server logout thất bại, không khẳng định cookie/session đã revoke. Đổi password thành công revoke refresh sessions → FE clear session và về login.

## 3. Permission và revoke

System ADMIN khác project OWNER/MEMBER. Quản lý project/folders/categories/invitations: OWNER/ADMIN. Create tag/upload: MEMBER/OWNER/ADMIN. Rename/delete tag: OWNER/ADMIN. Modify document/retry index: MEMBER uploader hoặc OWNER/ADMIN. Read chat luôn creator-private, kể cả ADMIN.

Server 403/404 sau đổi quyền thắng cached role. Dừng poll, cancel scoped queries, bỏ private content/citations/preview blob, điều hướng về screen an toàn; giữ lời giải thích chung. Không render cached conversation sau revoke. Admin project list dùng `/admin/projects`, `/projects` chỉ list membership.

## 4. Upload / metadata

Client validation hỗ trợ extension allowlist và config byte limit nhưng BE vẫn quyết định MIME/permission. Defaults: document50MiB, image20MiB, video500MiB; max10 files/batch. Tổng multipart default500MiB gồm overhead; cảnh báo sát trần, không đảm bảo file đúng500MiB sẽ qua request cap. Actual environment có thể override, xác nhận từ owner.

Progress upload là bytes đã gửi, không đồng nghĩa persistence hoặc indexing hoàn tất. Sau upload progress100% hiển thị “Đang xử lý”; chỉ success sau201. Abort không đảm bảo server rollback. Mất response → refetch danh sách trước yêu cầu user upload lại. Không tự retry upload/batch.

Metadata không có replace file/version endpoint. Document folder/category chưa hỗ trợ clear-null; giữ field khi không đổi. Folder move root dùng explicit null riêng. Không phá limitation bằng delete/reupload.

## 5. Binary preview / download có Bearer

Không gắn `<img src=/api/...>` / `<video src=/api/...>` / anchor trực tiếp tới protected endpoint rồi kỳ vọng browser tự thêm Authorization. Không dùng token query params, public MinIO URL hoặc external Office/Google viewer vì sẽ bypass auth/lộ tài liệu.

- PDF/image/text nhỏ: fetch có Authorization, kiểm tra error, tạo object URL khi cần; revoke khi đổi document/unmount/logout/revoke. Markdown raw HTML tắt; text render escaped. SVG user upload chỉ `<img>` từ blob hoặc sanitize strict, tuyệt đối không inline script/HTML/object embed.
- PDF có thể dùng native sandboxed viewer hoặc lazy PDF.js/React-PDF với authenticated fetch; không bundle viewer nặng ở landing. Không giả page navigation từ citation nếu viewer không hỗ trợ; luôn show page number.
- MP4 và download lớn: ưu tiên authenticated streaming bridge FE-owned qua service worker ở same origin. Bridge chỉ nhận document ID hợp lệ + client-bound session, chỉ forward GET preview/download đến fixed API origin/path, thêm Bearer trong worker memory, pass Range và giữ status200/206/416, Content-Range/Accept-Ranges/Content-Type/Disposition. Không buffer toàn bộ file, không Cache API, không token URL, không generic proxy tùy ý.
- Worker lấy token qua MessageChannel từ đúng controlled client, timeout hữu hạn; không lấy token từ tab khác. Logout/revoke xóa worker session, abort stream; worker restart yêu cầu handshake lại. 401 cần refresh qua client single-flight, tối đa một lần. Phải test range/seek, cancel và isolation giữa tab. MSW test worker và production media worker không được tranh scope; isolate test mode hoặc mock bridge transport.
- Có thể dùng giải pháp tương đương nếu chứng minh authenticated range và memory bound. Browser không có bridge/stream support: blob fallback chỉ file nhỏ (đề xuất <=32MiB), file lớn hiển thị download/preview limitation rõ; không âm thầm buffer500MiB. Thiếu browser support phải ghi vào evidence, không giả preview thành công.
- Office DOC/DOCX/XLS/XLSX/PPT/PPTX và MOV/AVI upload/download được; baseline BE không preview chúng. Nhãn “Chưa hỗ trợ xem trước” + download là trạng thái chuẩn.

Direct cross-origin baseline chỉ expose X-Request-Id, không Content-Disposition/Content-Range; không dựa vào đọc các header này cross-origin khi chưa cấu hình. Cấu hình CORS BE cũng không liệt kê Range trong allowedHeaders. Same-origin proxy là đường mặc định, không sửa BE ngầm.

## 6. Query / polling / timeout

Query retry tối đa2 cho network/5xx reads, backoff; không retry auth/permission/notfound/validation. Mutation retry0. Retry-After chỉ dùng khi thực sự có và đọc được; không phát minh remaining quota/reset time.

Index poll chỉ document đang mở hoặc visible recent uploads: 3–5s với jitter, concurrency nhỏ; dừng READY/FAILED/UNSUPPORTED, permission/logout/offline/hidden tab/unmount. Sau khoảng2 phút chuyển manual refresh với thông báo, không suy đoán FAILED. Không poll toàn bộ thư viện.

Timeout đề xuất (FE config, không phải contract BE): regular reads30s, upload riêng phù hợp kích thước với progress/cancel; AI interactive180s vì có thể embedding rồi chat với60s/provider-call. Timeout FE không hủy transaction/generation server. Không test bằng real Gemini trong automated suite.

## 7. AI response reconciliation

- Create/send usage budget chung với Guide; không đếm quota còn lại trên client. Disable repeated send trong cùng conversation khi pending/PROCESSING.
- Send response chứa assistant, USER đã persist phía BE: invalidate/refetch message pages rồi dedupe id, không thêm USER lần hai khi refetch.
- Create 503 hoặc lost response có thể đã tạo conversation. Refetch list; nếu nhiều tab/new rows làm không xác định được row nào, cho user chọn conversation đã có, không tự đoán bằng title rồi resend.
- Existing conversation lost response: refetch last message pages/metadata; PROCESSING poll hữu hạn, FAILED hiển thị safe failureCode, COMPLETED render kết quả. Retry explicit sau reconcile tạo request mới, không hứa exactly-once.
- Crash recovery BE còn có thể để PROCESSING kéo dài. Show trạng thái chưa xác nhận, refresh/manual action; documented creator-delete conversation là destructive workaround, cần confirm mất history. Không triển khai auto-delete/auto-recreate.
- Citations nguồn deleted/unavailable giữ snapshot; clicking live source vẫn reauthorize qua core detail API. Không cache file indefinitely.
- AI disabled/provider unavailable dùng stable503; chưa có public capability endpoint. Không tự gọi Gemini từ FE hoặc gỡ toàn bộ app vì AI lỗi. Core document/auth vẫn dùng được.

## 8. Guide

Guide authenticated, stateless, không projectId. Context local trong memory tối đa8 messages, mỗi item4000 chars; loại tool/system role. Nếu turn quá dài, bỏ khỏi context thay vì tự biến thành nguồn có thẩm quyền. Nguồn guide là sourceKey/title/section, không document URL. Landing chỉ link tới Guide sau login hoặc dùng minh họa gắn nhãn.

## 9. Contract drift / owner handoff

Khi BE RAG phase cập nhật: owner cung cấp commit và OpenAPI nếu có. So method/path/request/response/enums/errors; cập nhật FE snapshot/types/test trong commit do owner quyết định, không sửa BE. Nếu semantic change không có trong OpenAPI, đối chiếu service/spec được cung cấp. Ghi BE_REQUIRED tại [issue log](INTEGRATION_ISSUES.md) với request redacted, code/requestId và impact, không đoán giải pháp rồi patch BE.

Live verification chỉ trên endpoint/test accounts owner chỉ định. Ghi rõ mock / live core / live deterministic AI / live Gemini. Tách request AI tính phí, OTP/invitation email và destructive actions theo dedicated fixtures; không chạy chúng hàng loạt mỗi lần build.
