# KBase FE — Review & Update Execution Plan

## Metadata

- Status: **READY FOR EXECUTION — REVIEW / REPAIR / LIVE VERIFICATION**.
- Prepared: 2026-09-27, Asia/Ho_Chi_Minh.
- Workspace: `KBase-Knowledge-Base/KBase-FE`.
- Baseline reviewed: `main@e32b2e714b6e77bd81e22b5319971abe6db74e2b`.
- Backend runtime: **Owner sẽ khởi động sẵn**. Agent FE chỉ kết nối qua endpoint được owner chỉ định; không start/stop/restart/sửa BE.
- Backend contract baseline hiện tại: `636ea26469823bc475732d1e0f79f147556d1f63` cho đến khi owner cung cấp baseline mới.
- Execution model: một lượt review → repair → deterministic verification → live FE↔BE browser verification → documentation handoff.
- Git authority của implementation agent: giữ thay đổi uncommitted để owner review, trừ khi owner đưa chỉ thị Git mới trong chính phiên thực thi.

## 1. Mục tiêu

Review lại KBase FE sau implementation v1, sửa các bug/rủi ro đã phát hiện, tự tìm thêm lỗi mới, sau đó chứng minh bằng test và browser rằng UI, layout, auth, permission, document flow và AI flow hoạt động đúng với frontend hiện tại.

Phiên này **không rebuild lại FE từ đầu**. Ưu tiên thay đổi nhỏ, có nguồn gốc rõ ràng, giữ architecture/harness hiện tại và không phá code đã hoạt động. Không thay đổi behavior chỉ để làm test xanh.

Kết quả mong muốn:

1. Những lỗi đã xác nhận trong Section 5 được sửa hoặc có blocker/fallback hợp lệ.
2. Test fixtures và assertions khớp contract thật; status PASS chỉ được ghi sau khi command thực sự chạy.
3. UI được kiểm tra trực tiếp bằng browser ở desktop/tablet/mobile, không chỉ đọc JSX/Tailwind.
4. Có live FE↔BE verification qua API thật trên BE do owner chạy sẵn.
5. Live Gemini/AI chỉ ghi PASS khi request thật qua FE → BE → provider thật đã được quan sát và owner cho phép môi trường đó.
6. Tài liệu FE cuối cùng phản ánh đúng evidence thực tế, không overclaim.

## 2. Phạm vi và ranh giới bắt buộc

### Được phép

- Đọc/sửa file **chỉ bên trong repository KBase-FE đang mở**.
- Chạy npm/Vite/Vitest/Playwright/script project-local đã có hoặc dependency project-local hợp lệ.
- Dùng browser riêng của Antigravity/agent hoặc Playwright browser để thao tác FE trực tiếp.
- Gọi BE **qua HTTP/API** tại target owner cung cấp.
- Tạo dữ liệu test qua UI/API nếu là môi trường test/dev được owner cho phép; cleanup chỉ đúng ID mà agent tự tạo.
- Cập nhật test, source FE, harness FE và tài liệu FE khi implementation thực sự cần.
- Nếu phát hiện contract mismatch live, ghi `docs/INTEGRATION_ISSUES.md`; không tự sửa BE.

### Tuyệt đối không được

- Không đọc, ghi, query, seed, truncate, reset hoặc migration **local database của máy** bằng SQL/CLI/tool DB.
- Không chạy `psql`, DB console, migration, schema tool, trực tiếp sửa database file/volume hoặc dùng DB để tạo fixture.
- Không đọc/sửa Redis, MinIO data/volume, Docker volume hoặc storage backend trực tiếp.
- Không start/stop/restart/kill BE, database, Redis, MinIO, worker, Docker stack hoặc service máy.
- Không sửa repository KBase-BE, harness BE, env BE, RAG plan hoặc tài liệu BE.
- Không dò tìm Gemini/SMTP/JWT/DB key; không đọc secret ngoài workspace.
- Không quét Desktop/Documents/Downloads/home/browser profile/SSH/credential store/repo khác.
- Không dùng browser profile cá nhân, saved password, cookie cá nhân hoặc session không phải fixture test owner cho phép.
- Không cài package global, sửa OS/IDE/global Git config, `docker prune`, `git clean -fd`, `reset --hard` hoặc xóa user changes.
- Không hạ strictness TypeScript/lint/test, không đổi contract cho khớp mock, không hardcode fake success/fake API state.
- Không dùng mock để tuyên bố live FE↔BE/Gemini PASS.

