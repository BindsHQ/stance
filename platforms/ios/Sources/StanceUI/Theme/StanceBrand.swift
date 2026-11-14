import Foundation
import os
import StanceTokens
import SwiftUI

/// A brand to theme Stance with: its lightest colour, its darkest colour and an optional accent.
///
/// Stance works as it is with its default palette, ``binds``. A brand is optional: give one to
/// ``StanceThemeProvider`` or `.stanceBrand(_:)` and every component picks up a full palette built
/// from your colours, in light, dark and high contrast (specs/brand-theming.md).
///
/// ```swift
/// let acme = StanceBrand(name: "Acme", light: "#F2F8FF", dark: "#0A1A50", accent: "#FF5A36")!
/// StanceThemeProvider(brand: acme) { RootView() }
/// ```
///
/// Colours are 8 bit sRGB: every initialiser rounds each channel to the nearest of 256 steps.
/// Each brand is resolved once and cached, so passing one around costs nothing per view update.
public struct StanceBrand: Hashable, Sendable {
    /// The accent for primary actions, selection, links and focus.
    public enum Accent: Hashable, Sendable {
        /// One starting colour for every theme.
        case color(StanceRGBA)
        /// Separate starting colours: `light` for the light and high contrast themes, `dark` for
        /// the dark theme.
        case themed(light: StanceRGBA, dark: StanceRGBA)
    }

    /// A human name, used in diagnostics.
    public let name: String
    /// The brand's lightest colour: the light canvas and the foreground on dark surfaces.
    public let light: StanceRGBA
    /// The brand's darkest colour: text, the default accent and the dark canvas.
    public let dark: StanceRGBA
    /// The optional accent. Without it the accent is `dark` in the light themes and `light` in the
    /// dark theme. Stance adjusts the accent's lightness where needed so every contrast check passes.
    public let accent: Accent?

    /// Creates a brand from Stance colour values.
    /// - Parameters:
    ///   - accent: Optional accent for every theme.
    ///   - accentDark: Optional separate accent for the dark theme. Used together with `accent`.
    public init(name: String, light: StanceRGBA, dark: StanceRGBA, accent: StanceRGBA? = nil, accentDark: StanceRGBA? = nil) {
        self.init(name: name, light: light, dark: dark, accent: Self.makeAccent(accent, accentDark))
    }

    /// Creates a brand from Stance colour values and an ``Accent``.
    public init(name: String, light: StanceRGBA, dark: StanceRGBA, accent: Accent?) {
        self.name = name
        self.light = Self.quantized(light)
        self.dark = Self.quantized(dark)
        self.accent = switch accent {
        case nil: nil
        case let .color(c): .color(Self.quantized(c))
        case let .themed(l, d): .themed(light: Self.quantized(l), dark: Self.quantized(d))
        }
    }

    /// Creates a brand from `#RGB` or `#RRGGBB` hex strings. Returns nil when a colour is not hex.
    public init?(name: String, light: String, dark: String, accent: String? = nil, accentDark: String? = nil) {
        func parse(_ text: String?) -> StanceRGBA?? {
            guard let text else { return .some(nil) }
            return StanceBrandEngine.parseHex(text).map { .some(StanceRGBA(hex: $0)) }
        }
        guard let l = StanceBrandEngine.parseHex(light), let d = StanceBrandEngine.parseHex(dark),
              let a = parse(accent), let ad = parse(accentDark) else { return nil }
        self.init(name: name, light: StanceRGBA(hex: l), dark: StanceRGBA(hex: d), accent: a, accentDark: ad)
    }

    /// Creates a brand from SwiftUI colours, resolved in a default (light) environment.
    public init(name: String, light: Color, dark: Color, accent: Color? = nil, accentDark: Color? = nil) {
        self.init(
            name: name,
            light: Self.rgba(light),
            dark: Self.rgba(dark),
            accent: accent.map(Self.rgba),
            accentDark: accentDark.map(Self.rgba)
        )
    }

    /// The default Stance palette, Binds Ivory and Indigo. Using it is the same as using no brand.
    public static let binds = StanceBrand(name: "Binds", light: StanceTokens.Brand.ivory, dark: StanceTokens.Brand.indigo)

    /// True when this brand has the default palette's colours and no accent, so the generated
    /// tokens are used as they are.
    public var isDefaultPalette: Bool {
        accent == nil && light == Self.binds.light && dark == Self.binds.dark
    }

    /// The semantic colours this brand gives `mode`.
    public func colors(for mode: StanceTheme.Mode) -> StanceColorTokens {
        if isDefaultPalette { return StanceTheme.defaultTokens(for: mode).colors }
        return StanceBrandCache.shared.resolved(self).colors(for: mode)
    }

    /// The role pairs that fail their contrast minimum (4.5:1 for text, 3:1 for controls and focus,
    /// higher in high contrast). Empty when the brand passes every check, as the default does.
    public func contrastReport() -> [StanceBrandContrastFailure] {
        if isDefaultPalette { return [] }
        return StanceBrandCache.shared.resolved(self).report
    }

    /// The light colour as `#RRGGBB`.
    public var lightHex: String { Self.hex(light) }
    /// The dark colour as `#RRGGBB`.
    public var darkHex: String { Self.hex(dark) }

    // MARK: Internals

