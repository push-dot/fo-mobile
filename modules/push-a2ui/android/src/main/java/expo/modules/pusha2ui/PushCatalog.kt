package expo.modules.pusha2ui

import android.content.Context
import androidx.a2ui.compose.runtime.A2uiComponentProperties
import androidx.a2ui.compose.runtime.A2uiComponentReference
import androidx.a2ui.compose.runtime.A2uiComponentScope
import androidx.a2ui.compose.runtime.A2uiProperty
import androidx.a2ui.compose.ui.A2uiCatalog
import androidx.a2ui.compose.ui.A2uiComponent
import androidx.a2ui.compose.ui.catalog.A2uiBasicCatalogV1
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LocalMinimumInteractiveComponentSize
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.a2ui.catalog.A2uiAudioPlayerRenderer
import androidx.compose.material3.a2ui.catalog.A2uiImageRenderer
import androidx.compose.material3.a2ui.catalog.A2uiVideoRenderer
import androidx.compose.material3.a2ui.catalog.materialA2uiBasicCatalogV1
import androidx.compose.material3.a2ui.catalog.MaterialA2uiBasicCatalogV1Defaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

const val PUSH_CATALOG_ID = "https://push.app/a2ui/catalogs/push/v1/catalog.json"

// The Push components, drawn to the design system's Android (Material 3) previews. Props follow the vendored
// catalog/push-catalog.json; a JS test checks that every prop there is declared here. Copy that is not in a
// prop ("1/N", "다음", "추천", "변경", "전체 보기", "항목별 점수 보기", "ULTRA로 업그레이드", "할 일") is the catalog's.

private const val ANSWERED_ALPHA = 0.45f

/** The Push catalog: the Material 3 basic catalog with a plain `Text` and a non-lazy `List`, plus the Push components, under one ID. */
fun pushCatalog(context: Context): A2uiCatalog {
  // shortcut: media renderers draw nothing; no Push surface sends Image, Video or AudioPlayer. Wire expo-image when one does.
  val basic = materialA2uiBasicCatalogV1(
    image = MaterialA2uiBasicCatalogV1Defaults.image(A2uiImageRenderer { _, _, _, modifier, _ -> Box(modifier.size(0.dp)) }),
    video = MaterialA2uiBasicCatalogV1Defaults.video(A2uiVideoRenderer { _, modifier, _ -> Box(modifier.size(0.dp)) }),
    audioPlayer = MaterialA2uiBasicCatalogV1Defaults.audioPlayer(A2uiAudioPlayerRenderer { _, _, modifier, _ -> Box(modifier.size(0.dp)) }),
    functions = A2uiBasicCatalogV1.Functions(context),
    text = PushText,
    list = PushList,
  )
  return A2uiCatalog(
    catalogId = PUSH_CATALOG_ID,
    components = basic.components + listOf(PushChoice, PushTodo, PushDiff, PushPlan, PushFit, PushDocument, PushJobCard),
    functions = basic.functions,
    themeSchema = basic.themeSchema,
  )
}

// MARK: plain values

private fun Any?.map(): Map<String, Any?> = (this as? Map<*, *>)?.entries?.associate { it.key.toString() to it.value }.orEmpty()
private fun Any?.maps(): List<Map<String, Any?>> = (this as? List<*>)?.map { it.map() }.orEmpty()
private fun Any?.strings(): List<String> = (this as? List<*>)?.mapNotNull { it as? String }.orEmpty()
private fun Map<String, Any?>.str(key: String) = this[key] as? String
private fun Map<String, Any?>.flag(key: String) = this[key] as? Boolean ?: false

private fun A2uiComponentScope.send(name: String, context: Map<String, Any?>) =
  dispatchAction(mapOf("event" to mapOf("name" to name, "context" to context)))

// MARK: shared pieces

@Composable
private fun Title(text: String) {
  val t = LocalPushTheme.current
  Text(text, style = t.text(17, 24, 700), color = t.color("t1"))
}

@Composable
private fun Caption(text: String) {
  val t = LocalPushTheme.current
  Text(text, style = t.text(13, 18), color = t.color("t2"))
}

