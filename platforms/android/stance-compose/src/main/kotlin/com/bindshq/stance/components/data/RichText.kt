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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.stateDescription
import com.bindshq.stance.R
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
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

    /** A list of checkboxes, written `- [ ] open` and `- [x] done`. */
    data class TaskList(val items: List<StanceMarkdownTask>) : StanceMarkdownBlock

    /** A pipe table. Every row has as many cells as [header]. */
    data class Table(val header: List<String>, val numeric: List<Boolean>, val rows: List<List<String>>) : StanceMarkdownBlock

    /** An image on a line of its own, written `![alt](url)`. */
    data class Image(val alt: String, val url: String) : StanceMarkdownBlock
}

/** One item of a Markdown task list. */
internal data class StanceMarkdownTask(val checked: Boolean, val text: String)

private val headingPattern = Regex("^(#{1,6})\\s+(.*?)\\s*#*\\s*$")
private val bulletPattern = Regex("^\\s{0,3}[-*+]\\s+(.*)$")
private val orderedPattern = Regex("^\\s{0,3}(\\d{1,9})[.)]\\s+(.*)$")
private val rulePattern = Regex("^\\s{0,3}([-*_])(\\s*\\1){2,}\\s*$")
private val taskPattern = Regex("^\\s{0,3}[-*+]\\s+\\[([ xX])]\\s+(.*)$")
private val tableRulePattern = Regex("^\\s*\\|?\\s*:?-+:?\\s*(\\|\\s*:?-+:?\\s*)*\\|?\\s*$")
private val imagePattern = Regex("^!\\[([^\\]]*)]\\(\\s*([^)\\s]+)(?:\\s+\"[^\"]*\")?\\s*\\)$")

/** The cells of one table line, without the outer pipes. */
private fun tableCells(line: String): List<String> =
    line.trim().removePrefix("|").removeSuffix("|").split("|").map { it.trim() }

private fun isTableStart(lines: List<String>, i: Int): Boolean =
    lines[i].contains('|') && i + 1 < lines.size && lines[i + 1].contains('-') && tableRulePattern.matches(lines[i + 1]) &&
        tableCells(lines[i]).size == tableCells(lines[i + 1]).size

/**
 * Reads the common subset of Markdown into blocks: ATX headings, paragraphs, bullet and numbered
 * lists, task lists, block quotes, fenced code, pipe tables, images on their own line and
 * horizontal rules. Anything else is a paragraph, so text is never lost. A code fence that is
 * never closed runs to the end, which is what a response looks like while it is still arriving.
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
            isTableStart(lines, i) -> {
                flush()
                val header = tableCells(line)
                // A column whose rule ends with a colon is right aligned, as numbers are.
                val numeric = tableCells(lines[i + 1]).map { it.endsWith(":") && !it.startsWith(":") }
                val rows = mutableListOf<List<String>>()
                i += 2
                while (i < lines.size && lines[i].isNotBlank() && lines[i].contains('|')) {
                    val cells = tableCells(lines[i++])
                    rows += List(header.size) { cells.getOrElse(it) { "" } }
                }
                blocks += StanceMarkdownBlock.Table(header, numeric, rows)
                continue
            }
            imagePattern.matches(trimmed) -> {
                flush()
                val match = imagePattern.find(trimmed)!!
                blocks += StanceMarkdownBlock.Image(match.groupValues[1], match.groupValues[2])
            }
            rulePattern.matches(line) -> {
                flush()
                blocks += StanceMarkdownBlock.Rule
            }
            headingPattern.matches(trimmed) -> {
                flush()
                val match = headingPattern.find(trimmed)!!
                blocks += StanceMarkdownBlock.Heading(match.groupValues[1].length, match.groupValues[2])
            }
            taskPattern.matches(line) -> {
                flush()
                val items = mutableListOf<StanceMarkdownTask>()
                while (i < lines.size && taskPattern.matches(lines[i])) {
                    val match = taskPattern.find(lines[i++])!!
                    items += StanceMarkdownTask(match.groupValues[1] != " ", match.groupValues[2])
                }
                blocks += StanceMarkdownBlock.TaskList(items)
                continue
            }
            bulletPattern.matches(line) -> {
                flush()
                val items = mutableListOf<String>()
                while (i < lines.size && bulletPattern.matches(lines[i]) && !taskPattern.matches(lines[i])) {
                    items += bulletPattern.find(lines[i++])!!.groupValues[1]
                }
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

/**
 * Markdown that is still arriving, trimmed so that what is on screen never shows half a
 * construct. Complete lines are kept as they are. On the line being written, an opening `**`,
 * `*`, `~~` or backtick with no partner yet is dropped, and an unfinished link or image keeps
 * only its words. A table is held back until its header and rule lines are both in, and so is a
 * block marker with nothing after it. Inside an
 * open code fence nothing changes, since the parser already runs an unclosed fence to the end.
 */
