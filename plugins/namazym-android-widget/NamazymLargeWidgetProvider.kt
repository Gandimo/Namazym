package com.namazym.app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context

class NamazymLargeWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    NamazymWidgetRenderer.update(context, appWidgetManager, appWidgetIds, NamazymWidgetSize.LARGE)
  }
}
