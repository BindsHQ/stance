package com.bindshq.stance.components.actions

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MenuDefaults
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.dp
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/** One entry in a [StanceDropdownMenu]. */
@Immutable
public data class StanceMenuItem(
    val label: String,
    val onClick: () -> Unit,
    val icon: ImageVector? = null,
    val destructive: Boolean = false,
    val enabled: Boolean = true,
    /** Draws a divider above this item to start a new group. */
    val startsGroup: Boolean = false,
)

/**
 * A menu of actions anchored to the element that opened it. Uses the platform dropdown menu,
 * so it dismisses on back, outside taps and Escape, and is announced as a menu.
 *
 * @param offset Moves the menu from its anchor: x from the start edge, y from the bottom edge.
 */
@Composable
public fun StanceDropdownMenu(
    expanded: Boolean,
    onDismissRequest: () -> Unit,
    items: List<StanceMenuItem>,
    modifier: Modifier = Modifier,
    offset: DpOffset = DpOffset.Zero,
) {
    val c = StanceTheme.colors
    DropdownMenu(
        expanded = expanded,
        onDismissRequest = onDismissRequest,
        modifier = modifier,
        offset = offset,
        shape = StanceTheme.shapes.large,
        containerColor = c.bgOverlay,
        shadowElevation = StanceTheme.elevation.lg.shadow,
        border = BorderStroke(StanceTheme.tokens.borderWidth.dp, c.borderDefault),
    ) {
        items.forEach { item ->
            if (item.startsGroup) StanceDivider()
            val content = if (item.destructive) c.dangerFg else c.fgDefault
            DropdownMenuItem(
                text = { Text(item.label, style = StanceTheme.typography.bodySmall) },
                onClick = {
                    onDismissRequest()
                    item.onClick()
                },
                enabled = item.enabled,
                leadingIcon = item.icon?.let { icon -> { StanceIcon(icon, contentDescription = null, size = StanceSizes.iconSmall) } },
                colors = MenuDefaults.itemColors(
                    textColor = content,
                    leadingIconColor = content,
                    disabledTextColor = c.disabledFg,
                    disabledLeadingIconColor = c.disabledFg,
                ),
            )
        }
    }
}

/**
 * A group of mutually exclusive options shown as connected segments.
 * Announced as a radio group; the selected segment is announced as selected.
 */
@Composable
public fun StanceButtonGroup(
    options: List<String>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val c = StanceTheme.colors
    SingleChoiceSegmentedButtonRow(modifier = modifier) {
        options.forEachIndexed { index, label ->
            SegmentedButton(
                selected = index == selectedIndex,
                onClick = { onSelect(index) },
                shape = SegmentedButtonDefaults.itemShape(index = index, count = options.size, baseShape = StanceTheme.shapes.medium),
                enabled = enabled,
                colors = SegmentedButtonDefaults.colors(
                    activeContainerColor = c.accentBg,
                    activeContentColor = c.accentFg,
                    activeBorderColor = c.accentBg,
                    inactiveContainerColor = c.bgSurface,
                    inactiveContentColor = c.fgDefault,
                    inactiveBorderColor = c.borderControl,
                    disabledActiveContainerColor = c.disabledBg,
                    disabledActiveContentColor = c.disabledFg,
                    disabledInactiveContentColor = c.disabledFg,
                    disabledInactiveBorderColor = c.disabledBorder,
                ),
                icon = {},
            ) {
                Text(label, style = StanceTheme.typography.button, maxLines = 1)
            }
        }
    }
}

/**
 * A primary action with a menu of related actions.
 *
 * @param menuDescription Names the menu button for screen readers, for example "More save options".
 */
@Composable
public fun StanceSplitButton(
    text: String,
    onClick: () -> Unit,
    menuItems: List<StanceMenuItem>,
    menuDescription: String,
    modifier: Modifier = Modifier,
    variant: StanceButtonVariant = StanceButtonVariant.Primary,
    enabled: Boolean = true,
) {
    var expanded by remember { mutableStateOf(false) }
    Row(modifier = modifier) {
        StanceButton(text = text, onClick = onClick, variant = variant, enabled = enabled)
        Spacer(Modifier.width(StanceSpacing.space05))
        Box {
            StanceIconButton(
                icon = StanceIcons.ChevronDown,
                contentDescription = menuDescription,
                onClick = { expanded = true },
                variant = if (variant == StanceButtonVariant.Primary) StanceIconButtonVariant.Filled else StanceIconButtonVariant.Outline,
                enabled = enabled,
            )
            StanceDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }, items = menuItems)
        }
    }
}
