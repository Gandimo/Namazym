import WidgetKit
import SwiftUI

struct NamazymWidgetEntryView: View {
  @Environment(\.widgetFamily) private var family
  @Environment(\.colorScheme) private var colorScheme
  let entry: NamazymWidgetEntry

  var body: some View {
    switch entry.state {
    case .loaded(let snapshot):
      content(for: snapshot)
    case .stale(let snapshot):
      NamazymFallbackView(
        title: snapshot.city.name,
        message: "Täzelemek üçin açyň",
        mood: snapshot.visualMood,
        colorScheme: colorScheme
      )
    case .missing:
      NamazymFallbackView(
        title: "Namazym",
        message: "Namazym açyň",
        mood: nil,
        colorScheme: colorScheme
      )
    case .invalid:
      NamazymFallbackView(
        title: "Namazym",
        message: "Täzeden açyň",
        mood: nil,
        colorScheme: colorScheme
      )
    }
  }

  @ViewBuilder
  private func content(for snapshot: NamazymWidgetSnapshot) -> some View {
    if family == .systemLarge {
      NamazymLargeWidgetView(snapshot: snapshot)
    } else if family == .systemMedium {
      NamazymMediumWidgetView(snapshot: snapshot)
    } else {
      NamazymSmallWidgetView(snapshot: snapshot)
    }
  }
}

struct WidgetPalette {
  let accent: Color
  let background: Color
  let colorScheme: ColorScheme
  let moodKey: String?

  var primary: Color {
    colorScheme == .dark ? Color(red: 0.98, green: 0.95, blue: 0.89) : Color(red: 0.16, green: 0.13, blue: 0.10)
  }

  var secondary: Color {
    colorScheme == .dark ? Color(red: 0.80, green: 0.74, blue: 0.66) : Color(red: 0.45, green: 0.36, blue: 0.26)
  }

  var card: Color {
    colorScheme == .dark ? Color.white.opacity(0.12) : Color.white.opacity(0.50)
  }

  var chip: Color {
    colorScheme == .dark ? accent.opacity(0.22) : Color.white.opacity(0.64)
  }

  var glow: Color {
    moodStyle?.glow ?? accent.opacity(colorScheme == .dark ? 0.18 : 0.16)
  }

  var softGlow: Color {
    moodStyle?.softGlow ?? Color.white.opacity(colorScheme == .dark ? 0.05 : 0.22)
  }

  var gradient: LinearGradient {
    if let moodStyle {
      return LinearGradient(
        colors: moodStyle.gradientColors,
        startPoint: .topLeading,
        endPoint: .bottomTrailing
      )
    }

    if colorScheme == .dark {
      return LinearGradient(
        colors: [
          Color(red: 0.09, green: 0.08, blue: 0.07),
          background.opacity(0.40),
          Color(red: 0.05, green: 0.05, blue: 0.05)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
      )
    }

    return LinearGradient(
      colors: [
        background.opacity(0.97),
        Color.white.opacity(0.84),
        accent.opacity(0.17)
      ],
      startPoint: .topLeading,
      endPoint: .bottomTrailing
    )
  }

  private var moodStyle: WidgetMoodStyle? {
    WidgetMoodStyle.style(for: moodKey, colorScheme: colorScheme)
  }
}

private struct WidgetMoodStyle {
  let accent: Color
  let gradientColors: [Color]
  let glow: Color
  let softGlow: Color

