import SwiftUI

/// Validation state for a form field.
public struct StanceFieldState: Equatable, Sendable {
    public var error: String?
    public var isRequired: Bool

    public init(error: String? = nil, isRequired: Bool = false) {
        self.error = error
        self.isRequired = isRequired
    }

    public var isInvalid: Bool { !(error ?? "").isEmpty }

    /// What VoiceOver reads after the label: "required" and the error, when present.
    /// The fixed words are localised for `locale`.
    public func accessibilitySuffix(helper: String?, locale: Locale = .current) -> String {
        [isRequired ? stanceString("stance.field.required", locale) : nil, isInvalid ? stanceString("stance.field.error \(error ?? "")", locale) : helper]
            .compactMap { $0 }
            .joined(separator: ", ")
    }
}

/// Wires a label, helper text and error message to one control.
///
/// The label is visible (Voice Control users can say it), the control gets it as
/// its accessibility label, and errors are announced when they appear.
public struct StanceFormField<Content: View>: View {
    private let label: String
    private let helper: String?
    private let state: StanceFieldState
    private let content: Content
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    @_disfavoredOverload
    public init(_ label: String, helper: String? = nil, error: String? = nil, isRequired: Bool = false, @ViewBuilder content: () -> Content) {
        self.label = label
        self.helper = helper
        state = StanceFieldState(error: error, isRequired: isRequired)
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.s1_5) {
            HStack(spacing: StanceSpacing.xs) {
                Text(label).stanceText(.label)
                if state.isRequired { Text("*").stanceText(.label).foregroundStyle(theme.colors.dangerFg) }
            }
            .accessibilityHidden(true)
            content
                .accessibilityLabel(label)
                .accessibilityHint(state.accessibilitySuffix(helper: helper, locale: locale))
            if let error = state.error, state.isInvalid {
                Label {
                    Text(error)
                } icon: {
                    StanceIcon(.alertCircle, size: StanceSize.iconSm)
                }
                .stanceText(.caption)
                .foregroundStyle(theme.colors.dangerFg)
                .accessibilityHidden(true)
            } else if let helper {
                Text(helper).stanceText(.caption).foregroundStyle(theme.colors.fgMuted).accessibilityHidden(true)
            }
        }
        .onChange(of: state.error) { _, new in
            if let new, !new.isEmpty { StanceAnnouncer.announce(stanceString("stance.field.announcement \(label) \(new)", locale), urgent: true) }
        }
    }
}

/// The shared field box: border, background, focus and error treatment.
struct StanceFieldChrome: ViewModifier {
    let isFocused: Bool
    let isInvalid: Bool
    var minHeight: CGFloat = StanceSize.touchTarget
    @Environment(\.stanceTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled

    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous)
        content
            .stanceText(.body)
            .padding(.horizontal, StanceSpacing.md)
            .frame(minHeight: minHeight)
            .background(isEnabled ? theme.colors.bgSurface : theme.colors.disabledBg, in: shape)
            .overlay { shape.strokeBorder(border, lineWidth: isFocused || isInvalid ? max(2, theme.controlBorderWidth) : theme.controlBorderWidth) }
            .foregroundStyle(isEnabled ? theme.colors.fgDefault : theme.colors.disabledFg)
    }

    private var border: Color {
        if !isEnabled { return theme.colors.disabledBorder }
        if isInvalid { return theme.colors.dangerFg }
        return isFocused ? theme.colors.focusRing : theme.colors.borderControl
    }
}

/// A labelled single-line text field with helper and error text.
public struct StanceTextField: View {
    private let label: String
    private let placeholder: String
    private let helper: String?
    private let error: String?
    private let isRequired: Bool
    private let leadingIcon: StanceIconName?
    @Binding private var text: String
    @FocusState private var focused: Bool
    @Environment(\.stanceTheme) private var theme

    @_disfavoredOverload
    public init(
        _ label: String,
        text: Binding<String>,
        placeholder: String = "",
        helper: String? = nil,
        error: String? = nil,
        isRequired: Bool = false,
        leadingIcon: StanceIconName? = nil
    ) {
        self.label = label
        _text = text
        self.placeholder = placeholder
        self.helper = helper
        self.error = error
        self.isRequired = isRequired
        self.leadingIcon = leadingIcon
    }

    public var body: some View {
        StanceFormField(label, helper: helper, error: error, isRequired: isRequired) {
            HStack(spacing: StanceSpacing.sm) {
                if let leadingIcon { StanceIcon(leadingIcon, size: StanceSize.iconSm + 2).foregroundStyle(theme.colors.fgMuted) }
                TextField(placeholder, text: $text).focused($focused).frame(minHeight: StanceSize.touchTarget)
            }
            .modifier(StanceFieldChrome(isFocused: focused, isInvalid: !(error ?? "").isEmpty))
            .contentShape(Rectangle())
            .onTapGesture { focused = true }
        }
    }
}

/// A password field with a show/hide control.
public struct StanceSecureField: View {
    private let label: String
    private let helper: String?
    private let error: String?
    private let isRequired: Bool
    @Binding private var text: String
    @State private var revealed = false
    @ScaledMetric(relativeTo: .body) private var fieldHeight: CGFloat = StanceSize.touchTarget
    @FocusState private var focused: Bool
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    @_disfavoredOverload
    public init(_ label: String, text: Binding<String>, helper: String? = nil, error: String? = nil, isRequired: Bool = false) {
        self.label = label
        _text = text
        self.helper = helper
        self.error = error
        self.isRequired = isRequired
    }

