# FRONTEND — conventions

Đọc [inventory](product-specs/UI_INVENTORY.md), [design system](design-docs/UI_DESIGN_SYSTEM.md) và [ARCHITECTURE](../ARCHITECTURE.md). Các quyết định sau áp dụng toàn hệ thống:

- TypeScript strict; tránh `any`, non-null assertion tùy tiện hoặc cast che contract mismatch. Zod validate form/input và boundary trọng yếu; type contract không tự suy đoán.
- Components render; feature hooks xử lý query/mutation; API module serialize DTO. Không gọi fetch rải rác trong event component.
- Lazy-load route modules, admin, document viewer và illustration nặng; giữ app shell ổn định. Suspense cho code loading, Query pending cho data loading; không trộn hai khái niệm.
- Dùng react-loading-skeleton cùng theme token. Có loading/error/empty/permission state cho mỗi trang. Mutation có label và disabled pending; không làm mất form khi error.
- Query/filter/sort/page ở URL, debounce q khoảng 300ms, reset page khi đổi filter, abort stale reads. Không filter/sort giả trên một page của server.
- Áp dụng role helper tập trung cho UI affordance; BE vẫn kiểm tra quyền. Fail closed khi permission data chưa tải. Mobile không làm lộ action bị ẩn trên desktop.
- Text hiển thị ưu tiên tiếng Việt, enum/API field giữ nguyên trong code. UI dates dùng timezone browser/Intl, API gửi ISO UTC. Không cài i18n nặng nếu chỉ một ngôn ngữ, nhưng tập trung copy để dịch sau này.
- File preview/markdown dùng safe renderer; citation từ backend structured sources. Không dangerouslySetInnerHTML cho nội dung user/model.
- Không fake activity, notifications, usage quota, analytics hoặc trang chưa có API. Link không có đích thì bỏ khỏi UI.
- Bằng chứng visual ở trạng thái data và empty/error, nhiều viewport; xem [TESTING](TESTING.md).
