# DEPLOYMENT — FE handoff

Chưa chọn host và chưa được authorize deploy. `npm run build` tạo dist static; không deploy tự động, không tạo GitHub Actions phát hành/push hoặc sửa infrastructure BE.

## Contract với host

- HTTPS production. SPA deep links trả index.html cho route FE, không rewrite API/asset/media worker request thành HTML.
- Cùng origin reverse proxy `/api` tới BE để giữ cookie/auth và binary header behavior. Vite dev proxy không nằm trong dist. Hai site khác nhau là blocker cần owner quyết định cookie/CORS/CSRF, không xử lý bằng localStorage token dài hạn.
- Asset filenames hashed/cache immutable; HTML/config/worker có update policy phù hợp để tránh app/worker mismatch. Không cache private API/binary/AI data.
- Base URL env cần xác định lúc build; không embed secrets. Phân biệt build-time env với runtime configuration.
- Validate worker scope, Range200/206/416, download headers, invitation URL origin và callback route sau host setup.
- Security headers/CSP theo renderer/blob/worker cần dùng, không nới blanket wildcard. Preview deploy chỉ được thực hiện khi owner yêu cầu.

## Rollback

Owner giữ dist/release trước. Rollback FE artifact không rollback DB/BE. Kiểm tra API compatible với FE cũ trước switch. Worker version phải hỗ trợ clear old state và safe reload; không để worker cũ intercept API sai.
