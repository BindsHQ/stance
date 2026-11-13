package com.bindshq.stance.components.data

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.CollectionInfo
import androidx.compose.ui.semantics.CollectionItemInfo
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.collectionInfo
import androidx.compose.ui.semantics.collectionItemInfo
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.LinkInteractionListener
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withLink
import androidx.compose.ui.text.withStyle
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

// ───────────── Markdown model ─────────────

/** A block of Markdown, as [stanceParseMarkdown] reads it. Inline text keeps its Markdown. */
internal sealed interface StanceMarkdownBlock {
    data class Heading(val level: Int, val text: String) : StanceMarkdownBlock
    data class Paragraph(val text: String) : StanceMarkdownBlock
    data class BulletList(val items: List<String>) : StanceMarkdownBlock
    data class OrderedList(val start: Int, val items: List<String>) : StanceMarkdownBlock
    data class Quote(val text: String) : StanceMarkdownBlock
    data class Code(val code: String, val language: String?) : StanceMarkdownBlock
    data object Rule : StanceMarkdownBlock
}

private val headingPattern = Regex("^(#{1,6})\\s+(.*?)\\s*#*\\s*$")
private val bulletPattern = Regex("^\\s{0,3}[-*+]\\s+(.*)$")
private val orderedPattern = Regex("^\\s{0,3}(\\d{1,9})[.)]\\s+(.*)$")
private val rulePattern = Regex("^\\s{0,3}([-*_])(\\s*\\1){2,}\\s*$")

/**
 * Reads the common subset of Markdown into blocks: ATX headings, paragraphs, bullet and numbered
 * lists, block quotes, fenced code and horizontal rules. Anything else is a paragraph, so text is
 * never lost.
 */
internal fun stanceParseMarkdown(markdown: String): List<StanceMarkdownBlock> {
    val blocks = mutableListOf<StanceMarkdownBlock>()
    val lines = markdown.replace("\r\n", "\n").split("\n")
    var i = 0
    val paragraph = mutableListOf<String>()
    fun flush() {
        if (paragraph.isNotEmpty()) blocks += StanceMarkdownBlock.Paragraph(paragraph.joinToString(" ") { it.trim() })
        paragraph.clear()
    }
    while (i < lines.size) {
        val line = lines[i]
        val trimmed = line.trim()
        when {
            trimmed.startsWith("```") -> {
                flush()
                val language = trimmed.removePrefix("```").trim().ifEmpty { null }
                val code = mutableListOf<String>()
                i++
                while (i < lines.size && !lines[i].trim().startsWith("```")) code += lines[i++]
                blocks += StanceMarkdownBlock.Code(code.joinToString("\n"), language)
            }
            trimmed.isEmpty() -> flush()
            rulePattern.matches(line) -> {
                flush()
                blocks += StanceMarkdownBlock.Rule
            }
            headingPattern.matches(trimmed) -> {
                flush()
                val match = headingPattern.find(trimmed)!!
                blocks += StanceMarkdownBlock.Heading(match.groupValues[1].length, match.groupValues[2])
            }
            bulletPattern.matches(line) -> {
                flush()
                val items = mutableListOf<String>()
                while (i < lines.size && bulletPattern.matches(lines[i])) items += bulletPattern.find(lines[i++])!!.groupValues[1]
                blocks += StanceMarkdownBlock.BulletList(items)
                continue
            }
            orderedPattern.matches(line) -> {
                flush()
                val start = orderedPattern.find(line)!!.groupValues[1].toInt()
                val items = mutableListOf<String>()
                while (i < lines.size && orderedPattern.matches(lines[i])) items += orderedPattern.find(lines[i++])!!.groupValues[2]
                blocks += StanceMarkdownBlock.OrderedList(start, items)
                continue
            }
            trimmed.startsWith(">") -> {
                flush()
                val quote = mutableListOf<String>()
                while (i < lines.size && lines[i].trim().startsWith(">")) quote += lines[i++].trim().removePrefix(">").trim()
                blocks += StanceMarkdownBlock.Quote(quote.joinToString(" "))
                continue
            }
            else -> paragraph += line
        }
        i++
    }
    flush()
    return blocks
}

/** The span styles used for inline Markdown. */
@Immutable
internal data class StanceMarkdownStyles(val code: SpanStyle, val link: TextLinkStyles)

/**
 * Turns inline Markdown into styled text: strong (`**` or `__`), emphasis (`*` or `_`),
 * strikethrough (`~~`), code (backticks) and links (`[text](url)`). A backslash escapes the next
 * character. Unclosed markers are kept as typed.
 */
internal fun stanceInlineMarkdown(text: String, styles: StanceMarkdownStyles, onLinkClick: ((String) -> Unit)? = null): AnnotatedString =
    buildAnnotatedString { appendInline(text, styles, onLinkClick) }

