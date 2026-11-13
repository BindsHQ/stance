@file:OptIn(ExperimentalLayoutApi::class)

package com.bindshq.stance.components.ai

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import com.bindshq.stance.components.data.StanceCodeBlock
import com.bindshq.stance.components.data.StanceMarkdownBlocks
import com.bindshq.stance.components.data.stanceInlineMarkdown
import com.bindshq.stance.components.data.stanceMarkdownStyles
import com.bindshq.stance.components.data.stanceParseMarkdown
import com.bindshq.stance.components.data.stanceSafeLink
import com.bindshq.stance.components.data.stanceStreamingMarkdown
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

private val citationMarker = Regex("\\[(\\d{1,3})](?!\\()")

/** The citation numbers written as `[n]` in [text] that have a source in [known], in order, once each. */
internal fun stanceCitationIndexes(text: String, known: Set<Int>): List<Int> =
    citationMarker.findAll(text).map { it.groupValues[1].toInt() }.filter { it in known }.distinct().toList()

/** Whether an image address may be loaded: http or https only. */
internal fun stanceSafeImage(url: String): Boolean = stanceSafeLink(url)?.startsWith("mailto", ignoreCase = true) == false

/**
 * Renders model Markdown safely with Stance typography: headings, paragraphs, bullet, numbered
 * and task lists, quotes, tables, rules, fenced code in a [StanceCodeBlock] with highlighting,
 * strong, emphasis, strikethrough, inline code and links.
 *
 * It extends the [com.bindshq.stance.components.data.StanceRichText] parser and is built for
 * generated text.
 *
 * Markdown is parsed to text and composables. Raw HTML is shown as text and never run. Links are
 * link annotations and open only http, https and mailto addresses: any other scheme keeps its
 * words and loses its address. Images are off by default and show as their description. With
 * [allowImages] and an [image] slot, an image on its own line with a description and an http or
 * https address is handed to the slot.
 *
 * While [streaming], half written constructs never flash on screen: an open emphasis marker or
 * link on the line being written is held back, a table waits for its header, and an open code
 * fence already renders as code. Code blocks get their copy button once streaming ends.
 *
 * A `[n]` marker with a source in [citations] adds a [StanceCitationChip] under its block, where
 * it has a full size touch target.
 *
 * Headings are marked as headings, lists announce their size, and tables read row by row.
 *
 * @param citations Sources by the number that cites them, starting at 1.
 * @param onCitationOpen Opens a cited source from its preview.
 * @param image Draws an allowed image from its address and description. Stance does no networking.
 * @param headingBaseLevel The level a top heading is drawn at, from 1. It is 2 by default, so a generated `#` heading sits under the screen's own title.
 */
@Composable
public fun StanceMarkdownRenderer(
    markdown: String,
    modifier: Modifier = Modifier,
    streaming: Boolean = false,
    style: TextStyle = StanceTheme.typography.body,
    onLinkClick: ((String) -> Unit)? = null,
    citations: Map<Int, StanceSource> = emptyMap(),
    onCitationOpen: ((StanceSource) -> Unit)? = null,
    allowImages: Boolean = false,
    image: (@Composable (url: String, description: String) -> Unit)? = null,
    headingBaseLevel: Int = 2,
) {
    val styles = stanceMarkdownStyles()
    val blocks = remember(markdown, streaming) { stanceParseMarkdown(if (streaming) stanceStreamingMarkdown(markdown) else markdown) }
    StanceMarkdownBlocks(
        blocks = blocks,
        modifier = modifier,
        style = style,
        inline = { stanceInlineMarkdown(it, styles, onLinkClick, allowLink = { url -> stanceSafeLink(url) != null }) },
        headingOffset = (headingBaseLevel - 1).coerceAtLeast(0),
        code = { StanceCodeBlock(it.code, language = it.language, copyable = !streaming) },
        image = { block ->
            if (allowImages && image != null && block.alt.isNotBlank() && stanceSafeImage(block.url)) {
                image(block.url, block.alt)
            } else {
                Text(block.alt, style = style, color = StanceTheme.colors.fgMuted)
            }
        },
        afterText = if (citations.isEmpty()) {
            null
        } else {
            { text ->
                val cited = remember(text, citations) { stanceCitationIndexes(text, citations.keys) }
                if (cited.isNotEmpty()) {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1)) {
                        cited.forEach { index -> StanceCitationChip(index, citations.getValue(index), onOpen = onCitationOpen) }
                    }
                }
            }
        },
    )
}
