export interface FeatureFlags {
    home: {
        cards: {
            namaz_okamagy: boolean;
            dogalar: boolean;
            metjitler: boolean;
            quran: boolean;
            hadith: boolean;
        };
    };
}

export interface SponsorCampaign {
    id: string;
    enabled: boolean;
    position: 'home_mid' | 'home_bottom' | 'settings_top';
    title: string;
    description?: string;
    imageUrl: string;
    clickUrl: string;
    startAt: string; // ISO 8601
    endAt: string; // ISO 8601
    maxImpressionsPerDay?: number;
}

export interface RemoteContentTexts {
    namazLearning?: {
        men: string[];
        women: string[];
    };
    dogalar?: string[];
}

export interface RemoteConfig {
    contentVersion: number;
    lastUpdated: string;
    featureFlags: FeatureFlags;
    sponsorCampaigns: SponsorCampaign[];
    texts?: RemoteContentTexts;
}

export const DEFAULT_CONFIG: RemoteConfig = {
    contentVersion: 1,
    lastUpdated: new Date().toISOString(),
    featureFlags: {
        home: {
            cards: {
                namaz_okamagy: true,
                dogalar: true,
                metjitler: true,
                quran: true,
                hadith: true,
            },
        },
    },
    sponsorCampaigns: [],
    texts: {},
};
