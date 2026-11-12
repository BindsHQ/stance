import SwiftUI

/// Status tones shared by badges, banners, alerts and progress.
public enum StanceTone: String, CaseIterable, Sendable {
    case neutral, info, success, warning, danger

    func foreground(_ theme: StanceTheme) -> Color {
        switch self {
        case .neutral: theme.colors.fgDefault
        case .info: theme.colors.infoFg
        case .success: theme.colors.successFg
        case .warning: theme.colors.warningFg
        case .danger: theme.colors.dangerFg
        }
    }

    func background(_ theme: StanceTheme) -> Color {
        switch self {
        case .neutral: theme.colors.bgEmphasis
        case .info: theme.colors.infoBg
        case .success: theme.colors.successBg
        case .warning: theme.colors.warningBg
        case .danger: theme.colors.dangerBg
        }
    }

    func border(_ theme: StanceTheme) -> Color {
        switch self {
        case .neutral: theme.colors.borderDefault
        case .info: theme.colors.infoBorder
        case .success: theme.colors.successBorder
        case .warning: theme.colors.warningBorder
        case .danger: theme.colors.dangerBorder
        }
    }

    var icon: StanceIconName {
        switch self {
        case .neutral, .info: .info
        case .success: .checkCircle
        case .warning: .alertTriangle
        case .danger: .alertCircle
        }
    }
}

/// A short status label. Tone is always paired with text, never colour alone.
public struct StanceBadge: View {
    private let text: String
    private let tone: StanceTone
    @Environment(\.stanceTheme) private var theme

    @_disfavoredOverload
    public init(_ text: String, tone: StanceTone = .neutral) {
        self.text = text
        self.tone = tone
    }

    public var body: some View {
        Text(text)
            .stanceText(.caption)
            .fontWeight(.semibold)
            .padding(.horizontal, StanceSpacing.sm)
            .padding(.vertical, StanceSpacing.xxs)
            .foregroundStyle(tone.foreground(theme))
            .background(tone.background(theme), in: Capsule())
            .overlay { Capsule().strokeBorder(theme.isHighContrast ? tone.border(theme) : .clear, lineWidth: theme.borderWidth) }
    }
}

/// A keyword label that can be removed.
public struct StanceTag: View {
    private let text: String
    private let onRemove: (() -> Void)?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    @_disfavoredOverload
    public init(_ text: String, onRemove: (() -> Void)? = nil) {
        self.text = text
        self.onRemove = onRemove
    }

    public var body: some View {
        HStack(spacing: StanceSpacing.xs) {
            Text(text).stanceText(.label)
            if let onRemove {
                Button(action: onRemove) {
                    StanceIcon(.x, size: StanceSize.iconSm - 2)
                        .frame(width: 24, height: 24)
                        .contentShape(Rectangle().inset(by: -10))
                }
                .buttonStyle(.plain)
                .accessibilityLabel(stanceString("stance.remove \(text)", locale))
            }
        }
        .padding(.leading, StanceSpacing.md)
        .padding(.trailing, onRemove == nil ? StanceSpacing.md : StanceSpacing.xs)
        .frame(minHeight: StanceSize.controlSm)
        .background(theme.colors.bgMuted, in: Capsule())
        .overlay { Capsule().strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
    }
}

/// A person or organisation, shown as an image or initials.
public struct StanceAvatar: View {
    public enum Size: Sendable {
        case small, medium, large

        var points: CGFloat {
            switch self {
            case .small: StanceSize.controlSm
            case .medium: StanceSize.controlMd
            case .large: StanceSize.controlLg + StanceSpacing.sm
            }
        }
    }

    private let name: String
    private let image: Image?
    private let size: Size
    @Environment(\.stanceTheme) private var theme

    public init(name: String, image: Image? = nil, size: Size = .medium) {
        self.name = name
        self.image = image
        self.size = size
    }

