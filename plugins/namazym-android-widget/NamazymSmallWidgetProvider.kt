package com.namazym.app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context

class NamazymSmallWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    NamazymWidgetRenderer.update(context, appWidgetManager, appWidgetIds, NamazymWidgetSize.SMALL)
  }
}
