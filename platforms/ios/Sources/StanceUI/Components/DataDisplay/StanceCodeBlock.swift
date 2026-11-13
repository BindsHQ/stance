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

/// Source code in a monospaced, horizontally scrolling block with optional line numbers and a
/// copy button.
///
/// Long lines scroll instead of wrapping, so indentation stays readable. Code is always laid out
/// left to right, also inside right to left screens. Copying writes to the system pasteboard and
/// confirms with a tick, a haptic and a VoiceOver announcement.
public struct StanceCodeBlock: View {
    private let code: String
    private let title: String?
    private let showsLineNumbers: Bool
    private let isCopyable: Bool
    private let labels: StanceCodeBlockLabels
    private let onCopy: ((String) -> Void)?
    @State private var copied = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// - Parameters:
    ///   - code: The source text, shown exactly as given.
    ///   - title: An optional caption above the code, such as a file name or language.
    ///   - showsLineNumbers: Shows a line number gutter. Numbers are not read by VoiceOver.
    ///   - isCopyable: Shows the copy button.
    ///   - labels: Replacements for the built in words.
    ///   - onCopy: Called after copying, with the code.
    @_disfavoredOverload
    public init(_ code: String, title: String? = nil, showsLineNumbers: Bool = false, isCopyable: Bool = true, labels: StanceCodeBlockLabels = .init(), onCopy: ((String) -> Void)? = nil) {
        self.code = code
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

    public var body: some View {
        let lines = Self.lines(code)
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
            ScrollView(.horizontal) {
                HStack(alignment: .top, spacing: StanceSpacing.md) {
                    if showsLineNumbers {
                        VStack(alignment: .trailing, spacing: 0) {
                            ForEach(lines.indices, id: \.self) { index in
                                Text(verbatim: String(index + 1)).stanceText(.mono).foregroundStyle(theme.colors.fgSubtle)
                            }
                        }
                        .accessibilityHidden(true)
                    }
                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(lines.indices, id: \.self) { index in
                            // A space keeps an empty line at full height.
                            Text(verbatim: lines[index].isEmpty ? " " : lines[index])
                                .stanceText(.mono)
                                .foregroundStyle(theme.colors.fgDefault)
                                .fixedSize()
                        }
                    }
                    .textSelection(.enabled)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(code)
                }
                .padding(StanceSpacing.md)
            }
            .environment(\.layoutDirection, .leftToRight)
        }
        .background(theme.colors.bgSubtle, in: RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous).strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
        .clipShape(RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
        .accessibilityElement(children: .contain)
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

// MARK: Localised labels

extension StanceCodeBlock {
    /// Creates a code block whose title is looked up in the app's string tables.
    public init(_ code: String, titleKey: LocalizedStringResource, showsLineNumbers: Bool = false, isCopyable: Bool = true, labels: StanceCodeBlockLabels = .init(), onCopy: ((String) -> Void)? = nil) {
        self.init(code, title: String(localized: titleKey), showsLineNumbers: showsLineNumbers, isCopyable: isCopyable, labels: labels, onCopy: onCopy)
    }
}
