# AGENTS.md — KBase FE

## Phạm vi và quyền

- Workspace duy nhất được ghi là repository `KBase-Knowledge-Base/KBase-FE` đang mở. Xác nhận `pwd`, `git rev-parse --show-toplevel`, `git remote -v` và `git status --short` trước khi sửa. Không ghi qua symlink/junction dẫn ra ngoài repo.
- Không tự commit, push, tạo PR, merge, deploy, amend, reset --hard, clean -fd, stash hoặc thay Git history/config toàn cục. Owner tự review và commit/push. Dừng trước thao tác vượt quyền.
- Không sửa/chạy/reset backend, database, Redis, MinIO, Docker stack, migration, worker hoặc harness BE. Không cập nhật `KBase-BE/docs/CURRENT_STATE.md` hay plan RAG. BE đang được phát triển song song.
- Không quét/đọc/sửa dữ liệu máy ngoài dự án: Desktop, Documents, Downloads, home, browser profile, SSH key, credential store, repo khác. Không dùng lệnh cleanup hệ thống, `killall`, `docker prune`, cài package global hoặc đổi cấu hình OS/IDE. Toolchain có sẵn được phép chạy; cache/output mới đặt trong repo khi cấu hình được. Nếu cần quyền ngoài repo, báo owner.
- Không đọc `.env` của BE hoặc tìm Gemini key. FE không giữ Gemini/JWT-signing/SMTP/DB/MinIO secrets. Chỉ `.env.example` chứa giá trị mẫu công khai.
- Chỉ dùng API trên môi trường và dữ liệu test owner chỉ định. Không tự tìm production hoặc reset dữ liệu để làm test. Không tự gửi lời mời/email tới người thật. Fixtures test phải riêng, có prefix dễ nhận biết.
- Không bỏ qua lỗi bằng hardcode, fake success, mock fallback ngầm, tắt TypeScript/lint/test hoặc sửa contract để hợp thức hóa UI.

## Đọc trước khi làm

1. [ARCHITECTURE.md](ARCHITECTURE.md), [FE_STATUS](docs/FE_STATUS.md), [PLANS](docs/PLANS.md).
2. [Plan FE v1](docs/exec-plans/active/KBase_FE_v1_Implementation_Plan.md) và [inventory UI](docs/product-specs/UI_INVENTORY.md).
3. [Skill FE](.agents/skills/kbase-frontend/SKILL.md), [FRONTEND](docs/FRONTEND.md), [design system](docs/design-docs/UI_DESIGN_SYSTEM.md).
4. [API conventions](docs/API_CONVENTIONS.md), [integration](docs/INTEGRATION.md), [coverage 57 API](docs/references/API_UI_COVERAGE.md). Khi cần field/enum, đọc snapshot và source excerpt được liên kết tại đó.
5. [DEVELOPMENT](docs/DEVELOPMENT.md), [TESTING](docs/TESTING.md), [SECURITY](docs/SECURITY.md), [RELIABILITY](docs/RELIABILITY.md), [DEPLOYMENT](docs/DEPLOYMENT.md).

## Cách thực thi

Owner đã cho phép triển khai toàn bộ UI trong một lượt bàn giao. Tiếp tục qua các work package trong plan, không dừng xin duyệt từng trang. Checkpoint là bằng chứng nội bộ, không phải milestone BE hoặc yêu cầu commit. Khi context đầy, ghi checkpoint FE rồi tiếp tục từ đó.

Source contract pinned trong `.harness/source-doc-registry.json`. Có source BE mới thì so diff hợp đồng; không tự đổi baseline theo HEAD di động. Nếu môi trường live lệch contract, ghi [integration issues](docs/INTEGRATION_ISSUES.md); tiếp tục phần không bị chặn. Không sửa BE để thông test FE.

## Definition of Done

- Đủ 22 mẫu màn hình và tất cả 57 API operation có vị trí sử dụng/verification.
- UI dùng API thật mặc định; mock chỉ trong test/demo được bật rõ ràng.
- Các gate trong plan thực sự chạy; phân biệt PASS / FAIL / BLOCKED / NOT RUN. MSW không chứng minh live BE hoặc Real Gemini RAG PASS.
- Có bằng chứng responsive, keyboard, permission, auth refresh, upload/preview, AI states; không lộ dữ liệu nhạy cảm trong screenshot/log.
- Cập nhật FE plan, FE_STATUS, QUALITY_SCORE, issue log và các tài liệu FE bị ảnh hưởng (DEVELOPMENT, evidence, contract theo quy tắc pin) để khớp triển khai. Không cập nhật tài liệu BE. Bàn giao file thay đổi, command, kết quả, phần chưa verify. Không commit/push.
