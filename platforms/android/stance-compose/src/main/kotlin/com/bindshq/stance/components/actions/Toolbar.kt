package com.bindshq.stance.components.actions

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/** How a [StanceToolbar] sits on the screen. */
public enum class StanceToolbarStyle {
    /** A raised pill that floats above content, like the Material 3 floating toolbar. */
    Floating,

    /** A flat, bordered row that sits in the layout. */
    Inline,
}

/**
 * A row of related actions, such as text formatting or bulk actions on a selection.
 *
 * Shaped and raised like the Material 3 floating toolbar. Material 3 in the Compose BOM Stance
 * builds on ships that toolbar only as an expressive preview, so Stance draws it on a Material
 * [Surface] with the same anatomy. Put [StanceIconButton]s inside, with a vertical
 * [com.bindshq.stance.foundation.StanceDivider] between groups. The row scrolls when it does not
 * fit, and screen readers read it as one group named by [label].
 *
 * @param label Names the toolbar for screen readers, for example "Text formatting".
 */
@Composable
public fun StanceToolbar(
    label: String,
    modifier: Modifier = Modifier,
    style: StanceToolbarStyle = StanceToolbarStyle.Floating,
    content: @Composable RowScope.() -> Unit,
) {
    val c = StanceTheme.colors
    val floating = style == StanceToolbarStyle.Floating
    val elevation = if (floating) StanceTheme.elevation.lg else StanceTheme.elevation.none
    Surface(
        modifier = modifier.semantics {
            contentDescription = label
            isTraversalGroup = true
        },
        shape = if (floating) StanceTheme.shapes.pill else StanceTheme.shapes.large,
        color = if (floating) c.bgOverlay else c.bgSurface,
        contentColor = c.fgDefault,
        shadowElevation = elevation.shadow,
        border = BorderStroke(
            if (elevation.outline > 0.dp) elevation.outline else StanceTheme.tokens.borderWidth.dp,
            if (elevation.outline > 0.dp) c.borderStrong else c.borderDefault,
        ),
    ) {
        Row(
            modifier = Modifier
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = StanceSpacing.space1, vertical = StanceSpacing.space05),
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space05),
            verticalAlignment = Alignment.CenterVertically,
            content = content,
        )
    }
}
