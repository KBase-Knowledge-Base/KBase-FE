# QUALITY_SCORE — FE

Không gán điểm số hoặc PASS khi chưa có evidence.

| Năng lực | Gate cần có | Hiện tại |
|---|---|---|
| Feature/API coverage | 22 template + 57 operation, mapping không bỏ sót | PLANNED |
| Contract correctness | Source snapshot, type mapping, live diff | NOT RUN |
| Auth/security | Refresh concurrency, role matrix, isolation, content rendering | NOT RUN |
| UI/UX/accessibility | Desktop/mobile, keyboard, contrast, axe, states | NOT RUN |
| Performance | Lazy chunks, bounded requests, loading feedback, production build | NOT RUN |
| Reliability | Retry discipline, lost response reconciliation, revoke behavior | NOT RUN |
| Live integration | Dedicated fixtures trên BE được owner chỉ định | NOT RUN |

Evidence phải chứa command, thời điểm, môi trường, test thật/mock, kết quả và limitation. Không lưu token/email người thật/nội dung private trong evidence.
