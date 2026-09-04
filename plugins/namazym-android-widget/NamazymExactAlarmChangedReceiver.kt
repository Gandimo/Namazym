package com.namazym.app.widget

import android.app.AlarmManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import kotlin.concurrent.thread

/**
 * Android 12+ fires SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED when the
 * user grants "Alarms & reminders" access. expo-notifications re-registers
 * every stored future notification through its boot-setup routine, and that
 * path picks setExactAndAllowWhileIdle() once the access is granted.
 *
 * IMPORTANT: the routine is invoked as a DIRECT in-process method call.
 * Broadcasting ACTION_BOOT_COMPLETED — even explicitly to our own component —
 * is rejected by the system (protected action) and the resulting
 * SecurityException would crash the app. Every step below is throwable-proof:
 * a failed re-registration is only an optimization loss (the app repairs the
 * schedule on next launch via its own reconciliation), never a crash.
 */
class NamazymExactAlarmChangedReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
    if (intent?.action != AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED) return

    val pendingResult = goAsync()
    thread {
      try {
        try {
          expo.modules.notifications.service.NotificationsService()
            .handleIntent(context, Intent(Intent.ACTION_BOOT_COMPLETED))
        } catch (_: Throwable) {
          // Yeniden kayıt başarısız olsa da uygulama açılışında onarılır.
        }
        try {
          NamazymWidgetUpdater.updateAll(context)
        } catch (_: Throwable) {
        }
      } finally {
        pendingResult.finish()
      }
    }
  }
}
