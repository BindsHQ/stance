import SwiftUI

/// A checkbox. iOS has no system checkbox, so this is a custom control exposed
/// to assistive technology as a toggle button with its checked state.
public struct StanceCheckbox: View {
    private let label: String
    private let description: String?
    @Binding private var isOn: Bool
    @Environment(\.stanceTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled

    public init(_ label: String, description: String? = nil, isOn: Binding<Bool>) {
        self.label = label
        self.description = description
        _isOn = isOn
    }

    public var body: some View {
        Button {
            isOn.toggle()
            StanceHaptics.selection()
        } label: {
            HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.md) {
                ZStack {
                    RoundedRectangle(cornerRadius: StanceRadius.xs, style: .continuous)
                        .fill(isOn ? (isEnabled ? theme.colors.accentBg : theme.colors.disabledBg) : theme.colors.bgSurface)
                    RoundedRectangle(cornerRadius: StanceRadius.xs, style: .continuous)
                        .strokeBorder(isOn ? .clear : (isEnabled ? theme.colors.borderControl : theme.colors.disabledBorder), lineWidth: max(1.5, theme.controlBorderWidth))
                    if isOn { StanceIcon(.check, size: StanceSize.iconSm).foregroundStyle(isEnabled ? theme.colors.accentFg : theme.colors.disabledFg) }
                }
                .frame(width: 22, height: 22)
                .alignmentGuide(.firstTextBaseline) { $0[.bottom] - 5 }
                VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                    Text(label).stanceText(.body).foregroundStyle(isEnabled ? theme.colors.fgDefault : theme.colors.disabledFg)
                    if let description { Text(description).stanceText(.caption).foregroundStyle(theme.colors.fgMuted) }
                }
                .multilineTextAlignment(.leading)
                Spacer(minLength: 0)
            }
            .frame(minHeight: StanceSize.touchTarget)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
        .accessibilityHint(description ?? "")
        .accessibilityValue(isOn ? "Checked" : "Not checked")
        .accessibilityAddTraits(.isToggle)
    }
}

/// One choice in a ``StanceRadioGroup``.
public struct StanceRadioOption<Value: Hashable>: Identifiable {
    public let value: Value
    public let label: String
    public let description: String?
    public var id: Value { value }

    public init(_ value: Value, label: String, description: String? = nil) {
        self.value = value
        self.label = label
        self.description = description
    }
}

/// A group of mutually exclusive options, visible all at once.
/// For long lists use ``StancePicker`` (a native menu or wheel) instead.
public struct StanceRadioGroup<Value: Hashable>: View {
    private let title: String
    private let options: [StanceRadioOption<Value>]
    @Binding private var selection: Value
    @Environment(\.stanceTheme) private var theme

    public init(_ title: String, selection: Binding<Value>, options: [StanceRadioOption<Value>]) {
        self.title = title
        _selection = selection
        self.options = options
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.xs) {
            Text(title).stanceText(.label).accessibilityAddTraits(.isHeader)
            ForEach(options) { option in
                let selected = option.value == selection
                Button {
                    selection = option.value
                    StanceHaptics.selection()
                } label: {
                    HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.md) {
                        ZStack {
                            Circle().strokeBorder(selected ? theme.colors.accentBg : theme.colors.borderControl, lineWidth: max(1.5, theme.controlBorderWidth))
                            if selected { Circle().fill(theme.colors.accentBg).padding(5) }
                        }
                        .frame(width: 22, height: 22)
                        .alignmentGuide(.firstTextBaseline) { $0[.bottom] - 5 }
                        VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                            Text(option.label).stanceText(.body)
                            if let description = option.description {
                                Text(description).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
                            }
                        }
                        .multilineTextAlignment(.leading)
                        Spacer(minLength: 0)
                    }
                    .frame(minHeight: StanceSize.touchTarget)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(option.label)
                .accessibilityHint(option.description ?? "")
                .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(title)
    }
}

/// Stance colours for the native `Toggle`. The system switch keeps its behaviour and accessibility.
public struct StanceToggleStyle: ToggleStyle {
    public init() {}

