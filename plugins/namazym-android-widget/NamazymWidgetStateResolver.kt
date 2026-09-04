package com.namazym.app.widget

import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Snapshot v2 carries several days of prayer times (each with an epoch
 * timestamp). This resolver recomputes currentPrayer / nextPrayer /
 * remaining / visualMood at RENDER time, so the widget stays correct even
 * when the app has not been opened for days. v1 snapshots (no "days")
 * pass through unchanged.
 */
object NamazymWidgetStateResolver {
  /** Top-level key the tick scheduler reads: epoch ms of the next re-render. */
  const val NEXT_TICK_KEY = "_nextTickAtMs"

  private data class FlatPrayer(
    val key: String,
    val label: String,
    val time: String,
    val timestamp: Long
  )

  fun resolve(snapshot: JSONObject?, nowMs: Long): JSONObject? {
    if (snapshot == null) return null
    val days = snapshot.optJSONArray("days") ?: return snapshot

    val flat = flatten(days)
    if (flat.isEmpty()) return snapshot

    val current = flat.lastOrNull { it.timestamp <= nowMs }
    val next = flat.firstOrNull { it.timestamp > nowMs }

    val todayISO = localDateISO(nowMs)
    val today = dayFor(days, todayISO)
    if (today != null) {
      snapshot.put("prayers", today.optJSONArray("prayers") ?: JSONArray())
      snapshot.put("localDateISO", todayISO)
      val verse = today.optJSONObject("dailyVerse")
      if (verse != null) {
        snapshot.put("dailyVerse", verse)
      }
    }

    snapshot.put("currentPrayer", current?.let { summaryOf(it) } ?: JSONObject.NULL)
    snapshot.put("nextPrayer", next?.let { summaryOf(it) } ?: JSONObject.NULL)

    if (next != null) {
      val totalMinutes = ((next.timestamp - nowMs) / 60_000L).coerceAtLeast(0L)
      val remaining = JSONObject()
      remaining.put("totalMinutes", totalMinutes)
      remaining.put("display", formatRemaining(totalMinutes))
      snapshot.put("remaining", remaining)
    } else {
      // Data exhausted (app unopened past the covered window) — the renderer
      // falls back to its "Namazym açyň" prompts.
      snapshot.put("remaining", JSONObject.NULL)
    }

    val moodKey = current?.key ?: next?.key
    if (moodKey != null) {
      val mood = snapshot.optJSONObject("moods")?.optJSONObject(moodKey) ?: JSONObject()
      mood.put("key", moodKey)
      snapshot.put("visualMood", mood)
    }

    snapshot.put(NEXT_TICK_KEY, nextTickAt(nowMs, next?.timestamp))
    return snapshot
  }

  private fun flatten(days: JSONArray): List<FlatPrayer> {
    val result = mutableListOf<FlatPrayer>()
    for (dayIndex in 0 until days.length()) {
      val prayers = days.optJSONObject(dayIndex)?.optJSONArray("prayers") ?: continue
      for (prayerIndex in 0 until prayers.length()) {
        val prayer = prayers.optJSONObject(prayerIndex) ?: continue
        val timestamp = prayer.optLong("timestamp", 0L)
        if (timestamp <= 0L) continue
        result.add(
          FlatPrayer(
            key = prayer.optString("key"),
            label = prayer.optString("label"),
            time = prayer.optString("time"),
            timestamp = timestamp
          )
        )
      }
    }
    result.sortBy { it.timestamp }
    return result
  }

  private fun dayFor(days: JSONArray, todayISO: String): JSONObject? {
    var fallback: JSONObject? = null
    for (index in 0 until days.length()) {
      val day = days.optJSONObject(index) ?: continue
      val dateISO = day.optString("dateISO")
      if (dateISO == todayISO) return day
      if (dateISO <= todayISO || fallback == null) fallback = day
    }
    return fallback
  }

  private fun summaryOf(prayer: FlatPrayer): JSONObject {
    val summary = JSONObject()
    summary.put("key", prayer.key)
    summary.put("label", prayer.label)
    summary.put("time", prayer.time)
    summary.put("timestamp", prayer.timestamp)
    return summary
  }

  private fun formatRemaining(totalMinutes: Long): String {
    val safeMinutes = totalMinutes.coerceAtLeast(0L)
    val hours = safeMinutes / 60
    val minutes = safeMinutes % 60
    return when {
      hours <= 0L -> "$minutes min galdy"
      minutes <= 0L -> "$hours sag galdy"
      else -> "$hours sag $minutes min galdy"
    }
  }

  /**
   * Self-chaining display refresh: re-render when the countdown text becomes
   * meaningfully stale (60/30/15/5 min before the next prayer), right after
   * the prayer transition, and shortly after local midnight (date rollover).
   */
  private fun nextTickAt(nowMs: Long, nextPrayerMs: Long?): Long {
    val candidates = mutableListOf<Long>()
    if (nextPrayerMs != null) {
      candidates.add(nextPrayerMs - 60L * 60_000L)
      candidates.add(nextPrayerMs - 30L * 60_000L)
      candidates.add(nextPrayerMs - 15L * 60_000L)
      candidates.add(nextPrayerMs - 5L * 60_000L)
      candidates.add(nextPrayerMs + 2_000L)
    }
    candidates.add(nextLocalMidnight(nowMs) + 30_000L)
    return candidates.filter { it > nowMs + 5_000L }.minOrNull() ?: 0L
  }

  private fun nextLocalMidnight(nowMs: Long): Long {
    val calendar = Calendar.getInstance()
    calendar.timeInMillis = nowMs
    calendar.add(Calendar.DAY_OF_YEAR, 1)
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    return calendar.timeInMillis
  }

  private fun localDateISO(nowMs: Long): String {
    val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    return formatter.format(Date(nowMs))
  }
}
