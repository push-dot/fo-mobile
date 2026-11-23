import A2UICore
import A2UISwiftUI
import Combine
import ExpoModulesCore
import ExpoUI
import SwiftUI

final class A2uiSurfaceViewProps: UIBaseViewProps {
  /// A2UI agent-to-renderer messages for one surface, as JSON strings. Append-only.
  @Field var messages: [String] = []
  /// Design tokens as JSON: `{colors, fonts, radius}` for the current scheme (see `PushTheme`).
  @Field var theme: String?
  /// False on every surface but the newest waiting one: its PushChoice does not respond.
  @Field var interactive: Bool = false
  var onAction = EventDispatcher()
}

struct A2uiSurfaceView: ExpoSwiftUI.View {
  @ObservedObject public var props: A2uiSurfaceViewProps
  @StateObject private var controller = A2uiSurfaceController()

  var body: some View {
    let theme = PushTheme(json: props.theme)
    // A VStack, not a Group: an empty Group has no view to fire onAppear on.
    VStack(spacing: 0) {
      if let surface = controller.surface {
        Surface(viewModel: surface, catalog: PushCatalog.catalog)
          .padding(16)
          .frame(maxWidth: .infinity, alignment: .leading)
          .background(theme.color("bg2"), in: RoundedRectangle(cornerRadius: theme.r("surface", 20)))
      }
    }
    // The Host's hosting controller hands its content the window's safe area once the row scrolls under the status bar
    // (top 0 → 47 on an iPhone 17e). The content then lays out that much lower inside an unchanged frame and draws over
    // the next row. A card in a scrolling list never takes the safe area.
    .ignoresSafeArea()
    .environment(\.pushTheme, theme)
    .environment(\.pushInteractive, props.interactive)
    .environment(\.pushDispatch, PushDispatch { name, context, source in controller.send(name, context, source) })
    .onAppear { feed() }
    .onChange(of: props.messages) { feed() }
  }

  private func feed() {
    controller.onAction = { props.onAction(["message": $0]) }
    controller.feed(props.messages)
  }
}

/// Owns one `MessageProcessor` and feeds it only the messages it has not seen yet.
@MainActor
final class A2uiSurfaceController: ObservableObject {
  @Published private(set) var surface: SurfaceViewModel?
  var onAction: ((String) -> Void)?

  private let processor = MessageProcessor(catalogs: [PushCatalog.catalog])
  private let parser = MessageParser()
  private var fed = 0
  private var cancellable: AnyCancellable?

  init() {
    cancellable = processor.surfaceGroupModel.$surfacesMap.sink { [weak self] map in
      self?.surface = map.values.first
    }
    processor.outboundListener = { [weak self] message in
      if case .error(let error) = message {
        log.error("A2UI renderer error: \(error)")
        return
      }
      guard case .action = message,
        let data = try? JSONEncoder().encode(message),
        let json = String(data: data, encoding: .utf8)
      else { return }
      Task { @MainActor in self?.onAction?(json) }
    }
  }

  /// An action from a Push component, in the shape the renderer itself sends: `{version, action: {name, surfaceId, sourceComponentId, timestamp, context}}`.
  func send(_ name: String, _ context: [String: Any], _ source: String) {
    guard let surfaceId = surface?.surfaceID else { return }
    let action: [String: Any] = [
      "name": name,
      "surfaceId": surfaceId,
      "sourceComponentId": source,
      "timestamp": ISO8601DateFormatter().string(from: Date()),
      "context": context,
    ]
    let message: [String: Any] = ["version": PushCatalog.protocolVersion.rawValue, "action": action]
    guard let data = try? JSONSerialization.data(withJSONObject: message), let json = String(data: data, encoding: .utf8) else { return }
    onAction?(json)
  }

  func feed(_ messages: [String]) {
    guard messages.count > fed else { return }
    for json in messages[fed...] {
      do {
        processor.process(message: try parser.parse(jsonString: json))
      } catch {
        log.error("A2UI message rejected: \(error)")
      }
    }
    fed = messages.count
  }
}
