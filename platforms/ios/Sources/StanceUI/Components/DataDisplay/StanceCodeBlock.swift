import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

/// Words a ``StanceCodeBlock`` uses. Leave a value out to keep the localised default.
public struct StanceCodeBlockLabels: Sendable {
    public var copy: String?
    public var copied: String?

    /// - Parameters:
    ///   - copy: The copy button. Defaults to a localised "Copy code".
    ///   - copied: The confirmation. Defaults to a localised "Copied".
    public init(copy: String? = nil, copied: String? = nil) {
        self.copy = copy
        self.copied = copied
    }
}

/// Source code in a monospaced, horizontally scrolling block with optional syntax
/// highlighting, line numbers and a copy button.
///
/// Long lines scroll instead of wrapping unless `wraps` is set, so indentation stays readable.
/// Code is always laid out left to right, also inside right to left screens. The code is one
/// `Text` built from an `AttributedString`, so selection works across lines and the font follows
/// Dynamic Type. Pass a `language` to highlight it with ``StanceCodeHighlighter``; long code is
/// tokenized off the main thread and shows plain until that finishes. Copying writes to the
/// system pasteboard and confirms with a tick, a haptic and a VoiceOver announcement.
public struct StanceCodeBlock: View {
    private let code: String
    private let language: String?
    private let wraps: Bool
    private let title: String?
    private let showsLineNumbers: Bool
    private let isCopyable: Bool
    private let labels: StanceCodeBlockLabels
    private let onCopy: ((String) -> Void)?
    @State private var copied = false
    @State private var highlighted: StanceHighlightedCode?
    @ScaledMetric(relativeTo: .subheadline) private var monoSize: CGFloat = StanceTextStyle.mono.size
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// - Parameters:
    ///   - code: The source text, shown exactly as given.
    ///   - language: The language to highlight: `ts`, `tsx`, `js`, `jsx`, `css`, `bash`, `json`, `swift` or
    ///     `kotlin`. Other values, and `nil`, show plain text.
    ///   - title: An optional caption above the code, such as a file name or language.
    ///   - showsLineNumbers: Shows a line number gutter. Numbers are not read by VoiceOver.
    ///   - wraps: Wraps long lines instead of scrolling sideways. Line numbers are hidden when wrapping.
    ///   - isCopyable: Shows the copy button.
    ///   - labels: Replacements for the built in words.
    ///   - onCopy: Called after copying, with the code.
    @_disfavoredOverload
    public init(_ code: String, language: String? = nil, title: String? = nil, showsLineNumbers: Bool = false, wraps: Bool = false, isCopyable: Bool = true, labels: StanceCodeBlockLabels = .init(), onCopy: ((String) -> Void)? = nil) {
        self.code = code
        self.language = language
        self.wraps = wraps
        self.title = title
        self.showsLineNumbers = showsLineNumbers
        self.isCopyable = isCopyable
        self.labels = labels
        self.onCopy = onCopy
    }

    /// The lines of `code`, keeping empty lines and dropping one trailing newline.
    public nonisolated static func lines(_ code: String) -> [String] {
        var lines = code.components(separatedBy: "\n")
        if lines.count > 1, lines.last == "" { lines.removeLast() }
        return lines
    }

    /// Code longer than this many UTF-16 units is tokenized off the main thread.
    nonisolated static var backgroundThreshold: Int { 4000 }

    /// The tokens to draw now: cached ones, tokens made on the spot for short code, or plain text
    /// while long code is being tokenized in the background.
    private func tokens(for text: String) -> [StanceCodeToken] {
        if let highlighted, highlighted.code == text, highlighted.language == language { return highlighted.tokens }
        guard StanceCodeHighlighter.supports(language), text.utf16.count <= Self.backgroundThreshold else {
            return [StanceCodeToken(.plain, text)]
        }
        return StanceCodeHighlighter.tokenize(text, language: language)
    }

