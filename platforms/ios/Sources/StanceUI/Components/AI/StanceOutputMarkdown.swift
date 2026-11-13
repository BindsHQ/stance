import Foundation
import SwiftUI

// MARK: Markdown model

/// How a column of a Markdown table aligns its cells.
public enum StanceMarkdownAlignment: String, CaseIterable, Sendable {
    case leading, center, trailing
}

/// One entry of a Markdown list, as parsed by ``StanceMarkdownRenderer/parse(_:isStreaming:)``.
public struct StanceMarkdownListItem: Equatable, Sendable {
    /// The inline content of the item.
    public var text: AttributedString
    /// How deeply the item is nested. 0 for the top level.
    public var depth: Int
    /// The number shown for an ordered item, or `nil` for a bullet.
    public var number: Int?
    /// `true` for a checked task, `false` for an open task, `nil` when the item is not a task.
    public var isChecked: Bool?

    /// Creates a list item.
    public init(text: AttributedString, depth: Int = 0, number: Int? = nil, isChecked: Bool? = nil) {
        self.text = text
        self.depth = depth
        self.number = number
        self.isChecked = isChecked
    }
}

/// One block of model Markdown, as parsed by ``StanceMarkdownRenderer/parse(_:isStreaming:)``.
///
/// Inline content keeps Foundation's presentation intents and link attributes. Links that are
/// not http, https or mailto have already been reduced to plain text.
public enum StanceMarkdownBlock: Equatable, Sendable {
    /// A heading with the level written in the source, from 1 to 6.
    case heading(level: Int, text: AttributedString)
    /// A paragraph. Lines of one paragraph are joined with a space.
    case paragraph(AttributedString)
    /// A bulleted, numbered or task list. Nesting is carried by each item's depth.
    case list([StanceMarkdownListItem])
    /// A block quote.
    case quote(AttributedString)
    /// A fenced code block. `isOpen` is `true` while the closing fence has not arrived.
    case code(language: String?, text: String, isOpen: Bool)
    /// A table. Every row has as many cells as the header.
    case table(header: [AttributedString], alignments: [StanceMarkdownAlignment], rows: [[AttributedString]])
    /// An image on a line of its own. Shown as its alt text unless images are allowed.
    case image(alt: String, url: URL?)
    /// A thematic break.
    case rule
}

// MARK: Renderer

/// Model Markdown rendered safely with the Stance type scale.
///
/// It extends the ``StanceRichText`` mapping to everything a model writes: headings, nested,
/// numbered and task lists, quotes, tables, fenced code in a ``StanceCodeBlock`` with
/// highlighting, rules, links and citations. Nothing is ever interpreted as HTML.
///
/// - **Links** are kept only for http, https and mailto. Anything else is shown as plain text.
///   A tap goes to `onLinkTap`, or to the system through `openURL`.
/// - **Images** are off by default and shown as their alt text. When allowed, your app supplies
///   the picture through `image`; the renderer never loads anything from the network.
/// - **Citations** written as `[1]` stay in the sentence as written, and a tappable
///   ``StanceCitationChip`` for each one follows the block it appears in. SwiftUI text cannot
///   hold a control inside a line, so the chips sit directly under the text they belong to.
/// - **Streaming** text may stop anywhere. With `isStreaming`, an open code fence, a half written
///   table and unfinished emphasis or links are closed for display, so blocks keep their shape
///   as more text arrives and nothing above the reading position moves.
public struct StanceMarkdownRenderer: View {
    private let blocks: [StanceMarkdownBlock]
    private let citations: [Int: StanceSource]
    private let allowsImages: Bool
    private let baseHeadingLevel: Int
    private let size: StanceRichText.Size
    private let image: ((URL, String) -> Image?)?
    private let onLinkTap: ((URL) -> Void)?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - markdown: The Markdown source. It is shown as written; it is not a localisation key.
    ///   - isStreaming: Whether more text is still arriving. Open constructs are closed for display.
    ///   - citations: Sources by the number used in the text, so `[2]` gets a citation chip.
    ///   - allowsImages: Shows images through `image`. Off by default: an image is shown as a link
    ///     with its alt text (when its URL is safe), or as the alt text alone.
    ///   - baseHeadingLevel: The accessibility level of a `#` heading, so the screen outline stays
    ///     valid. Defaults to 2, as on the web: the screen title is the level 1 heading.
    ///   - size: The body text size.
    ///   - image: Supplies the picture for an image URL and alt text. Nothing is loaded for you.
    ///   - onLinkTap: Opens a link. Without it, links open through the system.
    public init(
        _ markdown: String,
        isStreaming: Bool = false,
        citations: [Int: StanceSource] = [:],
        allowsImages: Bool = false,
        baseHeadingLevel: Int = 2,
        size: StanceRichText.Size = .medium,
        image: ((URL, String) -> Image?)? = nil,
        onLinkTap: ((URL) -> Void)? = nil
    ) {
        blocks = Self.parse(markdown, isStreaming: isStreaming)
        self.citations = citations
        self.allowsImages = allowsImages
        self.baseHeadingLevel = baseHeadingLevel
        self.size = size
        self.image = image
        self.onLinkTap = onLinkTap
    }

