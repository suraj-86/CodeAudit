# CodeAudit — Architecture & Product Decisions

This document records decisions that affect the direction of the project.

## Decision 001 — Product Name

**Decision:** The project is named CodeAudit.

**Reason:** The name is broad enough to cover testing, code comparison, structural analysis, integrity verification, and AI-assisted analysis.

## Decision 002 — Product Type

**Decision:** CodeAudit is a lightweight public code-analysis utility.

**Reason:** The project should remain focused and suitable for a minor project rather than becoming an LMS or academic management platform.

## Decision 003 — No Authentication in V1

**Decision:** No login, signup, authentication, or user roles.

**Reason:** The core workflow does not require identity. Removing authentication reduces unnecessary infrastructure.

## Decision 004 — No Database in V1

**Decision:** No persistent application database.

**Reason:** V1 analysis is intentionally ephemeral. Uploaded files and results do not require persistent user records.

## Decision 005 — No Teacher Dashboard

**Decision:** No teacher-specific dashboard.

**Reason:** Anyone should be able to use the same analysis tool.

## Decision 006 — AST Is for Structural Analysis

**Decision:** AST analysis is responsible for structural code comparison and clone detection.

**Reason:** AST similarity is appropriate for structural similarity but should not be presented as a reliable AI-authorship detector.

## Decision 007 — AI Analysis Is Independent

**Decision:** AI-related detection/analysis is a separate capability using an external provider/API where appropriate.

**Reason:** AI-authorship analysis and structural similarity answer different questions and require different methods.

## Decision 008 — AI Results Are Probabilistic

**Decision:** The application will use language such as “AI-likelihood indicator” rather than claiming that a specific percentage of code was definitely written by AI.

**Reason:** AI detection is probabilistic and can produce false positives and false negatives.

## Decision 009 — Code Execution Is Optional by Capability

**Decision:** Code execution will only be offered where a safe execution environment is available.

**Reason:** Arbitrary source-code execution is a major security risk and cannot be performed directly in the API process.

## Decision 010 — Anonymous Upload Requires Strong Limits

**Decision:** Rate limiting, upload limits, execution limits, and cleanup are mandatory.

**Reason:** Without authentication, public endpoints are exposed to abuse and resource exhaustion.

## Decision 011 — Independent Metrics

**Decision:** Correctness, structural similarity, exact-match status, and AI analysis remain separate signals.

**Reason:** Combining them blindly into one universal percentage would create a misleading result.

## Decision 012 — Explainability

**Decision:** Similarity results should include evidence where technically possible.

**Reason:** A user should be able to investigate a flag instead of trusting an unexplained number.

## Decision 013 — Modular Application, Not Microservices

**Decision:** V1 should use clear internal modules rather than distributed microservices.

**Reason:** The project is intentionally lightweight and a modular application provides sufficient separation without unnecessary operational complexity.

## Decision 014 — Documentation as Source of Truth

**Decision:** The CodeAudit documentation set and actual codebase jointly define the project.

**Reason:** Development should remain consistent across sessions and avoid assumptions.

## Decision 015 — Change Control

Any material architectural or scope change should:

1. be discussed;
2. be recorded here;
3. update affected specification documents;
4. only then become an implementation target.

## Decision 016 — V1 Technology Foundation

**Decision:** CodeAudit V1 will use React + TypeScript + Vite for the frontend and Node.js + Express + TypeScript for the backend. npm will be used as the package manager.

---

# Phase 7 Decisions

## Decision 017 — Execution Worker Abstraction

**Decision:** Code execution is implemented through an `ExecutionWorker` abstraction selected by an `ExecutionManager`.

**Reason:** Language-specific execution should remain isolated so additional language workers can be introduced without rewriting the manager.

## Decision 018 — Docker-Based Python Execution

**Decision:** The current Python execution worker executes submitted source through Docker instead of directly inside the Node.js API process.

**Reason:** Submitted source is untrusted and requires an execution boundary separate from the API process.

