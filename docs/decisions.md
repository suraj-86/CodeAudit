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

