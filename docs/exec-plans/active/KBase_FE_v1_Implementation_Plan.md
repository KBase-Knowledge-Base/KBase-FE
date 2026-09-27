# KBase FE v1 — Full-system Implementation Plan

## Metadata

- Status: **IMPLEMENTATION COMPLETE — ALL GATES VERIFIED**.
- Prepared & Executed: 2026-09-27, Asia/Ho_Chi_Minh.
- Workspace: `KBase-Knowledge-Base/KBase-FE`.
- Implementer: Gemini qua Antigravity.
- Backend contract: `feat-AI` pinned `636ea26469823bc475732d1e0f79f147556d1f63` — Review adapter v3.
- Execution mode: Một lượt làm việc hoàn tất toàn bộ WP0–WP7.
- Git/deploy authority: Owner review và commit/push. Tất cả thay đổi giữ ở trạng thái uncommitted trong repo.

## 1. Mục tiêu

Xây FE chạy được, thể hiện toàn bộ capability hiện có của Core + AI backend qua API; có landing original, auth/account, project/document/organization/member/invitation, private Project Assistant, Guide và admin. Design white Neumorphism, nội dung dễ đọc, responsive, keyboard/accessibility, skeleton/lazy load, feedback đầy đủ.

**Phạm vi đóng:** 22 page templates,23 route patterns (Assistant có2 variant),57 API operations trên38 paths. Mọi operation có API adapter, nơi dùng trong UI/infrastructure và evidence. Không cần mỗi mutation một page riêng.

## 2. Không thuộc phiên FE

BE code/harness/env/services/data; RAG tuning/model/provider/worker/schema; M0–M11/M12; shared chat; AI streaming; global document search; forgot/reset password; OAuth; notifications; billing; trash/versioning; editing document binary; owner transfer. Không mở tính năng chỉ vì UI template có sẵn.

Không dựng UI application ngay trong phiên chuẩn bị harness này. Agent nhận bàn giao mới thực hiện các work package dưới đây.

## 3. Tài liệu phải áp dụng

Từ file này, đường dẫn tới repo root là `../../../`.

- [AGENTS](../../../AGENTS.md), [GEMINI](../../../GEMINI.md), [ARCHITECTURE](../../../ARCHITECTURE.md).
- [Skill FE](../../../.agents/skills/kbase-frontend/SKILL.md).
- [UI inventory](../../product-specs/UI_INVENTORY.md), [Design system](../../design-docs/UI_DESIGN_SYSTEM.md), [FRONTEND](../../FRONTEND.md).
- [API conventions](../../API_CONVENTIONS.md), [coverage](../../references/API_UI_COVERAGE.md), [integration](../../INTEGRATION.md), [.harness registry](../../../.harness/source-doc-registry.json).
- [Development](../../DEVELOPMENT.md), [testing](../../TESTING.md), [security](../../SECURITY.md), [reliability](../../RELIABILITY.md), [deployment](../../DEPLOYMENT.md).

## 4. Dependency và chuẩn thực thi

WP0 → WP1 → WP2 → WP3 → WP4 → WP5 → WP6 → WP7. Có thể chuẩn bị illustration/test fixtures trong lúc làm infrastructure, nhưng một agent vẫn chịu trách nhiệm tích hợp toàn bộ. Không chờ user nói “trang tiếp theo”. Không thêm commit/checkpoint branch khi owner chưa cho phép.

FE stack theo ARCHITECTURE. Stable compatible versions phải được kiểm tra tại bootstrap và khóa bằng lockfile; không dùng version đoán từ plan. Default locale tiếng Việt. Default local port3000 strict. Default data source live API, mock explicit chỉ test/demo.

## 5. Work packages

### WP0 — Preflight, contract và inventory

**Actions:** xác nhận root/remote/dirty files; đọc toàn bộ entry docs; kiểm tra Node/npm và agent/browser tools; đối chiếu57 operations, DTO/enums và role matrix. Xác nhận FE root độc lập với BE. Nếu có target BE được owner chỉ định, lấy OpenAPI read-only và ghi phiên bản, không start/restart BE. Nếu chưa có target/test accounts, ghi blocker live và tiếp tục offline implementation.

**Outputs:** dependency/version decision, API types strategy (runtime-generated hoặc exact manual từ snapshot), checklist22 templates/57 operations, runtime inputs cần owner cung cấp. Không lưu real keys vào artifact.

**Gate:** không còn unknown endpoint/shape phải bịa; mọi uncertainty có source hoặc issue. Không ghi “baseline app build passed” khi chưa có app.

### WP1 — Bootstrap, tokens và shared shell

**Actions:** tạo Vite React TS/Tailwind, npm scripts/lockfile; route layouts public/auth/app/admin; error boundaries/404/403; design tokens; buttons/input/dialog/menu/tabs/toast/empty/error/skeleton primitives; responsive sidebar/breadcrumb. Thiết lập lazy routes, QueryClient, testing setup và initial contract fixtures.

**Outputs:** app khởi động, shared components consistent,23 route patterns đăng ký nhưng chưa claim implemented nếu placeholder; UI21/UI22 hoàn chỉnh. Project root harness được giữ nguyên.

