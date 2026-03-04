import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Lazy load helper
let RNAds: any = null;
function getRNAds() {
    if (RNAds) return RNAds;
    try {
        // Prevent crash in Expo Go by checking execution environment
        if (Constants.appOwnership === 'expo') {
            return null;
        }
        RNAds = require('react-native-google-mobile-ads');
        return RNAds;
    } catch (error) {
        return null;
    }
}

// Configuration
// Android: Production ID provided by user
// iOS: Test ID for Development (Switch to production ID when provided)
const ANDROID_ID = 'ca-app-pub-8565540333193509/289302882';
const IOS_ID = 'ca-app-pub-8565540333193509/5295822886';
// We cannot use TestIds here directly as it might crash if module missing.
// We will access TestIds inside methods.

class RewardedAdsService {
    private static instance: RewardedAdsService;
    private rewardedAd: any | null = null;
    private isInitialized = false;
    private isLoading = false;

    // Track listeners to clean them up
    private listeners: (() => void)[] = [];

    private constructor() { }

    public static getInstance(): RewardedAdsService {
        if (!RewardedAdsService.instance) {
            RewardedAdsService.instance = new RewardedAdsService();
        }
        return RewardedAdsService.instance;
    }

    private getAdUnitId(): string {
        const ads = getRNAds();
        if (!ads) return '';
        const { TestIds } = ads;

        return Platform.select({
            android: ANDROID_ID,
            ios: IOS_ID,
            default: TestIds.REWARDED,
        });
    }

    /**
     * Initialize the Mobile Ads SDK and load the first ad.
     */
    public async initialize() {
        if (this.isInitialized) return;

        // 1. Check for Native Module
        const ads = getRNAds();
        if (!ads) {
            console.warn('[AdMob Setup] Native module "react-native-google-mobile-ads" not found. Ads disabled (Expo Go mode).');
            return;
        }

        try {
            const { default: mobileAds, MaxAdContentRating } = ads;
            const adapter = mobileAds();

            // Note: ATT (App Tracking Transparency) removed for Expo Go compatibility
            // Re-enable in development builds by adding back expo-tracking-transparency

            // 3. Configure global settings
            await adapter.setRequestConfiguration({
                testDeviceIdentifiers: ['EMULATOR'], // Add real device IDs here for testing
                maxAdContentRating: MaxAdContentRating.G,
                tagForChildDirectedTreatment: false,
                tagForUnderAgeOfConsent: false,
            });

            // 4. Initialize SDK
            await adapter.initialize();
            this.isInitialized = true;
            console.log('AdMob SDK Initialized');

            // 5. Preload first ad
            this.loadRewardedAd();
        } catch (error) {
            console.warn('AdMob Initialization Failed:', error);
        }
    }

    /**
     * Loads a new Rewarded Ad instance.
     */
    public loadRewardedAd() {
        if (this.isLoading) return;

        const ads = getRNAds();
        if (!ads) return; // Silent fail in Expo Go

        const { RewardedAd, RewardedAdEventType, AdEventType } = ads;
        const adUnitId = this.getAdUnitId();

        console.log('Loading Rewarded Ad...');
        this.isLoading = true;
        this.clearListeners();

        // Create new instance
        this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: true, // Spiritual/Privacy friendly
        });

        // Setup Listeners
        const unsubscribeLoaded = this.rewardedAd!.addAdEventListener(
            RewardedAdEventType.LOADED,
            () => {
                console.log('Rewarded Ad Loaded & Ready');
                this.isLoading = false;
            }
        );

        const unsubscribeClosed = this.rewardedAd!.addAdEventListener(
            AdEventType.CLOSED,
            () => {
                console.log('Ad Closed. Preloading next...');
                this.isLoading = false;
                this.rewardedAd = null;
                // Auto-reload after a short delay to ensure clean state
                setTimeout(() => this.loadRewardedAd(), 1000);
            }
        );

        const unsubscribeEarned = this.rewardedAd!.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            (reward: any) => {
                console.log('Reward Earned:', reward);
                // Note: The caller usually handles the UI update via promises or the hook
            }
        );

        const unsubscribeError = this.rewardedAd!.addAdEventListener(
            AdEventType.ERROR,
            (error: any) => {
                console.warn('Ad Load Error:', error);
                this.isLoading = false;
                // Simple retry logic (exponential backoff could be better for prod)
                // For now, just wait a bit and retry if it was a network glitch
                setTimeout(() => {
                    if (!this.rewardedAd) this.loadRewardedAd();
                }, 5000);
            }
        );

        this.listeners = [unsubscribeLoaded, unsubscribeClosed, unsubscribeEarned, unsubscribeError];

        this.rewardedAd!.load();
    }

    /**
     * Safely shows the ad if loaded.
     * Returns a promise that resolves when the ad is closed or fails.
     */
    public showRewardedAd(): Promise<boolean> {
        return new Promise((resolve) => {
            const ads = getRNAds();
            if (!ads || !this.rewardedAd) {
                console.warn('Ad not ready to show or Ads not supported');
                this.loadRewardedAd(); // Try to load for next time
                resolve(false);
                return;
            }

            try {
                this.rewardedAd.show();
                resolve(true);
            } catch (error) {
                console.error('Failed to show ad:', error);
                this.loadRewardedAd(); // Reload if it failed
                resolve(false);
            }
        });
    }

    /**
     * Accessor for hooks
     */
    public getAdInstance(): any | null {
        return this.rewardedAd;
    }

    // Expose Types for consumers safely
    public getEventTypes() {
        const ads = getRNAds();
        if (!ads) return null;
        return {
            RewardedAdEventType: ads.RewardedAdEventType,
            AdEventType: ads.AdEventType
        };
    }

    private clearListeners() {
        this.listeners.forEach((unsubscribe) => unsubscribe());
        this.listeners = [];
    }
}

export const rewardedAdsService = RewardedAdsService.getInstance();