## Decision 019 — Python Is the Current Execution Worker

**Decision:** Phase 7 implements a Python execution worker as the current V1 execution capability.

**Reason:** Execution is being implemented incrementally. Unsupported languages are explicitly reported instead of being silently routed to an unrelated runtime.

## Decision 020 — Explicit Execution States

**Decision:** Execution distinguishes `Passed`, `Failed`, `Compilation Error`, `Runtime Error`, `Timeout`, `Unsupported`, and `Execution Unavailable`.

**Reason:** Infrastructure failures, source failures, and correctness results have different meanings and must remain distinguishable.

## Decision 021 — Timeout and Output Limits

**Decision:** Execution is bounded by a timeout and a configured output-size limit.

**Reason:** Untrusted programs must not be allowed to consume execution resources indefinitely or produce uncontrolled output.

## Decision 022 — Current Docker Isolation Is a V1 Baseline

**Decision:** The current Docker implementation is treated as the V1 execution-isolation baseline rather than as the final production security boundary.

**Reason:** Phase 7 establishes controlled execution first; stronger CPU, memory, process, capability, privilege, and other hardening controls remain part of Phase 10.

## Decision 023 — Execution Availability Is Separate from Program Correctness

**Decision:** Failure to start the Docker execution environment is reported as `Execution Unavailable`.

**Reason:** Infrastructure availability is not the same as a failed program.

## Decision 024 — Correctness Remains Independent

**Decision:** Functional correctness results remain separate from structural similarity, exact matching, and AI-assisted analysis.

**Reason:** A correct program may be structurally different, and a structurally similar program may still be incorrect.

## Decision 025 — Phase 7 Does Not Claim Multi-Language Execution

**Decision:** The project does not claim executable support for all initially listed languages until their execution workers are implemented.

**Reason:** Upload/analysis language support and execution-worker support are distinct capabilities.



---

# Phase 8 Decisions

## Decision 026 — AI Provider Abstraction

**Decision:** AI analysis is implemented behind an `AIAnalysisProvider` interface and an `AIAnalysisService` delegation layer.

**Reason:** Provider-specific SDK details should remain isolated so another provider can be introduced without rewriting the API contract or analysis service.

## Decision 027 — Gemini as the Current V1 AI Provider

**Decision:** The current V1 AI-analysis provider is Google Gemini, integrated through the `@google/genai` SDK.

**Reason:** Gemini provides the required structured generation capability for the current backend implementation while fitting the provider-adapter architecture.

## Decision 028 — Gemini Model Configuration

**Decision:** The default Gemini model is `gemini-3-flash-preview`, with `GEMINI_MODEL` available as an environment-based override.

**Reason:** Model selection should be configurable without changing provider implementation code.

## Decision 029 — Environment-Based AI Configuration

**Decision:** Gemini credentials and operational configuration must be supplied through environment variables.

**Configuration:**

- `GEMINI_API_KEY` — required to enable the provider;
- `GEMINI_MODEL` — optional model override;
- `GEMINI_TIMEOUT_MS` — optional positive timeout, default 15000 ms.

**Reason:** Secrets must not be committed to source control, and operational configuration should remain deployment-specific.

## Decision 030 — Structured AI Result Contract

**Decision:** The provider must return structured JSON containing an indicator, confidence, and observations, which are validated before being exposed through the API.

**Reason:** A stable internal result model is required to prevent provider-specific response formats from leaking into the rest of CodeAudit.

## Decision 031 — Graceful AI Failure

**Decision:** Missing configuration, timeout, empty responses, malformed provider output, and provider errors are represented as controlled `unavailable` results.

**Reason:** External AI services are inherently dependency-bound and must not crash or destabilize the CodeAudit API when unavailable.

## Decision 032 — AI Indicator Is Not Authorship Proof

**Decision:** AI analysis remains a probabilistic indicator and must not be described as proof or as a validated probability of authorship.

