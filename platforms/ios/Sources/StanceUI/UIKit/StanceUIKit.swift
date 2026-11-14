#if canImport(UIKit)
import os
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
///
/// To use your own brand in UIKit, set ``brand`` once at launch, or pass one per lookup:
///
/// ```swift
/// StanceUIKit.brand = acme
/// ```
public enum StanceUIKit {
    private static let brandStorage = OSAllocatedUnfairLock(initialState: StanceBrand.binds)

    /// The brand UIKit colour lookups and ``hostingController(rootView:)`` use when none is passed.
    /// ``StanceBrand/binds`` (the default palette) unless you set one. Dynamic colours read it each
    /// time they resolve, so a change applies on the next redraw.
    public static var brand: StanceBrand {
        get { brandStorage.withLock { $0 } }
        set { brandStorage.withLock { $0 = newValue } }
    }

    /// A dynamic colour that follows the system appearance: dark mode selects the dark theme and
    /// Increase Contrast selects the high-contrast theme, matching `StanceAppearance.system`.
    /// - Parameter brand: The brand to use; `nil` uses ``brand``.
    public static func color(_ role: KeyPath<StanceColorTokens, StanceRGBA>, brand: StanceBrand? = nil) -> UIColor {
        UIColor { traits in
            let mode = StanceAppearance.system.resolve(
                colorScheme: traits.userInterfaceStyle == .dark ? .dark : .light,
                increasedContrast: traits.accessibilityContrast == .high
            )
            return UIColor((brand ?? Self.brand).colors(for: mode)[keyPath: role])
        }
    }

    /// A fixed colour for an explicit theme.
    /// - Parameter brand: The brand to use; `nil` uses ``brand``.
    public static func color(_ role: KeyPath<StanceColorTokens, StanceRGBA>, in mode: StanceTheme.Mode, brand: StanceBrand? = nil) -> UIColor {
        UIColor((brand ?? Self.brand).colors(for: mode)[keyPath: role])
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
    /// - Parameter brand: The brand to use; `nil` uses ``brand``.
    @MainActor
    public static func hostingController<Content: View>(brand: StanceBrand? = nil, @ViewBuilder rootView: () -> Content) -> UIViewController {
        let brand = brand ?? Self.brand
        let controller = UIHostingController(rootView: StanceThemeProvider(brand: brand) { rootView() })
        controller.view.backgroundColor = color(\.bgCanvas, brand: brand)
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