    /// Up to two initials from the name.
    public nonisolated static func initials(for name: String) -> String {
        let parts = name.split(whereSeparator: { $0 == " " || $0 == "-" }).filter { !$0.isEmpty }
        guard let first = parts.first?.first else { return "?" }
        let second = parts.count > 1 ? parts.last?.first : nil
        return String([first, second].compactMap { $0 }).uppercased()
    }

    public var body: some View {
        ZStack {
            Circle().fill(theme.colors.bgEmphasis)
            if let image {
                image.resizable().scaledToFill().clipShape(Circle())
            } else {
                Text(Self.initials(for: name))
                    .font(.system(size: size.points * 0.36, weight: .semibold))
                    .foregroundStyle(theme.colors.fgDefault)
            }
        }
        .frame(width: size.points, height: size.points)
        .overlay { Circle().strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
        .accessibilityElement()
        .accessibilityLabel(name)
        .accessibilityAddTraits(.isImage)
    }
}

/// Overlapping avatars with a "+N" overflow, read as one summary by VoiceOver.
public struct StanceAvatarGroup: View {
    private let names: [String]
    private let max: Int
    private let size: StanceAvatar.Size
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    public init(names: [String], max: Int = 4, size: StanceAvatar.Size = .small) {
        self.names = names
        self.max = Swift.max(1, max)
        self.size = size
    }