    public var body: some View {
        StanceFormField(label, helper: helper, error: error, isRequired: isRequired) {
            HStack(spacing: StanceSpacing.sm) {
                Group {
                    if revealed { TextField("", text: $text) } else { SecureField("", text: $text) }
                }
                .frame(height: fieldHeight)
                .focused($focused)
                #if os(iOS)
                .textInputAutocapitalization(.never)
                #endif
                .autocorrectionDisabled()
                Button {
                    revealed.toggle()
                } label: {
                    StanceIcon(revealed ? .eyeOff : .eye, size: StanceSize.iconSm + 2)
                        .foregroundStyle(theme.colors.fgMuted)
                        .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityElement()
                .accessibilityAddTraits(.isButton)
                .accessibilityLabel(stanceString(revealed ? "stance.password.hide" : "stance.password.show", locale))
            }
            .padding(.trailing, -StanceSpacing.md)
            .modifier(StanceFieldChrome(isFocused: focused, isInvalid: !(error ?? "").isEmpty))
            .contentShape(Rectangle())
            .onTapGesture { focused = true }
        }
    }
}

/// A labelled multi-line editor with an optional character limit.
public struct StanceTextEditor: View {
    private let label: String
    private let helper: String?
    private let error: String?
    private let limit: Int?
    @Binding private var text: String
    @FocusState private var focused: Bool
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    @_disfavoredOverload
    public init(_ label: String, text: Binding<String>, helper: String? = nil, error: String? = nil, limit: Int? = nil) {
        self.label = label
        _text = text
        self.helper = helper
        self.error = error
        self.limit = limit
    }

    public var body: some View {
        StanceFormField(label, helper: limit.map { stanceString("stance.characters \(text.count) \($0)", locale) } ?? helper, error: error) {
            TextEditor(text: $text)
                .focused($focused)
                .scrollContentBackground(.hidden)
                .frame(minHeight: StanceSize.touchTarget * 2.5)
                .padding(.vertical, StanceSpacing.xs)
                .modifier(StanceFieldChrome(isFocused: focused, isInvalid: !(error ?? "").isEmpty))
            .contentShape(Rectangle())
            .onTapGesture { focused = true }
        }
    }
}

/// An inline search field with a clear button. For screen-level search prefer `.searchable`.
public struct StanceSearchField: View {
    private let customPrompt: String?
    @Binding private var text: String
    @FocusState private var focused: Bool
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    private var prompt: String { customPrompt ?? stanceString("stance.search", locale) }

    /// - Parameter prompt: The placeholder and accessible name. Defaults to a localised "Search".
    @_disfavoredOverload
    public init(_ prompt: String? = nil, text: Binding<String>) {
        customPrompt = prompt
        _text = text
    }

    public var body: some View {
        HStack(spacing: StanceSpacing.sm) {
            StanceIcon(.search, size: StanceSize.iconSm + 2).foregroundStyle(theme.colors.fgMuted)
            TextField(prompt, text: $text)
                .frame(minHeight: StanceSize.touchTarget)
                .focused($focused)
                .submitLabel(.search)
                .autocorrectionDisabled()
                .accessibilityLabel(prompt)
            if !text.isEmpty {
                Button {
                    text = ""
                } label: {
                    StanceIcon(.xCircle, size: StanceSize.iconSm + 2)
                        .foregroundStyle(theme.colors.fgMuted)
                        .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityElement()
                .accessibilityAddTraits(.isButton)
                .accessibilityLabel(stanceString("stance.search.clear", locale))
                .padding(.trailing, -StanceSpacing.md)
            }
        }
        .modifier(StanceFieldChrome(isFocused: focused, isInvalid: false))
        .contentShape(Rectangle())
        .onTapGesture { focused = true }
    }
}

// MARK: Localised labels

extension StanceFormField {
    /// Creates a field whose label is looked up in the app's string tables.
    public init(_ labelKey: LocalizedStringResource, helper: String? = nil, error: String? = nil, isRequired: Bool = false, @ViewBuilder content: () -> Content) {
        self.init(String(localized: labelKey), helper: helper, error: error, isRequired: isRequired, content: content)
    }
}

extension StanceTextField {
    /// Creates a text field whose label is looked up in the app's string tables.
    public init(
        _ labelKey: LocalizedStringResource,
        text: Binding<String>,
        placeholder: String = "",
        helper: String? = nil,
        error: String? = nil,
        isRequired: Bool = false,
        leadingIcon: StanceIconName? = nil
    ) {
        self.init(String(localized: labelKey), text: text, placeholder: placeholder, helper: helper, error: error, isRequired: isRequired, leadingIcon: leadingIcon)
    }
}

extension StanceSecureField {
    /// Creates a password field whose label is looked up in the app's string tables.
    public init(_ labelKey: LocalizedStringResource, text: Binding<String>, helper: String? = nil, error: String? = nil, isRequired: Bool = false) {
        self.init(String(localized: labelKey), text: text, helper: helper, error: error, isRequired: isRequired)
    }
}

extension StanceTextEditor {
    /// Creates an editor whose label is looked up in the app's string tables.
    public init(_ labelKey: LocalizedStringResource, text: Binding<String>, helper: String? = nil, error: String? = nil, limit: Int? = nil) {
        self.init(String(localized: labelKey), text: text, helper: helper, error: error, limit: limit)
    }
}

extension StanceSearchField {
    /// Creates a search field whose prompt is looked up in the app's string tables.
    public init(_ promptKey: LocalizedStringResource, text: Binding<String>) {
        self.init(String(localized: promptKey), text: text)
    }
}
