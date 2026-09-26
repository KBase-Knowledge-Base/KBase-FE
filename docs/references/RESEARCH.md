# Research notes — sources and decisions

Reviewed2026-09-27. These are design/implementation references, not backend contract authority. Package version numbers are deliberately resolved at bootstrap and recorded in the lockfile.

| Source | Relevant finding | KBase decision |
|---|---|---|
| [W3C WCAG2.2](https://www.w3.org/TR/WCAG22/) | Text/non-text contrast, keyboard focus, reflow, target sizing and accessible authentication have explicit criteria | Use AA target plus manual checks;44px touch target is our stricter design target, not a claim every WCAG AA target must be44px |
| [NN/g — weak signifiers](https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/) | Hard-to-recognize interactive elements increase uncertainty | Preserve borders, labels and visible actions while using soft shadows decoratively |
| [NN/g — skeleton screens](https://www.nngroup.com/articles/skeleton-screens/) | Skeleton placeholders communicate the structure of loading content | Shape skeletons to actual content and keep error states distinct; no infinite shimmer |
| [IxDF — Neumorphism](https://ixdf.org/literature/topics/neumorphism) | Soft embossed surfaces have contrast/usability tradeoffs | Use style selectively on shell/cards/illustrations, measure actual controls |
| [UX StackExchange discussion](https://ux.stackexchange.com/questions/155211/need-help-with-neumorphism-usability) | Community discussion highlights low-vision concerns | Inspiration/critique only; W3C remains the normative accessibility source |
| [React lazy](https://react.dev/reference/react/lazy) | Lazy component code can suspend until loaded | Use route/viewer splitting and appropriate fallback; distinguish query-loading states |
| [React Router route objects](https://reactrouter.com/start/data/route-object) | Data routers provide route modules and error boundaries | Nested app layouts and route-specific lazy/error boundaries |
| [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite) | Official Vite plugin integration | Use the installation instructions for the selected stable major, avoid mixing old config conventions |
| [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) | Handles remote/server state and cache lifecycle | Use query keys/invalidation; override retry defaults for KBase mutation/auth rules |
| [Radix accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility) | Primitives support interaction and accessibility patterns | Build our visual theme on primitives; labels/content/final testing remain FE responsibility |
| [React Hook Form](https://react-hook-form.com/) and [Zod](https://zod.dev/) | Form state and schema validation tools | Validate forms and map stable server field errors; server remains authoritative |
| [react-loading-skeleton](https://github.com/dvtng/react-loading-skeleton) | Component-oriented skeletons adapt to surrounding style | Use shared SkeletonTheme and layout-specific pending states |
| [Playwright](https://playwright.dev/docs/intro) | Browser automation and assertions | Deterministic browser suite plus a separately gated live suite |
| [Antigravity rules](https://antigravity.google/docs/rules/) | Directory AGENTS/GEMINI entry files and modular rules with explicit triggers | Root AGENTS/GEMINI plus a short always_on rule; no global machine configuration |
| [Antigravity skills](https://antigravity.google/docs/skills/) | SKILL.md directory format; `.agents/skills` with legacy `.agent/skills` compatibility | One canonical workspace skill with root-relative docs; explicit path in handoff as fallback |

Research informs FE decisions; it does not guarantee a library combination is installed/tested or that UI meets accessibility criteria before verification.

## Harness adaptation from BE

| BE pattern | FE adaptation |
|---|---|
| AGENTS routing + ARCHITECTURE | Keep short entry routing, replace Spring/domain/DB rules with FE boundaries |
| docs/PLANS + active plan | One full FE delivery plan with resumable work packages |
| docs/CURRENT_STATE | Use FE_STATUS only; never update BE current state |
| FRONTEND / API_CONVENTIONS / INTEGRATION | Expand into executable FE rules and exact contract consumption |
| QUALITY_SCORE / TESTING / SECURITY / RELIABILITY / DEPLOYMENT | Keep evidence/quality discipline, tailor to browser/auth/API/data scope |
| generated API Markdown + source registry | Vendor pinned API snapshot + source excerpts + hashes; no claim auto-generated OpenAPI |
| BACKEND / DATABASE / migrations / completed M0–M11 plans | Do not carry into FE execution harness; reference only relevant contract behavior |
| Tool-specific instructions | Add Gemini/Antigravity workspace skill and boundary rule |
