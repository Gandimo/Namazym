import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { RemoteConfig, DEFAULT_CONFIG } from '../config/RemoteConfigTypes';
import { remoteConfigService } from '../services/RemoteConfigService';

interface RemoteConfigContextType {
    config: RemoteConfig;
    isLoading: boolean;
    isUsingCache: boolean;
    refresh: () => Promise<boolean>;
}

const RemoteConfigContext = createContext<RemoteConfigContextType>({
    config: DEFAULT_CONFIG,
    isLoading: true,
    isUsingCache: false,
    refresh: async () => false,
});

export const RemoteConfigProvider = ({ children }: { children: ReactNode }) => {
    const [config, setConfig] = useState<RemoteConfig>(DEFAULT_CONFIG);
    const [isLoading, setIsLoading] = useState(true);
    const [isUsingCache, setIsUsingCache] = useState(false);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            // 1. Load from cache immediately
            await remoteConfigService.init();
            if (mounted) {
                setConfig(remoteConfigService.getConfig());
                // We show content immediately if cached, so loading is "done" for UI purposes? 
                // Or we keep loading true until network check? Use case: "Offline First" -> show cache immediately.
                setIsLoading(false);
                setIsUsingCache(true);
            }

            // 2. Fetch fresh config in background
            const success = await remoteConfigService.fetchConfig();
            if (mounted && success) {
                setConfig(remoteConfigService.getConfig());
                setIsUsingCache(false); // Clean verify
            }
        };

        init();

        return () => {
            mounted = false;
        };
    }, []);

    const refresh = async () => {
        setIsLoading(true);
        const success = await remoteConfigService.forceRefresh();
        setConfig(remoteConfigService.getConfig());
        setIsLoading(false);
        return success;
    };

    return (
        <RemoteConfigContext.Provider value={{ config, isLoading, isUsingCache, refresh }}>
            {children}
        </RemoteConfigContext.Provider>
    );
};

export const useRemoteConfig = () => useContext(RemoteConfigContext);
