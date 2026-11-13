package com.bindshq.stance.components.feedback

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextOverflow
import com.bindshq.stance.R
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.advanced.StanceSwipeAction
import com.bindshq.stance.components.advanced.StanceSwipeActions
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/**
 * One notification in a list: a title, an optional body and time, and an unread state.
 *
 * An unread notification shows a dot and a stronger title and is announced as Unread, so the
 * state never depends on the dot alone. With [onMarkRead] it gets a mark as read button and the
 * same screen reader action. Swipe actions reveal on a swipe and are also custom actions.
 *
 * @param time When it happened, already formatted, for example "5 min ago".
 * @param leading An avatar or icon at the start.
 * @param onClick Opens the related item. The row is then one button.
 */
@Composable
public fun StanceNotificationItem(
    title: String,
    modifier: Modifier = Modifier,
    body: String? = null,
    time: String? = null,
    unread: Boolean = false,
    leading: (@Composable () -> Unit)? = null,
    onClick: (() -> Unit)? = null,
    onMarkRead: (() -> Unit)? = null,
    startAction: StanceSwipeAction? = null,
    endAction: StanceSwipeAction? = null,
    unreadLabel: String = stringResource(R.string.stance_unread),
    markReadLabel: String = stringResource(R.string.stance_mark_as_read),
) {
    val c = StanceTheme.colors
    val row = @Composable {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(c.bgSurface)
                .heightIn(min = StanceSizes.touchTarget + StanceSpacing.space4)
                .then(if (onClick != null) Modifier.clickable(role = Role.Button, onClick = onClick) else Modifier)
                .semantics(mergeDescendants = true) {
                    if (unread) stateDescription = unreadLabel
                    if (unread && onMarkRead != null) {
                        customActions = listOf(CustomAccessibilityAction(markReadLabel) { onMarkRead(); true })
                    }
                }
                .padding(start = StanceSpacing.space2, end = StanceSpacing.space2, top = StanceSpacing.space3, bottom = StanceSpacing.space3),
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
            verticalAlignment = Alignment.Top,
        ) {
            Box(Modifier.padding(top = StanceSpacing.space2).size(StanceSpacing.space2).clip(CircleShape).background(if (unread) c.accentBg else Color.Transparent))
            leading?.invoke()
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space05)) {
                Text(
                    title,
                    style = if (unread) StanceTheme.typography.title else StanceTheme.typography.body,
                    color = c.fgDefault,
                )
                if (body != null) {
                    Text(body, style = StanceTheme.typography.bodySmall, color = c.fgMuted, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
                if (time != null) Text(time, style = StanceTheme.typography.caption, color = c.fgSubtle)
            }
            if (unread && onMarkRead != null) {
                StanceIconButton(StanceIcons.Check, markReadLabel, onClick = onMarkRead)
            }
        }
    }
    if (startAction != null || endAction != null) {
        StanceSwipeActions(modifier = modifier, startAction = startAction, endAction = endAction) { row() }
    } else {
        Box(modifier) { row() }
    }
}
