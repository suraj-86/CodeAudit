# CodeAudit — API Specification

## 1. Purpose

This document defines the planned HTTP API boundary for CodeAudit V1.

Exact endpoint names may be adjusted during implementation, but changes must be reflected here before becoming official.

## 2. API Principles

- JSON for structured responses;
- multipart/form-data for file uploads;
- consistent error objects;
- explicit analysis status;
- no authentication in V1;
- rate limiting on all public endpoints;
- stricter limits on expensive endpoints.

## 3. Health Check

### GET /api/health

Returns service availability.

Example:

```json
{
  "status": "ok"
}
```

## 4. Supported Languages

### GET /api/languages

Returns supported languages and capability information.

Example:

```json
{
  "languages": [
    {
      "id": "python",
      "name": "Python",
      "parse": true,
      "execute": true
    }
  ]
}
```

Execution support may differ from parsing support.

## 5. Pairwise Analysis

### POST /api/analyze/compare

Accepts two source files.

Expected multipart fields may include:

- fileA;
- fileB;
- languageA (optional);
- languageB (optional).

Response concept:

```json
{
  "files": [
    {
      "name": "a.py",
      "hash": "..."
    },
    {
      "name": "b.py",
      "hash": "..."
    }
  ],
  "exactMatch": false,
  "structural": {
    "similarity": 0.864,
    "risk": "high"
  }
}
```

The exact response schema will be finalized during implementation.

## 6. Batch Analysis

### POST /api/analyze/batch

Accepts multiple files.

The server calculates unique pairwise comparisons.

For N files:

N(N-1)/2

comparisons are required.

The endpoint must enforce a configurable maximum batch size.

## 7. Reference Analysis

### POST /api/analyze/reference

Accepts:

- one reference solution;
- one or more submissions.

The response should distinguish reference similarity from submission-to-submission similarity.

## 8. Testing

### POST /api/test/run

Accepts:

- source code;
- language;
- test cases;
- execution configuration within safe limits.

The endpoint must never execute arbitrary code inside the primary API process.

## 9. AI Analysis

### POST /api/analyze/ai

Accepts source code or an approved normalized representation, depending on provider requirements.

The response should normalize provider output:

```json
{
  "available": true,
  "provider": "configured-provider",
  "indicator": 0.71,
  "label": "high",
  "disclaimer": "AI-analysis results are probabilistic and are not proof of authorship."
}
```

The actual provider name and schema will be determined later.

## 10. Report Generation

### POST /api/reports

Accepts an analysis result or analysis identifier according to the implementation strategy.

Returns a PDF response or a temporary report reference.

V1 should avoid creating permanent report storage.

## 11. Error Format

Errors should follow a consistent structure:

```json
{
  "error": {
    "code": "UNSUPPORTED_LANGUAGE",
    "message": "The selected language is not supported.",
    "details": null
  }
}
```

## 12. Important Error Cases

The API should explicitly handle:

- missing file;
- empty file;
- oversized file;
- too many files;
- unsupported language;
- parser failure;
- malformed request;
- invalid test cases;
- execution timeout;
- compilation error;
- runtime error;
- rate-limit exceeded;
- AI provider unavailable;
- AI provider timeout;
- report-generation failure.

## 13. Rate Limiting

At minimum, separate rate-limit policies should be considered for:

- general API requests;
- pairwise analysis;
- batch analysis;
- code execution;
- AI-analysis requests;
- report generation.

Exact limits should be selected after measuring resource consumption.

## 14. API Versioning

The API should be structured so that a future `/api/v2` can be introduced without breaking the V1 contract.

## 15. Security

No endpoint should assume that uploaded source code is trustworthy.

All endpoints must validate input and apply appropriate resource controls.
