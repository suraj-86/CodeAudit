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

- research suitable providers;
- evaluate API availability and terms;
- create provider adapter;
- implement timeout/failure handling;
- normalize provider output;
- add clear disclaimer;
- avoid presenting AI probability as proof.

Exit condition:

The feature works independently from the AST engine and fails gracefully when unavailable.

**Status: NOT STARTED**

---

## Phase 9 — Reports

Goal: provide a professional result artifact.

Tasks:

- report layout;
- hashes;
- correctness;
- similarity;
- AI indicator;
- evidence;
- disclaimer;
- PDF generation.

Exit condition:

A user can generate a coherent report from an analysis.

**Status: NOT STARTED**

---

## Phase 10 — Hardening & Evaluation

Goal: prepare for demonstration and deployment.

Tasks:

- security testing;
- rate-limit testing;
- malformed-input testing;
- memory/load testing;
- parser failure testing;
- execution isolation testing;
- AI-provider failure testing;
- UI polish;
- deployment testing;
- documentation verification.

Exit condition:

The V1 workflow is stable and demonstrable.

**Status: NOT STARTED**

---

## Development Rule

Every phase follows:

```text
Inspect → Design → Implement → Test → Review → Commit → Push
```

No phase should silently expand into unrelated functionality.

At the end of meaningful phases, update the relevant documentation.