internal fun stanceStreamingMarkdown(markdown: String): String {
    val text = markdown.replace("\r\n", "\n")
    var lines = text.split("\n")
    if (lines.count { it.trim().startsWith("```") } % 2 == 1) return text
    // The line being written may have just ended: look past one trailing line break.
    val written = if (lines.size > 1 && lines.last().isEmpty()) lines.dropLast(1) else lines
    val table = written.takeLastWhile { it.trim().startsWith("|") }
    if (table.size in 1..2 && !isTableStart(table, 0)) lines = written.dropLast(table.size)
    // A block marker with nothing after it yet: the start of a heading, list item, quote or fence.
    if (lines.isNotEmpty() && openBlockMarker.matches(lines.last())) lines = lines.dropLast(1)
    if (lines.isEmpty()) return ""
    // The line that closes a fence is complete as it is.
    if (lines.last().trim().startsWith("```")) return lines.joinToString("\n")
    return (lines.dropLast(1) + closeInlineMarkdown(lines.last())).joinToString("\n")
}

private val openBlockMarker = Regex("^\\s{0,3}(#{1,6}|[-+>]|`{1,2})\\s?$")

private val openLinkTarget = Regex("!?\\[([^\\]]*)]\\([^)]*$")
private val openLinkText = Regex("!?\\[([^\\]]*)$")

private fun closeInlineMarkdown(line: String): String {
    var text = openLinkText.replace(openLinkTarget.replace(line, "$1"), "$1")
    for (marker in listOf("`", "**", "__", "~~")) {
        if (text.windowed(marker.length).count { it == marker } % 2 == 1) {
            val at = text.lastIndexOf(marker)
            text = text.removeRange(at, at + marker.length)
        }
    }
    // A single asterisk opens emphasis unless it is a list bullet or half of a strong marker.
    val bullet = bulletPattern.matches(text) && text.trimStart().startsWith("*")
    val singles = text.indices.filter { i ->
        text[i] == '*' && text.getOrNull(i - 1) != '*' && text.getOrNull(i + 1) != '*' && !(bullet && i == text.indexOf('*'))
    }
    if (singles.size % 2 == 1) text = text.removeRange(singles.last(), singles.last() + 1)
    return text
}

/** The span styles used for inline Markdown. */
@Immutable
internal data class StanceMarkdownStyles(val code: SpanStyle, val link: TextLinkStyles)

/**
 * Turns inline Markdown into styled text: strong (`**` or `__`), emphasis (`*` or `_`),
 * strikethrough (`~~`), code (backticks) and links (`[text](url)`). A backslash escapes the next
 * character. Unclosed markers are kept as typed.
 */
internal fun stanceInlineMarkdown(
    text: String,
    styles: StanceMarkdownStyles,
    onLinkClick: ((String) -> Unit)? = null,
    allowLink: (String) -> Boolean = { true },
): AnnotatedString = buildAnnotatedString { appendInline(text, styles, onLinkClick, allowLink) }

/**
 * The address a generated link may open, or null. Only http, https and mailto pass, so a model
 * cannot hand the reader a `javascript:`, `intent:`, `file:` or `content:` link.
 */
internal fun stanceSafeLink(url: String): String? {
    val address = url.trim()
    val scheme = address.substringBefore(':', "").lowercase()
    return address.takeIf { scheme in SAFE_SCHEMES && address.none { char -> char.isWhitespace() || char.isISOControl() } }
}

private val SAFE_SCHEMES = setOf("http", "https", "mailto")

