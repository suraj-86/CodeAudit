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

## Exit condition

The backend can execute the intended CodeAudit workflow coherently from validated input through the applicable analysis capabilities, results, evidence, and report generation.

**Status: NOT STARTED**

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

**Status: NOT STARTED**

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
            NEXT

Phase 11 — Backend API Hardening
            NOT STARTED

Phase 12 — Frontend Foundation
            NOT STARTED

Phase 13 — Frontend Results & Analysis UX
            NOT STARTED

Phase 14 — End-to-End Evaluation & Release
            NOT STARTED
```
