#if canImport(UIKit)
import StanceTokens
import SwiftUI
import UIKit

extension UIColor {
    /// Creates a UIKit colour from a Stance token value.
    public convenience init(_ token: StanceRGBA) {
        self.init(red: token.red, green: token.green, blue: token.blue, alpha: token.alpha)
    }
}

/// UIKit access to Stance tokens, for apps that mix UIKit and SwiftUI.
///
/// ```swift
/// view.backgroundColor = StanceUIKit.color(\.bgCanvas)       // tracks light/dark/increased contrast
/// label.font = StanceUIKit.font(.heading)                    // scales with Dynamic Type
/// label.adjustsFontForContentSizeCategory = true
/// ```
public enum StanceUIKit {
    /// A dynamic colour that follows the system appearance: dark mode selects the dark theme and
    /// Increase Contrast selects the high-contrast theme, matching `StanceAppearance.system`.
    public static func color(_ role: KeyPath<StanceColorTokens, StanceRGBA>) -> UIColor {
        UIColor { traits in
            let mode = StanceAppearance.system.resolve(
                colorScheme: traits.userInterfaceStyle == .dark ? .dark : .light,
                increasedContrast: traits.accessibilityContrast == .high
            )
            return UIColor(StanceTheme(mode: mode).tokens.colors[keyPath: role])
        }
    }

    /// A fixed colour for an explicit theme.
    public static func color(_ role: KeyPath<StanceColorTokens, StanceRGBA>, in mode: StanceTheme.Mode) -> UIColor {
        UIColor(StanceTheme(mode: mode).tokens.colors[keyPath: role])
    }

    /// A font for a Stance text style, scaled for the current Dynamic Type size.
    /// Set `adjustsFontForContentSizeCategory = true` on the label to keep it live.
    public static func font(_ style: StanceTextStyle, family: String? = nil) -> UIFont {
        let weight: UIFont.Weight = switch style.weight {
        case .semibold: .semibold
        case .medium: .medium
        case .bold: .bold
        default: .regular
        }
        let base: UIFont = if style == .mono {
            .monospacedSystemFont(ofSize: style.size, weight: weight)
        } else if let family, let custom = UIFont(name: family, size: style.size) {
            custom
        } else {
            .systemFont(ofSize: style.size, weight: weight)
        }
        return UIFontMetrics(forTextStyle: uiTextStyle(style)).scaledFont(for: base)
    }

    private static func uiTextStyle(_ style: StanceTextStyle) -> UIFont.TextStyle {
        switch style.relativeTo {
        case .largeTitle: .largeTitle
        case .title: .title1
        case .title2: .title2
        case .title3: .title3
        case .subheadline: .subheadline
        case .caption: .caption1
        default: .body
        }
    }

    /// Hosts a StanceUI view in UIKit with the Stance theme applied.
    @MainActor
    public static func hostingController<Content: View>(@ViewBuilder rootView: () -> Content) -> UIViewController {
        let controller = UIHostingController(rootView: StanceThemeProvider { rootView() })
        controller.view.backgroundColor = color(\.bgCanvas)
        return controller
    }
}

/// Haptic feedback for Stance interactions. No-ops where haptics are unavailable.
@MainActor
public enum StanceHaptics {
    public static func selection() { UISelectionFeedbackGenerator().selectionChanged() }
    public static func success() { UINotificationFeedbackGenerator().notificationOccurred(.success) }
    public static func warning() { UINotificationFeedbackGenerator().notificationOccurred(.warning) }
    public static func error() { UINotificationFeedbackGenerator().notificationOccurred(.error) }
    public static func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .light) {
        UIImpactFeedbackGenerator(style: style).impactOccurred()
    }
}
#else
/// Haptics are unavailable on this platform; calls are no-ops so shared code compiles.
@MainActor
public enum StanceHaptics {
    public static func selection() {}
    public static func success() {}
    public static func warning() {}
    public static func error() {}
    public static func impact() {}
}
#endif