    // MARK: Safety

    /// Whether a link may be followed: only http, https and mailto. Relative links, `javascript:`,
    /// `data:`, `file:` and every other scheme are refused.
    /// The alt text of an image that is not shown, as a link to the image.
    static func linkText(_ text: String, url: URL, theme: StanceTheme) -> AttributedString {
        var link = AttributedString(text)
        link.link = url
        link.foregroundColor = theme.colors.fgLink
        link.underlineStyle = .single
        return link
    }

    public nonisolated static func isSafeLink(_ url: URL) -> Bool {
        guard let scheme = url.scheme?.lowercased() else { return false }
        return scheme == "http" || scheme == "https" || scheme == "mailto"
    }

    /// The accessibility level for a heading written at `level` when `#` maps to `base`, from 1 to 6.
    public nonisolated static func headingLevel(_ level: Int, base: Int) -> Int {
        min(max(level + max(base, 1) - 1, 1), 6)
    }

    /// The citation numbers written as `[n]` in `text`, in order of first appearance.
    /// A bracketed number followed by `(` is a link, not a citation.
    public nonisolated static func citationIndices(in text: String) -> [Int] {
        let chars = Array(text)
        var found: [Int] = []
        var index = 0
        while index < chars.count {
            guard chars[index] == "[" else { index += 1; continue }
            var end = index + 1
            while end < chars.count, chars[end].isASCII, chars[end].isNumber { end += 1 }
            if end > index + 1, end < chars.count, chars[end] == "]", !(end + 1 < chars.count && chars[end + 1] == "("),
               let number = Int(String(chars[index + 1 ..< end])), !found.contains(number) {
                found.append(number)
            }
            index = max(end, index + 1)
        }
        return found
    }

    // MARK: Inline parsing

    /// Parses inline Markdown and removes what must not be followed or loaded: links that are not
    /// http, https or mailto become plain text, and inline images become their alt text.
    /// With `isStreaming`, unfinished emphasis, code spans and links at the end are closed first.
    public nonisolated static func inline(_ text: String, isStreaming: Bool = false) -> AttributedString {
        let source = replacingInlineImages(isStreaming ? closingOpenInline(text) : text)
        var result = StanceRichText.inline(source)
        for run in result.runs {
            if let link = run.link, !isSafeLink(link) { result[run.range].link = nil }
            if run.imageURL != nil { result[run.range].imageURL = nil }
        }
        return result
    }

