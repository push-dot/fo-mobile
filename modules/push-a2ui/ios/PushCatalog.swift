import A2UICore
import A2UISwiftUI
import BasicCatalog
import BasicCatalogSwiftUI
import Foundation
import JSONSchema
import OrderedJSON
import SwiftUI

/// The Push catalog: the basic catalog with a plain-text `Text`, plus the Push components.
/// The Push components take their schemas from the vendored `catalog/push-catalog.json`.
@MainActor
enum PushCatalog {
  static let id = "https://push.app/a2ui/catalogs/push/v1/catalog.json"
  /// The protocol iOS speaks (the app sends it as `A2UI-Version`) and the catalog document of that version.
  /// Android speaks v0.9.1: its official renderer reads nothing newer. Switch both lines together.
  static let protocolVersion = A2UIProtocolVersion.v10
  static let catalogFile = "push-catalog.v1"

  private static var v10: Bool { protocolVersion == .v10 }

  static let catalog = Catalog(
    id: id,
    protocolVersion: protocolVersion.rawValue,
    components: (v10 ? BasicCatalogImplementation.v10Components : BasicCatalogImplementation.allComponents).filter { $0.name != "Text" } + [
      plainText,
      component("PushChoice") { PushChoiceView(node: $0) },
      component("PushTodo") { PushTodoView(node: $0) },
      component("PushDiff") { PushDiffView(node: $0) },
      component("PushPlan") { PushPlanView(node: $0) },
      component("PushFit") { PushFitView(node: $0) },
      component("PushDocument") { PushDocumentView(node: $0) },
      component("PushJobCard") { PushJobCardView(node: $0) },
    ],
    functions: v10 ? V10BasicFunctions.allFunctions : V09BasicFunctions.allFunctions,
    themeSchema: v10 ? nil : V09BasicCatalog.themeSchema
  )

  /// Same schema as the basic `Text`, but renders verbatim: the basic one parses Markdown and has no switch for it.
  static let plainText = ComponentImplementation(api: v10 ? BasicCatalogComponents.v10Text : BasicCatalogComponents.text) { node in
    PlainText(node: node)
  }

  private static func component<V: View>(_ name: String, _ builder: @escaping @MainActor (Node) -> V) -> ComponentImplementation {
    ComponentImplementation(name: name, schema: schema(name), builder: builder)
  }

  private static let document: [String: Any] = {
    let bundle = Bundle.main.url(forResource: "PushA2uiCatalog", withExtension: "bundle").flatMap(Bundle.init(url:)) ?? Bundle.main
    guard let url = bundle.url(forResource: catalogFile, withExtension: "json"),
      let data = try? Data(contentsOf: url),
      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { fatalError("push-a2ui: \(catalogFile).json is missing from the PushA2uiCatalog bundle") }
    return json
  }()

  /// The component's schema from the catalog file, with every data-bound prop (`anyOf` a literal or a `{path}` binding)
  /// written as `$ref: #/$defs/DynamicValue`: the renderer only binds props whose `$ref` names a dynamic type, and
  /// it cannot resolve a `$ref` into common_types.json, so the definition is local and accepts anything.
  static func schema(_ name: String) -> Schema {
    guard var component = (document["components"] as? [String: Any])?[name] as? [String: Any] else {
      fatalError("push-a2ui: \(name) is not in \(catalogFile).json")
    }
    var properties = component["properties"] as? [String: Any] ?? [:]
    for (key, raw) in properties {
      guard let prop = raw as? [String: Any], let options = prop["anyOf"] as? [[String: Any]] else { continue }
      let bindable = options.contains { option in
        let keys = (option["properties"] as? [String: Any])?.keys
        return keys?.contains("path") == true || keys?.contains("@path") == true
      }
      if bindable { properties[key] = ["$ref": "#/$defs/DynamicValue", "description": prop["description"] ?? ""] }
    }
    component["properties"] = properties
    component["$defs"] = ["DynamicValue": [String: Any]()]
    guard let data = try? JSONSerialization.data(withJSONObject: component),
      let text = String(data: data, encoding: .utf8),
      let schema = try? Schema(instance: text)
    else { fatalError("push-a2ui: the \(name) schema does not parse") }
    return schema
  }
}

// MARK: - Reading props

@MainActor
extension Node {
  /// A prop as plain Foundation values (`String`, `Bool`, `Double`, `[Any]`, `[String: Any]`), literal or bound.
  func value(_ key: String) -> Any? { PushValue.plain(properties[key]) }
  func list(_ key: String) -> [[String: Any]] { value(key) as? [[String: Any]] ?? [] }
  func strings(_ key: String) -> [String] { value(key) as? [String] ?? [] }

  /// Writes a bound prop back into the surface's data model. False when the prop is a literal.
  @discardableResult
  func write(_ key: String, _ value: Any) -> Bool {
    guard let binding: DataBinding<JSONValue> = dataBinding(for: key),
      let data = try? JSONSerialization.data(withJSONObject: value, options: .fragmentsAllowed),
      let json = try? JSONDecoder().decode(JSONValue.self, from: data)
    else { return false }
    binding.set(json)
    return true
  }
}

enum PushValue {
  static func plain(_ resolved: (any Resolved)?) -> Any? {
    switch resolved {
    case nil: return nil
    case let v as String: return v
    case let v as Bool: return v
    case let v as Int: return Double(v)
    case let v as Double: return v
    case let v as ResolvedArray: return v.elements.compactMap(plain)
    case let v as ResolvedDictionary: return v.storage.compactMapValues(plain)
    case let v as JSONValue: return json(v)
    case let v as DataBinding<JSONValue>: return v.value.flatMap(json)
    case let v as DataBinding<String>: return v.value
    case let v as DataBinding<Bool>: return v.value
    case let v as DataBinding<Double>: return v.value
    default: return nil
    }
  }

  static func json(_ value: JSONValue) -> Any? {
    guard let data = try? JSONEncoder().encode(value) else { return nil }
    return try? JSONSerialization.jsonObject(with: data, options: .fragmentsAllowed)
  }
}

extension Dictionary where Key == String, Value == Any {
  func str(_ key: String) -> String? { self[key] as? String }
  func flag(_ key: String) -> Bool { self[key] as? Bool ?? false }
}

// MARK: - Text

private struct PlainText: View {
  let node: Node
  @Environment(\.pushTheme) private var t

  var body: some View {
    let variant = node.string(for: "variant") ?? "body"
    // 1.0 Text has only `caption` and body: the server sends a surface's question as the Text with id `title` and no variant.
    let heading = variant.hasPrefix("h") || node.id == "title"
    let caption = variant == "caption"
    Text(verbatim: node.string(for: "text") ?? "")
      .font(heading ? t.font(17, .bold) : caption ? t.font(13) : t.font(15))
      .lineSpacing(heading ? 3 : caption ? 2 : 4)
      .foregroundStyle(heading ? t.color("t1") : t.color("t2"))
      .frame(maxWidth: .infinity, alignment: .leading)
      .fixedSize(horizontal: false, vertical: true)
  }
}
