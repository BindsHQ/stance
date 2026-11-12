import StanceTokens
import SwiftUI

/// Motion tokens as SwiftUI animations.
public enum StanceMotion: Sendable {
    /// Hover, press and colour changes.
    case fast
    /// Popovers, toasts and disclosure.
    case normal
    /// Sheets and large surfaces.
    case slow
    /// Full screen changes and staged entrances.
    case slower

    public var duration: TimeInterval {
        switch self {
        case .fast: StanceTokens.Duration.fast
        case .normal: StanceTokens.Duration.normal
        case .slow: StanceTokens.Duration.slow
        case .slower: StanceTokens.Duration.slower
        }
    }

    /// The animation, or `nil` when Reduce Motion is enabled.
    public func animation(reduceMotion: Bool) -> Animation? {
        guard !reduceMotion else { return nil }
        let e = self == .fast ? StanceTokens.Easing.standard : StanceTokens.Easing.emphasized
        return .timingCurve(e.0, e.1, e.2, e.3, duration: duration)
    }
}

extension StanceMotion {
    /// The pause between revealed chunks of streamed text.
    public static let streamInterval: TimeInterval = StanceTokens.Duration.stream
    /// One sweep of a shimmer.
    public static let shimmerDuration: TimeInterval = StanceTokens.Duration.shimmer
    /// One breath of a pulse, in and out.
    public static let pulseDuration: TimeInterval = StanceTokens.Duration.pulse
    /// How long a brief confirmation such as "Copied" stays before it reverts: one shimmer sweep.
    public static let confirmationDuration: TimeInterval = StanceTokens.Duration.shimmer
    /// The opacity a pulsing element rests at between breaths.
    public static let pulseRestOpacity: Double = StanceTokens.Opacity.disabled

    /// The standard easing curve, for components that build a phased animation.
    static var standardEasing: (Double, Double, Double, Double) { StanceTokens.Easing.standard }

    /// A repeating linear shimmer sweep, or `nil` when Reduce Motion is enabled.
    public static func shimmer(reduceMotion: Bool) -> Animation? {
        guard !reduceMotion else { return nil }
        let e = StanceTokens.Easing.linear
        return .timingCurve(e.0, e.1, e.2, e.3, duration: shimmerDuration).repeatForever(autoreverses: false)
    }

    /// A repeating pulse that breathes out and back in, or `nil` when Reduce Motion is enabled.
    public static func pulse(reduceMotion: Bool) -> Animation? {
        guard !reduceMotion else { return nil }
        let e = StanceTokens.Easing.standard
        return .timingCurve(e.0, e.1, e.2, e.3, duration: pulseDuration / 2).repeatForever(autoreverses: true)
    }
}

struct StanceAnimationModifier<V: Equatable>: ViewModifier {
    let motion: StanceMotion
    let value: V
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content.animation(motion.animation(reduceMotion: reduceMotion), value: value)
    }
}

extension View {
    /// Animates changes of `value` with a Stance motion token. No animation under Reduce Motion.
    public func stanceAnimation<V: Equatable>(_ motion: StanceMotion = .normal, value: V) -> some View {
        modifier(StanceAnimationModifier(motion: motion, value: value))
    }
}