    /// Closes inline constructs left open at the end of streamed text, so `**bold` shows as bold
    /// text instead of two asterisks that vanish a moment later.
    public nonisolated static func closingOpenInline(_ text: String) -> String {
        var chars = Array(text)
        // An unfinished link or image at the end shows as its text only.
        if let open = chars.lastIndex(of: "[") {
            let after = chars[(open + 1)...]
            let start = open > 0 && chars[open - 1] == "!" ? open - 1 : open
            if let close = after.firstIndex(of: "]") {
                if close + 1 < chars.count, chars[close + 1] == "(", !chars[(close + 1)...].contains(")") {
                    chars = Array(chars[..<start]) + Array(chars[(open + 1) ..< close])
                }
            } else if after.allSatisfy({ $0.isASCII && $0.isNumber }) {
                chars = Array(chars[..<start])
            } else {
                chars = Array(chars[..<start]) + Array(after)
            }
        }
        var codeStart: Int?
        var strongStart: Int?
        var emphasisStart: Int?
        var index = 0
        while index < chars.count {
            let char = chars[index]
            if char == "\\" { index += 2; continue }
            if char == "`" { codeStart = codeStart == nil ? index : nil; index += 1; continue }
            if codeStart != nil || char != "*" { index += 1; continue }
            let opensAt: (Int) -> Bool = { next in next >= chars.count || !chars[next].isWhitespace }
            if index + 1 < chars.count, chars[index + 1] == "*" {
                if strongStart != nil { strongStart = nil } else if opensAt(index + 2) { strongStart = index }
                index += 2
                continue
            }
            if emphasisStart != nil {
                emphasisStart = nil
            } else if opensAt(index + 1), index == 0 || chars[index - 1].isWhitespace || chars[index - 1].isPunctuation {
                emphasisStart = index
            }
            index += 1
        }
        // Close the most recently opened construct first. A marker with nothing after it is dropped.
        let open: [(start: Int, marker: String)] = [
            codeStart.map { ($0, "`") }, strongStart.map { ($0, "**") }, emphasisStart.map { ($0, "*") },
        ]
        .compactMap { $0 }
        .sorted { $0.start > $1.start }
        guard !open.isEmpty else { return String(chars) }
        var closers = ""
        for item in open {
            if item.start + item.marker.count == chars.count {
                chars.removeLast(item.marker.count)
            } else {
                closers += item.marker
            }
        }
        guard !closers.isEmpty else { return String(chars) }
        let body = String(chars)
        let trimmed = String(body.reversed().drop { $0.isWhitespace }.reversed())
        return trimmed + closers + body.dropFirst(trimmed.count)
    }

    /// Replaces `![alt](url)` inside a line with its alt text.
    nonisolated static func replacingInlineImages(_ text: String) -> String {
        guard text.contains("![") else { return text }
        let chars = Array(text)
        var result: [Character] = []
        var index = 0
        while index < chars.count {
            if chars[index] == "!", index + 1 < chars.count, chars[index + 1] == "[",
               let close = chars[(index + 2)...].firstIndex(of: "]"), close + 1 < chars.count, chars[close + 1] == "(",
               let end = chars[(close + 2)...].firstIndex(of: ")") {
                result += chars[(index + 2) ..< close]
                index = end + 1
            } else {
                result.append(chars[index])
                index += 1
            }
        }
        return String(result)
    }

    // MARK: Block parsing

