import A2UICore
import SwiftUI

// The Push components, drawn to the design system's iOS (SwiftUI) previews. Copy that is not in a prop
// ("1/N", "다음", "추천", "변경", "전체 보기", "항목별 점수 보기", "ULTRA로 업그레이드", "할 일") is the catalog's.

private let answeredOpacity = 0.45

// MARK: - Shared pieces

private struct PushButton: View {
  let label: String
  var primary = true
  var enabled = true
  let action: () -> Void
  @Environment(\.pushTheme) private var t

  var body: some View {
    Button(action: action) {
      Text(verbatim: label)
        .font(t.font(16, .bold))
        .foregroundStyle(primary ? t.color("onFill") : t.color("t1"))
        .frame(maxWidth: .infinity, minHeight: 48)
        .padding(.horizontal, 16)
        .background(primary ? t.color("ac") : t.color("fill2"), in: RoundedRectangle(cornerRadius: t.r("md", 16)))
        .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    // Not `.disabled`: SwiftUI dims a disabled label, and an answered surface keeps its pick at full strength.
    .allowsHitTesting(enabled)
  }
}

private struct PushLink: View {
  let label: String
  let action: () -> Void
  @Environment(\.pushTheme) private var t

  var body: some View {
    Button(action: action) {
      Text(verbatim: label).font(t.font(14, .semibold)).foregroundStyle(t.color("acText"))
    }
    .buttonStyle(.plain)
  }
}

private struct Title: View {
  let text: String
  @Environment(\.pushTheme) private var t
  var body: some View {
    Text(verbatim: text).font(t.font(17, .bold)).foregroundStyle(t.color("t1")).fixedSize(horizontal: false, vertical: true)
  }
}

private struct Caption: View {
  let text: String
  @Environment(\.pushTheme) private var t
  var body: some View {
    Text(verbatim: text).font(t.font(13)).foregroundStyle(t.color("t2")).fixedSize(horizontal: false, vertical: true)
  }
}

/// Wraps its children onto new lines, like CSS `flex-wrap`.
private struct Flow: Layout {
  var spacing: CGFloat = 6

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    let rows = arrange(proposal.width ?? .infinity, subviews)
    return CGSize(width: proposal.width ?? rows.map(\.width).max() ?? 0, height: rows.last.map { $0.y + $0.height } ?? 0)
  }

  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    for row in arrange(bounds.width, subviews) {
      var x = bounds.minX
      for i in row.items {
        let size = subviews[i].sizeThatFits(.unspecified)
        subviews[i].place(at: CGPoint(x: x, y: bounds.minY + row.y), proposal: ProposedViewSize(size))
        x += size.width + spacing
      }
    }
  }

  private func arrange(_ width: CGFloat, _ subviews: Subviews) -> [(items: [Int], y: CGFloat, width: CGFloat, height: CGFloat)] {
    var rows: [(items: [Int], y: CGFloat, width: CGFloat, height: CGFloat)] = []
    var current: (items: [Int], y: CGFloat, width: CGFloat, height: CGFloat) = ([], 0, 0, 0)
    for (i, view) in subviews.enumerated() {
      let size = view.sizeThatFits(.unspecified)
      if !current.items.isEmpty, current.width + spacing + size.width > width {
        rows.append(current)
        current = ([], current.y + current.height + spacing, 0, 0)
      }
      current.width += (current.items.isEmpty ? 0 : spacing) + size.width
      current.height = max(current.height, size.height)
      current.items.append(i)
    }
    if !current.items.isEmpty { rows.append(current) }
    return rows
  }
}

// MARK: - PushChoice

struct PushChoiceView: View {
  let node: Node
  @Environment(\.pushTheme) private var t
  @Environment(\.pushDispatch) private var dispatch
  @Environment(\.pushInteractive) private var interactive
  @State private var step = 0
  /// Picks when `selected` is a literal (never in practice: the server binds it).
  @State private var local: [String: [String]]?

  private struct Choice {
    let id: String, label: String, desc: String?, recommended: Bool, change: Bool
  }

  private struct Question {
    let id: String, title: String?, detail: String?, multiple: Bool, answerable: Bool, choices: [Choice]
  }

  private var questions: [Question] {
    node.list("questions").map { q in
      Question(
        id: q.str("id") ?? "",
        title: q.str("title"),
        detail: q.str("detail"),
        multiple: q.flag("multiple"),
        answerable: q["answerable"] as? Bool ?? true,
        choices: (q["choices"] as? [[String: Any]] ?? []).map {
          Choice(id: $0.str("id") ?? "", label: $0.str("label") ?? "", desc: $0.str("desc"), recommended: $0.flag("recommended"), change: $0.flag("change"))
        }
      )
    }
  }

