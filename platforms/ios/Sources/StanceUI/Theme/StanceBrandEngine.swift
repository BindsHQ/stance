import Foundation
import StanceTokens

/// The brand engine: OKLab colour maths, accent fitting and the role resolver behind brand
/// theming (specs/brand-theming.md).
///
/// Pure arithmetic on 8 bit sRGB colours (`0xRRGGBB`), with no UI framework involved. It follows
/// the web engine (`packages/tokens/src/brand-engine.js`) operation for operation, in `Double`,
/// so every platform produces the same 8 bit values: the shared fixture
/// (`packages/tokens/generated/json/brand-fixture.json`) is checked by the tests.
enum StanceBrandEngine {
    /// A resolved role: an 8 bit sRGB colour and an alpha from 0 to 1.
    struct Role: Equatable, Hashable, Sendable {
        let hex: UInt32
        let alpha: Double

        var rgba: StanceRGBA { StanceRGBA(hex: hex, alpha: alpha) }
    }

    /// Every role of every theme for one brand, keyed by theme name and then token name.
    struct Resolution: Equatable, Sendable {
        let ink: [Int: UInt32]
        let themes: [String: [String: Role]]
    }

    static let white: UInt32 = 0xFFFFFF
    static let black: UInt32 = 0x000000

    // MARK: sRGB

    /// Parses `#RGB` or `#RRGGBB` (case insensitive, leading `#` optional).
    static func parseHex(_ text: String) -> UInt32? {
        var h = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if h.hasPrefix("#") { h.removeFirst() }
        guard h.allSatisfy(\.isHexDigit) else { return nil }
        if h.count == 3 { h = h.map { "\($0)\($0)" }.joined() }
        guard h.count == 6 || h.count == 8 else { return nil }
        return UInt32(h.prefix(6), radix: 16)
    }

    /// Formats `0xRRGGBB` as uppercase `#RRGGBB`.
    static func hexString(_ rgb: UInt32) -> String {
        let digits = String(rgb & 0xFFFFFF, radix: 16, uppercase: true)
        return "#" + String(repeating: "0", count: max(0, 6 - digits.count)) + digits
    }

    /// JavaScript `Math.round`: the nearest integer, ties toward positive infinity.
    static func roundHalfUp(_ x: Double) -> Double {
        let floor = x.rounded(.down)
        return x - floor >= 0.5 ? floor + 1 : floor
    }

    /// One channel from 0 to 255 (any real value) to an 8 bit integer: clamp, then round half up.
    static func byte(_ channel: Double) -> UInt32 {
        UInt32(roundHalfUp(min(255, max(0, channel))))
    }

    static func channels(_ rgb: UInt32) -> (Double, Double, Double) {
        (Double((rgb >> 16) & 0xFF), Double((rgb >> 8) & 0xFF), Double(rgb & 0xFF))
    }

