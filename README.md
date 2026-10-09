# CodeAudit

> A lightweight code analysis, comparison, testing, and integrity-verification tool.

## Overview

CodeAudit is designed to make source-code analysis accessible without requiring accounts, authentication, or a persistent database.

A user can upload source-code files, select an analysis workflow, and receive results covering functional correctness, exact matches, structural similarity, and optional AI-assisted analysis.

CodeAudit is intentionally a **tool**, not a classroom-management system.

## Getting Started

CodeAudit is two projects in one repository: `server/` (Node/TypeScript/Express API) and `client/` (React/Vite/TypeScript frontend). Both are required to run the app.

### Prerequisites

- Node.js 20 or later, and npm
- [Docker](https://docs.docker.com/get-docker/), **only** if you want Python correctness testing to actually run (everything else works without it — see [Known Limitations](#known-limitations))

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # optional — see server/.env.example for what each variable does
npm run dev             # starts the API on http://localhost:4000
```

If you want Python execution to work, build the Docker image it runs submissions in:

```bash
docker build -t codeaudit/python server/runtime/python
```

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev              # starts the app on http://localhost:5173 (or similar)
```

The dev server proxies `/api` requests to `http://localhost:4000` automatically (see `client/vite.config.ts`) — no extra configuration needed for local development.

Open the URL Vite prints; you should see the CodeAudit home page. If the backend isn't reachable, the pages that call it (`/check`, `/batch`, `/ai-analysis`) will show a "Couldn't reach the server" error when you try to run a check — that's the signal to confirm the backend is running on port 4000.

### 3. Run the tests

```bash
cd server && npm test        # 95 tests
cd client && npx vitest run  # 52 tests
```

### 4. Production builds (what actually gets deployed)

```bash
cd server && npm run build && npm start   # tsc, then node dist/server.js
cd client && npm run build                # outputs to client/dist/
```

## Core Capabilities

### 1. Code Testing

Where safe execution is supported, CodeAudit can run submitted programs against supplied test cases and report:

- passed tests;
- failed tests;
- compilation errors;
- runtime errors;
- timeouts;
- execution status.

### 2. Structural Code Comparison

The core comparison engine analyzes source-code structure rather than relying only on textual similarity.

Conceptually:

```text
Source Code
    ↓
Parser
    ↓
Syntax Tree
    ↓
Structural Traversal
    ↓
Normalization
    ↓
N-Gram Fingerprint
    ↓
Similarity Calculation
```

This can help identify structurally similar code even when superficial details such as variable names or formatting have changed.

### 3. Reference Comparison

A user can provide a reference implementation and compare submissions against it.

Reference similarity is presented separately from submission-to-submission similarity because a correct implementation can legitimately resemble the expected solution.

### 4. Batch Comparison

Multiple files can be analyzed together.

For N files, CodeAudit can calculate:

N(N-1)/2

unique pairwise comparisons, subject to configured resource limits.

### 5. AI-Assisted Analysis

CodeAudit can use an external AI-analysis service when configured.

The current V1 implementation uses Google Gemini through `@google/genai`, behind an `AIAnalysisProvider` abstraction and `AIAnalysisService`. The default model is `gemini-3.5-flash`.

Configuration is environment-based:

- `GEMINI_API_KEY` — API credential;
- `GEMINI_MODEL` — optional model override;
- `GEMINI_TIMEOUT_MS` — optional timeout in milliseconds, default 15000.

The AI endpoint accepts a programming language and source code and returns a normalized result containing availability, provider, indicator, label, confidence, observations, disclaimer, and controlled error information when unavailable.

AI results are presented as probabilistic indicators and are **not treated as proof of AI authorship**. They remain independent of AST structural similarity, exact matching, and functional correctness.

### 6. Explainable Results

Where possible, CodeAudit provides supporting information such as:

- hashes;
- structural statistics;
- N-gram statistics;
- similarity values;
- matching patterns;
- visual source comparison.

### 7. Reports

Analysis results can be converted into a downloadable report.

## Typical Workflow

```text
        Upload Code
             │
             ▼
         Validate
             │
             ▼
       Select Analysis
             │
      ┌──────┼─────────┐
      ▼      ▼         ▼
    Test    Compare   AI Analysis
      │      │         │
      └──────┼─────────┘
             ▼
       Analyze Results
             │
             ▼
       Inspect Evidence
             │
             ▼
       Optional Report
```

## V1 Philosophy

CodeAudit V1 intentionally does **not** include:

- login/signup;
- authentication;
- teacher dashboards;
- student dashboards;
- courses;
- assignments;
- persistent user profiles;
- database-backed history;
- messaging;
- LMS features.

The goal is to keep the project focused on its technical core.

## Security

Anonymous file uploads and code execution introduce significant security concerns.

CodeAudit therefore treats the following as first-class requirements:

- rate limiting;
- file-size limits;
- batch-size limits;
- input validation;
- language allowlists;
- execution isolation;
- execution timeouts;
- resource controls;
- temporary-data cleanup;
- safe error handling.

Untrusted code must never execute directly inside the main API process.

## Architecture

The planned architecture is:

```text
┌─────────────────────┐
│      React UI       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     Backend API     │
│ Validation/Limits   │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Analysis Orchestrator│
└─────┬────┬────┬─────┘
      │    │    │
      ▼    ▼    ▼
    Hash  AST  Test
      │    │    │
      │    ▼    │
      │ Similar │
      │  ity    │
      └────┬───┘
           ▼
      AI Adapter
           │
           ▼
       Reporting
```

## Documentation

The `docs/` directory is the project's source-of-truth documentation.

Key documents:

- `vision.md` — product vision and principles
- `scope.md` — V1 scope and exclusions
- `requirements.md` — functional and non-functional requirements
- `architecture.md` — system architecture
- `analysis-engine.md` — analysis algorithms and interpretation
- `api-specification.md` — HTTP API contract
- `roadmap.md` — development phases
- `decisions.md` — recorded architectural/product decisions

When implementation and documentation disagree, the discrepancy should be resolved deliberately rather than silently ignored.

## Known Limitations

Honestly, as of V1:

- **The Python/Docker execution path has not been verified against a real Docker daemon in this project's own development process.** The sandboxed environment used to build CodeAudit has no Docker available, so execution has only ever been validated at the unit level (`docker-worker.test.ts`, against a fake process runner that simulates Docker's behavior, including timeouts and output limits). The code path is exercised and does fail gracefully without Docker (it reports `Execution Unavailable` with the underlying reason, rather than crashing — this *has* been confirmed end-to-end). What hasn't been confirmed end-to-end is a real, successful Python run. If you have Docker locally, this is the one thing worth testing yourself before relying on it (see the Deployment section below for exact steps).
- **`BatchMatrix`'s column headers can truncate indistinguishably** when several submitted files share a long common prefix in their names. The row labels and each cell's hover title remain correct; this is a minor legibility issue with the header row specifically, in a batch with many files.
- **Monaco's diff editor accessibility is whatever Monaco itself provides.** `CodeDiffView` doesn't attempt to extend or audit it further.
- **AI-assisted analysis requires a Gemini API key** (`GEMINI_API_KEY`). Without one, it reports itself unavailable with a clear reason — this is by design, not a bug — but it means that capability is untested against the real Gemini API in any automated test (by design — see `docs/decisions.md`, Decision 040, for why the test suite deliberately never calls the real API).

