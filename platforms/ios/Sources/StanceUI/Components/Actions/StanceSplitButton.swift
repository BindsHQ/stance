import StanceTokens
import SwiftUI

/// A primary action joined to a menu of related actions, built on the native
/// `Menu(primaryAction:)`.
///
/// Tapping the title runs the primary action. Touching and holding it opens the menu, as with
/// any iOS menu that has a primary action, and the chevron segment opens the same menu with a
/// single tap so the extra actions are easy to find. VoiceOver hears two buttons: the action,
/// with a hint about the menu, and "More options".
///
/// ```swift
/// StanceSplitButton("Deploy", action: deploy) {
///     Button("Deploy to a test group") {}
///     Button("Schedule deployment") {}
/// }
/// ```
public struct StanceSplitButton<MenuContent: View>: View {
    private let title: String
    private let icon: StanceIconName?
    private let variant: StanceButtonVariant
    private let menuLabel: String?
    private let action: () -> Void
    private let menu: () -> MenuContent
    @Environment(\.stanceTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - title: The primary action's title.
    ///   - icon: An optional leading icon.
    ///   - variant: `.primary`, `.secondary` or `.outline`. Other variants draw as `.outline`.
    ///   - menuLabel: The accessible name of the chevron. Defaults to a localised "More options".
    ///   - action: The primary action.
    ///   - menu: The related actions, as `Button`s, `Divider`s and `Section`s.
    @_disfavoredOverload
    public init(
        _ title: String,
        icon: StanceIconName? = nil,
        variant: StanceButtonVariant = .primary,
        menuLabel: String? = nil,
        action: @escaping () -> Void,
        @ViewBuilder menu: @escaping () -> MenuContent
    ) {
        self.title = title
        self.icon = icon
        self.variant = [.primary, .secondary, .outline].contains(variant) ? variant : .outline
        self.menuLabel = menuLabel
        self.action = action
        self.menu = menu
    }

    public var body: some View {
        let shape = RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous)
        HStack(spacing: 0) {
            Menu {
                menu()
            } label: {
                HStack(spacing: StanceSpacing.sm) {
                    if let icon { StanceIcon(icon, size: StanceSize.iconSm + StanceSpacing.xxs) }
                    Text(title).stanceText(.button).lineLimit(2).multilineTextAlignment(.center)
                }
                .padding(.horizontal, StanceSpacing.lg)
                .frame(minHeight: StanceSize.touchTarget)
                .contentShape(Rectangle())
            } primaryAction: {
                action()
            }
            .accessibilityHint(stanceString("stance.splitButton.hint", locale))
            Rectangle()
                .fill(divider)
                .frame(width: max(theme.borderWidth, theme.controlBorderWidth))
                .padding(.vertical, StanceSpacing.sm)
                .accessibilityHidden(true)
            Menu {
                menu()
            } label: {
                StanceIcon(.chevronDown, size: StanceSize.iconSm)
                    .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
                    .contentShape(Rectangle())
            }
            .accessibilityLabel(menuLabel ?? stanceString("stance.splitButton.more", locale))
        }
        .menuStyle(.button)
        .buttonStyle(.plain)
        .foregroundStyle(foreground)
        .background(background, in: shape)
        .overlay { shape.strokeBorder(border, lineWidth: theme.controlBorderWidth) }
        .fixedSize()
    }

    private var foreground: Color {
        guard isEnabled else { return theme.colors.disabledFg }
        return variant == .primary ? theme.colors.accentFg : theme.colors.fgDefault
    }

    private var background: Color {
        guard isEnabled else { return variant == .outline ? .clear : theme.colors.disabledBg }
        switch variant {
        case .primary: return theme.colors.accentBg
        case .secondary: return theme.colors.bgMuted
        default: return .clear
        }
    }

    private var border: Color {
        guard variant == .outline || (theme.isHighContrast && variant == .secondary) else { return .clear }
        return isEnabled ? theme.colors.borderControl : theme.colors.disabledBorder
    }

    /// The line between the two segments: the label colour, faded so it reads as a seam.
    private var divider: Color {
        variant == .primary ? theme.colors.accentFg.opacity(StanceTokens.Opacity.disabled) : theme.colors.borderControl
    }
}

// MARK: Localised labels

extension StanceSplitButton {
    /// Creates a split button whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        icon: StanceIconName? = nil,
        variant: StanceButtonVariant = .primary,
        menuLabel: String? = nil,
        action: @escaping () -> Void,
        @ViewBuilder menu: @escaping () -> MenuContent
    ) {
        self.init(String(localized: titleKey), icon: icon, variant: variant, menuLabel: menuLabel, action: action, menu: menu)
    }
}
