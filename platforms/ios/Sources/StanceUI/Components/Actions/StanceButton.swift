import SwiftUI

/// Visual emphasis of a button. Meanings match the web and Android implementations.
public enum StanceButtonVariant: String, CaseIterable, Sendable {
    case primary, secondary, outline, ghost, danger, link
}

/// Button sizes. Every size keeps a 44pt minimum touch target.
public enum StanceButtonSize: String, CaseIterable, Sendable {
    case small, medium, large

    var height: CGFloat {
        switch self {
        case .small: StanceSize.controlSm
        case .medium: StanceSize.touchTarget
        case .large: StanceSize.controlLg + StanceSpacing.xs
        }
    }

    var textStyle: StanceTextStyle { self == .small ? .label : .button }
    var horizontalPadding: CGFloat { self == .small ? StanceSpacing.md : self == .medium ? StanceSpacing.lg : StanceSpacing.xl }
}

/// The Stance button style. Apply it to any `Button`, `Menu` label or `NavigationLink`.
///
/// ```swift
/// Button("Save changes") { save() }
///     .buttonStyle(.stance(.primary))
/// ```
public struct StanceButtonStyle: ButtonStyle {
    public var variant: StanceButtonVariant
    public var size: StanceButtonSize
    public var fullWidth: Bool
    public var pill: Bool

    public init(_ variant: StanceButtonVariant = .primary, size: StanceButtonSize = .medium, fullWidth: Bool = false, pill: Bool = false) {
        self.variant = variant
        self.size = size
        self.fullWidth = fullWidth
        self.pill = pill
    }

    public func makeBody(configuration: Configuration) -> some View {
        StanceButtonBody(style: self, configuration: configuration)
    }
}

extension ButtonStyle where Self == StanceButtonStyle {
    /// The Stance button style.
    public static func stance(_ variant: StanceButtonVariant = .primary, size: StanceButtonSize = .medium, fullWidth: Bool = false, pill: Bool = false) -> StanceButtonStyle {
        StanceButtonStyle(variant, size: size, fullWidth: fullWidth, pill: pill)
    }
}

private struct StanceButtonBody: View {
    let style: StanceButtonStyle
    let configuration: ButtonStyleConfiguration
    @Environment(\.stanceTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        let radius = style.pill ? StanceRadius.full : StanceRadius.md
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        configuration.label
            .stanceText(style.size.textStyle)
            .lineLimit(2)
            .multilineTextAlignment(.center)
            // Buttons that hug their label take its natural width, so the label is never cut
            // short when a parent under-proposes width (seen on iOS when a theme is scoped to a
            // subtree). Full-width buttons wrap within their width instead.
            .fixedSize(horizontal: !style.fullWidth, vertical: true)
            .padding(.horizontal, style.variant == .link ? 0 : style.size.horizontalPadding)
            .padding(.vertical, StanceSpacing.xs)
            .frame(maxWidth: style.fullWidth ? .infinity : nil, minHeight: style.variant == .link ? nil : style.size.height)
            .foregroundStyle(foreground)
            .background(background(pressed: configuration.isPressed), in: shape)
            .overlay { shape.strokeBorder(border, lineWidth: theme.controlBorderWidth) }
            .underline(style.variant == .link)
            .contentShape(shape)
            .frame(minHeight: StanceSize.touchTarget)
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.98 : 1)
            .animation(StanceMotion.fast.animation(reduceMotion: reduceMotion), value: configuration.isPressed)
    }

    private var foreground: Color {
        guard isEnabled else { return theme.colors.disabledFg }
        return switch style.variant {
        case .primary: theme.colors.accentFg
        case .danger: theme.colors.dangerOnSolid
        case .link: theme.colors.fgLink
        default: theme.colors.fgDefault
        }
    }

    private func background(pressed: Bool) -> Color {
        guard isEnabled else {
            return style.variant == .ghost || style.variant == .link || style.variant == .outline ? .clear : theme.colors.disabledBg
        }
        return switch style.variant {
        case .primary: pressed ? theme.colors.accentBgActive : theme.colors.accentBg
        case .secondary: pressed ? theme.colors.bgEmphasis : theme.colors.bgMuted
        case .outline, .ghost: pressed ? theme.colors.interactiveActive : .clear
        case .danger: pressed ? theme.colors.dangerSolidHover : theme.colors.dangerSolid
        case .link: .clear
        }
    }

    private var border: Color {
        guard style.variant == .outline || (theme.isHighContrast && style.variant == .secondary) else { return .clear }
        return isEnabled ? theme.colors.borderControl : theme.colors.disabledBorder
    }
}

