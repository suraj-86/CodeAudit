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

**Project structure:**

- `client/` — React frontend
- `server/` — Express backend
- `docs/` — project source-of-truth documentation

**Decision:** V1 will not use a database or Docker as part of the initial foundation.

**Reason:** This stack provides a lightweight, maintainable TypeScript-based foundation suitable for CodeAudit's scope without introducing unnecessary infrastructure.

## Decision 017 — Upload Policy

**Decision:** CodeAudit V1 will enforce the following anonymous upload policy:

- maximum individual source file size: 1 MB;
- maximum files per upload request: 100;
- maximum aggregate source-file size per request: 100 MB;
- aggregate source-file capacity scales with the number of uploaded files, subject to the 100 MB request maximum;
- one upload request must use one selected programming language;
- every uploaded file must have an extension supported by the selected language;
- unsupported extensions are rejected;
- files whose detected extension does not match the selected language are rejected;
- mixed-language batches are rejected;
- client-provided filenames are treated as metadata and must never be used as filesystem paths.

**Initial supported languages:**

- Python
- C
- C++
- Java
- JavaScript
- TypeScript

**Reason:** CodeAudit must support practical classroom-sized batch uploads while maintaining predictable resource limits. A 1 MB individual file limit is sufficient for normal programming-test submissions, while allowing up to 100 files supports a typical class-sized batch. Language-specific validation prevents incompatible submissions from entering the analysis pipeline.

The upload policy applies before analysis and is independent of later AST, execution, or AI-analysis capabilities.