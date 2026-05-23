package com.namazym.app.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.graphics.Color
import android.view.View
import android.widget.RemoteViews
import com.namazym.app.R
import org.json.JSONArray
import org.json.JSONObject

private const val WIDGET_PREFS_NAME = "namazym_widget"
private const val WIDGET_SNAPSHOT_KEY = "namazym.widget.snapshot.v1"

enum class NamazymWidgetSize {
  SMALL,
  MEDIUM,
  LARGE
}

private data class WidgetPalette(
  val background: Int,
  val accent: Int,
  val primary: Int,
  val secondary: Int
)

object NamazymWidgetRenderer {
  fun update(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
    size: NamazymWidgetSize
  ) {
    val snapshot = readSnapshot(context)

    for (widgetId in appWidgetIds) {
      val views = when (size) {
        NamazymWidgetSize.SMALL -> renderSmall(context, snapshot)
        NamazymWidgetSize.MEDIUM -> renderMedium(context, snapshot)
        NamazymWidgetSize.LARGE -> renderLarge(context, snapshot)
      }
      appWidgetManager.updateAppWidget(widgetId, views)
    }
  }

  private fun readSnapshot(context: Context): JSONObject? {
    val json = context
      .getSharedPreferences(WIDGET_PREFS_NAME, Context.MODE_PRIVATE)
      .getString(WIDGET_SNAPSHOT_KEY, null)

    return try {
      if (json.isNullOrBlank()) null else JSONObject(json)
    } catch (_: Exception) {
      null
    }
  }

  private fun renderSmall(context: Context, snapshot: JSONObject?): RemoteViews {
    val palette = paletteFor(snapshot)
    val views = RemoteViews(context.packageName, R.layout.namazym_widget_small)
    val cityName = snapshot?.optJSONObject("city")?.optString("name").orEmpty().ifBlank { "Namazym" }
    val current = snapshot?.optJSONObject("currentPrayer")
    val next = snapshot?.optJSONObject("nextPrayer")
    val remaining = snapshot?.optJSONObject("remaining")?.optString("display").orEmpty().ifBlank { "Namazym açyň" }

    views.setInt(R.id.widget_root, "setBackgroundColor", palette.background)
    views.setTextViewText(R.id.widget_city, cityName)
    views.setTextViewText(R.id.widget_prayer_label, current?.optString("label").orEmpty().ifBlank {
      next?.optString("label").orEmpty().ifBlank { "Namaz" }
    })
    views.setTextViewText(R.id.widget_remaining, remaining)
    views.setTextViewText(R.id.widget_next_pill, next?.let { "${it.optString("label")} ${it.optString("time")}" } ?: "Namazym")
    views.setTextColor(R.id.widget_city, palette.secondary)
    views.setTextColor(R.id.widget_prayer_label, palette.secondary)
    views.setTextColor(R.id.widget_remaining, palette.primary)
    views.setTextColor(R.id.widget_next_pill, palette.primary)
    return views
  }

  private fun renderMedium(context: Context, snapshot: JSONObject?): RemoteViews {
    val palette = paletteFor(snapshot)
    val views = RemoteViews(context.packageName, R.layout.namazym_widget_medium)
    val cityName = snapshot?.optJSONObject("city")?.optString("name").orEmpty().ifBlank { "Namazym" }
    val next = snapshot?.optJSONObject("nextPrayer")
    val remaining = snapshot?.optJSONObject("remaining")?.optString("display").orEmpty().ifBlank { "Namazym açyň" }
    val prayers = snapshot?.optJSONArray("prayers") ?: JSONArray()

    views.setInt(R.id.widget_root, "setBackgroundColor", palette.background)
    views.setTextViewText(R.id.widget_city, cityName)
    views.setTextViewText(R.id.widget_remaining_chip, remaining)
    views.setTextViewText(R.id.widget_featured, next?.let { "${it.optString("label")} • ${it.optString("time")}" } ?: "Namaz wagtlary")

    val labelIds = intArrayOf(
      R.id.prayer_0_label,
      R.id.prayer_1_label,
      R.id.prayer_2_label,
      R.id.prayer_3_label,
      R.id.prayer_4_label,
      R.id.prayer_5_label
    )
    val timeIds = intArrayOf(
      R.id.prayer_0_time,
      R.id.prayer_1_time,
      R.id.prayer_2_time,
      R.id.prayer_3_time,
      R.id.prayer_4_time,
      R.id.prayer_5_time
    )

    for (index in labelIds.indices) {
      val prayer = prayers.optJSONObject(index)
      views.setTextViewText(labelIds[index], prayer?.optString("label").orEmpty().ifBlank { "—" })
      views.setTextViewText(timeIds[index], prayer?.optString("time").orEmpty().ifBlank { "--:--" })
      views.setTextColor(labelIds[index], palette.secondary)
      views.setTextColor(timeIds[index], palette.primary)
    }

    views.setTextColor(R.id.widget_city, palette.secondary)
    views.setTextColor(R.id.widget_remaining_chip, palette.primary)
    views.setTextColor(R.id.widget_featured, palette.primary)
    return views
  }

