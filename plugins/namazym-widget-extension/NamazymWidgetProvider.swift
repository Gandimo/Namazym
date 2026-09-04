import WidgetKit

struct NamazymWidgetEntry: TimelineEntry {
  let date: Date
  let state: NamazymWidgetState
}

struct NamazymWidgetProvider: TimelineProvider {
  /// Countdown "milestones" before each prayer transition. WidgetKit renders
  /// pre-built future entries WITHOUT consuming any refresh budget, so the
  /// remaining-time text updates on schedule even if the app never runs.
  private static let milestoneOffsets: [TimeInterval] = [
    3 * 3600, 2 * 3600, 3600,
    45 * 60, 30 * 60, 15 * 60, 10 * 60, 5 * 60, 2 * 60, 60
  ]
  private static let horizonHours: Double = 36
  private static let maxEntries = 250

  func placeholder(in context: Context) -> NamazymWidgetEntry {
    NamazymWidgetEntry(date: Date(), state: .loaded(.preview))
  }

  func getSnapshot(in context: Context, completion: @escaping (NamazymWidgetEntry) -> Void) {
    completion(NamazymWidgetEntry(date: Date(), state: currentState(at: Date())))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<NamazymWidgetEntry>) -> Void) {
    let now = Date()

    guard let snapshot = decodeSnapshot() else {
      let state: NamazymWidgetState = readSnapshotJSON() == nil ? .missing : .invalid
      completion(shortTimeline(state: state, at: now))
      return
    }

    guard snapshot.resolved(at: now) != nil else {
      // v1 snapshot or multi-day data exhausted — legacy single-entry behavior.
      completion(shortTimeline(state: legacyState(for: snapshot), at: now))
      return
    }

    var entryDates: Set<Date> = [now]
    for transition in snapshot.transitionDates(from: now, horizonHours: Self.horizonHours) {
      entryDates.insert(transition.addingTimeInterval(1))
      for offset in Self.milestoneOffsets {
        let milestone = transition.addingTimeInterval(-offset)
        if milestone > now {
          entryDates.insert(milestone)
        }
      }
    }

    var sortedDates = entryDates.sorted()
    if sortedDates.count > Self.maxEntries {
      sortedDates = Array(sortedDates.prefix(Self.maxEntries))
    }

    let entries = sortedDates.map { date -> NamazymWidgetEntry in
      if let resolvedSnapshot = snapshot.resolved(at: date) {
        return NamazymWidgetEntry(date: date, state: .loaded(resolvedSnapshot))
      }
      return NamazymWidgetEntry(date: date, state: .stale(snapshot))
    }

    let reloadAfter = entries.last?.date ?? now.addingTimeInterval(3600)
    completion(Timeline(entries: entries, policy: .after(reloadAfter)))
  }

  private func shortTimeline(state: NamazymWidgetState, at date: Date) -> Timeline<NamazymWidgetEntry> {
    let refreshDate = Calendar.current.date(byAdding: .minute, value: 15, to: date) ?? date
    return Timeline(entries: [NamazymWidgetEntry(date: date, state: state)], policy: .after(refreshDate))
  }

  private func currentState(at date: Date) -> NamazymWidgetState {
    guard let snapshot = decodeSnapshot() else {
      return readSnapshotJSON() == nil ? .missing : .invalid
    }
    if let resolvedSnapshot = snapshot.resolved(at: date) {
      return .loaded(resolvedSnapshot)
    }
    return legacyState(for: snapshot)
  }

  private func legacyState(for snapshot: NamazymWidgetSnapshot) -> NamazymWidgetState {
    if snapshot.localDateISO == NamazymWidgetSnapshot.currentLocalDateISO() {
      return .loaded(snapshot)
    }
    return .stale(snapshot)
  }

  private func readSnapshotJSON() -> String? {
    guard let defaults = UserDefaults(suiteName: NamazymWidgetConstants.appGroupId) else {
      return nil
    }
    return defaults.string(forKey: NamazymWidgetConstants.snapshotKey)
  }

  private func decodeSnapshot() -> NamazymWidgetSnapshot? {
    guard let json = readSnapshotJSON(), let data = json.data(using: .utf8) else {
      return nil
    }
    return try? JSONDecoder().decode(NamazymWidgetSnapshot.self, from: data)
  }
}