Nếu một test live cần dữ liệu mà chỉ có thể tạo bằng DB trực tiếp, đánh **BLOCKED** và báo input cần owner cung cấp; không vượt ranh giới.

## 3. Skill và công cụ bắt buộc

Agent phải đọc và áp dụng:

1. `AGENTS.md`, `GEMINI.md`, `ARCHITECTURE.md`, `docs/FE_STATUS.md`, `docs/PLANS.md`.
2. `.agents/skills/kbase-frontend/SKILL.md` — skill canonical cho FE.
3. Plan này.
4. `docs/product-specs/UI_INVENTORY.md`, `docs/design-docs/UI_DESIGN_SYSTEM.md`.
5. `docs/API_CONVENTIONS.md`, `docs/INTEGRATION.md`, `docs/TESTING.md`, `docs/SECURITY.md`, `docs/RELIABILITY.md`.
6. Contract snapshot trong `docs/references/backend/` và `.harness/source-doc-registry.json` khi cần xác minh field/path/enum.

Ngoài skill repo, agent phải sử dụng công cụ phù hợp đang có trong Antigravity:

- **Browser trực tiếp là bắt buộc** cho visual/layout/live-flow verification. Không thay thế bằng việc chỉ đọc code.
- Dùng Browser DevTools/network/console hoặc capability tương đương để kiểm tra request thật, status, route, console error và layout.
- Dùng Playwright cho regression/reproducible browser suites.
- Dùng accessibility tooling có sẵn (axe hoặc tương đương) cộng keyboard/manual inspection; automated scan không thay manual UX check.
- Nếu môi trường có skill/tool chuyên cho browser testing/accessibility/debugging thì dùng skill đó. Nếu không có, dùng browser/Playwright tích hợp sẵn; không cài tool global để bù.
- Screenshot/evidence chỉ chứa test data an toàn; không lưu token/cookie/private content.

## 4. Nguyên tắc sửa lỗi

Các giải pháp ở Section 5 là hướng ưu tiên, **không phải bắt buộc implementation y nguyên**.

Nếu sau khi đọc code/runtime agent chứng minh giải pháp đề xuất không khả thi hoặc tạo regression, agent được chọn giải pháp khác với điều kiện:

1. Vẫn giữ contract BE và product behavior đúng.
2. Không mở rộng scope sang BE/database/hạ tầng.
3. Không fake, bỏ test hoặc làm yếu security/accessibility.
4. Ghi ngắn gọn lý do đổi hướng trong checkpoint/evidence hoặc integration issue.
5. Có regression test cho bug vừa sửa khi có thể.
6. Chạy lại gate bị ảnh hưởng và xác minh bằng browser nếu thay đổi có tác động UI/runtime.

Không refactor diện rộng chỉ vì “đẹp hơn”. Ưu tiên root-cause fix nhỏ, rõ và test được.

## 5. Baseline issues cần xử lý

