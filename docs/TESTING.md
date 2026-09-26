# TESTING — FE gates

## Phân tầng bằng chứng

1. Static/build: lint, TypeScript, production build, dependency lock.
2. Unit/component/network: API serialization, auth concurrency, permission UI, states, safe rendering; MSW deterministic.
3. Browser deterministic: toàn bộ route và mutation journeys, responsive, keyboard, axe; không gửi email/provider thật.
4. Live BE integration: fixture environment owner chỉ định, chạy riêng; contract/current behavior xác nhận thật.
5. Live Gemini từ FE: chỉ khi owner cho phép và BE RAG phase sẵn sàng; không đồng nhất với level2/3/4 deterministic.

Test chỉ mirror markup/implementation không thay thế behavior. Không giảm gate để xanh. Những test không chạy phải ghi NOT RUN/BLOCKED.

## Regression phải có

| Suite | Case cần chứng minh |
|---|---|
| Auth | Register→verify→login; resend cooldown/expired OTP; public endpoints không stale Bearer; nhiều request401 chỉ1refresh; refresh fail không loop; wrong currentPassword401 không refresh; logout/account switch bỏ late responses |
| Invitation | Token qua auth roundtrip không lộ URL/log sau capture; không POST on mount; accept đúng email, mismatch/expired/cancelled, auth returnTo chặn external redirect |
| Permission | USER/OWNER/MEMBER/ADMIN; own/other uploader; nonmember; null currentUserRole admin; owner cannot leave/remove; private chat admin không override; revoke clears content |
| Projects/organization | Search/sort/page server-side; create/edit/delete; folder rename/move/root/null/cycle/nonempty; category in-use; create tag MEMBER vs rename/delete OWNER/ADMIN |
| Documents | Single multipart file + JSON Blob; repeated files batch + common metadata; limits/MIME errors; progress vs success; lost upload response không auto-repeat; PATCH null semantics; authenticated preview/download; 206/416 Range, seek, blob cleanup và large file memory strategy |
| Chat | First question một lần; max5; history paging đúng thứ tự/id; PROCESSING conflict; GROUNDED structured citations; NO_EVIDENCE success; FAILED safe UI; lost create/send response reconcile; 429/503; deleted source; malicious Markdown không thực thi |
| Guide | Auth required; context max8, item4000, request8000; không projectId; clear/reload/logout không persisted history; guide sources không document URLs |
| Admin | List/filter/detail/status/delete dependency errors; frontend 403 handling; no fake role mutation |
| Accessibility | Form labels/errors; password manager/OTP paste; full keyboard/dialog restore; focus not obscured; contrast actual tokens; reduced motion; no horizontal page overflow |

## Browser evidence

Visit cả22 template, cả2 route variant Assistant. Chụp và xem screenshot representative ở360/390,768,1280/1440; check320px reflow và200%zoom. Landing hero, auth, document table/detail, assistant, organization và admin phải có evidence. Không chỉ chụp landing rồi claim toàn app đẹp.

Mỗi API operation trong coverage map phải gắn test ID hoặc manual evidence. Refresh/logout là shared infrastructure nhưng vẫn phải test; API list đầy đủ không có nghĩa mọi operation đã được verify.

Kiểm tra không có mock import/runtime activation trong production build khi VITE_ENABLE_MOCKS=false. Production source không có sample users/projects/messages fallback. Marketing illustration data phải gắn nhãn minh họa và không reuse làm app state.

## Performance target (FE acceptance, không phải guarantee thị trường)

- Route/admin/viewer chunks tách; không ship PDF renderer hoặc admin table code trong landing initial chunk.
- Skeleton không tạo layout shift lớn; images có dimensions; hero LCP eager, below-fold lazy.
- Kiểm tra Lighthouse production mobile profile khi chạy được: mục tiêu performance>=85, accessibility>=95; ghi máy/network/mode thực tế, không “đạt” bằng bỏ UI. CLS mục tiêu<=0.1. Lighthouse score không thay manual accessibility.
- Không N+1 document details trên list, không unbounded poll, không tải entire history trước first render. Bundle analysis ghi asset lớn và rationale; không cài chart/WebGL library chỉ để trang trí.

## Live suite safeguards

Target URL, test accounts USER/ADMIN và project fixture do owner chỉ định. Lời mời chỉ email test owner cung cấp. Suite chỉ delete IDs do suite tạo; không cleanup theo fuzzy search toàn bộ project. Không gọi Gemini lặp trong route crawl. Ghi provider mode đúng thực tế; nếu thiếu account/email/provider thì ghi blocker và vẫn hoàn tất gate không phụ thuộc.

Evidence đặt `docs/evidence/` cho summary sanitized; raw screenshots/log chứa dữ liệu test chỉ giữ trong ignored test-results nếu không cần commit. Không đưa real access/refresh token vào HAR, screenshot hoặc report.
