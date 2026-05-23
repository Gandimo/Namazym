import { NativeModules, Platform } from 'react-native';

interface NamazymWidgetBridgeModule {
    writeSnapshot: (json: string) => Promise<void>;
    clearSnapshot: () => Promise<void>;
}

const nativeBridge = NativeModules.NamazymWidgetBridge as NamazymWidgetBridgeModule | undefined;

const isAvailable = (): boolean => {
    return (Platform.OS === 'ios' || Platform.OS === 'android')
        && !!nativeBridge
        && typeof nativeBridge.writeSnapshot === 'function'
        && typeof nativeBridge.clearSnapshot === 'function';
};

export const WidgetBridge = {
    async writeSnapshot(json: string): Promise<void> {
        if (!isAvailable()) {
            return;
        }

        await nativeBridge?.writeSnapshot(json);
    },

    async clearSnapshot(): Promise<void> {
        if (!isAvailable()) {
            return;
        }

        await nativeBridge?.clearSnapshot();
    },
};
