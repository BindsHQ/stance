package com.bindshq.stance.components.data

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextLayoutResult
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
 * With a [language] the highlighter knows (ts, tsx, js, jsx, html, css, bash, json, kotlin and
 * swift), comments, strings, keywords, numbers and names are told apart by ink step, weight and
 * slant: Stance has no syntax hues. The sample is one styled text, so selecting and copying work
 * as they do for plain code. Any other language renders plain.
 *
 * @param title Shown in the header, for example a file name.
 * @param language The language to highlight, also shown in the header when there is no title, for example "kotlin".
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
    val shown = remember(code) { code.removeSuffix("\n") }
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
            val highlighted = rememberStanceHighlightedCode(shown, language)
            var layout by remember { mutableStateOf<TextLayoutResult?>(null) }
            val starts = remember(shown) { stanceLineStarts(shown) }
            val emphasis = c.bgMuted
            Row(
                modifier = Modifier
                    .padding(vertical = StanceSpacing.space3)
                    .drawBehind {
                        // Emphasised lines are bands behind the gutter and the code, read from the text layout.
                        val result = layout ?: return@drawBehind
                        val last = result.layoutInput.text.length
                        for (line in highlightLines) {
                            val from = starts.getOrNull(line - 1) ?: continue
                            val to = (starts.getOrNull(line) ?: (last + 1)) - 1
                            if (from > last) continue
                            val top = result.getLineTop(result.getLineForOffset(from))
                            val bottom = result.getLineBottom(result.getLineForOffset(to.coerceIn(from, last)))
                            drawRect(emphasis, topLeft = Offset(0f, top), size = Size(size.width, bottom - top))
                        }
                    },
            ) {
                if (showLineNumbers) {
                    val digits = lines.size.toString().length
                    val numbers = remember(lines.size) { (1..lines.size).joinToString("\n") { it.toString().padStart(digits) } }
                    Text(
                        numbers,
                        style = style.copy(textAlign = TextAlign.End),
                        color = c.fgSubtle,
                        modifier = Modifier
                            .padding(start = StanceSpacing.space3)
                            .widthIn(min = StanceSpacing.space3 * digits)
                            .clearAndSetSemantics {},
                    )
                }
                SelectionContainer(modifier = Modifier.weight(1f)) {
                    // One text for the whole sample: a selection runs across lines and tokens are spans, not nodes.
                    Text(
                        highlighted,
                        style = style,
                        color = c.fgDefault,
                        softWrap = wrap,
                        onTextLayout = { layout = it },
                        modifier = Modifier
                            .then(if (wrap) Modifier.fillMaxWidth() else Modifier.horizontalScroll(rememberScrollState()))
                            .padding(horizontal = StanceSpacing.space4),
                    )
                }
            }
        }
    }
}

/** The offset at which each line of [code] starts. */
internal fun stanceLineStarts(code: String): List<Int> = buildList {
    add(0)
    code.forEachIndexed { index, char -> if (char == '\n') add(index + 1) }
}
