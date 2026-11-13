package com.bindshq.stance.components.data

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.bindshq.stance.R
import com.bindshq.stance.components.actions.StanceCopyButton
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/** The lines of a code sample. A trailing line break does not add an empty last line. */
internal fun stanceCodeLines(code: String): List<String> = code.removeSuffix("\n").split("\n")

/**
 * Shows source code in the monospaced code style, in a bordered block that scrolls sideways
 * instead of wrapping.
 *
 * Code always reads left to right, also in right to left layouts. Line numbers are hidden from
 * screen readers, the code can be selected, and [copyable] adds a [StanceCopyButton] that copies
 * the whole sample. The block is named by [label] for screen readers.
 *
 * @param title Shown in the header, for example a file name.
 * @param language Shown in the header when there is no title, for example "kotlin".
 * @param highlightLines Line numbers, from 1, to emphasise.
 * @param wrap Wraps long lines instead of scrolling. Leave it off with [showLineNumbers], so numbers stay beside their lines.
 */
@Composable
public fun StanceCodeBlock(
    code: String,
    modifier: Modifier = Modifier,
    title: String? = null,
    language: String? = null,
    showLineNumbers: Boolean = false,
    copyable: Boolean = true,
    wrap: Boolean = false,
    highlightLines: Set<Int> = emptySet(),
    label: String = title ?: stringResource(R.string.stance_code_sample),
) {
    val c = StanceTheme.colors
    val lines = remember(code) { stanceCodeLines(code) }
    val style = StanceTheme.typography.code
    val heading = title ?: language
    val shape = StanceTheme.shapes.medium
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(c.bgSubtle)
            .border(StanceTheme.tokens.borderWidth.dp, c.borderDefault, shape)
            .semantics {
                contentDescription = label
                isTraversalGroup = true
            },
    ) {
        if (heading != null || copyable) {
            Row(
                modifier = Modifier.fillMaxWidth().heightIn(min = StanceTheme.sizes.touchTarget).padding(start = StanceSpacing.space4),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(heading.orEmpty(), style = StanceTheme.typography.label, color = c.fgMuted, modifier = Modifier.weight(1f))
                if (copyable) StanceCopyButton(text = code)
            }
            StanceDivider()
        }
        // Code is written left to right in every language.
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
            val digits = lines.size.toString().length
            Row(modifier = Modifier.padding(vertical = StanceSpacing.space3)) {
                if (showLineNumbers) {
                    Column(modifier = Modifier.padding(start = StanceSpacing.space3).clearAndSetSemantics {}) {
                        lines.indices.forEach { index ->
                            Text(
                                (index + 1).toString().padStart(digits),
                                style = style.copy(textAlign = TextAlign.End),
                                color = c.fgSubtle,
                                maxLines = if (wrap) Int.MAX_VALUE else 1,
                                modifier = Modifier.widthIn(min = StanceSpacing.space3 * digits),
                            )
                        }
                    }
                }
                SelectionContainer(modifier = Modifier.weight(1f)) {
                    Column(
                        modifier = Modifier
                            .then(if (wrap) Modifier else Modifier.horizontalScroll(rememberScrollState()))
                            .semantics(mergeDescendants = true) {},
                        verticalArrangement = Arrangement.Top,
                    ) {
                        lines.forEachIndexed { index, line ->
                            Text(
                                line,
                                style = style,
                                color = c.fgDefault,
                                softWrap = wrap,
                                modifier = Modifier
                                    .then(if (wrap) Modifier.fillMaxWidth() else Modifier.widthIn(min = StanceSpacing.space1))
                                    .background(if (index + 1 in highlightLines) c.bgMuted else Color.Transparent)
                                    .padding(horizontal = StanceSpacing.space4),
                            )
                        }
                    }
                }
            }
        }
    }
}
