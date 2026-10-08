# CodeAudit — Development Roadmap

## Phase 0 — Project Foundation

Goal: establish a clean repository and development baseline.

Tasks:

- initialize repository;
- define frontend/backend structure;
- configure package management;
- establish environment configuration;
- add linting/formatting;
- create basic README;
- implement health endpoint;
- establish documentation directory.

Exit condition:

The application starts cleanly and documentation is committed.

**Status: COMPLETE**

---

## Phase 1 — File Upload & Validation

Goal: safely accept source files.

Tasks:

- upload endpoint;
- file validation;
- language detection;
- size limits;
- batch limits;
- rate limiting;
- temporary-data lifecycle;
- frontend upload UI.

Exit condition:

Valid and invalid uploads behave predictably.

**Status: COMPLETE**

---

## Phase 2 — Exact Match Engine

Goal: implement cheap deterministic comparison.

Tasks:

- SHA-256 hashing;
- exact-match detection;
- hash display;
- tests.

Exit condition:

Identical files are detected reliably without running expensive structural analysis.

**Status: COMPLETE**

---

## Phase 3 — AST Structural Engine

Goal: implement the core technical contribution.

Tasks:

- integrate Tree-sitter;
- support initial languages;
- inspect parse trees;
- implement structural traversal;
- define normalization rules;
- generate structural sequences;
- unit-test fingerprints.

Exit condition:

Controlled examples produce stable structural representations.

**Status: COMPLETE**

> **Update (during Phase 14):** structural parsing was generalized from C++-only to all six supported languages (C, C++, Java, JavaScript, TypeScript, Python), at the project owner's explicit request. This was a parsing-layer-only change — the comparison logic built in this phase (`structural/traversal.ts`) was already written against Tree-sitter's generic node API rather than any C++-specific node types, so generalizing meant only replacing the single-grammar `cpp-parser.ts` with a `source-parser.ts` that dispatches by language, not touching the structural representation itself. See Decision 050.

---

## Phase 4 — N-Gram & Similarity Engine

Goal: convert structural representations into similarity measurements.

Tasks:

- N-gram generation;
- Jaccard calculation;
- similarity result model;
- thresholds/risk interpretation;
- controlled clone experiments.

Exit condition:

Type-1, Type-2, and selected Type-3 examples can be meaningfully compared.

**Status: COMPLETE**

---

## Phase 5 — Comparison UI

Goal: make results understandable.

Tasks:

- comparison page;
- similarity summary;
- structural evidence;
- Monaco integration;
- side-by-side view;
- loading/error states.

Exit condition:

A user can upload two files and understand the comparison result.

**Status: COMPLETE** — fulfilled together with Phase 13 (see that section for what was built and validated). The project owner explicitly chose to do both phases in one pass rather than sequentially, once it was clear most of Phase 5's scope (comparison page, similarity summary, structural evidence, loading/error states) had already been built as part of Phase 12's foundation work, leaving Monaco/side-by-side as the one genuinely new piece — building that alongside Phase 13's results polish avoided redesigning the same results page twice.

---

## Phase 6 — Batch & Reference Analysis

Goal: support practical coding-test workflows.

Tasks:

- multiple submissions;
- reference solution;
- pairwise matrix;
- suspicious-pair ranking;
- safe batch limits.

Exit condition:

A practical-test batch can be analyzed without manual pair-by-pair uploads.

**Status: COMPLETE**

> **Update (during Phase 14):** batch and reference comparison were generalized from C++-only to every language the structural engine supports (Decision 050), at the project owner's explicit request ("class test" in their words, referring to this batch/reference feature). `batch/compare.ts` and `batch/reference.ts` now dispatch on each submission's actual language via the capabilities system instead of hard-coding `"cpp"`, and a pair spanning two different (but individually supported) languages is reported with its own distinct "different languages" reason rather than being misparsed or lumped in with "unsupported language" (Decision 051).

---

## Phase 7 — Code Execution & Testing

Goal: evaluate functional correctness.

Tasks:

- test-case model;
- execution manager;
- sandbox/isolated worker;
- compiler/interpreter integration;
- timeout handling;
- result reporting.

### Implemented V1 Scope

Phase 7 establishes the backend execution subsystem with:

- test-case modeling;
- execution requests/results;
- an `ExecutionManager`;
- language-specific `ExecutionWorker` abstraction;
- a Python execution worker using Docker;
- test-case input delivery;
- expected-output comparison;
- timeout handling;
- output-size limiting;
- runtime/compilation failure handling;
- explicit unsupported-language handling;
- explicit execution-unavailable handling;
- execution timing.

The current execution registry provides a Python worker. The remaining initially supported languages are not claimed as executable until their corresponding workers are implemented.

### Validation

Focused Phase 7 tests cover the execution worker, execution result model, and execution manager.

The completed Phase 7 validation recorded:

- Docker execution worker: **9/9 passed**;
- execution-result tests: **4/4 passed**;
- execution-manager tests: **5/5 passed**;
- TypeScript typecheck: **passed**;
- backend build: **passed**.

### Boundary

The Docker implementation is the current V1 execution-isolation baseline. Additional production hardening remains part of Phase 10.

Exit condition:

A currently supported execution language can safely execute controlled test cases through the isolated execution worker.

**Status: COMPLETE**

---

## Phase 8 — AI-Assisted Analysis

Goal: add independent AI-related analysis.

Tasks:

