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

Goal: convert structural representations into deterministic similarity
measurements and an initial risk interpretation.

Tasks:

- N-gram generation;
- Jaccard calculation;
- similarity result model;
- thresholds/risk interpretation;
- controlled clone experiments.

### Implementation Completed

Phase 4 currently includes:

- configurable overlapping N-gram generation;
- validation of N-gram size;
- set-based Jaccard similarity;
- a structural similarity result model;
- threshold-based structural comparison;
- configurable similarity-risk classification;
- validation of similarity and threshold ranges;
- validation of strictly increasing risk thresholds;
- controlled clone experiments.

The N-gram implementation:

- generates overlapping N-grams from the structural sequence;
- accepts a configurable positive integer window size;
- returns an empty sequence when the requested window is larger than the input sequence;
- preserves duplicate N-grams;
- represents each N-gram as its structural elements joined by `|`;
- rejects invalid N-gram sizes.

The similarity implementation treats N-grams as sets for Jaccard
calculation. Duplicate N-grams remain available from the generation
stage but do not increase the set-based similarity score.

The comparison result contains:

- similarity;
- threshold;
- suspicious flag.

The suspicious flag is set when similarity is greater than or equal to
the configured threshold.

Risk classification provides:

- Low;
- Moderate;
- High;
- Very High.

Risk thresholds are configurable and must be within `0` to `1` and strictly
increasing. The current test thresholds validate implementation behavior
only and are not established as universal plagiarism thresholds.

### Controlled Clone Validation

The controlled experiments currently verify that:

- Type-1-style formatting/comment changes can preserve similarity `1`;
- Type-2-style identifier renaming can preserve similarity `1`;
- Type-3-style structural modification produces partial similarity;
- unrelated programs produce lower similarity than the controlled clone
  examples.

These experiments validate the current structural representation and
comparison behavior. They do not by themselves establish scientifically
universal plagiarism thresholds.

The N-gram window size remains an implementation parameter and should be
selected through controlled experiments rather than assumed to be
universally optimal.

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

**Status: DEFERRED**

### Reason for Deferral

Phase 5 was intentionally deferred during the V1 backend development
cycle.

The project is being implemented using a backend-first workflow so that
the analysis pipeline can be completed, tested, and stabilized before the
frontend is built around it.

The decision was made to avoid prematurely coupling the UI to analysis
contracts that were still evolving through Phases 3, 4, and 6.

In particular, Phase 6 introduced a substantially larger analysis workflow
than the original two-file comparison flow:

- multiple submissions;
- bounded batch collection;
- unique submission-pair generation;
- pairwise comparison;
- pairwise similarity matrix generation;
- suspicious-pair filtering and ranking;
- reference-solution analysis;
- batch orchestration.

Building the UI before these backend contracts were stabilized would have
created unnecessary rework.

Therefore, Phase 5 is not considered abandoned. It is deliberately
postponed until the backend analysis pipeline is sufficiently complete.

The UI will be implemented later against the finalized backend contracts,
with the intention of producing a more coherent and complete interface
rather than repeatedly modifying the frontend as backend capabilities
change.

**Status: DEFERRED — intentionally postponed until backend analysis is
stabilized.**

---

## Phase 6 — Batch & Reference Analysis

Goal: support practical coding-test workflows.

Tasks:

- multiple submissions;
- reference solution;
- pairwise matrix;
- suspicious-pair ranking;
- safe batch limits.

### Implementation Completed

Phase 6 extends the single-comparison analysis model into a bounded batch
analysis pipeline.

The implementation currently includes:

- a `BatchSubmission` model;
- explicit batch-size validation;
- a maximum batch size of `100` submissions;
- rejection of empty batches;
- rejection of batches exceeding the configured limit;
- unique unordered submission-pair generation;
- deterministic pair generation without duplicate reverse pairs;
- pairwise exact/similarity comparison;
- pairwise similarity matrix generation;
- suspicious-pair filtering;
- suspicious-pair ranking by similarity;
- reference-solution comparison;
- reference-batch analysis;
- batch orchestration;
- focused tests for each batch-analysis component.

### Batch Submission Model

A batch submission is represented using:

