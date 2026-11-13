package com.bindshq.stance.components.data

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CollectionItemInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.collectionItemInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.LayoutDirection
import com.bindshq.stance.R
import com.bindshq.stance.a11y.stanceFocusRing
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/** One node in a [StanceTreeView]. [id] must be unique across the whole tree and stable. */
@Immutable
public data class StanceTreeNode(
    val id: String,
    val label: String,
    val children: List<StanceTreeNode> = emptyList(),
    val icon: ImageVector? = null,
    /** Short text at the end of the row, such as a count. */
    val meta: String? = null,
    val enabled: Boolean = true,
    /** A second, quieter line under the label. */
    val description: String? = null,
)

/** A visible row of a tree: the node, its depth from 0 and whether it is open. */
@Immutable
internal data class StanceTreeRow(val node: StanceTreeNode, val level: Int, val expanded: Boolean) {
    val hasChildren: Boolean get() = node.children.isNotEmpty()
}

/** The rows a tree shows: every root node, and the children of each expanded node, depth first. */
internal fun stanceVisibleTreeRows(nodes: List<StanceTreeNode>, expanded: Set<String>, level: Int = 0): List<StanceTreeRow> =
    nodes.flatMap { node ->
        val open = node.children.isNotEmpty() && node.id in expanded
        listOf(StanceTreeRow(node, level, open)) + if (open) stanceVisibleTreeRows(node.children, expanded, level + 1) else emptyList()
    }

/** The open nodes after [id] is toggled. */
internal fun stanceToggleTreeNode(expanded: Set<String>, id: String): Set<String> = if (id in expanded) expanded - id else expanded + id

/**
 * A hierarchy of nodes that expand and collapse, such as folders and files.
 *
 * Lazy and keyed by node id, so large trees scroll smoothly and keep their state. Each row is at
 * least 48dp tall, reports Expanded or Collapsed with expand and collapse actions, and tells screen
 * readers its position. The chevron mirrors in right to left layouts.
 *
 * Tapping a row opens or closes it. With [onSelect], tapping a row selects it instead, and the
 * chevron opens or closes it.
 *
 * @param expanded The ids of the open nodes.
 * @param selected The id of the selected node, if any.
 */
@Composable
public fun StanceTreeView(
    nodes: List<StanceTreeNode>,
    expanded: Set<String>,
    onExpandedChange: (Set<String>) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    selected: String? = null,
    onSelect: ((StanceTreeNode) -> Unit)? = null,
    state: LazyListState = rememberLazyListState(),
    expandLabel: String = stringResource(R.string.stance_expand),
    collapseLabel: String = stringResource(R.string.stance_collapse),
) {
    val rows = remember(nodes, expanded) { stanceVisibleTreeRows(nodes, expanded) }
    LazyColumn(
        modifier = modifier.semantics { if (label != null) contentDescription = label },
        state = state,
    ) {
        itemsIndexed(rows, key = { _, row -> row.node.id }) { index, row ->
            TreeRow(
                row = row,
                index = index,
                selected = row.node.id == selected,
                onToggle = { onExpandedChange(stanceToggleTreeNode(expanded, row.node.id)) },
                onSelect = onSelect?.let { { it(row.node) } },
                expandLabel = expandLabel,
                collapseLabel = collapseLabel,
                modifier = Modifier.animateItem(
                    fadeInSpec = null,
                    placementSpec = if (StanceTheme.motion.reduceMotion) null else StanceTheme.motion.fast(),
                    fadeOutSpec = null,
                ),
            )
        }
    }
}

private val idSetSaver = listSaver<Set<String>, String>(save = { it.toList() }, restore = { it.toSet() })

