import SwiftUI

/// The commit rules of a ``StanceInlineEdit``, exposed for apps and tests.
public enum StanceInlineEditLogic {
    /// The value a draft becomes when committed: trimmed of surrounding spaces and new lines
    /// when `trims` is true.
    public nonisolated static func committedValue(_ draft: String, trims: Bool) -> String {
        trims ? draft.trimmingCharacters(in: .whitespacesAndNewlines) : draft
    }
}

/// A value shown as text that turns into a text field when tapped, such as a template name
/// people rename now and then.
///
/// Return or the save button commits, the cancel button or Escape on a hardware keyboard
/// restores the previous value. An optional `validate` closure keeps the field open with
/// an error until the value is acceptable. VoiceOver reads the label and value, with a hint
/// that the row can be edited.
public struct StanceInlineEdit: View {
    private let label: String
    private let placeholder: String?
    private let trims: Bool
    private let validate: ((String) -> String?)?
    private let onCommit: ((String) -> Void)?
    private let onCancel: (() -> Void)?
    @Binding private var text: String
    @State private var draft = ""
    @State private var isEditing = false
    @State private var error: String?
    @FocusState private var focused: Bool
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.isEnabled) private var isEnabled

    /// - Parameters:
    ///   - label: The accessible name and the field's label while editing.
    ///   - text: The committed value.
    ///   - placeholder: Shown when the value is empty. Defaults to a localised "Add a value".
    ///   - trims: Removes surrounding spaces when committing.
    ///   - validate: Returns an error message for an unacceptable value, or `nil`.
    ///   - onCommit: Called with the new value after it is saved.
    ///   - onCancel: Called when editing is cancelled.
    @_disfavoredOverload
    public init(
        _ label: String,
        text: Binding<String>,
        placeholder: String? = nil,
        trims: Bool = true,
        validate: ((String) -> String?)? = nil,
        onCommit: ((String) -> Void)? = nil,
        onCancel: (() -> Void)? = nil
    ) {
        self.label = label
        _text = text
        self.placeholder = placeholder
        self.trims = trims
        self.validate = validate
        self.onCommit = onCommit
        self.onCancel = onCancel
    }

    public var body: some View {
        Group {
            if isEditing { editor } else { display }
        }
        .stanceAnimation(.fast, value: isEditing)
    }

    private var display: some View {
        Button {
            draft = text
            error = nil
            isEditing = true
            focused = true
        } label: {
            HStack(spacing: StanceSpacing.sm) {
                Text(text.isEmpty ? (placeholder ?? stanceString("stance.inlineEdit.placeholder", locale)) : text)
                    .stanceText(.body)
                    .foregroundStyle(text.isEmpty ? theme.colors.fgSubtle : (isEnabled ? theme.colors.fgDefault : theme.colors.disabledFg))
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                StanceIcon(.pencil, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted)
            }
            .padding(.horizontal, StanceSpacing.md)
            .frame(minHeight: StanceSize.touchTarget)
            .contentShape(Rectangle())
        }
        .buttonStyle(StanceInlineEditRowStyle())
        .accessibilityLabel(label)
        .accessibilityValue(text)
        .accessibilityHint(stanceString("stance.inlineEdit.hint", locale))
    }

    private var editor: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.s1_5) {
            HStack(spacing: StanceSpacing.xs) {
                TextField(label, text: $draft)
                    .focused($focused)
                    .submitLabel(.done)
                    .onSubmit(commit)
                    .onKeyPress(.escape) {
                        cancel()
                        return .handled
                    }
                    .frame(minHeight: StanceSize.touchTarget)
                    .accessibilityLabel(label)
                    .accessibilityHint(error ?? "")
                iconButton(.check, label: stanceString("stance.inlineEdit.save", locale), action: commit)
                iconButton(.x, label: stanceString("stance.cancel", locale), action: cancel)
            }
            .padding(.trailing, -StanceSpacing.sm)
            .modifier(StanceFieldChrome(isFocused: focused, isInvalid: error != nil))
            if let error {
                Label {
                    Text(error)
                } icon: {
                    StanceIcon(.alertCircle, size: StanceSize.iconSm)
                }
                .stanceText(.caption)
                .foregroundStyle(theme.colors.dangerFg)
                .accessibilityHidden(true)
            }
        }
        .onAppear { focused = true }
    }

    private func iconButton(_ icon: StanceIconName, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            StanceIcon(icon, size: StanceSize.iconSm + StanceSpacing.xxs)
                .foregroundStyle(theme.colors.fgMuted)
                .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement()
        .accessibilityAddTraits(.isButton)
        .accessibilityLabel(label)
    }

    private func commit() {
        let value = StanceInlineEditLogic.committedValue(draft, trims: trims)
        if let message = validate?(value), !message.isEmpty {
            error = message
            StanceAnnouncer.announce(stanceString("stance.field.announcement \(label) \(message)", locale), urgent: true)
            return
        }
        error = nil
        if value != text { text = value }
        isEditing = false
        onCommit?(value)
    }

    private func cancel() {
        draft = text
        error = nil
        isEditing = false
        onCancel?()
    }
}

/// The read state of an inline edit: plain text that shows a pressed background.
private struct StanceInlineEditRowStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        StanceInlineEditRow(configuration: configuration)
    }
}

private struct StanceInlineEditRow: View {
    let configuration: ButtonStyleConfiguration
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        configuration.label
            .background(configuration.isPressed ? theme.colors.interactiveActive : .clear, in: RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous)
                    .strokeBorder(theme.isHighContrast ? theme.colors.borderDefault : .clear, lineWidth: theme.borderWidth)
            }
    }
}

// MARK: Localised labels

extension StanceInlineEdit {
    /// Creates an inline edit whose label is looked up in the app's string tables.
    public init(
        _ labelKey: LocalizedStringResource,
        text: Binding<String>,
        placeholder: String? = nil,
        trims: Bool = true,
        validate: ((String) -> String?)? = nil,
        onCommit: ((String) -> Void)? = nil,
        onCancel: (() -> Void)? = nil
    ) {
        self.init(String(localized: labelKey), text: text, placeholder: placeholder, trims: trims, validate: validate, onCommit: onCommit, onCancel: onCancel)
    }
}
