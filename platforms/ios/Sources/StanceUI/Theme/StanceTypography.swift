import StanceTokens
import SwiftUI

/// Semantic text styles. Each scales with Dynamic Type.
public enum StanceTextStyle: String, CaseIterable, Sendable {
    case display
    case title
    case heading
    case subheading
    case bodyLarge
    case body
    case bodySmall
    case label
    case caption
    case eyebrow
    case button
    case mono

    /// Point size at the default Dynamic Type size, from the token type scale.
    public var size: CGFloat {
        switch self {
        case .display: StanceTokens.FontSize.size3xl
        case .title: StanceTokens.FontSize.size2xl
        case .heading: StanceTokens.FontSize.sizexl
        case .subheading: StanceTokens.FontSize.sizelg
        case .bodyLarge: StanceTokens.FontSize.sizelg
        case .body: StanceTokens.FontSize.sizemd
        case .bodySmall, .label, .mono: StanceTokens.FontSize.sizesm
        case .button: StanceTokens.FontSize.sizemd
        case .caption, .eyebrow: StanceTokens.FontSize.sizexs
        }
    }

    public var weight: Font.Weight {
        switch self {
        case .display, .title, .heading, .subheading, .button, .eyebrow: .semibold
        case .label: .medium
        case .bodyLarge, .body, .bodySmall, .caption, .mono: .regular
        }
    }

    /// The Dynamic Type style this style scales relative to.
    public var relativeTo: Font.TextStyle {
        switch self {
        case .display: .largeTitle
        case .title: .title
        case .heading: .title2
        case .subheading: .title3
        case .bodyLarge, .body, .button: .body
        case .bodySmall, .label, .mono: .subheadline
        case .caption, .eyebrow: .caption
        }
    }

    /// Letter spacing in points.
    public var tracking: CGFloat {
        switch self {
        case .display: size * StanceTokens.LetterSpacing.tighter
        case .title, .heading, .subheading, .button: size * StanceTokens.LetterSpacing.tight
        case .eyebrow: size * StanceTokens.LetterSpacing.caps
        default: 0
        }
    }

    public func font(family: String? = nil) -> Font {
        if self == .mono {
            return .system(relativeTo, design: .monospaced).weight(weight)
        }
        if let family {
            return .custom(family, size: size, relativeTo: relativeTo).weight(weight)
        }
        // System font at the token size, scaling with Dynamic Type and responding to Bold Text.
        return .system(size: scaledBase, weight: weight)
    }

    private var scaledBase: CGFloat { size }
}

struct StanceTextModifier: ViewModifier {
    let style: StanceTextStyle
    @Environment(\.stanceTheme) private var theme
    @ScaledMetric private var scaled: CGFloat

    init(style: StanceTextStyle) {
        self.style = style
        _scaled = ScaledMetric(wrappedValue: style.size, relativeTo: style.relativeTo)
    }

    func body(content: Content) -> some View {
        content
            .font(font)
            .tracking(style.tracking)
            .textCase(style == .eyebrow ? .uppercase : nil)
    }

    private var font: Font {
        if style == .mono { return .system(size: scaled, weight: style.weight, design: .monospaced) }
        if let family = theme.fontFamily {
            return .custom(family, size: style.size, relativeTo: style.relativeTo).weight(style.weight)
        }
        return .system(size: scaled, weight: style.weight)
    }
}

extension View {
    /// Applies a Stance text style that scales with Dynamic Type.
    public func stanceText(_ style: StanceTextStyle) -> some View {
        modifier(StanceTextModifier(style: style))
    }
}