**Reason:** The implementation can inspect observable characteristics, but it cannot establish authorship from those characteristics alone. The disclaimer is therefore part of the result contract.

## Decision 033 — One Combined Workflow Endpoint Instead of Separate Reference/Testing Endpoints

**Decision:** `POST /api/analyze/workflow` combines exact-match, structural similarity, execution/correctness, and AI analysis for a single submission (with an optional reference and optional test cases) into one call and one result, rather than exposing the originally specced separate `/api/analyze/reference` and `/api/test/run` endpoints.

**Reason:** The Phase 10 goal is a coherent workflow, not a one-to-one mapping of every analysis capability to its own endpoint. A single response shaped for direct use as `ReportInput` avoids requiring the client to call multiple endpoints and hand-assemble the report request itself.

## Decision 034 — Batch Analysis Always Requires a Reference

**Decision:** `POST /api/analyze/batch` requires a `reference` submission on every call; there is no reference-less batch mode at the API layer.

**Reason:** This follows the underlying `analyzeBatch()` orchestrator built in Phase 6, which always produces reference comparisons alongside the pairwise matrix. Phase 10 exposes that existing behavior rather than redesigning it.

## Decision 035 — Explicit Warnings Instead of Silent Capability Skips

**Decision:** Whenever the workflow orchestrator skips a capability (unsupported language, missing reference, missing test cases, AI disabled or failed), it records a human-readable entry in a `warnings` array rather than omitting the field silently or failing the request.

**Reason:** Silent gaps are indistinguishable from bugs. An explicit, itemized warning lets a caller (and a future frontend) show exactly what wasn't evaluated and why, consistent with the project's "no undocumented universal score" principle — nothing is folded into or hidden from the result.

## Decision 036 — Structural/Execution Language Boundaries Are Enforced at the Integration Layer, Not Silently Passed Through

**Decision:** The workflow and batch routes explicitly check submission language before invoking structural (C++-only) or execution (Python-only) analysis, returning a clear skip/warning or a structured `400` for unsupported languages, instead of letting the underlying Phase 3/Phase 7 code attempt the operation regardless.

**Reason:** A pre-existing bug (`batch/compare.ts` parsing every submission as C++ regardless of its declared language) showed that without an explicit guard, an unsupported-language input silently produces meaningless results instead of a clear error. Phase 10 integration is exactly where these existing single-module boundaries needed to be enforced consistently, since it is the first layer where multiple languages and multiple capabilities meet in one request.

## Decision 037 — One Central Error-Handling Middleware Instead of Per-Route Duplication

**Decision:** A single Express error-handling middleware (`middleware/error-handler.ts`), registered once and last, converts `multer.MulterError`, malformed-JSON body-parser errors, and any other unhandled error into the standard `{error:{code,message,details}}` envelope. Individual routes no longer implement their own multer-error-handling logic.

**Reason:** Before this, three of five upload-accepting routes had no multer-error handling at all, and the one that did (`/uploads`) duplicated logic that belonged in one place. A single backstop guarantees every route — including ones added later — gets consistent, structured error responses for these failure modes without each route author needing to remember to write it.

## Decision 038 — Rate Limiters Are Factories, Not Shared Singletons

**Decision:** `middleware/rate-limit.ts` exports factory functions (`createGeneralRateLimiter`, `createUploadRateLimiter`, `createAiRateLimiter`); each route that wants its own request budget calls the factory itself at module load, rather than importing one shared middleware instance.

**Reason:** express-rate-limit keys its counter to the middleware instance's own internal store. A single exported instance reused across multiple `router.post(...)` mount points meant those routes silently shared one combined quota instead of each having their own — found by the Phase 11 endpoint test suite itself (unexpected `429`s), not by inspection.

## Decision 039 — Legacy Plain-Script Tests Are Left As-Is

**Decision:** 23 of 38 test files (mostly Phase 1–6 analysis modules) remain plain assertion scripts (`throw` + `console.log`) rather than being migrated to `node:test`-style files.

