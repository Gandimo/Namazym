export interface Place {
    key: string;
    label: string;
    cityId: number; // For mapping to the 2026 prayer times cache (1-6)
    lat?: number;  // Latitude for solar calculations (optional)
    lon?: number;  // Longitude for solar calculations (optional)
    /**
     * Magnetic declination in degrees, East positive (WMM ~2025, offline constant).
     * Used to convert the phone's magnetic compass heading to true north so the
     * Qibla needle aligns with the true great-circle bearing. Drifts ~0.1°/yr.
     */
    declination?: number;
}

export interface PlaceGroup {
    title: string;
    places: Place[];
}

export const CITIES_GROUPED: PlaceGroup[] = [
    {
        title: "Şäherler",
        places: [
            { key: "asgabat_arkadag_ahal", label: "Aşgabat", cityId: 1, lat: 37.9601, lon: 58.3261, declination: 5.5 },
            { key: "mary", label: "Mary", cityId: 6, lat: 37.6004, lon: 61.8310, declination: 5.9 },
            { key: "dasoguz", label: "Daşoguz", cityId: 4, lat: 41.8369, lon: 59.9658, declination: 6.4 },
            { key: "lebap", label: "Lebap", cityId: 5, lat: 39.1013, lon: 63.5685, declination: 6.3 },
            { key: "balkan", label: "Balkan", cityId: 3, lat: 39.5114, lon: 54.3689, declination: 4.9 },
        ]
    },
    {
        title: "Welaýatlar",
        places: [
            { key: "asgabat_arkadag_ahal", label: "Ahal", cityId: 1, lat: 37.9601, lon: 58.3261, declination: 5.5 },
            { key: "mary", label: "Mary", cityId: 6, lat: 37.6004, lon: 61.8310, declination: 5.9 },
            { key: "lebap", label: "Lebap", cityId: 5, lat: 39.1013, lon: 63.5685, declination: 6.3 },
            { key: "dasoguz", label: "Daşoguz", cityId: 4, lat: 41.8369, lon: 59.9658, declination: 6.4 },
            { key: "balkan", label: "Balkan", cityId: 3, lat: 39.5114, lon: 54.3689, declination: 4.9 },
        ]
    }
];

// Flat list for easy lookup
export const CITIES = CITIES_GROUPED.flatMap(g => g.places);

export const RAMADAN_TABLE_MAPPING: Record<string, string> = {
    "asgabat_arkadag_ahal": "asgabat_arkadag_ahal",
    "balkan": "balkan",
    "dasoguz": "dasoguz",
    "lebap": "lebap",
    "mary": "mary",
};

export const PRAYER_TIMES_MAPPING: Record<string, string> = {
    "asgabat_arkadag_ahal": "asgabat_arkadag_ahal",
    "balkan": "balkan",
    "dasoguz": "dasoguz",
    "lebap": "lebap",
    "mary": "mary",
};
