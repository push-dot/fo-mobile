import ExpoModulesCore
import UIKit

/// `#RRGGBB` from a design token (`palette.light.t3` / `palette.dark.t3`).
private func tokenColor(_ hex: String) -> UIColor? {
  var raw = hex.trimmingCharacters(in: .whitespacesAndNewlines)
  if raw.hasPrefix("#") { raw.removeFirst() }
  guard raw.count == 6, let value = UInt64(raw, radix: 16) else { return nil }
  return UIColor(
    red: CGFloat((value >> 16) & 0xFF) / 255,
    green: CGFloat((value >> 8) & 0xFF) / 255,
    blue: CGFloat(value & 0xFF) / 255,
    alpha: 1
  )
}

private func titleAttributes(font: UIFont, color: UIColor?) -> [NSAttributedString.Key: Any] {
  var attributes: [NSAttributedString.Key: Any] = [.font: font]
  if let color { attributes[.foregroundColor] = color }
  return attributes
}

public class SegmentedAppearanceModule: Module {
  #if DEBUG
  private static var warnedMissingFont = false
  #endif

  public func definition() -> ModuleDefinition {
    Name("SegmentedAppearance")

    Function("setTitleFont") { (name: String, size: Double, light: String, dark: String) in
      guard let base = UIFont(name: name, size: CGFloat(size)) else {
        #if DEBUG
        if !Self.warnedMissingFont {
          Self.warnedMissingFont = true
          NSLog("[SegmentedAppearance] font not found: %@", name)
        }
        #endif
        return
      }
      // Keep Dynamic Type: a fixed UIFont would stop the labels scaling.
      let font = UIFontMetrics.default.scaledFont(for: base)
      DispatchQueue.main.async {
        // Unselected titles take the board grey (t3), per theme. Selected titles keep the system colour.
        let selected = titleAttributes(font: font, color: nil)
        let lightNormal = titleAttributes(font: font, color: tokenColor(light))
        let darkNormal = titleAttributes(font: font, color: tokenColor(dark))
        // UIAppearance is process-global: every UISegmentedControl in the app (even a system one) gets this face.
        let appearance = UISegmentedControl.appearance()
        appearance.setTitleTextAttributes(lightNormal, for: .normal)
        appearance.setTitleTextAttributes(selected, for: .selected)
        let lightTraits = UITraitCollection(userInterfaceStyle: .light)
        let darkTraits = UITraitCollection(userInterfaceStyle: .dark)
        UISegmentedControl.appearance(for: lightTraits).setTitleTextAttributes(lightNormal, for: .normal)
        UISegmentedControl.appearance(for: lightTraits).setTitleTextAttributes(selected, for: .selected)
        UISegmentedControl.appearance(for: darkTraits).setTitleTextAttributes(darkNormal, for: .normal)
        UISegmentedControl.appearance(for: darkTraits).setTitleTextAttributes(selected, for: .selected)
      }
    }
  }
}
