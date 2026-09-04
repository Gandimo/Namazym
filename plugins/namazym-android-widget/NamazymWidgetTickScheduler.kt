package com.namazym.app.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Schedules the next widget re-render with AlarmManager.
 *
 * Uses non-wakeup RTC on purpose: while the screen is off the widget is not
 * visible, so there is no reason to wake the device — the pending alarm is
 * delivered the moment the user wakes the phone, which re-renders the widget
 * before they can look at it. Costs zero battery in Doze.
 */
object NamazymWidgetTickScheduler {
  private const val REQUEST_CODE = 48801

  fun scheduleNext(context: Context, tickAtMs: Long) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    val pendingIntent = buildPendingIntent(context)

    alarmManager.cancel(pendingIntent)
    if (tickAtMs <= 0L) {
      return
    }

    try {
      val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()
      if (canExact) {
        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC, tickAtMs, pendingIntent)
      } else {
        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC, tickAtMs, pendingIntent)
      }
    } catch (_: SecurityException) {
      // Exact-alarm access revoked between check and set — fall back.
      alarmManager.setAndAllowWhileIdle(AlarmManager.RTC, tickAtMs, pendingIntent)
    }
  }

  fun cancel(context: Context) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    alarmManager.cancel(buildPendingIntent(context))
  }

  private fun buildPendingIntent(context: Context): PendingIntent {
    val intent = Intent(context, NamazymWidgetTickReceiver::class.java)
    return PendingIntent.getBroadcast(
      context,
      REQUEST_CODE,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }
}
