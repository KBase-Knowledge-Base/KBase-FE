# SECURITY — FE

- Scope/command permissions: [AGENTS](../AGENTS.md). Đây là agent instructions, không phải sandbox kỹ thuật tuyệt đối; owner vẫn nên giữ terminal permission review của Antigravity cho thao tác ngoài scope. Không thay cài đặt bảo mật máy để agent chạy nhanh hơn.
- Không đưa secret BE vào VITE_ vì mọi biến VITE_ có thể vào browser bundle. Không log Authorization, cookie, password, OTP, invitation token, document content hoặc AI prompt/history.
- Access token/query cache chỉ memory. Session epoch + clear/cancel khi logout/revoke. Không offline-persist dữ liệu private; media worker không cache response/token.
- Render Markdown với raw HTML tắt; URL allowlist http/https, `rel=noopener noreferrer` cho external links; chặn javascript/data URL nguy hiểm và ảnh remote từ model/doc để tránh tracking. Citation dùng structured source DTO và local document route.
- Uploaded SVG/text không inline HTML; API error messages và filenames render escaped. Không external document viewer. Set referrer policy phù hợp, đặc biệt invitation route không gửi token referrer.
- Auth guards là UX; server authorization là authority. Không route ADMIN chỉ dựa decoded JWT không kiểm chứng user state; `/users/me`/403 quyết định.
- Confirm hard delete đúng resource; không auto-resolve dependency bằng xóa tiếp dữ liệu. E2E teardown chỉ xóa IDs do suite vừa tạo trong fixture scope, không delete-all.
- Production security headers/CSP phải thiết kế theo asset/blob/worker thực dùng, không `unsafe-eval` để qua lỗi build. Owner deployment cấu hình, FE agent không đụng reverse proxy BE.
