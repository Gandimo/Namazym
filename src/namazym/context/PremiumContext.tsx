import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_KEY = 'namazym_premium_unlocked';

interface PremiumContextType {
    isPremium: boolean;
    unlockPremium: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType>({
    isPremium: false,
    unlockPremium: async () => { },
});

export const usePremium = () => useContext(PremiumContext);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        loadPremiumState();
    }, []);

    const loadPremiumState = async () => {
        try {
            const stored = await AsyncStorage.getItem(PREMIUM_KEY);
            if (stored === 'true') {
                setIsPremium(true);
            }
        } catch (e) {
            console.error('Failed to load premium state', e);
        }
    };

    const unlockPremium = async () => {
        try {
            await AsyncStorage.setItem(PREMIUM_KEY, 'true');
            setIsPremium(true);
        } catch (e) {
            console.error('Failed to save premium state', e);
        }
    };

    return (
        <PremiumContext.Provider value={{ isPremium, unlockPremium }}>
            {children}
        </PremiumContext.Provider>
    );
};
