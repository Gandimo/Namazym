export const TABLET_BREAKPOINT = 768;
export const LARGE_TABLET_BREAKPOINT = 1024;

const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
};

export type ResponsiveLayoutMetrics = {
    isTablet: boolean;
    isLargeTablet: boolean;
    horizontalPadding: number;
    contentMaxWidth: number;
    compactContentMaxWidth: number;
    modalMaxWidth: number;
    navigationMaxWidth: number;
    cardGap: number;
};

export const getResponsiveLayoutMetrics = (windowWidth: number): ResponsiveLayoutMetrics => {
    const isLargeTablet = windowWidth >= LARGE_TABLET_BREAKPOINT;
    const isTablet = windowWidth >= TABLET_BREAKPOINT;

    return {
        isTablet,
        isLargeTablet,
        horizontalPadding: isLargeTablet ? 32 : isTablet ? 24 : 16,
        contentMaxWidth: isLargeTablet ? 980 : isTablet ? 860 : windowWidth,
        compactContentMaxWidth: isLargeTablet ? 820 : isTablet ? 720 : windowWidth,
        modalMaxWidth: isLargeTablet ? 560 : isTablet ? 520 : windowWidth,
        navigationMaxWidth: isLargeTablet ? 620 : isTablet ? 560 : windowWidth,
        cardGap: isTablet ? 16 : 12,
    };
};

export const getBoundedContentWidth = (windowWidth: number, horizontalPadding: number, maxWidth: number) => {
    return Math.min(Math.max(windowWidth - (horizontalPadding * 2), 0), maxWidth);
};

export const getAdaptiveCardWidth = (
    containerWidth: number,
    columns: number,
    gap: number,
    minWidth: number,
    maxWidth: number,
) => {
    const rawWidth = (containerWidth - (gap * (columns - 1))) / columns;
    return clamp(Math.floor(rawWidth), minWidth, maxWidth);
};