/** [StanceTreeView] that keeps its own open nodes, saved across configuration changes. */
@Composable
public fun StanceTreeView(
    nodes: List<StanceTreeNode>,
    modifier: Modifier = Modifier,
    label: String? = null,
    initiallyExpanded: Set<String> = emptySet(),
    selected: String? = null,
    onSelect: ((StanceTreeNode) -> Unit)? = null,
) {
    var expanded by rememberSaveable(stateSaver = idSetSaver) { mutableStateOf(initiallyExpanded) }
    StanceTreeView(nodes, expanded, { expanded = it }, modifier, label, selected, onSelect)
}

@Composable
private fun TreeRow(
    row: StanceTreeRow,
    index: Int,
    selected: Boolean,
    onToggle: () -> Unit,
    onSelect: (() -> Unit)?,
    expandLabel: String,
    collapseLabel: String,
    modifier: Modifier,
) {
    val c = StanceTheme.colors
    val node = row.node
    val enabled = node.enabled
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    // Collapsed points along the reading direction; expanded points down.
    val rotation by animateFloatAsState(
        when {
            row.expanded -> 0f
            rtl -> QUARTER_TURN
            else -> -QUARTER_TURN
        },
        StanceTheme.motion.fast(),
        label = "stance-tree-chevron",
    )
    val expandedText = stringResource(R.string.stance_expanded)
    val collapsedText = stringResource(R.string.stance_collapsed)
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = StanceSizes.touchTarget)
            .background(if (selected) c.interactiveSelected else Color.Transparent, StanceTheme.shapes.medium)
            .stanceFocusRing(StanceTheme.shapes.medium)
            .clickable(enabled = enabled, role = Role.Button, onClick = onSelect ?: onToggle)
            .semantics(mergeDescendants = true) {
                collectionItemInfo = CollectionItemInfo(rowIndex = index, rowSpan = 1, columnIndex = row.level, columnSpan = 1)
                if (onSelect != null) this.selected = selected
                if (row.hasChildren) {
                    stateDescription = if (row.expanded) expandedText else collapsedText
                    if (enabled) {
                        if (row.expanded) collapse(collapseLabel) { onToggle(); true } else expand(expandLabel) { onToggle(); true }
                    }
                }
            }
            .padding(start = StanceSpacing.space5 * row.level, end = StanceSpacing.space3),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
    ) {
        val content = if (selected) c.interactiveSelectedFg else if (enabled) c.fgDefault else c.fgDisabled
        if (row.hasChildren) {
            Box(
                modifier = Modifier
                    .size(StanceSizes.touchTarget)
                    .then(
                        if (onSelect != null) {
                            Modifier
                                .clickable(enabled = enabled, role = Role.Button, onClick = onToggle)
                                .semantics { contentDescription = if (row.expanded) collapseLabel else expandLabel }
                        } else {
                            Modifier
                        },
                    ),
                contentAlignment = Alignment.Center,
            ) {
                StanceIcon(
                    StanceIcons.ChevronDown,
                    contentDescription = null,
                    size = StanceSizes.iconSmall,
                    tint = if (enabled) c.fgMuted else c.fgDisabled,
                    modifier = Modifier.graphicsLayer { rotationZ = rotation },
                )
            }
        } else {
            Spacer(Modifier.width(StanceSizes.touchTarget))
        }
        val icon = node.icon ?: when {
            !row.hasChildren -> StanceIcons.File
            row.expanded -> StanceIcons.FolderOpen
            else -> StanceIcons.Folder
        }
        StanceIcon(icon, contentDescription = null, size = StanceSizes.iconSmall, tint = content)
        Column(modifier = Modifier.weight(1f).padding(start = StanceSpacing.space1, top = StanceSpacing.space1, bottom = StanceSpacing.space1)) {
            Text(node.label, style = StanceTheme.typography.bodySmall, color = content)
            if (node.description != null) {
                Text(node.description, style = StanceTheme.typography.caption, color = if (selected) content else c.fgMuted)
            }
        }
        if (node.meta != null) Text(node.meta, style = StanceTheme.typography.caption, color = c.fgMuted)
    }
}

private const val QUARTER_TURN = 90f
