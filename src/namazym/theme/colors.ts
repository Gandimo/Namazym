// Design Token Sistemi v1.0 - Core Colors
export const tokens = {
    renkler: {
        marka: {
            altin: "#C9A84C",
            altinAcik: "#E8C97A",
            altinKoyu: "#8B6914",
            altinSaydam: "rgba(201,168,76,0.12)"
        },
        metin: {
            birincil: "#1A1A2E",
            ikincil: "#555555",
            ucuncul: "#888888",
            devre_disi: "#BBBBBB",
            beyaz: "rgba(255,255,255,0.92)",
            beyazSoluk: "rgba(255,255,255,0.60)"
        },
        arka_plan: {
            uygulama: "#F5F3EE",
            kart: "#FFFFFF",
            kartSaydam: "rgba(255,255,255,0.92)",
            kartKoyu: "rgba(0,0,0,0.25)",
            overlay: "rgba(0,0,0,0.08)"
        },
        durum: {
            aktif: "#C9A84C",
            tamamlandi: "#34A853",
            tamamlandiAcik: "rgba(52,168,83,0.12)",
            bekliyor: "#888888",
            uyari: "#F59E0B",
            hata: "#EF4444"
        },
        ayirici: {
            normal: "rgba(0,0,0,0.08)",
            guclu: "rgba(0,0,0,0.15)",
            beyaz: "rgba(255,255,255,0.12)"
        },
        gece_yuzu: {
            imsak: "#0d0620",
            gunDogmagy: "#1a2a5e",
            oyle: "#1e90ff",
            ikindi: "#2a4080",
            aksam: "#0f0c29",
            yatsy: "#020408"
        }
    },
    tipografi: {
        font_ailesi: {
            baslik: "Georgia",
            govde: "System",
            sayac: "System", // Tabular nums handles the shifting
        },
        boyutlar: {
            xs: 11,
            sm: 13,
            md: 15,
            lg: 17,
            xl: 22,
            xxl: 28,
            xxxl: 42,
            baslik_buyuk: 32
        },
        agirliklar: {
            ince: "300" as const,
            normal: "400" as const,
            orta: "500" as const,
            yarim_kalin: "600" as const,
            kalin: "700" as const
        }
    }
};

// ─── Legacy Compatibility (will be phased out) ────────────────────────────────
export const colors = {
    bg: tokens.renkler.arka_plan.uygulama,
    card: tokens.renkler.arka_plan.kartSaydam,
    border: tokens.renkler.ayirici.normal,
    text: tokens.renkler.metin.birincil,
    textMuted: tokens.renkler.metin.ikincil,
    gold: tokens.renkler.marka.altin,
    green: tokens.renkler.durum.tamamlandi,
    blue: tokens.renkler.gece_yuzu.ikindi,
    amber: tokens.renkler.durum.uyari,
    red: tokens.renkler.durum.hata,
};

export const paper = {
    bg: tokens.renkler.arka_plan.uygulama,
    card: tokens.renkler.arka_plan.kart,
    title: tokens.renkler.metin.birincil,
    text: tokens.renkler.metin.birincil,
    muted: tokens.renkler.metin.ucuncul,
    border: tokens.renkler.ayirici.normal,
};

// Ultra Premium Kıble Color Palette
export const kiblePremium = {
    ambientStart: '#F5F3EE', // Aligned with tokens.renkler.arka_plan.uygulama
    ambientEnd: '#F0EAD6',
    ambientMid: '#F5F5F0',
    goldPrimary: '#C9A84C',  // Aligned with tokens.renkler.marka.altin
    goldLight: '#E8C97A',    // Aligned with tokens.renkler.marka.altinAcik
    goldGlow: 'rgba(201, 168, 76, 0.3)',
    goldShadow: 'rgba(201, 168, 76, 0.15)',
    glassLight: 'rgba(255, 255, 255, 0.60)',
    glassMedium: 'rgba(255, 255, 255, 0.40)',
    glassDark: 'rgba(0, 0, 0, 0.03)',
    glassStroke: 'rgba(255, 255, 255, 0.50)',
    shadowSoft: 'rgba(89, 74, 38, 0.08)',
    shadowMedium: 'rgba(89, 74, 38, 0.12)',
    shadowInner: 'rgba(0, 0, 0, 0.04)',
    alignedGlow: 'rgba(52, 168, 83, 0.2)', // Aligned with tokens.renkler.durum.tamamlandi
    nearGlow: 'rgba(245, 158, 11, 0.2)', // Aligned with tokens.renkler.durum.uyari
};

export const fonts = {
    regular: "Amiri_400Regular",
    bold: "Amiri_700Bold",
    medium: "Amiri_400Regular",
};

export const VAKIT_PALETTES = {
    ertir: { gradient: ["#1E3A8A", "#F4B860"], ring: "#FFD27A", glass: "rgba(0,0,0,0.08)" },
    oyle: { gradient: ["#1e90ff", "#c8eaff"], ring: "#5FA8F5", glass: "rgba(0,0,0,0.07)" },
    yatsy: { gradient: ["#020408", "#102240"], ring: "#8DA9C4", glass: "rgba(0,0,0,0.14)" }
};

export const VAKIT_TO_PALETTE: Record<string, string> = {
    Fajr: "ertir",
    Sunrise: "ertir",
    Dhuhr: "oyle",
    Asr: "oyle",
    Maghrib: "yatsy",
    Isha: "yatsy"
};