    /// Standard sRGB transfer function, encoded 0 to 1 to linear.
    static func toLinear(_ c: Double) -> Double {
        c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4)
    }

    /// Standard sRGB transfer function, linear 0 to 1 to encoded.
    static func toEncoded(_ c: Double) -> Double {
        c <= 0.0031308 ? c * 12.92 : 1.055 * pow(c, 1 / 2.4) - 0.055
    }

    // MARK: OKLab

    /// sRGB to OKLab with Björn Ottosson's 2020 matrices.
    static func oklab(_ rgb: UInt32) -> (L: Double, a: Double, b: Double) {
        let (r8, g8, b8) = channels(rgb)
        let r = toLinear(r8 / 255)
        let g = toLinear(g8 / 255)
        let b = toLinear(b8 / 255)
        let l = cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
        let m = cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
        let s = cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
        return (
            0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
        )
    }

    /// OKLab to 8 bit sRGB: out of gamut channels are clamped, then rounded half up.
    static func rgb(L: Double, a: Double, b: Double) -> UInt32 {
        let l = pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
        let m = pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
        let s = pow(L - 0.0894841775 * a - 1.291485548 * b, 3)
        let red = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
        let green = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
        let blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
        func encode(_ c: Double) -> UInt32 { byte(toEncoded(min(1, max(0, c))) * 255) }
        return encode(red) << 16 | encode(green) << 8 | encode(blue)
    }

    /// Linear interpolation in OKLab: `t = 0` returns `from`, `t = 1` returns `to`.
    static func mix(_ from: UInt32, _ to: UInt32, _ t: Double) -> UInt32 {
        let x = oklab(from)
        let y = oklab(to)
        return rgb(L: x.L + (y.L - x.L) * t, a: x.a + (y.a - x.a) * t, b: x.b + (y.b - x.b) * t)
    }

    // MARK: WCAG contrast

    /// WCAG 2 relative luminance.
    static func luminance(_ rgb: UInt32) -> Double {
        let (r8, g8, b8) = channels(rgb)
        return 0.2126 * toLinear(r8 / 255) + 0.7152 * toLinear(g8 / 255) + 0.0722 * toLinear(b8 / 255)
    }

    /// WCAG 2 contrast ratio, from 1 to 21.
    static func contrast(_ x: UInt32, _ y: UInt32) -> Double {
        let lx = luminance(x)
        let ly = luminance(y)
        return (max(lx, ly) + 0.05) / (min(lx, ly) + 0.05)
    }

    // MARK: Accent fitting

    /// Fits the OKLab lightness of `start` until it meets `minimum` contrast against every colour
    /// in `against`, keeping OKLab a and b. Exactly the steps documented on
    /// `StanceBrandRecipe.fitIterations`.
    static func fit(_ start: UInt32, against: [UInt32], minimum: Double, targetL: Double) -> UInt32 {
        func passes(_ c: UInt32) -> Bool { against.allSatisfy { contrast(c, $0) >= minimum } }
        if passes(start) { return start }
        let lab = oklab(start)
        func at(_ l: Double) -> UInt32 { rgb(L: l, a: lab.a, b: lab.b) }
        if !passes(at(targetL)) { return at(targetL) }
        var lo = lab.L
        var hi = targetL
        for _ in 0..<StanceBrandRecipe.fitIterations {
            let mid = (lo + hi) / 2
            if passes(at(mid)) { hi = mid } else { lo = mid }
        }
        return at(hi)
    }

    // MARK: Resolver

    /// The neutral ink scale from `light` (step 0) to `dark` (step 1000).
    static func inkScale(light: UInt32, dark: UInt32) -> [Int: UInt32] {
        Dictionary(uniqueKeysWithValues: StanceBrandRecipe.ink.map { ($0.step, mix(light, dark, $0.t)) })
    }

    /// Resolves every role of every theme in the generated recipe. `accent` is nil when the brand
    /// has none; otherwise its `light` value starts the light and high contrast themes and its
    /// `dark` value starts the dark theme (as named by each theme's recipe).
    static func resolve(light: UInt32, dark: UInt32, accent: (light: UInt32, dark: UInt32)?) -> Resolution {
        let ink = inkScale(light: light, dark: dark)
        func named(_ target: StanceMixTarget) -> UInt32 {
            switch target {
            case .white: white
            case .black: black
            case .light: light
            case .dark: dark
            }
        }
        func brand(_ source: StanceBrandSource) -> UInt32 { source == .light ? light : dark }
        func foreground(on c: UInt32) -> UInt32 { contrast(light, c) >= contrast(dark, c) ? light : dark }

        var themes: [String: [String: Role]] = [:]
        for theme in StanceBrandRecipe.allThemes {
            let start: UInt32? = accent.map { theme.accent == .light ? $0.light : $0.dark }
            let recipes = Dictionary(uniqueKeysWithValues: theme.roles.map { ($0.role, $0.recipe) })
            var out: [String: Role] = [:]

            func role(_ name: String) -> Role {
                if let cached = out[name] { return cached }
                guard let recipe = recipes[name] else {
                    preconditionFailure("Unknown role \(name) in theme \(theme.name)")
                }
                let value = step(recipe)
                out[name] = value
                return value
            }

            func step(_ recipe: StanceRoleRecipe) -> Role {
                switch recipe {
                case .light:
                    return Role(hex: light, alpha: 1)
                case .dark:
                    return Role(hex: dark, alpha: 1)
                case let .ink(stepNumber):
                    guard let hex = ink[stepNumber] else { preconditionFailure("Unknown ink step \(stepNumber)") }
                    return Role(hex: hex, alpha: 1)
                case let .literal(hex, alpha):
                    return Role(hex: hex, alpha: alpha)
                case let .derive(from, toward, amount, alpha):
                    let base = brand(from)
                    return Role(hex: toward.map { mix(base, named($0), amount) } ?? base, alpha: alpha)
                case let .accentFit(use, against, minimum, toward, fallback):
                    guard let start else { return step(fallback) }
                    if use == .fill {
                        let fg = foreground(on: start)
                        let targetL: Double = luminance(fg) > luminance(start) ? 0 : 1
                        return Role(hex: fit(start, against: [fg], minimum: minimum, targetL: targetL), alpha: 1)
                    }
                    let targets = against.map { role($0).hex }
                    return Role(hex: fit(start, against: targets, minimum: minimum, targetL: toward == .white ? 1 : 0), alpha: 1)
                case let .accentShade(of, awayFrom, amount, fallback):
                    guard start != nil else { return step(fallback) }
                    let toward = role(awayFrom).hex == light ? dark : light
                    return Role(hex: mix(role(of).hex, toward, amount), alpha: 1)
                case let .accentForeground(on):
                    return Role(hex: foreground(on: role(on).hex), alpha: 1)
                }
            }

            for entry in theme.roles { _ = role(entry.role) }
            themes[theme.name] = out
        }
        return Resolution(ink: ink, themes: themes)
    }
}
