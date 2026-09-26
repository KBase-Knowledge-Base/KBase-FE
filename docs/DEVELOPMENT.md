# DEVELOPMENT — FE

## Hiện trạng command

Chưa có `package.json`, Node version file hoặc lockfile tại thời điểm bàn giao harness. Các command dưới đây là **contract cần bootstrap**, chưa được chạy và không được báo PASS từ tài liệu.

Riêng kiểm tra harness có sẵn và có thể chạy ngay: `node scripts/verify-harness.mjs`. Khi bootstrap package.json, nối `verify:harness` tới script này. Script chỉ đọc file, không gọi BE/network hoặc thay đổi repo.

## Bootstrap một lần

1. Xác nhận repo và dirty files theo AGENTS. Giữ nguyên harness; không scaffold đè toàn bộ root.
2. Kiểm tra Node/npm sẵn có. Chọn Node LTS thỏa engine của Vite và các package stable đã chọn; ghi exact tested version vào `.nvmrc`/`package.json engines` và file này. Không cài global hoặc sửa toolchain hệ thống.
3. Tạo Vite React TypeScript app và Tailwind Vite plugin; dùng npm duy nhất, tạo `package-lock.json`. Không bắt đầu bằng template demo có nav/API không thuộc KBase.
4. Cài dependencies trong ARCHITECTURE, exact resolved versions ở lockfile. Trước khi chạy lifecycle script lạ, xem package/source; không chạy remote shell script.
5. Copy `.env.example` thành `.env.local` riêng FE khi cần, không log secret hoặc commit env. Chọn cache/output project-local; không xóa cache chung.

## Scripts bắt buộc sau bootstrap

| Command | Ý nghĩa |
|---|---|
| `npm install` | Lần đầu resolve và tạo lockfile, không dùng `npm ci` trước khi có lock |
| `npm ci` | Cài theo lockfile cho lần sau |
| `npm run dev -- --host 127.0.0.1` | FE local port3000 strictPort, API proxy owner chỉ định |
| `npm run lint` | ESLint TS/React Hooks/a11y phù hợp |
| `npm run typecheck` | TypeScript check không emit |
| `npm run test:unit -- --run` | Vitest + Testing Library + API client/MSW integration |
| `npm run build` | Typecheck + production Vite build |
| `npm run preview -- --host 127.0.0.1` | Preview static bundle; **không mặc định có proxy API** |
| `npm run test:e2e` | Playwright deterministic, MSW/mock explicit, không live email/Gemini |
| `npm run test:e2e:live` | Suite riêng chỉ bật khi owner cấp target/accounts/fixtures |
| `npm run verify:harness` | Kiểm tra links/inventory/coverage/source registry FE |

Tạo script đúng tên, cập nhật arguments/version/port thực tế ở đây khi bootstrap xong. Không viết command no-op hoặc script luôn exit0. Browser binary nếu cần cài phải dùng cache trong repo hoặc tool đã có, không `--with-deps` để thay hệ thống mà chưa được phép.

## Environment

`VITE_API_BASE_URL=/api/v1`, `KBASE_FE_PROXY_TARGET` chỉ cho Vite dev proxy; `VITE_ENABLE_MOCKS=false` là default. Config upload/AI limits trong `.env.example` là display prevalidation, BE vẫn quyết định. Chưa có public runtime capabilities endpoint.

Live test credentials dùng biến process riêng `KBASE_FE_E2E_*` hoặc owner input an toàn, không VITE_ và không fixtures commit. Không tự tìm credentials trong máy, browser profile hay BE env.

Production/preview cần cùng-origin `/api` routing do owner chuẩn bị; Vite dev proxy không tự tồn tại trong dist. Deep-link rewrite phải loại trừ `/api`, assets và media worker bridge; xem DEPLOYMENT.

## Antigravity

Canonical skill: `.agents/skills/kbase-frontend/SKILL.md`. Root AGENTS/GEMINI là rules entry; modular rule dùng `trigger: always_on`. Nếu bản IDE cũ không autodiscover `.agents`, đọc rõ file bằng đường dẫn từ HANDOFF_PROMPT; owner có thể cấu hình workspace-local theo docs phiên bản của họ. Không copy rules vào home/global scope hoặc duy trì hai skill duplicate.
