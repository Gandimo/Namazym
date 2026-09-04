import Foundation
import SwiftUI

enum NamazymWidgetConstants {
  static let appGroupId = "group.com.namazym.app"
  static let snapshotKey = "namazym.widget.snapshot.v1"
}

enum NamazymWidgetState {
  case loaded(NamazymWidgetSnapshot)
  case missing
  case invalid
  case stale(NamazymWidgetSnapshot)
}

struct NamazymWidgetSnapshot: Decodable {
  let schemaVersion: Int
  let generatedAtISO: String
  let localDateISO: String
  let timezone: String
  let city: WidgetCity
  let prayers: [WidgetPrayerTime]
  let currentPrayer: WidgetPrayerSummary?
  let nextPrayer: WidgetPrayerSummary?
  let remaining: WidgetRemainingTime?
  let visualMood: WidgetVisualMood
  let dailyVerse: WidgetDailyVerse?
  // v2: multi-day data so the widget can resolve its state at any moment
  // without the app rewriting the snapshot.
  let days: [WidgetDay]?
  let moods: [String: WidgetVisualMood]?
}

struct WidgetCity: Decodable {
  let key: String
  let name: String
}

struct WidgetDay: Decodable {
  let dateISO: String
  let prayers: [WidgetPrayerTime]
  let dailyVerse: WidgetDailyVerse?
}

struct WidgetPrayerTime: Decodable, Identifiable {
  let key: String
  let label: String
  let time: String
  let timestampISO: String
  let timestamp: Double?

  var id: String { key }
}

struct WidgetPrayerSummary: Decodable {
  let key: String
  let label: String
  let time: String
  let timestampISO: String?
}

struct WidgetRemainingTime: Decodable {
  let totalMinutes: Int
  let display: String
}

struct WidgetVisualMood: Decodable {
  let key: String
  let accentColor: String
  let backgroundColor: String
}

struct WidgetDailyVerse: Decodable {
  let text: String
  let reference: String
  let source: String?
}

extension Color {
  init(hex: String, fallback: Color) {
    let cleaned = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    var value: UInt64 = 0

    guard Scanner(string: cleaned).scanHexInt64(&value) else {
      self = fallback
      return
    }

    let red: UInt64
    let green: UInt64
    let blue: UInt64

    switch cleaned.count {
    case 6:
      red = (value & 0xFF0000) >> 16
      green = (value & 0x00FF00) >> 8
      blue = value & 0x0000FF
    default:
      self = fallback
      return
    }

    self = Color(
      red: Double(red) / 255.0,
      green: Double(green) / 255.0,
      blue: Double(blue) / 255.0
    )
  }
}

// MARK: - Time-of-render resolution (v2 snapshots)

private struct FlatPrayer {
  let key: String
  let label: String
  let time: String
  let date: Date
}

extension NamazymWidgetSnapshot {
  private func flattenedPrayers() -> [FlatPrayer] {
    guard let days = days else { return [] }
    var result: [FlatPrayer] = []
    for day in days {
      for prayer in day.prayers {
        guard let timestamp = prayer.timestamp, timestamp > 0 else { continue }
        result.append(
          FlatPrayer(
            key: prayer.key,
            label: prayer.label,
            time: prayer.time,
            date: Date(timeIntervalSince1970: timestamp / 1000.0)
          )
        )
      }
    }
    return result.sorted { $0.date < $1.date }
  }

  /// Prayer-time transitions after `start`, up to `horizonHours` later.
  func transitionDates(from start: Date, horizonHours: Double) -> [Date] {
    let end = start.addingTimeInterval(horizonHours * 3600)
    return flattenedPrayers().map { $0.date }.filter { $0 > start && $0 <= end }
  }