    public var body: some View {
        let shown = Array(names.prefix(max))
        let extra = names.count - shown.count
        HStack(spacing: -size.points * 0.18) {
            ForEach(Array(shown.enumerated()), id: \.offset) { _, name in
                StanceAvatar(name: name, size: size)
                    .overlay { Circle().strokeBorder(theme.colors.bgSurface, lineWidth: 2) }
            }
            if extra > 0 {
                Text(verbatim: "+\(extra.formatted(.number.locale(locale)))")
                    .font(.system(size: size.points * 0.34, weight: .semibold))
                    .frame(width: size.points, height: size.points)
                    .background(theme.colors.bgMuted, in: Circle())
                    .overlay { Circle().strokeBorder(theme.colors.bgSurface, lineWidth: 2) }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel((shown + (extra > 0 ? [stanceString("stance.more \(extra)", locale)] : [])).formatted(.list(type: .and).locale(locale)))
    }
}

/// Linear or circular progress in Stance colours, built on the native `ProgressView`.
public struct StanceProgressView: View {
    public enum Shape: Sendable { case linear, circular }

    private let label: String
    private let value: Double?
    private let shape: Shape
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameter value: 0...1, or `nil` for indeterminate progress.
    @_disfavoredOverload
    public init(_ label: String, value: Double? = nil, shape: Shape = .linear) {
        self.label = label
        self.value = value
        self.shape = shape
    }

    public var body: some View {
        content
            // A success tap when progress reaches the end, as the system gives for a finished task.
            .sensoryFeedback(.success, trigger: (value ?? 0) >= 1) { _, complete in complete }
    }

    @ViewBuilder private var content: some View {
        switch shape {
        case .linear:
            VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                HStack {
                    Text(label).stanceText(.label)
                    Spacer()
                    if let value {
                        Text(value, format: .percent.precision(.fractionLength(0))).stanceText(.label).foregroundStyle(theme.colors.fgMuted).monospacedDigit()
                            .contentTransition(.numericText(value: value))
                            .stanceAnimation(.normal, value: value)
                    }
                }
                Group {
                    if let value { ProgressView(value: min(max(value, 0), 1)) } else { ProgressView().progressViewStyle(.linear) }
                }
                .tint(theme.colors.accentBg)
            }
            // One element for label, bar and value, so the accessible frame is not a 4pt bar.
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(label)
            .accessibilityValue(value.map { Text($0, format: .percent.precision(.fractionLength(0))) } ?? Text(stanceString("stance.inProgress", locale)))
            .accessibilityAddTraits(.updatesFrequently)
        case .circular:
            Group {
                if let value {
                    ZStack {
                        Circle().stroke(theme.colors.bgEmphasis, lineWidth: 4)
                        Circle().trim(from: 0, to: min(max(value, 0), 1))
                            .stroke(theme.colors.accentBg, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                    }
                    .frame(width: StanceSize.controlMd, height: StanceSize.controlMd)
                    .accessibilityElement()
                    .accessibilityLabel(label)
                    .accessibilityValue(Text(value, format: .percent.precision(.fractionLength(0))))
                } else {
                    ProgressView().tint(theme.colors.accentBg).accessibilityLabel(label)
                }
            }
        }
    }
}

/// A placeholder shown while content loads. Hidden from VoiceOver; mark the container as loading instead.
public struct StanceSkeleton: View {
    public enum Shape: Sendable { case text, circle, rectangle }

    private let shape: Shape
    private let width: CGFloat?
    private let height: CGFloat
    @State private var dim = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(_ shape: Shape = .text, width: CGFloat? = nil, height: CGFloat = 14) {
        self.shape = shape
        self.width = width
        self.height = height
    }

    public var body: some View {
        RoundedRectangle(cornerRadius: shape == .circle ? StanceRadius.full : shape == .text ? StanceRadius.xs : StanceRadius.lg, style: .continuous)
            .fill(theme.colors.bgEmphasis)
            .frame(width: shape == .circle ? height : width, height: height)
            .frame(maxWidth: shape == .circle || width != nil ? nil : .infinity, alignment: .leading)
            .opacity(dim ? StanceMotion.pulseRestOpacity : 1)
            .accessibilityHidden(true)
            .onAppear {
                // One breath per pulse token. Static under Reduce Motion.
                guard let pulse = StanceMotion.pulse(reduceMotion: reduceMotion) else { return }
                withAnimation(pulse) { dim = true }
            }
    }
}

/// Explains an empty screen or list and offers the next action.
public struct StanceEmptyState<Actions: View>: View {
    private let icon: StanceIconName
    private let title: String
    private let message: String
    private let actions: Actions
    @Environment(\.stanceTheme) private var theme

    public init(icon: StanceIconName = .inbox, title: String, message: String, @ViewBuilder actions: () -> Actions = { EmptyView() }) {
        self.icon = icon
        self.title = title
        self.message = message
        self.actions = actions()
    }

    public var body: some View {
        VStack(spacing: StanceSpacing.md) {
            StanceIcon(icon, size: 32)
                .foregroundStyle(theme.colors.fgMuted)
                .padding(StanceSpacing.lg)
                .background(theme.colors.bgMuted, in: Circle())
            Text(title).stanceText(.subheading).accessibilityAddTraits(.isHeader)
            Text(message).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted)
            actions.padding(.top, StanceSpacing.xs)
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: 420)
        .padding(StanceSpacing.xl)
        .frame(maxWidth: .infinity)
    }
}

/// One event in a ``StanceTimeline``.
public struct StanceTimelineEvent: Identifiable, Sendable {
    public let id: String
    public let title: String
    public let detail: String?
    public let time: String
    public let tone: StanceTone

    public init(id: String, title: String, detail: String? = nil, time: String, tone: StanceTone = .neutral) {
        self.id = id
        self.title = title
        self.detail = detail
        self.time = time
        self.tone = tone
    }
}

/// A vertical sequence of events, newest first or oldest first as supplied.
public struct StanceTimeline: View {
    private let events: [StanceTimelineEvent]
    @Environment(\.stanceTheme) private var theme

    public init(_ events: [StanceTimelineEvent]) { self.events = events }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(events.enumerated()), id: \.element.id) { index, event in
                HStack(alignment: .top, spacing: StanceSpacing.md) {
                    VStack(spacing: 0) {
                        Circle()
                            .fill(event.tone == .neutral ? theme.colors.borderStrong : event.tone.foreground(theme))
                            .frame(width: 10, height: 10)
                            .padding(.top, 5)
                        if index < events.count - 1 {
                            Rectangle().fill(theme.colors.separator).frame(width: max(1, theme.borderWidth)).frame(maxHeight: .infinity)
                        }
                    }
                    VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                        Text(event.title).stanceText(.label)
                        if let detail = event.detail { Text(detail).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted) }
                        Text(event.time).stanceText(.caption).foregroundStyle(theme.colors.fgSubtle)
                    }
                    .padding(.bottom, StanceSpacing.lg)
                }
                .accessibilityElement(children: .combine)
            }
        }
    }
}