  private var open: Bool { node.bool(for: "open") ?? false }
  private var picked: [String] { node.strings("picked") }
  private var live: Bool { open && interactive }
  private var submit: [String: Any]? { node.value("submit") as? [String: Any] }
  private var secondary: [String: Any]? { node.value("secondary") as? [String: Any] }
  private var selected: [String: [String]] { local ?? (node.value("selected") as? [String: [String]]) ?? [:] }

  var body: some View {
    let qs = questions
    VStack(alignment: .leading, spacing: 10) {
      if node.string(for: "form") == "buttons", let q = qs.first {
        buttonsForm(q)
      } else if !open {
        // Answered: every question with its picks; nothing responds.
        ForEach(Array(qs.enumerated()), id: \.offset) { _, q in question(q) }
      } else if let q = qs[safe: min(step, qs.count - 1)] {
        if qs.count > 1 { Caption(text: "\(min(step, qs.count - 1) + 1)/\(qs.count)") }
        question(q)
        footer(qs, last: step >= qs.count - 1)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  @ViewBuilder private func buttonsForm(_ q: Question) -> some View {
    HStack(spacing: 8) {
      ForEach(Array(q.choices.prefix(2).enumerated()), id: \.offset) { i, c in
        PushButton(label: c.label, primary: i == 1, enabled: live) { answer(pick: [c.id]) }
          .opacity(!open && !picked.contains(c.id) ? answeredOpacity : 1)
      }
    }
  }

  @ViewBuilder private func question(_ q: Question) -> some View {
    if let title = q.title { Title(text: title) }
    if let detail = q.detail {
      Text(verbatim: detail).font(t.font(15)).foregroundStyle(t.color("t2")).fixedSize(horizontal: false, vertical: true)
    }
    VStack(spacing: 8) {
      ForEach(Array(q.choices.enumerated()), id: \.offset) { _, c in row(q, c) }
    }
  }

  @ViewBuilder private func row(_ q: Question, _ c: Choice) -> some View {
    let on = open ? (selected[q.id] ?? []).contains(c.id) : picked.contains(c.id)
    let fg = on ? t.color("acText") : t.color("t1")
    Button { tap(q, c) } label: {
      HStack(spacing: 12) {
        VStack(alignment: .leading, spacing: 0) {
          Text(verbatim: c.label).font(t.font(16, .semibold)).foregroundStyle(fg)
          if let desc = c.desc { Text(verbatim: desc).font(t.font(13)).foregroundStyle(t.color("t2")) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        if c.recommended {
          Text(verbatim: "추천").font(t.font(12, .bold)).foregroundStyle(t.color("onFill"))
            .padding(.horizontal, 6).padding(.vertical, 2)
            .background(t.color("ac"), in: RoundedRectangle(cornerRadius: t.r("xs", 6)))
        }
        if c.change {
          PushLink(label: "변경") { if open && interactive { dispatch("change", ["optionId": c.id], from: node.id) } }
        }
        if on { Image(systemName: "checkmark").font(.system(size: 16, weight: .bold)).foregroundStyle(t.color("acText")) }
      }
      .padding(.horizontal, 14).padding(.vertical, 8)
      .frame(minHeight: 52)
      .background(on ? t.color("acSoft") : t.color("card"), in: RoundedRectangle(cornerRadius: 14))
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .allowsHitTesting(live && q.answerable && !c.change)
    .opacity(!open && !on ? answeredOpacity : 1)
    .accessibilityAddTraits(on ? .isSelected : [])
  }

  @ViewBuilder private func footer(_ qs: [Question], last: Bool) -> some View {
    let q = qs[min(step, qs.count - 1)]
    if !last {
      PushButton(label: "다음", enabled: live) { step += 1 }
    } else if submit != nil || q.multiple || secondary != nil {
      HStack(spacing: 8) {
        if let secondary, let id = secondary.str("id") {
          PushButton(label: secondary.str("label") ?? "", primary: false, enabled: live) { answer(pick: [id]) }
        }
        if submit != nil || q.multiple {
          PushButton(label: submitLabel(qs), enabled: live && (isSubmit || !answerIds(qs).isEmpty)) { send(qs) }
        }
      }
    }
  }

  private var isSubmit: Bool { node.string(for: "answer") == "submit" }

  private func submitLabel(_ qs: [Question]) -> String {
    let labels = submit?["labels"] as? [String: String] ?? [:]
    for q in qs where !q.multiple {
      if let id = selected[q.id]?.first, let label = labels[id] { return label }
    }
    return submit?.str("label") ?? ""
  }

  /// Picks of every answerable question, in question order and choice order.
  private func answerIds(_ qs: [Question]) -> [String] {
    qs.filter(\.answerable).flatMap { q in q.choices.map(\.id).filter { (selected[q.id] ?? []).contains($0) } }
  }

  private func tap(_ q: Question, _ c: Choice) {
    guard live, q.answerable, !c.change else { return }
    if !q.multiple && submit == nil && questions.count == 1 { return answer(pick: [c.id]) }
    var next = selected
    var ids = next[q.id] ?? []
    if q.multiple {
      ids = ids.contains(c.id) ? ids.filter { $0 != c.id } : q.choices.map(\.id).filter { ids.contains($0) || $0 == c.id }
    } else {
      ids = [c.id]
    }
    next[q.id] = ids
    if !node.write("selected", next) { local = next }
  }

  private func send(_ qs: [Question]) {
    let ids = answerIds(qs)
    if isSubmit { return emit(["optionId": "submit", "optionIds": ["submit"] + ids]) }
    answer(pick: ids)
  }

  private func answer(pick ids: [String]) {
    guard let first = ids.first else { return }
    emit(ids.count > 1 ? ["optionId": first, "optionIds": ids] : ["optionId": first])
  }

  private func emit(_ context: [String: Any]) {
    guard live else { return }
    dispatch("answer", context, from: node.id)
  }
}

extension Array {
  subscript(safe index: Int) -> Element? { indices.contains(index) ? self[index] : nil }
}

// MARK: - PushTodo

struct PushTodoView: View {
  let node: Node
  @Environment(\.pushTheme) private var t
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @State private var dim = false

  var body: some View {
    let items = node.list("items")
    VStack(alignment: .leading, spacing: 10) {
      Title(text: "할 일")
      ForEach(Array(items.enumerated()), id: \.offset) { i, item in
        let state = item.str("state") ?? "waiting"
        HStack(spacing: 10) {
          mark(state, n: i + 1)
          Text(verbatim: item.str("text") ?? "")
            .font(t.font(15, state == "running" ? .semibold : .regular))
            .strikethrough(state == "done")
            .foregroundStyle(state == "done" ? t.color("t2") : t.color("t1"))
            .fixedSize(horizontal: false, vertical: true)
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .onAppear {
      guard !reduceMotion else { return }
      withAnimation(.easeInOut(duration: 0.5).repeatForever(autoreverses: true)) { dim = true }
    }
  }

  @ViewBuilder private func mark(_ state: String, n: Int) -> some View {
    ZStack {
      switch state {
      case "done":
        Circle().fill(t.color("green"))
        Image(systemName: "checkmark").font(.system(size: 9, weight: .heavy)).foregroundStyle(t.color("bg"))
      case "running":
        Circle().fill(t.color("ac")).opacity(dim ? 0.35 : 1)
        Circle().fill(Color.white).frame(width: 6, height: 6)
      default:
        Circle().fill(t.color("fill2"))
        Text(verbatim: "\(n)").font(t.font(11, .bold)).foregroundStyle(t.color("t2"))
      }
    }
    .frame(width: 18, height: 18)
  }
}

// MARK: - PushDiff

struct PushDiffView: View {
  let node: Node
  @Environment(\.pushTheme) private var t
  @Environment(\.pushDispatch) private var dispatch

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      if let caption = node.string(for: "caption") { Caption(text: caption) }
      if let title = node.string(for: "title") { Title(text: title) }
      VStack(spacing: 0) {
        ForEach(Array(node.list("lines").enumerated()), id: \.offset) { _, line in
          let sign = line.str("sign") ?? ""
          HStack(alignment: .top, spacing: 8) {
            Text(verbatim: sign == "-" ? "−" : sign).font(t.font(14, .bold)).frame(width: 10)
            Text(verbatim: line.str("text") ?? "").font(t.font(14)).strikethrough(sign == "-")
              .frame(maxWidth: .infinity, alignment: .leading).fixedSize(horizontal: false, vertical: true)
          }
          .foregroundStyle(sign == "+" ? t.color("t1") : t.color("t2"))
          .padding(.horizontal, 10).padding(.vertical, 6)
          .background(sign == "+" ? t.color("greenSoft") : sign == "-" ? t.color("redSoft") : .clear)
        }
      }
      .clipShape(RoundedRectangle(cornerRadius: t.r("sm", 12)))
      if let documentId = node.string(for: "documentId") {
        PushLink(label: "전체 보기") { dispatch("open_review", ["documentId": documentId], from: node.id) }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

// MARK: - PushPlan

struct PushPlanView: View {
  let node: Node
  @Environment(\.pushTheme) private var t

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      if let caption = node.string(for: "caption") { Caption(text: caption) }
      if let title = node.string(for: "title") { Title(text: title) }
      VStack(alignment: .leading, spacing: 0) {
        ForEach(Array(node.list("rows").enumerated()), id: \.offset) { i, row in
          VStack(spacing: 0) {
            if i > 0 { Rectangle().fill(t.color("line")).frame(height: 1) }
            HStack(alignment: .top, spacing: 10) {
              Text(verbatim: row.str("tag") ?? "").font(t.font(12, .bold)).foregroundStyle(t.color("t1"))
                .padding(.horizontal, 7).padding(.vertical, 3)
                .background(tone(row.str("tone")), in: RoundedRectangle(cornerRadius: t.r("xs", 6)))
              VStack(alignment: .leading, spacing: 4) {
                Text(verbatim: row.str("label") ?? "").font(t.font(15, .semibold)).foregroundStyle(t.color("t1"))
                if let note = row.str("note"), !note.isEmpty { Caption(text: note) }
              }
              .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.top, i > 0 ? 10 : 0).padding(.bottom, 10)
          }
        }
      }
      let keywords = node.strings("keywords")
      if !keywords.isEmpty {
        Flow {
          ForEach(keywords, id: \.self) { word in
            Text(verbatim: word).font(t.font(13)).foregroundStyle(t.color("t1"))
              .padding(.horizontal, 10).padding(.vertical, 4)
              .background(t.color("fill2"), in: Capsule())
          }
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  private func tone(_ name: String?) -> Color {
    switch name {
    case "green": t.color("greenSoft")
    case "orange": t.color("orangeSoft")
    default: t.color("acSoft")
    }
  }
}

// MARK: - PushFit

struct PushFitView: View {
  let node: Node
  @Environment(\.pushTheme) private var t
  @Environment(\.pushDispatch) private var dispatch
  @State private var showItems = false

  /// Shown when locked: example rows, never the person's real ones.
  private static let examples: [(String, Double)] = [("기술 스택", 8), ("경력", 6.5), ("도메인", 5)]

  var body: some View {
    let items = node.list("items").map { ($0.str("label") ?? "", $0["score"] as? Double ?? 0) }
    let locked = node.bool(for: "locked") ?? false
    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .firstTextBaseline, spacing: 8) {
        Text(verbatim: node.string(for: "score") ?? "").font(t.font(26, .heavy)).foregroundStyle(t.color("t1"))
        Text(verbatim: node.string(for: "sentence") ?? "").font(t.font(15)).foregroundStyle(t.color("t2"))
          .fixedSize(horizontal: false, vertical: true)
      }
      if let summary = node.string(for: "summary") {
        Text(verbatim: summary).font(t.font(15)).foregroundStyle(t.color("t2")).fixedSize(horizontal: false, vertical: true)
      }
      if locked {
        bars(Self.examples, numbers: false).opacity(answeredOpacity)
        PushButton(label: "ULTRA로 업그레이드") { dispatch("open_plan", [:], from: node.id) }
      } else if !items.isEmpty {
        if showItems { bars(items, numbers: true) }
        PushLink(label: showItems ? "항목별 점수 접기" : "항목별 점수 보기") { showItems.toggle() }
      }
      ForEach(Array(node.strings("rounds").enumerated()), id: \.offset) { _, round in
        HStack(alignment: .top, spacing: 8) {
          Image(systemName: "checkmark").font(.system(size: 12, weight: .bold)).foregroundStyle(t.color("green")).padding(.top, 4)
          Text(verbatim: round).font(t.font(14)).foregroundStyle(t.color("t1")).fixedSize(horizontal: false, vertical: true)
        }
      }
      let missing = node.strings("missing")
      if !missing.isEmpty { Caption(text: (["부족한 키워드"] + missing).joined(separator: " · ")) }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  private func bars(_ rows: [(String, Double)], numbers: Bool) -> some View {
    VStack(spacing: 8) {
      ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
        HStack(spacing: 10) {
          Text(verbatim: row.0).font(t.font(14)).foregroundStyle(t.color("t1")).lineLimit(1).frame(width: 64, alignment: .leading)
          GeometryReader { geo in
            ZStack(alignment: .leading) {
              Capsule().fill(t.color("fill2"))
              Capsule().fill(t.color("ac")).frame(width: geo.size.width * min(max(row.1 / 10, 0), 1))
            }
          }
          .frame(height: 6)
          Text(verbatim: numbers ? String(format: "%.1f", row.1) : "").font(t.font(14, .semibold)).foregroundStyle(t.color("t1"))
            .frame(width: 28, alignment: .trailing)
        }
      }
    }
  }
}

// MARK: - PushDocument

struct PushDocumentView: View {
  let node: Node
  @Environment(\.pushTheme) private var t
  @Environment(\.pushDispatch) private var dispatch

  var body: some View {
    let documentId = node.string(for: "documentId")
    let status = node.string(for: "status") ?? "done"
    VStack(alignment: .leading, spacing: 10) {
      Title(text: node.string(for: "title") ?? "")
      ForEach(Array(node.strings("lines").enumerated()), id: \.offset) { _, line in
        Text(verbatim: line).font(t.font(15)).foregroundStyle(t.color("t1")).fixedSize(horizontal: false, vertical: true)
      }
      HStack(spacing: 12) {
        Image(systemName: "doc.text").font(.system(size: 18)).foregroundStyle(t.color("acText"))
          .frame(width: 40, height: 40).background(t.color("acSoft"), in: RoundedRectangle(cornerRadius: 10))
        VStack(alignment: .leading, spacing: 0) {
          Text(verbatim: node.string(for: "name") ?? "").font(t.font(15, .semibold)).foregroundStyle(t.color("t1")).lineLimit(1).truncationMode(.tail)
          if let meta = node.string(for: "meta"), !meta.isEmpty { Caption(text: meta) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        if node.bool(for: "share") == true, let documentId {
          Button { dispatch("share", ["documentId": documentId], from: node.id) } label: {
            Image(systemName: "square.and.arrow.up").font(.system(size: 18)).foregroundStyle(t.color("t2")).frame(width: 36, height: 36)
          }
          .buttonStyle(.plain)
          .accessibilityLabel("공유하기")
        }
      }
      .padding(12)
      .background(t.color("card"), in: RoundedRectangle(cornerRadius: t.r("sm", 12)))
      .contentShape(Rectangle())
      .onTapGesture { if let documentId { dispatch("open_review", ["documentId": documentId], from: node.id) } }
      if status != "writing" {
        VStack(spacing: 8) {
          ForEach(Array(node.list("actions").enumerated()), id: \.offset) { i, action in
            PushButton(label: action.str("label") ?? "", primary: i == 0) {
              var context: [String: Any] = ["id": action.str("id") ?? ""]
              if let method = action.str("method") { context["method"] = method }
              if let path = action.str("path") { context["path"] = path }
              dispatch("result_action", context, from: node.id)
            }
          }
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

// MARK: - PushJobCard

struct PushJobCardView: View {
  let node: Node
  @Environment(\.pushTheme) private var t
  @Environment(\.pushDispatch) private var dispatch

  var body: some View {
    let company = node.string(for: "company") ?? ""
    VStack(alignment: .leading, spacing: 2) {
      ZStack(alignment: .bottomTrailing) {
        photo(company).frame(width: 169, height: 115).clipShape(RoundedRectangle(cornerRadius: t.r("md", 16)))
        let on = node.bool(for: "bookmarked") == true
        Image(systemName: on ? "bookmark.fill" : "bookmark").font(.system(size: 14, weight: .semibold))
          .foregroundStyle(on ? t.color("acText") : Color(red: 0.086, green: 0.098, blue: 0.114))
          .frame(width: 30, height: 30).background(Color.white.opacity(0.86), in: Circle()).padding(8)
      }
      .padding(.bottom, 6)
      Text(verbatim: company).font(t.font(13, .semibold)).foregroundStyle(t.color("t3"))
      Text(verbatim: node.string(for: "title") ?? "").font(t.font(16, .bold)).foregroundStyle(t.color("t1")).lineLimit(1)
      if let meta = node.string(for: "meta") { Text(verbatim: meta).font(t.font(12)).foregroundStyle(t.color("t3")) }
    }
    .frame(width: 169, alignment: .leading)
    .contentShape(Rectangle())
    .onTapGesture {
      if let id = node.string(for: "postingId") { dispatch("open_posting", ["postingId": id], from: node.id) }
    }
  }

  @ViewBuilder private func photo(_ company: String) -> some View {
    let placeholder = ZStack {
      LinearGradient(colors: [t.color("ac"), t.color("ac").opacity(0.55)], startPoint: .topLeading, endPoint: .bottomTrailing)
      Text(verbatim: String(company.prefix(1))).font(t.font(44, .heavy)).foregroundStyle(Color.white.opacity(0.92))
    }
    if let url = node.string(for: "imageUrl").flatMap(URL.init(string:)) {
      AsyncImage(url: url) { $0.resizable().scaledToFill() } placeholder: { placeholder }
    } else {
      placeholder
    }
  }
}