- research and select a suitable external provider;
- create a provider adapter and service boundary;
- implement Gemini API integration;
- support configurable model selection;
- implement timeout and failure handling;
- normalize provider output into the CodeAudit result model;
- add clear probabilistic disclaimer;
- avoid presenting the indicator as proof of AI authorship;
- expose the capability through the backend API.

### Implemented V1 Scope

Phase 8 establishes the backend AI-analysis subsystem with:

- `AIAnalysisProvider` abstraction;
- `AIAnalysisService` delegation layer;
- `GeminiAnalysisProvider`;
- Google Gemini API integration through `@google/genai`;
- default model `gemini-3.5-flash`;
- optional `GEMINI_MODEL` override;
- `GEMINI_API_KEY` environment configuration;
- configurable `GEMINI_TIMEOUT_MS` with a 15-second default;
- JSON response schema for indicator, confidence, and observations;
- indicator normalization into `low`, `medium`, or `high`;
- graceful `unavailable` results when the API is not configured or a provider request fails;
- timeout cancellation through `AbortController`;
- malformed/invalid provider-output validation;
- the `POST /api/analyze/ai` endpoint;
- an explicit AI-analysis disclaimer in successful and unavailable responses.

The AI pipeline remains independent of the AST structural engine and does not combine AI analysis, structural similarity, exact matching, or correctness into a universal score.

### Validation

Phase 8 validation recorded:

- Gemini provider tests: **6/6 passed**;
- AI analysis service tests: **2/2 passed**;
- TypeScript typecheck: **passed**;
- backend build: **passed**;
- manual `POST /api/analyze/ai` integration request with a configured Gemini key: **HTTP 200 / available result returned**.

The integration test also confirmed that the provider can return a normalized indicator, confidence value, observations, and disclaimer through the API.

### Boundary

Phase 8 establishes the backend AI-analysis capability. It does not claim that the AI indicator is a scientifically validated probability of authorship, nor does it complete frontend integration, report generation, provider-independent production hardening, or broader empirical evaluation. Those concerns remain separate roadmap responsibilities.

Exit condition:

The feature works independently from the AST engine and fails gracefully when unavailable.

**Status: COMPLETE**

---

## Phase 9 — Reports

Goal: provide a professional result artifact.

### Implemented V1 Scope

Phase 9 establishes the backend reporting and PDF-generation capability with:

- `ReportInput` and `ReportResult` reporting models;
- `ReportService` for constructing coherent analysis reports;
- report metadata including report ID and generation timestamp;
- project name and analyzed source-file information;
- SHA-256 hashes for analyzed source files when available;
- correctness results including source status, passed tests, failed tests, execution time, and comparison status;
- structural similarity information including similarity percentage, threshold, and suspicious indicator;
- AI-assisted analysis information including availability, provider, label, indicator, confidence, observations, and AI disclaimer;
- evidence items with category and description;
- report-level disclaimer;
- `PdfReportRenderer` using `pdf-lib`;
- structured PDF sections for summary, analyzed files, correctness, structural similarity, AI-assisted analysis, evidence, and disclaimer;
- multi-page PDF handling;
- PDF output suitable for API responses.

The reporting layer keeps the individual analysis dimensions separate. It does not combine correctness, structural similarity, or AI-assisted analysis into a universal score.

### API

The reporting capability is exposed through:

- `POST /api/reports`

The endpoint validates the report input and returns a generated PDF document when the input is valid.

Invalid report input is rejected with a structured `REPORT_INPUT_INVALID` response.

### Validation

Phase 9 validation recorded:

- `ReportService` test: **passed**;
- `PdfReportRenderer` test: **passed**;
- combined reporting tests: **2/2 passed**;
- TypeScript typecheck: **passed**;
- API validation for an empty `sourceFiles` array: **HTTP 400** with the expected validation error;
- API report generation with a valid source-file input: **successful PDF generated**;
- generated PDF verified to begin with the `%PDF-` signature;
- generated PDF file successfully written during API validation.

The PDF renderer test validates the generated PDF structure/signature rather than searching compressed PDF binary data for readable text.

### Boundary

Phase 9 establishes backend report generation and PDF rendering. It does not include frontend report presentation, deployment hardening, load testing, or broader evaluation. Those concerns remain part of later roadmap work.

Exit condition:

A user can generate a coherent report from an analysis.

**Status: COMPLETE**

---


## Roadmap Reshaping After Phase 9

Phases 0–9 remain unchanged from the original CodeAudit roadmap and documentation.

After Phase 9, the development workflow is deliberately reshaped.

The reason for this change is that the backend now contains the major independent analysis capabilities and report-generation foundation, while the remaining work is primarily about connecting those capabilities into a coherent backend workflow, hardening the backend API, and then building the frontend as a separate application layer.

The roadmap is therefore **not being rewritten retrospectively**. Phases 0–9 remain the historical/source-of-truth record exactly as previously documented.

Only the roadmap after Phase 9 is reshaped.

The new structure is:

```text
Phase 9 — Reports
        ↓
ROADMAP RESHAPED
        ↓
Phase 10 — Backend Integration
        ↓
Phase 11 — Backend API Hardening
        ↓
Phase 12 — Frontend Foundation
        ↓
Phase 13 — Frontend Results & Analysis UX
        ↓
Phase 14 — End-to-End Evaluation & Release
```

This creates a clear separation between:

1. completing and integrating the backend;
2. hardening the backend API;
3. establishing the frontend;
4. building the frontend analysis experience;
5. evaluating and releasing the complete application.

The project remains a **15-phase roadmap overall: Phase 0 through Phase 14**.

---

# Phase 10 — Backend Integration