  static func style(for key: String?, colorScheme: ColorScheme) -> WidgetMoodStyle? {
    guard let normalizedKey = key?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() else {
      return nil
    }

    switch normalizedKey {
    case "fajr":
      return WidgetMoodStyle(
        accent: colorScheme == .dark ? Color(red: 0.62, green: 0.82, blue: 0.96) : Color(red: 0.34, green: 0.55, blue: 0.84),
        gradientColors: colorScheme == .dark
          ? [Color(red: 0.05, green: 0.08, blue: 0.17), Color(red: 0.11, green: 0.13, blue: 0.29), Color(red: 0.05, green: 0.05, blue: 0.11)]
          : [Color(red: 0.84, green: 0.90, blue: 0.98), Color(red: 0.96, green: 0.91, blue: 0.98), Color(red: 0.91, green: 0.86, blue: 0.76)],
        glow: Color(red: 0.54, green: 0.76, blue: 0.96).opacity(colorScheme == .dark ? 0.24 : 0.18),
        softGlow: Color(red: 0.93, green: 0.86, blue: 1.00).opacity(colorScheme == .dark ? 0.10 : 0.28)
      )
    case "sunrise":
      return WidgetMoodStyle(
        accent: colorScheme == .dark ? Color(red: 0.96, green: 0.70, blue: 0.36) : Color(red: 0.76, green: 0.43, blue: 0.16),
        gradientColors: colorScheme == .dark
          ? [Color(red: 0.17, green: 0.10, blue: 0.08), Color(red: 0.36, green: 0.20, blue: 0.13), Color(red: 0.08, green: 0.07, blue: 0.08)]
          : [Color(red: 1.00, green: 0.92, blue: 0.78), Color(red: 1.00, green: 0.96, blue: 0.88), Color(red: 0.96, green: 0.75, blue: 0.54)],
        glow: Color(red: 1.00, green: 0.65, blue: 0.28).opacity(colorScheme == .dark ? 0.25 : 0.20),
        softGlow: Color(red: 1.00, green: 0.88, blue: 0.66).opacity(colorScheme == .dark ? 0.10 : 0.30)
      )
    case "dhuhr":
      return WidgetMoodStyle(
        accent: colorScheme == .dark ? Color(red: 0.88, green: 0.72, blue: 0.36) : Color(red: 0.62, green: 0.43, blue: 0.12),
        gradientColors: colorScheme == .dark
          ? [Color(red: 0.12, green: 0.10, blue: 0.07), Color(red: 0.28, green: 0.23, blue: 0.15), Color(red: 0.06, green: 0.06, blue: 0.05)]
          : [Color(red: 0.98, green: 0.94, blue: 0.84), Color(red: 1.00, green: 0.98, blue: 0.91), Color(red: 0.91, green: 0.80, blue: 0.55)],
        glow: Color(red: 0.88, green: 0.65, blue: 0.25).opacity(colorScheme == .dark ? 0.21 : 0.16),
        softGlow: Color.white.opacity(colorScheme == .dark ? 0.06 : 0.30)
      )
    case "asr":
      return WidgetMoodStyle(
        accent: colorScheme == .dark ? Color(red: 0.93, green: 0.56, blue: 0.25) : Color(red: 0.65, green: 0.35, blue: 0.15),
        gradientColors: colorScheme == .dark
          ? [Color(red: 0.16, green: 0.10, blue: 0.06), Color(red: 0.33, green: 0.20, blue: 0.11), Color(red: 0.08, green: 0.06, blue: 0.05)]
          : [Color(red: 0.95, green: 0.83, blue: 0.62), Color(red: 0.99, green: 0.91, blue: 0.78), Color(red: 0.82, green: 0.55, blue: 0.32)],
        glow: Color(red: 0.90, green: 0.47, blue: 0.20).opacity(colorScheme == .dark ? 0.23 : 0.18),
        softGlow: Color(red: 1.00, green: 0.84, blue: 0.56).opacity(colorScheme == .dark ? 0.09 : 0.25)
      )
    case "maghrib":
      return WidgetMoodStyle(
        accent: colorScheme == .dark ? Color(red: 0.97, green: 0.58, blue: 0.50) : Color(red: 0.66, green: 0.28, blue: 0.23),
        gradientColors: colorScheme == .dark
          ? [Color(red: 0.18, green: 0.08, blue: 0.12), Color(red: 0.34, green: 0.15, blue: 0.20), Color(red: 0.07, green: 0.05, blue: 0.09)]
          : [Color(red: 0.92, green: 0.72, blue: 0.66), Color(red: 0.98, green: 0.88, blue: 0.77), Color(red: 0.78, green: 0.39, blue: 0.34)],
        glow: Color(red: 0.95, green: 0.45, blue: 0.38).opacity(colorScheme == .dark ? 0.24 : 0.17),
        softGlow: Color(red: 1.00, green: 0.78, blue: 0.50).opacity(colorScheme == .dark ? 0.09 : 0.23)
      )
    case "isha":
      return WidgetMoodStyle(
        accent: colorScheme == .dark ? Color(red: 0.68, green: 0.70, blue: 1.00) : Color(red: 0.35, green: 0.34, blue: 0.72),
        gradientColors: colorScheme == .dark
          ? [Color(red: 0.05, green: 0.06, blue: 0.15), Color(red: 0.13, green: 0.11, blue: 0.29), Color(red: 0.04, green: 0.04, blue: 0.09)]
          : [Color(red: 0.82, green: 0.86, blue: 0.97), Color(red: 0.91, green: 0.88, blue: 0.98), Color(red: 0.64, green: 0.64, blue: 0.86)],
        glow: Color(red: 0.45, green: 0.50, blue: 1.00).opacity(colorScheme == .dark ? 0.24 : 0.17),
        softGlow: Color(red: 0.76, green: 0.70, blue: 1.00).opacity(colorScheme == .dark ? 0.10 : 0.24)
      )
    default:
      return nil
    }
  }
}

private func widgetPalette(for snapshot: NamazymWidgetSnapshot, colorScheme: ColorScheme) -> WidgetPalette {
  let moodKey = snapshot.visualMood.key
  let fallbackAccent = Color(hex: snapshot.visualMood.accentColor, fallback: Color(red: 0.72, green: 0.48, blue: 0.22))

  return WidgetPalette(
    accent: WidgetMoodStyle.style(for: moodKey, colorScheme: colorScheme)?.accent ?? fallbackAccent,
    background: Color(hex: snapshot.visualMood.backgroundColor, fallback: Color(red: 0.96, green: 0.93, blue: 0.87)),
    colorScheme: colorScheme,
    moodKey: moodKey
  )
}

private struct WidgetBackground: View {
  let palette: WidgetPalette

