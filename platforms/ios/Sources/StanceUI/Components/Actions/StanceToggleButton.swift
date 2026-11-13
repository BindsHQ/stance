import SwiftUI

/// Draws a native `Toggle` as a button that stays pressed while it is on.
///
/// The `Toggle` keeps its binding and behaviour; this style only changes how it looks. The on
/// state is shown by a filled background, a stronger border and a heavier label, never by
/// colour alone, and VoiceOver hears the selected trait.
public struct StanceToggleButtonStyle: ToggleStyle {
    public var size: StanceButtonSize

    /// - Parameter size: The Stance button size. Every size keeps a 44pt target.
    public init(size: StanceButtonSize = .medium) {
        self.size = size
    }

    public func makeBody(configuration: Configuration) -> some View {
        StanceToggleButtonBody(configuration: configuration, size: size)
    }
}

extension ToggleStyle where Self == StanceToggleButtonStyle {
    /// A toggle drawn as a Stance button that stays pressed while on.
    public static func stanceButton(size: StanceButtonSize = .medium) -> StanceToggleButtonStyle {
        StanceToggleButtonStyle(size: size)
    }
}

private struct StanceToggleButtonBody: View {
    let configuration: ToggleStyleConfiguration
    let size: StanceButtonSize
    @Environment(\.stanceTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled

    var body: some View {
        let on = configuration.isOn
        let shape = RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous)
        Button {
            configuration.isOn.toggle()
        } label: {
            configuration.label
                .stanceText(size.textStyle)
                .fontWeight(on ? .semibold : .medium)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: true, vertical: true)
                .padding(.horizontal, size.horizontalPadding)
                .frame(minHeight: size.height)
                .foregroundStyle(isEnabled ? (on ? theme.colors.interactiveSelectedFg : theme.colors.fgDefault) : theme.colors.disabledFg)
                .background(on ? theme.colors.interactiveSelected : .clear, in: shape)
                .overlay {
                    shape.strokeBorder(
                        on ? theme.colors.borderStrong : (isEnabled ? theme.colors.borderControl : theme.colors.disabledBorder),
                        lineWidth: on ? max(theme.controlBorderWidth, theme.focusWidth) : theme.controlBorderWidth
                    )
                }
                .contentShape(shape)
                .frame(minHeight: StanceSize.touchTarget)
        }
        .buttonStyle(.plain)
        .stanceAnimation(.fast, value: on)
        .accessibilityAddTraits(on ? [.isButton, .isSelected] : .isButton)
        .sensoryFeedback(.selection, trigger: on)
    }
}

/// A button that toggles an option on and off, such as Bold or "Show archived".
///
/// It is a native `Toggle` in ``StanceToggleButtonStyle``.
public struct StanceToggleButton: View {
    private let title: String
    private let icon: StanceIconName?
    private let showsTitle: Bool
    private let size: StanceButtonSize
    @Binding private var isOn: Bool

    /// - Parameters:
    ///   - title: The visible label and accessible name.
    ///   - icon: An optional leading icon.
    ///   - showsTitle: Hide the title for an icon only button. VoiceOver still hears it.
    ///   - isOn: Whether the option is on.
    ///   - size: The Stance button size.
    @_disfavoredOverload
    public init(_ title: String, icon: StanceIconName? = nil, showsTitle: Bool = true, isOn: Binding<Bool>, size: StanceButtonSize = .medium) {
        self.title = title
        self.icon = icon
        self.showsTitle = showsTitle
        _isOn = isOn
        self.size = size
    }

    public var body: some View {
        Toggle(isOn: $isOn) {
            HStack(spacing: StanceSpacing.s1_5) {
                if let icon { StanceIcon(icon, size: StanceSize.iconSm + StanceSpacing.xxs) }
                if showsTitle { Text(title) }
            }
        }
        .toggleStyle(.stanceButton(size: size))
        .accessibilityLabel(title)
    }
}

/// One option in a ``StanceToggleButtonGroup``.
public struct StanceToggleOption<Value: Hashable>: Identifiable {
    public let value: Value
    public let title: String
    public let icon: StanceIconName?
    public var id: Value { value }

    /// - Parameters:
    ///   - value: The value the option selects.
    ///   - title: The visible label and accessible name.
    ///   - icon: An optional leading icon.
    @_disfavoredOverload
    public init(_ value: Value, title: String, icon: StanceIconName? = nil) {
        self.value = value
        self.title = title
        self.icon = icon
    }

    /// Creates an option whose title is looked up in the app's string tables.
    public init(_ value: Value, title titleKey: LocalizedStringResource, icon: StanceIconName? = nil) {
        self.init(value, title: String(localized: titleKey), icon: icon)
    }
}

