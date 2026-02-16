import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { PrayerTimeDisplay } from "./PrayerTimesAdapter";

export class NotificationService {
    /**
     * Request permissions and setup channels
     */
    static async requestPermissions() {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("prayer-alerts", {
                name: "Namaz Wagty",
                importance: Notifications.AndroidImportance.MAX,
                sound: "default",
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#7A5A12",
            });
        }
        return finalStatus === "granted";
    }

    /**
     * Schedule all daily prayer notifications
     * @param todayData Prayer timings for today
     * @param offsetMinutes Minutes before the actual time (default 0)
     */
    static async scheduleDailyNotifications(todayData: PrayerTimeDisplay, offsetMinutes: number = 0) {
        // 1. Cancel existing
        await Notifications.cancelAllScheduledNotificationsAsync();

        const timings = todayData.timings;
        const prayerNames: Record<string, string> = {
            Fajr: "Bomdad (Säher)",
            Dhuhr: "Öýle",
            Asr: "Namazdy",
            Maghrib: "Agşam (Iftar)",
            Isha: "Ýassy"
        };

        const now = new Date();

        for (const [key, timeStr] of Object.entries(timings)) {
            if (key === "Sunrise") continue; // No notification for sunrise usually
            if (!prayerNames[key]) continue;

            const [hours, minutes] = timeStr.split(":").map(Number);
            const scheduleDate = new Date();
            scheduleDate.setHours(hours, minutes, 0, 0);

            // Apply offset
            if (offsetMinutes > 0) {
                scheduleDate.setMinutes(scheduleDate.getMinutes() - offsetMinutes);
            }

            // Only schedule if it's in the future
            if (scheduleDate > now) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: prayerNames[key],
                        body: offsetMinutes > 0
                            ? `${offsetMinutes} minutdan soň ${prayerNames[key]} wagty girýär.`
                            : `${prayerNames[key]} wagty girdi.`,
                        data: { type: "prayer_alert", prayer: key },
                        sound: true,
                        categoryIdentifier: "prayer",
                    },
                    trigger: {
                        date: scheduleDate,
                    },
                });
                console.log(`Scheduled ${key} for ${scheduleDate.toLocaleTimeString()}`);
            }
        }
    }
}
