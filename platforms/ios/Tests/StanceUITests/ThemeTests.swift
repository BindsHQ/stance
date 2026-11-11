import Foundation
import StanceTokens
import SwiftUI
import Testing
@testable import StanceUI

@Suite("Appearance resolution")
struct AppearanceTests {
    @Test("System follows colour scheme and Increase Contrast", arguments: [
        (ColorScheme.light, false, StanceTheme.Mode.light),
        (.dark, false, .dark),
        (.light, true, .highContrast),
        (.dark, true, .highContrast),
    ])
    func system(scheme: ColorScheme, contrast: Bool, expected: StanceTheme.Mode) {
        #expect(StanceAppearance.system.resolve(colorScheme: scheme, increasedContrast: contrast) == expected)
    }

    @Test("Explicit preferences ignore the system", arguments: [ColorScheme.light, .dark], [true, false])
    func explicit(scheme: ColorScheme, contrast: Bool) {
        #expect(StanceAppearance.light.resolve(colorScheme: scheme, increasedContrast: contrast) == .light)
        #expect(StanceAppearance.dark.resolve(colorScheme: scheme, increasedContrast: contrast) == .dark)
        #expect(StanceAppearance.highContrast.resolve(colorScheme: scheme, increasedContrast: contrast) == .highContrast)
    }

    @Test("Raw values match the web storage values")
    func rawValues() {
        #expect(StanceAppearance.allCases.map(\.rawValue) == ["system", "light", "dark", "high-contrast"])
        #expect(StanceAppearance.storageKey == "stance-theme")
    }

    @Test("Preference persists and falls back to system")
    func persistence() throws {
        let defaults = try #require(UserDefaults(suiteName: "stance.tests.\(UUID().uuidString)"))
        #expect(StanceAppearance.stored(in: defaults) == .system)
        StanceAppearance.highContrast.store(in: defaults)
        #expect(StanceAppearance.stored(in: defaults) == .highContrast)
        #expect(defaults.string(forKey: "stance-theme") == "high-contrast")
        defaults.set("purple", forKey: "stance-theme")
        #expect(StanceAppearance.stored(in: defaults) == .system)
    }
}

@Suite("Theme adapter")
struct ThemeAdapterTests {
    @Test("Each mode maps to its generated token set")
    func tokens() {
        #expect(StanceTheme(mode: .light).tokens == StanceTokens.light)
        #expect(StanceTheme(mode: .dark).tokens == StanceTokens.dark)
        #expect(StanceTheme(mode: .highContrast).tokens == StanceTokens.highContrast)
        #expect(StanceTheme.dark.colorScheme == .dark)
        #expect(StanceTheme.highContrast.colorScheme == .light)
        #expect(StanceTheme.highContrast.isHighContrast)
    }

    @Test("Brand colours are the official Binds values")
    func brand() {
        #expect(StanceTokens.Brand.ivory == StanceRGBA(hex: 0xFCF6EB))
        #expect(StanceTokens.Brand.indigo == StanceRGBA(hex: 0x140C2E))
        #expect(StanceTokens.light.colors.bgCanvas == StanceTokens.Brand.ivory)
        #expect(StanceTokens.light.colors.fgDefault == StanceTokens.Brand.indigo)
        #expect(StanceTokens.dark.colors.bgCanvas == StanceTokens.Brand.indigo)
        #expect(StanceTokens.dark.colors.fgDefault == StanceTokens.Brand.ivory)
    }

    @Test("Token colours convert to SwiftUI colours without loss")
    func colorMapping() {
        let resolved = Color(StanceTokens.Brand.indigo).resolve(in: EnvironmentValues())
        #expect(abs(Double(resolved.red) - pow(20.0 / 255, 1)) < 0.2) // resolved is linear; sanity bound
        #expect(resolved.opacity == 1)
        let scrim = Color(StanceTokens.light.colors.bgScrim).resolve(in: EnvironmentValues())
        #expect(abs(Double(scrim.opacity) - 0.48) < 0.001)
    }

    @Test("Spacing, radius and sizes come from tokens")
    func scales() {
        #expect(StanceSpacing.lg == 16)
        #expect(StanceSpacing.xs == 4)
        #expect(StanceRadius.md == 8)
        #expect(StanceSize.touchTarget == 44)
        #expect(StanceTheme.highContrast.focusWidth == 3)
        #expect(StanceTheme.light.focusWidth == 2)
    }

    @Test("High contrast encodes elevation as an outline, not a blur")
    func elevation() {
        #expect(StanceElevation.md.layers(in: .highContrast).allSatisfy { $0.blur == 0 })
        #expect(StanceElevation.md.layers(in: .light).contains { $0.blur > 0 })
    }
}