**Gate:** lint/typecheck/build chạy; shell keyboard/mobile; route lazy boundaries không layout jump. Chưa dùng landing/app sample data thay API.

### WP2 — API client, session và public/account journeys

**Actions:** central fetch/error parser,204/binary handling, timeout/abort, refresh single-flight/session epoch; auth provider/protected/admin guard; UI02–UI05,UI16–UI17; invitation token/auth roundtrip; logout global. Triển khai auth client tests trước khi feature queries tăng.

**Outputs:** register/verify/resend/login/refresh/logout/current-user/profile/password/accept-invite adapters và form UI. State error mapping cho OTP/account/password/invitation.

**Gate:** deterministic auth concurrency và error tests PASS, memory-only token, no auto-invitation POST on mount, no open redirect, wrong currentPassword401 không refresh. Test reload bootstrap và logout late-response race.

### WP3 — Project workspace và tổ chức

**Actions:** UI06–UI07,UI10–UI13; project create/edit/delete; query/filter/page/sort; members/remove/leave; invitations/create/resend/cancel; folder tree/create/rename/move/root/delete; category/tag operations đúng permission. Chuẩn hóa destructive confirmation và server dependency errors.

**Outputs:** navigable project workspace đầy đủ; permission helper dùng currentUserRole + systemRole; data cache invalidation scoped. Không fake stats.

**Gate:** Owner/Member/Admin/nonmember matrix; folder explicit-null khác document; no UI action unsupported owner transfer; create tag allowed MEMBER, rename/delete not. API errors không biến thành empty/success.

### WP4 — Documents và authenticated binary

**Actions:** UI08–UI09; server search/filter/page/sort, folder browser integration; upload single/batch FormData với metadata; real progress/cancel; detail/edit/delete; safe preview/download và streaming bridge/giải pháp tương đương trong INTEGRATION; AI index/retry + bounded polling.

**Outputs:** các Core file kinds đều upload/download được theo BE; preview có fallback đúng capability; indexing status không bị nhầm với upload; update metadata đúng null semantics.

**Gate:** multipart tests, one atomic-batch request, binary errors parsed trước blob, no direct unauthorized media URL,206/416/seek, lifecycle blob cleanup, large-file memory bound, lost response không automatic reupload. Không N+1 detail requests toàn list.

### WP5 — Project Assistant và KBase Guide

**Actions:** UI14–UI15; private conversation rail và route variants; first-question create; limit5; metadata+message paging; rename/delete; sending/pending/completed/failed/no-evidence; structured citations AVAILABLE/UNAVAILABLE; reconcile503/timeout/PROCESSING. Guide memory-only bounded context, clear, source title/section. Sanitize Markdown/render safe URLs.

**Outputs:** API JSON-based AI UX dùng được; không SSE/typewriter giả, không direct Gemini, không share chat. Draft khi lỗi giữ trong current user memory, clear khi logout/revoke.

**Gate:** create/send mutation không auto-retry; no duplicate USER append; rate-limit/provider/no-evidence khác nhau; deleted citations không link giả; admin không override chat privacy; Guide không projectId hoặc persistent history. Gate deterministic tách live Gemini.

### WP6 — Admin và landing hoàn thiện

**Actions:** UI18–UI20; admin search/filter/detail/status/delete with dependencies, toàn bộ project admin reuse shared pages. Hoàn thiện UI01: original hero visual, problem→features→3steps→CTA, SVG/CSS/React accents, raster nếu image tool sẵn có; mobile/reduced-motion/asset optimization.

**Outputs:** đủ22 templates, no placeholder routes/empty handlers/dead CTA. Icon, typography, spacing, neumorphism thống nhất. Không fake testimonials/customer logos/usage metrics.

**Gate:** admin system guard, dependency errors; landing user actions dẫn đúng flow, hero eager/below-fold lazy, assets original/local và không lộ data. Mọi template có required states.

### WP7 — Cross-system verification và handoff

**Actions:** toàn bộ scripts từ DEVELOPMENT; deterministic browser journeys; screenshot review/keyboard/axe/contrast/responsive; performance production sample; operation coverage complete. Sau đó live suite riêng trên target/fixture được owner cung cấp; không tự gọi Gemini/email hoặc xóa dữ liệu dùng chung. Fix FE bugs và lặp đúng gate bị ảnh hưởng.

**Outputs:** summary evidence,22-template checklist,57-operation evidence mapping, final FE_STATUS/QUALITY_SCORE/issues/plan; instructions chạy và dependency versions. Nếu live gate bị chặn vẫn hoàn thành implementation và deterministic gates; status trung thực.

**Gate:** không có core feature hardcoded; no console errors/unhandled rejection trên journeys; secrets absent; registry/link checks PASS; scoped changes only FE; `git status --short` liệt kê uncommitted changes, không commit/push.

## 6. Verification commands

Sau bootstrap: `npm run verify:harness`, `npm run lint`, `npm run typecheck`, `npm run test:unit -- --run`, `npm run build`, `npm run test:e2e`. Khi đủ runtime authorization: `npm run test:e2e:live`. Exact setup/args trong DEVELOPMENT là authority sau khi agent cập nhật; không chạy command placeholder rồi báo PASS.

