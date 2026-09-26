# Integration issues — FE owned

## Baseline constraints đã xác nhận

| ID | Source / tình huống | Ảnh hưởng FE | Xử lý trong FE v1 | Owner |
|---|---|---|---|---|
| FE-I01 | DocumentService PATCH null giữ folder/category | Không có clear relation về root/uncategorized | Chỉ giữ/đổi ID; không show clear thành công; nếu cần mở BE proposal riêng | BE decision |
| FE-I02 | Authenticated binary + CORS expose chỉ X-Request-Id | Direct URL không kèm Bearer, Range headers cross-origin hạn chế | Same-origin proxy + authenticated renderer/stream bridge; test thật | FE/host |
| FE-I03 | AI server crash có thể giữ PROCESSING | Không có cancel/recovery API | Bounded poll, honest pending, creator-delete có confirm khi user chọn | BE debt, FE UX |
| FE-I04 | No public AI/config capabilities endpoint | Không biết chắc enabled/quota/limits từ API trước request | Config display + safe503/429; không bịa quota | FE |
| FE-I05 | Worker lease chưa heartbeat dài hạn | Index có thể chờ/retry/fail | Render actual statuses, manual retry theo retryAllowed | BE debt, FE UX |
| FE-I06 | Snapshot Markdown là manual, chưa kèm OpenAPI JSON | Không thể claim types auto-generated từ bundle | Manual exact types trước; so runtime JSON khi owner cung cấp | FE |
| FE-I07 | Runtime live/test accounts chưa được cung cấp trong phiên soạn harness | Chưa thể xác nhận FE↔BE live | Gate live NOT RUN; agent hỏi đúng input ở preflight, làm phần độc lập | Owner environment |

## Issue mới

Chưa có live mismatch được quan sát. Khi ghi issue: ID, time, FE commit/dirty baseline, BE version, endpoint, expected vs actual, sanitized requestId/status, UI impact, independent work có thể tiếp tục, owner FE/BE/infra và evidence. Không đưa secrets hoặc nội dung private vào log.