| ID | Mức | Vấn đề đã quan sát | Hướng xử lý ưu tiên | Fallback hợp lệ |
|---|---|---|---|---|
| REV-01 | P1 | `DocumentDetailPage` gọi `canModifyDocument` với `projectRole:null`, làm OWNER/MEMBER uploader có thể mất quyền edit/delete/retry | Lấy project role đúng từ project context/API rồi truyền đầy đủ permission context; thêm component/integration regression cho OWNER, own MEMBER, other MEMBER, ADMIN | Nếu route detail không thể dùng `useProject`, fetch/reuse project permission bằng query scoped; không hardcode role |
| REV-02 | P1 | Unit evidence không đáng tin: assistant test assert `message.status === GROUNDED`; mock/DTO contract drift (`number` vs `page`, endpoint account, refresh shape...) | Chỉnh fixtures/assertions theo pinned contract, type fixtures chặt, chạy lại toàn bộ unit; không sửa DTO đúng để hợp thức hóa mock sai | Tạo typed factory từ DTO interfaces hoặc contract fixtures dùng chung nếu giảm drift |
| REV-03 | P1 | `test:e2e:live` trỏ `tests/e2e/live` nhưng suite live chưa tồn tại; chưa có bằng chứng FE↔BE browser thật | Viết live smoke/journey suite an toàn và chạy trên BE owner đã mở; song song thao tác browser trực tiếp để quan sát network/UI | Nếu account/mail/provider fixture thiếu, implement suite phần độc lập và đánh đúng case BLOCKED; không mock thay live |
| REV-04 | P1 | Binary preview/download hiện `response.blob()` toàn file, trái large-file strategy; video/file lớn có nguy cơ memory cao | Thực hiện streaming/range approach đã thiết kế trong INTEGRATION hoặc giải pháp tương đương có memory bound; test 200/206/416/seek/cancel | Nếu streaming bridge chưa khả thi trong scope, giới hạn blob preview theo ngưỡng rõ, hiển thị fallback download/unsupported cho file lớn; không buffer âm thầm |
| REV-05 | P1 | `fetchBinary` tách khỏi refresh/session pipeline, có thể 401 khi access token hết hạn và không có epoch/timeout tương đương | Gom auth/refresh/session/error behavior dùng chung hoặc thêm binary transport với max-one refresh replay + epoch/abort | Wrapper riêng được phép nếu cùng invariants và có tests; không gắn token URL |
| REV-06 | P1 | Auth bootstrap/network failure bị đưa về `anonymous`; refresh condition rộng hơn spec | Phân biệt auth rejection với network/5xx → `temporarily-unavailable`; chỉ refresh/replay trên explicit access-token rejection codes; wrong current password không refresh | Nếu BE error code live khác pinned contract, ghi drift và xử lý danh sách code theo evidence, không “mọi 401 đều refresh” |
| REV-07 | P2 | Assistant chỉ lấy page message giới hạn, thiếu older-history paging/dedupe và lost-response reconciliation theo harness | Implement paging/infinite loading đúng order/id; timeout/503 create/send phải reconcile list/messages trước explicit retry | UI “Tải tin cũ hơn” thay infinite scroll được phép; reconciliation có thể manual-refresh rõ ràng nếu đảm bảo không auto resend |
| REV-08 | P2 | Overview hardcode “Trợ lý dự án — Sẵn sàng phản hồi”; member count fallback `?? 1` tạo state giả | Không tuyên bố AI availability khi không có capability endpoint; dùng neutral copy/action. Count loading/error/unknown không invent số | Có thể bỏ status card AI hoặc đổi thành capability description không trạng thái |
| REV-09 | P2 | `.env.example` khai `VITE_API_BASE_URL`/limits nhưng request path và batch max còn hardcode | Có một config module typed, dùng env public thật hoặc bỏ variable không dùng; XHR/fetch phải cùng base; default vẫn same-origin `/api/v1` | Nếu runtime design bắt buộc fixed same-origin, xóa/ghi rõ env misleading thay vì giả configurable |
| REV-10 | P2 | XHR upload bypass ApiClient: refresh/error mapping/session/reconciliation không nhất quán | Tạo authenticated upload transport chia sẻ token/error/session invariants; map ApiError đúng; không auto retry upload | XHR riêng vẫn được nếu có shared auth/error helper và tests tương đương |
| REV-11 | P2 | Responsive/accessibility evidence quá nông; fixed heights, text 10–11px, mobile drawer semantics có rủi ro | Browser inspect 320/360/390/768/1280/1440 + 200% zoom; sửa overflow/height/typography; mobile nav có backdrop/focus/Escape/aria | Có thể thay custom drawer bằng Radix primitive nếu sửa thủ công phức tạp; không rewrite toàn shell nếu không cần |
| REV-12 | P2 | Playwright deterministic chỉ smoke; responsive test chủ yếu assert h1 visible; axe claim chưa có execution rõ | Mở rộng journeys representative, no horizontal overflow, dialogs/keyboard/focus/axe; tạo screenshot evidence sanitized | Nếu visual regression snapshot dễ flaky, dùng targeted layout assertions + screenshot manual review, ghi rõ giới hạn |
| REV-13 | P2 | `npm run test:e2e` phụ thuộc preview/dist nhưng script/config chưa tự chứng minh clean-checkout reproducibility | Làm test command self-contained hoặc document prebuild bắt buộc và verify clean install/build/test order | Không cần gộp script nếu CI/local gate chạy explicit `build` trước, nhưng docs phải chính xác |
| REV-14 | P2 | Docs `FE_STATUS`/`QUALITY_SCORE` overclaim so với evidence và `ARCHITECTURE` còn “chưa triển khai” | Chỉ sau rerun gates mới cập nhật trạng thái; phân biệt deterministic/live; sửa contradiction tài liệu bị implementation làm lỗi thời | Nếu gate chưa chạy thì ghi NOT RUN/BLOCKED, không giữ PASS lịch sử như trạng thái hiện tại |
| REV-15 | P3 | Dependency policy nói stable nhưng `eslint-plugin-react-hooks` đang dùng RC | Kiểm tra stable compatible release trong lockfile/toolchain hiện tại; đổi chỉ khi không tạo regression và chạy lint/test | Nếu RC là dependency hợp lệ duy nhất trong environment, ghi exception/rationale; không nâng package hàng loạt |

