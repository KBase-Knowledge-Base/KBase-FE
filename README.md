# KBase Frontend

Frontend React + TypeScript + Tailwind CSS cho KBase: tổ chức tài liệu theo project, chia sẻ quyền truy cập và hỏi AI có nguồn dẫn.

## Trạng thái bàn giao

Repository ban đầu trống. Bộ này là **harness + contract + plan + skill để triển khai**, chưa có application source, dependency lockfile hoặc kết quả UI test. Baseline BE được đọc tại `636ea26469823bc475732d1e0f79f147556d1f63` (`feat-AI`, Review adapter v3). Không thay đổi BE.

## Bắt đầu với Gemini trong Antigravity

Mở đúng repo FE làm workspace. Đọc [AGENTS](AGENTS.md), sau đó gửi nguyên [prompt bàn giao](docs/HANDOFF_PROMPT.md). Một skill canonical nằm ở `.agents/skills/kbase-frontend/SKILL.md`; `GEMINI.md` là entry point dự phòng khi IDE chưa tự phát hiện skill.

## Tài liệu chính

- [Plan triển khai toàn hệ thống](docs/exec-plans/active/KBase_FE_v1_Implementation_Plan.md)
- [22 mẫu màn hình](docs/product-specs/UI_INVENTORY.md)
- [57 API operation → UI](docs/references/API_UI_COVERAGE.md)
- [Kiến trúc](ARCHITECTURE.md), [design system](docs/design-docs/UI_DESIGN_SYSTEM.md), [integration](docs/INTEGRATION.md)
- [Cách chạy dự kiến](docs/DEVELOPMENT.md), [verification](docs/TESTING.md), [trạng thái riêng FE](docs/FE_STATUS.md)
- [Nguồn và lý do chọn UX/stack](docs/references/RESEARCH.md)

Các command npm chỉ trở thành khả dụng sau bootstrap theo plan. Owner tự review và commit/push. Không có yêu cầu triển khai từng trang qua nhiều prompt.
