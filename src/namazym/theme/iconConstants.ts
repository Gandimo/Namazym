import { colors } from './colors';

// Material Design 3 standardları
export const ICON_SIZES = {
    SMALL: 18,    // Header icons, chevrons
    STANDARD: 24, // Card icons, default
    MEDIUM: 36,   // Feature highlights
    LARGE: 48,    // Hero sections
} as const;

// Material Design 3 kontrast kuralları
export const ICON_COLORS = {
    LIGHT_ACTIVE: 'rgba(0, 0, 0, 0.54)',
    LIGHT_INACTIVE: 'rgba(0, 0, 0, 0.26)',
    DARK_ACTIVE: 'rgba(255, 255, 255, 1.0)',
    DARK_INACTIVE: 'rgba(255, 255, 255, 0.3)',

    // Namazym branded colors
    BRAND_GOLD: colors.gold,
    BRAND_DARK: colors.text,
} as const;

// Premium gradient presets (Soft 3D aesthetic - 2026 trend)
export const ICON_GRADIENTS = {
    PRAYER_GOLD: ['#D4AF37', '#FFD700'],   // Namaz/Prayer
    RAMADAN_MOON: ['#667eea', '#764ba2'],  // Ramazan
    QIBLA_COMPASS: ['#43e97b', '#38f9d7'], // Kıble
    QURAN_BOOK: ['#4facfe', '#00f2fe'],    // Kuran
    TIME_CALENDAR: ['#f093fb', '#f5576c'], // Vakit
    HADITH_STAR: ['#fa709a', '#fee140'],   // Hadis
} as const;

export type IconSize = keyof typeof ICON_SIZES;
export type IconGradient = keyof typeof ICON_GRADIENTS;