    /// Splits Markdown into blocks and parses the inline Markdown inside each one.
    ///
    /// Text that stops part way is never an error. With `isStreaming`, the unfinished end is
    /// closed for display: an open fence is a code block, a table header with no rows yet is
    /// already a table, and a marker with nothing after it is held back until its content arrives.
    public nonisolated static func parse(_ markdown: String, isStreaming: Bool = false) -> [StanceMarkdownBlock] {
        let lines = markdown.replacingOccurrences(of: "\r\n", with: "\n").components(separatedBy: .newlines)
        var blocks: [StanceMarkdownBlock] = []
        var paragraph: [String] = []
        var quote: [String] = []
        var items: [(depth: Int, number: Int?, isChecked: Bool?, text: String)] = []
        var indents: [Int] = []
        var counters: [Int: Int] = [:]
        var fence: (language: String?, lines: [String])?

        func flush(closing: Bool = false) {
            if !paragraph.isEmpty {
                if paragraph.count == 1, let image = imageLine(paragraph[0]) {
                    blocks.append(.image(alt: image.alt, url: image.url))
                } else {
                    blocks.append(.paragraph(inline(paragraph.joined(separator: " "), isStreaming: closing)))
                }
                paragraph = []
            }
            if !quote.isEmpty {
                blocks.append(.quote(inline(quote.joined(separator: " "), isStreaming: closing)))
                quote = []
            }
            if !items.isEmpty {
                blocks.append(.list(items.enumerated().map { index, item in
                    StanceMarkdownListItem(text: inline(item.text, isStreaming: closing && index == items.count - 1), depth: item.depth, number: item.number, isChecked: item.isChecked)
                }))
                items = []
                indents = []
                counters = [:]
            }
        }

        var index = 0
        while index < lines.count {
            let rawLine = lines[index]
            let line = rawLine.trimmingCharacters(in: .whitespaces)
            let isLast = index == lines.count - 1
            index += 1
            if var open = fence {
                if line.hasPrefix("```") {
                    blocks.append(.code(language: open.language, text: open.lines.joined(separator: "\n"), isOpen: false))
                    fence = nil
                } else {
                    open.lines.append(rawLine)
                    fence = open
                }
                continue
            }
            if line.hasPrefix("```") {
                flush()
                let language = line.drop { $0 == "`" }.trimmingCharacters(in: .whitespaces)
                fence = (language.isEmpty ? nil : language, [])
                continue
            }
            if line.isEmpty { flush(); continue }
            // A marker that has only just started is held back until its content arrives.
            if isStreaming, isLast, isDanglingMarker(line) { continue }
            if line.allSatisfy({ $0 == "-" || $0 == "*" || $0 == "_" || $0 == " " }), line.filter({ $0 != " " }).count >= 3 {
                flush()
                blocks.append(.rule)
                continue
            }
            if let level = headingLevel(line) {
                flush()
                blocks.append(.heading(level: level, text: inline(String(line.dropFirst(level)).trimmingCharacters(in: .whitespaces), isStreaming: isStreaming && isLast)))
                continue
            }
            if line.contains("|") {
                let next = index < lines.count ? lines[index].trimmingCharacters(in: .whitespaces) : nil
                let nextIsLast = index == lines.count - 1
                let hasSeparator = next.map { isTableSeparator($0, allowsPartial: isStreaming && nextIsLast) } ?? false
                // While streaming, a header row at the very end is already a table: its separator is on the way.
                let isOpenHeader = isStreaming && line.hasPrefix("|") && (isLast || (nextIsLast && next?.isEmpty == true))
                if hasSeparator || isOpenHeader {
                    flush()
                    let header = tableCells(line)
                    var alignments = hasSeparator ? tableCells(next ?? "").map(alignment) : []
                    alignments = Array(alignments.prefix(header.count)) + Array(repeating: .leading, count: max(0, header.count - alignments.count))
                    if hasSeparator { index += 1 }
                    var rows: [[AttributedString]] = []
                    while index < lines.count {
                        let row = lines[index].trimmingCharacters(in: .whitespaces)
                        guard !row.isEmpty, row.contains("|") else { break }
                        let cells = tableCells(row)
                        rows.append((0 ..< header.count).map { $0 < cells.count ? inline(cells[$0], isStreaming: isStreaming && index == lines.count - 1) : AttributedString() })
                        index += 1
                    }
                    blocks.append(.table(header: header.map { inline($0) }, alignments: alignments, rows: rows))
                    continue
                }
            }
            if line.hasPrefix(">") {
                if quote.isEmpty { flush() }
                quote.append(String(line.dropFirst()).trimmingCharacters(in: .whitespaces))
                continue
            }
            if let item = listItem(line) {
                if items.isEmpty { flush() }
                let indent = rawLine.prefix { $0 == " " || $0 == "\t" }.reduce(0) { $0 + ($1 == "\t" ? 4 : 1) }
                while let last = indents.last, last > indent { indents.removeLast() }
                if indents.last != indent { indents.append(indent) }
                let depth = indents.count - 1
                counters = counters.filter { $0.key <= depth }
                var number: Int?
                if let written = item.number {
                    number = counters[depth].map { $0 + 1 } ?? written
                    counters[depth] = number
                } else {
                    counters[depth] = nil
                }
                var text = item.text
                if isStreaming, isLast, ["[", "[ ", "[x", "[X"].contains(text) { text = "" }
                items.append((depth, number, item.isChecked, text))
                continue
            }
            // A plain line continues the open quote or list item, or the paragraph.
            if !quote.isEmpty { quote.append(line) } else if !items.isEmpty { items[items.count - 1].text += " " + line } else { paragraph.append(line) }
        }
        if let open = fence { blocks.append(.code(language: open.language, text: open.lines.joined(separator: "\n"), isOpen: true)) }
        flush(closing: isStreaming)
        return blocks
    }

