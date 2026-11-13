package com.bindshq.stance.components.data

import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import com.bindshq.stance.theme.StanceTheme
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.regex.Pattern

// A deliberately small, safe tokenizer for documentation grade highlighting, ported from the web
// (packages/react/src/components/code-block/highlight.ts). Tokens become spans of one
// AnnotatedString; code is never interpreted.

/** The kinds of token the highlighter tells apart. The names match the web token types. */
internal enum class StanceCodeTokenType { Comment, String, Keyword, Number, Tag, Attr, Punct, Fn, Prop, Plain }

/** A run of code of one [type]. */
internal data class StanceCodeToken(val type: StanceCodeTokenType, val value: String)

private class Rule(val type: StanceCodeTokenType, pattern: String, flags: Int = 0) {
    val pattern: Pattern = Pattern.compile(pattern, flags)
}

// Character classes are spelled out so they mean the same on every regex engine: Android's
// treats \w and \d as Unicode classes, the web's as ASCII.
private const val W = "A-Za-z0-9_"

// A word boundary, as \b reads it on the web.
private const val B = "(?:(?<=[$W])(?![$W])|(?<![$W])(?=[$W]))"

private const val JS_KEYWORDS =
    "import|from|export|default|const|let|var|function|return|if|else|for|while|of|in|new|class|extends|type|interface|" +
        "async|await|true|false|null|undefined|as|typeof|this|try|catch|throw|switch|case|break|void"

private const val KOTLIN_KEYWORDS =
    "package|import|class|interface|object|fun|val|var|return|if|else|when|for|while|do|in|is|as|null|true|false|this|super|" +
        "try|catch|finally|throw|break|continue|private|public|internal|protected|override|open|abstract|sealed|data|enum|" +
        "companion|suspend|inline|const|lateinit|by|typealias|constructor|init|operator|annotation|vararg|out|where"

private const val SWIFT_KEYWORDS =
    "import|class|struct|enum|protocol|extension|func|let|var|return|if|else|guard|switch|case|default|for|while|repeat|in|is|" +
        "as|nil|true|false|self|Self|super|try|catch|throw|throws|rethrows|do|break|continue|private|fileprivate|public|" +
        "internal|open|static|final|override|mutating|init|deinit|async|await|some|any|where|typealias|defer|lazy|weak|inout"

private val COMMENT = "//[^\\n]*|/\\*[\\s\\S]*?\\*/"
private const val PUNCT = "[{}()\\[\\];,.<>/=+\\-*!?:&|]+"

// The web number rule, and one for Kotlin and Swift literals such as 0xFF, 1_000, 2.5f and 10L.
private const val WEB_NUMBER = "[0-9][0-9_.]*$B"
private const val NATIVE_NUMBER = "(?:0[xXbB][0-9A-Fa-f_]+|[0-9][0-9_]*(?:\\.[0-9][0-9_]*)?(?:[eE][+-]?[0-9]+)?)[fFLuU]*(?![$W])"

private fun cStyle(keywords: String, strings: String, annotations: Boolean): List<Rule> = buildList {
    add(Rule(StanceCodeTokenType.Comment, COMMENT))
    add(Rule(StanceCodeTokenType.String, strings))
    if (annotations) add(Rule(StanceCodeTokenType.Attr, "[@#][A-Za-z_][$W.]*")) else add(Rule(StanceCodeTokenType.Tag, "</?[A-Za-z][$W.]*"))
    add(Rule(StanceCodeTokenType.Keyword, "(?:$keywords)(?![$W])"))
    add(Rule(StanceCodeTokenType.Number, if (annotations) NATIVE_NUMBER else WEB_NUMBER))
    add(Rule(StanceCodeTokenType.Fn, "[A-Za-z_$][$W$]*(?=\\s*\\()"))
    if (!annotations) add(Rule(StanceCodeTokenType.Attr, "[A-Za-z_-][$W-]*(?==)"))
    add(Rule(StanceCodeTokenType.Plain, "[A-Za-z_$][$W$]*"))
    add(Rule(StanceCodeTokenType.Punct, PUNCT))
}

private val JS = cStyle(JS_KEYWORDS, "`(?:\\\\.|[^`\\\\])*`|'(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\"", annotations = false)

