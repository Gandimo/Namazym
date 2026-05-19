import type { ExpoConfig } from '@expo/config';

const baseConfig = require('./app.json') as { expo: ExpoConfig };

export default (): ExpoConfig => {
    const expoConfig: ExpoConfig = JSON.parse(JSON.stringify(baseConfig.expo));
    const isLocalExpoGoDevelopment = process.env.NODE_ENV !== 'production' && !process.env.EAS_BUILD;

    if (isLocalExpoGoDevelopment) {
        delete expoConfig.runtimeVersion;
        delete expoConfig.updates;
    }

    return expoConfig;
};
