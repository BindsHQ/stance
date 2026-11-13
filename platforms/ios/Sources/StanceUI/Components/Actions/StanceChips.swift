import SwiftUI

/// A compact chip for a short value: tappable, removable, or both.
///
/// Use it for applied values such as recipients or selected filters. The remove control is a
/// separate button with its own 44pt target and the name "Remove Sales". For a plain keyword
/// label use ``StanceTag``; for an on and off filter use ``StanceFilterChip``.
public struct StanceChip: View {
    private let title: String
    private let icon: StanceIconName?
    private let action: (() -> Void)?
    private let onRemove: (() -> Void)?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - title: The visible text and accessible name.
    ///   - icon: An optional leading icon.
    ///   - action: Runs when the chip is tapped. Leave out for a chip that only removes.
    ///   - onRemove: Shows a remove button that calls this.
    @_disfavoredOverload
    public init(_ title: String, icon: StanceIconName? = nil, action: (() -> Void)? = nil, onRemove: (() -> Void)? = nil) {
        self.title = title
        self.icon = icon
        self.action = action
        self.onRemove = onRemove
    }

    public var body: some View {
        HStack(spacing: 0) {
            main
            if let onRemove {
                Button(action: onRemove) {
                    StanceIcon(.x, size: StanceSize.iconSm)
                        .frame(width: StanceSize.controlSm, height: StanceSize.controlSm)
                        // 32pt drawn, 44pt to touch.
                        .contentShape(Rectangle().inset(by: -(StanceSize.touchTarget - StanceSize.controlSm) / 2))
                }
                .buttonStyle(.plain)
                .foregroundStyle(isEnabled ? theme.colors.fgMuted : theme.colors.disabledFg)
                .accessibilityLabel(stanceString("stance.remove \(title)", locale))
            }
        }
        .padding(.trailing, onRemove == nil ? 0 : StanceSpacing.xxs)
        .background(theme.colors.bgMuted, in: Capsule())
        .overlay { Capsule().strokeBorder(isEnabled ? theme.colors.borderDefault : theme.colors.disabledBorder, lineWidth: theme.borderWidth) }
        .frame(minHeight: StanceSize.touchTarget)
        .contentShape(Rectangle())
    }

    @ViewBuilder private var main: some View {
        let label = HStack(spacing: StanceSpacing.xs) {
            if let icon { StanceIcon(icon, size: StanceSize.iconSm) }
            Text(title).stanceText(.label).lineLimit(1)
        }
        .foregroundStyle(isEnabled ? theme.colors.fgDefault : theme.colors.disabledFg)
        .padding(.leading, StanceSpacing.md)
        .padding(.trailing, onRemove == nil ? StanceSpacing.md : StanceSpacing.xxs)
        .frame(minHeight: StanceSize.controlSm)

        if let action {
            Button(action: action) { label.contentShape(Rectangle()) }
                .buttonStyle(.plain)
        } else {
            label.accessibilityElement(children: .combine)
        }
    }
}

/// An on and off chip for filter rows, with a tick when selected.
///
/// It is a native `Toggle` drawn as a chip. The selected state shows a tick, a fill and a
/// stronger border, and VoiceOver hears the selected trait. Use several in a row, or
/// ``StanceFilterBar`` for a ready made scrolling row with "Clear all".
public struct StanceFilterChip: View {
    private let title: String
    private let count: Int?
    @Binding private var isOn: Bool

    /// - Parameters:
    ///   - title: The visible text and accessible name.
    ///   - count: An optional number of matching items, shown after the title.
    ///   - isOn: Whether the filter is applied.
    @_disfavoredOverload
    public init(_ title: String, count: Int? = nil, isOn: Binding<Bool>) {
        self.title = title
        self.count = count
        _isOn = isOn
    }

    public var body: some View {
        Toggle(title, isOn: $isOn)
            .toggleStyle(StanceFilterChipStyle(count: count))
    }
}

private struct StanceFilterChipStyle: ToggleStyle {
    let count: Int?

    func makeBody(configuration: Configuration) -> some View {
        StanceFilterChipBody(configuration: configuration, count: count)
    }
}

private struct StanceFilterChipBody: View {
    let configuration: ToggleStyleConfiguration
    let count: Int?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.locale) private var locale

    var body: some View {
        let on = configuration.isOn
        Button {
            configuration.isOn.toggle()
        } label: {
            HStack(spacing: StanceSpacing.xs) {
                if on { StanceIcon(.check, size: StanceSize.iconSm).transition(.scale.combined(with: .opacity)) }
                configuration.label.stanceText(.label)
                if let count {
                    Text(count.formatted(.number.locale(locale))).stanceText(.caption).monospacedDigit()
                        .foregroundStyle(on ? theme.colors.interactiveSelectedFg : theme.colors.fgMuted)
                }
            }
            .padding(.horizontal, StanceSpacing.md)
            .frame(minHeight: StanceSize.controlSm + StanceSpacing.xs)
            .foregroundStyle(isEnabled ? (on ? theme.colors.interactiveSelectedFg : theme.colors.fgDefault) : theme.colors.disabledFg)
            .background(on ? theme.colors.interactiveSelected : .clear, in: Capsule())
            .overlay {
                Capsule().strokeBorder(on ? theme.colors.borderStrong : (isEnabled ? theme.colors.borderControl : theme.colors.disabledBorder), lineWidth: theme.controlBorderWidth)
            }
            .frame(minHeight: StanceSize.touchTarget)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .stanceAnimation(.fast, value: on)
        .accessibilityAddTraits(on ? [.isButton, .isSelected] : .isButton)
        .sensoryFeedback(.selection, trigger: on)
    }
}

// MARK: Localised labels

extension StanceChip {
    /// Creates a chip whose title is looked up in the app's string tables.
    public init(_ titleKey: LocalizedStringResource, icon: StanceIconName? = nil, action: (() -> Void)? = nil, onRemove: (() -> Void)? = nil) {
        self.init(String(localized: titleKey), icon: icon, action: action, onRemove: onRemove)
    }
}

extension StanceFilterChip {
    /// Creates a filter chip whose title is looked up in the app's string tables.
    public init(_ titleKey: LocalizedStringResource, count: Int? = nil, isOn: Binding<Bool>) {
        self.init(String(localized: titleKey), count: count, isOn: isOn)
    }
}
