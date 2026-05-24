package com.namazym.app.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.graphics.Color
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
  val accent: Int,
  val primary: Int,
  val secondary: Int,
  val muted: Int
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
    val prayers = snapshot?.optJSONArray("prayers") ?: JSONArray()

    views.setTextViewText(R.id.widget_city, cityName)
    views.setTextViewText(R.id.widget_remaining_chip, remainingChipText(snapshot))
    views.setTextViewText(R.id.widget_featured, next?.let { "${it.optString("label")} • ${it.optString("time")}" } ?: "Namaz wagtlary")

    val nextKey = next?.optString("key").orEmpty()
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
    val cellIds = intArrayOf(
      R.id.prayer_0_cell,
      R.id.prayer_1_cell,
      R.id.prayer_2_cell,
      R.id.prayer_3_cell,
      R.id.prayer_4_cell,
      R.id.prayer_5_cell
    )

    for (index in labelIds.indices) {
      val prayer = prayers.optJSONObject(index)
      val isNext = prayer?.optString("key").orEmpty() == nextKey
      views.setInt(
        cellIds[index],
        "setBackgroundResource",
        if (isNext) R.drawable.namazym_widget_prayer_active else R.drawable.namazym_widget_pill
      )
      views.setTextViewText(labelIds[index], prayer?.optString("label").orEmpty().ifBlank { "—" })
      views.setTextViewText(timeIds[index], prayer?.optString("time").orEmpty().ifBlank { "--:--" })
      views.setTextColor(labelIds[index], if (isNext) palette.accent else palette.secondary)
      views.setTextColor(timeIds[index], if (isNext) palette.primary else palette.secondary)
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
    val verse = snapshot?.optJSONObject("dailyVerse")

    views.setTextViewText(R.id.widget_city, cityName)
    views.setTextViewText(R.id.widget_remaining_chip, remainingChipText(snapshot))
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

  private fun remainingChipText(snapshot: JSONObject?): String {
    val display = snapshot?.optJSONObject("remaining")?.optString("display").orEmpty()
    return if (display.isBlank()) {
      "Programmany açyň"
    } else if (display.lowercase().contains("galdy")) {
      display
    } else {
      "$display galdy"
    }
  }

  private fun paletteFor(snapshot: JSONObject?): WidgetPalette {
    val moodKey = snapshot?.optJSONObject("visualMood")?.optString("key").orEmpty().lowercase()
    return when (moodKey) {
      "fajr" -> WidgetPalette(Color.rgb(168, 205, 241), Color.rgb(255, 248, 234), Color.rgb(207, 214, 238), Color.rgb(143, 150, 184))
      "sunrise" -> WidgetPalette(Color.rgb(241, 215, 154), Color.rgb(255, 248, 234), Color.rgb(221, 211, 188), Color.rgb(151, 143, 122))
      "dhuhr" -> WidgetPalette(Color.rgb(216, 181, 106), Color.rgb(255, 248, 234), Color.rgb(201, 205, 232), Color.rgb(143, 150, 184))
      "asr" -> WidgetPalette(Color.rgb(229, 166, 93), Color.rgb(255, 248, 234), Color.rgb(218, 198, 167), Color.rgb(150, 132, 105))
      "maghrib" -> WidgetPalette(Color.rgb(230, 148, 121), Color.rgb(255, 248, 234), Color.rgb(226, 201, 196), Color.rgb(156, 125, 123))
      "isha" -> WidgetPalette(Color.rgb(174, 178, 255), Color.rgb(255, 248, 234), Color.rgb(211, 211, 239), Color.rgb(143, 150, 184))
      else -> WidgetPalette(
        parseColor(snapshot?.optJSONObject("visualMood")?.optString("accentColor"), Color.rgb(184, 132, 59)),
        Color.rgb(255, 248, 234),
        Color.rgb(201, 205, 232),
        Color.rgb(143, 150, 184)
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