private fun AnnotatedString.Builder.appendInline(text: String, styles: StanceMarkdownStyles, onLinkClick: ((String) -> Unit)?) {
    var i = 0
    fun closing(marker: String, from: Int): Int {
        val end = text.indexOf(marker, from)
        return if (end > from) end else -1
    }
    while (i < text.length) {
        val char = text[i]
        val pair = if (i + 1 < text.length) text.substring(i, i + 2) else ""
        when {
            char == '\\' && i + 1 < text.length -> {
                append(text[i + 1])
                i += 2
            }
            char == '`' && closing("`", i + 1) > 0 -> {
                val end = closing("`", i + 1)
                withStyle(styles.code) { append(text.substring(i + 1, end)) }
                i = end + 1
            }
            (pair == "**" || pair == "__") && closing(pair, i + 2) > 0 -> {
                val end = closing(pair, i + 2)
                withStyle(SpanStyle(fontWeight = FontWeight.SemiBold)) { appendInline(text.substring(i + 2, end), styles, onLinkClick) }
                i = end + 2
            }
            pair == "~~" && closing("~~", i + 2) > 0 -> {
                val end = closing("~~", i + 2)
                withStyle(SpanStyle(textDecoration = TextDecoration.LineThrough)) { appendInline(text.substring(i + 2, end), styles, onLinkClick) }
                i = end + 2
            }
            (char == '*' || (char == '_' && (i == 0 || !text[i - 1].isLetterOrDigit()))) && closing(char.toString(), i + 1) > 0 &&
                !text[i + 1].isWhitespace() -> {
                val end = closing(char.toString(), i + 1)
                withStyle(SpanStyle(fontStyle = FontStyle.Italic)) { appendInline(text.substring(i + 1, end), styles, onLinkClick) }
                i = end + 1
            }
            char == '[' && text.indexOf("](", i) > i && text.indexOf(')', text.indexOf("](", i)) > 0 -> {
                val middle = text.indexOf("](", i)
                val end = text.indexOf(')', middle)
                val url = text.substring(middle + 2, end).trim()
                val listener = onLinkClick?.let { open -> LinkInteractionListener { open(url) } }
                withLink(LinkAnnotation.Url(url, styles.link, listener)) { appendInline(text.substring(i + 1, middle), styles, onLinkClick) }
                i = end + 1
            }
            else -> {
                append(char)
                i++
            }
        }
    }
}

// ───────────── Rendering ─────────────

/**
 * Renders Markdown with Stance type styles: headings, paragraphs, bullet and numbered lists,
 * quotes, code blocks, rules, strong, emphasis, inline code and links.
 *
 * Each block is a separate Compose [Text] built from an [AnnotatedString]. Headings are marked as
 * headings, lists announce their size and each item's position, and links are real link
 * annotations that TalkBack lists and opens. Raw HTML is shown as text, never run.
 *
 * @param onLinkClick Handles a tapped link. Defaults to opening it with the system.
 * @param style The body style. Headings scale from the Stance heading styles.
 */
@Composable
public fun StanceRichText(
    markdown: String,
    modifier: Modifier = Modifier,
    style: TextStyle = StanceTheme.typography.body,
    onLinkClick: ((String) -> Unit)? = null,
) {
    val c = StanceTheme.colors
    val type = StanceTheme.typography
    val styles = StanceMarkdownStyles(
        code = SpanStyle(fontFamily = FontFamily.Monospace, background = c.bgMuted),
        link = TextLinkStyles(style = SpanStyle(color = c.fgLink, textDecoration = TextDecoration.Underline)),
    )
    val blocks = remember(markdown) { stanceParseMarkdown(markdown) }
    fun inline(text: String) = stanceInlineMarkdown(text, styles, onLinkClick)
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
        blocks.forEach { block ->
            when (block) {
                is StanceMarkdownBlock.Heading -> Text(
                    inline(block.text),
                    style = when (block.level) {
                        1 -> type.headingLarge
                        2 -> type.headingMedium
                        3 -> type.headingSmall
                        else -> type.title
                    },
                    color = c.fgDefault,
                    modifier = Modifier.semantics { heading() },
                )
                is StanceMarkdownBlock.Paragraph -> Text(inline(block.text), style = style, color = c.fgDefault)
                is StanceMarkdownBlock.BulletList -> MarkdownList(block.items.map { BULLET to inline(it) }, style)
                is StanceMarkdownBlock.OrderedList -> MarkdownList(
                    block.items.mapIndexed { index, item -> "${block.start + index}." to inline(item) },
                    style,
                )
                is StanceMarkdownBlock.Quote -> Row(modifier = Modifier.height(IntrinsicSize.Min)) {
                    StanceDivider(vertical = true, thickness = StanceSpacing.space05, color = c.borderStrong, modifier = Modifier.fillMaxHeight())
                    Text(inline(block.text), style = style, color = c.fgMuted, modifier = Modifier.padding(start = StanceSpacing.space3))
                }
                is StanceMarkdownBlock.Code -> StanceCodeBlock(block.code, language = block.language, copyable = false)
                StanceMarkdownBlock.Rule -> StanceDivider()
            }
        }
    }
}

@Composable
private fun MarkdownList(items: List<Pair<String, AnnotatedString>>, style: TextStyle) {
    val c = StanceTheme.colors
    Column(
        modifier = Modifier.semantics { collectionInfo = CollectionInfo(rowCount = items.size, columnCount = 1) },
        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
    ) {
        items.forEachIndexed { index, (marker, text) ->
            Row(
                modifier = Modifier.semantics {
                    collectionItemInfo = CollectionItemInfo(rowIndex = index, rowSpan = 1, columnIndex = 0, columnSpan = 1)
                },
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            ) {
                // The marker is visual; the list semantics give the position.
                Text(
                    marker,
                    style = style.copy(textAlign = TextAlign.End),
                    color = c.fgMuted,
                    modifier = Modifier.widthIn(min = StanceSpacing.space5).clearAndSetSemantics {},
                )
                Text(text, style = style, color = c.fgDefault, modifier = Modifier.weight(1f))
            }
        }
    }
}

private const val BULLET = "•"
