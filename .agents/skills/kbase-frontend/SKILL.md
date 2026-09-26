---
name: kbase-frontend
description: "Build, integrate, test, and refine the complete KBase React TypeScript Tailwind frontend in Gemini/Antigravity. Use for KBase FE implementation, white Neumorphism UI, landing assets, API-connected screens, loading states, accessibility, or frontend review. Follow the repository FE plan and pinned backend contract."
---

# KBase Frontend Delivery

## Start with the repository contract

Resolve the project root from this skill: `../../../`. Read root `AGENTS.md` and `GEMINI.md`, then:

1. `docs/exec-plans/active/KBase_FE_v1_Implementation_Plan.md` — one complete delivery, WP0–WP7.
2. `docs/product-specs/UI_INVENTORY.md` —22 templates,23 route patterns.
3. `docs/references/API_UI_COVERAGE.md` and `.harness/source-doc-registry.json` —57 operations, pinned source.
4. `docs/design-docs/UI_DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `docs/INTEGRATION.md`.
5. `docs/DEVELOPMENT.md` and `docs/TESTING.md` before executing gates.

Read exact DTO/controller excerpts only for the feature at hand. Search headings/paths in the bundled source. Treat missing context as a reason to read the relevant source, never invent a field or behavior.

## Respect workspace and authority

Confirm root, remote, and dirty files. Write only inside KBase-FE. Preserve user changes. Do not commit, push, create PRs, deploy, alter history, scan personal data, read unrelated credentials, modify global settings, or escape scope via symlinks. Do not start, stop, reset, edit, or migrate BE services/data/harness. Report integration mismatches in FE's issue log and continue independent FE work.

Use owner-provided test endpoints/accounts only. Never call real Gemini or send real email from default automated tests. Never add provider credentials to browser code. Do not claim mock tests prove live BE/RAG success.

## Deliver the whole product

Execute the plan continuously. Do not finish after a landing page, shell, or a subset of screens. Use checkpoints for resumability, not as requests for the next page prompt. Cover public/auth/invitation, projects/organization/members/documents, private Assistant, authenticated Guide, account and admin flows.

Build shared primitives first; compose complete routes with real feature adapters. Keep API default live. Restrict MSW/fake responses to explicitly enabled tests/demo. Never show synthetic users, documents, metrics or AI answers as live product data.

## Apply White Neumorphism consistently

Use near-white canvas `#F4F6F8`, white elevated surfaces, dark ink `#171A1F`, muted ink `#56616F`, restrained teal `#0F766E` and semantic green/amber/red. Use black/white primary CTA. Define these as tokens, not repeated one-off values.

Use soft paired shadows on cards, shell elements and illustrations; use clear surfaces and borders for forms, tables and messages. Keep shadow depth decorative: controls must remain recognizable without it. Avoid nested shadow stacks and low-contrast text. Use consistent 4px spacing rhythm,14–24px component radii,16px readable body text and a font with Vietnamese glyph support.

Make focus-visible clear, preserve keyboard navigation, use labels and status text, support200%zoom/reflow, and target44px touch controls. Validate text contrast4.5:1, large text3:1, essential non-text boundaries3:1. Respect reduced-motion; do not use color/shadow as the only state indicator. Verify the actual color pairs, not just the palette.

## Create the landing artwork

Tell the KBase story: scattered files → organized project knowledge → answers with sources. Build hero, problem strip, three feature blocks, three-step explanation, final CTA and minimal working footer.

Create an original document/knowledge-hub hero visual with local SVG/CSS/React assets. Add small purposeful interaction accessible by hover and focus, with static reduced-motion fallback. If image generation tools exist, create a complementary optimized raster asset using the same palette; otherwise deliver a polished original vector illustration and record the method. Do not leave broken image placeholders or depend on remote hotlinks.

Use marketing examples only inside clearly labeled illustrations. Do not invent customer logos, statistics, testimonials or unsupported features. Keep hero LCP eager; lazy-load below-fold assets, declare dimensions and meaningful/decorative alt appropriately. Avoid WebGL or heavy animation packages unless the benefit is concrete.

