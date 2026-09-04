package com.namazym.app.widgetbridge

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Exposes the Android 12+ exact-alarm special access state to JS.
 * expo-notifications only uses setExactAndAllowWhileIdle() when
 * AlarmManager.canScheduleExactAlarms() is true — without it every prayer
 * notification is scheduled INEXACTLY and Doze delays it until unlock.
 */
class NamazymAlarmAccessModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "NamazymAlarmAccess"

  @ReactMethod
  fun getStatus(promise: Promise) {
    try {
      val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()

      val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
      val ignoringBattery = powerManager.isIgnoringBatteryOptimizations(reactContext.packageName)

      val result = Arguments.createMap()
      result.putBoolean("canScheduleExactAlarms", canExact)
      result.putBoolean("isIgnoringBatteryOptimizations", ignoringBattery)
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("ALARM_ACCESS_STATUS_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun openExactAlarmSettings(promise: Promise) {
    val launched = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      startSettingsActivity(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, withPackageUri = true)
        || startSettingsActivity(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, withPackageUri = true)
    } else {
      startSettingsActivity(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, withPackageUri = true)
    }
    promise.resolve(launched)
  }

  @ReactMethod
  fun openBatteryOptimizationSettings(promise: Promise) {
    val launched = startSettingsActivity(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS, withPackageUri = false)
      || startSettingsActivity(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, withPackageUri = true)
    promise.resolve(launched)
  }

  private fun startSettingsActivity(action: String, withPackageUri: Boolean): Boolean {
    return try {
      val intent = Intent(action)
      if (withPackageUri) {
        intent.data = Uri.parse("package:" + reactContext.packageName)
      }
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(intent)
      true
    } catch (_: Exception) {
      false
    }
  }
}
