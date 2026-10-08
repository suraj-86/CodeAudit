import assert from "node:assert/strict";
import test from "node:test";

import { SUPPORTED_LANGUAGES } from "./limits.js";
import {
    getLanguageCapabilities,
    supportsCapability,
} from "./capabilities.js";

test("every supported language declares capabilities", () => {
    for (const id of Object.keys(SUPPORTED_LANGUAGES)) {
        assert.ok(
            getLanguageCapabilities(id),
            `missing capabilities for ${id}`,
        );
    }
});

test("structural analysis and batch are available for every supported language; execution is Python only", () => {
    for (const id of Object.keys(SUPPORTED_LANGUAGES)) {
        assert.equal(
            supportsCapability(id, "structural"),
            true,
            `expected structural support for ${id}`,
        );
        assert.equal(
            supportsCapability(id, "batch"),
            true,
            `expected batch support for ${id}`,
        );
    }

    assert.equal(supportsCapability("python", "execution"), true);
    assert.equal(supportsCapability("cpp", "execution"), false);
});

test("exact match and AI apply to every language", () => {
    for (const id of Object.keys(SUPPORTED_LANGUAGES)) {
        assert.equal(supportsCapability(id, "exactMatch"), true);
        assert.equal(supportsCapability(id, "ai"), true);
    }
});

test("lookup is case-insensitive and unknown languages support nothing", () => {
    assert.equal(supportsCapability("CPP", "structural"), true);
    assert.equal(supportsCapability("cobol", "exactMatch"), false);
    assert.equal(getLanguageCapabilities("constructor"), undefined);
});
