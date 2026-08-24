# CodeAudit — Requirements Specification

## 1. Functional Requirements

### FR-01: File Upload

The system shall allow anonymous users to upload supported source-code files without requiring login, signup, authentication, or user roles.

The upload workflow shall support both individual submissions and classroom-sized batches.

The initial supported languages are:

- Python
- C
- C++
- Java
- JavaScript
- TypeScript

The user shall select a programming language for each upload request.

One upload request shall contain files belonging to one selected programming language.

### FR-02: File Validation

The system shall validate every uploaded file before analysis.

Validation shall include:

- supported file extension;
- compatibility with the selected programming language;
- maximum individual file size;
- maximum number of files;
- aggregate source-file size;
- safe filename handling.

The maximum individual source-file size shall be 1 MB.

The maximum number of files in one upload request shall be 100.

The maximum aggregate source-file size shall be 100 MB.

The aggregate capacity shall therefore scale with the number of uploaded files, while never exceeding the 100 MB request maximum.

A file whose extension is unsupported shall be rejected.

A file whose extension does not correspond to the selected language shall be rejected.

Mixed-language batches shall be rejected.

If any file violates the upload policy, the complete upload request shall be rejected rather than partially accepted.

Client-provided filenames shall be treated as metadata only and shall never be used directly as filesystem paths.

Validation shall occur before expensive analysis operations.

### FR-03: Exact Hashing

The system shall calculate a cryptographic content hash for uploaded files.

### FR-04: Pairwise Comparison

The system shall allow two supported files to be structurally compared.

### FR-05: Batch Comparison

The system shall support configurable batch comparison of multiple files.

### FR-06: Reference Solution

The system shall allow a user to designate one uploaded file as a reference solution.

### FR-07: Structural Parsing

The system shall parse supported source code into a syntax representation.

### FR-08: Structural Normalization

The system shall normalize selected cosmetic elements so that superficial changes do not dominate comparison.

### FR-09: Fingerprint Generation

The system shall generate structural fingerprints from normalized syntax information.

### FR-10: Similarity Calculation

The system shall calculate a mathematically defined structural similarity value.

### FR-11: Evidence

The system shall expose useful structural statistics and comparison evidence where available.

### FR-12: Visual Diff

The system shall display selected files side by side for investigation.

### FR-13: Test Cases

The system shall accept test cases for supported execution workflows.

### FR-14: Safe Execution

The system shall execute submitted code only inside an isolated and resource-limited environment.

### FR-15: Test Result Reporting

The system shall report pass, fail, runtime error, compilation error, timeout, and unavailable-execution states where applicable.

### FR-16: AI Analysis

The system shall optionally invoke a configured external AI-analysis service.

### FR-17: AI Result Qualification

The system shall present AI-analysis results as probabilistic indicators and shall not state that the result proves AI authorship.

### FR-18: Result Summary

The system shall provide a consolidated analysis result without incorrectly merging independent metrics into a scientifically unsupported universal score.

### FR-19: Report Generation

The system shall optionally generate a downloadable report.

### FR-20: Temporary Data Handling

The system shall remove temporary uploaded/processed data after the analysis lifecycle unless a future feature explicitly requires retention.

## 2. Non-Functional Requirements

### NFR-01: Security

The application shall validate all uploads and requests and protect expensive endpoints against abuse.

### NFR-02: Rate Limiting

The API shall use rate limiting, with stricter limits for expensive parsing, batch, execution, and AI-analysis operations.

### NFR-03: Resource Limits

The system shall enforce configurable limits for file size, request size, batch size, execution time, memory where enforceable, and analysis workload.

For V1 source-code uploads:

- individual file size shall be limited to 1 MB;
- upload batch size shall be limited to 100 files;
- aggregate source-file size shall be limited to 100 MB per request.

The limits shall be centralized so they can be changed without modifying unrelated upload or analysis logic.

### NFR-04: No Unnecessary Persistence

V1 shall not require a database.

### NFR-05: Privacy

Source code shall not be retained after the analysis lifecycle by default.

### NFR-06: Reliability

Malformed source code, unsupported syntax, parser failures, compilation failures, runtime errors, and external AI-service failures shall produce controlled errors rather than crashing the application.

### NFR-07: Explainability

Similarity results should expose enough information for a user to understand the basis of the result.

### NFR-08: Maintainability

Backend analysis components should have clear module boundaries so individual engines can be tested independently.

### NFR-09: Extensibility

Adding another supported language or analysis provider should not require rewriting unrelated components.

### NFR-10: Deployment

The application should be deployable as a conventional frontend plus backend service without requiring a complex distributed infrastructure.

## 3. Constraints

- No authentication in V1.
- No persistent user database in V1.
- Anonymous upload is allowed.
- Anonymous upload increases security requirements.
- AI analysis depends on an external provider and therefore cannot be guaranteed to be available or deterministic.
- Code execution must not run with the privileges of the primary web server.

## 4. Acceptance Philosophy

A feature is not complete merely because the happy path works.

Each core feature should be tested for:

- valid input;
- invalid input;
- malformed input;
- boundary conditions;
- resource exhaustion;
- dependency failure;
- cleanup;
- expected output.
