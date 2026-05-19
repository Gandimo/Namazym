import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const JUMA_REMINDER_CHANNEL_ID = 'juma-reminder';
export const JUMA_REMINDER_WEEKDAY = 6; // Expo weekly trigger: Sunday = 1, Friday = 6
export const JUMA_REMINDER_DEFAULT_HOUR = 11;
export const JUMA_REMINDER_DEFAULT_MINUTE = 30;
export const JUMA_REMINDER_DEV_TEST_TYPE = 'juma_reminder_dev_test';

type ScheduledNotificationLike = Awaited<ReturnType<typeof Notifications.getAllScheduledNotificationsAsync>>[number];

function debugLog(...args: unknown[]) {
    if (!__DEV__) return;
    console.log(...args);
}

async function ensureJumaReminderChannel() {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync(JUMA_REMINDER_CHANNEL_ID, {
        name: 'Juma Reminder',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        enableVibrate: true,
    });
}

async function ensureNotificationPermission(): Promise<boolean> {
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;
    debugLog(`[JumaReminder] Existing permission status: ${existing.status}`);

    if (finalStatus !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        finalStatus = requested.status;
        debugLog(`[JumaReminder] Requested permission status: ${requested.status}`);
    }

    debugLog(`[JumaReminder] Permission granted: ${finalStatus === 'granted'}`);
    return finalStatus === 'granted';
}

function isJumaReminder(request: ScheduledNotificationLike) {
    return request.content.data?.type === 'juma_reminder';
}

function isDevJumaReminderTest(request: ScheduledNotificationLike) {
    return request.content.data?.type === JUMA_REMINDER_DEV_TEST_TYPE;
}

function summarizeScheduledNotification(request: ScheduledNotificationLike) {
    const trigger = request.trigger as any;
    return {
        identifier: request.identifier,
        type: request.content.data?.type,
        trigger: {
            type: trigger?.type,
            channelId: trigger?.channelId,
            weekday: trigger?.weekday,
            hour: trigger?.hour,
            minute: trigger?.minute,
            repeats: trigger?.repeats,
            date: trigger?.date,
        },
    };
}

export async function cancelScheduledJumaReminders() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const jumaReminders = scheduled.filter(isJumaReminder);

    await Promise.all(
        jumaReminders.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
    );

    debugLog(`[JumaReminder] Cancelled ${jumaReminders.length} existing Juma reminder notification(s).`);
}

async function cancelScheduledDevJumaReminderTests() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const devTests = scheduled.filter(isDevJumaReminderTest);

    await Promise.all(
        devTests.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
    );

    debugLog(`[JumaReminder][DEV] Cancelled ${devTests.length} existing DEV Juma test notification(s).`);
}

export async function scheduleWeeklyJumaReminder(
    hour = JUMA_REMINDER_DEFAULT_HOUR,
    minute = JUMA_REMINDER_DEFAULT_MINUTE,
) {
    const hasPermission = await ensureNotificationPermission();
    if (!hasPermission) return null;

    await ensureJumaReminderChannel();
    await cancelScheduledJumaReminders();

    const identifier = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Juma mübarek',
            body: 'Juma namazyñyz kabul bolsun 🤲',
            sound: true,
            data: { type: 'juma_reminder' },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: JUMA_REMINDER_WEEKDAY,
            hour,
            minute,
            channelId: JUMA_REMINDER_CHANNEL_ID,
        },
    });

    debugLog(`[JumaReminder] Scheduled weekly Juma reminder for weekday=${JUMA_REMINDER_WEEKDAY} at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} with id=${identifier}`);

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    debugLog(
        '[JumaReminder] Scheduled notifications snapshot:',
        scheduled.map(summarizeScheduledNotification),
    );

    return identifier;
}

export async function scheduleDevJumaReminderTestNotification() {
    if (!__DEV__) return null;

    const hasPermission = await ensureNotificationPermission();
    if (!hasPermission) return null;

    await ensureJumaReminderChannel();
    await cancelScheduledDevJumaReminderTests();

    const date = new Date();
    date.setMinutes(date.getMinutes() + 1);
    date.setSeconds(0, 0);

    const identifier = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Juma test',
            body: 'This is a DEV test notification for the Juma reminder.',
            sound: true,
            data: { type: JUMA_REMINDER_DEV_TEST_TYPE },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date,
            channelId: JUMA_REMINDER_CHANNEL_ID,
        } as any,
    });

    debugLog(`[JumaReminder][DEV] Scheduled one-time Juma test notification for ${date.toISOString()} with id=${identifier}`);

    return identifier;
}
