package com.bindshq.stance.components.actions

import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import com.bindshq.stance.R
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceAppearance
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceTheme

/** The icon that stands for an appearance in a [StanceThemeSwitcher]. */
public val StanceAppearance.icon: ImageVector
    get() = when (this) {
        StanceAppearance.System -> StanceIcons.Monitor
        StanceAppearance.Light -> StanceIcons.Sun
        StanceAppearance.Dark -> StanceIcons.Moon
        StanceAppearance.HighContrast -> StanceIcons.Contrast
    }

/** The words for an appearance, from the Stance string resources. */
@Composable
public fun StanceAppearance.label(): String = stringResource(
    when (this) {
        StanceAppearance.System -> R.string.stance_theme_system
        StanceAppearance.Light -> R.string.stance_theme_light
        StanceAppearance.Dark -> R.string.stance_theme_dark
        StanceAppearance.HighContrast -> R.string.stance_theme_high_contrast
    },
)

/**
 * Chooses system, light, dark or high contrast appearance, as a Material 3 segmented button row.
 *
 * Pair it with `rememberStanceAppearance()`, which saves the choice with the same values as the
 * web. Announced as a radio group named by [label], with the chosen appearance selected.
 *
 * @param showLabels Shows the words. Otherwise each segment shows its icon and is named for screen readers.
 * @param options The appearances to offer, in order. Defaults to all four.
 */
@Composable
public fun StanceThemeSwitcher(
    appearance: StanceAppearance,
    onAppearanceChange: (StanceAppearance) -> Unit,
    modifier: Modifier = Modifier,
    options: List<StanceAppearance> = StanceAppearance.entries,
    showLabels: Boolean = true,
    label: String = stringResource(R.string.stance_theme),
) {
    val c = StanceTheme.colors
    SingleChoiceSegmentedButtonRow(modifier = modifier.fillMaxWidth().height(IntrinsicSize.Min).semantics { contentDescription = label }) {
        options.forEachIndexed { index, option ->
            val name = option.label()
            SegmentedButton(
                selected = option == appearance,
                onClick = { onAppearanceChange(option) },
                shape = SegmentedButtonDefaults.itemShape(index = index, count = options.size, baseShape = StanceTheme.shapes.medium),
                modifier = Modifier.fillMaxHeight().then(if (showLabels) Modifier else Modifier.semantics { contentDescription = name }),
                colors = SegmentedButtonDefaults.colors(
                    activeContainerColor = c.accentBg,
                    activeContentColor = c.accentFg,
                    activeBorderColor = c.accentBg,
                    inactiveContainerColor = c.bgSurface,
                    inactiveContentColor = c.fgDefault,
                    inactiveBorderColor = c.borderControl,
                ),
                icon = {},
            ) {
                if (showLabels) {
                    Text(name, style = StanceTheme.typography.label, maxLines = 2, textAlign = TextAlign.Center)
                } else {
                    StanceIcon(option.icon, contentDescription = null, size = StanceSizes.iconMedium)
                }
            }
        }
    }
}
