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

Implementation completed for the current V1 structural-analysis increment includes:

- Tree-sitter-based C++ parsing;
- recursive structural traversal;
- representation using named syntax-node types;
- explicit representation of selected structural operators;
- normalization behavior that avoids using identifier and literal text directly in the structural sequence;
- structural sequence generation;
- deterministic structural fingerprint generation using SHA-256;
- controlled tests for identifier renaming;
- controlled tests for literal-value changes;
- controlled tests for operator changes;
- controlled tests for structural changes;
- controlled tests for structurally equivalent implementations;
- deterministic fingerprint tests.

Exit condition:

Controlled examples produce stable structural representations.

**Exit condition achieved for the current implementation.**

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

### Current Progress

N-gram generation has been implemented and tested.

The current N-gram implementation:

- generates overlapping N-grams from the structural sequence;
- accepts a configurable positive integer window size;
- returns an empty sequence when the requested window is larger than the input sequence;
- preserves duplicate N-grams;
- represents each N-gram as its structural elements joined by `|`;
- rejects invalid N-gram sizes.

The following Phase 4 tasks remain:

- Jaccard calculation;
- similarity result model;
- thresholds/risk interpretation;
- controlled clone experiments.

The N-gram window size remains an implementation parameter and should be selected through controlled experiments rather than assumed to be universally optimal.

Exit condition:

Type-1, Type-2, and selected Type-3 examples can be meaningfully compared.

**Status: IN PROGRESS**

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

**Status: NOT STARTED**

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

Exit condition:

Supported languages can safely execute controlled test cases.

**Status: NOT STARTED**

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

Inspect → Design → Implement → Test → Review → Commit → Push.

No phase should silently expand into unrelated functionality.

At the end of meaningful phases, update the relevant documentation.

Documentation must reflect the actual implemented behavior rather than planned or assumed behavior.

Algorithmic changes must be reflected in the relevant specification before they become part of the official implementation.