# CodeAudit — Scope

## 1. Purpose

This document defines what belongs in CodeAudit Version 1 and what does not.

The purpose is to prevent feature creep and keep implementation aligned with the product vision.

## 2. V1 In Scope

### 2.1 Source-Code Upload

Users can upload supported source-code files.

Requirements include:

- file-type validation;
- configurable maximum file size;
- configurable maximum number of files;
- total upload-size protection;
- safe filename handling;
- rejection of unsupported formats.

### 2.2 Two-File Comparison

The user can select two files and request structural comparison.

The result should include:

- similarity score;
- fingerprint/node statistics;
- N-gram statistics where applicable;
- risk interpretation;
- evidence suitable for visual inspection.

### 2.3 Reference-vs-Submission Analysis

A reference solution can be supplied separately from submissions.

The system can compare each submission against the reference using the structural analysis engine.

The reference solution is a comparison baseline, not an absolute definition of correctness.

### 2.4 Batch Comparison

Users can upload multiple submissions and compare every unique pair.

For N files, the number of unique unordered pairs is:

N(N-1)/2

V1 should impose a safe configurable upper limit.

### 2.5 Exact-Match Detection

A cryptographic hash can be calculated before expensive structural analysis.

If two files have identical content, CodeAudit can immediately identify them as exact matches.

Hash equality is not a substitute for structural analysis; it is an optimization and a separate exact-match signal.

### 2.6 AST Structural Analysis

The core comparison engine should:

1. parse supported source code using Tree-sitter or an equivalent selected parser;
2. traverse the syntax structure;
3. normalize or anonymize selected cosmetic information;
4. produce a structural representation;
5. generate N-gram fingerprints;
6. calculate a structural similarity score.

The exact normalization rules must be documented before implementation.

### 2.7 Visual Comparison

CodeAudit should provide a side-by-side code comparison interface, using Monaco Editor or another suitable editor component if confirmed during implementation.

The visual layer should help users investigate why two files were flagged.

### 2.8 Code Testing

Where a supported execution environment exists, users can provide test cases and execute submissions against them.

The result should include:

- passed tests;
- failed tests;
- execution status;
- execution time where available;
- error/timeout status.

Code execution must be isolated from the main application process.

### 2.9 AI-Assisted Analysis

AI-related analysis is an independent feature.

CodeAudit may send source code or an appropriate representation to a selected external AI-analysis service when configured.

The UI must describe the result as a probabilistic indicator, such as an AI-likelihood score, rather than proof that AI authored a specific percentage of the code.

The exact provider, API, pricing, limits, data policy, and reliability must be evaluated before implementation.

### 2.10 Result Summary

A result page should present independent signals clearly:

- functional correctness;
- exact match status;
- structural similarity;
- AI-analysis indicator;
- warnings and limitations.

The application should avoid pretending that these values are one scientifically validated universal score.

### 2.11 PDF Reporting

V1 may generate an analysis report containing:

- analyzed files;
- timestamps;
- hashes;
- test results;
- structural similarity results;
- AI-analysis result if available;
- relevant evidence;
- limitations/disclaimer.

## 3. V1 Out of Scope

The following are intentionally excluded:

- login/signup;
- authentication;
- authorization roles;
- teacher dashboards;
- student dashboards;
- course management;
- classroom management;
- assignment management;
- permanent user profiles;
- persistent student records;
- database-backed history;
- messaging;
- notifications;
- social features;
- LMS integration;
- payment systems;
- microservice architecture;
- Kubernetes;
- permanent source-code hosting.

## 4. Future Possibilities

Potential future features include:

- authenticated workspaces;
- saved analysis history;
- GitHub/GitLab repository imports;
- semantic similarity analysis;
- additional execution sandboxes;
- custom scoring policies;
- assignment templates;
- institutional integrations;
- team/project workspaces.

These are not V1 commitments.

## 5. Scope Rule

Any new feature must answer:

1. Does it directly support code analysis, comparison, testing, or integrity verification?
2. Does it materially improve the core workflow?
3. Can it be implemented without undermining V1 simplicity and security?

If not, it should be deferred.