@Composable
private fun PushButton(label: String, primary: Boolean, enabled: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
  val t = LocalPushTheme.current
  val bg = if (primary) t.color("ac") else t.color("fill2")
  val fg = if (primary) t.color("onFill") else t.color("t1")
  Button(
    onClick = onClick,
    enabled = enabled,
    modifier = modifier.heightIn(min = 40.dp),
    shape = RoundedCornerShape(t.r("pill", 999.dp)),
    colors = ButtonDefaults.buttonColors(containerColor = bg, contentColor = fg, disabledContainerColor = bg, disabledContentColor = fg),
    contentPadding = PaddingValues(horizontal = 16.dp),
  ) {
    Text(label, style = t.text(14, 20, 600), maxLines = 1, overflow = TextOverflow.Ellipsis)
  }
}

@Composable
private fun PushLink(label: String, onClick: () -> Unit) {
  val t = LocalPushTheme.current
  Text(label, style = t.text(14, 20, 600), color = t.color("acText"), modifier = Modifier.clickable(role = Role.Button, onClick = onClick))
}

// MARK: Text and List

/** The basic `Text` schema drawn with the Push type scale: headings in h3, captions in c1, body in b2 t2. Plain text. */
object PushText : A2uiBasicCatalogV1.Text {
  @Composable
  override fun A2uiComponentScope.TypedContent(
    text: String,
    variant: A2uiBasicCatalogV1.Text.Variant,
    accessibility: A2uiBasicCatalogV1.AccessibilityAttributes?,
    modifier: Modifier,
  ) {
    val t = LocalPushTheme.current
    when (variant) {
      A2uiBasicCatalogV1.Text.Variant.Caption -> Text(text, modifier, style = t.text(13, 18), color = t.color("t2"))
      A2uiBasicCatalogV1.Text.Variant.Body -> Text(text, modifier, style = t.text(15, 22), color = t.color("t2"))
      else -> Text(text, modifier, style = t.text(17, 24, 700), color = t.color("t1"))
    }
  }
}

/**
 * The Material `List` is a `LazyColumn`, which throws when `Host matchContents` measures it with an
 * unbounded height. A chat card never scrolls inside itself, so lay the items out with the Material
 * `Column` / `Row` instead.
 */
object PushList : A2uiBasicCatalogV1.List {
  @Composable
  override fun A2uiComponentScope.TypedContent(
    children: List<A2uiComponentReference>,
    direction: A2uiBasicCatalogV1.List.Direction,
    align: A2uiBasicCatalogV1.List.Align,
    accessibility: A2uiBasicCatalogV1.AccessibilityAttributes?,
    modifier: Modifier,
  ) {
    if (direction == A2uiBasicCatalogV1.List.Direction.Horizontal) {
      with(MaterialA2uiBasicCatalogV1Defaults.row) {
        TypedContent(children, A2uiBasicCatalogV1.Row.Justify.Start, A2uiBasicCatalogV1.Row.Align.fromValue(align.value), accessibility, modifier)
      }
    } else {
      with(MaterialA2uiBasicCatalogV1Defaults.column) {
        TypedContent(children, A2uiBasicCatalogV1.Column.Justify.Start, A2uiBasicCatalogV1.Column.Align.fromValue(align.value), accessibility, modifier)
      }
    }
  }
}

// MARK: PushChoice

object PushChoice : A2uiComponent {
  private val Form = A2uiProperty.string(key = "form")
  private val Questions = A2uiProperty.anyList(key = "questions", required = true)
  private val Answer = A2uiProperty.string(key = "answer", required = true)
  private val Submit = A2uiProperty.any(key = "submit")
  private val Secondary = A2uiProperty.any(key = "secondary")
  private val Open = A2uiProperty.dynamicBoolean(key = "open", required = true)
  private val Picked = A2uiProperty.dynamicStringList(key = "picked", required = true)
  private val Selected = A2uiProperty.dynamicValue(key = "selected")

  override val name = "PushChoice"
  override val description = "The Bot asks and the person picks; answering dispatches `answer`."
  override val properties = listOf(Form, Questions, Answer, Submit, Secondary, Open, Picked, Selected)