**Goal:** connect the existing backend capabilities into coherent CodeAudit application workflows.

This phase focuses exclusively on backend integration. It does **not** begin frontend development.

## Tasks

- connect upload and input validation with the analysis workflow;
- integrate exact matching into the application workflow;
- integrate structural analysis;
- integrate batch analysis;
- integrate reference analysis where already supported by the existing project scope;
- integrate execution/correctness analysis;
- integrate AI-assisted analysis;
- integrate report generation;
- establish coherent analysis orchestration;
- ensure existing result models can flow between capabilities;
- resolve API workflow gaps;
- establish consistent backend workflow boundaries;
- ensure analysis results can be passed into report generation;
- ensure failures in one capability are represented without silently corrupting unrelated results.

The existing analysis capabilities should remain conceptually independent.

For example:

- structural similarity must remain distinct from exact matching;
- AI-assisted analysis must remain independent from AST analysis;
- correctness must remain a separate analytical signal;
- report generation must consume analysis results rather than become another analysis method.

The integration layer must not introduce an undocumented universal score.

### Implemented V1 Scope

Phase 10 identified three integration gaps in the Phase 1–9 codebase (each capability had been built and unit-tested in isolation, but never connected) and closed them:

- code execution/correctness (Phase 7) had no route exposing `DefaultExecutionManager`/`DockerExecutionWorker` — it was unreachable from the API;
- batch analysis (Phase 6) had no route exposing `analyzeBatch` — it was unreachable from the API;
- no endpoint connected exact-match, structural, execution, and AI analysis into one workflow whose output could be handed to report generation without a client hand-assembling `ReportInput` itself.

Delivered:

- `AnalysisWorkflowOrchestrator` (`server/src/workflow/analysis-workflow.ts`) — runs exact-match, structural similarity (C++ only), correctness/execution (Python only), and AI-assisted analysis for a single submission (with an optional reference and optional test cases), assembling one result shaped to be used directly as `ReportInput`;
- `POST /api/analyze/workflow` — multipart endpoint (`source`, optional `reference`, optional `testCases` JSON, `language`, `runAI`, `structuralThreshold`) wiring the orchestrator to HTTP, with structured `400` validation errors;
- `POST /api/analyze/batch` — multipart endpoint wiring the previously-unrouted `analyzeBatch` to HTTP (`submissions[]`, `reference`, `language`), returning the pairwise matrix, ranked suspicious pairs, and reference comparisons, with submission source bytes stripped from the response;
- `server/src/config/execution.ts` — production `ExecutionConfig` and the `codeaudit/python` Docker runtime constant, previously only present inline in test fixtures;
- every skipped capability (wrong language, missing reference, missing test cases, AI disabled or failed) is reported as an explicit `warnings[]` entry rather than a silent gap or a crash;
- a bug fix in `analysis/batch/compare.ts`: pairwise comparison previously parsed every submission as C++ unconditionally (no language guard, unlike `reference.ts`); it now returns `structuralSimilarity: null` with a stated reason for non-C++ pairs.

### API

The integration capability is exposed through:

- `POST /api/analyze/workflow`
- `POST /api/analyze/batch`

Both endpoints validate their multipart input and return structured `400` errors (`SOURCE_REQUIRED`, `LANGUAGE_REQUIRED`, `REFERENCE_REQUIRED`, `SUBMISSIONS_REQUIRED`, `UNSUPPORTED_LANGUAGE`, `UPLOAD_VALIDATION_FAILED`, `STRUCTURAL_THRESHOLD_INVALID`, `TEST_CASES_INVALID`) rather than throwing.

### Validation

Phase 10 validation recorded:

- TypeScript typecheck: **passed**;
- full test suite: **63/63 passed** (57 pre-existing + 6 new orchestrator tests, plus a regression test for the language-guard bug fix);
- live server smoke test, `/api/analyze/workflow` with two real C++ files (a Type-2/renamed-variable clone): correctly reported `exactMatch: false` and `structuralSimilarity: 1.0`;
- that workflow result (minus `warnings`) fed directly into `POST /api/reports`: **successful PDF generated**, confirming the full upload → analyze → report chain;
- live server smoke test, `/api/analyze/batch` with three C++ submissions and a reference: correct pairwise matrix, suspicious-pair ranking, and reference comparisons; response verified to no longer leak raw source bytes;
- empty-body requests to both new endpoints verified to return structured `400`s rather than `500`s (an `undefined req.body` crash was found and fixed during this validation).

### Boundary

Phase 10 connects the backend capabilities that already existed. It does not add new analysis capabilities, does not extend structural analysis or execution beyond their existing C++-only / Python-only scope, and does not address the API-consistency and testing-framework concerns that are Phase 11's job (for example: `ai.routes.ts`'s error responses do not yet match the structured `{error:{code,message,details}}` envelope used elsewhere; there is still no single unified test-running convention). The Python execution path was validated via the existing unit-level fakes and the `DockerExecutionWorker` test suite; it was not exercised against a live Docker daemon during this integration pass, since no Docker daemon was available in the environment this work was done in — that should be verified in a real deployment before relying on it.

Exit condition:

The backend can execute the intended CodeAudit workflow coherently from validated input through the applicable analysis capabilities, results, evidence, and report generation.

**Status: COMPLETE**

---

# Phase 11 — Backend API Hardening

**Goal:** make the integrated backend stable, predictable, and ready to become the frontend's API contract.

This phase focuses on verification, robustness, and API quality rather than introducing unrelated analysis functionality.

## Tasks

### Validation

