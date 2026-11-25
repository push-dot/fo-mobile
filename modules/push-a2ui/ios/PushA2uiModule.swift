import ExpoModulesCore
import ExpoUI

public class PushA2uiModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PushA2ui")

    ExpoUIView(A2uiSurfaceView.self)
  }
}