  private class Choice(val id: String, val label: String, val desc: String?, val recommended: Boolean, val change: Boolean)
  private class Question(val id: String, val title: String?, val detail: String?, val multiple: Boolean, val answerable: Boolean, val choices: List<Choice>)

  @Composable
  override fun A2uiComponentScope.Content(properties: A2uiComponentProperties, modifier: Modifier) {
    val t = LocalPushTheme.current
    val interactive = LocalPushInteractive.current
    val questions = properties[Questions].maps().map { q ->
      Question(
        id = q.str("id").orEmpty(),
        title = q.str("title"),
        detail = q.str("detail"),
        multiple = q.flag("multiple"),
        answerable = q["answerable"] as? Boolean ?: true,
        choices = q["choices"].maps().map { Choice(it.str("id").orEmpty(), it.str("label").orEmpty(), it.str("desc"), it.flag("recommended"), it.flag("change")) },
      )
    }
    val open = properties.bind(Open) ?: false
    val picked = properties.bind(Picked).orEmpty()
    val bound = properties.bind(Selected).map().mapValues { it.value.strings() }
    val writeSelected = properties.bindUpdater(Selected)
    var local by remember { mutableStateOf<Map<String, List<String>>?>(null) }
    val selected = local ?: bound
    val submit = properties[Submit].map().takeIf { properties[Submit] != null }
    val secondary = properties[Secondary].map().takeIf { properties[Secondary] != null }
    val isSubmit = properties[Answer] == "submit"
    var step by remember { mutableIntStateOf(0) }
    val live = open && interactive

    fun emit(context: Map<String, Any?>) {
      if (live) send("answer", context)
    }
    fun pick(ids: List<String>) {
      val first = ids.firstOrNull() ?: return
      emit(if (ids.size > 1) mapOf("optionId" to first, "optionIds" to ids) else mapOf("optionId" to first))
    }
    fun answerIds() = questions.filter { it.answerable }.flatMap { q -> q.choices.map { it.id }.filter { (selected[q.id] ?: emptyList()).contains(it) } }
    fun tap(q: Question, c: Choice) {
      if (!live || !q.answerable || c.change) return
      if (!q.multiple && submit == null && questions.size == 1) return pick(listOf(c.id))
      val ids = selected[q.id].orEmpty()
      val next = if (q.multiple) q.choices.map { it.id }.filter { if (it == c.id) !ids.contains(it) else ids.contains(it) } else listOf(c.id)
      val all = selected + (q.id to next)
      if (writeSelected != null) writeSelected(all) else local = all
    }

    @Composable
    fun row(q: Question, c: Choice) {
      val on = if (open) selected[q.id].orEmpty().contains(c.id) else picked.contains(c.id)
      Row(
        Modifier.fillMaxWidth()
          .heightIn(min = 52.dp)
          .alpha(if (!open && !on) ANSWERED_ALPHA else 1f)
          .clickable(enabled = live && q.answerable && !c.change, role = if (q.multiple) Role.Checkbox else Role.RadioButton) { tap(q, c) }
          .padding(horizontal = 4.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
      ) {
        if (q.answerable && !c.change) {
          CompositionLocalProvider(LocalMinimumInteractiveComponentSize provides 0.dp) {
            if (q.multiple) {
              Checkbox(checked = on, onCheckedChange = null, colors = CheckboxDefaults.colors(checkedColor = t.color("ac"), uncheckedColor = t.color("t2"), checkmarkColor = t.color("onFill")))
            } else {
              RadioButton(selected = on, onClick = null, colors = RadioButtonDefaults.colors(selectedColor = t.color("ac"), unselectedColor = t.color("t2")))
            }
          }
        }
        Column(Modifier.weight(1f)) {
          Text(c.label, style = t.text(16, 22, 600), color = t.color("t1"))
          c.desc?.let { Text(it, style = t.text(13, 18), color = t.color("t2")) }
        }
        if (c.recommended) {
          Text("추천", style = t.text(12, 16, 700), color = t.color("onFill"), modifier = Modifier.background(t.color("ac"), RoundedCornerShape(t.r("xs", 6.dp))).padding(horizontal = 6.dp, vertical = 2.dp))
        }
        if (c.change) PushLink("변경") { if (open && interactive) send("change", mapOf("optionId" to c.id)) }
      }
    }

    @Composable
    fun question(q: Question) {
      q.title?.let { Title(it) }
      q.detail?.let { Text(it, style = t.text(15, 22), color = t.color("t2")) }
      Column { q.choices.forEach { row(q, it) } }
    }

    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
      val first = questions.firstOrNull()
      if (properties[Form] == "buttons" && first != null) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
          first.choices.take(2).forEachIndexed { i, c ->
            PushButton(c.label, primary = i == 1, enabled = live, modifier = Modifier.weight(1f).alpha(if (!open && !picked.contains(c.id)) ANSWERED_ALPHA else 1f)) { pick(listOf(c.id)) }
          }
        }
      } else if (!open) {
        questions.forEach { question(it) }
      } else if (questions.isNotEmpty()) {
        val at = step.coerceIn(0, questions.lastIndex)
        val q = questions[at]
        if (questions.size > 1) Caption("${at + 1}/${questions.size}")
        question(q)
        if (at < questions.lastIndex) {
          PushButton("다음", primary = true, enabled = live, modifier = Modifier.fillMaxWidth()) { step = at + 1 }
        } else if (submit != null || q.multiple || secondary != null) {
          Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            secondary?.str("id")?.let { id -> PushButton(secondary.str("label").orEmpty(), primary = false, enabled = live, modifier = Modifier.weight(1f)) { pick(listOf(id)) } }
            if (submit != null || q.multiple) {
              val labels = submit?.get("labels").map()
              val label = questions.filter { !it.multiple }.firstNotNullOfOrNull { qq -> selected[qq.id]?.firstOrNull()?.let { labels[it] as? String } } ?: submit?.str("label").orEmpty()
              PushButton(label, primary = true, enabled = live && (isSubmit || answerIds().isNotEmpty()), modifier = Modifier.weight(1f)) {
                if (isSubmit) emit(mapOf("optionId" to "submit", "optionIds" to listOf("submit") + answerIds())) else pick(answerIds())
              }
            }
          }
        }
      }
    }
  }
}

