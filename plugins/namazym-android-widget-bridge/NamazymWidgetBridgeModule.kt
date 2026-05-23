package com.namazym.app.widgetbridge

import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.namazym.app.widget.NamazymWidgetUpdater

private const val WIDGET_PREFS_NAME = "namazym_widget"
private const val WIDGET_SNAPSHOT_KEY = "namazym.widget.snapshot.v1"

class NamazymWidgetBridgeModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "NamazymWidgetBridge"

  @ReactMethod
  fun writeSnapshot(json: String, promise: Promise) {
    try {
      reactContext
        .getSharedPreferences(WIDGET_PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .putString(WIDGET_SNAPSHOT_KEY, json)
        .apply()

      NamazymWidgetUpdater.updateAll(reactContext)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("WIDGET_WRITE_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun clearSnapshot(promise: Promise) {
    try {
      reactContext
        .getSharedPreferences(WIDGET_PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .remove(WIDGET_SNAPSHOT_KEY)
        .apply()

      NamazymWidgetUpdater.updateAll(reactContext)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("WIDGET_CLEAR_FAILED", error.message, error)
    }
  }
}
