export function generateNGrams(
    sequence: string[],
    size: number,
): string[] {
    if (!Number.isInteger(size) || size <= 0) {
        throw new Error("N-gram size must be a positive integer.");
    }

    if (size > sequence.length) {
        return [];
    }

    const ngrams: string[] = [];

    for (let index = 0; index <= sequence.length - size; index += 1) {
        const ngram = sequence
            .slice(index, index + size)
            .join("|");

        ngrams.push(ngram);
    }

    return ngrams;
}