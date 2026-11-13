import SwiftUI

/// One tab in ``StanceTabs``.
public struct StanceTab<ID: Hashable>: Identifiable {
    public let id: ID
    public let title: String
    public let icon: StanceIconName?
    public let badge: Int?

    /// - Parameters:
    ///   - id: Identifies the tab in the selection.
    ///   - title: The visible label and accessible name.
    ///   - icon: An optional leading Stance icon.
    ///   - badge: An optional count shown after the title, such as unread items.
    @_disfavoredOverload
    public init(id: ID, title: String, icon: StanceIconName? = nil, badge: Int? = nil) {
        self.id = id
        self.title = title
        self.icon = icon
        self.badge = badge
    }

    /// Creates a tab whose title is looked up in the app's string tables.
    public init(id: ID, title titleKey: LocalizedStringResource, icon: StanceIconName? = nil, badge: Int? = nil) {
        self.init(id: id, title: String(localized: titleKey), icon: icon, badge: badge)
    }
}

/// How ``StanceTabs`` draws its strip.
public enum StanceTabsStyle: Sendable {
    /// The system segmented control. Best for two to four short, equal options.
    case segmented
    /// A scrolling strip of labels with an indicator under the selected tab.
    case underline
}

/// Switches between views inside one screen.
///
/// The `.segmented` style is the system segmented `Picker`. The `.underline` style draws a
/// scrolling strip for longer or more numerous labels, because iOS has no such control: each tab
/// is a button with the selected trait and its position ("Tab 2 of 4"), and the strip scrolls the
/// selected tab into view. For top level destinations use ``StanceAdaptiveNavigation`` instead.
public struct StanceTabs<ID: Hashable, Content: View>: View {
    private let tabs: [StanceTab<ID>]
    private let style: StanceTabsStyle
    private let label: String?
    private let content: (ID) -> Content
    @Binding private var selection: ID
    @Namespace private var indicator
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// - Parameters:
    ///   - tabs: The tabs, in order.
    ///   - selection: The selected tab.
    ///   - style: The system segmented control or an underline strip.
    ///   - label: An accessible name for the group of tabs, such as "Template views".
    ///   - content: The view for the selected tab.
    public init(
        _ tabs: [StanceTab<ID>],
        selection: Binding<ID>,
        style: StanceTabsStyle = .underline,
        label: String? = nil,
        @ViewBuilder content: @escaping (ID) -> Content
    ) {
        self.tabs = tabs
        _selection = selection
        self.style = style
        self.label = label
        self.content = content
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.lg) {
            switch style {
            case .segmented: segmented
            case .underline: underline
            }
            content(selection)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var segmented: some View {
        Picker(label ?? "", selection: $selection) {
            ForEach(tabs) { tab in
                Text(Self.title(for: tab, locale: locale)).tag(tab.id)
            }
        }
        .pickerStyle(.segmented)
        .tint(theme.colors.accentBg)
        .frame(minHeight: StanceSize.touchTarget)
        .accessibilityLabel(label ?? "")
    }

    private var underline: some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: StanceSpacing.xs) {
                    ForEach(Array(tabs.enumerated()), id: \.element.id) { index, tab in
                        tabButton(tab, index: index).id(tab.id)
                    }
                }
            }
            .overlay(alignment: .bottom) {
                Rectangle().fill(theme.colors.separator).frame(height: theme.borderWidth).allowsHitTesting(false)
            }
            .onChange(of: selection) { _, new in
                withAnimation(StanceMotion.normal.animation(reduceMotion: reduceMotion)) { proxy.scrollTo(new, anchor: .center) }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label ?? "")
    }

    private func tabButton(_ tab: StanceTab<ID>, index: Int) -> some View {
        let selected = tab.id == selection
        return Button {
            guard !selected else { return }
            withAnimation(StanceMotion.normal.animation(reduceMotion: reduceMotion)) { selection = tab.id }
            StanceHaptics.selection()
        } label: {
            HStack(spacing: StanceSpacing.s1_5) {
                if let icon = tab.icon { StanceIcon(icon, size: StanceSize.iconSm) }
                Text(tab.title).stanceText(.label).fontWeight(selected ? .semibold : .medium)
                if let badge = tab.badge {
                    Text(badge.formatted(.number.locale(locale)))
                        .stanceText(.caption)
                        .monospacedDigit()
                        .padding(.horizontal, StanceSpacing.s1_5)
                        .background(selected ? theme.colors.accentBg : theme.colors.bgEmphasis, in: Capsule())
                        .foregroundStyle(selected ? theme.colors.accentFg : theme.colors.fgMuted)
                }
            }
            .foregroundStyle(selected ? theme.colors.fgDefault : theme.colors.fgMuted)
            .padding(.horizontal, StanceSpacing.md)
            .frame(minHeight: StanceSize.touchTarget)
            .overlay(alignment: .bottom) {
                if selected {
                    Capsule()
                        .fill(theme.colors.accentBg)
                        .frame(height: max(theme.focusWidth, theme.controlBorderWidth * 2))
                        .matchedGeometryEffect(id: "indicator", in: indicator)
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Self.title(for: tab, locale: locale))
        .accessibilityValue(stanceString("stance.tabs.position \(index + 1) \(tabs.count)", locale))
        .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
    }

    /// The title with its badge count, as the segmented control and VoiceOver read it.
    static func title(for tab: StanceTab<ID>, locale: Locale) -> String {
        guard let badge = tab.badge else { return tab.title }
        return "\(tab.title) (\(badge.formatted(.number.locale(locale))))"
    }
}
