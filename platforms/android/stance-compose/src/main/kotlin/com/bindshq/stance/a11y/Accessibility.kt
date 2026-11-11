package com.bindshq.stance.a11y

import androidx.compose.foundation.border
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.unit.dp
import com.bindshq.stance.theme.StanceTheme

/**
 * Draws the Stance focus ring while the element has keyboard or D-pad focus.
 * The ring is 2dp (3dp in high contrast) in the theme's focus colour.
 */
@Composable
public fun Modifier.stanceFocusRing(shape: Shape = StanceTheme.shapes.medium): Modifier {
    var focused by remember { mutableStateOf(false) }
    val width = StanceTheme.tokens.focusWidth.dp
    val color = StanceTheme.colors.focusRing
    return this
        .onFocusChanged { focused = it.isFocused }
        .then(if (focused) Modifier.border(width, color, shape) else Modifier)
}

/** WCAG 2.x contrast ratio between two opaque colours, from 1 to 21. */
public fun stanceContrastRatio(foreground: Color, background: Color): Float {
    val a = foreground.luminance() + CONTRAST_OFFSET
    val b = background.luminance() + CONTRAST_OFFSET
    return if (a > b) a / b else b / a
}

private const val CONTRAST_OFFSET = 0.05f
