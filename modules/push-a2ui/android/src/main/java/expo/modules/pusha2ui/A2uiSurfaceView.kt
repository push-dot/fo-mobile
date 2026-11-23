package expo.modules.pusha2ui

import android.content.Context
import androidx.a2ui.compose.runtime.A2uiMessageParser
import androidx.a2ui.compose.ui.A2uiMessageProcessor
import androidx.a2ui.model.processor.processInput
import androidx.a2ui.model.protocol.A2uiClientEventMessage
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.a2ui.A2uiSurface
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

@OptimizedComposeProps
data class A2uiSurfaceViewProps(
  /** A2UI v0.9.1 agent-to-renderer messages for one surface, as JSON strings. Append-only. */
  val messages: List<String> = emptyList(),
  /** Design tokens as JSON: `{colors, fonts, radius}` for the current scheme (see `PushTheme`). */
  val theme: String? = null,
  /** False on every surface but the newest waiting one: its PushChoice does not respond. */
  val interactive: Boolean = false,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptimizedRecord
class A2uiActionEvent(@Field val message: String = "") : Record

/** Owns one processor and feeds it only the messages it has not seen yet. */
private class Feeder(context: Context) {
  val processor = A2uiMessageProcessor(catalogs = listOf(pushCatalog(context)))
  private val parser = A2uiMessageParser()
  private var fed = 0

  fun feed(messages: List<String>) {
    if (messages.size <= fed) return
    for (i in fed until messages.size) processor.processInput(parser, messages[i])
    fed = messages.size
  }
}

@Composable
fun FunctionalComposableScope.A2uiSurfaceViewContent(
  props: A2uiSurfaceViewProps,
  onAction: (A2uiActionEvent) -> Unit
) {
  val context = LocalContext.current
  val feeder = remember { Feeder(context) }
  LaunchedEffect(feeder) { feeder.processor.collectMessages() }
  LaunchedEffect(feeder) {
    feeder.processor.outboundEvents.collect { event ->
      if (event is A2uiClientEventMessage) onAction(A2uiActionEvent(event.toJson()))
    }
  }
  LaunchedEffect(feeder, props.messages) { feeder.feed(props.messages) }

  val surfaces by feeder.processor.activeSurfaces.collectAsState()
  val surface = surfaces.firstOrNull() ?: return
  val theme = remember(props.theme) { PushTheme.parse(context, props.theme) }
  CompositionLocalProvider(LocalPushTheme provides theme, LocalPushInteractive provides props.interactive) {
    A2uiSurface(
      surfaceModel = surface,
      modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
        .fillMaxWidth()
        .background(theme.color("bg2"), RoundedCornerShape(theme.r("surface", 12.dp)))
        .padding(16.dp),
    )
  }
}

private fun A2uiClientEventMessage.toJson(): String {
  val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    .apply { timeZone = TimeZone.getTimeZone("UTC") }
    .format(Date(timestamp))
  val action = JSONObject()
    .put("name", type)
    .put("surfaceId", surfaceId)
    .put("sourceComponentId", componentId)
    .put("timestamp", iso)
    .put("context", JSONObject(context))
  return JSONObject().put("version", "v0.9.1").put("action", action).toString()
}
