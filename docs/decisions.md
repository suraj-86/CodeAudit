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

## Decision 050 — Structural Analysis and Batch Comparison Were Generalized to Every Supported Language

**Decision:** `server/src/analysis/structural/source-parser.ts` replaces the old C++-only `cpp-parser.ts` as the structural engine's actual parsing layer: it eagerly loads all six bundled Tree-sitter grammars (C, C++, Java, JavaScript, TypeScript, Python) at module init and exposes a single `parseSource(source, language)` function. `cpp-parser.ts` is kept only as a thin convenience wrapper over it, so existing C++-specific call sites and tests are unaffected. `config/capabilities.ts` now sets `structural: true` and `batch: true` for all six languages (previously only `cpp`), and both the single-workflow path (`analysis-workflow.ts`) and the batch/reference path (`batch/compare.ts`, `batch/reference.ts`) dispatch on the submission's actual language instead of assuming C++.

**Reason:** The project owner explicitly asked why structural comparison and the batch "class test" feature were limited to C++ and asked for the rest of the supported languages. A spike confirmed this was safe and low-cost: the bundled `tree-sitter-wasm` grammars for C, Java, JavaScript, TypeScript and Python all parse cleanly, and critically, the comparison layer (`structural/traversal.ts`, which turns a syntax tree into the token sequence that gets compared) was already written generically against Tree-sitter's generic node API — it does not pattern-match on C++-specific node types. That meant generalizing was a parsing-dispatch change only; the comparison, fingerprinting and similarity-scoring logic needed zero changes.

## Decision 051 — A Cross-Language Pair Is a Distinct, Explicit Failure Case, Not Covered by "Unsupported Language"

**Decision:** Both the single-workflow path and the batch-compare path now check, as a separate condition from per-language structural support, whether the submission and reference (or the two submissions in a batch pair) are the *same* language. A pair that is C++ vs. Python — both individually structural-capable — gets its own distinct message ("the submission and reference are different languages" / "requires both submissions to be the same language"), not the "not supported for this language" message, and not a silent attempt to parse one file with the other's grammar.

**Reason:** Before Decision 050, this case couldn't arise — there was only one supported language, so "supported" and "same language" were the same check. Generalizing to six languages introduced a new way for structural comparison to be inapplicable that has nothing to do with whether either language itself is supported: two perfectly well-supported languages can still be meaningless to structurally diff against each other, because their syntax trees use different grammars and node vocabularies entirely. `batch/compare.ts`'s `structuralUnsupportedReason()` helper checks genuine per-language support first and the cross-language condition second, specifically so that a pair with one truly unsupported language (e.g. COBOL) is never misreported as merely "different languages" — the more specific, more actionable reason wins.

## Decision 052 — Default Gemini Model Switched From a Preview Tier to a Stable Release

