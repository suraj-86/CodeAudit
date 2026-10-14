# CodeAudit

> A lightweight code analysis, comparison, testing, and integrity-verification tool.

**Live:** [code-audit-theta.vercel.app](https://code-audit-theta.vercel.app)

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

CodeAudit can use an external AI-analysis service when configured.

The current V1 implementation uses Google Gemini through `@google/genai`, behind an `AIAnalysisProvider` abstraction and `AIAnalysisService`. The default model is `gemini-3.5-flash`.

Configuration is environment-based:

- `GEMINI_API_KEY` — API credential;
- `GEMINI_MODEL` — optional model override;
- `GEMINI_TIMEOUT_MS` — optional timeout in milliseconds, default 15000.

The AI endpoint accepts a programming language and source code and returns a normalized result containing availability, provider, indicator, label, confidence, observations, disclaimer, and controlled error information when unavailable.

AI results are presented as probabilistic indicators and are **not treated as proof of AI authorship**. They remain independent of AST structural similarity, exact matching, and functional correctness.

### 6. Explainable Results

Where possible, CodeAudit provides supporting information such as:

- hashes;
- structural statistics;
- N-gram statistics;
- similarity values;
- matching patterns;
- visual source comparison.
