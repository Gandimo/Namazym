package com.namazym.app.widget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Woken by the tick alarm (and by TIMEZONE_CHANGED) to re-render all widgets.
 * Every render schedules the next tick, so the chain sustains itself without
 * the app ever being opened.
 */
class NamazymWidgetTickReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    NamazymWidgetUpdater.updateAll(context)
  }
}
