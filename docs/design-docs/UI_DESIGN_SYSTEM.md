# UI Design System — White Neumorphism

## Ý tưởng

KBase biến tài liệu rời rạc thành không gian kiến thức có tổ chức và câu trả lời có dẫn nguồn. Hình ảnh gợi giấy, folder, thẻ nội dung và mạng kết nối; cảm giác sáng, yên tĩnh, rõ ràng. White/near-white là nền chính, đen dùng cho typography và CTA, teal cho selected/focus/link. Tránh biến UI nghiệp vụ thành dashboard trang trí.

## Tokens mục tiêu

| Token | Giá trị khởi đầu | Dùng cho |
|---|---|---|
| canvas | `#F4F6F8` | Nền app hơi xám để nhìn được bóng trắng |
| surface / elevated | `#F4F6F8` / `#FFFFFF` | Soft surface / table, dialog, input content |
| ink / muted | `#171A1F` / `#56616F` | Nội dung chính/phụ, vẫn phải đo contrast |
| border / control border | `#D8DEE6` / `#7C8796` | Border trang trí / biên input cần nhận biết |
| accent | `#0F766E` | Link, focus, selected; không dùng teal nhạt cho chữ |
| success / warning / danger | `#166534` / `#92400E` / `#B42318` | Icon + text status, nền tint nhạt |
| radius | 10 input, 14 button, 20 card, 24 hero (px) | Trật tự nhất quán |
| spacing | 4, 8, 12, 16, 24, 32, 48, 64, 96 (px) | Grid và nhịp thở |

Các màu là seed của FE design, không phải chứng nhận accessibility. Đo mọi cặp foreground/background trong trạng thái thực tế trước pass. Surface nổi: `8px 8px 20px #dce1e6, -8px -8px 20px #ffffff`. Inset nhẹ: `inset 3px 3px 7px #dce1e6, inset -3px -3px 7px #ffffff`. Bóng chỉ trang trí; text, icon, outline và selected state phải đủ rõ khi bỏ shadow.

## Quy tắc component

- Dùng neumorphism cho shell card, landing illustration, một số control lớn. Table, input, menu và message body dùng mặt phẳng rõ, border đủ tương phản. Không nested shadow nhiều tầng.
- Primary CTA đen với chữ trắng; secondary nền sáng + outline; destructive đỏ rõ. Mỗi khu vực có một primary action. Disabled không chỉ đổi shadow; có disabled semantics và lý do khi cần.
- Focus-visible outline 2–3px, offset 3px, màu tương phản; không cắt bởi overflow. Không dựa chỉ vào màu để truyền status hoặc selection.
- Body 16px, line height 1.5–1.65; metadata 13–14px không quá nhạt. Heading dùng scale vừa phải; font system hoặc một family self-host hỗ trợ tiếng Việt, tối đa 2 weight chính.
- Table sticky header khi cần, row target lớn; mobile chuyển layout hoặc scroll trong vùng table có nhãn, không tràn cả trang. Không giấu field quan trọng mà không có detail.
- Skeleton khớp line/card/table geometry, `aria-hidden`, vùng content có `aria-busy` và status text. Không skeleton mãi khi có lỗi. Refresh giữ data và dùng indicator nhỏ; tránh flash skeleton mọi lần focus tab.
- Motion 120–220ms opacity/transform; disabled khi `prefers-reduced-motion`. Không parallax bắt buộc, autoplay video/audio, bounce chat hoặc background chuyển động liên tục gây mất tập trung.

## Shell và responsive

- Public shell: wordmark, features anchor, login, register; footer tối giản với link hoạt động. Không fake legal links, social proof, pricing hoặc logo khách hàng.
- Auth shell: form max-width khoảng 420px, minh họa gọn, password manager/autocomplete-friendly.
- App shell: sidebar khoảng 248px desktop, topbar breadcrumb/project context, content max-width linh hoạt. Project subnav phân biệt Documents, Members, Organization, Assistant, Settings theo quyền.
- Assistant: conversation rail ~260px, main message column max-width ~800px, citation drawer. Mobile rail/citation thành drawer, composer không che message/focus khi keyboard mở.
- Kiểm tra viewport 360, 390, 768, 1280, 1440px và zoom 200%. Reflow đến 320 CSS px với ngoại lệ nội dung table cần hai chiều được chứa riêng. Dùng 44px làm mục tiêu thiết kế touch control; minimum WCAG 24px có ngoại lệ không thay thế mục tiêu này.

## Landing page bắt buộc

1. Hero: headline gợi “Tri thức của nhóm, trong một nơi dễ tìm.”; subcopy mô tả project, tài liệu và AI có nguồn. CTA “Tạo tài khoản” và “Đăng nhập”.
2. Hero visual original: nhiều thẻ tài liệu đi vào một knowledge hub, thẻ câu trả lời nhỏ kèm source; đây là minh họa được gắn nhãn, không giả số liệu live.
3. Problem strip: tài liệu phân tán, khó tìm lại, khó biết câu trả lời dựa vào đâu.
4. Ba feature blocks: tổ chức theo project/folder/tag; chia sẻ bằng lời mời và quyền; hỏi tài liệu với citation.
5. “Tải lên → sắp xếp → hỏi có nguồn”: SVG/CSS animation hoặc React microinteraction khi hover/focus, có bản static reduced-motion.
6. CTA cuối và footer ngắn. Không claim web search, OCR, realtime shared chat hoặc khả năng không có ở baseline.

Agent tạo ít nhất một hero visual original và bộ SVG/CSS decorative assets thống nhất. Khi có công cụ tạo ảnh, tạo raster theo palette; không phụ thuộc ảnh remote hotlink hoặc nội dung private. Nếu thiếu công cụ ảnh, tự tạo SVG/React illustration và gradient texture chất lượng, ghi rõ phương thức; không chặn toàn bộ UI. SVG phải là mã nội bộ sạch, không script/external href. Raster xuất WebP/AVIF, kích thước responsive; hero không lazy-load nếu là LCP, below-fold images lazy với width/height/alt đúng.

## UX/accessibility gate

Text thường contrast >=4.5:1, text lớn >=3:1; thông tin biên control/icon cần thiết >=3:1. Visible focus, label thật, lỗi field gắn aria-describedby, live region chỉ thông báo ngắn. Tab order tự nhiên; dialog trả focus; skip link; landmark/header hierarchy; OTP paste và password manager không bị chặn. Tooltip không thay thế label. Trạng thái disabled và lỗi không chỉ dựa vào shadow.

Đây là thiết kế mục tiêu dựa trên [nghiên cứu](../references/RESEARCH.md); test automated accessibility cộng kiểm tra keyboard/contrast thủ công, không tuyên bố đạt WCAG chỉ từ axe.
