import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/NotificationService';

/**
 * Dev-Only Notification Test Screen
 * Quick triggers for testing notification sounds and behaviors
 * Only visible in __DEV__ mode
 */
export function NotificationTestScreen() {
    const [status, setStatus] = React.useState<string>('Ready');

    const testPrayerNotification = async () => {
        try {
            setStatus('Triggering PRAYER notification...');

            // Request permissions first
            const granted = await NotificationService.requestPermissions();
            if (!granted) {
                setStatus('❌ Permissions denied');
                return;
            }

            // Trigger immediate prayer notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Ertir namazynyň wagty',
                    body: 'Ertir namazynyň wagty boldy',
                    data: { type: 'prayer_alert', prayer: 'test' },
                    sound: true,
                },
                trigger: {
                    seconds: 2, // Fire in 2 seconds
                    channelId: 'prayer-alerts', // PRAYER channel: namaz_chime.wav + gentle pulse
                } as any,
            });

            setStatus('✅ PRAYER notification scheduled (2s)');
        } catch (error: any) {
            setStatus(`❌ Error: ${error.message}`);
        }
    };

    const testReminderNotification = async () => {
        try {
            setStatus('Triggering REMINDER notification...');

            const granted = await NotificationService.requestPermissions();
            if (!granted) {
                setStatus('❌ Permissions denied');
                return;
            }

            // Trigger immediate reminder notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Öýle namazy',
                    body: 'Öýle namazyna 15 minut galdy',
                    data: { type: 'pre_prayer_reminder', prayer: 'test' },
                    sound: true,
                },
                trigger: {
                    seconds: 2,
                    channelId: 'reminder-soft', // REMINDER channel: reminder_soft.wav + no vibration
                } as any,
            });

            setStatus('✅ REMINDER notification scheduled (2s)');
        } catch (error: any) {
            setStatus(`❌ Error: ${error.message}`);
        }
    };

    const testDailyVerseNotification = async () => {
        try {
            setStatus('Triggering DAILY VERSE notification...');

            const granted = await NotificationService.requestPermissions();
            if (!granted) {
                setStatus('❌ Permissions denied');
                return;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Günüň Aýaty',
                    body: 'Test verse notification\n\n— 18:39',
                    data: { type: 'daily_verse' },
                    sound: true,
                },
                trigger: {
                    seconds: 2,
                    channelId: 'reminder-soft', // REMINDER channel
                } as any,
            });

            setStatus('✅ DAILY VERSE notification scheduled (2s)');
        } catch (error: any) {
            setStatus(`❌ Error: ${error.message}`);
        }
    };

    const clearAllNotifications = async () => {
        try {
            await NotificationService.clearAll();
            setStatus('✅ All notifications cleared');
        } catch (error: any) {
            setStatus(`❌ Error: ${error.message}`);
        }
    };

    if (!__DEV__) {
        return null; // Only show in development
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>🔔 Notification Sound Test</Text>
            <Text style={styles.subtitle}>Test premium notification channels</Text>

            <View style={styles.statusBox}>
                <Text style={styles.statusText}>{status}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Channel Tests</Text>

                <Pressable style={styles.buttonPrayer} onPress={testPrayerNotification}>
                    <Text style={styles.buttonText}>🕌 Test PRAYER Channel</Text>
                    <Text style={styles.buttonSubtext}>namaz_chime.wav + gentle pulse</Text>
                </Pressable>

                <Pressable style={styles.buttonReminder} onPress={testReminderNotification}>
                    <Text style={styles.buttonText}>⏰ Test REMINDER Channel</Text>
                    <Text style={styles.buttonSubtext}>reminder_soft.wav + no vibration</Text>
                </Pressable>

                <Pressable style={styles.buttonVerse} onPress={testDailyVerseNotification}>
                    <Text style={styles.buttonText}>📖 Test DAILY VERSE</Text>
                    <Text style={styles.buttonSubtext}>Uses REMINDER channel</Text>
                </Pressable>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Utilities</Text>

                <Pressable style={styles.buttonClear} onPress={clearAllNotifications}>
                    <Text style={styles.buttonText}>🗑️ Clear All Notifications</Text>
                </Pressable>
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>ℹ️ Android Channel Info</Text>
                <Text style={styles.infoText}>
                    Channel settings are immutable after creation.{'\n'}
                    To apply sound changes: Uninstall → Reinstall app.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
        color: '#000',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    statusBox: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    statusText: {
        color: '#FFD700',
        fontFamily: 'Courier',
        fontSize: 12,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        color: '#333',
    },
    buttonPrayer: {
        backgroundColor: '#7A5A12',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    buttonReminder: {
        backgroundColor: '#4A7C59',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    buttonVerse: {
        backgroundColor: '#5A6B7A',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    buttonClear: {
        backgroundColor: '#E74C3C',
        padding: 16,
        borderRadius: 12,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    buttonSubtext: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
    },
    infoBox: {
        backgroundColor: '#FFF3CD',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FFD700',
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        color: '#856404',
    },
    infoText: {
        fontSize: 12,
        color: '#856404',
        lineHeight: 18,
    },
});
