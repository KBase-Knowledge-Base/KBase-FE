# PLANS — FE

Một plan canonical: [KBase_FE_v1_Implementation_Plan](exec-plans/active/KBase_FE_v1_Implementation_Plan.md). WP0–WP7 là work package nội bộ cho một lượt thực thi toàn bộ UI, không phải các milestone BE và không cần prompt tiếp theo giữa các trang.

Plan gồm scope, dependencies, gates, risks, checkpoint và kết quả. Sau mỗi work package, ghi trạng thái thực tế và evidence. Khi context bị ngắt, ghi file đang sửa, command gần nhất, bước tiếp theo; tiếp tục cùng plan, không bắt đầu lại.

Giữ plan tại đường dẫn canonical trong suốt phiên. Khi kết thúc, đổi status trong plan; không move file làm hỏng handoff links. Chỉ đánh dấu COMPLETE khi tất cả acceptance và live verification cần thiết PASS; thiếu runtime thì IMPLEMENTED — LIVE VERIFICATION BLOCKED, không PASS giả.

State tracking chỉ cập nhật `docs/FE_STATUS.md`, `docs/QUALITY_SCORE.md`, `docs/INTEGRATION_ISSUES.md` và plan FE; các tài liệu FE khác như DEVELOPMENT, evidence và contract đã chấp thuận được cập nhật khi implementation ảnh hưởng. Không cập nhật tài liệu BE. Các báo cáo BE trong snapshot là bằng chứng lịch sử, không phải lệnh tiếp tục M0–M11.
