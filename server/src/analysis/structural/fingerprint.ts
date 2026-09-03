import { calculateSha256 } from "../exact-match/hash.js";

export function structuralFingerprint(sequence: string[]): string {
    const canonical = sequence.join("|");

    return calculateSha256(Buffer.from(canonical, "utf8"));
}