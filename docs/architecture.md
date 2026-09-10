# CodeAudit — System Architecture

## 1. Architectural Goal

CodeAudit V1 uses a lightweight service architecture with clear internal modules.

The preferred high-level structure is:

Frontend → HTTP API → Analysis Orchestrator → Independent Analysis Engines

V1 does not require a database or authentication service.

## 2. High-Level Architecture

```text
┌───────────────────────────────┐
│           Browser             │
│      CodeAudit Web UI         │
└───────────────┬───────────────┘
                │ HTTP/JSON + uploads
                ▼
┌───────────────────────────────┐
│        Backend API            │
│ Upload / Validation / Limits  │
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│      Analysis Orchestrator    │
└──────┬─────────┬─────────┬────┘
       │         │         │
       ▼         ▼         ▼
   Hashing     AST      Testing
               Engine    Engine
       │         │         │
       │         ▼         │
       │      Similarity   │
       │         │         │
       └────┬────┴────┬────┘
            │         │
            ▼         ▼
       AI Provider   Reporting
```

## 3. Frontend

The frontend is a lightweight single-page application.

Responsibilities:

- upload files;
- select analysis mode;
- configure test cases where supported;
- display progress/status;
- display scores and evidence;
- render code comparison;
- display errors and limitations;
- initiate report generation/download.

The frontend should not contain security-sensitive analysis logic.

## 4. Backend API

Responsibilities:

- validate incoming requests;
- enforce rate limits;
- enforce upload limits;
- manage temporary file/content buffers;
- identify languages;
- invoke analysis engines;
- normalize results into API response models;
- handle external provider errors;
- initiate report generation;
- ensure cleanup.

## 5. Analysis Orchestrator

The orchestrator coordinates independent engines.

A conceptual request may flow as:

```text
Request
  ↓
Validation
  ↓
Hashing
  ↓
Language Detection
  ↓
Selected Analysis Engines
  ↓
Result Normalization
  ↓
Response
```

The orchestrator should not implement the AST algorithm itself.

## 6. AST Analysis Engine

Responsibilities:

1. parser selection;
2. syntax-tree generation;
3. structural traversal;
4. normalization;
5. fingerprint generation;
6. N-gram generation;
7. similarity calculation;
8. structural evidence generation.

The AST engine should be language-aware at the parsing layer but language-agnostic at the comparison layer where possible.

## 7. Testing Engine

The testing engine manages execution requests but should not execute untrusted code directly inside the API process.

The Phase 7 implementation now concretely uses:

```text
API / Analysis Layer
        ↓
Execution Manager
        ↓
Language-specific Execution Worker
        ↓
Docker Execution Worker
        ↓
Docker Runtime
        ↓
Python Interpreter / Test Runner
        ↓
Test Case Results
        ↓
Execution Result
```

The execution subsystem separates language selection from language-specific execution.

The current registry provides a Python execution worker. If no worker is registered for a requested language, the system reports `Unsupported` rather than silently selecting another runtime.

The execution model includes:

- `TestCase`;
- `ExecutionRequest`;
- `TestCaseResult`;
- `ExecutionResult`;
- `ExecutionWorker`;
- `ExecutionManager`;
- `DefaultExecutionManager`;
- `DockerExecutionWorker`.

### Execution Controls

The current V1 execution baseline includes:

- isolated Docker execution;
- execution timeout;
- output-size limiting;
- container cleanup;
- controlled input/output handling.

The current Docker baseline is not treated as complete production-grade sandbox hardening. Stronger resource and privilege controls remain part of the later hardening phase.

### Execution Failure States

The execution layer distinguishes:

- `Passed`;
- `Failed`;
- `Compilation Error`;
- `Runtime Error`;
- `Timeout`;
- `Unsupported`;
- `Execution Unavailable`.

## 8. AI Analysis Adapter

The AI feature should use an adapter abstraction:

```text
AI Analysis Interface
        │
 ┌──────┴─────────┐
 │                │
Provider A     Provider B
```

The rest of CodeAudit should not depend directly on a single provider.

The adapter should normalize provider-specific output into an internal model.

## 9. Reporting Engine

The reporting layer receives normalized analysis results and generates a human-readable report.

It should not perform analysis itself.

## 10. Temporary Data Lifecycle

The intended lifecycle is:

```text
Upload
  ↓
Validate
  ↓
Process in memory / controlled temporary storage
  ↓
Analyze
  ↓
Return results
  ↓
Generate report if requested
  ↓
Cleanup
```

No permanent storage is required for V1.

## 11. Security Architecture

Important controls:

- request rate limiting;
- endpoint-specific rate limits;
- file-size limits;
- batch-size limits;
- input validation;
- language allowlist;
- execution isolation;
- execution timeout;
- resource/output limits;
- cleanup;
- secure headers;
- CORS configuration;
- dependency hygiene.

Phase 7 adds the first concrete isolated execution implementation through Docker. Stronger execution hardening remains a Phase 10 concern.

## 12. Architectural Principle

The system should remain modular without becoming over-engineered.

V1 should be a modular application, not a distributed microservice platform.