/// The selection rules for ``StanceToggleButtonGroup``, exposed for tests.
public enum StanceToggleGroupLogic {
    /// Single selection: tapping the selected option clears it unless a value is required.
    public static func toggling<Value: Hashable>(_ value: Value, in selection: Value?, isRequired: Bool) -> Value? {
        if selection == value { return isRequired ? value : nil }
        return value
    }

    /// Multiple selection: tapping an option adds or removes it.
    public static func toggling<Value: Hashable>(_ value: Value, in selection: Set<Value>) -> Set<Value> {
        var next = selection
        if next.contains(value) { next.remove(value) } else { next.insert(value) }
        return next
    }
}

/// A row of toggle buttons for one setting: a single choice, or several independent options.
///
/// Buttons wrap onto more lines when they do not fit and at accessibility text sizes. VoiceOver
/// treats the group as one container named by `label`, with each button selected or not.
public struct StanceToggleButtonGroup<Value: Hashable>: View {
    private enum Selection {
        case single(Binding<Value?>, isRequired: Bool)
        case multiple(Binding<Set<Value>>)
    }

    private let label: String
    private let options: [StanceToggleOption<Value>]
    private let selection: Selection
    private let size: StanceButtonSize
    private let showsTitles: Bool
    @Environment(\.stanceTheme) private var theme

    /// A group where at most one option is selected.
    ///
    /// - Parameters:
    ///   - label: The accessible name of the group, such as "Alignment".
    ///   - selection: The selected value, or `nil` for none.
    ///   - options: The options, in order.
    ///   - isRequired: When true, tapping the selected option keeps it selected.
    ///   - showsTitles: Hide titles for icon only buttons. VoiceOver still hears them.
    ///   - size: The Stance button size.
    @_disfavoredOverload
    public init(_ label: String, selection: Binding<Value?>, options: [StanceToggleOption<Value>], isRequired: Bool = false, showsTitles: Bool = true, size: StanceButtonSize = .medium) {
        self.label = label
        self.selection = .single(selection, isRequired: isRequired)
        self.options = options
        self.showsTitles = showsTitles
        self.size = size
    }

    /// A group where any number of options can be on.
    @_disfavoredOverload
    public init(_ label: String, selection: Binding<Set<Value>>, options: [StanceToggleOption<Value>], showsTitles: Bool = true, size: StanceButtonSize = .medium) {
        self.label = label
        self.selection = .multiple(selection)
        self.options = options
        self.showsTitles = showsTitles
        self.size = size
    }

    public var body: some View {
        StanceFlowLayout(spacing: StanceSpacing.sm, lineSpacing: StanceSpacing.sm) {
            ForEach(options) { option in
                Toggle(isOn: binding(for: option.value)) {
                    HStack(spacing: StanceSpacing.s1_5) {
                        if let icon = option.icon { StanceIcon(icon, size: StanceSize.iconSm + StanceSpacing.xxs) }
                        if showsTitles || option.icon == nil { Text(option.title) }
                    }
                }
                .toggleStyle(.stanceButton(size: size))
                .accessibilityLabel(option.title)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    private func binding(for value: Value) -> Binding<Bool> {
        switch selection {
        case let .single(binding, isRequired):
            Binding(
                get: { binding.wrappedValue == value },
                set: { _ in binding.wrappedValue = StanceToggleGroupLogic.toggling(value, in: binding.wrappedValue, isRequired: isRequired) }
            )
        case let .multiple(binding):
            Binding(
                get: { binding.wrappedValue.contains(value) },
                set: { _ in binding.wrappedValue = StanceToggleGroupLogic.toggling(value, in: binding.wrappedValue) }
            )
        }
    }
}

// MARK: Localised labels

extension StanceToggleButton {
    /// Creates a toggle button whose title is looked up in the app's string tables.
    public init(_ titleKey: LocalizedStringResource, icon: StanceIconName? = nil, showsTitle: Bool = true, isOn: Binding<Bool>, size: StanceButtonSize = .medium) {
        self.init(String(localized: titleKey), icon: icon, showsTitle: showsTitle, isOn: isOn, size: size)
    }
}

extension StanceToggleButtonGroup {
    /// Creates a single choice group whose label is looked up in the app's string tables.
    public init(_ labelKey: LocalizedStringResource, selection: Binding<Value?>, options: [StanceToggleOption<Value>], isRequired: Bool = false, showsTitles: Bool = true, size: StanceButtonSize = .medium) {
        self.init(String(localized: labelKey), selection: selection, options: options, isRequired: isRequired, showsTitles: showsTitles, size: size)
    }

    /// Creates a multiple choice group whose label is looked up in the app's string tables.
    public init(_ labelKey: LocalizedStringResource, selection: Binding<Set<Value>>, options: [StanceToggleOption<Value>], showsTitles: Bool = true, size: StanceButtonSize = .medium) {
        self.init(String(localized: labelKey), selection: selection, options: options, showsTitles: showsTitles, size: size)
    }
}
