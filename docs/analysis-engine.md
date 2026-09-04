# CodeAudit --- Analysis Engine Specification

## 1. Purpose

This document defines the conceptual analysis model used by CodeAudit.

The system intentionally separates three questions:

1.  Does the program work?
2.  Is its structure suspiciously similar to another program?
3.  Does an independent AI-analysis service indicate possible AI
    assistance?

These questions must not be conflated.

------------------------------------------------------------------------

## 2. Exact Content Matching

Every source file can first receive a cryptographic hash.

If two hashes are identical, the system can report an exact content
match.

This is useful because it is:

-   deterministic;
-   fast;
-   inexpensive.

The current V1 implementation uses SHA-256 hashing for source content.

It does not detect renamed variables, formatting changes, inserted
statements, or other transformations.

## 2A. Project Ingestion and Analysis Units

A complete project may be provided as a ZIP archive through the
project-ingestion workflow.

Project ingestion is responsible for converting the archive into
individual source-file analysis units.

Conceptually:

``` text
Project ZIP
    ↓
Safe Extraction
    ↓
Source File Discovery
    ↓
Validation
    ↓
Source File Analysis Units
    ↓
Hashing / Structural Analysis / Testing / AI Analysis
```

------------------------------------------------------------------------

## 3. Structural Analysis

The structural engine converts source code into a deterministic
structural representation.

The Phase 3 V1 implementation currently establishes the following
pipeline:

``` text
Source Code
   ↓
Tree-sitter Parser
   ↓
Syntax Tree
   ↓
Structural Traversal
   ↓
Structural Sequence
   ↓
N-Grams
   ↓
Structural Fingerprint
```

Structural similarity comparison is a subsequent stage and is not
considered implemented merely because the structural sequence, N-grams,
and fingerprinting primitives are available.

The structural implementation currently uses the Tree-sitter C++ parser
and operates on the resulting syntax tree.

------------------------------------------------------------------------

## 4. Structural Traversal

The traversal identifies structural syntax-tree nodes while avoiding
direct dependence on most superficial source-code content.

The current V1 implementation recursively traverses the Tree-sitter
syntax tree in source order.

For named Tree-sitter nodes, the traversal records the node type:

``` text
node.type
```

For selected structural operators, the traversal records an explicit
operator representation:

``` text
OPERATOR:<operator>
```

The currently selected operator set is:

``` text
+
-
*
/
%
>
<
>=
<=
==
!=
=
```

Therefore, for example, an addition operator is represented as:

``` text
OPERATOR:+
```

while a subtraction operator is represented as:

``` text
OPERATOR:-
```

The traversal visits children recursively in their existing Tree-sitter
order.

This produces a deterministic linear structural sequence.

The current implementation does not attempt to define a complete
universal Tree-sitter node allowlist. The selected representation is a
V1 implementation choice and should continue to be validated
experimentally against the intended use cases.

Examples of structural categories represented by Tree-sitter nodes may
include:

-   function declarations/definitions;
-   parameter lists;
-   compound statements;
-   conditional statements;
-   return statements;
-   expressions;
-   assignments;
-   calls;
-   array/member access.

The exact useful node categories depend on the selected Tree-sitter
grammar.

------------------------------------------------------------------------

## 5. Structural Abstraction and Anonymization

The system should avoid allowing superficial identifiers to dominate the
structural representation.

The current V1 traversal achieves a basic form of identifier abstraction
by representing named Tree-sitter nodes using their node type rather
than their source spelling.

For example, source code containing:

``` text
int add(int a, int b) {
    return a + b;
}
```

and source code containing:

``` text
int sum(int first, int second) {
    return first + second;
}
```

can produce the same relevant structural representation because the
actual identifier spellings are not inserted into the sequence.

However, normalization must be designed carefully. Over-normalization
can cause unrelated programs to appear similar.

The current implementation should therefore be treated as a structural
abstraction mechanism rather than as a complete anonymization or
semantic-equivalence system.

------------------------------------------------------------------------

## 6. N-Gram Fingerprinting

Let the normalized structural sequence be:

``` text
S = [s1, s2, ..., sk]
```

For a selected window size q, an N-gram is:

``` text
(s_i, s_{i+1}, ..., s_{i+q-1})
```

Overlapping windows preserve local structural patterns.

The V1 implementation provides configurable N-gram generation over the
structural sequence.

The implementation has been tested for:

-   3-gram generation;
-   2-gram generation;
-   N larger than the sequence length;
-   single-element N-grams;
-   preservation of duplicate N-grams;
-   rejection of an invalid N-gram size.

