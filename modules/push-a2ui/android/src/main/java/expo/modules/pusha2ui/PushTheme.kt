package expo.modules.pusha2ui

import android.content.Context
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import org.json.JSONObject

/**
 * Design tokens the app injects as JSON (`theme` prop): colours for the current scheme, font names by weight, radii.
 * The server sends no theme; JS follows the app's light/dark choice and resends this when it changes.
 */
class PushTheme(
  private val colors: Map<String, Color> = emptyMap(),
  private val fonts: Map<Int, FontFamily> = emptyMap(),
  private val radius: Map<String, Dp> = emptyMap(),
) {
  /** JS sends every token this reads (a2ui-surface.tsx checks in development); a missing one falls back to the app's t1. */
  fun color(name: String): Color = colors[name] ?: colors["t1"] ?: Color.Unspecified
  fun r(name: String, fallback: Dp): Dp = radius[name] ?: fallback

  /** Noto Sans KR: one file per weight, so the weight picks the family and the style stays at its normal weight. */
  fun text(size: Int, lineHeight: Int, weight: Int = 400): TextStyle {
    val family = fonts[weight]
    return TextStyle(
      fontFamily = family,
      fontWeight = if (family == null) FontWeight(weight) else null,
      fontSize = size.sp,
      lineHeight = lineHeight.sp,
      letterSpacing = (-0.02).em,
    )
  }

  companion object {
    private var cached: Pair<String, PushTheme>? = null

    fun parse(context: Context, json: String?): PushTheme {
      if (json.isNullOrEmpty()) return PushTheme()
      cached?.let { (key, theme) -> if (key == json) return theme }
      val root = runCatching { JSONObject(json) }.getOrNull() ?: return PushTheme()
      val colors = root.optJSONObject("colors")?.let { o -> o.keys().asSequence().mapNotNull { k -> parseColor(o.getString(k))?.let { k to it } }.toMap() }.orEmpty()
      val fonts = root.optJSONObject("fonts")?.let { o -> o.keys().asSequence().mapNotNull { k -> loadFont(context, o.getString(k))?.let { k.toInt() to it } }.toMap() }.orEmpty()
      val radius = root.optJSONObject("radius")?.let { o -> o.keys().asSequence().map { k -> k to o.getDouble(k).toFloat().dp }.toMap() }.orEmpty()
      return PushTheme(colors, fonts, radius).also { cached = json to it }
    }

    /** `#RRGGBB`, `#RRGGBBAA` or `rgba(r,g,b,a)` as the design tokens write them. */
    fun parseColor(raw: String): Color? {
      val s = raw.trim()
      if (s.startsWith("#")) {
        val hex = s.drop(1)
        val v = hex.toLongOrNull(16) ?: return null
        return when (hex.length) {
          6 -> Color(0xFF000000 or v)
          8 -> Color(((v and 0xFF) shl 24) or (v ushr 8))
          else -> null
        }
      }
      val parts = s.substringAfter('(', "").substringBefore(')').split(',').mapNotNull { it.trim().toFloatOrNull() }
      if (parts.size < 3) return null
      return Color(parts[0] / 255f, parts[1] / 255f, parts[2] / 255f, parts.getOrElse(3) { 1f })
    }

    private fun loadFont(context: Context, name: String): FontFamily? {
      if (context.assets.list("fonts")?.contains("$name.ttf") == true) return FontFamily(Font("fonts/$name.ttf", context.assets))
      val id = context.resources.getIdentifier(name.lowercase().replace('-', '_'), "font", context.packageName)
      return if (id != 0) FontFamily(Font(id)) else null
    }
  }
}

val LocalPushTheme = compositionLocalOf { PushTheme() }

/** False on every surface but the newest waiting one: its PushChoice does not respond. */
val LocalPushInteractive = compositionLocalOf { false }

/** A 24×24 line icon from the design system's SVG path (2px stroke, round caps), or filled. */
@Composable
fun PushIcon(path: String, color: Color, size: Dp, strokeWidth: Float = 2f, filled: Boolean = false, modifier: Modifier = Modifier) {
  val shape = remember(path) { PathParser().parsePathString(path).toPath() }
  Canvas(modifier.size(size)) {
    scale(this.size.width / 24f, pivot = androidx.compose.ui.geometry.Offset.Zero) {
      if (filled) drawPath(shape, color, style = Fill)
      drawPath(shape, color, style = Stroke(width = strokeWidth, cap = StrokeCap.Round, join = StrokeJoin.Round))
    }
  }
}

object PushIcons {
  const val CHECK = "M5 12.5l4.5 4.5L19 7.5"
  const val DOC = "M7 3.5h7l4 4v13H7ZM14 3.5v4h4"
  const val SHARE = "M12 15V4M8 8l4-4 4 4M5 12v7h14v-7"
  const val BOOKMARK = "M6.5 3.5h11v17L12 16.5l-5.5 4Z"
}
