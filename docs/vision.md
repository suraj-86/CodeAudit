# CodeAudit — Product Vision

## 1. Overview

CodeAudit is a lightweight web-based code analysis, comparison, testing, and integrity-verification tool.

The product is intentionally designed as a simple utility rather than a full learning-management system. A user can open CodeAudit, upload source-code files, optionally provide a reference solution and test cases, run an analysis, inspect the results, and optionally generate a report.

CodeAudit does not require user accounts, login, signup, student records, teacher records, courses, classes, or a persistent application database in Version 1.

## 2. Product Vision

The vision of CodeAudit is to provide one accessible place where source code can be examined from several independent perspectives:

1. Is the code functionally correct?
2. How structurally similar is it to another piece of code?
3. Are multiple submissions likely to be structural clones?
4. How similar is a submission to a supplied reference solution?
5. Does an external AI-analysis service indicate that the code may be AI-assisted or AI-generated?
6. What concrete evidence supports the reported result?

The system should prioritize explainability over unexplained percentages.

## 3. Primary Use Case

A practical coding instructor or evaluator has a programming problem, one or more reference solutions, and several submitted source files.

Instead of manually inspecting every file, the evaluator can upload the relevant files to CodeAudit and obtain:

- functional test results, where execution is enabled;
- structural similarity scores;
- pairwise similarity results;
- visual comparison evidence;
- an independent AI-analysis indicator, where an external service is available;
- an optional downloadable report.

The tool is not limited to teachers. Developers, students, reviewers, interviewers, or researchers may use the same functionality.

## 4. Core Product Principles

### 4.1 Lightweight

CodeAudit should remain easy to run locally and deploy without requiring accounts, a database, or complex infrastructure.

### 4.2 Analysis First

The product exists to analyze code. User-management features are not part of the V1 product identity.

### 4.3 Independent Analysis Signals

Different questions should use different analysis mechanisms:

- execution answers functional-correctness questions;
- AST analysis answers structural-similarity questions;
- AI-analysis services provide an independent probabilistic AI-related indicator.

The AST engine must not be presented as an AI-authorship detector.

### 4.4 Explainability

A score should be accompanied by useful evidence whenever technically possible.

### 4.5 Privacy by Default

Uploaded source code should be treated as temporary analysis data. V1 should avoid persistent storage unless a feature explicitly requires it.

### 4.6 Defensive Engineering

Because anonymous users can upload files and potentially request code execution, resource limits, rate limiting, validation, isolation, and cleanup are core requirements rather than optional extras.

## 5. Target Users

CodeAudit has no account-specific user model in V1. Its target users are people who need to inspect source code:

- instructors evaluating practical programming work;
- students checking their own code;
- interviewers reviewing coding submissions;
- developers comparing implementations;
- reviewers investigating suspiciously similar code.

## 6. Product Boundary

CodeAudit is an analysis utility, not:

- a classroom-management platform;
- an LMS;
- a student information system;
- an assignment-management system;
- an identity-management system;
- a permanent code-hosting platform.

## 7. V1 Success Criteria

V1 should make the following workflow reliable:

Upload → Validate → Analyze → Explain → Compare → Report.

A successful V1 should allow a user to compare source files structurally, optionally evaluate them against test cases, optionally obtain an external AI-analysis result, and understand the evidence behind the results.

## 8. Long-Term Direction

Future versions may add persistent projects, saved analyses, authenticated workspaces, richer execution environments, more sophisticated semantic analysis, or integrations with repositories and educational systems.

Those features are explicitly outside the V1 boundary unless a later decision changes the scope.