/// A key figure with a label and an optional change, described in words for VoiceOver.
public struct StanceStatCard: View {
    private let label: String
    private let value: String
    private let change: Double?
    private let period: String?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - change: Fractional change (0.12 = up 12%).
    ///   - period: What the change is measured against. Defaults to a localised "from last month".
    @_disfavoredOverload
    public init(_ label: String, value: String, change: Double? = nil, period: String? = nil) {
        self.label = label
        self.value = value
        self.change = change
        self.period = period
    }

    /// The change in words, for example "up 12% from last month".
    public var changeDescription: String? { changeDescription(locale: .current) }

    /// The change in words, localised for `locale`.
    public func changeDescription(locale: Locale) -> String? {
        guard let change else { return nil }
        let percent = Int((abs(change) * 100).rounded())
        let period = period ?? stanceString("stance.stat.period", locale)
        if change == 0 { return stanceString("stance.stat.noChange \(period)", locale) }
        return change > 0 ? stanceString("stance.stat.up \(percent) \(period)", locale) : stanceString("stance.stat.down \(percent) \(period)", locale)
    }

    public var body: some View {
        let changeDescription = changeDescription(locale: locale)
        VStack(alignment: .leading, spacing: StanceSpacing.xs) {
            Text(label).stanceText(.label).foregroundStyle(theme.colors.fgMuted)
            Text(value).stanceText(.title).monospacedDigit()
            if let change, let changeDescription {
                HStack(spacing: StanceSpacing.xs) {
                    StanceIcon(change >= 0 ? .arrowUp : .arrowDown, size: StanceSize.iconSm - 2)
                    Text(changeDescription).stanceText(.caption)
                }
                .foregroundStyle(change >= 0 ? theme.colors.successFg : theme.colors.dangerFg)
            }
        }
        .stanceCard()
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label), \(value)" + (changeDescription.map { ", \($0)" } ?? ""))
    }
}

/// Term and detail pairs. Stacks vertically at accessibility text sizes.
public struct StanceDescriptionList: View {
    private let items: [(term: String, detail: String)]
    @Environment(\.stanceTheme) private var theme
    @Environment(\.dynamicTypeSize) private var typeSize

    public init(_ items: [(term: String, detail: String)]) { self.items = items }

    public var body: some View {
        VStack(spacing: 0) {
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                let layout = typeSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: StanceSpacing.xxs)) : AnyLayout(HStackLayout(alignment: .firstTextBaseline))
                layout {
                    Text(item.term).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted)
                    if !typeSize.isAccessibilitySize { Spacer(minLength: StanceSpacing.lg) }
                    Text(item.detail).stanceText(.bodySmall).fontWeight(.medium).multilineTextAlignment(typeSize.isAccessibilitySize ? .leading : .trailing)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, StanceSpacing.md)
                .accessibilityElement(children: .combine)
                if index < items.count - 1 { StanceDivider() }
            }
        }
    }
}

/// A list row with leading content, title, subtitle and trailing accessory.
/// Use it inside `List`, `ForEach` or a `NavigationLink` label.
public struct StanceListRow<Leading: View, Trailing: View>: View {
    private let title: String
    private let subtitle: String?
    private let leading: Leading
    private let trailing: Trailing
    @Environment(\.stanceTheme) private var theme

    @_disfavoredOverload
    public init(_ title: String, subtitle: String? = nil, @ViewBuilder leading: () -> Leading = { EmptyView() }, @ViewBuilder trailing: () -> Trailing = { EmptyView() }) {
        self.title = title
        self.subtitle = subtitle
        self.leading = leading()
        self.trailing = trailing()
    }

