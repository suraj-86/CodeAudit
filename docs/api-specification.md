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

## 5. Source-Code Upload

### POST /api/uploads

Accepts one or more source-code files for validation and temporary processing.

V1 does not require authentication.

The request must use `multipart/form-data`.

### Multipart fields

The request shall contain:

- `language` — required selected programming language;
- `files` — one or more source-code files.

The `language` field must contain one of the supported language identifiers returned by `GET /api/languages`.

One upload request represents one programming language. Mixed-language batches are not permitted.

### Upload limits

The endpoint shall enforce:

- maximum individual file size: 1 MB;
- maximum files per request: 100;
- maximum aggregate source-file size: 100 MB.

The aggregate limit applies to the combined source-file sizes in the request.

### Validation

Every uploaded file shall be validated before it enters an analysis workflow.

Validation shall include:

- supported file extension;
- compatibility with the selected language;
- individual file size;
- total upload size;
- maximum file count;
- safe filename handling.

If any file fails validation, the complete upload request shall be rejected rather than partially accepted.

Client-provided filenames are metadata only and must never be interpreted as filesystem paths.

### Successful response

A successful upload validation response should return metadata about the accepted files without returning their source contents.

Example:

```json
{
  "status": "accepted",
  "language": "cpp",
  "fileCount": 3,
  "totalSizeBytes": 4821,
  "files": [
    {
      "name": "student01.cpp",
      "sizeBytes": 1510
    },
    {
      "name": "student02.cpp",
      "sizeBytes": 1692
    },
    {
      "name": "student03.cpp",
      "sizeBytes": 1619
    }
  ]
}

## 5A. Project ZIP Upload

### POST /api/projects/upload

Accepts a complete source-code project as a ZIP archive for temporary project ingestion.

V1 does not require authentication.

The request must use:

`multipart/form-data`

### Multipart fields

The request shall contain:

- `file` — required ZIP archive containing the project source.

### Project ingestion

The endpoint shall:

- validate that the uploaded archive is an acceptable ZIP file;
- safely inspect archive entries before extraction;
- prevent unsafe archive paths;
- extract project contents only into controlled temporary storage;
- identify supported source-code files;
- apply applicable source-file validation rules;
- exclude unsupported non-source files according to documented ingestion rules;
- reject unsafe or invalid project contents;
- provide valid source files to the analysis workflow;
- remove temporary extracted data after the analysis lifecycle.

The ZIP archive itself must not be treated as a source-code file.

### Initial V1 scope

The initial implementation supports direct ZIP upload only.

GitHub/GitLab repository imports are not part of this endpoint.

### Successful response

The successful response should return project metadata and the discovered source-file metadata without returning source contents.

Example:

```json
{
  "status": "accepted",
  "fileCount": 4,
  "files": [
    {
      "name": "src/main.cpp",
      "language": "cpp",
      "sizeBytes": 1842
    }
  ]
}

```

## 6. Pairwise Analysis

### POST /api/analyze/compare

Accepts two source files.

Expected multipart fields may include:

- fileA;
- fileB;
- languageA (optional);
- languageB (optional).

### Response

A successful comparison returns the SHA-256 hash of each uploaded file and whether their contents are exactly identical.

Example:

```json
{
  "files": [
    {
      "name": "a.cpp",
      "hash": "..."
    },
    {
      "name": "b.cpp",
      "hash": "..."
    }
  ],
  "exactMatch": false
}
```

`exactMatch` is `true` only when the SHA-256 hashes of the two files are identical.

Structural similarity is a separate analysis signal and is not calculated by this endpoint yet.

The exact-match result does not indicate authorship or determine whether code was AI-generated.

## 7. Batch Analysis

### POST /api/analyze/batch

Accepts multiple files.

The server calculates unique pairwise comparisons.

For N files:

N(N-1)/2

comparisons are required.

The endpoint must enforce a configurable maximum batch size.

## 8. Reference Analysis

### POST /api/analyze/reference

Accepts:

- one reference solution;
- one or more submissions.

The response should distinguish reference similarity from submission-to-submission similarity.

## 9. Testing

### POST /api/test/run

Accepts:

- source code;
- language;
- test cases;
- execution configuration within safe limits.

The endpoint must never execute arbitrary code inside the primary API process.

## 10. AI Analysis

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

## 11. Report Generation

### POST /api/reports

Accepts an analysis result or analysis identifier according to the implementation strategy.

Returns a PDF response or a temporary report reference.

V1 should avoid creating permanent report storage.

## 12. Error Format

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

## 13. Important Error Cases

The API should explicitly handle:

- missing file;
- empty file;
- oversized file;
- too many files;
- unsupported language;
- language/extension mismatch;
- aggregate upload-size exceeded;
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

## 14. Rate Limiting

At minimum, separate rate-limit policies should be considered for:

- general API requests;
- pairwise analysis;
- batch analysis;
- code execution;
- AI-analysis requests;
- report generation.

Exact limits should be selected after measuring resource consumption.

## 15. API Versioning

The API should be structured so that a future `/api/v2` can be introduced without breaking the V1 contract.

## 16. Security

No endpoint should assume that uploaded source code is trustworthy.

All endpoints must validate input and apply appropriate resource controls.
