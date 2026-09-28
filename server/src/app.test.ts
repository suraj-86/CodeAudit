import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

process.env.GEMINI_API_KEY = "";

const { createApp } = await import("./app.js");

const app = createApp();

test("GET /api/health returns ok", async () => {
    const response = await request(app).get("/api/health");

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ok");
});

test("GET /api/languages lists supported languages", async () => {
    const response = await request(app).get("/api/languages");

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body.languages));
    assert.ok(
        response.body.languages.some(
            (entry: { id: string }) => entry.id === "cpp",
        ),
    );
});

test("GET /api/languages exposes per-language capabilities and upload limits", async () => {
    const response = await request(app).get("/api/languages");

    const byId = Object.fromEntries(
        response.body.languages.map(
            (entry: { id: string }) => [entry.id, entry],
        ),
    );

    assert.equal(byId.cpp.capabilities.structural, true);
    assert.equal(byId.cpp.capabilities.batch, true);
    assert.equal(byId.cpp.capabilities.execution, false);
    assert.equal(byId.python.capabilities.execution, true);
    assert.equal(byId.python.capabilities.structural, false);
    assert.equal(byId.java.capabilities.exactMatch, true);

    assert.equal(typeof response.body.limits.maxFileSizeBytes, "number");
    assert.equal(typeof response.body.limits.maxFiles, "number");
    assert.equal(
        typeof response.body.limits.maxBatchSubmissions,
        "number",
    );
});

test("an unmatched route returns a structured 404", async () => {
    const response = await request(app).get(
        "/api/this-route-does-not-exist",
    );

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, "NOT_FOUND");
});

test("a malformed JSON body returns a structured 400, not a crash", async () => {
    const response = await request(app)
        .post("/api/reports")
        .set("Content-Type", "application/json")
        .send("{ this is not valid json");

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "MALFORMED_JSON");
});

test("POST /api/uploads accepts a valid single-file upload", async () => {
    const response = await request(app)
        .post("/api/uploads")
        .field("language", "python")
        .attach(
            "files",
            Buffer.from("print(1)", "utf8"),
            "solution.py",
        );

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "accepted");
    assert.equal(response.body.fileCount, 1);
});

test("POST /api/uploads rejects a missing language", async () => {
    const response = await request(app)
        .post("/api/uploads")
        .attach(
            "files",
            Buffer.from("print(1)", "utf8"),
            "solution.py",
        );

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "LANGUAGE_REQUIRED");
});

test("POST /api/uploads rejects an unsupported language", async () => {
    const response = await request(app)
        .post("/api/uploads")
        .field("language", "cobol")
        .attach(
            "files",
            Buffer.from("print(1)", "utf8"),
            "solution.py",
        );

    assert.equal(response.status, 400);
    assert.equal(
        response.body.error.code,
        "UNSUPPORTED_LANGUAGE",
    );
});

test("POST /api/uploads rejects a mismatched file extension", async () => {
    const response = await request(app)
        .post("/api/uploads")
        .field("language", "python")
        .attach(
            "files",
            Buffer.from("int main() { return 0; }", "utf8"),
            "solution.cpp",
        );

    assert.equal(response.status, 400);
    assert.equal(
        response.body.error.code,
        "UPLOAD_VALIDATION_FAILED",
    );
});

test("POST /api/uploads rejects an oversized file with a structured 413", async () => {
    const oversized = Buffer.alloc(2 * 1024 * 1024, "x");

    const response = await request(app)
        .post("/api/uploads")
        .field("language", "python")
        .attach("files", oversized, "big.py");

    assert.equal(response.status, 413);
    assert.equal(response.body.error.code, "FILE_TOO_LARGE");
});

test("POST /api/analyze/compare detects an exact match", async () => {
    const content = Buffer.from(
        "int main() { return 0; }",
        "utf8",
    );

    const response = await request(app)
        .post("/api/analyze/compare")
        .attach("fileA", content, "a.cpp")
        .attach("fileB", content, "b.cpp");

    assert.equal(response.status, 200);
    assert.equal(response.body.exactMatch, true);
});

test("POST /api/analyze/compare requires both files", async () => {
    const response = await request(app)
        .post("/api/analyze/compare")
        .attach(
            "fileA",
            Buffer.from("int main() {}", "utf8"),
            "a.cpp",
        );

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "FILES_REQUIRED");
});

test("POST /api/analyze/ai requires a language", async () => {
    const response = await request(app)
        .post("/api/analyze/ai")
        .send({ source: "print(1)" });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "LANGUAGE_REQUIRED");
});

test("POST /api/analyze/ai requires source code", async () => {
    const response = await request(app)
        .post("/api/analyze/ai")
        .send({ language: "python" });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "SOURCE_REQUIRED");
});

test("POST /api/analyze/ai reports unavailable gracefully without credentials", async () => {
    const response = await request(app)
        .post("/api/analyze/ai")
        .send({ language: "python", source: "print(1)" });

    assert.equal(response.status, 200);
    assert.equal(response.body.available, false);
});