    public var body: some View {
        let lines = Self.lines(code)
        let text = lines.joined(separator: "\n")
        let attributed = StanceCodeHighlighter.attributedString(tokens(for: text), theme: theme, fontSize: monoSize)
        VStack(alignment: .leading, spacing: 0) {
            if title != nil || isCopyable {
                HStack(spacing: StanceSpacing.sm) {
                    if let title {
                        Text(title).stanceText(.caption).foregroundStyle(theme.colors.fgMuted).accessibilityAddTraits(.isHeader)
                    }
                    Spacer(minLength: 0)
                    if isCopyable { copyButton }
                }
                .padding(.leading, StanceSpacing.md)
                .padding(.trailing, StanceSpacing.xs)
                StanceDivider()
            }
            Group {
                if wraps {
                    codeText(attributed)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(StanceSpacing.md)
                } else {
                    ScrollView(.horizontal) {
                        HStack(alignment: .top, spacing: StanceSpacing.md) {
                            if showsLineNumbers {
                                // One text with the same font and line count as the code, so rows line up.
                                Text(verbatim: lines.indices.map { String($0 + 1) }.joined(separator: "\n"))
                                    .font(.system(size: monoSize, design: .monospaced))
                                    .multilineTextAlignment(.trailing)
                                    .foregroundStyle(theme.colors.fgSubtle)
                                    .fixedSize()
                                    .accessibilityHidden(true)
                            }
                            codeText(attributed).fixedSize()
                        }
                        .padding(StanceSpacing.md)
                    }
                }
            }
            .environment(\.layoutDirection, .leftToRight)
        }
        .background(theme.colors.bgSubtle, in: RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous).strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
        .clipShape(RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
        .accessibilityElement(children: .contain)
        .task(id: StanceHighlightKey(code: text, language: language)) {
            guard StanceCodeHighlighter.supports(language), text.utf16.count > Self.backgroundThreshold else { return }
            let language = language
            let tokens = await Task.detached(priority: .userInitiated) { StanceCodeHighlighter.tokenize(text, language: language) }.value
            guard !Task.isCancelled else { return }
            highlighted = StanceHighlightedCode(code: text, language: language, tokens: tokens)
        }
    }

    /// The code as one selectable text. VoiceOver reads the source, not the styling.
    private func codeText(_ attributed: AttributedString) -> some View {
        Text(attributed)
            .multilineTextAlignment(.leading)
            .textSelection(.enabled)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(code)
    }

    private var copyLabel: String { labels.copy ?? stanceString("stance.code.copy", locale) }
    private var copiedLabel: String { labels.copied ?? stanceString("stance.ai.actions.copied", locale) }

    private var copyButton: some View {
        Button(action: copy) {
            HStack(spacing: StanceSpacing.xs) {
                StanceIcon(copied ? .check : .copy, size: StanceSize.iconSm)
                Text(copied ? copiedLabel : stanceString("stance.ai.actions.copy", locale)).stanceText(.caption)
            }
            .foregroundStyle(theme.colors.fgMuted)
            .padding(.horizontal, StanceSpacing.sm)
            .frame(minHeight: StanceSize.touchTarget)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(copied ? copiedLabel : copyLabel)
        .stanceAnimation(.fast, value: copied)
    }

    private func copy() {
        #if canImport(UIKit)
        UIPasteboard.general.string = code
        #endif
        onCopy?(code)
        copied = true
        StanceHaptics.success()
        StanceAnnouncer.announce(copiedLabel)
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(StanceMotion.confirmationDuration))
            copied = false
        }
    }
}

/// Tokens kept for the code and language they were made from.
private struct StanceHighlightedCode: Equatable, Sendable {
    let code: String
    let language: String?
    let tokens: [StanceCodeToken]
}

/// Restarts background highlighting when the code or the language changes.
private struct StanceHighlightKey: Equatable, Sendable {
    let code: String
    let language: String?
}

// MARK: Localised labels

extension StanceCodeBlock {
    /// Creates a code block whose title is looked up in the app's string tables.
    public init(_ code: String, language: String? = nil, titleKey: LocalizedStringResource, showsLineNumbers: Bool = false, wraps: Bool = false, isCopyable: Bool = true, labels: StanceCodeBlockLabels = .init(), onCopy: ((String) -> Void)? = nil) {
        self.init(code, language: language, title: String(localized: titleKey), showsLineNumbers: showsLineNumbers, wraps: wraps, isCopyable: isCopyable, labels: labels, onCopy: onCopy)
    }
}