**Reason:** `node --test` already runs and correctly fails these files as part of the unified `npm test` — each is reported as one aggregate pass/fail per file rather than per-assertion, which is a reporting-granularity inconsistency, not a functional gap. Rewriting 23 already-working legacy files for a cosmetic benefit was judged out of proportion to Phase 11's exit condition and carries needless regression risk; it remains a candidate for a dedicated, low-risk cleanup pass rather than being bundled into this phase.
## Decision 040 — Endpoint Tests Must Be Hermetic With Respect to External Providers

**Decision:** `app.test.ts` sets `GEMINI_API_KEY` to an empty string before dynamically importing the app, so the endpoint suite never reaches the real Gemini API regardless of the developer's `.env`.

**Reason:** `app.ts` loads `.env` via `dotenv/config`, and the AI provider is built when the route modules load. On a developer machine with a working key, the original suite made live API calls (an 11.8 s AI test and a 37 s rate-limit test), spent quota, and would have failed its own `available === false` assertion once a key worked. The override must precede the import because `dotenv` never overrides variables that are already set.

The same rule applies to `gemini-provider.test.ts`: the "no API client configured" test now passes `apiKey: ""` explicitly, because the provider falls back to `process.env.GEMINI_API_KEY` only when `apiKey` is nullish. Previously that test failed for anyone with the key exported in their shell.

## Decision 041 — Language Capabilities Live in the Backend, Not the Frontend

**Decision:** `server/src/config/capabilities.ts` is the single source of truth for which analysis engine (exact-match, structural, batch, execution, AI) supports which language. `GET /api/languages` exposes it; the frontend reads it rather than hard-coding its own copy of the same rules.

