# Prompt bàn giao Gemini / Antigravity

Copy phần dưới đây vào agent sau khi mở đúng KBase-FE workspace:

---

Bạn triển khai **toàn bộ KBase FE v1 trong một lượt giao việc**, dùng React + TypeScript strict + Tailwind CSS, theo white Neumorphism có accessibility. Đọc theo thứ tự:

1. `AGENTS.md`, `GEMINI.md`, `ARCHITECTURE.md`, `docs/FE_STATUS.md`.
2. `.agents/skills/kbase-frontend/SKILL.md` (đọc trực tiếp nếu IDE không tự load).
3. `docs/exec-plans/active/KBase_FE_v1_Implementation_Plan.md`.
4. `docs/product-specs/UI_INVENTORY.md`, `docs/design-docs/UI_DESIGN_SYSTEM.md`.
5. `docs/API_CONVENTIONS.md`, `docs/INTEGRATION.md`, `docs/references/API_UI_COVERAGE.md`, source snapshot theo registry khi cần field/enum.
6. `docs/DEVELOPMENT.md`, `docs/TESTING.md`, `docs/SECURITY.md`, `docs/RELIABILITY.md`, `docs/DEPLOYMENT.md`.

Repo ban đầu chỉ có harness, chưa có FE application. Baseline API BE pinned tại `636ea26469823bc475732d1e0f79f147556d1f63`; BE agent đang làm RAG song song. Chỉ ghi trong repo FE; không sửa/chạy/restart BE, không cập nhật harness BE, không truy cập dữ liệu cá nhân/credential/repo khác trên máy. Không commit, push, PR, deploy, sửa Git history hay global settings. Không bỏ qua rule bằng symlink hoặc script chạy ngoài root.

Hãy bootstrap rồi thực thi liên tục WP0–WP7 của plan: đủ22 mẫu màn hình, shared components và57 API operation. Không dừng sau landing/shell hoặc đợi prompt từng trang. Work package chỉ là checkpoint nội bộ. Khi cần context mới, ghi checkpoint vào plan và tiếp tục cùng scope.

UI phải dùng BE API thật mặc định, mock chỉ trong test/demo bật rõ. Tạo landing visual original SVG/CSS/React và ảnh nếu tool sẵn có; bảo đảm bố cục, keyboard, responsive, skeleton, lazy load và error states. Không tạo feature giả hoặc endpoint mới để “hoàn thành” UI.

Preflight xác nhận endpoint BE/test accounts/fixture nếu owner đã cung cấp trong phiên. Nếu thiếu, hỏi đúng input một lần và tiếp tục implementation + deterministic tests; không tự tìm secrets hoặc mở production. Mismatch BE ghi `docs/INTEGRATION_ISSUES.md`, không sửa BE. Không gọi real Gemini/email thật trong automated default suite.

Cuối lượt chạy lint/typecheck/unit/build/browser và live integration phần được authorize. Xem screenshot thực tế, sửa lỗi tới khi gate qua. Báo rõ PASS/FAIL/BLOCKED/NOT RUN; mock pass không phải live pass. Cập nhật FE plan/FE_STATUS/QUALITY_SCORE/issues và các tài liệu FE bị ảnh hưởng, gồm DEVELOPMENT và evidence; không cập nhật BE docs. Bàn giao changed files, commands + kết quả, evidence, cách chạy, blocker còn lại; giữ toàn bộ thay đổi uncommitted cho owner review.

---
