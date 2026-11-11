import SwiftUI

extension View {
    /// Themes the navigation bar and tab bar tint. System bar materials (including
    /// Liquid Glass on iOS 26) are left to the system.
    public func stanceNavigationChrome() -> some View {
        modifier(StanceNavigationChrome())
    }
}

private struct StanceNavigationChrome: ViewModifier {
    @Environment(\.stanceTheme) private var theme

    func body(content: Content) -> some View {
        content
            .tint(theme.colors.accentBg)
            #if os(iOS)
            .toolbarColorScheme(theme.colorScheme, for: .navigationBar, .tabBar)
            #endif
    }
}

/// A destination in ``StanceAdaptiveNavigation``.
public struct StanceDestination<ID: Hashable>: Identifiable {
    public let id: ID
    public let title: String
    public let systemImage: String

    public init(id: ID, title: String, systemImage: String) {
        self.id = id
        self.title = title
        self.systemImage = systemImage
    }
}

/// Top-level navigation that adapts to the device: a tab bar in compact width
/// (iPhone, slide-over) and a sidebar in regular width (iPad, Stage Manager).
public struct StanceAdaptiveNavigation<ID: Hashable, Content: View>: View {
    private let destinations: [StanceDestination<ID>]
    private let title: String
    private let content: (ID) -> Content
    @Binding private var selection: ID
    @Environment(\.horizontalSizeClass) private var sizeClass
    @Environment(\.stanceTheme) private var theme

    public init(_ title: String, selection: Binding<ID>, destinations: [StanceDestination<ID>], @ViewBuilder content: @escaping (ID) -> Content) {
        self.title = title
        _selection = selection
        self.destinations = destinations
        self.content = content
    }

    public var body: some View {
        Group {
            if sizeClass == .regular {
                NavigationSplitView {
                    List(destinations, selection: Binding(get: { Optional(selection) }, set: { if let value = $0 { selection = value } })) { item in
                        Label(item.title, systemImage: item.systemImage).tag(item.id)
                    }
                    .navigationTitle(title)
                } detail: {
                    NavigationStack { content(selection) }
                }
            } else {
                TabView(selection: $selection) {
                    ForEach(destinations) { item in
                        NavigationStack { content(item.id) }
                            .tabItem { Label(item.title, systemImage: item.systemImage) }
                            .tag(item.id)
                    }
                }
            }
        }
        .stanceNavigationChrome()
    }
}

/// Dots showing the position in a short paged sequence.
public struct StancePageIndicator: View {
    private let count: Int
    private let current: Int
    @Environment(\.stanceTheme) private var theme

    public init(count: Int, current: Int) {
        self.count = max(0, count)
        self.current = current
    }

    public var body: some View {
        HStack(spacing: StanceSpacing.sm) {
            ForEach(0 ..< count, id: \.self) { index in
                Capsule()
                    .fill(index == current ? theme.colors.accentBg : theme.colors.borderStrong)
                    .frame(width: index == current ? 20 : 8, height: 8)
            }
        }
        .stanceAnimation(.normal, value: current)
        .accessibilityElement()
        .accessibilityLabel("Page \(min(current + 1, count)) of \(count)")
    }
}

/// Progress through a multi-step task.
public struct StanceStepper: View {
    private let steps: [String]
    private let current: Int
    @Environment(\.stanceTheme) private var theme

    public init(steps: [String], current: Int) {
        self.steps = steps
        self.current = current
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                let state = index < current ? "Completed" : index == current ? "Current" : "Not started"
                HStack(alignment: .top, spacing: StanceSpacing.md) {
                    VStack(spacing: 0) {
                        ZStack {
                            Circle().fill(index <= current ? theme.colors.accentBg : theme.colors.bgSurface)
                            Circle().strokeBorder(index <= current ? .clear : theme.colors.borderControl, lineWidth: max(1.5, theme.controlBorderWidth))
                            if index < current {
                                StanceIcon(.check, size: StanceSize.iconSm - 2).foregroundStyle(theme.colors.accentFg)
                            } else {
                                Text("\(index + 1)").font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(index == current ? theme.colors.accentFg : theme.colors.fgMuted)
                            }
                        }
                        .frame(width: 26, height: 26)
                        if index < steps.count - 1 {
                            Rectangle().fill(index < current ? theme.colors.accentBg : theme.colors.separator).frame(width: 2, height: StanceSpacing.xl)
                        }
                    }
                    Text(step)
                        .stanceText(index == current ? .label : .bodySmall)
                        .foregroundStyle(index <= current ? theme.colors.fgDefault : theme.colors.fgMuted)
                        .padding(.top, 3)
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("Step \(index + 1) of \(steps.count): \(step)")
                .accessibilityValue(state)
            }
        }
    }
}
