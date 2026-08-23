# CodeAudit

> A lightweight code analysis, comparison, testing, and integrity-verification tool.

## Overview

CodeAudit is designed to make source-code analysis accessible without requiring accounts, authentication, or a persistent database.

A user can upload source-code files, select an analysis workflow, and receive results covering functional correctness, exact matches, structural similarity, and optional AI-assisted analysis.

CodeAudit is intentionally a **tool**, not a classroom-management system.

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

CodeAudit can optionally use an external AI-analysis service.

This is intentionally independent of the AST engine.

AI results are presented as probabilistic indicators and are **not treated as proof of AI authorship**.

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

**Stage:** Project definition and documentation.

Implementation has not yet begun.

## License

To be decided before the first public release.