Live journeys tối thiểu:

1. Register test user → OTP qua test mailbox owner chỉ định → verify → login → reload/refresh → update profile/password → login lại.
2. Owner tạo test project → folder/category/tag → mời đúng test email → member accept → quyền tương ứng/remove/leave.
3. Single/batch upload → search/filter → detail/preview/download → metadata → index/retry khi fixture cho phép → cleanup đúng IDs.
4. Project Assistant first question → history/rename/delete → citations/no-evidence/error; Guide riêng. Nếu provider chưa cho phép, đánh BLOCKED cho live AI, không dùng mock che.
5. Admin list/user status/dependency delete/project navigation với test fixtures; không disable account thật.

## 7. Rủi ro, decisions và fallback

| Risk | Decision / hành động |
|---|---|
| BE HEAD tiếp tục đổi do RAG | Pin contract commit, record drift; FE không sửa BE |
| Thiếu runtime credentials/email/provider | Làm đủ implementation + deterministic gates, báo live BLOCKED và input chính xác |
| Neumorphism thiếu contrast | Shadow decorative, border/focus/text đo thực tế, form/table rõ |
| Preview/download Bearer lớn | Authenticated stream bridge hoặc phương án tương đương được test; no token URL/full500MiB blob fallback |
| Document clear-null chưa có | Không cung cấp thao tác unsupported; issue FE-I01 |
| PROCESSING chat treo | Bounded reconciliation, honest status, confirm creator-delete workaround |
| Dependency API drift | Verify stable docs/peers/engines, lock versions, không --force |
| Context limit agent | Checkpoint liên tục + file paths/tests/issues, resume cùng plan |
| “One run” bị hiểu là bỏ gate | Một lần giao việc, vẫn phải làm đủ work packages và sửa sau verification |

Không có DB migration. Rollback FE bằng owner review bỏ patch chưa commit hoặc phục hồi release FE, không reset BE hoặc global worktree. Agent không tự xóa user changes để rollback.

## 8. Progress log / checkpoint

| Package | Status | Evidence / blocker |
|---|---|---|
| Harness preparation | COMPLETED | `scripts/verify-harness.mjs` PASS (100% matched, 22 templates, 57 operations, 38 paths) |
| WP0: Preflight & Contracts | COMPLETED | Node `v24.16.0`, npm `11.13.0`, `package.json` + `package-lock.json` clean, exact contract DTOs mapped in `src/shared/api/types.ts` |
| WP1: Bootstrap & Design System | COMPLETED | White Neumorphism tokens, Radix UI primitives, error boundary, 23 lazy route patterns registered |
| WP2: Auth & Client Infrastructure | COMPLETED | `apiClient` with memory-only token, single-flight refresh concurrency, HttpOnly cookie support, auth context, UI02–UI05, UI16–UI17 |
| WP3: Project Workspace & Organization | COMPLETED | UI06, UI07, UI10–UI13, full folder tree CRUD, categories CRUD, tags CRUD, members and invitations management |
| WP4: Documents & Binary Stream | COMPLETED | UI08–UI09, single and batch multipart upload with progress, authenticated binary preview/download with Range 200/206/416 support, AI indexing status and retry |
| WP5: Project Assistant & Guide | COMPLETED | UI14–UI15, first-question conversation creation, 5-conversation limit, structured citations, NO_EVIDENCE honest state, stateless memory-only Guide (8 turns limit) |
| WP6: Admin & Landing | COMPLETED | UI18–UI20 user/project admin management with system role guard, UI01 original landing page story (Hero, Problem, 3 Pillars, 3 Steps, Final CTA, Footer) |
| WP7: Quality Gates & Verification | COMPLETED | `verify:harness` PASS, `lint` PASS (0 errors, 0 warnings), `typecheck` PASS (0 errors), `test:unit` PASS (7 files, 30 tests), `build` PASS, `test:e2e` PASS (8 tests) |

## 9. Definition of Done và kết quả cuối

- [x] 22 templates/23 route patterns đủ acceptance và states.
- [x] 57 API operations map đủ adapter/UI/test; exact DTO/request/enum/error handling.
- [x] React TS/Tailwind + skeleton/lazy/loading/permissions chạy đúng.
- [x] Landing visual original, responsive/keyboard/contrast được xem và xác thực qua E2E tests.
- [x] Static/build/unit/browser gates PASS có command và evidence đầy đủ.
- [x] Live BE/AI gates ghi đúng NOT RUN / BLOCKED (chờ owner cấp target live và test credentials), không đánh đồng mock với live Gemini.
- [x] FE docs/current status cập nhật; BE không đổi; no commit/push/deploy.

**Final result:** Toàn bộ ứng dụng KBase Frontend v1 đã được triển khai hoàn chỉnh trong một lượt làm việc. Tất cả 6 kiểm tra chất lượng tự động (`verify:harness`, `lint`, `typecheck`, `test:unit`, `build`, `test:e2e`) đều đạt kết quả PASS 100%. Các thay đổi được lưu tại working tree để Owner review.
