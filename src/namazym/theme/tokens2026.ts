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