- malformed-input testing;
- incomplete-input testing;
- unsupported-input testing;
- report-input validation;
- endpoint validation consistency.

### API behavior

- consistent success responses;
- consistent error responses;
- meaningful error codes;
- appropriate HTTP status codes;
- failure-state verification;
- API contract verification.

### Security and robustness

- upload-limit testing;
- rate-limit testing;
- parser failure testing;
- execution isolation testing;
- execution timeout testing;
- resource-limit testing;
- AI-provider failure testing;
- report-generation failure testing;
- unexpected-input handling.

### Testing

- backend integration tests;
- endpoint-level tests where appropriate;
- regression testing of existing analysis capabilities;
- typecheck;
- build verification.

### Documentation

- verify API specification;
- verify configuration/environment requirements;
- document relevant failure states;
- document supported capabilities and limitations.

## Exit condition

The backend API is sufficiently stable, validated, and documented for frontend development to depend on it.

### Implemented V1 Scope

Phase 11 audited every route for the inconsistencies and untested failure paths the roadmap calls out, and found concrete instances of each:

- **No central error handling.** A malformed JSON body, an oversized/malformed file upload on three of the five upload-accepting routes, and any unmatched route all fell through to Express's default (HTML) error/404 pages instead of a structured JSON response.
- **Inconsistent error envelope.** `ai.routes.ts` returned `{ error: "some string" }` while every other route already returned `{ error: { code, message, details } }`.
- **A missing rate limiter.** `/api/analyze/compare` had no rate limiting at all.
- **A shared rate-limiter bug**, found by the new endpoint test suite itself: `uploadRateLimiter` was one singleton instance mounted across four unrelated routes (`/uploads`, `/analyze/compare`, `/analyze/workflow`, `/analyze/batch`). Because express-rate-limit keys its counter to the middleware instance, all four routes were silently sharing one request budget instead of each having their own.
- **An orphaned file.** `analysis/ast/cpp-parser-test.ts`, an unreferenced Phase-3 scratch script (no assertions, not matched by the test glob), was removed.

Delivered:

