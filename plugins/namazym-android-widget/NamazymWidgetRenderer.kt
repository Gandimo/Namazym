package com.namazym.app.widget

import android.appwidget.AppWidgetManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
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
  val muted: Int,
  val backgroundRes: Int,
  val chipRes: Int,
  val activePrayerRes: Int
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
    views.setTextViewText(R.id.widget_prayer_label, next?.optString("label").orEmpty().ifBlank {
      current?.optString("label").orEmpty().ifBlank { "Namaz" }
    })
    views.setTextViewText(R.id.widget_remaining, remaining)
    val pillText = current?.optString("label").orEmpty().let { currentLabel ->
      if (currentLabel.isNotBlank()) {
        "Häzir: $currentLabel"
      } else {
        next?.let { "${it.optString("label")} ${it.optString("time")}" } ?: "Namazym"
      }
    }
    views.setTextViewText(R.id.widget_next_pill, pillText)
    views.setTextColor(R.id.widget_city, palette.primary)
    views.setTextColor(R.id.widget_prayer_label, palette.secondary)
    views.setTextColor(R.id.widget_remaining, palette.primary)
    views.setTextColor(R.id.widget_next_pill, palette.primary)
    views.setInt(R.id.widget_root, "setBackgroundResource", palette.backgroundRes)
    views.setInt(R.id.widget_next_pill, "setBackgroundResource", palette.chipRes)
    applyLaunchIntent(
      context,
      views,
      R.id.widget_root,
      R.id.widget_city,
      R.id.widget_prayer_label,
      R.id.widget_remaining,
      R.id.widget_next_pill
    )
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
    views.setInt(R.id.widget_root, "setBackgroundResource", palette.backgroundRes)
    views.setInt(R.id.widget_remaining_chip, "setBackgroundResource", palette.chipRes)

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
        if (isNext) palette.activePrayerRes else R.drawable.namazym_widget_lens_pill
      )
      views.setTextViewText(labelIds[index], prayer?.optString("label").orEmpty().ifBlank { "—" })
      views.setTextViewText(timeIds[index], prayer?.optString("time").orEmpty().ifBlank { "--:--" })
      views.setTextColor(labelIds[index], if (isNext) palette.accent else palette.secondary)
      views.setTextColor(timeIds[index], if (isNext) palette.primary else palette.secondary)
    }

    views.setTextColor(R.id.widget_city, palette.primary)
    views.setTextColor(R.id.widget_remaining_chip, palette.primary)
    views.setTextColor(R.id.widget_featured, palette.primary)
    applyLaunchIntent(
      context,
      views,
      R.id.widget_root,
      R.id.widget_city,
      R.id.widget_remaining_chip,
      R.id.widget_featured,
      R.id.prayer_0_cell,
      R.id.prayer_1_cell,
      R.id.prayer_2_cell,
      R.id.prayer_3_cell,
      R.id.prayer_4_cell,
      R.id.prayer_5_cell,
      R.id.prayer_0_label,
      R.id.prayer_1_label,
      R.id.prayer_2_label,
      R.id.prayer_3_label,
      R.id.prayer_4_label,
      R.id.prayer_5_label,
      R.id.prayer_0_time,
      R.id.prayer_1_time,
      R.id.prayer_2_time,
      R.id.prayer_3_time,
      R.id.prayer_4_time,
      R.id.prayer_5_time
    )
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
    views.setInt(R.id.widget_root, "setBackgroundResource", palette.backgroundRes)
    views.setInt(R.id.widget_remaining_chip, "setBackgroundResource", palette.chipRes)
    views.setTextColor(R.id.widget_city, palette.primary)
    views.setTextColor(R.id.widget_remaining_chip, palette.primary)
    views.setTextColor(R.id.widget_section_title, palette.accent)
    views.setTextColor(R.id.widget_verse, palette.primary)
    views.setTextColor(R.id.widget_reference, palette.accent)
    views.setTextColor(R.id.widget_footer, palette.secondary)
    applyLaunchIntent(
      context,
      views,
      R.id.widget_root,
      R.id.widget_city,
      R.id.widget_remaining_chip,
      R.id.widget_section_title,
      R.id.widget_verse,
      R.id.widget_reference,
      R.id.widget_footer
    )
    return views
  }

  private fun applyLaunchIntent(context: Context, views: RemoteViews, vararg viewIds: Int) {
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    } ?: return
    val pendingIntent = PendingIntent.getActivity(
      context,
      0,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    for (viewId in viewIds) {
      views.setOnClickPendingIntent(viewId, pendingIntent)
    }
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
    val moodKey = resolveMoodKey(snapshot)
    return when (moodKey) {
      "fajr" -> WidgetPalette(
        Color.rgb(181, 214, 255),
        Color.rgb(255, 248, 234),
        Color.rgb(212, 221, 245),
        Color.rgb(143, 150, 184),
        R.drawable.namazym_widget_background_fajr,
        R.drawable.namazym_widget_chip_fajr,
        R.drawable.namazym_widget_prayer_active_fajr
      )
      "sunrise" -> WidgetPalette(
        Color.rgb(241, 215, 154),
        Color.rgb(255, 248, 234),
        Color.rgb(238, 217, 185),
        Color.rgb(166, 141, 103),
        R.drawable.namazym_widget_background_sunrise,
        R.drawable.namazym_widget_chip_sunrise,
        R.drawable.namazym_widget_prayer_active_sunrise
      )
      "dhuhr" -> WidgetPalette(
        Color.rgb(241, 215, 154),
        Color.rgb(255, 248, 234),
        Color.rgb(238, 217, 185),
        Color.rgb(166, 141, 103),
        R.drawable.namazym_widget_background_dhuhr,
        R.drawable.namazym_widget_chip_dhuhr,
        R.drawable.namazym_widget_prayer_active_dhuhr
      )
      "asr" -> WidgetPalette(
        Color.rgb(246, 190, 113),
        Color.rgb(255, 248, 234),
        Color.rgb(238, 217, 185),
        Color.rgb(166, 141, 103),
        R.drawable.namazym_widget_background_asr,
        R.drawable.namazym_widget_chip_asr,
        R.drawable.namazym_widget_prayer_active_asr
      )
      "maghrib" -> WidgetPalette(
        Color.rgb(255, 190, 151),
        Color.rgb(255, 248, 234),
        Color.rgb(237, 211, 214),
        Color.rgb(176, 132, 139),
        R.drawable.namazym_widget_background_maghrib,
        R.drawable.namazym_widget_chip_maghrib,
        R.drawable.namazym_widget_prayer_active_maghrib
      )
      "isha" -> nightPalette()
      else -> WidgetPalette(
        parseColor(snapshot?.optJSONObject("visualMood")?.optString("accentColor"), Color.rgb(184, 132, 59)),
        Color.rgb(255, 248, 234),
        Color.rgb(201, 205, 232),
        Color.rgb(143, 150, 184),
        R.drawable.namazym_widget_background_isha,
        R.drawable.namazym_widget_chip_isha,
        R.drawable.namazym_widget_prayer_active_isha
      )
    }
  }

  private fun resolveMoodKey(snapshot: JSONObject?): String {
    val candidates = listOf(
      snapshot?.optJSONObject("visualMood")?.optString("key"),
      snapshot?.optJSONObject("currentPrayer")?.optString("key"),
      snapshot?.optJSONObject("currentPrayer")?.optString("label"),
      snapshot?.optJSONObject("nextPrayer")?.optString("key"),
      snapshot?.optJSONObject("nextPrayer")?.optString("label")
    )

    for (candidate in candidates) {
      when (candidate.orEmpty().trim().lowercase()) {
        "fajr", "ertir" -> return "fajr"
        "sunrise", "gün", "gun" -> return "sunrise"
        "dhuhr", "öýle", "oyle" -> return "dhuhr"
        "asr", "ikindi" -> return "asr"
        "maghrib", "agşam", "agsam" -> return "maghrib"
        "isha", "ýassy", "yassy" -> return "isha"
      }
    }

    return "isha"
  }

  private fun nightPalette(): WidgetPalette {
    return WidgetPalette(
      Color.rgb(174, 178, 255),
      Color.rgb(255, 248, 234),
      Color.rgb(211, 211, 239),
      Color.rgb(143, 150, 184),
      R.drawable.namazym_widget_background_isha,
      R.drawable.namazym_widget_chip_isha,
      R.drawable.namazym_widget_prayer_active_isha
    )
  }

  private fun parseColor(value: String?, fallback: Int): Int {
    return try {
      if (value.isNullOrBlank()) fallback else Color.parseColor(value)
    } catch (_: Exception) {
      fallback
    }
  }
}
