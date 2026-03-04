export class IconAnalyticsService {
    /**
     * Tracks a tap on a premium icon.
     * @param iconName Name of the icon tapped
     * @param component Component where the icon is used
     * @param isGradient Whether the icon had a 3D gradient applied
     */
    static trackIconTap(iconName: string, component?: string, isGradient: boolean = false) {
        // In a real production app, this would send data to Firebase/Mixpanel
        // For now, we log to console in development mode
        if (__DEV__) {
            console.log(`[IconAnalytics] 🎯 Tapped: ${iconName} | Source: ${component || 'Unknown'} | Premium: ${isGradient}`);
        }

        // Placeholder for real analytics integration:
        // Analytics.logEvent('premium_icon_tap', { iconName, component, isGradient });
    }

    /**
     * Tracks icon system performance (render time etc)
     */
    static trackRenderPerformance(component: string, timeMs: number) {
        if (__DEV__ && timeMs > 16) {
            console.warn(`[IconAnalytics] ⏳ Slow Icon Render: ${component} took ${timeMs}ms`);
        }
    }
}