  private fun renderLarge(context: Context, snapshot: JSONObject?): RemoteViews {
    val palette = paletteFor(snapshot)
    val views = RemoteViews(context.packageName, R.layout.namazym_widget_large)
    val cityName = snapshot?.optJSONObject("city")?.optString("name").orEmpty().ifBlank { "Namazym" }
    val next = snapshot?.optJSONObject("nextPrayer")
    val remaining = snapshot?.optJSONObject("remaining")?.optString("display").orEmpty().ifBlank { "Namazym açyň" }
    val verse = snapshot?.optJSONObject("dailyVerse")

    views.setInt(R.id.widget_root, "setBackgroundColor", palette.background)
    views.setTextViewText(R.id.widget_city, cityName)
    views.setTextViewText(R.id.widget_remaining_chip, remaining)
    views.setTextViewText(R.id.widget_section_title, "GÜNÜŇ AÝATY")
    views.setTextViewText(
      R.id.widget_verse,
      verse?.optString("text").orEmpty().ifBlank { "Namazym açyň, günüň aýatyny widgetde görkeziň." }
    )
    views.setTextViewText(R.id.widget_reference, verse?.optString("reference").orEmpty().ifBlank { "Gurhan" })
    views.setTextViewText(R.id.widget_footer, next?.let { "${it.optString("label")} • ${it.optString("time")}" } ?: "Namazym")
    views.setTextColor(R.id.widget_city, palette.secondary)
    views.setTextColor(R.id.widget_remaining_chip, palette.primary)
    views.setTextColor(R.id.widget_section_title, palette.accent)
    views.setTextColor(R.id.widget_verse, palette.primary)
    views.setTextColor(R.id.widget_reference, palette.accent)
    views.setTextColor(R.id.widget_footer, palette.secondary)
    return views
  }

  private fun paletteFor(snapshot: JSONObject?): WidgetPalette {
    val moodKey = snapshot?.optJSONObject("visualMood")?.optString("key").orEmpty().lowercase()
    return when (moodKey) {
      "fajr" -> WidgetPalette(Color.rgb(19, 29, 55), Color.rgb(154, 199, 235), Color.rgb(255, 248, 232), Color.rgb(204, 219, 238))
      "sunrise" -> WidgetPalette(Color.rgb(250, 223, 177), Color.rgb(175, 105, 39), Color.rgb(54, 38, 24), Color.rgb(102, 73, 47))
      "dhuhr" -> WidgetPalette(Color.rgb(248, 238, 211), Color.rgb(153, 107, 34), Color.rgb(49, 39, 26), Color.rgb(103, 82, 52))
      "asr" -> WidgetPalette(Color.rgb(232, 195, 143), Color.rgb(164, 83, 33), Color.rgb(52, 34, 22), Color.rgb(105, 69, 45))
      "maghrib" -> WidgetPalette(Color.rgb(222, 171, 159), Color.rgb(151, 66, 59), Color.rgb(49, 30, 30), Color.rgb(103, 62, 59))
      "isha" -> WidgetPalette(Color.rgb(24, 27, 59), Color.rgb(174, 178, 255), Color.rgb(255, 248, 232), Color.rgb(211, 211, 239))
      else -> WidgetPalette(
        parseColor(snapshot?.optJSONObject("visualMood")?.optString("backgroundColor"), Color.rgb(246, 241, 232)),
        parseColor(snapshot?.optJSONObject("visualMood")?.optString("accentColor"), Color.rgb(184, 132, 59)),
        Color.rgb(43, 43, 52),
        Color.rgb(92, 86, 78)
      )
    }
  }

  private fun parseColor(value: String?, fallback: Int): Int {
    return try {
      if (value.isNullOrBlank()) fallback else Color.parseColor(value)
    } catch (_: Exception) {
      fallback
    }
  }
}
