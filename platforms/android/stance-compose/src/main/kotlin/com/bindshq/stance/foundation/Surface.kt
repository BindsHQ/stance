package com.bindshq.stance.foundation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Surface
import androidx.compose.material3.VerticalDivider
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.bindshq.stance.theme.StanceElevationLevel
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/**
 * A themed container: the base for cards, sheets and bars.
 *
 * Elevation comes from the theme's shadow tokens. In high contrast, levels that have no soft
 * shadow draw a solid outline instead, so depth never depends on subtle shading.
 *
 * @param bordered Draws the default border regardless of elevation.
 * @param onClick Makes the whole surface clickable with correct semantics and ripple.
 */
@Composable
public fun StanceSurface(
    modifier: Modifier = Modifier,
    shape: Shape = StanceTheme.shapes.large,
    color: Color = StanceTheme.colors.bgSurface,
    contentColor: Color = StanceTheme.colors.fgDefault,
    elevation: StanceElevationLevel = StanceTheme.elevation.none,
    bordered: Boolean = false,
    onClick: (() -> Unit)? = null,
    enabled: Boolean = true,
    content: @Composable () -> Unit,
) {
    val outline = when {
        elevation.outline > 0.dp -> BorderStroke(elevation.outline, StanceTheme.colors.borderStrong)
        bordered -> BorderStroke(StanceTheme.tokens.borderWidth.dp, StanceTheme.colors.borderDefault)
        else -> null
    }
    if (onClick != null) {
        Surface(
            onClick = onClick,
            modifier = modifier,
            enabled = enabled,
            shape = shape,
            color = color,
            contentColor = contentColor,
            shadowElevation = elevation.shadow,
            border = outline,
            content = content,
        )
    } else {
        Surface(
            modifier = modifier,
            shape = shape,
            color = color,
            contentColor = contentColor,
            shadowElevation = elevation.shadow,
            border = outline,
            content = content,
        )
    }
}

/** How a [StanceCard] separates itself from the page. */
public enum class StanceCardVariant { Outline, Elevated, Filled }

/**
 * Groups related content. Pass [onClick] to make the whole card one accessible action.
 */
@Composable
public fun StanceCard(
    modifier: Modifier = Modifier,
    variant: StanceCardVariant = StanceCardVariant.Outline,
    onClick: (() -> Unit)? = null,
    contentPadding: PaddingValues = PaddingValues(StanceSpacing.space4),
    content: @Composable ColumnScope.() -> Unit,
) {
    StanceSurface(
        modifier = modifier,
        shape = StanceTheme.shapes.large,
        color = if (variant == StanceCardVariant.Filled) StanceTheme.colors.bgMuted else StanceTheme.colors.bgSurface,
        elevation = if (variant == StanceCardVariant.Elevated) StanceTheme.elevation.md else StanceTheme.elevation.none,
        bordered = variant != StanceCardVariant.Filled || StanceTheme.isHighContrast,
        onClick = onClick,
    ) {
        Column(modifier = Modifier.padding(contentPadding), content = content)
    }
}

/** A thin line separating content. Decorative: it is not announced by screen readers. */
@Composable
public fun StanceDivider(
    modifier: Modifier = Modifier,
    vertical: Boolean = false,
    thickness: Dp = StanceTheme.tokens.borderWidth.dp,
    color: Color = StanceTheme.colors.separator,
) {
    if (vertical) {
        VerticalDivider(modifier = modifier, thickness = thickness, color = color)
    } else {
        HorizontalDivider(modifier = modifier, thickness = thickness, color = color)
    }
}