    public var body: some View {
        HStack(spacing: StanceSpacing.md) {
            leading
            VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                Text(title).stanceText(.body)
                if let subtitle { Text(subtitle).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted) }
            }
            Spacer(minLength: StanceSpacing.sm)
            trailing
        }
        .frame(minHeight: StanceSize.touchTarget)
    }
}

extension View {
    /// Styles a `List` or `Form` with Stance surfaces: canvas background and themed row separators.
    public func stanceListStyle() -> some View {
        modifier(StanceListStyleModifier())
    }

    /// Row background for list rows on a Stance surface.
    public func stanceListRow() -> some View {
        modifier(StanceListRowModifier())
    }
}

private struct StanceListStyleModifier: ViewModifier {
    @Environment(\.stanceTheme) private var theme

    func body(content: Content) -> some View {
        content.scrollContentBackground(.hidden).background(theme.colors.bgCanvas)
    }
}

private struct StanceListRowModifier: ViewModifier {
    @Environment(\.stanceTheme) private var theme

    func body(content: Content) -> some View {
        content
            .listRowBackground(theme.colors.bgSurface)
            .listRowSeparatorTint(theme.colors.separator)
    }
}

/// Stance styling for the native `DisclosureGroup`.
public struct StanceDisclosureGroupStyle: DisclosureGroupStyle {
    public init() {}

    public func makeBody(configuration: Configuration) -> some View {
        StanceDisclosureBody(configuration: configuration)
    }
}

private struct StanceDisclosureBody: View {
    let configuration: DisclosureGroupStyleConfiguration
    @Environment(\.stanceTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.locale) private var locale

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(StanceMotion.normal.animation(reduceMotion: reduceMotion)) { configuration.isExpanded.toggle() }
            } label: {
                HStack {
                    configuration.label.stanceText(.label)
                    Spacer()
                    StanceIcon(.chevronDown, size: StanceSize.iconSm)
                        .rotationEffect(.degrees(configuration.isExpanded ? 180 : 0))
                        .foregroundStyle(theme.colors.fgMuted)
                }
                .frame(minHeight: StanceSize.touchTarget)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityValue(stanceString(configuration.isExpanded ? "stance.expanded" : "stance.collapsed", locale))
            if configuration.isExpanded {
                configuration.content.padding(.bottom, StanceSpacing.md)
            }
        }
    }
}

extension DisclosureGroupStyle where Self == StanceDisclosureGroupStyle {
    public static var stance: StanceDisclosureGroupStyle { StanceDisclosureGroupStyle() }
}

// MARK: Localised labels

extension StanceBadge {
    /// Creates a badge whose text is looked up in the app's string tables.
    public init(_ textKey: LocalizedStringResource, tone: StanceTone = .neutral) {
        self.init(String(localized: textKey), tone: tone)
    }
}

extension StanceTag {
    /// Creates a tag whose text is looked up in the app's string tables.
    public init(_ textKey: LocalizedStringResource, onRemove: (() -> Void)? = nil) {
        self.init(String(localized: textKey), onRemove: onRemove)
    }
}

extension StanceProgressView {
    /// Creates a progress view whose label is looked up in the app's string tables.
    public init(_ labelKey: LocalizedStringResource, value: Double? = nil, shape: Shape = .linear) {
        self.init(String(localized: labelKey), value: value, shape: shape)
    }
}

extension StanceStatCard {
    /// Creates a stat card whose label is looked up in the app's string tables.
    public init(_ labelKey: LocalizedStringResource, value: String, change: Double? = nil, period: String? = nil) {
        self.init(String(localized: labelKey), value: value, change: change, period: period)
    }
}

extension StanceListRow {
    /// Creates a row whose title is looked up in the app's string tables.
    public init(_ titleKey: LocalizedStringResource, subtitle: String? = nil, @ViewBuilder leading: () -> Leading = { EmptyView() }, @ViewBuilder trailing: () -> Trailing = { EmptyView() }) {
        self.init(String(localized: titleKey), subtitle: subtitle, leading: leading, trailing: trailing)
    }
}
