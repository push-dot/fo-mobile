import SwiftUI
import UIKit

/// Design tokens the app injects as JSON (`theme` prop): colours for the current scheme, font names, radii.
/// The server sends no theme; JS follows the app's light/dark choice and resends this when it changes.
struct PushTheme: Equatable {
  var colors: [String: Color] = [:]
  var fonts: [String: String] = [:]
  var radius: [String: CGFloat] = [:]

  init() {}

  init(json: String?) {
    guard let json, let data = json.data(using: .utf8),
      let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return }
    for (key, value) in root["colors"] as? [String: String] ?? [:] {
      if let color = Self.color(value) { colors[key] = color }
    }
    fonts = root["fonts"] as? [String: String] ?? [:]
    for (key, value) in root["radius"] as? [String: Double] ?? [:] { radius[key] = CGFloat(value) }
  }

  func color(_ name: String) -> Color { colors[name] ?? .primary }
  func r(_ name: String, _ fallback: CGFloat) -> CGFloat { radius[name] ?? fallback }

  /// Noto Sans KR by weight; the system face when the app sent none.
  func font(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
    let key: String =
      switch weight {
      case .medium: "500"
      case .semibold: "600"
      case .bold: "700"
      case .heavy, .black: "800"
      default: "400"
      }
    guard let name = fonts[key] else { return .system(size: size, weight: weight) }
    return .custom(name, size: size)
  }

  /// `#RRGGBB`, `#RRGGBBAA` or `rgba(r,g,b,a)` as the design tokens write them.
  static func color(_ raw: String) -> Color? {
    let s = raw.trimmingCharacters(in: .whitespaces)
    if s.hasPrefix("#") {
      let hex = String(s.dropFirst())
      guard let v = UInt64(hex, radix: 16) else { return nil }
      switch hex.count {
      case 6:
        return Color(.sRGB, red: Double((v >> 16) & 0xFF) / 255, green: Double((v >> 8) & 0xFF) / 255, blue: Double(v & 0xFF) / 255)
      case 8:
        return Color(.sRGB, red: Double((v >> 24) & 0xFF) / 255, green: Double((v >> 16) & 0xFF) / 255, blue: Double((v >> 8) & 0xFF) / 255, opacity: Double(v & 0xFF) / 255)
      default: return nil
      }
    }
    guard let open = s.firstIndex(of: "("), let close = s.lastIndex(of: ")") else { return nil }
    let parts = s[s.index(after: open)..<close].split(separator: ",").compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
    guard parts.count >= 3 else { return nil }
    return Color(.sRGB, red: parts[0] / 255, green: parts[1] / 255, blue: parts[2] / 255, opacity: parts.count > 3 ? parts[3] : 1)
  }
}

/// Sends a renderer-to-app action (`name`, `context`) from a Push component. The surface view turns it into the
/// same `{version, action}` JSON the official renderer emits.
struct PushDispatch {
  var send: (_ name: String, _ context: [String: Any], _ sourceComponentId: String) -> Void = { _, _, _ in }
  func callAsFunction(_ name: String, _ context: [String: Any], from id: String) { send(name, context, id) }
}

private struct PushThemeKey: EnvironmentKey { static let defaultValue = PushTheme() }
private struct PushDispatchKey: EnvironmentKey { static let defaultValue = PushDispatch() }
private struct PushInteractiveKey: EnvironmentKey { static let defaultValue = true }

extension EnvironmentValues {
  var pushTheme: PushTheme {
    get { self[PushThemeKey.self] }
    set { self[PushThemeKey.self] = newValue }
  }
  var pushDispatch: PushDispatch {
    get { self[PushDispatchKey.self] }
    set { self[PushDispatchKey.self] = newValue }
  }
  /// False on every surface but the newest waiting one: nothing in it responds.
  var pushInteractive: Bool {
    get { self[PushInteractiveKey.self] }
    set { self[PushInteractiveKey.self] = newValue }
  }
}