/// A button with a title, optional icons and a loading state.
///
/// Loading replaces the leading icon with a progress indicator, keeps the label,
/// blocks repeat taps and tells VoiceOver the action is in progress.
public struct StanceButton: View {
    private let title: String
    private let variant: StanceButtonVariant
    private let size: StanceButtonSize
    private let leadingIcon: StanceIconName?
    private let trailingIcon: StanceIconName?
    private let isLoading: Bool
    private let fullWidth: Bool
    private let pill: Bool
    private let role: ButtonRole?
    private let action: () -> Void

    public init(
        _ title: String,
        variant: StanceButtonVariant = .primary,
        size: StanceButtonSize = .medium,
        leadingIcon: StanceIconName? = nil,
        trailingIcon: StanceIconName? = nil,
        isLoading: Bool = false,
        fullWidth: Bool = false,
        pill: Bool = false,
        role: ButtonRole? = nil,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.variant = variant
        self.size = size
        self.leadingIcon = leadingIcon
        self.trailingIcon = trailingIcon
        self.isLoading = isLoading
        self.fullWidth = fullWidth
        self.pill = pill
        self.role = role
        self.action = action
    }

    @Environment(\.stanceTheme) private var theme

    private var spinnerColor: Color {
        switch variant {
        case .primary: theme.colors.accentFg
        case .danger: theme.colors.dangerOnSolid
        case .link: theme.colors.fgLink
        default: theme.colors.fgDefault
        }
    }

    public var body: some View {
        Button(role: role) {
            if !isLoading { action() }
        } label: {
            HStack(spacing: StanceSpacing.sm) {
                if isLoading {
                    // The spinner takes the label colour so it is visible on every variant.
                    ProgressView().controlSize(.small).tint(spinnerColor)
                } else if let leadingIcon {
                    StanceIcon(leadingIcon, size: StanceSize.iconSm + 2)
                }
                Text(title)
                if let trailingIcon, !isLoading { StanceIcon(trailingIcon, size: StanceSize.iconSm + 2) }
            }
        }
        .buttonStyle(.stance(variant, size: size, fullWidth: fullWidth, pill: pill))
        .accessibilityValue(isLoading ? "In progress" : "")
    }
}

/// An icon-only button. The label is required: it is the accessible name.
public struct StanceIconButton: View {
    private let icon: StanceIconName
    private let label: String
    private let variant: StanceButtonVariant
    private let action: () -> Void
    @Environment(\.stanceTheme) private var theme

    public init(_ icon: StanceIconName, label: String, variant: StanceButtonVariant = .ghost, action: @escaping () -> Void) {
        self.icon = icon
        self.label = label
        self.variant = variant
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            StanceIcon(icon).frame(width: StanceSize.touchTarget - StanceSpacing.lg, height: StanceSize.touchTarget - StanceSpacing.xs * 2)
        }
        .buttonStyle(.stance(variant, size: .medium))
        .accessibilityLabel(label)
        #if os(iOS)
        .hoverEffect(.highlight)
        #endif
    }
}

/// Lays related buttons out in a row, and in a column when they do not fit or at large text sizes.
public struct StanceButtonGroup<Content: View>: View {
    private let content: Content
    @Environment(\.dynamicTypeSize) private var typeSize

    public init(@ViewBuilder content: () -> Content) { self.content = content() }

    public var body: some View {
        if typeSize.isAccessibilitySize {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) { content }
        } else {
            // One row when the buttons fit, otherwise a column. Labels are never squeezed.
            ViewThatFits(in: .horizontal) {
                HStack(spacing: StanceSpacing.sm) { content }
                VStack(alignment: .leading, spacing: StanceSpacing.sm) { content }
            }
        }
    }
}

/// A native `Menu` whose trigger looks like a Stance button.
public struct StanceMenu<Content: View>: View {
    private let title: String
    private let variant: StanceButtonVariant
    private let content: Content

    public init(_ title: String, variant: StanceButtonVariant = .outline, @ViewBuilder content: () -> Content) {
        self.title = title
        self.variant = variant
        self.content = content()
    }

    public var body: some View {
        Menu {
            content
        } label: {
            HStack(spacing: StanceSpacing.sm) {
                Text(title)
                StanceIcon(.chevronDown, size: StanceSize.iconSm)
            }
        }
        .buttonStyle(.stance(variant))
    }
}