    private nonisolated static func isDanglingMarker(_ line: String) -> Bool {
        if line.allSatisfy({ $0 == "#" }) { return line.count <= 6 }
        if line.allSatisfy({ $0 == "`" }) { return line.count < 3 }
        if line == "+" || line == ">" { return true }
        if line.allSatisfy({ $0 == "-" }) || line.allSatisfy({ $0 == "*" }) || line.allSatisfy({ $0 == "_" }) { return line.count < 3 }
        if line.hasSuffix("."), line.dropLast().allSatisfy({ $0.isASCII && $0.isNumber }), line.count > 1 { return true }
        return false
    }

    private nonisolated static func headingLevel(_ line: String) -> Int? {
        let hashes = line.prefix { $0 == "#" }.count
        guard (1 ... 6).contains(hashes), line.dropFirst(hashes).first == " " else { return nil }
        return hashes
    }

    private nonisolated static func listItem(_ line: String) -> (number: Int?, isChecked: Bool?, text: String)? {
        if let first = line.first, "-*+".contains(first), line.dropFirst().first == " " {
            let rest = String(line.dropFirst(2)).trimmingCharacters(in: .whitespaces)
            for (marker, checked) in [("[ ]", false), ("[x]", true), ("[X]", true)] where rest == marker || rest.hasPrefix(marker + " ") {
                return (nil, checked, String(rest.dropFirst(marker.count)).trimmingCharacters(in: .whitespaces))
            }
            return (nil, nil, rest)
        }
        let digits = line.prefix { $0.isASCII && $0.isNumber }
        guard !digits.isEmpty, let number = Int(digits) else { return nil }
        let rest = line.dropFirst(digits.count)
        guard let marker = rest.first, marker == "." || marker == ")", rest.dropFirst().first == " " else { return nil }
        return (number, nil, String(rest.dropFirst(2)).trimmingCharacters(in: .whitespaces))
    }

    private nonisolated static func imageLine(_ line: String) -> (alt: String, url: URL?)? {
        guard line.hasPrefix("!["), line.hasSuffix(")"), let close = line.range(of: "](") else { return nil }
        let alt = String(line[line.index(line.startIndex, offsetBy: 2) ..< close.lowerBound])
        let target = String(line[close.upperBound ..< line.index(before: line.endIndex)])
        guard !alt.contains("]"), !target.contains(")") else { return nil }
        let address = target.split(separator: " ").first.map(String.init) ?? ""
        return (alt, URL(string: address))
    }

    /// The cells of a table row, without the outer pipes. `\|` is a literal pipe.
    nonisolated static func tableCells(_ line: String) -> [String] {
        var body = Substring(line.trimmingCharacters(in: .whitespaces))
        if body.hasPrefix("|") { body = body.dropFirst() }
        if body.hasSuffix("|"), !body.hasSuffix("\\|") { body = body.dropLast() }
        var cells: [String] = []
        var current = ""
        var previous: Character?
        for char in body {
            if char == "|", previous != "\\" {
                cells.append(current)
                current = ""
            } else {
                if char == "|" { current.removeLast() }
                current.append(char)
            }
            previous = char
        }
        cells.append(current)
        return cells.map { $0.trimmingCharacters(in: .whitespaces) }
    }