- `server/src/app.ts` — Express app construction split out from `server/src/server.ts`'s `listen()` call, so the app can be exercised by tests without binding a real network port; `server.ts` is now a two-line entry point.
- `server/src/middleware/error-handler.ts` — a single Express error-handling middleware (`multer.MulterError` → structured 4xx by error code; malformed JSON body → `400 MALFORMED_JSON`; anything else → `500 INTERNAL_SERVER_ERROR`, logged server-side, never leaking internals to the client) plus a structured `404 NOT_FOUND` handler for unmatched routes. Registered once, last, in `app.ts`.
- `server/src/middleware/rate-limit.ts` rewritten as factories (`createGeneralRateLimiter`, `createUploadRateLimiter`, `createAiRateLimiter`); every route that wants its own request budget now instantiates its own limiter rather than importing a shared singleton. A new `ai` rate-limit bucket (10/min) was added for `/api/analyze/ai`, since it calls a paid external provider.
- `ai.routes.ts` normalized to the `{error:{code,message,details}}` envelope with meaningful codes (`LANGUAGE_REQUIRED`, `SOURCE_REQUIRED`, `AI_ANALYSIS_FAILED`), rate-limited, and made defensive against a non-object request body.
- `/api/analyze/compare` given its own rate limiter, and `/api/reports` (PDF generation) given its own as well; `/uploads`'s hand-rolled per-route multer-error handling removed in favor of the shared global handler (same behavior, one source of truth instead of two);
- An explicit `5mb` limit on the JSON body parser (previously an implicit, undocumented default).
- `server/src/app.test.ts` — 23 endpoint-level integration tests (via `supertest` against `createApp()`, no real network port; hermetic — the test file blanks `GEMINI_API_KEY` before importing the app so it never calls the real Gemini API, even if a developer's `.env` has a working key) covering the happy path and the documented failure codes for every route, plus: the new 404 handler, the new malformed-JSON handler, an oversized-upload rejection, a rate-limit-exhaustion case (a 429 must appear within 12 requests to the AI route; it does not assume a clean counter, because per-route limiters are created at module load and shared across `createApp()` calls), and a parser-resilience case (garbage C++ input scores low rather than crashing structural analysis, since tree-sitter is error-tolerant by design).

### Validation

Phase 11 validation recorded:

- TypeScript typecheck: **passed**;
- production build (`tsc`): **passed**;
- full test suite: **86/86 passed** (84 pre-existing + 2 new: a rate-limit-exhaustion test and a parser-resilience test), including the 23 new endpoint tests added in this phase;
- live server verification: malformed JSON body → `400 MALFORMED_JSON`; unknown route → `404 NOT_FOUND`; oversized upload → `413 FILE_TOO_LARGE`; garbage C++ source → `200` with a low (not suspicious) similarity score rather than a crash — all reproduced first by hand, then captured as automated tests;
- the shared-rate-limiter bug was caught by the endpoint test suite itself (two batch tests failed with unexpected `429`s) before being fixed, then re-verified green.

### Boundary

Phase 11 hardens the backend that Phase 10 connected; it does not add analysis capabilities, and it does not touch frontend work (Phase 12). Two things were identified but deliberately left out of this phase's scope:

- **Execution isolation/timeout/resource-limit testing** for the real Docker worker was not exercised end-to-end, because no Docker daemon was available in the environment this work was done in (same limitation noted in Phase 10). The existing `docker-worker.test.ts` fake-process-runner tests already cover timeout and output-size limits at the unit level; a real container run should still be verified in an environment with Docker before depending on it.
- **Legacy test-file style.** 23 of the 38 test files (mostly Phase 1–6 analysis modules) are plain assertion scripts (`throw` + `console.log`) rather than `node:test`-style files; `node --test` still runs and correctly fails them (each is reported as one aggregate pass/fail per file rather than per-assertion), so this is a reporting-granularity inconsistency, not a functional gap. All 23 pass. Migrating them to `node:test` was considered out of proportion to this phase's exit condition — it would touch a large amount of already-working legacy code for a cosmetic benefit — and is left as a candidate for a dedicated, low-risk cleanup pass rather than being bundled into this one.

Exit condition:

The backend API is sufficiently stable, validated, and documented for frontend development to depend on it.

**Status: COMPLETE**

---

# Phase 12 — Frontend Foundation

**Goal:** establish the CodeAudit frontend as a separate application layer on top of the stable backend.

This is the first dedicated frontend phase.

## Tasks

- establish frontend application structure;
- define frontend architecture;
- establish routing/navigation;
- create the CodeAudit application shell;
- create reusable UI components;
- establish API client/service layer;
- connect frontend to backend APIs;
- implement source/project input workflow;
- implement upload interface;
- implement language/capability selection where required;
- implement loading states;
- implement API error states;
- implement unavailable-capability states;
- configure frontend/backend environment handling.

The frontend should consume the documented backend APIs rather than reproduce backend analysis logic.

## Exit condition

A user can enter the CodeAudit workflow through the frontend, provide valid input, communicate with the backend, and receive correctly handled success, loading, and error states.

### Implemented V1 Scope

Two small backend additions were made in this phase, both because the frontend genuinely needed them to avoid duplicating backend logic (per the phase's own principle above), not as new analysis capabilities:

- `server/src/config/capabilities.ts` — the single source of truth for which analysis engine supports which language (previously this was implicit and duplicated as ad-hoc checks across `analysis-workflow.ts` and `batch.routes.ts`; both now read from here). `GET /api/languages` now returns each language's `capabilities` object and the server's upload `limits`, so the frontend never hard-codes either — see the Phase 12 note on §4 and §14 of `docs/api-specification.md`.
- `middleware/rate-limit.ts`'s `429` responses now use the standard error envelope with `code: "RATE_LIMITED"` and `details.retryAfterSeconds`, instead of express-rate-limit's default plain-text body — see the Phase 12 note on §12.

Frontend delivered, under `client/`:

- **Foundation:** Vite + React 19 + TypeScript, Tailwind v4 (via `@tailwindcss/vite`), `react-router` v8. A dev-only Vite proxy (`server.proxy` and `preview.proxy`) forwards `/api` to the backend so the browser never needs CORS; `VITE_API_BASE_URL` overrides this for a split-origin deployment. Design tokens (colour, type, the "printed proof" motif) live in `src/index.css` as a Tailwind v4 `@theme` block.
- **API service layer** (`src/api/`): typed request/response contracts mirroring the backend exactly, a `fetch` wrapper that turns every non-2xx response into one `ApiError` (parsed from the `{error:{code,message,details}}` envelope, with a `RATE_LIMITED`-aware `retryAfterSeconds`) or `NetworkError` (the request never reached a server at all), and typed functions for every endpoint including multipart building for `/analyze/workflow` and `/analyze/batch` and blob handling for `/reports`.
- **Reusable components** (`src/components/`): a design system distinct from generic AI-generated UI — a light "tracing paper over a grid" background, hard-offset-shadow buttons, a `DropZone` with registration marks that snap inward on drag, an evidence-log/warnings list, an execution/AI result view, a similarity dial, and a `FilePrint` — a 4×4 Bauhaus-tile pattern derived deterministically from a file's SHA-256 (computed client-side via Web Crypto, with a pure-JS fallback for non-secure origins), so identical files visibly share a "print" before any request is made.
- **The interactive centrepiece** (`RenameTestDemo`, on the home page): lets a person toggle cosmetic changes (rename identifiers, add comments, change a literal) and a genuine one (change an operator) against a real code snippet, and watch a live `StructureStrip` rendering of `BASE_STRUCTURE` — which is the *actual, recorded output* of the backend's own `structural/traversal.ts` for that exact snippet, not a simulated approximation — hold still for the cosmetic changes and shift by exactly one tile for the structural one.
- **Two workflow pages:** `/check` (single submission plus optional reference, via `POST /api/analyze/workflow`) and `/batch` (a class set plus a required reference, via `POST /api/analyze/batch`, restricted to languages whose `capabilities.batch` is true). Both read language and capability information entirely from `GET /api/languages` rather than hard-coding rules, show upload/paste input, gate the submit button on real file validation (not just presence — a file with a wrong extension or over the size limit disables submission, not just shows a warning), and render every result field: exact-match, structural similarity, correctness per test case, AI analysis (including the disabled/unavailable state), the evidence log, and a PDF-report download that round-trips through `POST /api/reports`.
- **States:** loading (`ScanningLoader`), the four error shapes (`ApiError`, a `RATE_LIMITED` countdown, `NetworkError`, and an unknown-error fallback), and unavailable-capability states (the workflow's own `warnings[]`, and capability chips that grey out what a language doesn't support before a request is even made).

### Validation

Phase 12 validation recorded:

- TypeScript typecheck (`tsc -b --noEmit`), ESLint, and `vite build`: all **passed**, zero warnings;
- Vitest: **40/40 passed** — unit tests for the SHA-256 implementation (checked against Node's `crypto` module directly, including the pure-JS fallback path), the file-print generator, capability-sentence copy, file/draft validation, and the API client's error-envelope parsing (including the `RATE_LIMITED`/`NetworkError`/malformed-body/abort-signal branches); component tests for the interactive demo and every `ErrorNotice` branch (including a fake-timer countdown-to-retry test); an App-level smoke test (mocked backend) covering the happy path, the disabled-until-valid form state, a `/api/languages` failure, and the 404 route;
- backend regression: **92/92 passed** (the Phase 11 suite plus the new capability/rate-limit-envelope tests);
- a real, unmocked end-to-end pass, run against the actual backend (Docker not required for this — C++/structural and the report pipeline don't need it) via Playwright screenshots and interactions: uploaded two real C++ files (a renamed-identifier clone) through `/check` and confirmed the real result (`exactMatch: false`, `similarity: 1.0`, correctly flagged suspicious); downloaded and verified a real PDF via the report button; ran a 3-submission-plus-reference batch through `/batch` and confirmed the matrix, flagged-pairs list, and reference comparisons matched the backend's actual computed values (including a non-trivial case: an operator change producing 87% similarity, not 100% or 0%); confirmed responsive layout at a 390px mobile width;
- this pass itself caught and fixed two real bugs before they shipped: `vite preview` needed its own `preview.proxy` (separate from dev's `server.proxy`) to be tested accurately at all, and — more importantly — **both workflow forms let a person submit a file that had already been flagged as invalid** (wrong extension, empty, or oversized); the submit button now checks the same validation the inline warning shows, not just "a file is present."

### Boundary

Phase 12 is the input/submission half of the frontend; Phase 13 (Frontend Results & Analysis UX) owns deeper results presentation, and Phase 5 (a dedicated comparison UI) was done together with it (see Phase 13). Two things noted but left out of scope here:

- **The Docker execution path** (Python correctness testing) still has no automated frontend-side end-to-end check against a live container, for the same reason as Phases 10–11: no Docker daemon in the environment this work was done in. The UI code for it (`TestCaseEditor`, `ExecutionResultView`) was exercised via the mocked App-level test and via manual reasoning about the API contract, not a live run.
- **The legacy plain-script backend tests** (Decision 039) remain untouched; this phase didn't add to that inconsistency, and didn't attempt to resolve it either.

**Status: COMPLETE**

---

# Phase 13 — Frontend Results & Analysis UX

**Goal:** turn backend analysis results into a complete and understandable CodeAudit user experience.

## Tasks

### Analysis workflow

- analysis progress/status;
- result summary;
- exact-match results;
- structural similarity results;
- batch comparison results;
- reference comparison results;
- execution/correctness results;
- AI-assisted analysis results.

### Evidence and interpretation

- evidence display;
- observations;
- similarity information;
- correctness information;
- AI indicator and confidence where available;
- AI limitations/disclaimer;
- clear separation of independent analytical signals.

The interface must not imply that:

- structural similarity proves authorship;
- an AI indicator proves AI authorship;
- correctness determines similarity;
- multiple independent signals constitute a scientifically validated universal score.

### Report experience

- report-generation action;
- report status;
- PDF generation;
- PDF download;
- report-related error handling.

### UX quality

- empty states;
- partial-result states;
- failure states;
- retry handling;
- responsive layout;
- basic UI polish;
- accessible and understandable result presentation.

## Exit condition

A user can complete a meaningful CodeAudit analysis through the frontend and understand the results, evidence, limitations, and generated report.

### Implemented V1 Scope

Done together with Phase 5 (Comparison UI), by explicit choice — see that section. This phase is purely frontend; no backend code changed.

**Monaco / side-by-side (Phase 5's one genuinely new piece):** `client/src/lib/monaco-setup.ts` self-hosts Monaco (no CDN) with only the editor core and the five supported languages' grammars — not the full `monaco-editor` barrel, which would pull in dozens of unused ones. `CodeDiffView` wraps `monaco.editor.createDiffEditor` as a read-only, lazy-loaded (`React.lazy`) component: the entire ~2.7 MB Monaco chunk loads only once a diff is actually about to render, not on first page load. It renders the *actual* two files that were submitted — read client-side from the `File` objects already in memory via `useFileText`, with no new backend endpoint needed — and switches between side-by-side and inline rendering based on its own container width (via `ResizeObserver`), not the viewport's, since it can sit in a narrower column even on a wide screen. Wired into both `/check` (source vs. reference) and `/batch` (matrix pair selection, or a reference-comparison row — `lib/batch-selection.ts`'s `resolveSelection` resolves either into the same two-files-and-labels shape).

**Result summary:** `ResultSummary` — a compact, facts-only strip ("2 of 4 checks completed", "Exact match: No", similarity, skip count) at the top of both the workflow and batch results views. It states counts only, never a combined judgement, so it can't be mistaken for a verdict.

**The "must not imply" list, made structural rather than just careful wording:** `SignalsBanner` states the four prohibited implications directly and negatively ("Structural similarity does not prove who wrote the code," "...there is no combined score") at the top of every results view, rather than relying solely on scattered disclaimers in individual sections to avoid them.

**UX quality:**
- empty states: batch's "Flagged pairs" / "Against the reference" sections now always render, with explicit copy when there's nothing to show ("No pair crossed the similarity threshold... this is a clean result, not a skipped one") instead of silently disappearing, which previously could look like something had failed to run;
- partial-result, failure, and retry states were already built in Phase 12 (`WarningsList`, `ErrorNotice`, the rate-limit countdown) and are unchanged here;
- responsive layout: verified at 390px width, including `CodeDiffView`'s side-by-side → inline switch;
- accessible presentation: unchanged from Phase 12's existing `aria-label`/`role` usage; Monaco's own diff editor has its own (partial) built-in accessibility support, which this integration doesn't attempt to extend.

**Report experience:** unchanged from Phase 12 (already covered its full scope: generation action, loading status, PDF download, error handling with retry).

### Validation

Phase 13/5 validation recorded:

- TypeScript typecheck, ESLint, and `vite build`: all **passed**, zero warnings;
- Vitest: **52/52 passed** (40 from Phase 12 plus 12 new: `CodeDiffViewImpl`'s Monaco wiring and `CodeDiffView`'s lazy-load fallback, both via a mocked `monaco-setup` module since real Monaco cannot run in jsdom; `resolveSelection`'s pair/reference/unsupported-language/missing-file branches; `useFileText`'s initial/resolved/file-changed states);
- backend regression: **92/92 passed**, unaffected (no backend code touched this phase);
- a real, unmocked end-to-end pass via Playwright against the actual backend: a renamed-variable C++ pair through `/check` showing the real diff (`average`/`a`/`b` vs `mean`/`x`/`y`, 100% structural similarity, correctly flagged); a 2-submission batch with a deliberately dissimilar pair through `/batch`, exercising both the "no flagged pairs" empty state and a reference-row diff selection; a PDF download verified as a real, valid PDF; the same `/check` flow re-verified at 390px mobile width.
- this pass caught and fixed three real bugs before they shipped, none of which the type system or linter could have caught:
  1. **A ~2.99 MB main bundle.** Monaco was being pulled into the app's initial chunk (loaded on every page visit, even the home page) because `CodeDiffView` was imported eagerly. Fixed by splitting it into a `React.lazy`-loaded wrapper (`CodeDiffView.tsx`) around the real implementation (`CodeDiffViewImpl.tsx`); the main chunk dropped to 284 KB, with Monaco now fetched only when a diff is actually rendered.
  2. **A double-invocation bug in `CodeDiffViewImpl`.** An unnecessary `ready` state caused the model-setting effect to run twice on mount (disposing and recreating the diff models immediately after creating them) — harmless to the user but wasteful. Found by a test asserting `setModel` was called exactly once; fixed by removing the redundant state, since the editor ref is already populated synchronously before the dependent effect runs in the same commit.
  3. **Invisible gutter icons.** The diff view's insert/remove margin icons rendered as empty "tofu" boxes. `monaco-editor`'s package `exports` field only exposes `.js` subpaths, not its CSS, so the icon font (`codicon.ttf`) is registered directly via a hand-written `@font-face` in `index.css`; a second, non-obvious fix was then needed because `CodeDiffViewImpl`'s own custom `fontFamily` editor option was cascading onto the icon elements and overriding Monaco's internal `.codicon` font-family rule (itself injected at runtime via JS, which is why the rest of the editor's appearance needed no CSS import at all) — resolved with a targeted `.codicon { font-family: 'codicon' !important; }` override.

### Boundary

This phase is the last planned frontend work before Phase 14. Two things noted but left as-is:
- the pre-existing `BatchMatrix` column-header truncation (two files with long, similar-prefixed names can show indistinguishable truncated headers, though the row labels and hover titles remain correct) predates this phase and wasn't touched;
- Monaco's own diff-editor accessibility is whatever Monaco itself provides; this integration didn't attempt to extend or audit it further.

Exit condition:

A user can complete a meaningful CodeAudit analysis through the frontend and understand the results, evidence, limitations, and generated report.

**Status: COMPLETE**

---

# Phase 14 — End-to-End Evaluation & Release

**Goal:** validate the complete CodeAudit V1 application and prepare it for demonstration and deployment.

## Tasks

### End-to-end workflow testing

Verify the complete flow:

```text
Frontend
   ↓
API
   ↓
Input / Upload
   ↓
Analysis
   ↓
Results
   ↓
Evidence
   ↓
Report
   ↓
Frontend
```

Test applicable workflows including:

- source upload;
- exact comparison;
- structural analysis;
- batch analysis;
- reference analysis;
- correctness/execution;
- AI-assisted analysis;
- report generation;
- failure and recovery paths.

### Security and robustness

- malformed requests;
- oversized inputs;
- unsupported files;
- parser failures;
- execution failures;
- execution timeouts;
- rate limits;
- memory/load behavior;
- execution isolation;
- AI-provider failures;
- report-generation failures.

### Frontend verification

- browser workflow;
- loading states;
- API error handling;
- retry behavior;
- unavailable capabilities;
- responsive behavior;
- production frontend build.

### Deployment

- production backend build;
- production frontend build;
- environment configuration;
- CORS/API configuration;
- backend deployment;
- frontend deployment;
- runtime verification;
- deployment smoke tests.

### Documentation

- requirements verification;
- architecture verification;
- API documentation verification;
- setup documentation;
- deployment documentation;
- known limitations;
- final roadmap status;
- demonstration checklist.

## Exit condition

The complete CodeAudit V1 workflow is stable, demonstrable, documented, and deployable.

### Progress So Far

Everything below was verified directly — not assumed — in the environment this work was done in, which has no Docker daemon and no deployment credentials. Two items are explicitly left for the project owner to confirm themselves; see "What's left" below.

**End-to-end workflow testing**, via Playwright against the real running backend (not mocks): source upload, exact-match, structural analysis (a real renamed-variable C++ pair, correctly flagged), batch analysis (3 submissions, a correctly-computed 100%/100%/47% similarity split), reference analysis, PDF report generation and download (a real, valid PDF), AI-assisted analysis in its unavailable state (no key configured here), and failure/recovery paths: malformed C++ source (doesn't crash — low similarity score, matching tree-sitter's error tolerance), an oversized file upload (clean `413`, not a crash), a missing/invalid file (submit button correctly stays disabled). Correctness/execution was verified for the *graceful-without-Docker* path (reports `Execution Unavailable` with the real underlying reason, `spawn docker ENOENT`, rather than crashing) — a real successful Python execution could not be verified here; see "What's left."

**Security and robustness:** rate limiting re-confirmed against the real server (exactly 10 requests succeed, the 11th gets a clean `429` with the `RATE_LIMITED` envelope and a working `retryAfterSeconds`); a 20-request concurrent burst against `/api/languages` all returned `200` with the server remaining responsive immediately after. Malformed requests, oversized inputs, unsupported files, parser failures, and AI-provider failures were all re-confirmed as part of the end-to-end pass above rather than only at the unit/endpoint level (Phases 10–11 already covered those). Execution timeouts/isolation and report-generation failures remain covered at the unit level only (`docker-worker.test.ts`'s fake process runner; `report-service.test.ts`), unchanged from earlier phases.

**Frontend verification:** the production build (`vite build`) was re-confirmed clean, with Monaco correctly isolated into its own lazy chunk (284 KB main bundle, unchanged from Phase 13). Loading states, API error handling, retry behavior, and unavailable-capability states were all exercised live as part of the end-to-end pass above, not just the existing Vitest suite.

**Deployment prep:**
- `server/src/config/cors.ts` (Decision 049): CORS is now configurable via `CORS_ALLOWED_ORIGINS` (comma-separated origins), defaulting to wide-open when unset so local development is unaffected. Verified directly against the real server in both modes: unset → `Access-Control-Allow-Origin: *`; set to a specific origin → that origin is reflected back and a non-matching origin gets no CORS header at all.
- `server/.env.example` added (didn't exist before) — documents every environment variable the server actually reads (cross-checked against the source, not just copied from memory): `PORT`, `CORS_ALLOWED_ORIGINS`, `GEMINI_API_KEY`/`GEMINI_MODEL`/`GEMINI_TIMEOUT_MS`, `EXECUTION_TIMEOUT_MS`/`EXECUTION_MAX_OUTPUT_BYTES`.
- `README.md` gained a `Getting Started` section (previously the README had no setup/run instructions at all — just conceptual description) and a `Deployment` section with concrete, platform-specific steps for Render (backend) + Vercel (frontend) — the project owner's actual hosting choice — including the CORS-closing step after both are live, and why Python execution specifically needs extra host support beyond a standard web service.

**Documentation:** a sweep of `requirements.md`, `scope.md`, `vision.md`, `analysis-engine.md`, `architecture.md`, and `api-specification.md` for stale status language found and fixed one real instance (`requirements.md`'s execution section still said comparison UI, reporting, and "multi-language execution workers" were future work, and referenced Phase 10 Docker hardening that has since completed); the rest of the "future work" language found was legitimate (GitHub/GitLab import, persistent accounts — genuinely out of V1 scope, not completed-but-undocumented). A `Known Limitations` section and a `Demonstration checklist` were added to `README.md`.

### What's left

Two things only the project owner can verify, since they require either a Docker daemon or real hosting credentials that aren't available in the environment this work was done in:

1. **A real Python execution run against Docker.** Build the image (`docker build -t codeaudit/python server/runtime/python`), run the server locally with Docker available, and submit a Python file with a test case through `/check`. The *graceful-failure* path (no Docker) is already confirmed; what's unconfirmed is the actual happy path.
2. **An actual deployment**, per the README's new Deployment section (Render for the backend, Vercel for the frontend), followed by the demonstration checklist run against the live URLs rather than `localhost`.

Exit condition:

The complete CodeAudit V1 workflow is stable, demonstrable, documented, and deployable.

**Status: IN PROGRESS** — everything verifiable without Docker or hosting credentials is done; closing this phase out depends on the project owner's results from "What's left" above.

---

# Post-Phase-9 Development Flow

From Phase 10 onward, the development sequence is:

```text
Phase 10
Backend Integration
        ↓
Phase 11
Backend API Hardening
        ↓
Backend Stable
        ↓
Phase 12
Frontend Foundation
        ↓
Phase 13
Frontend Results & Analysis UX
        ↓
Phase 14
End-to-End Evaluation & Release
```

This reshaping intentionally keeps backend integration, backend hardening, frontend foundation, frontend UX, and final release as separate phases.

## Development Rule

The established development workflow remains:

```text
Inspect → Design → Implement → Test → Review → Commit → Push
```

No phase should silently expand into unrelated functionality.

At the end of each meaningful phase:

1. verify implementation against the phase goal;
2. update relevant documentation;
3. run the appropriate validation;
4. commit the completed work;
5. push to the repository.

---

# Current Position

```text
Phase 9  — Reports
            COMPLETE

            ↓
     ROADMAP RESHAPED

Phase 10 — Backend Integration
            COMPLETE

Phase 11 — Backend API Hardening
            COMPLETE

Phase 12 — Frontend Foundation
            COMPLETE

Phase 13 — Frontend Results & Analysis UX
            COMPLETE (with Phase 5)

Phase 14 — End-to-End Evaluation & Release
            IN PROGRESS — awaiting Docker execution check and deployment
```
