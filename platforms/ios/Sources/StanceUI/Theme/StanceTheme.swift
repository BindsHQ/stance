import StanceTokens
import SwiftUI

extension Color {
    /// Creates a SwiftUI colour from a Stance token value.
    public init(_ token: StanceRGBA) {
        self.init(.sRGB, red: token.red, green: token.green, blue: token.blue, opacity: token.alpha)
    }
}

/// Semantic colours for the active theme, as SwiftUI colours.
///
/// Member names match the role names used on every Stance platform
/// (`bg-surface` on the web is `bgSurface` here).
@dynamicMemberLookup
public struct StanceColors: Equatable, Sendable {
    public let tokens: StanceColorTokens

    public init(_ tokens: StanceColorTokens) {
        self.tokens = tokens
    }

    public subscript(dynamicMember keyPath: KeyPath<StanceColorTokens, StanceRGBA>) -> Color {
        Color(tokens[keyPath: keyPath])
    }
}

/// The theme adapter: maps generated Stance tokens onto SwiftUI.
///
/// This is the only type that knows how tokens translate to platform values.
/// Components read colours, spacing, radii, type and motion from it and never
/// contain raw values.
public struct StanceTheme: Equatable, Sendable {
    /// The three Stance appearance modes.
    public enum Mode: String, CaseIterable, Sendable {
        case light
        case dark
        case highContrast = "high-contrast"
    }

    public let mode: Mode
    /// The generated tokens for `mode`: dimensions, shadows and the default palette's colours.
    /// Components read colours from ``colors``, which carries the brand.
    public let tokens: StanceThemeTokens
    /// The semantic colours for `mode`, from ``brand``.
    public let colors: StanceColors
    /// The brand the colours come from. ``StanceBrand/binds`` (the default) uses the generated
    /// tokens as they are.
    public let brand: StanceBrand
    /// Optional custom font family (for example "DM Sans" when the app bundles it).
    /// `nil` uses the system font, which is the default on Apple platforms.
    public var fontFamily: String?

    public init(mode: Mode, brand: StanceBrand = .binds, fontFamily: String? = nil) {
        self.mode = mode
        self.brand = brand
        tokens = Self.defaultTokens(for: mode)
        colors = StanceColors(brand.colors(for: mode))
        self.fontFamily = fontFamily
    }

    static func defaultTokens(for mode: Mode) -> StanceThemeTokens {
        switch mode {
        case .light: StanceTokens.light
        case .dark: StanceTokens.dark
        case .highContrast: StanceTokens.highContrast
        }
    }

    public static let light = StanceTheme(mode: .light)
    public static let dark = StanceTheme(mode: .dark)
    public static let highContrast = StanceTheme(mode: .highContrast)

    public var isDark: Bool { tokens.isDark }
    public var isHighContrast: Bool { mode == .highContrast }
    public var colorScheme: ColorScheme { tokens.isDark ? .dark : .light }

    public var borderWidth: CGFloat { tokens.borderWidth }
    public var controlBorderWidth: CGFloat { tokens.controlBorderWidth }
    public var focusWidth: CGFloat { tokens.focusWidth }
}

/// Spacing on the 4pt grid.
public enum StanceSpacing {
    public static let none: CGFloat = StanceTokens.Space.space0
    public static let xxs: CGFloat = StanceTokens.Space.space05
    public static let xs: CGFloat = StanceTokens.Space.space1
    public static let sm: CGFloat = StanceTokens.Space.space2
    public static let md: CGFloat = StanceTokens.Space.space3
    public static let lg: CGFloat = StanceTokens.Space.space4
    public static let xl: CGFloat = StanceTokens.Space.space6
    public static let xxl: CGFloat = StanceTokens.Space.space8
    public static let xxxl: CGFloat = StanceTokens.Space.space12
    public static let s1_5: CGFloat = StanceTokens.Space.space15
    public static let s2_5: CGFloat = StanceTokens.Space.space25
    public static let s5: CGFloat = StanceTokens.Space.space5
    public static let s10: CGFloat = StanceTokens.Space.space10
    public static let s16: CGFloat = StanceTokens.Space.space16
}

/// Corner radii.
public enum StanceRadius {
    public static let none: CGFloat = StanceTokens.Radius.none
    public static let xs: CGFloat = StanceTokens.Radius.xs
    public static let sm: CGFloat = StanceTokens.Radius.sm
    public static let md: CGFloat = StanceTokens.Radius.md
    public static let lg: CGFloat = StanceTokens.Radius.lg
    public static let xl: CGFloat = StanceTokens.Radius.xl
    public static let xxl: CGFloat = StanceTokens.Radius._2xl
    public static let full: CGFloat = StanceTokens.Radius.full
}

/// Control and target sizes.
public enum StanceSize {
    /// Minimum interactive target on iOS (44pt, Apple Human Interface Guidelines).
    public static let touchTarget: CGFloat = StanceTokens.TouchTarget.ios
    public static let controlXs: CGFloat = StanceTokens.Size.controlXs
    public static let controlSm: CGFloat = StanceTokens.Size.controlSm
    public static let controlMd: CGFloat = StanceTokens.Size.controlMd
    public static let controlLg: CGFloat = StanceTokens.Size.controlLg
    public static let iconSm: CGFloat = StanceTokens.Size.iconSm
    public static let iconMd: CGFloat = StanceTokens.Size.iconMd
    public static let iconLg: CGFloat = StanceTokens.Size.iconLg
    public static let readableWidth: CGFloat = StanceTokens.Size.containerSm
}

private struct StanceThemeKey: EnvironmentKey {
    static let defaultValue = StanceTheme.light
}

extension EnvironmentValues {
    /// The active Stance theme. Set by ``StanceThemeProvider`` or `.stanceTheme(_:)`.
    public var stanceTheme: StanceTheme {
        get { self[StanceThemeKey.self] }
        set { self[StanceThemeKey.self] = newValue }
    }

    /// The active brand. Set by ``StanceThemeProvider/init(brand:fontFamily:content:)`` or
    /// `.stanceBrand(_:)`; ``StanceBrand/binds`` by default.
    public var stanceBrand: StanceBrand {
        get { self[StanceBrandKey.self] }
        set { self[StanceBrandKey.self] = newValue }
    }
}

private struct StanceBrandKey: EnvironmentKey {
    static let defaultValue = StanceBrand.binds
}
