import SwiftUI

/// The user's appearance preference. Raw values match the web (`stance-theme`).
public enum StanceAppearance: String, CaseIterable, Identifiable, Sendable {
    case system
    case light
    case dark
    case highContrast = "high-contrast"

    public var id: String { rawValue }

    /// The UserDefaults key, shared with the web storage key name.
    public static let storageKey = "stance-theme"

    /// The name of the appearance, localised for the current locale.
    public var title: String { title(locale: .current) }

    /// The name of the appearance, localised for `locale`.
    public func title(locale: Locale) -> String {
        switch self {
        case .system: StanceLocalization.string("stance.appearance.system", locale: locale)
        case .light: StanceLocalization.string("stance.appearance.light", locale: locale)
        case .dark: StanceLocalization.string("stance.appearance.dark", locale: locale)
        case .highContrast: StanceLocalization.string("stance.appearance.highContrast", locale: locale)
        }
    }

    public var systemImage: String {
        switch self {
        case .system: "circle.lefthalf.filled"
        case .light: "sun.max"
        case .dark: "moon"
        case .highContrast: "circle.righthalf.filled.inverse"
        }
    }

    /// Resolves the preference to a concrete mode.
    ///
    /// In `system`, Increase Contrast selects high contrast; otherwise the
    /// system colour scheme selects light or dark.
    public func resolve(colorScheme: ColorScheme, increasedContrast: Bool) -> StanceTheme.Mode {
        switch self {
        case .light: .light
        case .dark: .dark
        case .highContrast: .highContrast
        case .system: increasedContrast ? .highContrast : (colorScheme == .dark ? .dark : .light)
        }
    }

    /// Reads the stored preference, falling back to `system` for missing or unknown values.
    public static func stored(in defaults: UserDefaults = .standard) -> StanceAppearance {
        defaults.string(forKey: storageKey).flatMap(StanceAppearance.init(rawValue:)) ?? .system
    }

    public func store(in defaults: UserDefaults = .standard) {
        defaults.set(rawValue, forKey: Self.storageKey)
    }
}

/// Applies a Stance theme to a view hierarchy.
///
/// Place it once at the root of the app. The preference is read synchronously
/// from UserDefaults before the first frame, so the wrong theme never flashes.
///
/// ```swift
/// @main struct MyApp: App {
///     var body: some Scene {
///         WindowGroup { StanceThemeProvider { RootView() } }
///     }
/// }
/// ```
///
/// Pass a ``StanceBrand`` to build the palette from your own colours, in light, dark and high
/// contrast (including Increase Contrast):
///
/// ```swift
/// StanceThemeProvider(brand: acme) { RootView() }
/// ```
public struct StanceThemeProvider<Content: View>: View {
    @AppStorage(StanceAppearance.storageKey) private var stored: String = StanceAppearance.system.rawValue
    private let brand: StanceBrand?
    private let fontFamily: String?
    private let content: Content

    /// - Parameters:
    ///   - brand: Optional brand. `nil` keeps the brand from the environment, which is the
    ///     default palette unless an ancestor set one.
    ///   - fontFamily: Optional custom font family.
    public init(brand: StanceBrand? = nil, fontFamily: String? = nil, @ViewBuilder content: () -> Content) {
        self.brand = brand
        self.fontFamily = fontFamily
        self.content = content()
    }

    public var body: some View {
        let appearance = StanceAppearance(rawValue: stored) ?? .system
        content.modifier(StanceThemeModifier(appearance: appearance, brand: brand, fontFamily: fontFamily))
    }
}

struct StanceThemeModifier: ViewModifier {
    let appearance: StanceAppearance
    let brand: StanceBrand?
    let fontFamily: String?
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.colorSchemeContrast) private var contrast
    @Environment(\.stanceBrand) private var inheritedBrand

    func body(content: Content) -> some View {
        let mode = appearance.resolve(colorScheme: colorScheme, increasedContrast: contrast == .increased)
        let theme = StanceTheme(mode: mode, brand: brand ?? inheritedBrand, fontFamily: fontFamily)
        content
            .environment(\.stanceTheme, theme)
            .environment(\.stanceBrand, theme.brand)
            .tint(theme.colors.accentBg)
            .foregroundStyle(theme.colors.fgDefault)
            .background(theme.colors.bgCanvas.ignoresSafeArea())
            .preferredColorScheme(appearance == .system ? nil : theme.colorScheme)
    }
}

/// Re-themes a subtree with a brand, keeping the active mode and font family.
struct StanceBrandModifier: ViewModifier {
    let brand: StanceBrand
    @Environment(\.stanceTheme) private var current

    func body(content: Content) -> some View {
        let theme = StanceTheme(mode: current.mode, brand: brand, fontFamily: current.fontFamily)
        content
            .environment(\.stanceTheme, theme)
            .environment(\.stanceBrand, brand)
            .foregroundStyle(theme.colors.fgDefault)
            .tint(theme.colors.accentBg)
    }
}

/// Scopes a fixed mode to a subtree, keeping the brand from the environment.
struct StanceScopedThemeModifier: ViewModifier {
    let mode: StanceTheme.Mode
    @Environment(\.stanceBrand) private var brand
    @Environment(\.stanceTheme) private var current

    func body(content: Content) -> some View {
        let theme = StanceTheme(mode: mode, brand: brand, fontFamily: current.fontFamily)
        content
            .environment(\.stanceTheme, theme)
            .environment(\.colorScheme, theme.colorScheme)
            .foregroundStyle(theme.colors.fgDefault)
            .tint(theme.colors.accentBg)
    }
}

extension View {
    /// Applies a Stance appearance to this view and its descendants.
    /// - Parameter brand: Optional brand; `nil` keeps the brand from the environment.
    public func stanceTheme(_ appearance: StanceAppearance, brand: StanceBrand? = nil, fontFamily: String? = nil) -> some View {
        modifier(StanceThemeModifier(appearance: appearance, brand: brand, fontFamily: fontFamily))
    }

    /// Applies a brand to this view and its descendants, in whichever mode is active.
    ///
    /// ```swift
    /// PartnerPanel().stanceBrand(partner)
    /// ```
    ///
    /// The rest of the app keeps its own brand. ``StanceBrand/binds`` restores the default palette.
    public func stanceBrand(_ brand: StanceBrand) -> some View {
        modifier(StanceBrandModifier(brand: brand))
    }

    /// Scopes a fixed theme to a subtree (for example an inverted section or a preview).
    /// The brand from the environment carries over.
    public func stanceScopedTheme(_ mode: StanceTheme.Mode) -> some View {
        modifier(StanceScopedThemeModifier(mode: mode))
    }
}
