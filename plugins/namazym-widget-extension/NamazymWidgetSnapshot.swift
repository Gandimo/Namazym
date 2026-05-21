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
}

struct WidgetCity: Decodable {
  let key: String
  let name: String
}

struct WidgetPrayerTime: Decodable, Identifiable {
  let key: String
  let label: String
  let time: String
  let timestampISO: String

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

extension NamazymWidgetSnapshot {
  static let preview = NamazymWidgetSnapshot(
    schemaVersion: 1,
    generatedAtISO: "2026-05-20T08:00:00.000Z",
    localDateISO: currentLocalDateISO(),
    timezone: TimeZone.current.identifier,
    city: WidgetCity(key: "asgabat_arkadag_ahal", name: "Aşgabat"),
    prayers: [
      WidgetPrayerTime(key: "Fajr", label: "Ertir", time: "04:32", timestampISO: ""),
      WidgetPrayerTime(key: "Sunrise", label: "Gün", time: "05:58", timestampISO: ""),
      WidgetPrayerTime(key: "Dhuhr", label: "Öýle", time: "13:12", timestampISO: ""),
      WidgetPrayerTime(key: "Asr", label: "Ikindi", time: "17:24", timestampISO: ""),
      WidgetPrayerTime(key: "Maghrib", label: "Agşam", time: "20:27", timestampISO: ""),
      WidgetPrayerTime(key: "Isha", label: "Ýassy", time: "21:55", timestampISO: "")
    ],
    currentPrayer: WidgetPrayerSummary(key: "Asr", label: "Ikindi", time: "17:24", timestampISO: nil),
    nextPrayer: WidgetPrayerSummary(key: "Maghrib", label: "Agşam", time: "20:27", timestampISO: nil),
    remaining: WidgetRemainingTime(totalMinutes: 96, display: "1 sag 36 min galdy"),
    visualMood: WidgetVisualMood(key: "Asr", accentColor: "#C47A3C", backgroundColor: "#F4E7D4")
  )

  static func currentLocalDateISO() -> String {
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: Date())
  }
}