// Kotlin and Swift have no web counterpart yet. They follow the same order of rules, with raw
// strings and with annotations and compiler directives as attributes.
private const val QUOTED = "\"\"\"[\\s\\S]*?\"\"\"|\"(?:\\\\.|[^\"\\\\\\n])*\""
private val KOTLIN = cStyle(KOTLIN_KEYWORDS, "$QUOTED|'(?:\\\\.|[^'\\\\\\n])*'", annotations = true)
private val SWIFT = cStyle(SWIFT_KEYWORDS, QUOTED, annotations = true)

private val CSS = listOf(
    Rule(StanceCodeTokenType.Comment, "/\\*[\\s\\S]*?\\*/"),
    Rule(StanceCodeTokenType.String, "'(?:\\\\.|[^'\\\\])*'|\"(?:\\\\.|[^\"\\\\])*\""),
    Rule(StanceCodeTokenType.Prop, "--?[a-z][$W-]*(?=\\s*:)", Pattern.CASE_INSENSITIVE),
    Rule(StanceCodeTokenType.Keyword, "@[a-z-]+"),
    Rule(StanceCodeTokenType.Fn, "[a-z-]+(?=\\()", Pattern.CASE_INSENSITIVE),
    Rule(StanceCodeTokenType.Number, "-?[0-9][0-9.]*(?:px|rem|em|%|ms|s|vh|vw|dvh|fr)?"),
    Rule(StanceCodeTokenType.Tag, "[.#]?[a-z][$W-]*", Pattern.CASE_INSENSITIVE),
    Rule(StanceCodeTokenType.Punct, "[{}():;,>+~*\\[\\]=]+"),
)

private val BASH = listOf(
    Rule(StanceCodeTokenType.Comment, "#[^\\n]*"),
    Rule(StanceCodeTokenType.String, "'(?:[^'])*'|\"(?:\\\\.|[^\"\\\\])*\""),
    Rule(StanceCodeTokenType.Keyword, "(?:npm|npx|pnpm|yarn|git|cd|export|echo|node|install|run|add)(?![$W])"),
    Rule(StanceCodeTokenType.Attr, "--?[$W-]+"),
    Rule(StanceCodeTokenType.Plain, "[^\\s'\"#]+"),
)

private val JSON = listOf(
    Rule(StanceCodeTokenType.Prop, "\"(?:\\\\.|[^\"\\\\])*\"(?=\\s*:)"),
    Rule(StanceCodeTokenType.String, "\"(?:\\\\.|[^\"\\\\])*\""),
    Rule(StanceCodeTokenType.Number, "-?[0-9][0-9.eE+-]*"),
    Rule(StanceCodeTokenType.Keyword, "(?:true|false|null)(?![$W])"),
    Rule(StanceCodeTokenType.Punct, "[{}\\[\\]:,]"),
)

private val RULES: Map<String, List<Rule>> = mapOf(
    "js" to JS, "ts" to JS, "tsx" to JS, "jsx" to JS, "html" to JS,
    "css" to CSS,
    "bash" to BASH, "sh" to BASH, "shell" to BASH,
    "json" to JSON,
    "kotlin" to KOTLIN, "kt" to KOTLIN, "kts" to KOTLIN,
    "swift" to SWIFT,
)

/** Whether [language] is one the highlighter knows. Others render as plain text. */
internal fun stanceCanHighlight(language: String?): Boolean = language != null && language.lowercase() in RULES

/**
 * Splits [code] into tokens for [language]: ts, tsx, js, jsx, html, css, bash, sh, shell, json,
 * kotlin, kt, kts or swift, ignoring case. Any other language, or none, gives the code back as
 * one plain token. The values of the tokens always join back to [code].
 */