- `id`;
- `name`;
- `language`;
- `source`.

The model provides a small, explicit representation of the source
submission required by the batch-analysis pipeline.

### Safe Batch Limits

The batch subsystem uses the existing upload-limit configuration and
enforces:

- minimum valid batch size of one submission;
- maximum batch size of `100` submissions;
- rejection of an empty batch;
- rejection of a batch containing more than `100` submissions.

The maximum is intentionally bounded because pairwise comparison grows
quadratically with the number of submissions.

For `N` submissions, the number of unique unordered comparison pairs is:

`N × (N - 1) / 2`

Therefore, a batch of `100` submissions produces:

`100 × 99 / 2 = 4,950`

unique comparison pairs.

This provides a predictable upper bound for the current V1 batch-analysis
implementation.

### Submission Pair Generation

The pair-generation component creates every unique unordered pair exactly
once.

For three submissions:

- A-B
- A-C
- B-C

The reverse pairs are not generated separately:

- B-A is not generated;
- C-A is not generated;
- C-B is not generated.

The implementation therefore produces exactly `N × (N - 1) / 2` pairs.

This component is intentionally isolated from similarity calculation so
that pair generation remains deterministic and independently testable.

### Pair Comparison

Each generated submission pair can be passed through the comparison
pipeline.

The comparison layer provides the pair-level analysis result required by
the matrix and ranking stages.

The implementation keeps pair generation separate from comparison so that
the system does not mix collection concerns with analysis logic.

### Pairwise Similarity Matrix

The matrix component converts pairwise comparison results into a
structured representation of relationships between submissions.

The matrix is intended to provide the foundation for later presentation
and higher-level analysis.

This separates the underlying analysis data from the future UI layer.

### Suspicious-Pair Ranking

The ranking component operates on pairwise analysis results and:

- filters out non-suspicious pairs;
- retains suspicious pairs;
- ranks suspicious pairs by similarity;
- orders higher-similarity pairs ahead of lower-similarity pairs.

This creates a prioritized result set that can later be consumed by the UI
or reporting layer.

Non-suspicious comparisons are excluded from the suspicious-pair ranking
rather than being presented as suspicious findings.

### Reference-Solution Analysis

Phase 6 also introduces reference-solution analysis.

The reference analysis provides a separate comparison path for evaluating
submissions against a known reference implementation.

This is kept distinct from peer-to-peer suspicious-pair analysis because
the two comparisons answer different questions:

- peer comparison identifies potentially similar submissions;
- reference comparison evaluates similarity against the intended solution.

The reference-analysis component is independently tested and can be used
by the batch orchestration layer.

### Batch Orchestration

The batch orchestration component connects the individual Phase 6
components into a higher-level workflow.

The orchestration layer is responsible for coordinating:

1. batch validation;
2. submission collection;
3. pair generation;
4. pairwise comparison;
5. matrix generation;
6. suspicious-pair ranking;
7. reference analysis when applicable.

The individual analysis components remain independently testable rather
than being embedded into one large implementation.

### Testing

Phase 6 was implemented incrementally with focused tests for:

- batch limits;
- batch submission modeling;
- batch validation;
- submission-pair generation;
- pair comparison;
- similarity matrix generation;
- suspicious-pair ranking;
- reference analysis;
- batch orchestration.

The implementation was validated using:

- focused TypeScript test execution;
- `npm run typecheck`;
- `npm run build`.

The Phase 6 implementation passed the relevant focused tests, typechecking,
and build validation before being committed and pushed to the repository.

### Architectural Boundary

Phase 6 intentionally does **not** introduce:

- frontend UI;
- new frontend workflows;
- API integration for the batch engine;
- code execution;
- sandboxing;
- AI analysis;
- report generation.

Those concerns remain separate roadmap phases.

The purpose of Phase 6 is to establish the backend batch-analysis
foundation before integrating it into later application layers.

Exit condition:

A practical-test batch can be analyzed without manual pair-by-pair uploads.

**Exit condition achieved for the current backend implementation.**

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

Documentation must reflect the actual implemented behavior rather than
planned or assumed behavior.

Algorithmic changes must be reflected in the relevant specification before
they become part of the official implementation.