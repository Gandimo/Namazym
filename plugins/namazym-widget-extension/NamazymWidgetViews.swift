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

  var primary: Color {
    colorScheme == .dark ? Color(red: 0.98, green: 0.95, blue: 0.89) : Color(red: 0.16, green: 0.13, blue: 0.10)
  }

  var secondary: Color {
    colorScheme == .dark ? Color(red: 0.80, green: 0.74, blue: 0.66) : Color(red: 0.45, green: 0.36, blue: 0.26)
  }

  var card: Color {
    colorScheme == .dark ? Color.white.opacity(0.10) : Color.white.opacity(0.44)
  }

  var chip: Color {
    colorScheme == .dark ? accent.opacity(0.20) : Color.white.opacity(0.58)
  }

  var gradient: LinearGradient {
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
}

private struct WidgetBackground: View {
  let palette: WidgetPalette

  var body: some View {
    ZStack {
      palette.gradient
      Circle()
        .fill(palette.accent.opacity(palette.colorScheme == .dark ? 0.16 : 0.13))
        .frame(width: 120, height: 120)
        .offset(x: 70, y: -52)
      Circle()
        .fill(Color.white.opacity(palette.colorScheme == .dark ? 0.05 : 0.22))
        .frame(width: 132, height: 132)
        .offset(x: -56, y: 78)
    }
  }
}

struct NamazymSmallWidgetView: View {
  @Environment(\.colorScheme) private var colorScheme
  let snapshot: NamazymWidgetSnapshot

  var body: some View {
    let accent = Color(hex: snapshot.visualMood.accentColor, fallback: Color(red: 0.72, green: 0.48, blue: 0.22))
    let palette = WidgetPalette(
      accent: accent,
      background: Color(hex: snapshot.visualMood.backgroundColor, fallback: Color(red: 0.96, green: 0.93, blue: 0.87)),
      colorScheme: colorScheme
    )
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
    let accent = Color(hex: snapshot.visualMood.accentColor, fallback: Color(red: 0.72, green: 0.48, blue: 0.22))
    let palette = WidgetPalette(
      accent: accent,
      background: Color(hex: snapshot.visualMood.backgroundColor, fallback: Color(red: 0.96, green: 0.93, blue: 0.87)),
      colorScheme: colorScheme
    )
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
    let accent = Color(hex: snapshot.visualMood.accentColor, fallback: Color(red: 0.72, green: 0.48, blue: 0.22))
    let palette = WidgetPalette(
      accent: accent,
      background: Color(hex: snapshot.visualMood.backgroundColor, fallback: Color(red: 0.96, green: 0.93, blue: 0.87)),
      colorScheme: colorScheme
    )

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
      accent: accent,
      background: Color(hex: mood?.backgroundColor ?? "#F6F1E8", fallback: Color(red: 0.96, green: 0.93, blue: 0.87)),
      colorScheme: colorScheme
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
