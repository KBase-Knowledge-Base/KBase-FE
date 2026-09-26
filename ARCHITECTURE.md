# ARCHITECTURE — KBase FE v1

## Trạng thái

Kiến trúc mục tiêu, chưa triển khai. FE là SPA độc lập; BE Spring Boot hiện có là API authority. Không đưa Node API, database, Gemini SDK hoặc business authorization mới vào FE.

## Stack được chọn

| Lớp | Lựa chọn | Vai trò |
|---|---|---|
| Application | React, TypeScript strict, Vite | SPA, build nhanh, type safety |
| Styling | Tailwind CSS với Vite plugin | Token CSS, utility, white neumorphism |
| Routing | React Router, data router | Nested layout, lazy route, error boundary |
| Server state | TanStack Query | Query keys, cache trong memory, invalidation, bounded polling |
| Form | React Hook Form + Zod | Controlled validation và map lỗi server |
| UI primitives | Radix Primitives + component do FE sở hữu | Dialog, menu, tabs, tooltip có keyboard/focus semantics |
| Feedback | react-loading-skeleton | Skeleton theo đúng hình dạng nội dung |
| HTTP | fetch wrapper; XMLHttpRequest cho upload progress nếu cần | Auth, timeout, abort, error parsing tập trung |
| Content | react-markdown + remark-gfm, raw HTML tắt | Markdown AI/text an toàn; citation từ structured DTO |
| Icons/motion | lucide-react; CSS trước, motion/react nếu cần | Icon thống nhất, motion nhỏ tôn trọng reduced-motion |
| Verification | Vitest, Testing Library, MSW, Playwright, axe | Unit/integration UI, deterministic browser, live smoke riêng |

Chọn stable releases tương thích tại bootstrap, xác minh peerDependencies và Node engine; ghi version chính xác vào lockfile và DEVELOPMENT. Không trộn API giữa major, không dùng pre-release hoặc ép `--force`/`--legacy-peer-deps`. Không cần Redux, UI kit thứ hai, chart library hoặc editor nặng khi không có use case.

## Layout source mục tiêu

```text
src/
  app/           router, providers, auth bootstrap, layouts, error boundaries
  features/      auth, account, projects, members, invitations, organization,
                 documents, project-assistant, guide, admin
  shared/
    api/         client, refresh coordinator, errors, contract types
    ui/          primitives, skeletons, empty/error states, dialogs
    lib/         dates, formatting, permissions, safe URLs
  styles/        tokens.css, globals.css
  assets/        landing illustrations and optimized images
  test/          setup, factories, MSW handlers (test/demo only)
public/          static assets, dedicated media service worker if used
tests/e2e/       deterministic suites + separately gated live suite
```

Dependency: app → features → shared. Shared không import feature. Feature không truy cập internal của feature khác; dùng public exports/route hoặc orchestration app. Network chỉ qua shared API client và feature API modules. Components không ghép URL tùy ý hoặc giữ bản sao server state lâu dài.

## State và cache

- URL giữ page/filter/sort/tab; state local giữ dialog, selection và input draft.
- Query keys chứa authenticated user ID, project ID và parameters; conversation thêm creator scope. Không cache nội dung private vào localStorage/IndexedDB/service-worker Cache API.
- Access token chỉ memory; refresh cookie do BE quản lý. Bootstrap refresh một lần rồi `/users/me`; protected route chờ kết quả trước render.
- Logout, đổi account, disable account, revoke access: cancel requests, clear cache, xóa blob URL và memory drafts theo scope. Async response từ session cũ phải bị bỏ qua bằng session epoch, không ghi lại cache mới.
- Auth role từ `/users/me`; project role từ `ProjectResponse.currentUserRole`. `null` có thể là ADMIN override, không tự gán OWNER.

## Ranh giới delivery

FE local `localhost:3000`, proxy `/api` tới BE owner chỉ định. Production ưu tiên cùng origin cho SPA và reverse-proxy `/api`; cookies SameSite=Lax của BE không phù hợp tự động với hai site không liên quan. Không đổi BE để giải quyết deployment trong phiên FE.

Không SSE/streaming AI, shared chat, global project search, forgot-password, version history, trash, OAuth, billing hoặc analytics dashboard vì baseline không có API tương ứng.
