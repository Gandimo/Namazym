import React, { createContext, useContext, useState, useEffect } from "react";
import { Alert } from "react-native";
import { PrayerTimeDisplay } from "../services/PrayerTimesAdapter";
import { PrayerTimesService } from "../services/PrayerTimesService";
import { StorageService } from "../services/StorageService";
import { NotificationService } from "../services/NotificationService";
import { TimeService } from "../services/TimeService";

import { CITIES } from "../constants/cities";
import { verifyAllPrayerTimes } from "../utils/verifyTimings";
import * as Location from 'expo-location';
import { AdhanService } from "../services/AdhanService";
import { isPointInTKM } from "../utils/geoUtils";

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
    const [placeKey, setPlaceKey] = useState<string>("asgabat");
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
                if (times) {
                    NotificationService.rescheduleAll(times, place.label)
                        .catch((err: any) => console.error("Initial scheduling failed:", err));
                }
            } catch (error) {
                console.error("CityContext Initialization Error:", error);
                const times = PrayerTimesService.getToday("asgabat_arkadag_ahal");
                setPrayerTimes(times);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

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

            // Non-blocking background scheduling
            if (times) {
                NotificationService.rescheduleAll(times, place.label)
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
            return;
        }
        setIsLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("GPS Gerekli", "Awto-lokasiýa üçin rugsat beriň.");
                setIsAutoLocation(false);
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            if (isPointInTKM(latitude, longitude)) {
                setIsAutoLocation(false);
                Alert.alert("Türkmenistan", "Siz Türkmenistanda. Sebit saýlaň.");
            } else {
                setIsAutoLocation(true);
                const times = AdhanService.calculatePrayerTimes(latitude, longitude, new Date());
                setPrayerTimes(times);
                setPlaceLabel("GPS Location");
                NotificationService.rescheduleAll(times, "GPS Location")
                    .catch((err: any) => console.error("GPS scheduling failed:", err));
            }
        } catch (e) {
            console.error("toggleAutoLocation Error:", e);
        } finally {
            setIsLoading(false);
        }
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
