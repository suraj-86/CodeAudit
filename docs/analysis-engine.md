# CodeAudit — Analysis Engine Specification

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

The current V1 similarity implementation applies Jaccard similarity to
the structural N-gram sequences as sets.

The implementation therefore:

-   removes duplicate elements for the similarity calculation;
-   calculates the intersection of the two sets;
-   calculates the union of the two sets;
-   returns the intersection size divided by the union size;
-   returns `0` when both input sets are empty.

Duplicate N-grams are still preserved by the N-gram generation stage.
They simply do not increase the set-based Jaccard score.

The current comparison stage is deterministic and accepts a configurable
similarity threshold between `0` and `1`.

Conceptually:

``` text
Structural Sequence
        ↓
N-Gram Generation
        ↓
Set-Based Jaccard Similarity
        ↓
Similarity + Threshold
        ↓
Suspicious Flag
```

A comparison result contains:

``` text
similarity
threshold
suspicious
```

The `suspicious` value is `true` when the calculated similarity is greater
than or equal to the supplied threshold.

The current implementation has been tested for:

-   identical sequences;
-   disjoint sequences;
-   partial overlap;
-   duplicate elements;
-   empty sequences;
-   one empty sequence;
-   similarity equal to the threshold;
-   rejection of invalid thresholds.

This establishes a deterministic V1 similarity comparison primitive.
It should not yet be interpreted as a complete plagiarism-detection
system.

------------------------------------------------------------------------

## 9. Structural Risk Interpretation

Similarity percentages should not automatically be treated as proof of
plagiarism.

The V1 implementation provides configurable risk classification using:

-   Low;
-   Moderate;
-   High;
-   Very High.

Three increasing thresholds define the boundaries between these
categories:

``` text
similarity < moderate       → Low
similarity >= moderate      → Moderate
similarity >= high          → High
similarity >= veryHigh      → Very High
```

The implementation validates that:

-   each threshold is between `0` and `1`;
-   thresholds are strictly increasing.

The current controlled tests use example thresholds to verify the
classification behavior. These values are test configuration and are not
presented as universally valid plagiarism thresholds.

Risk categories should be treated as indicators for investigation, not
judicial or academic proof.

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

------------------------------------------------------------------------

## 11. Code Correctness

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

## 12. AI-Assisted Analysis

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

## 13. AI Limitations

AI-code detection is probabilistic and can produce false positives and
false negatives.

Therefore:

-   it should not be treated as proof;
-   it should not automatically determine plagiarism;
-   it should not be merged blindly with AST similarity;
-   provider limitations must be disclosed.

------------------------------------------------------------------------

## 14. Combined Results

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

## 15. Explainability

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

## 16. Experimental Validation

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

The Phase 3 implementation includes focused structural tests covering:

-   identifier renaming;
-   operator changes;
-   literal value changes;
-   structural changes;
-   structurally equivalent examples;
-   N-gram generation and edge cases;
-   deterministic structural fingerprinting.

Phase 4 extends this validation with similarity and controlled clone
experiments.

The current controlled clone experiments verify the following behaviors:

-   Type-1-style changes, such as formatting/comment changes, can preserve
    a similarity of `1`;
-   Type-2-style identifier renaming can preserve a similarity of `1`
    because identifier spellings are abstracted from the structural
    representation;
-   a Type-3-style structural modification can produce partial similarity;
-   unrelated programs can produce lower similarity than the controlled
    clone examples.

The experiments validate the behavior of the current representation and
comparison pipeline. They do not establish universal similarity or
plagiarism thresholds.

Further experiments should measure both useful detections and false
positives before production thresholds are selected.

------------------------------------------------------------------------

## 17. Source of Truth Rule

Algorithmic changes must be reflected in this document before they
become part of the official implementation specification.

The document should distinguish clearly between:

-   implemented V1 functionality;
-   experimental or partially implemented functionality;
-   planned functionality.

This prevents the conceptual specification from claiming capabilities
that are not yet present in the implementation.
