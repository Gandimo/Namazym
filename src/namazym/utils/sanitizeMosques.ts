const INVALID_NAME_PLACEHOLDERS = new Set(['ı', 'i', 'İ', 'I']);

export const hasMeaningfulMosqueName = (value: unknown): value is string => {
    if (typeof value !== 'string') return false;

    const trimmed = value.trim();
    if (!trimmed) return false;
    if (INVALID_NAME_PLACEHOLDERS.has(trimmed)) return false;

    const compact = trimmed.replace(/[\s\W_]+/g, '');
    return compact.length > 1;
};

export const sanitizeMosques = <T extends { name?: unknown }>(items: T[]): T[] => {
    if (!Array.isArray(items)) return [];

    return items.filter(
        (item) => !!item && typeof item === 'object' && hasMeaningfulMosqueName(item.name),
    );
};