**Decision:** The default Gemini model (`GeminiAnalysisProvider`'s `DEFAULT_MODEL`, and the `GEMINI_MODEL` documentation in `.env.example` and across the docs) changed from `gemini-3-flash-preview` to `gemini-3.5-flash`. Decision 048's original choice of `gemini-3-flash-preview` is left as-is in the historical record above; this entry documents the change rather than rewriting it.

**Reason:** Live testing against a real `GEMINI_API_KEY` surfaced two symptoms traced to the same root cause: the AI-assisted analysis step intermittently returned a 503 "This model is currently experiencing high demand" error (fixed separately in Decision-adjacent work by cleaning up how that error is displayed — see the `extractApiMessage()` change alongside Decision 050/051), and, more often, requests simply ran past the 15-second timeout with no error at all. `gemini-3-flash-preview` is a preview-tier model, and Google's own current model listing confirms it is a legacy preview with materially less serving capacity than the stable `gemini-3.x-flash` releases — exactly the kind of model that queues or times out under ordinary load rather than under any unusual traffic. Switching the default to `gemini-3.5-flash`, one of the stable models Google recommends for new projects, removes this as a source of flaky AI-analysis results without any code change beyond the one string constant (and the docs/`.env.example` that mirror it).

## Decision 053 — Removed the Python Runtime's Dockerfile `ENTRYPOINT`

**Decision:** `server/runtime/python/Dockerfile` no longer sets `ENTRYPOINT ["python", "/runner.py"]`. The image now has no default command at all — it must always be run with an explicit command, which `DockerExecutionWorker` (`docker-worker.ts`) already supplies via `ExecutionRuntime.command` (`["python", "/runner.py"]` for `PYTHON_RUNTIME`, defined in `config/execution.ts`) plus the submitted source as the final argument.

**Reason:** A real Docker execution run (the one item Phase 14 couldn't verify without a Docker daemon) surfaced a genuine bug: every execution failed with `runner: expected source code argument`, even for trivially correct code. The cause was Docker's own `ENTRYPOINT`/appended-args semantics — `docker run <image> <args...>` appends `<args...>` onto the image's `ENTRYPOINT` rather than replacing it. Since `docker-worker.ts` already builds the full command (`...runtime.command, source`) and passes it as those trailing args, the container was actually invoked as `python /runner.py python /runner.py <source>` — `runner.py` received 4 arguments instead of 2 and rejected the call before ever reaching the submitted code. This was never caught earlier because every other verification in this project (unit tests, the Playwright end-to-end pass) necessarily used a fake `ProcessRunner`/no Docker daemon, so the real `docker run` argument semantics were never exercised until the project owner ran it against a real Docker install. Removing the `ENTRYPOINT` and leaving the image with no default command means the full command always comes from the args `docker-worker.ts` passes, with nothing for Docker to prepend. Verified directly in this environment (no Docker daemon available here either) by simulating the exact argv Docker would construct before and after the change, and running `runner.py` directly with a representative source string and stdin input. **Confirmed against a real `docker build` + `docker run` by the project owner**, who rebuilt the image and re-ran the same submission/reference/test-case set through `/check`: 3 of 3 test cases passed on both sides, with real output matching the expected values exactly.

## Decision 054 — Rebuilt the PDF Report Renderer to Fix Overlapping Text and Match the App's Visual Identity

**Decision:** `server/src/reporting/pdf-report-renderer.ts` is rewritten. The structural fix: every text-drawing call now measures and wraps its own text (`wrap()`, using `font.widthOfTextAtSize()`), and advances the vertical cursor by the actual number of lines drawn. The visual redesign: the report now uses the same color tokens as the frontend (`client/src/index.css`'s `@theme` block — ink, violet, marigold, coral, mint), colored status pills that match the app's own status→tone mapping exactly (`ExecutionResultView.tsx`, `AIResultView.tsx`), a callout box for the summary and disclaimer, a horizontal meter bar with a threshold tick for structural similarity, tagged evidence-log entries with hanging-indent wrapping, and a real footer with accurate "Page X of Y" added in a second pass once the final page count is known.

**Reason:** The previous renderer advanced the cursor by exactly one fixed line height per `drawText`/`drawLabelValue` call, regardless of how many lines pdf-lib's `maxWidth` option actually wrapped that string into. Any text long enough to wrap — the summary, the disclaimer, AI observations, the footer — collided with whatever was drawn next: in a real generated report, "Analyzed Files" overlapped the Summary paragraph above it, every multi-line AI observation overlapped the next one, and the footer overlapped the disclaimer. This was a correctness bug, not just a style complaint, and was reported directly by the project owner against a real downloaded report. Beyond the fix, the renderer was also visually generic (plain Helvetica label:value lines, no color, no hierarchy) next to a frontend that has a distinct, deliberately designed visual identity (see the Phase 12/13 frontend UI work); the rewrite reuses that identity directly rather than inventing a separate look for the one artifact that leaves the app. Verified by rendering representative reports (the project owner's own data, and a stress case: 14 evidence entries, long filenames, a 64-character hash, AI unavailable, a cross-page break in the middle of a wrapped entry) and visually inspecting every page — no overlapping text anywhere, page breaks never orphan a heading or split a tag from its first line of text, and the footer's page count is always correct. All 100 backend tests pass, including the existing `pdf-report-renderer.test.ts` contract test.

## Decision 055 — Pre-Deployment UI Pass: Dedicated AI-Analysis Page, Client-Side Zip Support, Rebranded Footer, Badge Removal

**Decision:** Four changes, all frontend-only and all requested by the project owner as the final items before deployment:

1. **A new `/ai-analysis` page** (`client/src/pages/AiAnalysisPage.tsx`), separate from `/check`, dedicated to AI-assisted analysis. It accepts individual source files and/or a project `.zip`, runs each extracted file through the existing `POST /api/analyze/ai` endpoint one at a time (not in parallel — see below), and shows a per-file status list plus a detail panel reusing `AIResultView`. No backend route or contract changed; this is a new client built entirely on the existing single-file AI endpoint.
2. **Zip support in the class-set (`/batch`) page**: the existing submissions `DropZone` now also accepts `.zip`. A dropped zip is extracted client-side and its matching-language files are added to the submissions list exactly as if they'd been picked individually — the existing multipart upload to `/api/analyze/batch` is unchanged.
3. **A new footer** (`SiteFooter` in `Layout.tsx`): dark background, centered "© {year} Suraj.", circular icon links to GitHub (`github.com/suraj-86`), LinkedIn (`linkedin.com/in/suraj-k-6a2b60227`) and email (`mailto:harshsuraj8676@gmail.com`), and a small-caps "AST Engine · Built with love" tagline — matching a reference image the project owner supplied. This is a deliberate one-off departure from the app's light "printed proof" theme (`index.css`'s `@theme` palette), confined to the footer.
4. **Removed the "Server online" badge** from the top nav. `ServerStatusBadge.tsx` and its `useServerStatus` hook are deleted outright (not just unrendered) — a repo-wide grep confirmed Layout.tsx was their only caller.

Zip extraction itself lives in a new shared client module, `client/src/lib/zip.ts` (`extractFilesFromZip`, built on the newly added `jszip` dependency), used by both the AI-analysis page and the batch page. It skips directories, dotfiles, `__MACOSX/`, `node_modules/` and `.git/` entries, and flattens each archive path into a filename (`folder/main.py` → `folder__main.py`) so that same-named files from different student folders in one zip don't silently collide once extracted into one flat submissions list.

**Reason:** All four were the project owner's own explicit, numbered pre-deployment requirements. The architectural choice to do the zip handling and the new AI page entirely client-side — rather than adding zip-upload support to the backend — was deliberate: the existing `/api/analyze/ai` and `/api/analyze/batch` endpoints already do exactly what's needed per file, so reading the zip in the browser and reusing those endpoints unchanged avoids adding a new multipart/zip-parsing code path, new upload-size/zip-bomb considerations, and new tests on the server for behavior the client can provide by itself. The AI-analysis page runs files sequentially rather than concurrently, and stops the remaining queue early on a `RATE_LIMITED` response, because `/api/analyze/ai` sits behind its own per-window rate limiter (`createAiRateLimiter`) — firing a whole project's worth of files at once would just trade one slow, honest progress indicator for a wall of 429s. Verified live: `npm run build`, `tsc -b` and the full 52-test client suite all pass; a Playwright pass against the real dev server (no `GEMINI_API_KEY` configured) drove the nav and footer, uploaded a single file and a two-student project zip into the AI-analysis page end to end (confirming per-file status, extraction, and the "unavailable" detail panel), and uploaded the same project zip into the batch page's submissions `DropZone`, confirming both students' files were extracted and listed correctly.

## Decision 056 — AI-Analysis Page Gained a Project-Level Overview; Footer Tagline Rebranded; Home Page Gained Mode-Picker Cards

**Decision:** Three follow-up fixes after the project owner's first live look at Decision 055's work:

1. **Project-level overview for multi-file AI analysis.** `client/src/lib/ai-batch.ts` gained `computeProjectOverview(items)`, which rolls every finished `AiBatchItem` up into one summary: counts per risk label, an overall label (most-severe-present wins — one high-risk file among ninety-nine clean ones still means "high"), the average AI indicator across analyzed files, a sorted list of flagged (non-low) files, and the most common observation categories across the whole set. `AiProjectOverviewCard` (new component) renders this above the file list on `/ai-analysis` whenever more than one file is loaded and at least one has finished — it updates live as files finish, not just once the whole batch is done. Clicking a flagged file in the overview selects it, which still opens the existing single-file `AIResultView` detail panel below — so the project gets one report at a glance, and any file is still one click away for its own detail, exactly as requested.
2. **Footer tagline reworded.** "AST Engine · Built with love" (an invented sub-brand that doesn't exist anywhere else in the project) is now "CodeAudit · AST-Powered Code Analysis" — it names the actual product and names what it technically is, instead of a one-off made-up name.
3. **Home page gained three mode-picker cards** (`ModeCard`, inline in `HomePage.tsx`): "Check two files", "Check a class set", and a new "AI analysis" card linking to `/ai-analysis`, each with a one-line description and a colored accent bar, sitting directly under the hero's two buttons. Previously the home page had no entry point at all into AI analysis short of the top nav.

**Reason:** All three came directly from the project owner's own live review of the previous commit (screenshots of the running app): "AST ENGINE" read as an odd, unexplained second brand name next to "CodeAudit" in the header; uploading a many-file project zip into AI analysis showed only a flat per-file list with no way to see the project's overall picture without opening every file one at a time, which doesn't scale to "hundreds of files"; and the AI-analysis feature had no shortcut from the home page the way the comparison/batch features do. Verified live: typecheck, production build, and the full 52-test client suite all pass; a Playwright pass confirmed the old "AST ENGINE" string is gone from the footer, the new home cards link to and work on `/ai-analysis`, and uploading a two-file project zip produces a "Project overview" card (correctly showing the all-unavailable case, since this environment has no `GEMINI_API_KEY` configured) above the per-file list.

## Decision 057 — AI-Analysis Page: Zip Files Grouped & Collapsed, Rate-Limit-Aware Pacing, Richer Project Overview

**Decision:** Three further fixes to `/ai-analysis`, after the project owner tried a real project zip against it:

1. **Zip uploads no longer dump a flat file list.** `AiBatchItem` gained a `source` field (`{kind:'file'}` or `{kind:'zip', zipId, zipName}`), and `client/src/lib/ai-batch.ts` gained `groupItemsBySource()`. Each uploaded zip now renders as one collapsible `AiZipGroupRow` ("bigproj.zip — 13 files · 10/13 processed"), collapsed by default for anything bigger than 8 files, with its own file list revealed on click and a single "×" to drop the whole group. Standalone files (not from a zip) still render as a flat list below any zip groups.
2. **The AI route's rate limit (10 requests/minute, `config/rate-limit.ts`) no longer kills a large run.** Previously the run loop treated the first `RATE_LIMITED` response as fatal and abandoned every remaining file as "pending" forever. It now waits out the server's own `retryAfterSeconds` (shown live as "Pausing for the server's rate limit — Resuming in 60s — next up: …"), then resumes the same file, up to 30 rate-limit retries before giving up on that one file specifically. A "Stop" button lets the person cancel a long run outright. Before running, a plain-language estimate ("13 files will take roughly 2 minutes") sets expectations for anything over 10 files.
3. **The zip extractor caps matched files per zip at `MAX_ZIP_FILES = 300`** (`client/src/lib/zip.ts`), returning a `ZipExtractionResult` (`files`, `matchedEntries`, `totalEntries`, `truncated`) instead of a bare array, so both `/ai-analysis` and `/batch` can tell the person when a zip had more matching files than were loaded, rather than silently dropping the rest.
4. **`AiProjectOverviewCard` rewritten to be denser and more legible:** a `ResultSummary` stat row (total/analyzed/pending/failed/flagged/avg-indicator), a colored horizontal risk-distribution bar with a count+percentage legend, a violet meter bar for the average AI indicator, and — directly answering "why is everything unavailable" — the actual unavailable reason string from the AI provider (e.g. "Gemini API is not configured. Set GEMINI_API_KEY to enable AI analysis.") surfaced inline when every analyzed file came back unavailable, instead of only being visible by opening each file's own detail panel. The card also now updates live while a run is still in progress ("Rolling up as files finish — 10 of 13 done so far"), not just once the whole batch finishes.

**Reason:** The project owner tested the previous build locally. Three concrete problems came out of that: (a) asked "why 0 low 0 medium 0 high 5 unavailable" — the real reason (no `GEMINI_API_KEY` configured locally) was buried one click away in a per-file panel instead of being visible on the overview itself; (b) asked the overview to be "more detailed and professional" rather than a few plain stat lines; and (c) asked specifically what happens for "large projects [that] can have hundreds of files" — the honest answer with the previous build was that it would silently stop after the first ~10 files once the AI route's rate limit kicked in, which is a real correctness gap for the page's stated purpose, not just a polish item. Verified live: typecheck, production build, and the full 52-test client suite all pass; a Playwright pass uploaded a 13-file project zip, confirmed it rendered collapsed (no file names visible until expanded), ran it past the 10-request rate limit, and confirmed the "Pausing for the server's rate limit" banner, the live-updating "10 of 13 done" overview, and the surfaced unavailable-reason text all appeared exactly as described, then cancelled with "Stop" rather than waiting out the full minute.