test("POST /api/reports rejects invalid report input", async () => {
    const response = await request(app)
        .post("/api/reports")
        .send({ sourceFiles: [] });

    assert.equal(response.status, 400);
    assert.equal(
        response.body.error.code,
        "REPORT_INPUT_INVALID",
    );
});

test("POST /api/reports generates a PDF for valid input", async () => {
    const response = await request(app)
        .post("/api/reports")
        .send({
            sourceFiles: [{ filename: "a.cpp" }],
        });

    assert.equal(response.status, 200);
    assert.equal(
        response.headers["content-type"],
        "application/pdf",
    );
    assert.equal(
        Buffer.from(response.body).subarray(0, 5).toString(),
        "%PDF-",
    );
});

test("POST /api/analyze/workflow requires a source file", async () => {
    const response = await request(app)
        .post("/api/analyze/workflow")
        .field("language", "cpp");

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "SOURCE_REQUIRED");
});

test("POST /api/analyze/workflow detects an exact match against a reference", async () => {
    const source = Buffer.from(
        "int add(int a, int b) { return a + b; }",
        "utf8",
    );

    const response = await request(app)
        .post("/api/analyze/workflow")
        .field("language", "cpp")
        .field("runAI", "false")
        .attach("source", source, "a.cpp")
        .attach("reference", source, "b.cpp");

    assert.equal(response.status, 200);
    assert.equal(response.body.similarity.similarity, 1);
    assert.ok(
        response.body.evidence.some(
            (item: { category: string }) =>
                item.category === "Exact Match",
        ),
    );
});

test("POST /api/analyze/batch requires a reference submission", async () => {
    const response = await request(app)
        .post("/api/analyze/batch")
        .field("language", "cpp")
        .attach(
            "submissions",
            Buffer.from("int main() {}", "utf8"),
            "a.cpp",
        );

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "REFERENCE_REQUIRED");
});

test("POST /api/analyze/batch rejects non-C++ languages", async () => {
    const response = await request(app)
        .post("/api/analyze/batch")
        .field("language", "python")
        .attach(
            "submissions",
            Buffer.from("print(1)", "utf8"),
            "a.py",
        )
        .attach(
            "reference",
            Buffer.from("print(1)", "utf8"),
            "ref.py",
        );

    assert.equal(response.status, 400);
    assert.equal(
        response.body.error.code,
        "UNSUPPORTED_LANGUAGE",
    );
});

test("POST /api/analyze/batch returns a pairwise matrix and strips raw source bytes", async () => {
    const response = await request(app)
        .post("/api/analyze/batch")
        .field("language", "cpp")
        .attach(
            "submissions",
            Buffer.from("int main() { return 0; }", "utf8"),
            "a.cpp",
        )
        .attach(
            "submissions",
            Buffer.from("int main() { return 1; }", "utf8"),
            "b.cpp",
        )
        .attach(
            "reference",
            Buffer.from("int main() { return 0; }", "utf8"),
            "ref.cpp",
        );

    assert.equal(response.status, 200);
    assert.equal(response.body.submissions.length, 2);
    assert.equal(
        Object.prototype.hasOwnProperty.call(
            response.body.submissions[0],
            "source",
        ),
        false,
    );
    assert.ok(response.body.matrix);
});

test("malformed C++ source does not crash structural analysis; it just scores low", async () => {
    const garbage = Buffer.from(
        "{{{ this is not valid c++ at all &&&& )))",
        "utf8",
    );
    const valid = Buffer.from(
        "int main() { return 0; }",
        "utf8",
    );

    const response = await request(app)
        .post("/api/analyze/workflow")
        .field("language", "cpp")
        .field("runAI", "false")
        .attach("source", garbage, "garbage.cpp")
        .attach("reference", valid, "valid.cpp");

    assert.equal(response.status, 200);
    assert.ok(response.body.similarity);
    assert.equal(response.body.similarity.suspicious, false);
});

test("a route's rate limiter returns 429 once its request budget is exhausted", async () => {
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 12; attempt += 1) {
        const response = await request(app)
            .post("/api/analyze/ai")
            .send({ language: "python", source: "print(1)" });

        statuses.push(response.status);
    }

    assert.ok(
        statuses.every((status) => status === 200 || status === 429),
        `unexpected statuses: ${statuses.join(", ")}`,
    );
    assert.ok(
        statuses.includes(429),
        "expected the rate limiter to reject at least one request",
    );
});

test("a rate-limited response uses the standard error envelope with a retry hint", async () => {
    let limited;

    // The AI route's budget is already exhausted by the previous test
    // (per-route limiters are shared for the life of the process).
    for (let attempt = 0; attempt < 3 && !limited; attempt += 1) {
        const response = await request(app)
            .post("/api/analyze/ai")
            .send({ language: "python", source: "print(1)" });

        if (response.status === 429) {
            limited = response;
        }
    }

    assert.ok(limited, "expected a 429 response");
    assert.equal(limited.body.error.code, "RATE_LIMITED");
    assert.equal(
        typeof limited.body.error.details.retryAfterSeconds,
        "number",
    );
    assert.ok(limited.body.error.details.retryAfterSeconds >= 1);
});
