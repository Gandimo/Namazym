import WidgetKit

struct NamazymWidgetEntry: TimelineEntry {
  let date: Date
  let state: NamazymWidgetState
}

struct NamazymWidgetProvider: TimelineProvider {
  func placeholder(in context: Context) -> NamazymWidgetEntry {
    NamazymWidgetEntry(date: Date(), state: .loaded(.preview))
  }

  func getSnapshot(in context: Context, completion: @escaping (NamazymWidgetEntry) -> Void) {
    completion(NamazymWidgetEntry(date: Date(), state: loadSnapshot()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<NamazymWidgetEntry>) -> Void) {
    let entry = NamazymWidgetEntry(date: Date(), state: loadSnapshot())
    let refreshDate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
    completion(Timeline(entries: [entry], policy: .after(refreshDate)))
  }

  private func loadSnapshot() -> NamazymWidgetState {
    guard let defaults = UserDefaults(suiteName: NamazymWidgetConstants.appGroupId) else {
      return .missing
    }

    guard let json = defaults.string(forKey: NamazymWidgetConstants.snapshotKey) else {
      return .missing
    }

    guard let data = json.data(using: .utf8) else {
      return .invalid
    }

    do {
      let snapshot = try JSONDecoder().decode(NamazymWidgetSnapshot.self, from: data)
      if snapshot.localDateISO != NamazymWidgetSnapshot.currentLocalDateISO() {
        return .stale(snapshot)
      }
      return .loaded(snapshot)
    } catch {
      return .invalid
    }
  }
}
