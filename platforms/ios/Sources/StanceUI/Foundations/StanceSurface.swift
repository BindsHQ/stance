import SwiftUI

/// Surface levels, mapped to background roles.
public enum StanceSurfaceLevel: Sendable {
    case canvas, subtle, surface, raised, muted
}

struct StanceSurfaceModifier: ViewModifier {
    let level: StanceSurfaceLevel
    let radius: CGFloat
    let bordered: Bool
    let elevation: StanceElevation?
    @Environment(\.stanceTheme) private var theme

    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        content
            .background(fill, in: shape)
            .overlay { if bordered { shape.strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) } }
            .clipShape(shape)
            .modifier(OptionalShadow(elevation: elevation, radius: radius))
    }

    private var fill: Color {
        switch level {
        case .canvas: theme.colors.bgCanvas
        case .subtle: theme.colors.bgSubtle
        case .surface: theme.colors.bgSurface
        case .raised: theme.colors.bgSurfaceRaised
        case .muted: theme.colors.bgMuted
        }
    }
}

private struct OptionalShadow: ViewModifier {
    let elevation: StanceElevation?
    let radius: CGFloat

    func body(content: Content) -> some View {
        if let elevation { content.stanceShadow(elevation, cornerRadius: radius) } else { content }
    }
}

extension View {
    /// Places the view on a Stance surface with a background, optional border and elevation.
    public func stanceSurface(
        _ level: StanceSurfaceLevel = .surface,
        cornerRadius: CGFloat = StanceRadius.lg,
        bordered: Bool = true,
        elevation: StanceElevation? = nil
    ) -> some View {
        modifier(StanceSurfaceModifier(level: level, radius: cornerRadius, bordered: bordered, elevation: elevation))
    }

    /// Card treatment: padded surface with a border. Use for grouped, self-contained content.
    public func stanceCard(padding: CGFloat = StanceSpacing.lg, elevated: Bool = false) -> some View {
        self.padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .stanceSurface(elevated ? .raised : .surface, cornerRadius: StanceRadius.xl, elevation: elevated ? .md : nil)
    }
}

/// A card with optional title, description and footer.
public struct StanceCard<Content: View, Footer: View>: View {
    private let title: String?
    private let description: String?
    private let elevated: Bool
    private let content: Content
    private let footer: Footer
    @Environment(\.stanceTheme) private var theme

    @_disfavoredOverload
    public init(
        _ title: String? = nil,
        description: String? = nil,
        elevated: Bool = false,
        @ViewBuilder content: () -> Content,
        @ViewBuilder footer: () -> Footer = { EmptyView() }
    ) {
        self.title = title
        self.description = description
        self.elevated = elevated
        self.content = content()
        self.footer = footer()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            if title != nil || description != nil {
                VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                    if let title { Text(title).stanceText(.subheading).accessibilityAddTraits(.isHeader) }
                    if let description { Text(description).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted) }
                }
            }
            content
            if Footer.self != EmptyView.self {
                StanceDivider()
                footer
            }
        }
        .stanceCard(elevated: elevated)
    }
}

/// A hairline separator in the theme's separator colour.
public struct StanceDivider: View {
    private let vertical: Bool
    @Environment(\.stanceTheme) private var theme

    public init(vertical: Bool = false) { self.vertical = vertical }

    public var body: some View {
        Rectangle()
            .fill(theme.colors.separator)
            .frame(width: vertical ? theme.borderWidth : nil, height: vertical ? nil : theme.borderWidth)
            .accessibilityHidden(true)
    }
}

/// A titled group of content with consistent spacing.
public struct StanceSection<Content: View>: View {
    private let title: String
    private let caption: String?
    private let content: Content
    @Environment(\.stanceTheme) private var theme

    @_disfavoredOverload
    public init(_ title: String, caption: String? = nil, @ViewBuilder content: () -> Content) {
        self.title = title
        self.caption = caption
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                Text(title).stanceText(.heading).accessibilityAddTraits(.isHeader)
                if let caption { Text(caption).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted) }
            }
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// Constrains content to a readable width and applies page gutters. Centres on iPad.
public struct StanceContainer<Content: View>: View {
    private let maxWidth: CGFloat
    private let content: Content

    public init(maxWidth: CGFloat = StanceSize.readableWidth, @ViewBuilder content: () -> Content) {
        self.maxWidth = maxWidth
        self.content = content()
    }

    public var body: some View {
        content
            .frame(maxWidth: maxWidth, alignment: .leading)
            .padding(.horizontal, StanceSpacing.lg)
            .frame(maxWidth: .infinity)
    }
}

/// An adaptive grid: as many columns as fit the minimum item width.
public struct StanceGrid<Content: View>: View {
    private let minItemWidth: CGFloat
    private let spacing: CGFloat
    private let content: Content

    public init(minItemWidth: CGFloat = 160, spacing: CGFloat = StanceSpacing.md, @ViewBuilder content: () -> Content) {
        self.minItemWidth = minItemWidth
        self.spacing = spacing
        self.content = content()
    }

    public var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: minItemWidth), spacing: spacing, alignment: .top)], alignment: .leading, spacing: spacing) {
            content
        }
    }
}

// MARK: Localised titles

extension StanceCard {
    /// Creates a card whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        description: String? = nil,
        elevated: Bool = false,
        @ViewBuilder content: () -> Content,
        @ViewBuilder footer: () -> Footer = { EmptyView() }
    ) {
        self.init(String(localized: titleKey), description: description, elevated: elevated, content: content, footer: footer)
    }
}

extension StanceSection {
    /// Creates a section whose title is looked up in the app's string tables.
    public init(_ titleKey: LocalizedStringResource, caption: String? = nil, @ViewBuilder content: () -> Content) {
        self.init(String(localized: titleKey), caption: caption, content: content)
    }
}
