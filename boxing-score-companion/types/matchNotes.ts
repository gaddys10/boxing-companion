export type MatchRating = number;
export type MatchDescription = string[];

export const normalizeMatchRating = (value: unknown): MatchRating => {
    const parsed = Number(Array.isArray(value) ? value[0] : value);
    if (!Number.isFinite(parsed)) return 0;

    return Math.min(5, Math.max(0, parsed));
};

export const parseMatchDescription = (value: unknown): MatchDescription => {
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
        return value;
    }

    const rawValue = Array.isArray(value) ? value[0] : value;
    if (typeof rawValue !== 'string' || !rawValue) return [];

    try {
        const parsed: unknown = JSON.parse(rawValue);
        return Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === 'string')
            : [];
    } catch {
        return [];
    }
};

export const serializeMatchDescription = (description: MatchDescription) =>
    JSON.stringify(description);
