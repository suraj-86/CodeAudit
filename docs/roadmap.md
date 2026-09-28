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

**Status: NOT STARTED**

Phase 5 remains deferred under the backend-first implementation sequence.

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
- default model `gemini-3-flash-preview`;
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
- `server/src/app.test.ts` — 23 endpoint-level integration tests (via `supertest` against `createApp()`, no real network port) covering the happy path and the documented failure codes for every route, plus: the new 404 handler, the new malformed-JSON handler, an oversized-upload rejection, a rate-limit-exhaustion case (429 on the 11th request against an isolated app instance), and a parser-resilience case (garbage C++ input scores low rather than crashing structural analysis, since tree-sitter is error-tolerant by design).

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

**Status: NOT STARTED**

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

**Status: NOT STARTED**

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

**Status: NOT STARTED**

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
            NEXT

Phase 13 — Frontend Results & Analysis UX
            NOT STARTED

Phase 14 — End-to-End Evaluation & Release
            NOT STARTED
```
