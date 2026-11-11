package com.bindshq.stance.components.forms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/**
 * Lays out a label, a control, helper text and an error message.
 *
 * The error is a polite live region, so screen readers announce it when it appears, and it is
 * marked with an icon so it does not rely on colour. Controls such as [StanceTextField] already
 * include this layout; use it directly for custom controls.
 *
 * @param required Adds a visible marker that screen readers read as "required".
 */
@Composable
public fun StanceFormField(
    label: String?,
    modifier: Modifier = Modifier,
    helper: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    requiredDescription: String = "required",
    control: @Composable () -> Unit,
) {
    val c = StanceTheme.colors
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(StanceSpacing.space15)) {
        if (label != null) {
            Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1)) {
                Text(label, style = StanceTheme.typography.label, color = if (enabled) c.fgDefault else c.fgDisabled)
                if (required) {
                    Text(
                        "*",
                        style = StanceTheme.typography.label,
                        color = c.dangerFg,
                        modifier = Modifier.clearAndSetSemantics { contentDescription = requiredDescription },
                    )
                }
            }
        }
        control()
        if (helper != null && error == null) {
            Text(helper, style = StanceTheme.typography.caption, color = c.fgMuted)
        }
        if (error != null) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space15),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
            ) {
                StanceIcon(StanceIcons.AlertCircle, contentDescription = null, size = StanceSizes.iconSmall, tint = c.dangerFg)
                Text(error, style = StanceTheme.typography.caption, color = c.dangerFg)
            }
        }
    }
}
