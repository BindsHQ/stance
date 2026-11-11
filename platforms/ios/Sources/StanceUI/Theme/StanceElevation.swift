import StanceTokens
import SwiftUI

/// Elevation levels, from the token shadow scale.
public enum StanceElevation: Sendable {
    case xs, sm, md, lg, xl

    func layers(in theme: StanceTheme) -> [StanceShadowLayer] {
        switch self {
        case .xs: theme.tokens.shadows.xs
        case .sm: theme.tokens.shadows.sm
        case .md: theme.tokens.shadows.md
        case .lg: theme.tokens.shadows.lg
        case .xl: theme.tokens.shadows.xl
        }
    }
}

struct StanceShadowModifier: ViewModifier {
    let elevation: StanceElevation
    let radius: CGFloat
    @Environment(\.stanceTheme) private var theme

    func body(content: Content) -> some View {
        let layers = elevation.layers(in: theme)
        // Layers with no blur are outlines (high contrast encodes depth as a solid ring).
        let ring = layers.first { $0.blur == 0 && $0.spread > 0 }
        let soft = layers.filter { $0.blur > 0 }
        return soft.reduce(AnyView(content)) { view, layer in
            AnyView(view.shadow(color: Color(layer.color), radius: layer.blur / 2, x: layer.x, y: layer.y))
        }
        .overlay {
            if let ring {
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .strokeBorder(Color(ring.color), lineWidth: ring.spread)
            }
        }
    }
}

extension View {
    /// Adds a Stance shadow. In high contrast, depth is drawn as a solid outline instead.
    public func stanceShadow(_ elevation: StanceElevation, cornerRadius: CGFloat = StanceRadius.lg) -> some View {
        modifier(StanceShadowModifier(elevation: elevation, radius: cornerRadius))
    }
}