## Deployment

CodeAudit is two independently deployable pieces with no shared infrastructure beyond the API URL — a conventional split hosting setup like Render (backend) + Vercel (frontend) works well, though neither is required specifically.

### Backend (e.g. Render)

1. Create a new **Web Service** pointing at this repository, with **Root Directory** set to `server`.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Environment variables (see `server/.env.example` for the full list with explanations):
   - `GEMINI_API_KEY` — optional; AI analysis works without it, just reports itself unavailable
   - `CORS_ALLOWED_ORIGINS` — set this to your deployed frontend's URL once you have it (e.g. `https://your-app.vercel.app`); until then CORS stays open, which is fine for getting the backend itself verified first
   - Render sets `PORT` automatically — don't override it
5. **For Python execution to work in production**, the host needs to be able to run Docker containers and have the `codeaudit/python` image available. Render's standard web services do not provide this; running real Python execution in production needs either a host that does (a VM, a container platform with Docker-in-Docker support) or building `server/runtime/python`'s image into your own deployment image. Without this, execution requests simply report `Execution Unavailable` rather than failing — the app works, that one capability doesn't.

### Frontend (e.g. Vercel)

1. Import this repository, with **Root Directory** set to `client`.
2. Framework preset: Vite (Vercel detects this automatically).
3. Environment variable: `VITE_API_BASE_URL` set to your deployed backend's URL plus `/api` (e.g. `https://your-backend.onrender.com/api`).
4. Deploy. Build and output settings don't need overriding — `npm run build` and `client/dist/` are Vercel's Vite defaults.

