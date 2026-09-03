export function jaccardSimilarity(
    first: string[],
    second: string[],
): number {
    const firstSet = new Set(first);
    const secondSet = new Set(second);

    if (firstSet.size === 0 && secondSet.size === 0) {
        return 0;
    }

    let intersectionSize = 0;

    for (const value of firstSet) {
        if (secondSet.has(value)) {
            intersectionSize += 1;
        }
    }

    const unionSize = new Set([
        ...firstSet,
        ...secondSet,
    ]).size;

    return intersectionSize / unionSize;
}