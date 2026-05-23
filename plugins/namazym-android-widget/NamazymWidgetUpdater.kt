package com.namazym.app.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context

object NamazymWidgetUpdater {
  fun updateAll(context: Context) {
    val appWidgetManager = AppWidgetManager.getInstance(context)
    updateProvider(context, appWidgetManager, NamazymSmallWidgetProvider::class.java, NamazymWidgetSize.SMALL)
    updateProvider(context, appWidgetManager, NamazymMediumWidgetProvider::class.java, NamazymWidgetSize.MEDIUM)
    updateProvider(context, appWidgetManager, NamazymLargeWidgetProvider::class.java, NamazymWidgetSize.LARGE)
  }

  private fun updateProvider(
    context: Context,
    appWidgetManager: AppWidgetManager,
    providerClass: Class<*>,
    size: NamazymWidgetSize
  ) {
    val ids = appWidgetManager.getAppWidgetIds(ComponentName(context, providerClass))
    if (ids.isNotEmpty()) {
      NamazymWidgetRenderer.update(context, appWidgetManager, ids, size)
    }
  }
}
