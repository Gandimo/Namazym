package com.namazym.app.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context

object NamazymWidgetUpdater {
  fun updateAll(context: Context) {
    val appWidgetManager = AppWidgetManager.getInstance(context)
    val snapshot = NamazymWidgetStateResolver.resolve(
      NamazymWidgetRenderer.readSnapshot(context),
      System.currentTimeMillis()
    )

    var hasWidgets = false
    hasWidgets = updateProvider(context, appWidgetManager, NamazymSmallWidgetProvider::class.java, NamazymWidgetSize.SMALL, snapshot) || hasWidgets
    hasWidgets = updateProvider(context, appWidgetManager, NamazymMediumWidgetProvider::class.java, NamazymWidgetSize.MEDIUM, snapshot) || hasWidgets
    hasWidgets = updateProvider(context, appWidgetManager, NamazymLargeWidgetProvider::class.java, NamazymWidgetSize.LARGE, snapshot) || hasWidgets

    if (hasWidgets) {
      NamazymWidgetTickScheduler.scheduleNext(
        context,
        snapshot?.optLong(NamazymWidgetStateResolver.NEXT_TICK_KEY, 0L) ?: 0L
      )
    } else {
      NamazymWidgetTickScheduler.cancel(context)
    }
  }

  private fun updateProvider(
    context: Context,
    appWidgetManager: AppWidgetManager,
    providerClass: Class<*>,
    size: NamazymWidgetSize,
    snapshot: org.json.JSONObject?
  ): Boolean {
    val ids = appWidgetManager.getAppWidgetIds(ComponentName(context, providerClass))
    if (ids.isNotEmpty()) {
      NamazymWidgetRenderer.update(context, appWidgetManager, ids, size, snapshot)
      return true
    }
    return false
  }
}
