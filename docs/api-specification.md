# CodeAudit — API Specification

## 1. Purpose

This document defines the planned HTTP API boundary for CodeAudit V1.

Exact endpoint names may be adjusted during implementation, but changes must be reflected here before becoming official.

## 2. API Principles

- JSON for structured responses;
- multipart/form-data for file uploads;
- consistent error objects;
- explicit analysis status;
- no authentication in V1;
- rate limiting on all public endpoints;
- stricter limits on expensive endpoints.

## 3. Health Check

### GET /api/health

Returns service availability.

Example:

```json
{
  "status": "ok"
}
```

## 4. Supported Languages

### GET /api/languages

Returns supported languages and capability information.

Example:

```json
{
  "languages": [
    {
      "id": "python",
      "name": "Python",
      "parse": true,
      "execute": true
    }
  ]
}
```

Execution support may differ from parsing support.

> **Implementation note (Phase 12):** the shipped response uses `label` instead of `name`, and replaces the two-flag `parse`/`execute` sketch above with the full per-language capability set the frontend actually needs to decide what to show — one boolean per analysis engine, sourced from `server/src/config/capabilities.ts` (the single place that decides which language supports which engine; see Phase 10 Decision 036). The response also includes `limits`, so the frontend never hard-codes upload constraints. Actual shape:
>
> ```json
> {
>   "languages": [
>     {
>       "id": "cpp",
>       "label": "C++",
>       "extensions": [".cpp", ".cc", ".cxx", ".hpp"],
>       "capabilities": {
>         "exactMatch": true,
>         "structural": true,
>         "batch": true,
>         "execution": false,
>         "ai": true
>       }
>     }
>   ],
>   "limits": {
>     "maxFileSizeBytes": 1048576,
>     "maxFiles": 100,
>     "maxTotalSourceBytes": 104857600,
>     "maxBatchSubmissions": 100
>   }
> }
> ```

## 5. Source-Code Upload

### POST /api/uploads

Accepts one or more source-code files for validation and temporary processing.

V1 does not require authentication.

The request must use `multipart/form-data`.

### Multipart fields

The request shall contain:

- `language` — required selected programming language;
- `files` — one or more source-code files.

The `language` field must contain one of the supported language identifiers returned by `GET /api/languages`.

One upload request represents one programming language. Mixed-language batches are not permitted.

### Upload limits

The endpoint shall enforce:

- maximum individual file size: 1 MB;
- maximum files per request: 100;
- maximum aggregate source-file size: 100 MB.

The aggregate limit applies to the combined source-file sizes in the request.

### Validation

Every uploaded file shall be validated before it enters an analysis workflow.

Validation shall include:

- supported file extension;
- compatibility with the selected language;
- individual file size;
- total upload size;
- maximum file count;
- safe filename handling.

If any file fails validation, the complete upload request shall be rejected rather than partially accepted.

Client-provided filenames are metadata only and must never be interpreted as filesystem paths.

### Successful response

A successful upload validation response should return metadata about the accepted files without returning their source contents.

Example:

```json
{
  "status": "accepted",
  "language": "cpp",
  "fileCount": 3,
  "totalSizeBytes": 4821,
  "files": [
    {
      "name": "student01.cpp",
      "sizeBytes": 1510
    },
    {
      "name": "student02.cpp",
      "sizeBytes": 1692
    },
    {
      "name": "student03.cpp",
      "sizeBytes": 1619
    }
  ]
}

## 5A. Project ZIP Upload

### POST /api/projects/upload

Accepts a complete source-code project as a ZIP archive for temporary project ingestion.

V1 does not require authentication.

The request must use:

`multipart/form-data`

### Multipart fields

The request shall contain:

- `file` — required ZIP archive containing the project source.

### Project ingestion

The endpoint shall:

- validate that the uploaded archive is an acceptable ZIP file;
- safely inspect archive entries before extraction;
- prevent unsafe archive paths;
- extract project contents only into controlled temporary storage;
- identify supported source-code files;
- apply applicable source-file validation rules;
- exclude unsupported non-source files according to documented ingestion rules;
- reject unsafe or invalid project contents;
- provide valid source files to the analysis workflow;
- remove temporary extracted data after the analysis lifecycle.

The ZIP archive itself must not be treated as a source-code file.

### Initial V1 scope

The initial implementation supports direct ZIP upload only.

GitHub/GitLab repository imports are not part of this endpoint.

### Successful response

The successful response should return project metadata and the discovered source-file metadata without returning source contents.

Example:

```json
{
  "status": "accepted",
  "fileCount": 4,
  "files": [
    {
      "name": "src/main.cpp",
      "language": "cpp",
      "sizeBytes": 1842
    }
  ]
}