/**
 * Where the link that opens with the bracket at [open] ends: the index of the parenthesis that
 * closes its address, or -1 when this is not a link. The text ends at the first closing bracket,
 * which must be followed by the address, and parentheses inside the address are balanced.
 */
private fun linkEnd(text: String, open: Int): Int {
    val middle = text.indexOf(']', open)
    if (middle <= open || text.getOrNull(middle + 1) != '(') return -1
    var depth = 0
    for (index in middle + 1 until text.length) {
        when (text[index]) {
            '(' -> depth++
            ')' -> if (--depth == 0) return index
            '\n' -> return -1
        }
    }
    return -1
}

private fun AnnotatedString.Builder.appendInline(
    text: String,
    styles: StanceMarkdownStyles,
    onLinkClick: ((String) -> Unit)?,
    allowLink: (String) -> Boolean,
) {
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
                withStyle(SpanStyle(fontWeight = FontWeight.SemiBold)) { appendInline(text.substring(i + 2, end), styles, onLinkClick, allowLink) }
                i = end + 2
            }
            pair == "~~" && closing("~~", i + 2) > 0 -> {
                val end = closing("~~", i + 2)
                withStyle(SpanStyle(textDecoration = TextDecoration.LineThrough)) { appendInline(text.substring(i + 2, end), styles, onLinkClick, allowLink) }
                i = end + 2
            }
            (char == '*' || (char == '_' && (i == 0 || !text[i - 1].isLetterOrDigit()))) && closing(char.toString(), i + 1) > 0 &&
                !text[i + 1].isWhitespace() -> {
                val end = closing(char.toString(), i + 1)
                withStyle(SpanStyle(fontStyle = FontStyle.Italic)) { appendInline(text.substring(i + 1, end), styles, onLinkClick, allowLink) }
                i = end + 1
            }
            // An image inside a line of text is shown as its description: text never carries pictures.
            char == '!' && pair == "![" && linkEnd(text, i + 1) > 0 -> {
                append(text.substring(i + 2, text.indexOf(']', i)))
                i = linkEnd(text, i + 1) + 1
            }
            char == '[' && linkEnd(text, i) > 0 -> {
                val middle = text.indexOf(']', i)
                val end = linkEnd(text, i)
                val url = text.substring(middle + 2, end).trim()
                if (allowLink(url)) {
                    val listener = onLinkClick?.let { open -> LinkInteractionListener { open(url) } }
                    withLink(LinkAnnotation.Url(url, styles.link, listener)) { appendInline(text.substring(i + 1, middle), styles, onLinkClick, allowLink) }
                } else {
                    // A link that may not be opened keeps its words and loses its address.
                    appendInline(text.substring(i + 1, middle), styles, onLinkClick, allowLink)
                }
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
 * Renders Markdown with Stance type styles: headings, paragraphs, bullet, numbered and task lists,
 * quotes, tables, code blocks, rules, strong, emphasis, inline code and links. Images show as
 * their description.
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
    val styles = stanceMarkdownStyles()
    val blocks = remember(markdown) { stanceParseMarkdown(markdown) }
    StanceMarkdownBlocks(blocks, modifier, style, inline = { stanceInlineMarkdown(it, styles, onLinkClick) })
}

/** The inline span styles of the active theme. */
@Composable
internal fun stanceMarkdownStyles(): StanceMarkdownStyles {
    val c = StanceTheme.colors
    return remember(c) {
        StanceMarkdownStyles(
            code = SpanStyle(fontFamily = FontFamily.Monospace, background = c.bgMuted),
            link = TextLinkStyles(style = SpanStyle(color = c.fgLink, textDecoration = TextDecoration.Underline)),
        )
    }
}

/**
 * Draws parsed Markdown blocks. Shared by [StanceRichText] and the AI Markdown renderer.
 *
 * @param inline Turns the inline Markdown of a block into styled text.
 * @param headingOffset Added to every heading level, so a document can start below the page title.
 * @param code Draws a fenced code block.
 * @param image Draws an image block. The default shows its description as text.
 * @param afterText Called under each block of running text with its Markdown, for example to add citation chips.
 */
