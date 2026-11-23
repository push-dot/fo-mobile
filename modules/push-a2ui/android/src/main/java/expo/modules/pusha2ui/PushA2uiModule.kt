package expo.modules.pusha2ui

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.ui.ExpoUIView

class PushA2uiModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PushA2ui")

    ExpoUIView<A2uiSurfaceViewProps>("A2uiSurfaceView") {
      val onAction by Event<A2uiActionEvent>()

      Content { props ->
        A2uiSurfaceViewContent(props) { onAction(it) }
      }
    }
  }
}