## Build resilient React UI

Use React, strict TypeScript, Vite and Tailwind with the chosen stable compatible versions. Use React Router lazy routes, TanStack Query for server state, React Hook Form/Zod for forms, Radix primitives for interaction semantics, and react-loading-skeleton for shaped pending UI. Keep code-loading Suspense distinct from data-fetching state.

Keep URL search/filter/page/tab state shareable. Debounce search and cancel superseded reads. Use domain API modules, typed DTOs and centralized errors. Keep local UI state local; do not duplicate server collections in a global store. Lazy-load admin/viewer code; avoid N+1 detail fetches and unbounded history/polling.

Provide loading, data, initial empty, no-results, validation, network error,403/404, offline and mutation-pending states. Keep the user's input on recoverable failure. Announce errors inline and focus the relevant field; do not rely solely on toast. Do not show success before server confirmation.

## Preserve the exact KBase API behavior

- Use access token memory + HttpOnly refresh cookie. Implement refresh single-flight, max-one replay after explicit auth rejection, and session-epoch protection against late responses. Never store access tokens in localStorage or put them in URLs.
- Use `currentUserRole` for project UI, including nullable ADMIN override. Enforce creator-private chat UI even for ADMIN. Clear scoped cache and preview content after revoke/logout.
- Treat204 as no body, arrays differently from PageResponse, and binary/errors correctly. Use exact query filters/sort whitelist. Do not cast document summary into detail.
- Register does not log in. OTP verifies email only. Accept invitation needs auth and explicit user action; no GET token-preview API and no forgot-password API.
- Use multipart file/files plus optional JSON metadata Blob. Batch is one batch request with common metadata. Distinguish bytes-uploaded from persistence/index completion. Never automatically repeat uploads after a lost response.
- Respect distinct null semantics: folder parent null moves to root; document folder/category null currently keeps old values. Do not implement unsupported clear by pretending the request succeeded.
- Fetch protected previews/downloads with authenticated transport. For large media use the tested streaming approach in INTEGRATION; never use token query strings, external document viewers or public storage URLs. Clean blob URLs and worker state.
- Create a conversation only on first question `{message}`. Limit5 per user/project. Read messages as paged `{message,sources}` records; reconcile503/timeouts before another send. Do not infer exactly-once or cancellation from browser abort.
- Render GROUNDED citations from structured sources; handle UNAVAILABLE/documentId null. Treat NO_EVIDENCE as success. Show PROCESSING/FAILED honestly, without fake typewriter streaming or invented retry/cancel APIs.
- Keep Guide authenticated, stateless and memory-only; context<=8 USER/ASSISTANT items, <=4000 chars/item, question<=8000. Never include projectId or use Guide as a public landing chatbot.
- Poll index status only for visible/relevant items, stop at terminal states and on logout/hidden/offline, respect retryAllowed. Do not show invented progress percentages or quota counters.

## Verify and repair

Run the documented scripts after bootstrap. Inspect real browser screenshots for landing, auth, list/detail, Assistant, organization and admin at desktop/tablet/mobile sizes. Check keyboard dialogs, focus return, reduced-motion, contrast, form errors and pagination. Run behavioral tests for refresh races, permissions, multipart, binary Range, lost-response reconciliation and safe Markdown.

Maintain evidence mapping for all22 templates and57 operations. Distinguish deterministic UI, live Core, live deterministic AI and live Gemini evidence. If runtime is unavailable, finish independent implementation/tests and report exactly which live gates are blocked. Do not weaken tests or silently change API contracts to get a green result.

Update FE plan, FE_STATUS, QUALITY_SCORE, integration issues and affected FE documentation such as DEVELOPMENT and evidence. Refresh contract artifacts only under the pinned-baseline rules. Never update BE documentation. Finish with changed files, commands/results, evidence, run instructions and remaining blockers. Leave changes uncommitted for the owner.
