import Foundation
import React
import WidgetKit

private enum NamazymWidgetBridgeConstants {
  static let appGroupId = "group.com.namazym.app"
  static let snapshotKey = "namazym.widget.snapshot.v1"
}

@objc(NamazymWidgetBridge)
final class NamazymWidgetBridge: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(writeSnapshot:resolver:rejecter:)
  func writeSnapshot(
    _ json: String,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: NamazymWidgetBridgeConstants.appGroupId) else {
      reject(
        "APP_GROUP_UNAVAILABLE",
        "Unable to open App Group UserDefaults for \(NamazymWidgetBridgeConstants.appGroupId).",
        nil
      )
      return
    }

    defaults.set(json, forKey: NamazymWidgetBridgeConstants.snapshotKey)
    defaults.synchronize()
    reloadWidgetTimelines()
    resolve(nil)
  }

  @objc(clearSnapshot:rejecter:)
  func clearSnapshot(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: NamazymWidgetBridgeConstants.appGroupId) else {
      reject(
        "APP_GROUP_UNAVAILABLE",
        "Unable to open App Group UserDefaults for \(NamazymWidgetBridgeConstants.appGroupId).",
        nil
      )
      return
    }

    defaults.removeObject(forKey: NamazymWidgetBridgeConstants.snapshotKey)
    defaults.synchronize()
    reloadWidgetTimelines()
    resolve(nil)
  }

  private func reloadWidgetTimelines() {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}