internal fun stanceTokenize(code: String, language: String?): List<StanceCodeToken> {
    val rules = language?.let { RULES[it.lowercase()] } ?: return listOf(StanceCodeToken(StanceCodeTokenType.Plain, code))
    val tokens = ArrayList<StanceCodeToken>()
    fun push(type: StanceCodeTokenType, value: String) {
        val last = tokens.lastOrNull()
        // Neighbouring plain runs join, so whitespace does not multiply tokens.
        if (last != null && last.type == type && type == StanceCodeTokenType.Plain) {
            tokens[tokens.lastIndex] = StanceCodeToken(type, last.value + value)
        } else {
            tokens += StanceCodeToken(type, value)
        }
    }
    val matchers = rules.map { it.pattern.matcher(code) }
    val length = code.length
    var index = 0
    while (index < length) {
        var end = index
        while (end < length && code[end].isWhitespace()) end++
        if (end > index) {
            push(StanceCodeTokenType.Plain, code.substring(index, end))
            index = end
            continue
        }
        var matched = false
        for (i in rules.indices) {
            // The region starts at the reading position, so a rule sees only what is left, as on the web.
            val matcher = matchers[i].region(index, length)
            if (matcher.lookingAt() && matcher.end() > index) {
                push(rules[i].type, code.substring(index, matcher.end()))
                index = matcher.end()
                matched = true
                break
            }
        }
        if (!matched) {
            push(StanceCodeTokenType.Plain, code[index].toString())
            index++
        }
    }
    return tokens
}

/**
 * How each token kind is drawn. Stance has no syntax hues: kinds differ by ink step, weight,
 * slant and underline, as in the web code block.
 */
@Immutable
internal data class StanceCodeStyles(
    val comment: SpanStyle,
    val string: SpanStyle,
    val keyword: SpanStyle,
    val number: SpanStyle,
    val tag: SpanStyle,
    val attr: SpanStyle,
    val punct: SpanStyle,
    val fn: SpanStyle,
    val prop: SpanStyle,
) {
    fun of(type: StanceCodeTokenType): SpanStyle? = when (type) {
        StanceCodeTokenType.Comment -> comment
        StanceCodeTokenType.String -> string
        StanceCodeTokenType.Keyword -> keyword
        StanceCodeTokenType.Number -> number
        StanceCodeTokenType.Tag -> tag
        StanceCodeTokenType.Attr -> attr
        StanceCodeTokenType.Punct -> punct
        StanceCodeTokenType.Fn -> fn
        StanceCodeTokenType.Prop -> prop
        StanceCodeTokenType.Plain -> null
    }
}

/** The token styles of the active theme, mapped role for role from the web code block. */
@Composable
internal fun stanceCodeStyles(): StanceCodeStyles {
    val c = StanceTheme.colors
    return remember(c) {
        StanceCodeStyles(
            comment = SpanStyle(color = c.fgSubtle, fontStyle = FontStyle.Italic),
            string = SpanStyle(color = c.successFg),
            keyword = SpanStyle(color = c.fgDefault, fontWeight = FontWeight.SemiBold),
            number = SpanStyle(color = c.warningFg),
            tag = SpanStyle(color = c.fgDefault, fontWeight = FontWeight.Medium),
            attr = SpanStyle(color = c.fgMuted),
            punct = SpanStyle(color = c.fgSubtle),
            fn = SpanStyle(color = c.fgDefault, textDecoration = TextDecoration.Underline),
            prop = SpanStyle(color = c.fgMuted),
        )
    }
}

/** [code] as one styled string. The text is exactly [code], so selection and copy are unchanged. */
internal fun stanceHighlight(code: String, language: String?, styles: StanceCodeStyles): AnnotatedString = buildAnnotatedString {
    for (token in stanceTokenize(code, language)) {
        val style = styles.of(token.type)
        if (style == null) append(token.value) else withStyle(style) { append(token.value) }
    }
}

/**
 * The highlighted form of [code], remembered until the code, language or theme changes.
 *
 * Short code is tokenised in place. Code longer than [SYNC_LIMIT] characters shows plain first and
 * is tokenised off the main thread, so a long sample never holds up a frame.
 */
@Composable
internal fun rememberStanceHighlightedCode(code: String, language: String?): AnnotatedString {
    if (!stanceCanHighlight(language)) return remember(code) { AnnotatedString(code) }
    val styles = stanceCodeStyles()
    if (code.length <= SYNC_LIMIT) return remember(code, language, styles) { stanceHighlight(code, language, styles) }
    val highlighted by produceState(AnnotatedString(code), code, language, styles) {
        value = withContext(Dispatchers.Default) { stanceHighlight(code, language, styles) }
    }
    return highlighted
}

private const val SYNC_LIMIT = 4_000