  var body: some View {
    ZStack {
      palette.gradient
      Circle()
        .fill(palette.glow)
        .frame(width: 120, height: 120)
        .blur(radius: 2)
        .offset(x: 70, y: -52)
      Circle()
        .fill(palette.softGlow)
        .frame(width: 132, height: 132)
        .blur(radius: 1)
        .offset(x: -56, y: 78)
    }
  }
}

struct NamazymSmallWidgetView: View {
  @Environment(\.colorScheme) private var colorScheme
  let snapshot: NamazymWidgetSnapshot

  var body: some View {
    let palette = widgetPalette(for: snapshot, colorScheme: colorScheme)
    let accent = palette.accent
    let current = snapshot.currentPrayer
    let next = snapshot.nextPrayer

    ZStack(alignment: .topTrailing) {
      WidgetBackground(palette: palette)
      CrescentShape(accent: accent)
        .frame(width: 78, height: 78)
        .opacity(colorScheme == .dark ? 0.34 : 0.42)
        .offset(x: 20, y: -18)

      VStack(alignment: .leading, spacing: 8) {
        Text(snapshot.city.name)
          .font(.caption2)
          .fontWeight(.semibold)
          .foregroundStyle(palette.secondary)
          .lineLimit(1)
          .minimumScaleFactor(0.75)

        Spacer(minLength: 0)

        VStack(spacing: 3) {
          Text(current?.label ?? next?.label ?? "Namazym")
            .font(.callout)
            .fontWeight(.bold)
            .foregroundStyle(palette.primary)
            .lineLimit(1)
            .minimumScaleFactor(0.82)

          Text(compactRemaining(snapshot.remaining))
            .font(.system(size: 29, weight: .heavy, design: .rounded))
            .monospacedDigit()
            .foregroundStyle(accent)
            .lineLimit(1)
            .minimumScaleFactor(0.66)
        }
        .frame(maxWidth: .infinity, alignment: .center)

        HStack(spacing: 5) {
          Text(next?.label ?? "Indiki")
            .fontWeight(.medium)
            .lineLimit(1)
          Text(next?.time ?? "--:--")
            .fontWeight(.bold)
            .monospacedDigit()
            .lineLimit(1)
        }
        .font(.caption)
        .foregroundStyle(palette.primary)
        .minimumScaleFactor(0.74)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .frame(maxWidth: .infinity)
        .background(palette.chip)
        .overlay(
          Capsule()
            .stroke(Color.white.opacity(colorScheme == .dark ? 0.10 : 0.30), lineWidth: 1)
        )
        .clipShape(Capsule())
      }
      .padding(14)
    }
    .widgetCardBackground { WidgetBackground(palette: palette) }
  }
}

struct NamazymMediumWidgetView: View {
  @Environment(\.colorScheme) private var colorScheme
  let snapshot: NamazymWidgetSnapshot