    public func makeBody(configuration: Configuration) -> some View {
        StanceToggleBody(configuration: configuration)
    }
}

private struct StanceToggleBody: View {
    let configuration: ToggleStyleConfiguration
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        Toggle(isOn: configuration.$isOn) { configuration.label.stanceText(.body) }
            .toggleStyle(.switch)
            .tint(theme.colors.accentBg)
            .frame(minHeight: StanceSize.touchTarget)
    }
}

extension ToggleStyle where Self == StanceToggleStyle {
    /// The native switch in Stance colours.
    public static var stance: StanceToggleStyle { StanceToggleStyle() }
}

/// A labelled native `Slider` that reports its value to VoiceOver in readable form.
public struct StanceSlider: View {
    private let label: String
    private let range: ClosedRange<Double>
    private let step: Double
    private let format: (Double) -> String
    @Binding private var value: Double
    @Environment(\.stanceTheme) private var theme

    public init(_ label: String, value: Binding<Double>, in range: ClosedRange<Double> = 0 ... 100, step: Double = 1, format: @escaping (Double) -> String = { String(Int($0)) }) {
        self.label = label
        _value = value
        self.range = range
        self.step = step
        self.format = format
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.xs) {
            HStack {
                Text(label).stanceText(.label)
                Spacer()
                Text(format(value)).stanceText(.label).foregroundStyle(theme.colors.fgMuted).monospacedDigit()
            }
            .accessibilityHidden(true)
            Slider(value: $value, in: range, step: step)
                .tint(theme.colors.accentBg)
                .frame(minHeight: StanceSize.touchTarget)
                .accessibilityLabel(label)
                .accessibilityValue(format(value))
        }
    }
}

/// A labelled native `Picker`, shown as a menu inside Stance field chrome.
public struct StancePicker<Value: Hashable>: View {
    private let label: String
    private let options: [(value: Value, title: String)]
    private let helper: String?
    @Binding private var selection: Value
    @Environment(\.stanceTheme) private var theme

    public init(_ label: String, selection: Binding<Value>, options: [(value: Value, title: String)], helper: String? = nil) {
        self.label = label
        _selection = selection
        self.options = options
        self.helper = helper
    }

    public var body: some View {
        StanceFormField(label, helper: helper) {
            Menu {
                Picker(label, selection: $selection) {
                    ForEach(options, id: \.value) { Text($0.title).tag($0.value) }
                }
            } label: {
                HStack {
                    Text(options.first { $0.value == selection }?.title ?? "")
                    Spacer()
                    StanceIcon(.chevronsUpDown, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted)
                }
                .modifier(StanceFieldChrome(isFocused: false, isInvalid: false))
                .contentShape(Rectangle())
            }
            .accessibilityValue(options.first { $0.value == selection }?.title ?? "")
        }
    }
}

/// A labelled native `DatePicker` (compact style) in Stance field chrome.
/// Pass `.hourAndMinute` for a time picker.
public struct StanceDatePicker: View {
    private let label: String
    private let components: DatePickerComponents
    private let range: ClosedRange<Date>?
    private let helper: String?
    @Binding private var date: Date
    @Environment(\.stanceTheme) private var theme

    public init(_ label: String, selection: Binding<Date>, displayedComponents: DatePickerComponents = .date, in range: ClosedRange<Date>? = nil, helper: String? = nil) {
        self.label = label
        _date = selection
        components = displayedComponents
        self.range = range
        self.helper = helper
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.s1_5) {
            Group {
                if let range {
                    DatePicker(label, selection: $date, in: range, displayedComponents: components)
                } else {
                    DatePicker(label, selection: $date, displayedComponents: components)
                }
            }
            .stanceText(.label)
            .tint(theme.colors.accentBg)
            .frame(minHeight: StanceSize.touchTarget)
            if let helper { Text(helper).stanceText(.caption).foregroundStyle(theme.colors.fgMuted) }
        }
    }
}
