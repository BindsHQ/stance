package com.bindshq.stance.components.forms

import androidx.compose.foundation.BorderStroke
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.InputChip
import androidx.compose.material3.InputChipDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceTheme

/**
 * A chip that toggles a filter on or off. Announced with its selected state.
 */
@Composable
public fun StanceFilterChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    leadingIcon: ImageVector? = null,
) {
    val c = StanceTheme.colors
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label, style = StanceTheme.typography.label) },
        modifier = modifier,
        enabled = enabled,
        leadingIcon = when {
            selected -> ({ StanceIcon(StanceIcons.Check, contentDescription = null, size = StanceSizes.iconSmall) })
            leadingIcon != null -> ({ StanceIcon(leadingIcon, contentDescription = null, size = StanceSizes.iconSmall) })
            else -> null
        },
        shape = StanceTheme.shapes.pill,
        colors = FilterChipDefaults.filterChipColors(
            containerColor = c.bgSurface,
            labelColor = c.fgDefault,
            iconColor = c.fgMuted,
            selectedContainerColor = c.accentBg,
            selectedLabelColor = c.accentFg,
            selectedLeadingIconColor = c.accentFg,
            disabledContainerColor = c.disabledBg,
            disabledLabelColor = c.disabledFg,
        ),
        border = BorderStroke(StanceTheme.tokens.controlBorderWidth.dp, if (selected) c.accentBg else c.borderControl),
    )
}

/**
 * A chip that represents something a person entered, such as a recipient, and can be removed.
 *
 * @param removeDescription The remove action's name for screen readers, for example "Remove Priya Nair".
 */
@Composable
public fun StanceInputChip(
    label: String,
    onRemove: () -> Unit,
    removeDescription: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val c = StanceTheme.colors
    InputChip(
        selected = false,
        onClick = onRemove,
        label = { Text(label, style = StanceTheme.typography.label) },
        modifier = modifier.semantics { onClick(label = removeDescription, action = null) },
        enabled = enabled,
        trailingIcon = { StanceIcon(StanceIcons.X, contentDescription = null, size = StanceSizes.iconSmall) },
        shape = StanceTheme.shapes.pill,
        colors = InputChipDefaults.inputChipColors(
            containerColor = c.bgMuted,
            labelColor = c.fgDefault,
            trailingIconColor = c.fgMuted,
            disabledContainerColor = c.disabledBg,
            disabledLabelColor = c.disabledFg,
        ),
        border = BorderStroke(StanceTheme.tokens.borderWidth.dp, c.borderDefault),
    )
}
