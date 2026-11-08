import ExpoModulesCore
import UIKit

public class SegmentedAppearanceModule: Module {
  #if DEBUG
  private static var warnedMissingFont = false
  #endif

  public func definition() -> ModuleDefinition {
    Name("SegmentedAppearance")

    Function("setTitleFont") { (name: String, size: Double) in
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
        let attributes: [NSAttributedString.Key: Any] = [.font: font]
        // UIAppearance is process-global: every UISegmentedControl in the app (even a system one) gets this font.
        let appearance = UISegmentedControl.appearance()
        appearance.setTitleTextAttributes(attributes, for: .normal)
        appearance.setTitleTextAttributes(attributes, for: .selected)
      }
    }
  }
}
