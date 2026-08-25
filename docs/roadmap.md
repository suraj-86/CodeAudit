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

## Phase 2 — Exact Match Engine

Goal: implement cheap deterministic comparison.

Tasks:

- SHA-256 hashing;
- exact-match detection;
- hash display;
- tests.

Exit condition:

Identical files are detected reliably without running expensive structural analysis.

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

## Phase 7 — Code Execution & Testing

Goal: evaluate functional correctness.

Tasks:

- test-case model;
- execution manager;
- sandbox/isolated worker;
- compiler/interpreter integration;
- timeout handling;
- result reporting.

Exit condition:

Supported languages can safely execute controlled test cases.

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

## Backend-First Implementation Sequence

The roadmap phases define product capabilities, but implementation may be sequenced to stabilize backend capabilities before dependent frontend interfaces.

The backend-first sequence is:

1. Phase 1 — File Upload & Validation backend
2. Phase 2 — Exact Match Engine
3. Phase 3 — AST Structural Engine
4. Phase 4 — N-Gram & Similarity Engine
5. Phase 6 — Batch & Reference Analysis backend
6. Phase 7 — Code Execution & Testing backend
7. Phase 8 — AI-Assisted Analysis backend
8. Phase 9 — Reports backend
9. Frontend implementation and integration
10. Phase 10 — Hardening & Evaluation

Frontend tasks defined by earlier phases are intentionally deferred until the corresponding backend contracts and result models are sufficiently stable.

This sequencing does not remove frontend work from V1 and does not change the capability requirements of the existing phases.

## Project ZIP Ingestion Milestone

Project ZIP ingestion will be implemented as a dedicated backend capability after the initial file-upload foundation.

The project-upload workflow will remain separate from the individual-file upload endpoint and will produce source-file analysis units for the existing analysis pipeline.

The initial implementation supports direct ZIP upload only. GitHub/GitLab repository imports remain outside the initial implementation.

## Development Rule

Every phase follows:

Inspect → Design → Implement → Test → Review → Commit → Push.

No phase should silently expand into unrelated functionality.

At the end of meaningful phases, update the relevant documentation.
