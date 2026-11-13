package com.bindshq.stance.components.data

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import com.bindshq.stance.R
import com.bindshq.stance.a11y.stanceFocusRing
import com.bindshq.stance.foundation.StanceCard
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.foundation.expandEnter
import com.bindshq.stance.foundation.shrinkExit
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/** One section of a [StanceAccordion]. [id] must be unique and stable. */
@Immutable
public data class StanceAccordionItem(
    val id: String,
    val title: String,
    val enabled: Boolean = true,
    val content: @Composable ColumnScope.() -> Unit,
)

/** Whether a [StanceAccordion] keeps one section open or several. */
public enum class StanceAccordionMode {
    /** Opening a section closes the one that was open. */
    Single,

    /** Each section opens and closes on its own. */
    Multiple,
}

/** How the sections of a [StanceAccordion] are drawn. */
public enum class StanceAccordionVariant {
    /** Sections in one column separated by dividers. */
    Default,

    /** Each section is its own outlined card. */
    Separated,
}

/**
 * The open sections after [id] is toggled.
 *
 * In [StanceAccordionMode.Single], opening a section closes the others. Closing the open section
 * is allowed only when [collapsible] is true, as on the web.
 */
internal fun stanceAccordionToggle(expanded: Set<String>, id: String, mode: StanceAccordionMode, collapsible: Boolean = true): Set<String> =
    when (mode) {
        StanceAccordionMode.Multiple -> if (id in expanded) expanded - id else expanded + id
        StanceAccordionMode.Single -> when {
            id !in expanded -> setOf(id)
            collapsible -> emptySet()
            else -> expanded
        }
    }

/**
 * The header and body of one disclosure section, shared by [StanceAccordion] and [StanceCollapsible].
 * The header is a heading and a button that reports expanded or collapsed.
 */
@Composable
private fun DisclosureSection(
    title: String,
    expanded: Boolean,
    onToggle: () -> Unit,
    enabled: Boolean,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = StanceTheme.colors
    val motion = StanceTheme.motion
    val rotation by animateFloatAsState(if (expanded) HALF_TURN else 0f, motion.fast(), label = "stance-disclosure-chevron")
    val expandedText = stringResource(R.string.stance_expanded)
    val collapsedText = stringResource(R.string.stance_collapsed)
    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = StanceSizes.touchTarget)
                .stanceFocusRing(StanceTheme.shapes.small)
                .clickable(enabled = enabled, role = Role.Button, onClick = onToggle)
                .semantics {
                    heading()
                    stateDescription = if (expanded) expandedText else collapsedText
                    if (enabled) {
                        if (expanded) collapse { onToggle(); true } else expand { onToggle(); true }
                    }
                }
                .padding(horizontal = StanceSpacing.space4, vertical = StanceSpacing.space3),
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                title,
                style = StanceTheme.typography.title,
                color = if (enabled) c.fgDefault else c.fgDisabled,
                modifier = Modifier.weight(1f),
            )
            StanceIcon(
                StanceIcons.ChevronDown,
                contentDescription = null,
                size = StanceSizes.iconSmall,
                tint = if (enabled) c.fgMuted else c.fgDisabled,
                modifier = Modifier.graphicsLayer { rotationZ = rotation },
            )
        }
        AnimatedVisibility(visible = expanded, enter = motion.expandEnter(), exit = motion.shrinkExit()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = StanceSpacing.space4, end = StanceSpacing.space4, bottom = StanceSpacing.space4),
                verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                content = content,
            )
        }
    }
}

/**
 * Vertically stacked headings that each reveal a section.
 *
 * Each header is a heading and a button with expand and collapse actions, and it reports
 * Expanded or Collapsed. Sections ease open with the motion tokens and open at once when the
 * system has animations turned off.
 *
 * @param expanded The ids of the open sections.
 * @param onExpandedChange Called with the open sections after a tap.
 * @param mode [StanceAccordionMode.Single] keeps at most one section open.
 * @param collapsible In single mode, whether the open section can be closed again. Defaults to true.
 */
@Composable
public fun StanceAccordion(
    items: List<StanceAccordionItem>,
    expanded: Set<String>,
    onExpandedChange: (Set<String>) -> Unit,
    modifier: Modifier = Modifier,
    mode: StanceAccordionMode = StanceAccordionMode.Single,
    collapsible: Boolean = true,
    variant: StanceAccordionVariant = StanceAccordionVariant.Default,
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = if (variant == StanceAccordionVariant.Separated) Arrangement.spacedBy(StanceSpacing.space2) else Arrangement.Top,
    ) {
        items.forEachIndexed { index, item ->
            val section = @Composable {
                DisclosureSection(
                    title = item.title,
                    expanded = item.id in expanded,
                    onToggle = { onExpandedChange(stanceAccordionToggle(expanded, item.id, mode, collapsible)) },
                    enabled = item.enabled,
                    content = item.content,
                )
            }
            if (variant == StanceAccordionVariant.Separated) {
                StanceCard(contentPadding = PaddingValues(StanceSpacing.none)) { section() }
            } else {
                section()
                if (index < items.lastIndex) StanceDivider()
            }
        }
    }
}

private val idSetSaver = listSaver<Set<String>, String>(save = { it.toList() }, restore = { it.toSet() })

/**
 * [StanceAccordion] that keeps its own open sections, saved across configuration changes.
 *
 * @param initiallyExpanded The ids open on first composition.
 */
@Composable
public fun StanceAccordion(
    items: List<StanceAccordionItem>,
    modifier: Modifier = Modifier,
    mode: StanceAccordionMode = StanceAccordionMode.Single,
    initiallyExpanded: Set<String> = emptySet(),
    collapsible: Boolean = true,
    variant: StanceAccordionVariant = StanceAccordionVariant.Default,
) {
    var expanded by rememberSaveable(stateSaver = idSetSaver) { mutableStateOf(initiallyExpanded) }
    StanceAccordion(items, expanded, { expanded = it }, modifier, mode, collapsible, variant)
}

/**
 * One section that shows and hides its content, the single section form of [StanceAccordion].
 *
 * The header is a heading and a button that reports Expanded or Collapsed.
 */
@Composable
public fun StanceCollapsible(
    title: String,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable ColumnScope.() -> Unit,
) {
    DisclosureSection(
        title = title,
        expanded = expanded,
        onToggle = { onExpandedChange(!expanded) },
        enabled = enabled,
        modifier = modifier,
        content = content,
    )
}

private const val HALF_TURN = 180f
