import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

/// Writes plain text to the system pasteboard.
public enum StanceClipboard {
    /// Copies `text` to the general pasteboard (`UIPasteboard` on iOS, `NSPasteboard` on macOS).
    @MainActor
    public static func copy(_ text: String) {
        #if canImport(UIKit)
        UIPasteboard.general.string = text
        #elseif canImport(AppKit)
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
        #endif
    }
}

/// Copies a value to the pasteboard and confirms it.
///
/// The icon turns into a tick and the label into "Copied" for one confirmation period
/// (``StanceMotion/confirmationDuration``), VoiceOver announces it, and a success haptic plays.
/// Under Reduce Motion the change is instant.
public struct StanceCopyButton: View {
    private let value: () -> String
    private let customLabel: String?
    private let customCopiedLabel: String?
    private let showsLabel: Bool
    private let variant: StanceButtonVariant
    private let onCopy: ((String) -> Void)?
    @State private var copied = false
    @State private var resetTask: Task<Void, Never>?
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - value: The text to copy, read when the button is tapped.
    ///   - label: The button title and accessible name. Defaults to a localised "Copy".
    ///   - copiedLabel: The confirmation. Defaults to a localised "Copied".
    ///   - showsLabel: Hide the visible title for an icon only button. VoiceOver still hears it.
    ///   - variant: The Stance button variant.
    ///   - onCopy: Called with the copied text.
    @_disfavoredOverload
    public init(
        value: @escaping @autoclosure () -> String,
        label: String? = nil,
        copiedLabel: String? = nil,
        showsLabel: Bool = true,
        variant: StanceButtonVariant = .outline,
        onCopy: ((String) -> Void)? = nil
    ) {
        self.value = value
        customLabel = label
        customCopiedLabel = copiedLabel
        self.showsLabel = showsLabel
        self.variant = variant
        self.onCopy = onCopy
    }

    private var label: String { customLabel ?? stanceString("stance.ai.actions.copy", locale) }
    private var copiedLabel: String { customCopiedLabel ?? stanceString("stance.ai.actions.copied", locale) }

    public var body: some View {
        Button(action: copy) {
            HStack(spacing: StanceSpacing.s1_5) {
                StanceIcon(copied ? .check : .copy, size: StanceSize.iconSm)
                    .contentTransition(.opacity)
                if showsLabel { Text(copied ? copiedLabel : label) }
            }
            .frame(minWidth: showsLabel ? nil : StanceSize.iconMd)
        }
        .buttonStyle(.stance(variant, size: .small))
        .stanceAnimation(.fast, value: copied)
        .accessibilityLabel(copied ? copiedLabel : label)
        .sensoryFeedback(.success, trigger: copied) { _, new in new }
        .onDisappear { resetTask?.cancel() }
    }

    private func copy() {
        let text = value()
        StanceClipboard.copy(text)
        onCopy?(text)
        copied = true
        StanceAnnouncer.announce(copiedLabel)
        resetTask?.cancel()
        resetTask = Task { @MainActor in
            try? await Task.sleep(for: .seconds(StanceMotion.confirmationDuration))
            guard !Task.isCancelled else { return }
            copied = false
        }
    }
}

// MARK: Localised labels

extension StanceCopyButton {
    /// Creates a copy button whose title is looked up in the app's string tables.
    public init(
        value: @escaping @autoclosure () -> String,
        label labelKey: LocalizedStringResource,
        copiedLabel: String? = nil,
        showsLabel: Bool = true,
        variant: StanceButtonVariant = .outline,
        onCopy: ((String) -> Void)? = nil
    ) {
        self.init(value: value(), label: String(localized: labelKey), copiedLabel: copiedLabel, showsLabel: showsLabel, variant: variant, onCopy: onCopy)
    }
}
