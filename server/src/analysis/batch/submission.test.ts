import type { BatchSubmission } from "./submission.js";

const submission: BatchSubmission = {
    id: "submission-1",
    name: "student01.cpp",
    language: "cpp",
    source: Buffer.from("int main() { return 0; }", "utf8"),
};

if (submission.id !== "submission-1") {
    throw new Error("Submission ID was not preserved.");
}

if (submission.name !== "student01.cpp") {
    throw new Error("Submission name was not preserved.");
}

if (submission.language !== "cpp") {
    throw new Error("Submission language was not preserved.");
}

if (!Buffer.isBuffer(submission.source)) {
    throw new Error("Submission source must be a Buffer.");
}

console.log("PASS: batch submission model");