// MARK: PushTodo

object PushTodo : A2uiComponent {
  private val Items = A2uiProperty.dynamicValue(key = "items", required = true)

  override val name = "PushTodo"
  override val description = "The Bot's checklist for the current job. Never interactive."
  override val properties = listOf(Items)

  @Composable
  override fun A2uiComponentScope.Content(properties: A2uiComponentProperties, modifier: Modifier) {
    val t = LocalPushTheme.current
    val blink by rememberInfiniteTransition(label = "todo").animateFloat(1f, 0.35f, infiniteRepeatable(tween(500), RepeatMode.Reverse), label = "running")
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
      Title("할 일")
      properties.bind(Items).maps().forEachIndexed { i, item ->
        val state = item.str("state") ?: "waiting"
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
          val shape = RoundedCornerShape(4.dp)
          Box(Modifier.size(18.dp), contentAlignment = Alignment.Center) {
            when (state) {
              "done" -> {
                Box(Modifier.matchParentSize().background(t.color("green"), shape))
                PushIcon(PushIcons.CHECK, t.color("bg"), 11.dp, strokeWidth = 3f)
              }
              "running" -> {
                Box(Modifier.matchParentSize().alpha(blink).background(t.color("ac"), shape))
                Box(Modifier.size(6.dp).background(Color.White, CircleShape))
              }
              else -> {
                Box(Modifier.matchParentSize().background(t.color("fill2"), shape))
                Text("${i + 1}", style = t.text(11, 11, 700), color = t.color("t2"))
              }
            }
          }
          Text(
            item.str("text").orEmpty(),
            style = t.text(15, 22, if (state == "running") 600 else 400),
            color = if (state == "done") t.color("t2") else t.color("t1"),
            textDecoration = if (state == "done") TextDecoration.LineThrough else null,
          )
        }
      }
    }
  }
}

// MARK: PushDiff

object PushDiff : A2uiComponent {
  private val Caption_ = A2uiProperty.string(key = "caption")
  private val TitleProp = A2uiProperty.string(key = "title", required = true)
  private val Lines = A2uiProperty.anyList(key = "lines", required = true)
  private val DocumentId = A2uiProperty.string(key = "documentId")

