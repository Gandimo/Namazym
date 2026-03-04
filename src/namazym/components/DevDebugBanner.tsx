import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

/**
 * Dev-Only Debug Banner
 * Shows packager connection info for troubleshooting
 * Only visible in development mode
 */
export function DevDebugBanner() {
    const [debugInfo, setDebugInfo] = useState<{
        hostType: string;
        packagerUrl: string;
    } | null>(null);

    useEffect(() => {
        if (__DEV__) {
            // Get Expo manifest and connection info
            const manifest = Constants.expoConfig;
            const debuggerHost = Constants.expoConfig?.hostUri || 'unknown';

            // Determine host type from URL
            let hostType = 'unknown';
            if (debuggerHost.includes('tunnel.exp.direct')) {
                hostType = 'tunnel';
            } else if (debuggerHost.includes('localhost') || debuggerHost.includes('127.0.0.1')) {
                hostType = 'localhost';
            } else if (debuggerHost.match(/192\.168\.|10\./)) {
                hostType = 'lan';
            }

            setDebugInfo({
                hostType,
                packagerUrl: debuggerHost,
            });

            // Console log for visibility
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📡 METRO CONNECTION INFO');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`Host Type: ${hostType.toUpperCase()}`);
            console.log(`Packager URL: ${debuggerHost}`);
            console.log(`Port: 8081 (canonical)`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
    }, []);

    // Only show in development
    if (!__DEV__ || !debugInfo) {
        return null;
    }

    return (
        <View style={styles.banner}>
            <Text style={styles.label}>🔧 DEV MODE</Text>
            <Text style={styles.info}>
                {debugInfo.hostType.toUpperCase()} • {debugInfo.packagerUrl}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderTopWidth: 2,
        borderTopColor: '#FFD700',
        zIndex: 9999,
    },
    label: {
        color: '#FFD700',
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 2,
        letterSpacing: 1,
    },
    info: {
        color: '#FFFFFF',
        fontSize: 9,
        fontFamily: 'Courier',
        opacity: 0.9,
    },
});