**Reason:** The alternative (a frontend constants file duplicating the backend's language rules) would drift the first time a capability changes — e.g. when structural analysis gains a second language, the frontend would keep offering the old, narrower set until someone remembered to update it by hand in two places. A single source of truth, even at the cost of a small backend change during a frontend phase, was chosen deliberately over that risk (this was an explicit choice offered to and confirmed by the project owner).

## Decision 042 — The File "Print" Is Deterministic and Computed Client-Side

**Decision:** `FilePrint` renders a 4×4 Bauhaus-tile pattern derived deterministically from a file's SHA-256 digest, computed in the browser (Web Crypto, with a pure-JS fallback for non-secure origins) as soon as a file is added — before any request is sent to the backend.

**Reason:** It gives an immediate, correct visual signal ("these two files look identical" / "these clearly differ") that doesn't wait on a network round-trip, and it reuses the same SHA-256 the backend already computes and returns, so the client-side print and the eventual server-side hash are never two different notions of "the same file" — they're the same digest, just visualised.

## Decision 043 — The Landing-Page Demo Uses Real Backend Output, Not a Simulation

**Decision:** `RenameTestDemo`'s "original structure" sequence (`BASE_STRUCTURE` in `client/src/lib/specimen.ts`) is the literal, recorded output of the backend's own `analysis/structural/traversal.ts` for one fixed snippet — captured once by running the real engine — not a hand-written approximation of what the engine "probably" does.

**Reason:** The demo's entire claim is "renaming/comments/literals don't change the structure; an operator does." That claim is falsifiable, and a hand-simulated version could silently drift from what the engine actually does as the engine changes, making the demo quietly dishonest. Using the engine's real output means the demo either stays true or visibly breaks (a future engine change that reorders nodes would need `BASE_STRUCTURE` regenerated), rather than silently becoming a plausible-looking fiction.

## Decision 044 — Submit Buttons Gate on Validity, Not Just Presence

**Decision:** Both workflow forms (`/check`, `/batch`) disable their submit button when any provided file fails validation (wrong extension, empty, over the size limit) — not only when a file is entirely missing.

**Reason:** Found during Phase 12's own Playwright verification pass: the initial implementation showed an inline "Python files end in .py, this one is .cpp" warning next to the file, but the button stayed enabled anyway, so a person could ignore the warning and send a request the backend would just reject. The fix reuses the exact same `fileProblem`/`draftProblem` check the inline warning already uses, so the two can't disagree with each other.

## Decision 045 — Phase 13 and Phase 5 Were Done as One Combined Pass

**Decision:** Phase 13 (Frontend Results & Analysis UX) and the previously-deferred Phase 5 (Comparison UI) were implemented together in one phase, rather than Phase 13 first and Phase 5 second (or vice versa).

**Reason:** By the time Phase 13 began, Phase 12 had already substantially built most of Phase 5's listed scope (comparison page, similarity summary, structural evidence, loading/error states) as part of its own results rendering — leaving Monaco/side-by-side as Phase 5's one genuinely unbuilt piece. Doing Phase 13 first and Phase 5 second would have meant designing the results page once, then revisiting the same components a second time to retrofit a Monaco panel neither the layout nor the data flow had been built to expect. This was an explicit choice offered to and confirmed by the project owner, not a default.

## Decision 046 — The Diff View Reads Files the Browser Already Has, Not a New Endpoint

**Decision:** `CodeDiffView` is given the actual submitted `File` objects (still held in the submitting page's component state) and reads their text client-side via `file.text()`, rather than the backend gaining an endpoint that returns source code alongside analysis results.

**Reason:** The browser already has the exact bytes the user uploaded, sitting in memory for the lifetime of the results view; fetching them from the server a second time would be redundant round-tripping of data the client already holds, and would require the backend to retain or resend source code it currently treats as transient per-request input (see the Temporary Data Lifecycle section of `docs/architecture.md`). This keeps Phase 13/5 entirely frontend-only.

## Decision 047 — Monaco Is Self-Hosted and Lazy-Loaded, Never From a CDN

**Decision:** `monaco-editor` is a direct dependency, imported only via `React.lazy()` (so its ~2.7 MB chunk loads solely when a diff view is about to render, never on first page load), with only the editor core and the five supported languages' grammars pulled in — not Monaco's full "every language" bundle, and not a CDN-hosted copy.

**Reason:** A CDN load would mean the page depends on a third-party host being reachable, and would be an odd inconsistency for a tool whose whole purpose is handling people's submitted source code locally. Lazy-loading keeps the cost of including a full code-diff engine from being paid by every visitor, including ones who never view a diff; importing only the needed language grammars (rather than monaco-editor's full barrel) keeps that lazy chunk itself from being larger than it needs to be.

## Decision 048 — The "Must Not Imply" List Gets Its Own Structural Banner, Not Just Careful Wording

**Decision:** `SignalsBanner` states the roadmap's four prohibited implications directly and negatively (e.g. "Structural similarity does not prove who wrote the code... there is no combined score") at the top of every results view, rather than relying only on each individual section's own disclaimer text to avoid implying them.

**Reason:** Phase 13's constraint is a list of things the interface must not imply — a negative requirement that's easy to satisfy by accident in any one section's copy while still leaving the overall page's *impression* ambiguous (several strong-looking percentages sitting next to each other can imply a combined verdict even when no single sentence claims one). A standing, structurally unavoidable banner is a stronger guarantee than auditing each section's wording in isolation.

## Decision 049 — CORS Defaults Open, Is Configurable, Never Required

**Decision:** `CORS_ALLOWED_ORIGINS` (comma-separated) restricts CORS to specific origins when set; when unset, CORS stays wide open rather than defaulting to some arbitrary restrictive default.

**Reason:** A hard-coded restrictive default would break local development the moment the frontend's dev port changed, or if it were accessed from a LAN address during testing — there's no single "right" origin to hard-code for a tool meant to run both as `localhost:5173` during development and as a real deployed frontend origin in production. Making it opt-in via an environment variable means development is unaffected by default, and a production deployment (Render, in this project's case) gains a one-line way to close the open-CORS exposure once the real frontend origin is known.