  override val name = "PushDiff"
  override val description = "What the Bot changed in a 서류, line by line."
  override val properties = listOf(Caption_, TitleProp, Lines, DocumentId)

  @Composable
  override fun A2uiComponentScope.Content(properties: A2uiComponentProperties, modifier: Modifier) {
    val t = LocalPushTheme.current
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
      properties[Caption_]?.let { Caption(it) }
      properties[TitleProp]?.let { Title(it) }
      Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(t.r("sm", 12.dp)))) {
        properties[Lines].maps().forEach { line ->
          val sign = line.str("sign").orEmpty()
          val bg = when (sign) { "+" -> t.color("greenSoft"); "-" -> t.color("redSoft"); else -> Color.Transparent }
          val fg = if (sign == "+") t.color("t1") else t.color("t2")
          Row(Modifier.fillMaxWidth().background(bg).padding(horizontal = 10.dp, vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(if (sign == "-") "−" else sign, style = t.text(14, 20, 700), color = fg, modifier = Modifier.width(10.dp))
            Text(line.str("text").orEmpty(), style = t.text(14, 20), color = fg, textDecoration = if (sign == "-") TextDecoration.LineThrough else null)
          }
        }
      }
      properties[DocumentId]?.let { id -> PushLink("전체 보기") { send("open_review", mapOf("documentId" to id)) } }
    }
  }
}

// MARK: PushPlan

object PushPlan : A2uiComponent {
  private val Caption_ = A2uiProperty.string(key = "caption")
  private val TitleProp = A2uiProperty.string(key = "title", required = true)
  private val Rows = A2uiProperty.anyList(key = "rows", required = true)
  private val Keywords = A2uiProperty.stringList(key = "keywords")

  override val name = "PushPlan"
  override val description = "The Bot's plan, feedback or outline."
  override val properties = listOf(Caption_, TitleProp, Rows, Keywords)

  @OptIn(ExperimentalLayoutApi::class)
  @Composable
  override fun A2uiComponentScope.Content(properties: A2uiComponentProperties, modifier: Modifier) {
    val t = LocalPushTheme.current
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
      properties[Caption_]?.let { Caption(it) }
      properties[TitleProp]?.let { Title(it) }
      Column {
        properties[Rows].maps().forEachIndexed { i, row ->
          if (i > 0) HorizontalDivider(thickness = 1.dp, color = t.color("line"))
          Row(Modifier.padding(top = if (i > 0) 10.dp else 0.dp, bottom = 10.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            val tone = when (row.str("tone")) { "green" -> t.color("greenSoft"); "orange" -> t.color("orangeSoft"); else -> t.color("acSoft") }
            Text(row.str("tag").orEmpty(), style = t.text(12, 16, 700), color = t.color("t1"), modifier = Modifier.background(tone, RoundedCornerShape(t.r("xs", 6.dp))).padding(horizontal = 7.dp, vertical = 3.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
              Text(row.str("label").orEmpty(), style = t.text(15, 22, 600), color = t.color("t1"))
              row.str("note")?.takeIf { it.isNotEmpty() }?.let { Caption(it) }
            }
          }
        }
      }
      val keywords = properties[Keywords].orEmpty()
      if (keywords.isNotEmpty()) {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
          keywords.forEach { Text(it, style = t.text(13, 18), color = t.color("t1"), modifier = Modifier.background(t.color("fill2"), RoundedCornerShape(t.r("pill", 999.dp))).padding(horizontal = 10.dp, vertical = 4.dp)) }
        }
      }
    }
  }
}

// MARK: PushFit

object PushFit : A2uiComponent {
  private val Score = A2uiProperty.string(key = "score", required = true)
  private val Sentence = A2uiProperty.string(key = "sentence", required = true)
  private val Summary = A2uiProperty.string(key = "summary")
  private val Items = A2uiProperty.anyList(key = "items")
  private val Missing = A2uiProperty.stringList(key = "missing")
  private val Rounds = A2uiProperty.stringList(key = "rounds")
  private val Locked = A2uiProperty.boolean(key = "locked")

