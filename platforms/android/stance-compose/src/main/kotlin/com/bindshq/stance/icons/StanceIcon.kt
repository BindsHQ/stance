package com.bindshq.stance.icons

import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.foundation.layout.size
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.bindshq.stance.theme.StanceSizes

private const val GRID = 24f
private const val STROKE_WIDTH = 1.75f

/**
 * Icons that point along the reading direction. They flip in right to left layouts,
 * so "back" still points to where the previous screen is.
 */
private val MIRRORED_IN_RTL = setOf(
    "chevron-left", "chevron-right", "chevrons-left", "chevrons-right",
    "arrow-left", "arrow-right", "arrow-up-right", "external-link",
    "log-out", "send", "panel-left", "list",
)

/**
 * Builds a stroked 24dp vector from SVG path data. Used by the generated [StanceIcons].
 * Directional icons are auto mirrored in right to left layouts.
 */
internal fun stanceIcon(name: String, vararg paths: String): ImageVector =
    ImageVector.Builder(
        name = "Stance.$name",
        defaultWidth = GRID.dp,
        defaultHeight = GRID.dp,
        viewportWidth = GRID,
        viewportHeight = GRID,
        autoMirror = name in MIRRORED_IN_RTL,
    ).apply {
        for (path in paths) {
            addPath(
                pathData = addPathNodes(path),
                stroke = SolidColor(Color.Black),
                strokeLineWidth = STROKE_WIDTH,
                strokeLineCap = StrokeCap.Round,
                strokeLineJoin = StrokeJoin.Round,
            )
        }
    }.build()

/**
 * Draws a Stance icon tinted with the current content colour. Chevrons, horizontal arrows and
 * other directional icons mirror in right to left layouts.
 *
 * @param contentDescription Text for screen readers. Pass `null` when the icon is decorative,
 * which is correct when it sits beside a visible label.
 */
@Composable
public fun StanceIcon(
    icon: ImageVector,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    size: Dp = StanceSizes.iconMedium,
    tint: Color = LocalContentColor.current,
) {
    Icon(imageVector = icon, contentDescription = contentDescription, modifier = modifier.size(size), tint = tint)
}