```

## 6. Pairwise Analysis

### POST /api/analyze/compare

Accepts two source files.

Expected multipart fields may include:

- fileA;
- fileB;
- languageA (optional);
- languageB (optional).

### Response

A successful comparison returns the SHA-256 hash of each uploaded file and whether their contents are exactly identical.

Example:

```json
{
  "files": [
    {
      "name": "a.cpp",
      "hash": "..."
    },
    {
      "name": "b.cpp",
      "hash": "..."
    }
  ],
  "exactMatch": false
}
```

`exactMatch` is `true` only when the SHA-256 hashes of the two files are identical.

Structural similarity is a separate analysis signal and is not calculated by this endpoint yet.

The exact-match result does not indicate authorship or determine whether code was AI-generated.

## 7. Batch Analysis

### POST /api/analyze/batch

Accepts multiple files.

The server calculates unique pairwise comparisons.

For N files:

N(N-1)/2

comparisons are required.

The endpoint must enforce a configurable maximum batch size.

> **Implementation note (Phase 10):** the shipped `POST /api/analyze/batch` requires a `reference` file on every call and returns reference comparisons alongside the pairwise matrix in one response, rather than splitting batch and reference analysis into two separate endpoints. This follows the underlying `analyzeBatch()` orchestrator built in Phase 6, which always compares against a reference. It also currently requires `language: "cpp"` for every submission, since structural/reference comparison (Phase 6) is C++-only; other languages are rejected with a structured `UNSUPPORTED_LANGUAGE` error rather than silently mis-parsed. Request fields: `language` (form field), `submissions` (repeated file field), `reference` (single file field), optional `structuralThreshold` (0–1, default 0.75). Response fields: `submissions` (id/name/language only — no raw source bytes), `matrix`, `suspiciousPairs`, `referenceComparisons`.

## 8. Reference Analysis

### POST /api/analyze/reference

Accepts:

- one reference solution;
- one or more submissions.

The response should distinguish reference similarity from submission-to-submission similarity.

> **Implementation note (Phase 10):** there is no standalone `/api/analyze/reference` endpoint. Reference comparison is exposed through `POST /api/analyze/batch` (see §7, for multiple C++ submissions against a reference) and through `POST /api/analyze/workflow` (see §6A, for a single submission against a reference, combined with exact-match, execution, and AI analysis).

## 9. Testing

### POST /api/test/run

Accepts:

- source code;
- language;
- test cases;
- execution configuration within safe limits.

The endpoint must never execute arbitrary code inside the primary API process.

> **Implementation note (Phase 10):** there is no standalone `/api/test/run` endpoint. Execution/correctness testing (Python only) is exposed through `POST /api/analyze/workflow` (see §6A) by supplying `testCases`; execution always runs inside the isolated Docker worker (`codeaudit/python`), never inside the primary API process, matching this requirement.

## 6A. Combined Analysis Workflow

### POST /api/analyze/workflow

*(Added in Phase 10 — not part of the original spec above; documented here because it is the primary integration surface connecting §5 upload, §6 pairwise exact-match, §8 reference/structural analysis, §9 testing, §10 AI analysis, and §11 report generation into one call.)*

Accepts (multipart form):

- `source` (required file) — the submission to analyze;
- `language` (required form field) — must match `source`'s extension per §4;
- `reference` (optional file) — an expected/model solution to compare against; enables exact-match and, for C++, structural similarity;
- `referenceLanguage` (optional form field) — defaults to `language`;
- `testCases` (optional form field, JSON array of `{ id?, input, expectedOutput }`) — enables correctness/execution analysis, Python only;
- `runAI` (optional form field, `"true"`/`"false"`, default `true`) — toggles AI-assisted analysis;
- `structuralThreshold` (optional form field, 0–1, default 0.75).

Returns a single JSON object containing `sourceFiles`, `correctness`, `similarity`, `aiAnalysis`, `evidence`, `disclaimer`, `generatedAt`, and `warnings` (an explicit, human-readable list of any capability that was skipped and why — wrong language, no reference, no test cases, AI disabled/failed). The response body (minus `warnings`) is intentionally shaped to be usable directly as the request body for `POST /api/reports` (§11).

Every skipped capability is reported in `warnings` rather than silently omitted or causing a failure; an AI-provider error cannot fail the overall request.

## 10. AI Analysis

### POST /api/analyze/ai

The current V1 implementation accepts a JSON request containing source code and its programming language.

Request:

```json
{
  "language": "python",
  "source": "print(\"hello\")"
}
```

Validation requirements:

- `language` must be a non-empty string;
- `source` must be a non-empty string.

The endpoint delegates the request to `AIAnalysisService`, which uses the configured `AIAnalysisProvider`. The current provider implementation is Gemini.

Successful response model:

```json
{
  "available": true,
  "provider": "gemini",
  "indicator": 0.10,
  "label": "low",
  "confidence": 0.90,
  "observations": [
    {
      "category": "Code Complexity",
      "description": "..."
    }
  ],
  "disclaimer": "AI analysis is a probabilistic indicator only. It does not prove that code was written by AI and should not be treated as proof of authorship."
}
```

The exact numeric values are provider-generated and are not fixed by the API contract.

The normalized result model is:

- `available` — whether a provider result was obtained;
- `provider` — provider identifier;
- `indicator` — optional value from 0 to 1;
- `label` — `low`, `medium`, `high`, or `unavailable`;
- `confidence` — optional value from 0 to 1;
- `observations` — zero or more `{ category, description }` objects;
- `disclaimer` — mandatory limitation statement;
- `error` — optional controlled failure description.

The current Gemini provider uses `gemini-3-flash-preview` by default. `GEMINI_MODEL` may override the model. `GEMINI_API_KEY` configures the provider credential, and `GEMINI_TIMEOUT_MS` controls the request timeout with a 15-second default.

The provider requests structured JSON and validates the returned indicator, confidence, and observations before exposing them through the API.

If the API key is absent, the provider request times out, Gemini returns an empty or malformed response, or the provider raises an error, the system returns a controlled unavailable result rather than crashing the server.

The AI indicator is independent from exact matching, AST similarity, and functional correctness. It must not be interpreted as proof of authorship.

## 11. Report Generation

### POST /api/reports

Accepts an analysis result or analysis identifier according to the implementation strategy.

Returns a PDF response or a temporary report reference.

V1 should avoid creating permanent report storage.

## 12. Error Format

Errors should follow a consistent structure:

```json
{
  "error": {
    "code": "UNSUPPORTED_LANGUAGE",
    "message": "The selected language is not supported.",
    "details": null
  }
}
```

> **Implementation note (Phase 11):** this envelope is now enforced for every route, including failure modes a route doesn't handle itself. A single central error-handling middleware (`middleware/error-handler.ts`, registered last in `app.ts`) converts three previously-inconsistent cases into this same shape:
>
> - a malformed upload (`multer.MulterError`, e.g. an oversized file) on any route that accepts files — `413 FILE_TOO_LARGE` / `413 TOO_MANY_FILES` / `400 UNEXPECTED_FILE_FIELD` / `400 MALFORMED_UPLOAD`;
> - a malformed JSON request body — `400 MALFORMED_JSON`;
> - an unmatched route — `404 NOT_FOUND`;
> - any other unhandled error — `500 INTERNAL_SERVER_ERROR` (the underlying error is logged server-side and never included in the response).
>
> Before Phase 11, three of five upload-accepting routes had no multer-error handling at all and would fall through to Express's default HTML error page; `ai.routes.ts` used a bare `{error: "string"}` shape instead of this envelope. Both are fixed.

> **Implementation note (Phase 12):** a `429` response (rate limit exceeded) also uses this envelope, with `code: "RATE_LIMITED"` and `details: { retryAfterSeconds: <number> }` — a `Retry-After`-style hint the frontend uses to show a live countdown rather than a static "try again later" message. Example:
>
> ```json
> {
>   "error": {
>     "code": "RATE_LIMITED",
>     "message": "Too many requests. Wait a moment and try again.",
>     "details": { "retryAfterSeconds": 42 }
>   }
> }
> ```

## 13. Important Error Cases

The API should explicitly handle:

- missing file;
- empty file;
- oversized file;
- too many files;
- unsupported language;
- language/extension mismatch;
- aggregate upload-size exceeded;
- parser failure;
- malformed request;
- invalid test cases;
- execution timeout;
- compilation error;
- runtime error;
- rate-limit exceeded;
- AI provider unavailable;
- AI provider timeout;
- report-generation failure.

> **Implementation note (Phase 11):** all of the above are covered, either by existing Phase 1–9 code or by Phase 10/11 additions, and exercised by `server/src/app.test.ts` (endpoint-level) plus the relevant unit tests. Two notes: "parser failure" — tree-sitter is error-tolerant by design and does not throw on malformed source; it produces `ERROR` nodes in the tree, which the structural comparison still scores (typically low), rather than crashing — verified with a garbage-C++ endpoint test. "execution timeout" / "compilation error" / "runtime error" are validated at the unit level via `docker-worker.test.ts`'s fake process runner; they were not re-verified against a real Docker daemon during Phase 10/11, since none was available in the environment this work was done in.

## 14. Rate Limiting

At minimum, separate rate-limit policies should be considered for:

- general API requests;
- pairwise analysis;
- batch analysis;
- code execution;
- AI-analysis requests;
- report generation.

Exact limits should be selected after measuring resource consumption.

> **Implementation note (Phase 11):** every route that accepts files or calls an external/expensive capability has its own independent rate-limit bucket — `middleware/rate-limit.ts` exports *factories* (`createGeneralRateLimiter`, `createUploadRateLimiter`, `createAiRateLimiter`), and each route instantiates its own at module load, rather than importing one shared instance. This was a deliberate fix: earlier in Phase 11, `/uploads`, `/analyze/compare`, `/analyze/workflow`, and `/analyze/batch` all imported the *same* limiter instance and were found (via the endpoint test suite, not by inspection) to be silently sharing one combined request budget instead of each having their own 10/min. Current buckets: `general` (100/min, applied globally to `/api`), `upload` (10/min, one independent instance per upload-accepting route, including `/api/reports`), `ai` (10/min, for `/api/analyze/ai`).

## 15. API Versioning

The API should be structured so that a future `/api/v2` can be introduced without breaking the V1 contract.

## 16. Security

No endpoint should assume that uploaded source code is trustworthy.

All endpoints must validate input and apply appropriate resource controls.

> **Implementation note (Phase 14):** CORS is configurable via `CORS_ALLOWED_ORIGINS` (`server/src/config/cors.ts`), a comma-separated origin list. It defaults to wide-open (reflects any origin) when unset — the right default for local development, where a dev frontend's origin is unpredictable — and should be set explicitly to the deployed frontend's real origin(s) in production. See the top-level `README.md`'s Deployment section and `server/.env.example`.