  var body: some View {
    let palette = widgetPalette(for: snapshot, colorScheme: colorScheme)
    let accent = palette.accent
    let featured = snapshot.nextPrayer ?? snapshot.currentPrayer

    ZStack(alignment: .topTrailing) {
      WidgetBackground(palette: palette)
      Circle()
        .fill(accent.opacity(colorScheme == .dark ? 0.16 : 0.13))
        .frame(width: 130, height: 130)
        .blur(radius: 2)
        .offset(x: 52, y: -50)
      CrescentShape(accent: accent)
        .frame(width: 90, height: 90)
        .opacity(colorScheme == .dark ? 0.22 : 0.26)
        .offset(x: 34, y: -26)

      VStack(alignment: .leading, spacing: 10) {
        HStack(spacing: 8) {
          Text(snapshot.city.name)
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundStyle(palette.secondary)
            .lineLimit(1)
            .minimumScaleFactor(0.78)

          Spacer(minLength: 8)

          Text(compactRemaining(snapshot.remaining))
            .font(.caption)
            .fontWeight(.bold)
            .monospacedDigit()
            .foregroundStyle(accent)
            .lineLimit(1)
            .minimumScaleFactor(0.76)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(palette.chip)
            .clipShape(Capsule())
        }

        HStack(alignment: .firstTextBaseline, spacing: 7) {
          Text(featured?.label ?? "Indiki")
            .font(.title2)
            .fontWeight(.heavy)
            .foregroundStyle(palette.primary)
            .lineLimit(1)
            .minimumScaleFactor(0.82)

          Text(featured?.time ?? "--:--")
            .font(.title3)
            .fontWeight(.bold)
            .monospacedDigit()
            .foregroundStyle(accent)
            .lineLimit(1)
        }
        .padding(.top, -1)

        LazyVGrid(columns: [GridItem(.flexible(), spacing: 7), GridItem(.flexible(), spacing: 7)], spacing: 7) {
          ForEach(snapshot.prayers) { prayer in
            PrayerTimeRow(
              prayer: prayer,
              isCurrent: prayer.key == snapshot.currentPrayer?.key,
              isNext: prayer.key == snapshot.nextPrayer?.key,
              accent: accent,
              palette: palette
            )
          }
        }
      }
      .padding(14)
    }
    .widgetCardBackground { WidgetBackground(palette: palette) }
  }
}

struct NamazymLargeWidgetView: View {
  @Environment(\.colorScheme) private var colorScheme
  let snapshot: NamazymWidgetSnapshot

  var body: some View {
    let palette = widgetPalette(for: snapshot, colorScheme: colorScheme)
    let accent = palette.accent

    ZStack(alignment: .topTrailing) {
      WidgetBackground(palette: palette)
      Circle()
        .fill(accent.opacity(colorScheme == .dark ? 0.18 : 0.14))
        .frame(width: 210, height: 210)
        .blur(radius: 6)
        .offset(x: 82, y: -72)
      Circle()
        .stroke(accent.opacity(colorScheme == .dark ? 0.22 : 0.18), lineWidth: 1)
        .frame(width: 168, height: 168)
        .offset(x: 70, y: -56)
      CrescentShape(accent: accent)
        .frame(width: 104, height: 104)
        .opacity(colorScheme == .dark ? 0.20 : 0.24)
        .offset(x: 42, y: -34)

      VStack(alignment: .leading, spacing: 16) {
        HStack(spacing: 10) {
          Text(snapshot.city.name)
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundStyle(palette.secondary)
            .lineLimit(1)
            .minimumScaleFactor(0.78)

          Spacer(minLength: 10)

          Text(compactRemaining(snapshot.remaining))
            .font(.caption)
            .fontWeight(.bold)
            .monospacedDigit()
            .foregroundStyle(accent)
            .lineLimit(1)
            .minimumScaleFactor(0.76)
            .padding(.horizontal, 11)
            .padding(.vertical, 6)
            .background(palette.chip)
            .clipShape(Capsule())
        }

        VStack(alignment: .leading, spacing: 11) {
          Text("GÜNÜŇ AÝATY")
            .font(.caption2)
            .fontWeight(.heavy)
            .tracking(0.8)
            .foregroundStyle(accent)
            .lineLimit(1)

          Text(snapshot.dailyVerse?.text ?? "Namazym açyň, günüň aýatyny widgetde görkeziň.")
            .font(.system(size: 20, weight: .semibold, design: .serif))
            .foregroundStyle(palette.primary)
            .lineLimit(4)
            .minimumScaleFactor(0.78)
            .lineSpacing(2)

          HStack(spacing: 7) {
            Rectangle()
              .fill(accent.opacity(0.66))
              .frame(width: 20, height: 2)
              .clipShape(Capsule())

            Text(snapshot.dailyVerse?.reference ?? "Namazym")
              .font(.caption)
              .fontWeight(.semibold)
              .foregroundStyle(accent.opacity(0.92))
              .lineLimit(1)
              .minimumScaleFactor(0.82)
          }
        }
        .padding(17)
        .frame(maxWidth: .infinity, minHeight: 176, alignment: .leading)
        .background(
          RoundedRectangle(cornerRadius: 24, style: .continuous)
            .fill(palette.card)
            .overlay(
              RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.white.opacity(colorScheme == .dark ? 0.11 : 0.34), lineWidth: 1)
            )
        )
        .shadow(color: accent.opacity(colorScheme == .dark ? 0.14 : 0.10), radius: 18, x: 0, y: 10)

        Spacer(minLength: 0)

        HStack(spacing: 8) {
          Text(snapshot.nextPrayer?.label ?? snapshot.currentPrayer?.label ?? "Indiki")
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundStyle(palette.secondary)
            .lineLimit(1)

          Text(snapshot.nextPrayer?.time ?? snapshot.currentPrayer?.time ?? "--:--")
            .font(.caption)
            .fontWeight(.bold)
            .monospacedDigit()
            .foregroundStyle(accent)
            .lineLimit(1)

          Spacer(minLength: 8)

          Text(snapshot.dailyVerse?.source ?? "Gurhan")
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundStyle(palette.secondary.opacity(0.86))
            .lineLimit(1)
        }
      }
      .padding(18)
    }
    .widgetCardBackground { WidgetBackground(palette: palette) }
  }
}

