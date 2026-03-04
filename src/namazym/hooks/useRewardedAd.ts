import { useEffect, useState, useCallback } from 'react';
import { rewardedAdsService } from '../services/RewardedAdsService';

export function useRewardedAd() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isEarned, setIsEarned] = useState(false);
    const [isClosed, setIsClosed] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Poll for the current ad instance from service
    const ad = rewardedAdsService.getAdInstance();
    // Get types lazily
    const eventTypes = rewardedAdsService.getEventTypes();

    useEffect(() => {
        // Ensure service is initialized
        rewardedAdsService.initialize();
    }, []);

    useEffect(() => {
        if (!ad || !eventTypes) {
            setIsLoaded(false);
            return;
        }

        const { RewardedAdEventType, AdEventType } = eventTypes;

        // Subscribe to events for the CURRENT ad instance
        const unsubscribeLoaded = ad.addAdEventListener(
            RewardedAdEventType.LOADED,
            () => setIsLoaded(true)
        );

        const unsubscribeEarned = ad.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            () => setIsEarned(true)
        );

        const unsubscribeClosed = ad.addAdEventListener(
            AdEventType.CLOSED,
            () => {
                setIsClosed(true);
                setIsLoaded(false);
            }
        );

        const unsubscribeError = ad.addAdEventListener(
            AdEventType.ERROR,
            (err: any) => {
                setError(err);
                setIsLoaded(false);
            }
        );

        return () => {
            unsubscribeLoaded();
            unsubscribeEarned();
            unsubscribeClosed();
            unsubscribeError();
        };
    }, [ad, eventTypes]);

    const showAd = useCallback(async () => {
        await rewardedAdsService.showRewardedAd();
    }, []);

    return {
        isLoaded,
        isEarned,
        isClosed,
        error,
        showAd
    };
}