    private nonisolated static func isTableSeparator(_ line: String, allowsPartial: Bool) -> Bool {
        guard line.contains("-") || (allowsPartial && line.hasPrefix("|")) else { return false }
        guard line.allSatisfy({ $0 == "|" || $0 == "-" || $0 == ":" || $0 == " " }) else { return false }
        if allowsPartial { return true }
        return tableCells(line).allSatisfy { cell in
            let dashes = cell.filter { $0 == "-" }.count
            return dashes >= 1 && cell.filter { $0 == ":" }.count <= 2 && !cell.contains(" ")
        }
    }

    private nonisolated static func alignment(_ cell: String) -> StanceMarkdownAlignment {
        if cell.hasPrefix(":"), cell.hasSuffix(":"), cell.count > 1 { return .center }
        return cell.hasSuffix(":") ? .trailing : .leading
    }

    // MARK: Rendering

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            ForEach(Array(blocks.enumerated()), id: \.offset) { _, block in
                view(for: block)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .tint(theme.colors.fgLink)
        .environment(\.openURL, OpenURLAction { [onLinkTap] url in
            guard Self.isSafeLink(url) else { return .discarded }
            guard let onLinkTap else { return .systemAction }
            onLinkTap(url)
            return .handled
        })
    }

    private func styled(_ text: AttributedString) -> AttributedString {
        StanceRichText.styled(text, theme: theme)
    }