  /// A copy of the snapshot with currentPrayer / nextPrayer / remaining /
  /// visualMood / prayers recomputed for the given moment. Returns nil when
  /// the multi-day data is absent or exhausted (caller shows the stale state).
  func resolved(at date: Date) -> NamazymWidgetSnapshot? {
    let flat = flattenedPrayers()
    guard !flat.isEmpty else { return nil }
    guard let next = flat.first(where: { $0.date > date }) else { return nil }
    let current = flat.last(where: { $0.date <= date })

    let dayISO = Self.localDateISO(for: date)
    let day = days?.first { $0.dateISO == dayISO } ?? days?.last
    let dayPrayers = day?.prayers ?? prayers

    let totalMinutes = max(0, Int(next.date.timeIntervalSince(date) / 60.0))
    let remainingTime = WidgetRemainingTime(
      totalMinutes: totalMinutes,
      display: Self.formatRemaining(totalMinutes)
    )

    let moodKey = current?.key ?? next.key
    let mood = moods?[moodKey] ?? Self.fallbackMood(for: moodKey)

    return NamazymWidgetSnapshot(
      schemaVersion: schemaVersion,
      generatedAtISO: generatedAtISO,
      localDateISO: dayISO,
      timezone: timezone,
      city: city,
      prayers: dayPrayers,
      currentPrayer: current.map { WidgetPrayerSummary(key: $0.key, label: $0.label, time: $0.time, timestampISO: nil) },
      nextPrayer: WidgetPrayerSummary(key: next.key, label: next.label, time: next.time, timestampISO: nil),
      remaining: remainingTime,
      visualMood: mood,
      dailyVerse: day?.dailyVerse ?? dailyVerse,
      days: days,
      moods: moods
    )
  }

  static func formatRemaining(_ totalMinutes: Int) -> String {
    let safeMinutes = max(0, totalMinutes)
    let hours = safeMinutes / 60
    let minutes = safeMinutes % 60
    if hours <= 0 { return "\(minutes) min galdy" }
    if minutes <= 0 { return "\(hours) sag galdy" }
    return "\(hours) sag \(minutes) min galdy"
  }

  static func fallbackMood(for key: String) -> WidgetVisualMood {
    switch key {
    case "Fajr":
      return WidgetVisualMood(key: key, accentColor: "#C88A32", backgroundColor: "#F7EFE2")
    case "Sunrise":
      return WidgetVisualMood(key: key, accentColor: "#E3A23A", backgroundColor: "#FFF3D7")
    case "Dhuhr":
      return WidgetVisualMood(key: key, accentColor: "#4F9D8F", backgroundColor: "#EAF7F3")
    case "Asr":
      return WidgetVisualMood(key: key, accentColor: "#C47A3C", backgroundColor: "#F4E7D4")
    case "Maghrib":
      return WidgetVisualMood(key: key, accentColor: "#B85842", backgroundColor: "#F6E1D7")
    default:
      return WidgetVisualMood(key: key, accentColor: "#5665A8", backgroundColor: "#E9EBF7")
    }
  }

  static func localDateISO(for date: Date) -> String {
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: date)
  }
}

extension NamazymWidgetSnapshot {
  static let preview = NamazymWidgetSnapshot(
    schemaVersion: 2,
    generatedAtISO: "2026-05-20T08:00:00.000Z",
    localDateISO: currentLocalDateISO(),
    timezone: TimeZone.current.identifier,
    city: WidgetCity(key: "asgabat_arkadag_ahal", name: "Aşgabat"),
    prayers: [
      WidgetPrayerTime(key: "Fajr", label: "Ertir", time: "04:32", timestampISO: "", timestamp: nil),
      WidgetPrayerTime(key: "Sunrise", label: "Gün", time: "05:58", timestampISO: "", timestamp: nil),
      WidgetPrayerTime(key: "Dhuhr", label: "Öýle", time: "13:12", timestampISO: "", timestamp: nil),
      WidgetPrayerTime(key: "Asr", label: "Ikindi", time: "17:24", timestampISO: "", timestamp: nil),
      WidgetPrayerTime(key: "Maghrib", label: "Agşam", time: "20:27", timestampISO: "", timestamp: nil),
      WidgetPrayerTime(key: "Isha", label: "Ýassy", time: "21:55", timestampISO: "", timestamp: nil)
    ],
    currentPrayer: WidgetPrayerSummary(key: "Asr", label: "Ikindi", time: "17:24", timestampISO: nil),
    nextPrayer: WidgetPrayerSummary(key: "Maghrib", label: "Agşam", time: "20:27", timestampISO: nil),
    remaining: WidgetRemainingTime(totalMinutes: 96, display: "1 sag 36 min galdy"),
    visualMood: WidgetVisualMood(key: "Asr", accentColor: "#C47A3C", backgroundColor: "#F4E7D4"),
    dailyVerse: WidgetDailyVerse(
      text: "Rebbiňiz aýtdy: Maňa doga ediň, Men size jogap bereýin.",
      reference: "Mumin, 60",
      source: "Gurhan"
    ),
    days: nil,
    moods: nil
  )

  static func currentLocalDateISO() -> String {
    localDateISO(for: Date())
  }
}
