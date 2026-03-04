import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * NAMAZYM Luxury Haptic Service
 * 
 * Philosophy: "Quiet Premium"
 * - Vibrations must feel like high-end material responses.
 * - Avoid cheap "buzzing".
 * - Prefer "taps", "ticks", and "thuds".
 */
export class HapticService {
    /**
     * Subtle "Tick" - Use for mechanism changes (pickers, scroll snaps)
     */
    static async selection() {
        if (Platform.OS === 'web') return;
        try {
            await Haptics.selectionAsync();
        } catch (e) {
            // Fail silently
        }
    }

    /**
     * Soft "Thud" - Use for button presses, card touches (Primary Interaction)
     * Corresponds to iOS UIImpactFeedbackStyleLight
     */
    static async softImpact() {
        if (Platform.OS === 'web') return;
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {
            // Fail silently
        }
    }

    /**
     * Firm "Click" - Use for confirming actions or successful state changes
     * Corresponds to iOS UIImpactFeedbackStyleMedium
     */
    static async mediumImpact() {
        if (Platform.OS === 'web') return;
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {
            // Fail silently
        }
    }

    /**
     * Solid "Lock" - Use for critical errors or rigid boundaries
     * Corresponds to iOS UIImpactFeedbackStyleRigid (if available) or Heavy
     */
    static async rigidImpact() {
        if (Platform.OS === 'web') return;
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (e) {
            // Fail silently
        }
    }

    /**
     * Success "Ripple" - Use for completion of a task (e.g. Tasbih count target)
     */
    static async success() {
        if (Platform.OS === 'web') return;
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            // Fail silently
        }
    }

    /**
     * Notification Feedback - Success, Warning, Error
     */
    static async notification(type: 'success' | 'warning' | 'error') {
        if (Platform.OS === 'web') return;
        try {
            const feedbackType = {
                'success': Haptics.NotificationFeedbackType.Success,
                'warning': Haptics.NotificationFeedbackType.Warning,
                'error': Haptics.NotificationFeedbackType.Error
            }[type];
            await Haptics.notificationAsync(feedbackType);
        } catch (e) {
            // Fail silently
        }
    }
}