### After deploying both

1. Go back to the backend's environment variables and set `CORS_ALLOWED_ORIGINS` to the real Vercel URL from step 3 above, then redeploy the backend so the restriction takes effect.
2. Open the deployed frontend URL and run any check (e.g. `/check` with a small file). If it fails with "Couldn't reach the server" or a CORS error in the browser console, it's almost always either `VITE_API_BASE_URL` being wrong/missing, or `CORS_ALLOWED_ORIGINS` not yet matching the frontend's real origin.
3. Run through the demonstration checklist below against the live deployment, not just `localhost`.

### Demonstration checklist

A quick pass to confirm a deployment (or a local run) is actually working end-to-end:

- [ ] Home page loads
- [ ] `/check`: upload a C++ file with a reference → see exact-match and structural-similarity results, plus the side-by-side code diff
- [ ] `/check`: a Python file with a test case → see a correctness result (`Execution Unavailable` is a valid, correct result if Docker isn't set up — see Known Limitations)
- [ ] `/batch`: 3+ C++ submissions plus a reference → see the comparison matrix, flagged pairs, and reference comparisons
- [ ] `/batch`: upload a `.zip` of a class set (one subfolder per student) into the submissions dropzone → confirm every student's file is extracted and listed
- [ ] `/ai-analysis`: upload a project `.zip` → confirm every supported source file inside is extracted, listed, and analyzed one by one
- [ ] Download a PDF report from a completed check
- [ ] Submit an invalid file (wrong extension) → confirm the submit button stays disabled with a clear inline reason
- [ ] If `GEMINI_API_KEY` is set: confirm AI analysis returns a real result, not "unavailable"

## Development Workflow

CodeAudit development follows:

```text
Inspect
  ↓
Understand
  ↓
Design
  ↓
Implement
  ↓
Test
  ↓
Review
  ↓
Commit
  ↓
Push
```

Development should proceed in small, focused increments.

## Project Status

**Current stage:** Phases 0–13 complete, plus Phase 5 (done together with Phase 13 — see `docs/decisions.md`, Decision 045). Phase 14 (End-to-End Evaluation & Release) is the only phase remaining before V1.

- Phase 1 — File Upload & Validation
- Phase 2 — Exact Match Engine
- Phase 3 — AST Structural Engine
- Phase 4 — N-Gram & Similarity Engine
- Phase 5 — Comparison UI (Monaco side-by-side diff)
- Phase 6 — Batch & Reference Analysis
- Phase 7 — Code Execution & Testing (Python/Docker)
- Phase 8 — AI-Assisted Analysis (Gemini provider)
- Phase 9 — Report Generation (PDF)
- Phase 10 — Backend Integration
- Phase 11 — Backend API Hardening
- Phase 12 — Frontend Foundation
- Phase 13 — Frontend Results & Analysis UX
- Phase 14 — End-to-End Evaluation & Release (in progress)

See `docs/roadmap.md` for what each phase actually delivered and how it was validated, and the [Known Limitations](#known-limitations) section above for what hasn't been verified yet.
