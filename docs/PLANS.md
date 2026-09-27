# PLANS — FE

## Plan hiện hành

Công việc tiếp theo dùng [KBase_FE_Review_Update_Plan](exec-plans/active/KBase_FE_Review_Update_Plan.md). Đây là một lượt **review → repair → deterministic verification → live FE↔BE browser verification** trên implementation v1 hiện tại. Plan liệt kê các issue baseline đã phát hiện, ranh giới workspace/database/BE, browser gate bắt buộc, fallback được phép và Definition of Done.

Implementation agent phải đọc plan review này sau `AGENTS.md` và `.agents/skills/kbase-frontend/SKILL.md`. Không suy ra rằng status PASS lịch sử là evidence hiện tại; RV0 phải chạy lại gate để establish truth.

## Plan implementation v1

[KBase_FE_v1_Implementation_Plan](exec-plans/active/KBase_FE_v1_Implementation_Plan.md) là plan xây dựng FE v1 ban đầu và được giữ tại đường dẫn cũ để bảo toàn lịch sử/handoff links. Không chạy lại WP0–WP7 từ đầu trừ khi plan review yêu cầu đọc source decision tương ứng.

Review/update được thực hiện trên code hiện tại, ưu tiên root-cause fix nhỏ và không phá architecture/harness. Nếu giải pháp đề xuất trong plan review không khả thi, agent được chọn giải pháp FE khác khi vẫn giữ contract, security, test rigor và scope boundary.

## Quy tắc state/evidence

Sau mỗi work package, ghi trạng thái thực tế và evidence. Khi context bị ngắt, ghi file đang sửa, command gần nhất, bước tiếp theo; tiếp tục cùng plan, không bắt đầu lại.

Chỉ đánh dấu COMPLETE khi acceptance tương ứng đã verify. Thiếu runtime/credential/fixture thì dùng IMPLEMENTED / BLOCKED / NOT RUN chính xác; deterministic/mock PASS không phải live BE hoặc live Gemini PASS.

State tracking cập nhật `docs/FE_STATUS.md`, `docs/QUALITY_SCORE.md`, `docs/INTEGRATION_ISSUES.md` và plan FE. Các tài liệu FE khác như DEVELOPMENT, TESTING, ARCHITECTURE, evidence và contract artifacts chỉ cập nhật khi implementation/evidence làm nội dung hiện tại không còn đúng. Không cập nhật tài liệu BE.