    static func makeAccent(_ accent: StanceRGBA?, _ accentDark: StanceRGBA?) -> Accent? {
        guard let accent else { return nil }
        guard let accentDark else { return .color(accent) }
        return .themed(light: accent, dark: accentDark)
    }

    static func byte(_ channel: Double) -> UInt32 { StanceBrandEngine.byte(channel * 255) }

    static func rgb(_ c: StanceRGBA) -> UInt32 { byte(c.red) << 16 | byte(c.green) << 8 | byte(c.blue) }

    static func quantized(_ c: StanceRGBA) -> StanceRGBA { StanceRGBA(hex: rgb(c)) }

    static func hex(_ c: StanceRGBA) -> String { StanceBrandEngine.hexString(rgb(c)) }

    static func rgba(_ color: Color) -> StanceRGBA {
        let r = color.resolve(in: EnvironmentValues())
        return StanceRGBA(red: Double(r.red), green: Double(r.green), blue: Double(r.blue))
    }

    /// The accent's starting colours for the engine, light then dark.
    var engineAccent: (light: UInt32, dark: UInt32)? {
        switch accent {
        case nil: nil
        case let .color(c): (Self.rgb(c), Self.rgb(c))
        case let .themed(l, d): (Self.rgb(l), Self.rgb(d))
        }
    }

    /// Runs the brand engine for this brand, without the default palette shortcut or the cache.
    func resolve() -> StanceBrandEngine.Resolution {
        StanceBrandEngine.resolve(light: Self.rgb(light), dark: Self.rgb(dark), accent: engineAccent)
    }
}

/// One role pair whose WCAG 2 contrast is below the minimum Stance requires.
public struct StanceBrandContrastFailure: Hashable, Sendable, CustomStringConvertible {
    public let mode: StanceTheme.Mode
    /// Foreground role token name, for example `fg-link`.
    public let foreground: String
    /// Background role token name, for example `bg-canvas`.
    public let background: String
    /// Measured contrast ratio, rounded to two decimals.
    public let ratio: Double
    /// Minimum ratio for this pair in this theme.
    public let required: Double

    public var description: String {
        "\(mode.rawValue): \(foreground) on \(background) is \(ratio):1, needs \(required):1"
    }
}

/// A brand resolved into the three themes, with its contrast report.
struct StanceResolvedBrand: Sendable {
    let light: StanceColorTokens
    let dark: StanceColorTokens
    let highContrast: StanceColorTokens
    let report: [StanceBrandContrastFailure]

    func colors(for mode: StanceTheme.Mode) -> StanceColorTokens {
        switch mode {
        case .light: light
        case .dark: dark
        case .highContrast: highContrast
        }
    }

    init(_ brand: StanceBrand) {
        let resolution = brand.resolve()
        func tokens(_ mode: StanceTheme.Mode) -> StanceColorTokens {
            let roles = resolution.themes[mode.rawValue] ?? [:]
            return StanceColorTokens { name in
                guard let role = roles[name] else { preconditionFailure("Brand recipe has no role \(name)") }
                return role.rgba
            }
        }
        light = tokens(.light)
        dark = tokens(.dark)
        highContrast = tokens(.highContrast)

        var report: [StanceBrandContrastFailure] = []
        for mode in StanceTheme.Mode.allCases {
            let roles = resolution.themes[mode.rawValue] ?? [:]
            for pair in StanceBrandRecipe.contrastPairs {
                let required = mode == .highContrast ? pair.highContrastMinimum : pair.minimum
                let ratio = StanceBrandEngine.contrast(roles[pair.fg]?.hex ?? 0, roles[pair.bg]?.hex ?? 0)
                if ratio < required {
                    report.append(StanceBrandContrastFailure(
                        mode: mode,
                        foreground: pair.fg,
                        background: pair.bg,
                        ratio: StanceBrandEngine.roundHalfUp(ratio * 100) / 100,
                        required: required
                    ))
                }
            }
        }
        self.report = report
    }
}

/// Resolves each brand once and keeps the result. Brands are a handful of colours, so the cache
/// stays tiny; it is shared across threads behind a lock.
final class StanceBrandCache: Sendable {
    static let shared = StanceBrandCache()
    static let limit = 64

    private let storage = OSAllocatedUnfairLock(initialState: [StanceBrand: StanceResolvedBrand]())

    func resolved(_ brand: StanceBrand) -> StanceResolvedBrand {
        if let hit = storage.withLock({ $0[brand] }) { return hit }
        // Resolve outside the lock; a rare duplicate resolution is harmless and returns equal values.
        let value = StanceResolvedBrand(brand)
        let inserted = storage.withLock { state -> Bool in
            guard state[brand] == nil else { return false }
            // Apps use a few brands. A live colour picker can make many, so keep the cache bounded.
            if state.count >= Self.limit { state.removeAll(keepingCapacity: true) }
            state[brand] = value
            return true
        }
        if inserted { Self.logFailures(brand, value.report) }
        return value
    }

    private static func logFailures(_ brand: StanceBrand, _ report: [StanceBrandContrastFailure]) {
        #if DEBUG
        guard !report.isEmpty else { return }
        let logger = Logger(subsystem: "com.bindshq.stance", category: "brand")
        let lines = report.map(\.description).joined(separator: "\n")
        logger.warning("Stance brand \"\(brand.name, privacy: .public)\" has \(report.count) contrast pairs under their minimum:\n\(lines, privacy: .public)")
        #endif
    }
}