Danh sách này là baseline tối thiểu. Agent phải tiếp tục code review và browser inspection; lỗi mới phải được sửa nếu nằm trong FE scope hoặc ghi rõ blocker/issue nếu ngoài scope.

## 6. Work packages

### RV0 — Preflight và establish truth

**Actions**

- Xác nhận root/remote/branch/dirty files. Không ghi qua symlink ra ngoài repo.
- Đọc docs/skill theo Section 3.
- Ghi baseline commit và giữ mọi user change.
- Kiểm tra Node/npm/browser tool availability.
- Chạy **trước khi sửa**: `verify:harness`, lint, typecheck, unit, build, deterministic E2E theo đúng prerequisites thực tế.
- Không tin trạng thái PASS trong docs nếu command hiện tại không tái hiện được.
- Kiểm tra BE target owner đã chạy chỉ bằng HTTP; không start/restart BE và không truy cập DB.

**Gate**

Có baseline rõ: command nào PASS/FAIL, failure cụ thể, browser/tool khả dụng, live target reachable hay blocker.

### RV1 — Contract/test truthfulness và config

**Actions**

- Sửa REV-02, REV-09, REV-13.
- Đối chiếu typed DTO/mock/assertion với pinned source.
- Không thêm field fake vào mock business object trừ khi field đó thực sự thuộc contract.
- Đảm bảo public API base/limit config có một source of truth.
- Chạy unit/typecheck/build liên quan sau sửa.

**Gate**

Contract fixtures không drift rõ ràng; unit test hiện tại thực sự PASS hoặc failure còn lại được giữ nguyên để sửa tiếp, không sửa test chỉ để bỏ assertion quan trọng.

### RV2 — Auth/API transport/upload/binary reliability

**Actions**

- Sửa REV-04, REV-05, REV-06, REV-10.
- Test explicit access-token expiry, concurrent refresh, refresh network failure, current-password invalid, logout/session epoch.
- Upload single/batch: auth, progress, server JSON errors, lost response và no auto retry.
- Binary: preview/download auth, token expiry, Range 200/206/416, cleanup, file-size behavior.

