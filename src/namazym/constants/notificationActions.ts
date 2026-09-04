/**
 * Notification action identifiers.
 *
 * The azan alert carries a "marked as prayed" button so the daily streak can be
 * kept without opening the app — the tracking has to cost less than the prayer
 * reminder itself, or nobody keeps it up.
 *
 * Copy is Turkmen, matching the rest of the notification copy in
 * `notificationCopy.ts`; notifications are not translated in this app.
 */
export const PRAYER_ACTION_CATEGORY = 'namazym_prayer_v1';
export const MARK_PRAYED_ACTION = 'namazym_mark_prayed';
export const MARK_PRAYED_BUTTON_TITLE = 'Okadym';