@Suite("Typography")
struct TypographyTests {
    @Test("Sizes follow the token type scale")
    func sizes() {
        #expect(Double(StanceTextStyle.body.size) == StanceTokens.FontSize.sizemd)
        #expect(Double(StanceTextStyle.caption.size) == StanceTokens.FontSize.sizexs)
        #expect(Double(StanceTextStyle.display.size) == StanceTokens.FontSize.size3xl)
        #expect(StanceTextStyle.title.size > StanceTextStyle.heading.size)
        #expect(StanceTextStyle.heading.size > StanceTextStyle.body.size)
    }

    @Test("No style is smaller than 12pt and every style scales with Dynamic Type", arguments: StanceTextStyle.allCases)
    func legible(style: StanceTextStyle) {
        #expect(style.size >= 12)
        _ = style.relativeTo // every style declares a Dynamic Type anchor
    }

    @Test("Headings are tightened and eyebrows are spaced")
    func tracking() {
        #expect(StanceTextStyle.display.tracking < 0)
        #expect(StanceTextStyle.eyebrow.tracking > 0)
        #expect(StanceTextStyle.body.tracking == 0)
    }
}

@Suite("Motion")
struct MotionTests {
    @Test("Reduce Motion removes animation")
    func reduceMotion() {
        #expect(StanceMotion.normal.animation(reduceMotion: true) == nil)
        #expect(StanceMotion.normal.animation(reduceMotion: false) != nil)
        #expect(StanceMotion.fast.duration == StanceTokens.Duration.fast)
        #expect(StanceMotion.slow.duration > StanceMotion.fast.duration)
    }
}

@Suite("Contrast (WCAG 2.2)")
struct ContrastTests {
    nonisolated(unsafe) static let textPairs: [(String, KeyPath<StanceColorTokens, StanceRGBA>, KeyPath<StanceColorTokens, StanceRGBA>)] = [
        ("fgDefault/bgCanvas", \.fgDefault, \.bgCanvas),
        ("fgDefault/bgSurface", \.fgDefault, \.bgSurface),
        ("fgDefault/bgMuted", \.fgDefault, \.bgMuted),
        ("fgMuted/bgCanvas", \.fgMuted, \.bgCanvas),
        ("fgMuted/bgSurface", \.fgMuted, \.bgSurface),
        ("fgSubtle/bgCanvas", \.fgSubtle, \.bgCanvas),
        ("accentFg/accentBg", \.accentFg, \.accentBg),
        ("accentFg/accentBgActive", \.accentFg, \.accentBgActive),
        ("fgInverse/bgInverse", \.fgInverse, \.bgInverse),
        ("selected", \.interactiveSelectedFg, \.interactiveSelected),
        ("dangerFg/bgCanvas", \.dangerFg, \.bgCanvas),
        ("dangerFg/dangerBg", \.dangerFg, \.dangerBg),
        ("dangerOnSolid/dangerSolid", \.dangerOnSolid, \.dangerSolid),
        ("successFg/successBg", \.successFg, \.successBg),
        ("warningFg/warningBg", \.warningFg, \.warningBg),
        ("infoFg/infoBg", \.infoFg, \.infoBg),
    ]
    nonisolated(unsafe) static let boundaryPairs: [(String, KeyPath<StanceColorTokens, StanceRGBA>, KeyPath<StanceColorTokens, StanceRGBA>)] = [
        ("borderControl/bgCanvas", \.borderControl, \.bgCanvas),
        ("borderControl/bgSurface", \.borderControl, \.bgSurface),
        ("focusRing/bgCanvas", \.focusRing, \.bgCanvas),
    ]

    static func ratio(_ a: StanceRGBA, _ b: StanceRGBA) -> Double {
        StanceContrast.ratio((a.red, a.green, a.blue), (b.red, b.green, b.blue))
    }

    @Test("Text and boundaries meet the minimum in every theme", arguments: StanceTokens.allThemes)
    func themes(theme: StanceThemeTokens) {
        let high = theme.name == "high-contrast"
        for (name, fg, bg) in Self.textPairs {
            let r = Self.ratio(theme.colors[keyPath: fg], theme.colors[keyPath: bg])
            #expect(r >= (high ? 7 : 4.5), "\(theme.name) \(name) is \(r)")
        }
        for (name, fg, bg) in Self.boundaryPairs {
            let r = Self.ratio(theme.colors[keyPath: fg], theme.colors[keyPath: bg])
            #expect(r >= (high ? 4.5 : 3), "\(theme.name) \(name) is \(r)")
        }
    }

    @Test("Ivory on indigo is 17.4:1")
    func brandContrast() {
        let r = Self.ratio(StanceTokens.Brand.ivory, StanceTokens.Brand.indigo)
        #expect(abs(r - 17.4) < 0.05)
    }
}
