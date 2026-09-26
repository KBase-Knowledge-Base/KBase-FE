# RELIABILITY — FE

| Tình huống | Hành vi bắt buộc |
|---|---|
| Loading chậm | Skeleton geometry đúng, aria status; pending action visible |
| Background refetch | Giữ data cùng scope, indicator nhỏ, không flash cả màn hình |
| Read network failure | Retry bounded, inline lỗi, manual retry; không fake empty list |
| Mutation timeout/lost response | Reconcile bằng GET; không automatic replay |
| 401 hết hạn | Single-flight refresh, tối đa1 replay khi auth rejection rõ ràng |
| 403/revoke | Clear scope/cancel, không lộ cached private data |
| AI unavailable | AI error localized, Core còn dùng được |
| Index pending lâu | Bounded poll rồi manual refresh, không tự đánh FAILED |
| Chat PROCESSING sau server crash | Không infinite spinner; hướng dẫn refresh và destructive workaround có confirm |
| Chunk-load/build version lỗi | Route error boundary, reload explicit; giữ thông tin chưa lưu nếu an toàn |
| Offline | Banner và disable mutation cần network; không tự queue replay sau online |
| Multi-tab/session change | Clear old identity cache, bỏ response cũ, không cross-tab token broadcast |

Theo dõi requestId cho lỗi server, không payload nhạy cảm. UI elapsed-time có thể hiển thị nhưng không giả progress % cho AI. Không success toast trước response. Error boundary phải có đường quay lại project list/landing và reload.
