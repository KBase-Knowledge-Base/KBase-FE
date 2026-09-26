---
trigger: always_on
description: "KBase FE workspace boundary, no commit or push, backend isolation, and safe verification."
---

Đọc `AGENTS.md` tại repo root và áp dụng cho mọi thao tác. Chỉ ghi trong repo KBase-FE, không qua symlink ra ngoài. Không commit/push/PR/deploy hoặc sửa Git history. Không đụng BE, harness BE, service BE, dữ liệu máy cá nhân hoặc credential ngoài dự án. Không chạy cleanup/reset toàn máy. Chỉ test live trên fixture và endpoint được owner chỉ định. Không fake API success hay âm thầm chuyển sang mock. Dùng `.agents/skills/kbase-frontend/SKILL.md` và plan FE v1 khi triển khai UI. Báo blocker chính xác, tiếp tục phần độc lập.
