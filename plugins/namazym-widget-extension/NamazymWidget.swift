import WidgetKit
import SwiftUI

struct NamazymWidget: Widget {
  let kind = "NamazymWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: NamazymWidgetProvider()) { entry in
      NamazymWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Namazym")
    .description("Namaz wagtlaryny öý ekranynda görkezýär.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}