An N-gram size of zero is rejected rather than silently producing an
invalid representation.

The window size should remain configurable internally and should be
selected through experiments rather than assumed to be universally
optimal.

------------------------------------------------------------------------

## 7. Structural Fingerprinting

The structural fingerprint converts the generated structural sequence
into a deterministic cryptographic representation.

The current V1 implementation canonicalizes a structural sequence by
joining its elements with the `|` separator:

``` text
sequence.join("|")
```

The resulting canonical string is converted to UTF-8 bytes and hashed
using SHA-256.

Conceptually:

``` text
Structural Sequence
        ↓
Canonical Join
(sequence.join("|"))
        ↓
UTF-8 Encoding
        ↓
SHA-256
        ↓
64-character hexadecimal fingerprint
```

The V1 fingerprint implementation has been tested to verify that:

-   identical structural sequences produce identical fingerprints;
-   different structural sequences produce different fingerprints in the
    tested cases;
-   the resulting fingerprint has the expected 64-character SHA-256
    hexadecimal length.

The fingerprint is a representation of the structural sequence. It
should not itself be interpreted as a similarity percentage.

------------------------------------------------------------------------

## 8. Similarity

For two sets A and B, the basic Jaccard similarity is:

``` text
J(A,B) = |A ∩ B| / |A ∪ B|
```

The V1 similarity implementation uses N-grams as sets for the Jaccard
calculation. Duplicate N-grams are preserved during generation but do
not increase the set-based similarity score.

The similarity value is deterministic and remains within the range `0`
to `1`.

The structural comparison layer accepts a similarity threshold and
returns:

-   similarity;
-   threshold;
-   suspicious flag.

The suspicious flag is set when similarity is greater than or equal to
the configured threshold.

Invalid thresholds outside `0` to `1` are rejected.

------------------------------------------------------------------------

## 9. Structural Risk Interpretation

Similarity percentages should not automatically be treated as proof of
plagiarism.

The V1 implementation provides configurable risk classification:

-   Low;
-   Moderate;
-   High;
-   Very High.

Similarity and risk thresholds must be within `0` to `1`.

Risk thresholds must also be strictly increasing.

The current thresholds are implementation/test parameters. They are not
presented as universal academic plagiarism thresholds.

They should be treated as indicators for investigation, not judicial or
academic proof.

------------------------------------------------------------------------

## 10. Reference Comparison

A reference solution is a baseline.

A submission may be structurally similar to the reference because it is
legitimately implementing the expected algorithm.

Therefore:

Reference similarity should be interpreted differently from
submission-to-submission similarity.

The UI should clearly distinguish:

-   similarity to reference;
-   similarity to another submission.

Phase 6 extends this distinction to batch analysis: peer-to-peer
suspicious pairs and reference-vs-submission results are reported as
separate analysis signals.

------------------------------------------------------------------------

## 11. Phase 5 UI Deferral

Phase 5, the Comparison UI, was intentionally deferred.

The project is following a backend-first implementation sequence so that
the analysis engine can be completed and stabilized before the final UI
is built around its contracts.

Phase 6 introduced additional backend results beyond the original
two-file comparison:

-   multiple submissions;
-   pairwise comparisons;
-   similarity matrix;
-   suspicious-pair ranking;
-   reference analysis;
-   batch orchestration.

Building the UI before these contracts stabilized would have caused
unnecessary frontend rework.

Phase 5 is therefore deferred, not abandoned. It will be implemented
later against the stabilized backend analysis contracts.

------------------------------------------------------------------------

## 12. Batch Analysis

Phase 6 extends the analysis engine from individual comparisons to
bounded batches of submissions.

A batch submission contains:

``` text
BatchSubmission
├── id
├── name
├── language
└── source
```

The current maximum batch size is `100` submissions.

Empty batches and batches exceeding the configured maximum are rejected.

For `N` submissions, the number of unique unordered pairs is:

``` text
N × (N - 1) / 2
```

Therefore, the maximum batch of `100` submissions produces `4,950`
unique pairs.

The batch pipeline is:

``` text
Batch
  ↓
Validation
  ↓
Unique Pair Generation
  ↓
Pair Comparison
  ↓
Similarity Matrix
  ↓
Suspicious-Pair Ranking
  ↓
Reference Analysis
```

Submission-pair generation produces every unordered pair exactly once.
For three submissions, the pairs are:

``` text
A-B
A-C
B-C
```

Reverse duplicates such as `B-A` are not generated.

