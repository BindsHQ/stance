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

/** Builds a stroked 24dp vector from SVG path data. Used by the generated [StanceIcons]. */
internal fun stanceIcon(name: String, vararg paths: String): ImageVector =
    ImageVector.Builder(
        name = "Stance.$name",
        defaultWidth = GRID.dp,
        defaultHeight = GRID.dp,
        viewportWidth = GRID,
        viewportHeight = GRID,
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
 * Draws a Stance icon tinted with the current content colour.
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
