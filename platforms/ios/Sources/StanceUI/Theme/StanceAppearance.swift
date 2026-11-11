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

    public var title: String {
        switch self {
        case .system: "System"
        case .light: "Light"
        case .dark: "Dark"
        case .highContrast: "High contrast"
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
public struct StanceThemeProvider<Content: View>: View {
    @AppStorage(StanceAppearance.storageKey) private var stored: String = StanceAppearance.system.rawValue
    private let fontFamily: String?
    private let content: Content

    public init(fontFamily: String? = nil, @ViewBuilder content: () -> Content) {
        self.fontFamily = fontFamily
        self.content = content()
    }

    public var body: some View {
        let appearance = StanceAppearance(rawValue: stored) ?? .system
        content.modifier(StanceThemeModifier(appearance: appearance, fontFamily: fontFamily))
    }
}

struct StanceThemeModifier: ViewModifier {
    let appearance: StanceAppearance
    let fontFamily: String?
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.colorSchemeContrast) private var contrast

    func body(content: Content) -> some View {
        let mode = appearance.resolve(colorScheme: colorScheme, increasedContrast: contrast == .increased)
        let theme = StanceTheme(mode: mode, fontFamily: fontFamily)
        content
            .environment(\.stanceTheme, theme)
            .tint(theme.colors.accentBg)
            .foregroundStyle(theme.colors.fgDefault)
            .background(theme.colors.bgCanvas.ignoresSafeArea())
            .preferredColorScheme(appearance == .system ? nil : theme.colorScheme)
    }
}

extension View {
    /// Applies a Stance appearance to this view and its descendants.
    public func stanceTheme(_ appearance: StanceAppearance, fontFamily: String? = nil) -> some View {
        modifier(StanceThemeModifier(appearance: appearance, fontFamily: fontFamily))
    }

    /// Scopes a fixed theme to a subtree (for example an inverted section or a preview).
    public func stanceScopedTheme(_ mode: StanceTheme.Mode) -> some View {
        let theme = StanceTheme(mode: mode)
        return environment(\.stanceTheme, theme)
            .environment(\.colorScheme, theme.colorScheme)
            .foregroundStyle(theme.colors.fgDefault)
            .tint(theme.colors.accentBg)
    }
}