**Gate**

Transport behavior nhất quán, mutation không auto retry, lỗi không bị nuốt thành generic nếu BE trả safe error, large-file strategy trung thực và memory bounded theo giải pháp đã chọn.

### RV3 — Permission và AI behavior

**Actions**

- Sửa REV-01, REV-07, REV-08.
- Thêm regression UI/integration test permission cho document.
- Implement message paging/order/dedupe và reconciliation.
- Kiểm tra max5 conversation, NO_EVIDENCE, FAILED/PROCESSING, citations unavailable.
- Không hiển thị availability/quota/count không có nguồn API.

**Gate**

Role matrix FE khớp contract; history dài không mất dữ liệu; lost response không auto duplicate mutation; fake status/count bị loại.

### RV4 — UI/UX, layout và accessibility review bằng browser

**Actions**

Browser trực tiếp **bắt buộc**. Ít nhất mở và thao tác representative screens:

- Landing.
- Login/register/verify.
- Project list + project overview.
- Documents list + upload dialog + document detail.
- Organization.
- Members/invitations nếu fixture cho phép.
- Project Assistant.
- Guide.
- Profile/security.
- Admin screens nếu có ADMIN fixture.

Viewport/evidence tối thiểu: 320 reflow check, 360, 390, 768, 1280, 1440 và 200% browser zoom trên representative app/assistant/document pages.

Kiểm tra:

- horizontal page overflow;
- clipped text/button/dialog/menu;
- sidebar/mobile drawer/backdrop;
- fixed-height chat/guide/document preview;
- software-keyboard-sensitive composer ở viewport mobile nếu tool hỗ trợ;
- table local scroll;
- touch targets;
- metadata font size/contrast;
- focus visible/tab order/Escape/focus return;
- disabled/loading/error states;
- reduced-motion;
- console error/unhandled rejection;
- axe/equivalent automated scan cộng manual keyboard.

**Gate**

Không chỉ “element visible”. Mọi issue layout được sửa và xem lại trong browser. Screenshot/evidence sanitized, không chứa secret.

### RV5 — Live FE↔BE integration trên BE owner chạy sẵn

Agent **không được quản lý lifecycle BE**.

**Preconditions**

- BE target do owner cung cấp/đã chạy.
- Test account/mailbox/admin fixture nếu flow cần.
- Chỉ dùng test/dev data được phép.
- Không direct DB setup.

**Actions**

1. Chạy FE với proxy/base đúng target.
2. Dùng browser trực tiếp, xem Network tab/capability tương đương.
3. Xác nhận request thực sự đi FE → BE, không bị MSW/mock intercept.
4. Test core journey phù hợp fixture:
   - login/reload/refresh/logout;
   - project list/detail/create nếu được phép;
   - document list/upload/detail/download/preview;
   - permission behavior;
   - Guide;
   - Project Assistant khi project có indexed docs;
   - admin khi có admin fixture.
5. Với flow tạo dữ liệu, chỉ cleanup đúng resource IDs agent tạo qua UI/API.
6. Implement/chạy `tests/e2e/live` cho các journey có thể tái lập an toàn.
7. Nếu BE đang nối Real Gemini và owner cho phép, gửi số request AI tối thiểu cần thiết để xác nhận Project Assistant/Guide; ghi rõ **live Gemini** khác **live Core**.

**Gate**

Có evidence network/status/UI thật cho các flow chạy được. Thiếu credential/mail/indexed fixture/provider → ghi BLOCKED theo case, không chuyển sang mock.

### RV6 — Full regression, documentation và handoff

**Actions**

Chạy lại ít nhất:

```bash
npm run verify:harness
npm run lint
npm run typecheck
npm run test:unit -- --run
npm run build
npm run test:e2e
npm run test:e2e:live   # chỉ khi prerequisites live đầy đủ
```