    @ViewBuilder private func view(for block: StanceMarkdownBlock) -> some View {
        switch block {
        case let .heading(level, text):
            Text(styled(text))
                .stanceText(level == 1 ? .title : level == 2 ? .heading : .subheading)
                .foregroundStyle(theme.colors.fgDefault)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, level <= 2 ? StanceSpacing.sm : StanceSpacing.xs)
                .accessibilityAddTraits(.isHeader)
                .accessibilityHeading(Self.accessibilityLevel(Self.headingLevel(level, base: baseHeadingLevel)))
        case let .paragraph(text):
            withCitations(text) {
                Text(styled(text)).stanceText(size.body).foregroundStyle(theme.colors.fgDefault).fixedSize(horizontal: false, vertical: true)
            }
        case let .list(items):
            VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    listRow(item)
                }
            }
        case let .quote(text):
            withCitations(text) {
                HStack(alignment: .top, spacing: StanceSpacing.md) {
                    Rectangle().fill(theme.colors.borderStrong).frame(width: StanceSpacing.xxs)
                    Text(styled(text)).stanceText(size.body).italic().foregroundStyle(theme.colors.fgMuted).fixedSize(horizontal: false, vertical: true)
                }
                .fixedSize(horizontal: false, vertical: true)
            }
        case let .code(language, text, _):
            StanceCodeBlock(text, language: language, title: language)
        case let .table(header, alignments, rows):
            table(header: header, alignments: alignments, rows: rows)
        case let .image(alt, url):
            imageView(alt: alt, url: url)
        case .rule:
            StanceDivider()
        }
    }

    private static func accessibilityLevel(_ level: Int) -> AccessibilityHeadingLevel {
        switch level {
        case 1: .h1
        case 2: .h2
        case 3: .h3
        case 4: .h4
        case 5: .h5
        default: .h6
        }
    }

    /// The block, followed by a chip for every citation in it that has a source.
    @ViewBuilder private func withCitations<Block: View>(_ text: AttributedString, @ViewBuilder block: () -> Block) -> some View {
        let cited = citations.isEmpty ? [] : Self.citationIndices(in: String(text.characters)).filter { citations[$0] != nil }
        if cited.isEmpty {
            block()
        } else {
            VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                block()
                StanceFlowLayout(spacing: StanceSpacing.sm, lineSpacing: StanceSpacing.xs) {
                    ForEach(cited, id: \.self) { number in
                        if let source = citations[number] {
                            StanceCitationChip(index: number, source: source) { opened in
                                if let url = opened.url, Self.isSafeLink(url) { open(url) }
                            }
                            .frame(minHeight: StanceSize.iconLg)
                        }
                    }
                }
            }
        }
    }

    @Environment(\.openURL) private var openURL

    private func open(_ url: URL) {
        if let onLinkTap { onLinkTap(url) } else { openURL(url) }
    }

    private func listRow(_ item: StanceMarkdownListItem) -> some View {
        withCitations(item.text) {
            HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.sm) {
                Group {
                    if let checked = item.isChecked {
                        StanceSymbol(checked ? "checkmark.square" : "square", size: StanceSize.iconSm)
                            .alignmentGuide(.firstTextBaseline) { $0[.bottom] - StanceSpacing.xxs }
                    } else if let number = item.number {
                        Text(verbatim: "\(number.formatted(.number.locale(locale))).").stanceText(size.body).monospacedDigit()
                    } else {
                        Text(verbatim: "\u{2022}").stanceText(size.body)
                    }
                }
                .foregroundStyle(theme.colors.fgMuted)
                .accessibilityHidden(item.number == nil)
                Text(styled(item.text)).stanceText(size.body).foregroundStyle(theme.colors.fgDefault).fixedSize(horizontal: false, vertical: true)
            }
            .accessibilityElement(children: .combine)
            .accessibilityValue(item.isChecked.map { stanceString($0 ? "stance.checked" : "stance.unchecked", locale) } ?? "")
        }
        .padding(.leading, CGFloat(item.depth) * StanceSpacing.lg)
    }

    private func table(header: [AttributedString], alignments: [StanceMarkdownAlignment], rows: [[AttributedString]]) -> some View {
        func edge(_ column: Int) -> HorizontalAlignment {
            switch column < alignments.count ? alignments[column] : .leading {
            case .leading: .leading
            case .center: .center
            case .trailing: .trailing
            }
        }
        let titles = header.map { String($0.characters) }
        return ScrollView(.horizontal) {
            Grid(alignment: .leading, horizontalSpacing: StanceSpacing.lg, verticalSpacing: StanceSpacing.sm) {
                GridRow {
                    ForEach(Array(header.enumerated()), id: \.offset) { column, cell in
                        Text(styled(cell)).stanceText(.label).foregroundStyle(theme.colors.fgDefault).gridColumnAlignment(edge(column))
                    }
                }
                .accessibilityElement(children: .combine)
                .accessibilityAddTraits(.isHeader)
                Divider().gridCellUnsizedAxes(.horizontal).overlay(theme.colors.separator)
                ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                    GridRow {
                        ForEach(Array(row.enumerated()), id: \.offset) { _, cell in
                            Text(styled(cell)).stanceText(.bodySmall).monospacedDigit().foregroundStyle(theme.colors.fgDefault)
                        }
                    }
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(zip(titles, row).map { "\($0): \(String($1.characters))" }.joined(separator: ", "))
                }
            }
            .padding(.vertical, StanceSpacing.xs)
        }
    }

    @ViewBuilder private func imageView(alt: String, url: URL?) -> some View {
        let name = alt.isEmpty ? stanceString("stance.ai.markdown.image", locale) : alt
        if allowsImages, let url, let picture = image?(url, alt) {
            picture
                .resizable()
                .scaledToFit()
                .clipShape(RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
                .accessibilityLabel(name)
                .accessibilityAddTraits(.isImage)
        } else if let url, Self.isSafeLink(url) {
            // Images are off: a plain link to the image, named by its alt text, as on the web.
            Text(Self.linkText(name, url: url, theme: theme)).stanceText(.bodySmall).fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isLink)
        } else {
            HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.sm) {
                StanceIcon(.image, size: StanceSize.iconSm).alignmentGuide(.firstTextBaseline) { $0[.bottom] - StanceSpacing.xxs }
                Text(name).stanceText(.bodySmall).fixedSize(horizontal: false, vertical: true)
            }
            .foregroundStyle(theme.colors.fgMuted)
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isImage)
        }
    }
}
