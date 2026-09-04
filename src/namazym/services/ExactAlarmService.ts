import { NativeModules, Platform } from 'react-native';

export interface AlarmAccessStatus {
    /**
     * Android 12+: whether the "Alarms & reminders" special access is granted.
     * Without it expo-notifications silently falls back to INEXACT alarms and
     * Doze delays prayer notifications until the phone is unlocked.
     * Always true on iOS and on Android < 12.
     */
    canScheduleExactAlarms: boolean;
    /** False when battery optimization may throttle the app (Samsung etc.). */
    isIgnoringBatteryOptimizations: boolean;
}

interface NamazymAlarmAccessModule {
    getStatus: () => Promise<AlarmAccessStatus>;
    openExactAlarmSettings: () => Promise<boolean>;
    openBatteryOptimizationSettings: () => Promise<boolean>;
}

const nativeModule = NativeModules.NamazymAlarmAccess as NamazymAlarmAccessModule | undefined;

const GRANTED_STATUS: AlarmAccessStatus = {
    canScheduleExactAlarms: true,
    isIgnoringBatteryOptimizations: true,
};

const isSupported = (): boolean => {
    return Platform.OS === 'android' && !!nativeModule && typeof nativeModule.getStatus === 'function';
};

export const ExactAlarmService = {
    isSupported,

    async getStatus(): Promise<AlarmAccessStatus> {
        if (!isSupported()) {
            return GRANTED_STATUS;
        }
        try {
            const status = await nativeModule!.getStatus();
            return {
                canScheduleExactAlarms: status?.canScheduleExactAlarms !== false,
                isIgnoringBatteryOptimizations: status?.isIgnoringBatteryOptimizations !== false,
            };
        } catch (error) {
            console.warn('[ExactAlarmService] getStatus failed:', error);
            return GRANTED_STATUS;
        }
    },

    /** Opens the system "Alarms & reminders" page for this app (Android 12+). */
    async openExactAlarmSettings(): Promise<boolean> {
        if (!isSupported()) {
            return false;
        }
        try {
            return await nativeModule!.openExactAlarmSettings();
        } catch (error) {
            console.warn('[ExactAlarmService] openExactAlarmSettings failed:', error);
            return false;
        }
    },

    async openBatteryOptimizationSettings(): Promise<boolean> {
        if (!isSupported()) {
            return false;
        }
        try {
            return await nativeModule!.openBatteryOptimizationSettings();
        } catch (error) {
            console.warn('[ExactAlarmService] openBatteryOptimizationSettings failed:', error);
            return false;
        }
    },
};
