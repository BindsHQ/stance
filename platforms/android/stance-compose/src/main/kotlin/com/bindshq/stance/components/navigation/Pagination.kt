package com.bindshq.stance.components.navigation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import com.bindshq.stance.R
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonSize
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.foundation.StanceWindowWidth
import com.bindshq.stance.foundation.defaultPageDescription
import com.bindshq.stance.foundation.rememberFromResources
import com.bindshq.stance.foundation.rememberStanceWindowWidth
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/**
 * The pages to show, from 1, with null for a gap: the first and last [boundaryCount] pages,
 * [siblingCount] pages either side of the current one, and gaps between. The list keeps the
 * same length as the page changes, so buttons do not jump. Matches the web pagination.
 */
internal fun stancePaginationRange(page: Int, pageCount: Int, siblingCount: Int = 1, boundaryCount: Int = 1): List<Int?> {
    if (pageCount <= 0) return emptyList()
    val slots = boundaryCount * 2 + siblingCount * 2 + 3
    if (pageCount <= slots) return (1..pageCount).toList()
    val current = page.coerceIn(1, pageCount)
    val startPages = (1..minOf(boundaryCount, pageCount)).toList()
    val endPages = (maxOf(pageCount - boundaryCount + 1, boundaryCount + 1)..pageCount).toList()
    val siblingsStart = maxOf(minOf(current - siblingCount, pageCount - boundaryCount - siblingCount * 2 - 1), boundaryCount + 2)
    val siblingsEnd = minOf(
        maxOf(current + siblingCount, boundaryCount + siblingCount * 2 + 2),
        if (endPages.isNotEmpty()) endPages.first() - 2 else pageCount - 1,
    )
    return buildList {
        addAll(startPages)
        if (siblingsStart > boundaryCount + 2) add(null) else if (boundaryCount + 1 < pageCount - boundaryCount) add(boundaryCount + 1)
        addAll(siblingsStart..siblingsEnd)
        if (siblingsEnd < pageCount - boundaryCount - 1) add(null) else if (pageCount - boundaryCount > boundaryCount) add(pageCount - boundaryCount)
        addAll(endPages)
    }
}

/**
 * Moves between pages of a long table or list: previous and next buttons around a summary such
 * as "Page 3 of 12".
 *
 * On expanded windows, such as tablets in landscape, it also shows page buttons with gaps, like
 * the web. The previous and next buttons are disabled at the first and last page, the arrows mirror
 * in right to left layouts, and the summary is a polite live region.
 *
 * @param page The current page, from 1. Values outside the range are clamped.
 * @param onPageChange Called with the new page, always inside the range.
 * @param showPageNumbers Shows numbered page buttons. Defaults to true on expanded windows.
 */
@Composable
public fun StancePagination(
    page: Int,
    pageCount: Int,
    onPageChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
    showPageNumbers: Boolean = rememberStanceWindowWidth() == StanceWindowWidth.Expanded,
    siblingCount: Int = 1,
    previousLabel: String = stringResource(R.string.stance_previous_page),
    nextLabel: String = stringResource(R.string.stance_next_page),
    summary: (current: Int, count: Int) -> String = defaultPageDescription(),
    pageLabel: (Int) -> String = rememberFromResources { r -> { number -> r.getString(R.string.stance_page_number, number) } },
) {
    val count = pageCount.coerceAtLeast(1)
    val current = page.coerceIn(1, count)
    val c = StanceTheme.colors
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
    ) {
        StanceIconButton(StanceIcons.ChevronLeft, previousLabel, onClick = { onPageChange(current - 1) }, enabled = current > 1)
        if (showPageNumbers) {
            stancePaginationRange(current, count, siblingCount).forEach { number ->
                if (number == null) {
                    Text(
                        ELLIPSIS,
                        style = StanceTheme.typography.label,
                        color = c.fgMuted,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.widthIn(min = StanceSizes.controlSmall).clearAndSetSemantics {},
                    )
                } else {
                    val isCurrent = number == current
                    StanceButton(
                        text = number.toString(),
                        onClick = { if (!isCurrent) onPageChange(number) },
                        variant = if (isCurrent) StanceButtonVariant.Primary else StanceButtonVariant.Ghost,
                        size = StanceButtonSize.Small,
                        modifier = Modifier.semantics {
                            contentDescription = pageLabel(number)
                            selected = isCurrent
                        },
                    )
                }
            }
        }
        Text(
            summary(current, count),
            style = StanceTheme.typography.label,
            color = c.fgMuted,
            modifier = Modifier
                .padding(horizontal = StanceSpacing.space2)
                .semantics { liveRegion = LiveRegionMode.Polite },
        )
        StanceIconButton(StanceIcons.ChevronRight, nextLabel, onClick = { onPageChange(current + 1) }, enabled = current < count)
    }
}

private const val ELLIPSIS = "…"
