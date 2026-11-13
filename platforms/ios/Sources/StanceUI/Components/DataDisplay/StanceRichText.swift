import Foundation
import SwiftUI

/// One block of Markdown content, as parsed by ``StanceRichText/parse(_:)``.
///
/// Inline content (emphasis, strong, code spans and links) is kept in each `AttributedString`
/// as Foundation's inline presentation intents and link attributes.
public enum StanceRichTextBlock: Equatable, Sendable {
    /// A heading from level 1 to 6.
    case heading(level: Int, text: AttributedString)
    /// A paragraph. Lines of one paragraph are joined with a space.
    case paragraph(AttributedString)
    /// A bulleted list, one entry per item.
    case bulletList([AttributedString])
    /// A numbered list starting at `start`.
    case numberedList(start: Int, items: [AttributedString])
    /// A block quote.
    case quote(AttributedString)
    /// A fenced code block with an optional language.
    case code(language: String?, text: String)
    /// A thematic break.
    case rule
}

/// Long-form text from Markdown, styled with the Stance type scale.
///
/// Headings, paragraphs, bulleted and numbered lists, quotes, code spans, code blocks and links
/// are supported. Inline Markdown is parsed by Foundation's `AttributedString`, so emphasis and
/// links behave as they do everywhere else on iOS. Headings carry the header trait, so VoiceOver
/// users can move between them with the rotor. Raw HTML is never interpreted.
public struct StanceRichText: View {
    /// Text sizes for body copy.
    public enum Size: String, CaseIterable, Sendable {
        case small, medium, large

        var body: StanceTextStyle {
            switch self {
            case .small: .bodySmall
            case .medium: .body
            case .large: .bodyLarge
            }
        }
    }

    private let blocks: [StanceRichTextBlock]
    private let size: Size
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - markdown: The Markdown source. A string value is shown as written; it is not a localisation key.
    ///   - size: The body text size.
    public init(markdown: String, size: Size = .medium) {
        blocks = Self.parse(markdown)
        self.size = size
    }

    // MARK: Parsing

    /// Splits Markdown into blocks and parses the inline Markdown inside each one.
    public nonisolated static func parse(_ markdown: String) -> [StanceRichTextBlock] {
        var blocks: [StanceRichTextBlock] = []
        var paragraph: [String] = []
        var quote: [String] = []
        var bullets: [String] = []
        var numbers: [String] = []
        var numberStart = 1
        var fence: (language: String?, lines: [String])?

        func flush() {
            if !paragraph.isEmpty { blocks.append(.paragraph(inline(paragraph.joined(separator: " ")))); paragraph = [] }
            if !quote.isEmpty { blocks.append(.quote(inline(quote.joined(separator: " ")))); quote = [] }
            if !bullets.isEmpty { blocks.append(.bulletList(bullets.map(inline))); bullets = [] }
            if !numbers.isEmpty { blocks.append(.numberedList(start: numberStart, items: numbers.map(inline))); numbers = [] }
        }

        for rawLine in markdown.components(separatedBy: .newlines) {
            let line = rawLine.trimmingCharacters(in: .whitespaces)
            if var open = fence {
                if line.hasPrefix("```") {
                    blocks.append(.code(language: open.language, text: open.lines.joined(separator: "\n")))
                    fence = nil
                } else {
                    open.lines.append(rawLine)
                    fence = open
                }
                continue
            }
            if line.hasPrefix("```") {
                flush()
                let language = line.dropFirst(3).trimmingCharacters(in: .whitespaces)
                fence = (language.isEmpty ? nil : language, [])
                continue
            }
            if line.isEmpty { flush(); continue }
            if line.allSatisfy({ $0 == "-" || $0 == "*" || $0 == "_" || $0 == " " }), line.filter({ $0 != " " }).count >= 3 {
                flush()
                blocks.append(.rule)
                continue
            }
            if let level = headingLevel(line) {
                flush()
                blocks.append(.heading(level: level, text: inline(String(line.dropFirst(level)).trimmingCharacters(in: .whitespaces))))
                continue
            }
            if line.hasPrefix(">") {
                if quote.isEmpty { flush() }
                quote.append(String(line.dropFirst()).trimmingCharacters(in: .whitespaces))
                continue
            }
            if let item = bulletItem(line) {
                if bullets.isEmpty { flush() }
                bullets.append(item)
                continue
            }
            if let (number, item) = numberedItem(line) {
                if numbers.isEmpty { flush(); numberStart = number }
                numbers.append(item)
                continue
            }
            // A plain line continues the open quote or list item, or the paragraph.
            if !quote.isEmpty { quote.append(line) } else if !bullets.isEmpty { bullets[bullets.count - 1] += " " + line } else if !numbers.isEmpty { numbers[numbers.count - 1] += " " + line } else { paragraph.append(line) }
        }
        if let open = fence { blocks.append(.code(language: open.language, text: open.lines.joined(separator: "\n"))) }
        flush()
        return blocks
    }

