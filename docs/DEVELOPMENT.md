# DEVELOPMENT — FE

## Hiện trạng command

Đã bootstrap và hoàn thiện toàn bộ mã nguồn ứng dụng KBase Frontend v1. Node tested version: `v24.16.0`, npm `11.13.0`.
Tất cả dependencies đã được khóa tại `package-lock.json`. Toàn bộ các script chất lượng đã được tạo và kiểm tra thành công 100%.

## Scripts đã được thiết lập và kiểm chứng

| Command | Ý nghĩa | Trạng thái thực tế |
|---|---|---|
| `npm install` | Cài đặt dependencies và sinh lockfile | PASS — `package-lock.json` clean |
| `npm run dev` | FE local port 3000 strictPort, proxy `/api` tới backend target | Sẵn sàng hoạt động |
| `npm run lint` | ESLint 9 với TypeScript, React Hooks, Refresh rules | PASS — 0 errors, 0 warnings |
| `npm run typecheck` | TypeScript 5.7 strict mode (`tsc --noEmit`) | PASS — 0 errors |
| `npm run test:unit -- --run` | Vitest + MSW unit & integration tests | PASS — 7 test files, 30 tests pass |
| `npm run build` | `tsc -b && vite build` tạo production bundle | PASS — Clean code-split dist bundle |
| `npm run preview` | Preview static bundle trên port 3000 | Sẵn sàng hoạt động |
| `npm run test:e2e` | Playwright deterministic suite (Landing, Auth, Routing, Viewports) | PASS — 8 tests pass in 10.6s |
| `npm run test:e2e:live` | Suite riêng cho live verification | BLOCKED / NOT RUN (chờ target live) |
| `npm run verify:harness` | Kiểm tra links/inventory/coverage/source registry FE | PASS — 100% matched |

## Environment

`VITE_API_BASE_URL=/api/v1`, `KBASE_FE_PROXY_TARGET=http://localhost:8080` cho Vite dev/preview proxy; `VITE_ENABLE_MOCKS=false` là default. Mọi network call mặc định kết nối API thật.
Access token chỉ lưu trong memory; Refresh token dạng HttpOnly cookie do backend quản lý.

## Antigravity

Canonical skill: `.agents/skills/kbase-frontend/SKILL.md`. Root AGENTS/GEMINI là rules entry; modular rule dùng `trigger: always_on`.