  override val name = "PushFit"
  override val description = "How well a 서류 fits a 공고."
  override val properties = listOf(Score, Sentence, Summary, Items, Missing, Rounds, Locked)

  /** Shown when locked: example rows, never the person's real ones. */
  private val examples = listOf("기술 스택" to 8.0, "경력" to 6.5, "도메인" to 5.0)

  @Composable
  override fun A2uiComponentScope.Content(properties: A2uiComponentProperties, modifier: Modifier) {
    val t = LocalPushTheme.current
    var showItems by remember { mutableStateOf(false) }
    val items = properties[Items].maps().map { it.str("label").orEmpty() to ((it["score"] as? Number)?.toDouble() ?: 0.0) }
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
      Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Bottom) {
        Text(properties[Score].orEmpty(), style = t.text(26, 36, 800), color = t.color("t1"), modifier = Modifier.alignByBaseline())
        Text(properties[Sentence].orEmpty(), style = t.text(15, 22), color = t.color("t2"), modifier = Modifier.alignByBaseline())
      }
      properties[Summary]?.let { Text(it, style = t.text(15, 22), color = t.color("t2")) }
      if (properties[Locked] == true) {
        Box(Modifier.alpha(ANSWERED_ALPHA)) { Bars(examples, numbers = false) }
        PushButton("ULTRA로 업그레이드", primary = true, enabled = true, modifier = Modifier.fillMaxWidth()) { send("open_plan", emptyMap()) }
      } else if (items.isNotEmpty()) {
        if (showItems) Bars(items, numbers = true)
        PushLink(if (showItems) "항목별 점수 접기" else "항목별 점수 보기") { showItems = !showItems }
      }
      properties[Rounds].orEmpty().forEach { round ->
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
          PushIcon(PushIcons.CHECK, t.color("green"), 14.dp, strokeWidth = 3f, modifier = Modifier.padding(top = 3.dp))
          Text(round, style = t.text(14, 20), color = t.color("t1"))
        }
      }
      val missing = properties[Missing].orEmpty()
      if (missing.isNotEmpty()) Caption((listOf("부족한 키워드") + missing).joinToString(" · "))
    }
  }

  @Composable
  private fun Bars(rows: List<Pair<String, Double>>, numbers: Boolean) {
    val t = LocalPushTheme.current
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      rows.forEach { (label, score) ->
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
          Text(label, style = t.text(14, 20), color = t.color("t1"), maxLines = 1, modifier = Modifier.width(64.dp))
          Box(Modifier.weight(1f).height(6.dp).clip(RoundedCornerShape(3.dp)).background(t.color("fill2"))) {
            Box(Modifier.fillMaxHeight().fillMaxWidth((score / 10).coerceIn(0.0, 1.0).toFloat()).background(t.color("ac"), RoundedCornerShape(3.dp)))
          }
          Text(if (numbers) "%.1f".format(score) else "", style = t.text(14, 20, 600), color = t.color("t1"), modifier = Modifier.width(28.dp))
        }
      }
    }
  }
}

// MARK: PushDocument

object PushDocument : A2uiComponent {
  private val Status = A2uiProperty.string(key = "status", required = true)
  private val TitleProp = A2uiProperty.string(key = "title", required = true)
  private val Name = A2uiProperty.string(key = "name", required = true)
  private val Meta = A2uiProperty.string(key = "meta")
  private val Lines = A2uiProperty.stringList(key = "lines")
  private val DocumentId = A2uiProperty.string(key = "documentId")
  private val Share = A2uiProperty.boolean(key = "share")
  private val Actions = A2uiProperty.anyList(key = "actions")

  override val name = "PushDocument"
  override val description = "The 서류 the Bot made or is drafting, with what can be done next."
  override val properties = listOf(Status, TitleProp, Name, Meta, Lines, DocumentId, Share, Actions)

