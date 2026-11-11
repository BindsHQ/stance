package com.bindshq.stance.components.actions

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.OutlinedIconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.bindshq.stance.a11y.stanceFocusRing
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/** Emphasis of a [StanceIconButton]. */
public enum class StanceIconButtonVariant { Ghost, Outline, Filled }

/**
 * A button that shows only an icon.
 *
 * @param contentDescription Required: the action's name for screen readers, for example "Delete template".
 */
@Composable
public fun StanceIconButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: StanceIconButtonVariant = StanceIconButtonVariant.Ghost,
    enabled: Boolean = true,
) {
    val c = StanceTheme.colors
    val ring = modifier.stanceFocusRing(StanceTheme.shapes.pill)
    when (variant) {
        StanceIconButtonVariant.Outline -> OutlinedIconButton(
            onClick = onClick,
            modifier = ring,
            enabled = enabled,
            border = BorderStroke(StanceTheme.tokens.controlBorderWidth.dp, if (enabled) c.borderControl else c.disabledBorder),
            colors = IconButtonDefaults.outlinedIconButtonColors(contentColor = c.fgDefault, disabledContentColor = c.disabledFg),
        ) { StanceIcon(icon, contentDescription) }

        else -> IconButton(
            onClick = onClick,
            modifier = ring,
            enabled = enabled,
            colors = IconButtonDefaults.iconButtonColors(
                containerColor = if (variant == StanceIconButtonVariant.Filled) c.accentBg else Color.Transparent,
                contentColor = if (variant == StanceIconButtonVariant.Filled) c.accentFg else c.fgDefault,
                disabledContainerColor = if (variant == StanceIconButtonVariant.Filled) c.disabledBg else Color.Transparent,
                disabledContentColor = c.disabledFg,
            ),
        ) { StanceIcon(icon, contentDescription) }
    }
}

/**
 * The primary action of a screen, floating above content.
 *
 * @param text When set, shows an extended button with a visible label. Otherwise
 * [contentDescription] names the action for screen readers.
 */
@Composable
public fun StanceFloatingActionButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    text: String? = null,
) {
    val c = StanceTheme.colors
    val elevation = FloatingActionButtonDefaults.elevation(
        defaultElevation = StanceTheme.elevation.lg.shadow,
        pressedElevation = StanceTheme.elevation.md.shadow,
        focusedElevation = StanceTheme.elevation.lg.shadow,
        hoveredElevation = StanceTheme.elevation.xl.shadow,
    )
    if (text != null) {
        ExtendedFloatingActionButton(
            onClick = onClick,
            modifier = modifier,
            shape = StanceTheme.shapes.extraLarge,
            containerColor = c.accentBg,
            contentColor = c.accentFg,
            elevation = elevation,
        ) {
            StanceIcon(icon, contentDescription = null, size = StanceSizes.iconMedium)
            Spacer(Modifier.width(StanceSpacing.space2))
            Text(text, style = StanceTheme.typography.button)
        }
    } else {
        FloatingActionButton(
            onClick = onClick,
            modifier = modifier,
            shape = StanceTheme.shapes.extraLarge,
            containerColor = c.accentBg,
            contentColor = c.accentFg,
            elevation = elevation,
        ) {
            StanceIcon(icon, contentDescription, size = StanceSizes.iconLarge)
        }
    }
}