    /// Parses inline Markdown. Text that is not valid Markdown is kept as written.
    public nonisolated static func inline(_ text: String) -> AttributedString {
        (try? AttributedString(markdown: text, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace, failurePolicy: .returnPartiallyParsedIfPossible))) ?? AttributedString(text)
    }

    private nonisolated static func headingLevel(_ line: String) -> Int? {
        let hashes = line.prefix { $0 == "#" }.count
        guard (1 ... 6).contains(hashes), line.dropFirst(hashes).first == " " else { return nil }
        return hashes
    }

    private nonisolated static func bulletItem(_ line: String) -> String? {
        guard let first = line.first, "-*+".contains(first), line.dropFirst().first == " " else { return nil }
        return String(line.dropFirst(2))
    }

    private nonisolated static func numberedItem(_ line: String) -> (Int, String)? {
        let digits = line.prefix { $0.isASCII && $0.isNumber }
        guard !digits.isEmpty, let number = Int(digits) else { return nil }
        let rest = line.dropFirst(digits.count)
        guard let marker = rest.first, marker == "." || marker == ")", rest.dropFirst().first == " " else { return nil }
        return (number, String(rest.dropFirst(2)))
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
    }

    @ViewBuilder private func view(for block: StanceRichTextBlock) -> some View {
        switch block {
        case let .heading(level, text):
            Text(styled(text))
                .stanceText(level == 1 ? .title : level == 2 ? .heading : .subheading)
                .foregroundStyle(theme.colors.fgDefault)
                .padding(.top, level <= 2 ? StanceSpacing.sm : StanceSpacing.xs)
                .accessibilityAddTraits(.isHeader)
                .accessibilityHeading(level == 1 ? .h1 : level == 2 ? .h2 : level == 3 ? .h3 : level == 4 ? .h4 : level == 5 ? .h5 : .h6)
        case let .paragraph(text):
            Text(styled(text)).stanceText(size.body).foregroundStyle(theme.colors.fgDefault).fixedSize(horizontal: false, vertical: true)
        case let .bulletList(items):
            VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    listRow(marker: "\u{2022}", item: item)
                }
            }
        case let .numberedList(start, items):
            VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                    listRow(marker: "\((start + index).formatted(.number.locale(locale))).", item: item)
                }
            }
        case let .quote(text):
            HStack(alignment: .top, spacing: StanceSpacing.md) {
                Rectangle().fill(theme.colors.borderStrong).frame(width: StanceSpacing.xxs)
                Text(styled(text)).stanceText(size.body).italic().foregroundStyle(theme.colors.fgMuted).fixedSize(horizontal: false, vertical: true)
            }
            .fixedSize(horizontal: false, vertical: true)
        case let .code(language, text):
            StanceCodeBlock(text, title: language, isCopyable: false)
        case .rule:
            StanceDivider()
        }
    }

    private func listRow(marker: String, item: AttributedString) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.sm) {
            Text(verbatim: marker).stanceText(size.body).foregroundStyle(theme.colors.fgMuted).monospacedDigit().accessibilityHidden(true)
            Text(styled(item)).stanceText(size.body).foregroundStyle(theme.colors.fgDefault).fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
    }

    /// Applies theme colours to links and code spans.
    private func styled(_ text: AttributedString) -> AttributedString {
        Self.styled(text, theme: theme)
    }

    /// The inline styling shared with ``StanceMarkdownRenderer``: links take the link colour and
    /// an underline, code spans a monospaced face on a muted background.
    static func styled(_ text: AttributedString, theme: StanceTheme) -> AttributedString {
        var text = text
        for run in text.runs {
            if run.link != nil {
                text[run.range].foregroundColor = theme.colors.fgLink
                text[run.range].underlineStyle = .single
            }
            if run.inlinePresentationIntent?.contains(.code) == true {
                text[run.range].font = .system(.body, design: .monospaced)
                text[run.range].backgroundColor = theme.colors.bgMuted
            }
        }
        return text
    }
}
