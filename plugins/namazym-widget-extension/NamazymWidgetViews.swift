import WidgetKit
import SwiftUI

struct NamazymWidgetEntryView: View {
  @Environment(\.widgetFamily) private var family
  let entry: NamazymWidgetEntry

  var body: some View {
    switch entry.state {
    case .loaded(let snapshot):
      content(for: snapshot, isStale: false)
    case .stale(let snapshot):
      fallback(title: snapshot.city.name, message: "Täzelemek üçin açyň", mood: snapshot.visualMood)
    case .missing:
      fallback(title: "Namazym", message: "Namazym açyň", mood: nil)
    case .invalid:
      fallback(title: "Namazym", message: "Täzeden açyň", mood: nil)
    }
  }

  @ViewBuilder
  private func content(for snapshot: NamazymWidgetSnapshot, isStale: Bool) -> some View {
    if family == .systemMedium {
      NamazymMediumWidgetView(snapshot: snapshot)
    } else {
      NamazymSmallWidgetView(snapshot: snapshot)
    }
  }

  private func fallback(title: String, message: String, mood: WidgetVisualMood?) -> some View {
    let background = Color(hex: mood?.backgroundColor ?? "#F6F1E8", fallback: Color(red: 0.96, green: 0.93, blue: 0.87))
    let accent = Color(hex: mood?.accentColor ?? "#B8843B", fallback: Color(red: 0.72, green: 0.48, blue: 0.22))

    return VStack(alignment: .leading, spacing: 8) {
      Circle()
        .fill(accent.opacity(0.18))
        .frame(width: 30, height: 30)
        .overlay(Circle().fill(accent).frame(width: 10, height: 10))
      Spacer()
      Text(title)
        .font(.headline)
        .foregroundStyle(Color(red: 0.18, green: 0.15, blue: 0.11))
      Text(message)
        .font(.caption)
        .foregroundStyle(Color(red: 0.45, green: 0.38, blue: 0.28))
    }
    .padding()
    .widgetCardBackground(background)
  }
}

struct NamazymSmallWidgetView: View {
  let snapshot: NamazymWidgetSnapshot

  var body: some View {
    let background = Color(hex: snapshot.visualMood.backgroundColor, fallback: Color(red: 0.96, green: 0.93, blue: 0.87))
    let accent = Color(hex: snapshot.visualMood.accentColor, fallback: Color(red: 0.72, green: 0.48, blue: 0.22))

    VStack(alignment: .leading, spacing: 7) {
      Text(snapshot.city.name)
        .font(.caption)
        .fontWeight(.semibold)
        .foregroundStyle(Color(red: 0.40, green: 0.32, blue: 0.22))
        .lineLimit(1)

      Spacer(minLength: 2)

      Text(snapshot.currentPrayer?.label ?? "-")
        .font(.title3)
        .fontWeight(.bold)
        .foregroundStyle(Color(red: 0.18, green: 0.15, blue: 0.11))
        .lineLimit(1)
        .minimumScaleFactor(0.8)

      VStack(alignment: .leading, spacing: 2) {
        Text("Indiki: \(snapshot.nextPrayer?.label ?? "-")")
          .font(.caption2)
          .foregroundStyle(Color(red: 0.45, green: 0.38, blue: 0.28))
          .lineLimit(1)
        HStack(alignment: .firstTextBaseline, spacing: 6) {
          Text(snapshot.nextPrayer?.time ?? "--:--")
            .font(.headline)
            .fontWeight(.semibold)
          Text(snapshot.remaining?.display ?? "")
            .font(.caption2)
            .lineLimit(1)
            .minimumScaleFactor(0.72)
        }
        .foregroundStyle(accent)
      }
    }
    .padding()
    .widgetCardBackground(background)
  }
}

struct NamazymMediumWidgetView: View {
  let snapshot: NamazymWidgetSnapshot

  var body: some View {
    let background = Color(hex: snapshot.visualMood.backgroundColor, fallback: Color(red: 0.96, green: 0.93, blue: 0.87))
    let accent = Color(hex: snapshot.visualMood.accentColor, fallback: Color(red: 0.72, green: 0.48, blue: 0.22))

    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .top) {
        VStack(alignment: .leading, spacing: 2) {
          Text(snapshot.city.name)
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundStyle(Color(red: 0.40, green: 0.32, blue: 0.22))
            .lineLimit(1)
          Text("\(snapshot.nextPrayer?.label ?? "-") \(snapshot.nextPrayer?.time ?? "--:--")")
            .font(.headline)
            .fontWeight(.bold)
            .foregroundStyle(Color(red: 0.18, green: 0.15, blue: 0.11))
            .lineLimit(1)
        }

        Spacer()

        Text(snapshot.remaining?.display ?? "")
          .font(.caption)
          .fontWeight(.semibold)
          .foregroundStyle(accent)
          .lineLimit(1)
          .minimumScaleFactor(0.75)
      }

      LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
        ForEach(snapshot.prayers) { prayer in
          PrayerTimeRow(
            prayer: prayer,
            isCurrent: prayer.key == snapshot.currentPrayer?.key,
            accent: accent
          )
        }
      }
    }
    .padding()
    .widgetCardBackground(background)
  }
}

struct PrayerTimeRow: View {
  let prayer: WidgetPrayerTime
  let isCurrent: Bool
  let accent: Color

  var body: some View {
    HStack(spacing: 6) {
      Circle()
        .fill(isCurrent ? accent : accent.opacity(0.22))
        .frame(width: 6, height: 6)
      Text(prayer.label)
        .font(.caption2)
        .fontWeight(isCurrent ? .bold : .regular)
        .lineLimit(1)
      Spacer(minLength: 4)
      Text(prayer.time)
        .font(.caption2)
        .fontWeight(.semibold)
        .monospacedDigit()
    }
    .foregroundStyle(isCurrent ? Color(red: 0.16, green: 0.13, blue: 0.10) : Color(red: 0.43, green: 0.36, blue: 0.27))
    .padding(.horizontal, 7)
    .padding(.vertical, 5)
    .background(isCurrent ? accent.opacity(0.16) : Color.white.opacity(0.25))
    .clipShape(RoundedRectangle(cornerRadius: 7, style: .continuous))
  }
}

extension View {
  @ViewBuilder
  func widgetCardBackground(_ color: Color) -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.containerBackground(color, for: .widget)
    } else {
      self.background(color)
    }
  }
}
