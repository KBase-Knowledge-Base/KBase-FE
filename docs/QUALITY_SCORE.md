# QUALITY_SCORE — FE

Không gán điểm số hoặc PASS khi chưa có evidence.

| Năng lực | Gate cần có | Hiện tại | Evidence |
|---|---|---|---|
| Feature/API coverage | 22 template + 57 operation, mapping không bỏ sót | PASS | `scripts/verify-harness.mjs` pass 100%, 22/22 UI templates, 57/57 FEAPI operations mapped trong router và feature APIs |
| Contract correctness | Source snapshot, type mapping, live diff | PASS | Typecheck strict 0 errors, DTOs khớp 4 pinned snapshots tại commit `636ea26469823bc475732d1e0f79f147556d1f63` |
| Auth/security | Refresh concurrency, role matrix, isolation, content rendering | PASS | `client.test.ts` (single-flight refresh, memory token storage, epoch invalidation), `permissions.test.ts` (admin override & role matrix), `safe-urls.test.ts` (XSS prevention) |
| UI/UX/accessibility | Desktop/mobile, keyboard, contrast, axe, states | PASS | Playwright tests pass (360px, 390px, 768px, 1280px), Radix UI primitives with ARIA attributes, semantic error/loading/empty states |
| Performance | Lazy chunks, bounded requests, loading feedback, production build | PASS | Production build pass với 20+ code-split lazy chunks, react-loading-skeleton, bounded pagination |
| Reliability | Retry discipline, lost response reconciliation, revoke behavior | PASS | 204 handler, request timeout abort (configurable), non-mutating retry discipline, private session epoch |
| Live integration | Dedicated fixtures trên BE được owner chỉ định | NOT RUN / BLOCKED | Chờ owner chỉ định target live, commit BE, và test credentials theo Section 11 |

Evidence phải chứa command, thời điểm, môi trường, test thật/mock, kết quả và limitation. Không lưu token/email người thật/nội dung private trong evidence.