Ngoài command trên, rerun targeted suites của bug vừa sửa.

Cập nhật khi có evidence:

- plan này: progress/results;
- `docs/FE_STATUS.md`;
- `docs/QUALITY_SCORE.md`;
- `docs/INTEGRATION_ISSUES.md` nếu có mismatch/blocker;
- `docs/TESTING.md`, `docs/DEVELOPMENT.md`, `ARCHITECTURE.md` hoặc tài liệu khác **chỉ nếu implementation thay đổi khiến nội dung cũ sai**;
- evidence sanitized trong `docs/evidence/` nếu cần.

Không sửa BE docs.

**Final handoff phải nêu**

- changed files;
- root cause và fix cho từng REV-ID;
- lỗi mới tìm thấy;
- commands + exact results;
- deterministic vs live Core vs live Gemini;
- browser pages/viewports đã inspect;
- blocker còn lại;
- `git status --short`;
- không commit/push nếu owner chưa cấp quyền mới.

## 7. Browser/live safeguards

- Browser phải dùng isolated/test context; không dùng personal Chrome profile.
- Không copy raw Authorization/Cookie/OTP/token vào docs/screenshot.
- DevTools evidence chỉ ghi method/path/status/requestId cần thiết, redacted payload nếu có private data.
- Không brute-force OTP, không tự đọc mailbox cá nhân.
- Không gửi invitation tới email thật ngoài test mailbox owner cho phép.
- Không disable/delete real user/project. Destructive admin flow chỉ trên fixture riêng.
- Nếu browser tool gặp limitation, agent được dùng Playwright trace/screenshot/network hooks thay thế nhưng vẫn phải có ít nhất một lượt browser visual inspection thực tế.

## 8. Progress log

| Package | Status | Evidence / blocker |
|---|---|---|
| Review plan preparation | COMPLETED | Baseline review trên `main@e32b2e7`; plan chỉ chuẩn bị tài liệu, chưa sửa implementation |
| RV0 | NOT STARTED | |
| RV1 | NOT STARTED | |
| RV2 | NOT STARTED | |
| RV3 | NOT STARTED | |
| RV4 | NOT STARTED | |
| RV5 | NOT STARTED | Owner sẽ chạy BE; runtime credentials/fixtures xác nhận trong phiên thực thi |
| RV6 | NOT STARTED | |

## 9. Definition of Done

- [ ] Các REV-01 → REV-15 được FIXED, VERIFIED, BLOCKED hoặc NOT APPLICABLE với lý do/evidence; không bỏ im lặng.
- [ ] Lỗi FE mới phát hiện trong review được xử lý theo cùng chuẩn.
- [ ] Permission document đúng cho OWNER/MEMBER uploader/other MEMBER/ADMIN.
- [ ] Auth refresh/unavailable/session behavior đúng và regression-tested.
- [ ] Upload/binary không bypass security/reliability invariants; large-file behavior trung thực.
- [ ] Assistant history/reconciliation và fake availability/count được sửa.
- [ ] Fixtures/assertions khớp contract pin; unit/build/E2E status phản ánh command thật.
- [ ] Browser inspect đủ representative pages, responsive/zoom/keyboard/accessibility.
- [ ] Live FE↔BE được chạy trên BE owner mở sẵn cho các prerequisites có sẵn; phần thiếu ghi BLOCKED chính xác.
- [ ] Real Gemini chỉ claim PASS khi thật sự quan sát request qua FE và BE/provider live.
- [ ] Không sửa/chạm DB, Redis, MinIO, Docker volume, BE code/service/env hoặc dữ liệu ngoài repo.
- [ ] Không có secret/test token trong repo/evidence.
- [ ] Tài liệu FE cuối cùng đồng bộ với implementation và evidence, không còn PASS overclaim.
- [ ] Codebase giữ architecture hiện tại; không refactor phá phạm vi chỉ để hoàn thành plan.
