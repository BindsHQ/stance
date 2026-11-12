package com.bindshq.stance.components.advanced

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.CanvasDrawScope
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonSize
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import com.bindshq.stance.tokens.StanceTokens
import androidx.compose.ui.res.stringResource
import com.bindshq.stance.R

/**
 * Holds the strokes of a [StanceSignatureCanvas]. Hoist it to read, clear, undo or export the signature.
 */
@Stable
public class StanceSignatureState {
    internal val strokes = mutableStateListOf<List<Offset>>()
    internal var current by mutableStateOf<List<Offset>>(emptyList())
    internal var size by mutableStateOf(IntSize.Zero)

    /** True when nothing has been drawn. */
    public val isEmpty: Boolean get() = strokes.isEmpty() && current.isEmpty()

    /** Number of completed strokes. */
    public val strokeCount: Int get() = strokes.size

    public fun clear() {
        strokes.clear()
        current = emptyList()
    }

    /** Removes the most recent stroke. */
    public fun undo() {
        if (strokes.isNotEmpty()) strokes.removeAt(strokes.lastIndex)
    }

    /** Adds a stroke programmatically, for example to restore a saved signature. */
    public fun addStroke(points: List<Offset>) {
        if (points.isNotEmpty()) strokes.add(points)
    }

    /** The signature as a vector path in canvas pixels. */
    public fun toPath(): Path = Path().apply {
        for (stroke in strokes) {
            if (stroke.isEmpty()) continue
            moveTo(stroke.first().x, stroke.first().y)
            if (stroke.size == 1) lineTo(stroke.first().x + 0.01f, stroke.first().y)
            for (i in 1 until stroke.size) {
                val previous = stroke[i - 1]
                val point = stroke[i]
                quadraticTo(previous.x, previous.y, (previous.x + point.x) / 2, (previous.y + point.y) / 2)
            }
        }
    }

    /**
     * Renders the signature to a bitmap with a transparent background, or null when empty.
     *
     * @param ink Stroke colour. Use a dark colour: signatures are usually placed on white documents.
     */
    public fun toImageBitmap(ink: Color, strokeWidthPx: Float, density: Density): ImageBitmap? {
        if (isEmpty || size.width == 0 || size.height == 0) return null
        val bitmap = ImageBitmap(size.width, size.height)
        val canvas = androidx.compose.ui.graphics.Canvas(bitmap)
        CanvasDrawScope().draw(density, LayoutDirection.Ltr, canvas, Size(size.width.toFloat(), size.height.toFloat())) {
            drawSignature(toPath(), ink, strokeWidthPx)
        }
        return bitmap
    }
}

private fun DrawScope.drawSignature(path: Path, ink: Color, widthPx: Float) {
    drawPath(path, color = ink, style = Stroke(width = widthPx, cap = StrokeCap.Round, join = StrokeJoin.Round))
}

/** Creates and remembers a [StanceSignatureState]. */
@Composable
public fun rememberStanceSignatureState(): StanceSignatureState = remember { StanceSignatureState() }

/**
 * An area for drawing a signature with a finger or stylus, with undo and clear.
 *
 * Drawing cannot be done with a screen reader or switch, so always offer an alternative
 * next to it, such as typing a name or uploading an image. The canvas announces whether
 * a signature has been drawn.
 *
 * The drawing surface uses physical coordinates and never mirrors in right to left layouts:
 * a signature keeps the shape it was drawn with. Only the buttons under it follow the layout direction.
 *
 * @param label Names the canvas for screen readers, for example "Signature".
 */
@Composable
public fun StanceSignatureCanvas(
    state: StanceSignatureState,
    label: String,
    modifier: Modifier = Modifier,
    height: Dp = (StanceTokens.Space.space32 + StanceTokens.Space.space12).dp,
    placeholder: String = stringResource(R.string.stance_sign_here),
    undoLabel: String = stringResource(R.string.stance_undo),
    clearLabel: String = stringResource(R.string.stance_clear),
    signedDescription: String = stringResource(R.string.stance_signed),
    emptyDescription: String = stringResource(R.string.stance_empty),
) {
    val c = StanceTheme.colors
    val strokeWidth = with(LocalDensity.current) { StanceSpacing.space05.toPx() }
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(height)
                .clip(StanceTheme.shapes.large)
                .background(c.bgSurface)
                .border(StanceTheme.tokens.controlBorderWidth.dp, c.borderControl, StanceTheme.shapes.large)
                .semantics {
                    contentDescription = label
                    stateDescription = if (state.isEmpty) emptyDescription else signedDescription
                },
            contentAlignment = Alignment.Center,
        ) {
            if (state.isEmpty) Text(placeholder, style = StanceTheme.typography.body, color = c.fgSubtle)
            Canvas(
                modifier = Modifier
                    .matchParentSize()
                    .onSizeChanged { state.size = it }
                    .pointerInput(state) {
                        detectDragGestures(
                            onDragStart = { state.current = listOf(it) },
                            onDrag = { change, _ ->
                                change.consume()
                                state.current = state.current + change.position
                            },
                            onDragEnd = {
                                state.addStroke(state.current)
                                state.current = emptyList()
                            },
                            onDragCancel = { state.current = emptyList() },
                        )
                    },
            ) {
                drawSignature(state.toPath(), c.fgDefault, strokeWidth)
                if (state.current.size > 1) {
                    val live = Path().apply {
                        moveTo(state.current.first().x, state.current.first().y)
                        state.current.drop(1).forEach { lineTo(it.x, it.y) }
                    }
                    drawSignature(live, c.fgDefault, strokeWidth)
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2), modifier = Modifier.padding(top = StanceSpacing.none)) {
            StanceButton(undoLabel, onClick = state::undo, variant = StanceButtonVariant.Outline, size = StanceButtonSize.Small, enabled = !state.isEmpty, leadingIcon = StanceIcons.Refresh)
            StanceButton(clearLabel, onClick = state::clear, variant = StanceButtonVariant.Ghost, size = StanceButtonSize.Small, enabled = !state.isEmpty)
        }
    }
}
