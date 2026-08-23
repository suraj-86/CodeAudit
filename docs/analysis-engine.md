# CodeAudit — Analysis Engine Specification

## 1. Purpose

This document defines the conceptual analysis model used by CodeAudit.

The system intentionally separates three questions:

1. Does the program work?
2. Is its structure suspiciously similar to another program?
3. Does an independent AI-analysis service indicate possible AI assistance?

These questions must not be conflated.

## 2. Exact Content Matching

Every source file can first receive a cryptographic hash.

If two hashes are identical, the system can report an exact content match.

This is useful because it is:

- deterministic;
- fast;
- inexpensive.

It does not detect renamed variables, formatting changes, inserted statements, or other transformations.

## 3. Structural Analysis

The structural engine converts source code into a normalized structural representation.

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
Linear Structural Sequence
   ↓
N-Grams
   ↓
Similarity
```

## 4. Structural Traversal

The traversal should identify meaningful structural node categories while avoiding over-reliance on cosmetic content.

Examples may include:

- function declarations;
- loops;
- conditional statements;
- return statements;
- expressions;
- assignments;
- calls;
- array/member access.

The exact node allowlist/normalization rules must be defined from the selected Tree-sitter grammars and validated experimentally.

## 5. Anonymization

The system should avoid allowing superficial identifiers to dominate the fingerprint.

For example:

```text
sum += numbers[i]
```

and:

```text
total += values[index]
```

may produce similar structural representations.

However, normalization must be designed carefully. Over-normalization can cause unrelated programs to appear similar.

## 6. N-Gram Fingerprinting

Let the normalized structural sequence be:

S = [s1, s2, ..., sk]

For a selected window size q, an N-gram is:

(s_i, s_{i+1}, ..., s_{i+q-1})

Overlapping windows preserve local structural patterns.

The window size should be configurable internally and selected through experiments rather than assumed to be universally optimal.

## 7. Similarity

For two sets A and B, the basic Jaccard similarity is:

J(A,B) = |A ∩ B| / |A ∪ B|

The implementation must document whether fingerprints are treated as sets, multisets, weighted features, or another representation.

V1 should begin with a clear deterministic formulation and test it against known examples.

## 8. Structural Risk Interpretation

Similarity percentages should not automatically be treated as proof of plagiarism.

A configurable interpretation can be used, for example:

- Low;
- Moderate;
- High;
- Very High.

Thresholds must be experimentally justified and documented.

They should be treated as indicators for investigation, not judicial or academic proof.

## 9. Reference Comparison

A reference solution is a baseline.

A submission may be structurally similar to the reference because it is legitimately implementing the expected algorithm.

Therefore:

Reference similarity should be interpreted differently from submission-to-submission similarity.

The UI should clearly distinguish:

- similarity to reference;
- similarity to another submission.

## 10. Code Correctness

Correctness should primarily be determined through execution against test cases when execution is available.

Possible states:

- Passed;
- Failed;
- Compilation Error;
- Runtime Error;
- Timeout;
- Unsupported;
- Execution Unavailable.

Correctness is independent of structural similarity.

A completely different but correct solution should be allowed to receive a high correctness score and low structural similarity.

## 11. AI-Assisted Analysis

AI analysis is a separate pipeline:

```text
Source Code
    ↓
AI Analysis Adapter
    ↓
External Provider
    ↓
Provider Result
    ↓
Normalized AI Indicator
```

The system should not claim:

“72% of this code was written by AI.”

Instead, it should use wording such as:

“AI-generated likelihood indicator: 72%.”

The exact interpretation depends on the selected provider.

The result must include provider/availability information where appropriate.

## 12. AI Limitations

AI-code detection is probabilistic and can produce false positives and false negatives.

Therefore:

- it should not be treated as proof;
- it should not automatically determine plagiarism;
- it should not be merged blindly with AST similarity;
- provider limitations must be disclosed.

## 13. Combined Results

CodeAudit may present several independent indicators together:

```text
Correctness:             9/10 tests
Exact Match:             No
Structural Similarity:   86.2%
AI Indicator:            71%
```

The system may provide a high-level investigation flag using transparent rules, but V1 should avoid presenting a scientifically unsupported “AI + plagiarism + correctness” formula as a single truth score.

## 14. Explainability

A structural similarity result should expose, where feasible:

- source filenames;
- hash values;
- node counts;
- fingerprint counts;
- N-gram counts;
- intersection size;
- union size;
- similarity formula/result;
- matching structural patterns;
- visual comparison.

## 15. Experimental Validation

Before finalizing thresholds, the engine should be tested against controlled examples:

1. exact copies;
2. formatting changes;
3. variable renaming;
4. comment changes;
5. literal changes;
6. inserted statements;
7. deleted statements;
8. reordered logic;
9. legitimately different implementations;
10. unrelated programs.

The goal is to measure both useful detections and false positives.

## 16. Source of Truth Rule

Algorithmic changes must be reflected in this document before they become part of the official implementation specification.
