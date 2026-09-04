package com.namazym.app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context

class NamazymSmallWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    // Full update path: resolve snapshot at render time + chain the next tick.
    NamazymWidgetUpdater.updateAll(context)
  }

  override fun onDisabled(context: Context) {
    NamazymWidgetUpdater.updateAll(context)
  }
}
