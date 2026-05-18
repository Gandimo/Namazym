export const tokens2026 = {
    colors: {
        background: {
            primary: '#0E1116',
            secondary: '#141823',
        },
        surface: {
            default: 'rgba(255, 255, 255, 0.06)',
            glass: 'rgba(255, 255, 255, 0.10)',
        },
        accent: '#6FA8FF',
        text: {
            primary: '#FFFFFF',
            secondary: 'rgba(255, 255, 255, 0.65)',
        },
        prayerList: {
            light: {
                cardDefault: 'rgba(255, 255, 255, 0.80)',
                cardCurrent: 'rgba(255, 255, 255, 0.92)',
                cardCompleted: 'rgba(255, 255, 255, 0.74)',
                cardNext: 'rgba(255, 255, 255, 0.86)',
                borderDefault: 'rgba(201, 168, 76, 0.18)',
                borderCurrent: 'rgba(201, 166, 70, 0.42)',
                borderCompleted: 'rgba(201, 168, 76, 0.16)',
                borderNext: 'rgba(201, 168, 76, 0.28)',
                textPrimary: '#2B2B34',
                textSecondary: '#514D49',
                textMuted: '#746E67',
                accentText: '#6F5213',
                watermark: 'rgba(43, 43, 52, 0.045)',
            },
            dark: {
                cardDefault: 'rgba(255, 255, 255, 0.14)',
                cardCurrent: 'rgba(255, 255, 255, 0.20)',
                cardCompleted: 'rgba(255, 255, 255, 0.11)',
                cardNext: 'rgba(255, 255, 255, 0.16)',
                borderDefault: 'rgba(255, 255, 255, 0.20)',
                borderCurrent: 'rgba(193, 160, 99, 0.42)',
                borderCompleted: 'rgba(255, 255, 255, 0.16)',
                borderNext: 'rgba(193, 160, 99, 0.28)',
                textPrimary: '#FFFFFF',
                textSecondary: 'rgba(255, 255, 255, 0.84)',
                textMuted: 'rgba(255, 255, 255, 0.72)',
                accentText: '#F2D48A',
                watermark: 'rgba(255, 255, 255, 0.06)',
            },
        },
        brandGold: '#C4A050',
    },
    glass: {
        blurRadius: 16, // Base radius
        opacity: 0.10,
    },
    elevation: {
        flat: {
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
        },
        soft: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 24,
            elevation: 4,
        },
        focused: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 32,
            elevation: 8,
        },
    },
    layout: {
        screenPadding: 16,
        componentPadding: 14,
        spacing: 12,
    },
    typography: {
        title: 20,
        body: 15,
        caption: 13,
        lineHeight: 1.5,
    }
};
