import React, { createContext, useContext, useState, useEffect } from "react";
import { Alert, AppState } from "react-native";
import { PrayerTimeDisplay } from "../services/PrayerTimesAdapter";
import { PrayerTimesService } from "../services/PrayerTimesService";
import { StorageService } from "../services/StorageService";
import { NotificationService } from "../services/NotificationService";
import { TimeService } from "../services/TimeService";
import { WidgetRefreshService } from "../services/WidgetRefreshService";

import { CITIES } from "../constants/cities";

interface CityContextType {
    placeKey: string;
    placeLabel: string;
    cityId: number;
    setPlace: (key: string) => Promise<void>;
    prayerTimes: PrayerTimeDisplay | null;
    isLoading: boolean;
    isAutoLocation: boolean;
    toggleAutoLocation: () => Promise<void>;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [placeKey, setPlaceKey] = useState<string>("asgabat_arkadag_ahal");
    const [placeLabel, setPlaceLabel] = useState<string>("Aşgabat");
    const [cityId, setCityId] = useState<number>(1);
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimeDisplay | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAutoLocation, setIsAutoLocation] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const savedKey = await StorageService.getPlaceKey();
                const savedLabel = await StorageService.getPlaceLabel();

                const targetKey = savedKey || "asgabat_arkadag_ahal";
                const place = CITIES.find(p => p.key === targetKey) || CITIES[0];

                // 2027-expiry alert logic
                const todayStr = TimeService.getTodayDateString();
                if (todayStr > '2027-12-25') {
                    Alert.alert(
                        "Täzeleme Gerek",
                        "Namaz wagtlaryny 2028-nji ýyl üçin täzeläň!",
                        [{ text: "OK" }]
                    );
                }

                setPlaceKey(place.key);
                setPlaceLabel(savedLabel || place.label);
                setCityId(place.cityId);

                // Safe Initialization: Data is now 100% offline local
                const times = PrayerTimesService.getToday(place.key);
                setPrayerTimes(times);
                void WidgetRefreshService.refresh({
                    placeKey: place.key,
                    placeLabel: savedLabel || place.label,
                    prayerTimes: times,
                });
                if (times) {
                    NotificationService.rescheduleAll(times, place.label, place.key)
                        .catch((err: any) => console.error("Initial scheduling failed:", err));
                }
            } catch (error) {
                console.error("CityContext Initialization Error:", error);
                const times = PrayerTimesService.getToday("asgabat_arkadag_ahal");
                setPrayerTimes(times);
                void WidgetRefreshService.refresh({
                    placeKey: "asgabat_arkadag_ahal",
                    placeLabel: "Aşgabat",
                    prayerTimes: times,
                });
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const refreshIfNeeded = async () => {
            try {
                const rebuilt = await NotificationService.refreshIfDateChanged(
                    prayerTimes,
                    placeLabel,
                    placeKey,
                );

                if (rebuilt) {
                    const refreshedTimes = PrayerTimesService.getToday(placeKey);
                    if (refreshedTimes) {
                        setPrayerTimes(refreshedTimes);
                        void WidgetRefreshService.refresh({
                            placeKey,
                            placeLabel,
                            prayerTimes: refreshedTimes,
                        });
                    }
                    return;
                }

                if (prayerTimes) {
                    void WidgetRefreshService.refresh({
                        placeKey,
                        placeLabel,
                        prayerTimes,
                    });
                }
            } catch (error) {
                console.error("Date-change notification refresh failed:", error);
            }
        };

        const interval = setInterval(() => {
            refreshIfNeeded().catch((error) => console.error("Interval refresh failed:", error));
        }, 15 * 60 * 1000);

        const appStateSubscription = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                refreshIfNeeded().catch((error) => console.error("Foreground refresh failed:", error));
            }
        });

        return () => {
            clearInterval(interval);
            appStateSubscription.remove();
        };
    }, [isLoading, placeKey, placeLabel, prayerTimes]);

    const setPlace = async (key: string) => {
        try {
            const place = CITIES.find(p => p.key === key);
            if (!place) return;

            // Optimistically update UI labels
            setPlaceKey(place.key);
            setPlaceLabel(place.label);
            setCityId(place.cityId);

            // Persist
            await StorageService.setPlaceKey(place.key);
            await StorageService.setPlaceLabel(place.label);

            // 1. Authoritative Offline Sync: No fetch calls needed
            let times = PrayerTimesService.getToday(place.key);

            if (!times) {
                console.warn(`No prayer times found for ${place.key}, trying fallback.`);
                times = PrayerTimesService.getToday("asgabat_arkadag_ahal");
            }

            // Success
            setPrayerTimes(times);
            void WidgetRefreshService.refresh({
                placeKey: place.key,
                placeLabel: place.label,
                prayerTimes: times,
            });

            // Non-blocking background scheduling
            if (times) {
                NotificationService.rescheduleAll(times, place.label, place.key)
                    .catch((err: any) => console.error("Background scheduling failed:", err));
            }
        } catch (e) {
            console.error("setPlace Error:", e);
            // Do not break UI
        }
    };

    const toggleAutoLocation = async () => {
        if (isAutoLocation) {
            setIsAutoLocation(false);
            const savedKey = await StorageService.getPlaceKey() || "asgabat_arkadag_ahal";
            const place = CITIES.find(p => p.key === savedKey) || CITIES[0];
            setPlaceKey(place.key);
            setPlaceLabel(place.label);
            setCityId(place.cityId);
            const times = PrayerTimesService.getToday(place.key);
            setPrayerTimes(times);
            void WidgetRefreshService.refresh({
                placeKey: place.key,
                placeLabel: place.label,
                prayerTimes: times,
            });
            if (times) {
                NotificationService.rescheduleAll(times, place.label, place.key)
                    .catch((err: any) => console.error("Auto-location off scheduling failed:", err));
            }
            return;
        }
        setIsAutoLocation(false);
        Alert.alert("Awto-lokasiýa öçürildi", "Bu wersiýada awto-lokasiýa elýeterli däl. Sebit saýlaň.");
    };

    return (
        <CityContext.Provider value={{ placeKey, placeLabel, cityId, setPlace, prayerTimes, isLoading, isAutoLocation, toggleAutoLocation }}>
            {children}
        </CityContext.Provider>
    );
};

export const useCity = () => {
    const context = useContext(CityContext);
    if (!context) throw new Error("useCity must be used within a CityProvider");
    return context;
};