The pair-comparison layer is kept separate from pair generation so that
both can be tested independently.

The pairwise matrix provides a structured representation of
relationships between submissions.

The suspicious-pair ranking layer:

-   removes non-suspicious pairs;
-   keeps suspicious pairs;
-   orders them by similarity, highest first.

The ranking is an investigation aid and is not itself proof of
plagiarism.

Reference analysis compares submissions against a supplied reference
implementation and remains separate from peer-to-peer suspicious-pair
analysis.

The batch orchestration layer coordinates validation, pair generation,
comparison, matrix generation, ranking, and reference analysis without
embedding all of the logic into one component.

Focused tests cover the Phase 6 batch components.

------------------------------------------------------------------------

## 13. Code Correctness

Correctness should primarily be determined through execution against
test cases when execution is available.

Possible states:

-   Passed;
-   Failed;
-   Compilation Error;
-   Runtime Error;
-   Timeout;
-   Unsupported;
-   Execution Unavailable.

Correctness is independent of structural similarity.

A completely different but correct solution should be allowed to receive
a high correctness score and low structural similarity.

------------------------------------------------------------------------

## 14. AI-Assisted Analysis

AI analysis is a separate pipeline:

``` text
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

> "72% of this code was written by AI."

Instead, it should use wording such as:

> "AI-generated likelihood indicator: 72%."

The exact interpretation depends on the selected provider.

The result must include provider/availability information where
appropriate.

------------------------------------------------------------------------

## 15. AI Limitations

AI-code detection is probabilistic and can produce false positives and
false negatives.

Therefore:

-   it should not be treated as proof;
-   it should not automatically determine plagiarism;
-   it should not be merged blindly with AST similarity;
-   provider limitations must be disclosed.

------------------------------------------------------------------------

## 16. Combined Results

CodeAudit may present several independent indicators together:

``` text
Correctness:             9/10 tests
Exact Match:             No
Structural Similarity:   86.2%
AI Indicator:            71%
```

The system may provide a high-level investigation flag using transparent
rules, but V1 should avoid presenting a scientifically unsupported "AI +
plagiarism + correctness" formula as a single truth score.

The currently implemented structural fingerprint should likewise remain
an intermediate deterministic representation rather than being presented
as the final plagiarism or similarity result.

------------------------------------------------------------------------

## 17. Explainability

A structural similarity result should expose, where feasible:

-   source filenames;
-   hash values;
-   node counts;
-   fingerprint counts;
-   N-gram counts;
-   intersection size;
-   union size;
-   similarity formula/result;
-   matching structural patterns;
-   visual comparison.

As the structural engine evolves, intermediate structural sequences and
N-gram information should be retained where practical so that a
similarity result can be explained rather than presented as an
unexplained score.

------------------------------------------------------------------------

## 18. Experimental Validation

Before finalizing thresholds, the engine should be tested against
controlled examples:

1.  exact copies;
2.  formatting changes;
3.  variable renaming;
4.  comment changes;
5.  literal changes;
6.  inserted statements;
7.  deleted statements;
8.  reordered logic;
9.  legitimately different implementations;
10. unrelated programs.

The implementation includes focused tests covering:

-   identifier renaming;
-   operator changes;
-   literal value changes;
-   structural changes;
-   structurally equivalent examples;
-   N-gram generation and edge cases;
-   deterministic structural fingerprinting;
-   similarity and threshold behavior;
-   similarity-risk classification;
-   batch analysis components.

The goal is to continue expanding controlled tests as the analysis
engine evolves, measuring both useful detections and false positives.

------------------------------------------------------------------------

## 19. Current V1 Analysis Status

The current V1 analysis engine includes:

-   SHA-256 exact matching;
-   Tree-sitter structural traversal;
-   structural abstraction of identifiers and literals;
-   structural fingerprinting;
-   configurable N-gram generation;
-   set-based Jaccard similarity;
-   threshold-based comparison;
-   similarity-risk classification;
-   bounded batch validation;
-   unique submission-pair generation;
-   pairwise comparison;
-   pairwise similarity matrix generation;
-   suspicious-pair ranking;
-   reference-solution analysis;
-   batch orchestration.

The comparison UI remains intentionally deferred to a later phase.

------------------------------------------------------------------------

## 20. Source of Truth Rule

Algorithmic changes must be reflected in this document before they
become part of the official implementation specification.

The document should distinguish clearly between:

-   implemented V1 functionality;
-   experimental or partially implemented functionality;
-   planned functionality.

This prevents the conceptual specification from claiming capabilities
that are not yet present in the implementation.