struct PrayerTimeRow: View {
  let prayer: WidgetPrayerTime
  let isCurrent: Bool
  let isNext: Bool
  let accent: Color
  let palette: WidgetPalette

  var body: some View {
    HStack(spacing: 6) {
      Circle()
        .fill(isCurrent || isNext ? accent : accent.opacity(0.24))
        .frame(width: 6, height: 6)
      Text(prayer.label)
        .font(.caption2)
        .fontWeight(isCurrent ? .bold : .medium)
        .lineLimit(1)
      Spacer(minLength: 4)
      Text(prayer.time)
        .font(.caption2)
        .fontWeight(isCurrent || isNext ? .bold : .semibold)
        .monospacedDigit()
    }
    .foregroundStyle(isCurrent ? palette.primary : palette.secondary)
    .padding(.horizontal, 7)
    .padding(.vertical, 5)
    .background(rowBackground)
    .overlay(
      RoundedRectangle(cornerRadius: 9, style: .continuous)
        .stroke(isNext && !isCurrent ? accent.opacity(0.35) : Color.clear, lineWidth: 1)
    )
    .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
  }

  private var rowBackground: Color {
    if isCurrent {
      return accent.opacity(0.18)
    }

    if isNext {
      return accent.opacity(0.10)
    }

    return palette.card
  }
}

struct NamazymFallbackView: View {
  let title: String
  let message: String
  let mood: WidgetVisualMood?
  let colorScheme: ColorScheme

  var body: some View {
    let accent = Color(hex: mood?.accentColor ?? "#B8843B", fallback: Color(red: 0.72, green: 0.48, blue: 0.22))
    let palette = WidgetPalette(
      accent: WidgetMoodStyle.style(for: mood?.key, colorScheme: colorScheme)?.accent ?? accent,
      background: Color(hex: mood?.backgroundColor ?? "#F6F1E8", fallback: Color(red: 0.96, green: 0.93, blue: 0.87)),
      colorScheme: colorScheme,
      moodKey: mood?.key
    )

    ZStack(alignment: .topTrailing) {
      WidgetBackground(palette: palette)
      CrescentShape(accent: accent)
        .frame(width: 56, height: 56)
        .opacity(0.55)
        .offset(x: 12, y: -10)

      VStack(alignment: .leading, spacing: 8) {
        Spacer(minLength: 0)
        Text(title)
          .font(.headline)
          .fontWeight(.bold)
          .foregroundStyle(palette.primary)
          .lineLimit(1)
          .minimumScaleFactor(0.82)
        Text(message)
          .font(.caption)
          .fontWeight(.medium)
          .foregroundStyle(palette.secondary)
          .lineLimit(2)
      }
      .padding(15)
    }
    .widgetCardBackground { WidgetBackground(palette: palette) }
  }
}

struct CrescentShape: View {
  let accent: Color

  var body: some View {
    ZStack {
      Circle()
        .fill(accent.opacity(0.28))
      Circle()
        .fill(Color.white.opacity(0.76))
        .scaleEffect(0.82)
        .offset(x: 11, y: -7)
    }
    .compositingGroup()
  }
}

private func compactRemaining(_ remaining: WidgetRemainingTime?) -> String {
  guard let totalMinutes = remaining?.totalMinutes else {
    return "--"
  }

  let safeMinutes = max(0, totalMinutes)
  let hours = safeMinutes / 60
  let minutes = safeMinutes % 60

  if hours <= 0 {
    return "\(minutes)m"
  }

  if minutes <= 0 {
    return "\(hours)s"
  }

  return "\(hours)s \(minutes)m"
}

extension View {
  @ViewBuilder
  func widgetCardBackground<Background: View>(@ViewBuilder _ background: () -> Background) -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.containerBackground(for: .widget) {
        background()
      }
    } else {
      self.background(background())
    }
  }
}
