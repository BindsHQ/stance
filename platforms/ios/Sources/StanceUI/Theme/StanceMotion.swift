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

    public var duration: TimeInterval {
        switch self {
        case .fast: StanceTokens.Duration.fast
        case .normal: StanceTokens.Duration.normal
        case .slow: StanceTokens.Duration.slow
        }
    }

    /// The animation, or `nil` when Reduce Motion is enabled.
    public func animation(reduceMotion: Bool) -> Animation? {
        guard !reduceMotion else { return nil }
        let e = self == .fast ? StanceTokens.Easing.standard : StanceTokens.Easing.emphasized
        return .timingCurve(e.0, e.1, e.2, e.3, duration: duration)
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