@Composable
internal fun StanceMarkdownBlocks(
    blocks: List<StanceMarkdownBlock>,
    modifier: Modifier = Modifier,
    style: TextStyle = StanceTheme.typography.body,
    inline: (String) -> AnnotatedString,
    headingOffset: Int = 0,
    code: @Composable (StanceMarkdownBlock.Code) -> Unit = { StanceCodeBlock(it.code, language = it.language, copyable = false) },
    image: @Composable (StanceMarkdownBlock.Image) -> Unit = { Text(it.alt, style = style, color = StanceTheme.colors.fgMuted) },
    afterText: (@Composable (String) -> Unit)? = null,
) {
    val c = StanceTheme.colors
    val type = StanceTheme.typography
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
        blocks.forEach { block ->
            when (block) {
                is StanceMarkdownBlock.Heading -> Text(
                    inline(block.text),
                    style = when (block.level + headingOffset) {
                        1 -> type.headingLarge
                        2 -> type.headingMedium
                        3 -> type.headingSmall
                        else -> type.title
                    },
                    color = c.fgDefault,
                    modifier = Modifier.semantics { heading() },
                )
                is StanceMarkdownBlock.Paragraph -> {
                    Text(inline(block.text), style = style, color = c.fgDefault)
                    afterText?.invoke(block.text)
                }
                is StanceMarkdownBlock.BulletList -> {
                    MarkdownList(block.items.map { BULLET to inline(it) }, style)
                    afterText?.invoke(block.items.joinToString("\n"))
                }
                is StanceMarkdownBlock.OrderedList -> {
                    MarkdownList(block.items.mapIndexed { index, item -> "${block.start + index}." to inline(item) }, style)
                    afterText?.invoke(block.items.joinToString("\n"))
                }
                is StanceMarkdownBlock.TaskList -> MarkdownTasks(block.items, style, inline)
                is StanceMarkdownBlock.Quote -> {
                    Row(modifier = Modifier.height(IntrinsicSize.Min)) {
                        StanceDivider(vertical = true, thickness = StanceSpacing.space05, color = c.borderStrong, modifier = Modifier.fillMaxHeight())
                        Text(inline(block.text), style = style, color = c.fgMuted, modifier = Modifier.padding(start = StanceSpacing.space3))
                    }
                    afterText?.invoke(block.text)
                }
                is StanceMarkdownBlock.Table -> StanceDataTable(
                    columns = block.header.mapIndexed { index, header ->
                        StanceTableColumn<List<String>>(header, numeric = block.numeric.getOrElse(index) { false }) { row -> row.getOrElse(index) { "" } }
                    },
                    rows = block.rows,
                )
                is StanceMarkdownBlock.Code -> code(block)
                is StanceMarkdownBlock.Image -> image(block)
                StanceMarkdownBlock.Rule -> StanceDivider()
            }
        }
    }
}

/** A task list: each item is read as its text with Checked or Not checked, and cannot be toggled. */
@Composable
private fun MarkdownTasks(items: List<StanceMarkdownTask>, style: TextStyle, inline: (String) -> AnnotatedString) {
    val c = StanceTheme.colors
    val checkedText = stringResource(R.string.stance_checked)
    val uncheckedText = stringResource(R.string.stance_not_checked)
    Column(
        modifier = Modifier.semantics { collectionInfo = CollectionInfo(rowCount = items.size, columnCount = 1) },
        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
    ) {
        items.forEachIndexed { index, item ->
            Row(
                modifier = Modifier.semantics(mergeDescendants = true) {
                    collectionItemInfo = CollectionItemInfo(rowIndex = index, rowSpan = 1, columnIndex = 0, columnSpan = 1)
                    stateDescription = if (item.checked) checkedText else uncheckedText
                },
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            ) {
                StanceIcon(
                    if (item.checked) StanceIcons.CheckCircle else StanceIcons.Circle,
                    contentDescription = null,
                    size = StanceSizes.iconSmall,
                    tint = if (item.checked) c.fgDefault else c.fgMuted,
                    modifier = Modifier.padding(top = StanceSpacing.space05).widthIn(min = StanceSpacing.space5),
                )
                Text(inline(item.text), style = style, color = if (item.checked) c.fgMuted else c.fgDefault, modifier = Modifier.weight(1f))
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
