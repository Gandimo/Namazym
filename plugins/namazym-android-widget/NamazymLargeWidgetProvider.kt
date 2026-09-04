package com.namazym.app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context

class NamazymLargeWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    NamazymWidgetUpdater.updateAll(context)
  }

  override fun onDisabled(context: Context) {
    NamazymWidgetUpdater.updateAll(context)
  }
}
