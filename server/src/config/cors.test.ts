import assert from "node:assert/strict";
import test from "node:test";

import { buildCorsOptions } from "./cors.js";

test("defaults to wide-open CORS when CORS_ALLOWED_ORIGINS is unset", () => {
    const previous = process.env.CORS_ALLOWED_ORIGINS;
    delete process.env.CORS_ALLOWED_ORIGINS;

    try {
        assert.deepEqual(buildCorsOptions(), {});
    } finally {
        if (previous !== undefined) process.env.CORS_ALLOWED_ORIGINS = previous;
    }
});

test("parses a comma-separated origin list, trimming whitespace", () => {
    const previous = process.env.CORS_ALLOWED_ORIGINS;
    process.env.CORS_ALLOWED_ORIGINS =
        " https://codeaudit.vercel.app , https://staging.example.com ";

    try {
        assert.deepEqual(buildCorsOptions(), {
            origin: [
                "https://codeaudit.vercel.app",
                "https://staging.example.com",
            ],
        });
    } finally {
        if (previous === undefined) delete process.env.CORS_ALLOWED_ORIGINS;
        else process.env.CORS_ALLOWED_ORIGINS = previous;
    }
});

test("ignores an empty or whitespace-only value", () => {
    const previous = process.env.CORS_ALLOWED_ORIGINS;
    process.env.CORS_ALLOWED_ORIGINS = "   ";

    try {
        assert.deepEqual(buildCorsOptions(), {});
    } finally {
        if (previous === undefined) delete process.env.CORS_ALLOWED_ORIGINS;
        else process.env.CORS_ALLOWED_ORIGINS = previous;
    }
});