  @Composable
  override fun A2uiComponentScope.Content(properties: A2uiComponentProperties, modifier: Modifier) {
    val t = LocalPushTheme.current
    val documentId = properties[DocumentId]
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
      Title(properties[TitleProp].orEmpty())
      properties[Lines].orEmpty().forEach { Text(it, style = t.text(15, 22), color = t.color("t1")) }
      Row(
        Modifier.fillMaxWidth()
          .clip(RoundedCornerShape(t.r("sm", 12.dp)))
          .background(t.color("card"))
          .clickable(enabled = documentId != null) { documentId?.let { send("open_review", mapOf("documentId" to it)) } }
          .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
      ) {
        Box(Modifier.size(40.dp).background(t.color("acSoft"), RoundedCornerShape(10.dp)), contentAlignment = Alignment.Center) {
          PushIcon(PushIcons.DOC, t.color("acText"), 20.dp)
        }
        Column(Modifier.weight(1f)) {
          Text(properties[Name].orEmpty(), style = t.text(15, 22, 600), color = t.color("t1"), maxLines = 1, overflow = TextOverflow.Ellipsis)
          properties[Meta]?.takeIf { it.isNotEmpty() }?.let { Caption(it) }
        }
        if (properties[Share] == true && documentId != null) {
          Box(Modifier.size(36.dp).clip(CircleShape).clickable(role = Role.Button) { send("share", mapOf("documentId" to documentId)) }, contentAlignment = Alignment.Center) {
            PushIcon(PushIcons.SHARE, t.color("t2"), 20.dp)
          }
        }
      }
      if (properties[Status] != "writing") {
        properties[Actions].maps().forEachIndexed { i, action ->
          PushButton(action.str("label").orEmpty(), primary = i == 0, enabled = true, modifier = Modifier.fillMaxWidth()) {
            send("result_action", buildMap {
              put("id", action.str("id").orEmpty())
              action.str("method")?.let { put("method", it) }
              action.str("path")?.let { put("path", it) }
            })
          }
        }
      }
    }
  }
}

// MARK: PushJobCard

object PushJobCard : A2uiComponent {
  private val PostingId = A2uiProperty.string(key = "postingId", required = true)
  private val Company = A2uiProperty.string(key = "company", required = true)
  private val TitleProp = A2uiProperty.string(key = "title", required = true)
  private val Meta = A2uiProperty.string(key = "meta")
  private val ImageUrl = A2uiProperty.string(key = "imageUrl")
  private val Bookmarked = A2uiProperty.dynamicBoolean(key = "bookmarked")

  override val name = "PushJobCard"
  override val description = "One job posting (design system JobCard, 169px grid version)."
  override val properties = listOf(PostingId, Company, TitleProp, Meta, ImageUrl, Bookmarked)

  @Composable
  override fun A2uiComponentScope.Content(properties: A2uiComponentProperties, modifier: Modifier) {
    val t = LocalPushTheme.current
    val company = properties[Company].orEmpty()
    val on = properties.bind(Bookmarked) == true
    Column(modifier.width(169.dp).clickable { properties[PostingId]?.let { send("open_posting", mapOf("postingId" to it)) } }, verticalArrangement = Arrangement.spacedBy(2.dp)) {
      // shortcut: always the placeholder; the module has no image loader. Draw imageUrl with one when a server card sends PushJobCard.
      Box(
        Modifier.size(169.dp, 115.dp).clip(RoundedCornerShape(t.r("md", 16.dp))).background(Brush.linearGradient(listOf(t.color("ac"), t.color("ac").copy(alpha = 0.55f)))),
        contentAlignment = Alignment.Center,
      ) {
        Text(company.take(1), style = t.text(44, 52, 800), color = Color.White.copy(alpha = 0.92f))
        Box(Modifier.align(Alignment.BottomEnd).padding(8.dp).size(30.dp).background(Color.White.copy(alpha = 0.86f), CircleShape), contentAlignment = Alignment.Center) {
          PushIcon(PushIcons.BOOKMARK, if (on) t.color("acText") else Color(0xFF16191D), 16.dp, strokeWidth = 2.2f, filled = on)
        }
      }
      Spacer(Modifier.height(6.dp))
      Text(company, style = t.text(13, 18, 600), color = t.color("t3"))
      Text(properties[TitleProp].orEmpty(), style = t.text(16, 24, 700), color = t.color("t1"), maxLines = 1, overflow = TextOverflow.Ellipsis)
      properties[Meta]?.let { Text(it, style = t.text(12, 16), color = t.color("t3")) }
    }
  }
}
