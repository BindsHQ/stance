import SwiftUI

/// Replaces the built in text of a ``StanceNotificationRow``. Leave a value `nil` to keep the
/// localised default.
public struct StanceNotificationLabels: Sendable {
    /// Replaces "Unread".
    public var unread: String?
    /// Replaces "Mark as read".
    public var markRead: String?
    /// Replaces "Mark as unread".
    public var markUnread: String?
    /// Replaces "Delete".
    public var delete: String?

    public init(unread: String? = nil, markRead: String? = nil, markUnread: String? = nil, delete: String? = nil) {
        self.unread = unread
        self.markRead = markRead
        self.markUnread = markUnread
        self.delete = delete
    }
}

/// One notification in a list: title, body, time and an unread state.
///
/// Inside a `List` it offers the system swipe actions: swipe from the leading edge to mark it
/// read or unread, and from the trailing edge to delete it. The same actions are VoiceOver custom
/// actions, so they never depend on a gesture. Unread rows show a dot and a heavier title, and
/// VoiceOver hears "Unread" first.
///
/// ```swift
/// List(notifications) { item in
///     StanceNotificationRow(item.title, message: item.body, time: item.time, isUnread: item.unread) {
///         StanceAvatar(name: item.sender, size: .small)
///     } onToggleRead: {
///         toggle(item)
///     } onDelete: {
///         delete(item)
///     }
/// }
/// ```
public struct StanceNotificationRow<Leading: View>: View {
    private let title: String
    private let message: String?
    private let time: String?
    private let isUnread: Bool
    private let labels: StanceNotificationLabels
    private let onTap: (() -> Void)?
    private let onToggleRead: (() -> Void)?
    private let onDelete: (() -> Void)?
    private let leading: Leading
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.dynamicTypeSize) private var typeSize

    /// - Parameters:
    ///   - title: What happened, in a few words.
    ///   - message: Optional detail, up to three lines.
    ///   - time: When it happened, already formatted, such as "2 min ago".
    ///   - isUnread: Shows the unread dot and heavier title.
    ///   - labels: Replaces the built in text.
    ///   - leading: An avatar or icon before the text.
    ///   - onTap: Opens the notification.
    ///   - onToggleRead: Marks the notification read or unread. Adds a leading swipe action.
    ///   - onDelete: Deletes the notification. Adds a trailing swipe action.
    @_disfavoredOverload
    public init(
        _ title: String,
        message: String? = nil,
        time: String? = nil,
        isUnread: Bool = false,
        labels: StanceNotificationLabels = .init(),
        @ViewBuilder leading: () -> Leading = { EmptyView() },
        onTap: (() -> Void)? = nil,
        onToggleRead: (() -> Void)? = nil,
        onDelete: (() -> Void)? = nil
    ) {
        self.title = title
        self.message = message
        self.time = time
        self.isUnread = isUnread
        self.labels = labels
        self.onTap = onTap
        self.onToggleRead = onToggleRead
        self.onDelete = onDelete
        self.leading = leading()
    }

    public var body: some View {
        Group {
            if let onTap {
                Button(action: onTap) { content.contentShape(Rectangle()) }.buttonStyle(.plain)
            } else {
                content
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityText)
        .accessibilityAddTraits(onTap == nil ? [] : .isButton)
        .accessibilityActions {
            if let onToggleRead { Button(toggleReadTitle, action: onToggleRead) }
            if let onDelete { Button(deleteTitle, action: onDelete) }
        }
        .swipeActions(edge: .leading, allowsFullSwipe: true) {
            if let onToggleRead {
                Button(action: onToggleRead) {
                    Label { Text(toggleReadTitle) } icon: { Image(systemName: isUnread ? "envelope.open" : "envelope.badge") }
                }
                .tint(theme.colors.infoSolid)
            }
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            if let onDelete {
                Button(role: .destructive, action: onDelete) {
                    Label { Text(deleteTitle) } icon: { Image(systemName: "trash") }
                }
            }
        }
    }

    private var content: some View {
        HStack(alignment: .top, spacing: StanceSpacing.md) {
            leading
            VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                let layout = typeSize.isAccessibilitySize
                    ? AnyLayout(VStackLayout(alignment: .leading, spacing: StanceSpacing.xxs))
                    : AnyLayout(HStackLayout(alignment: .firstTextBaseline, spacing: StanceSpacing.sm))
                layout {
                    Text(title)
                        .stanceText(.body)
                        .fontWeight(isUnread ? .semibold : .regular)
                        .foregroundStyle(theme.colors.fgDefault)
                        .frame(maxWidth: typeSize.isAccessibilitySize ? nil : .infinity, alignment: .leading)
                    if let time {
                        Text(time).stanceText(.caption).foregroundStyle(theme.colors.fgSubtle)
                    }
                }
                if let message {
                    Text(message).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted).lineLimit(typeSize.isAccessibilitySize ? nil : 3)
                }
            }
            .multilineTextAlignment(.leading)
            Circle()
                .fill(isUnread ? theme.colors.accentBg : .clear)
                .frame(width: StanceSpacing.sm, height: StanceSpacing.sm)
                .padding(.top, StanceSpacing.s1_5)
                .accessibilityHidden(true)
        }
        .padding(.vertical, StanceSpacing.xs)
        .frame(maxWidth: .infinity, minHeight: StanceSize.touchTarget, alignment: .leading)
    }

    private var unreadTitle: String { labels.unread ?? stanceString("stance.notification.unread", locale) }
    private var toggleReadTitle: String {
        isUnread ? labels.markRead ?? stanceString("stance.notification.markRead", locale) : labels.markUnread ?? stanceString("stance.notification.markUnread", locale)
    }
    private var deleteTitle: String { labels.delete ?? stanceString("stance.notification.delete", locale) }

    /// "Unread, Deployment finished, 48 mailboxes updated, 2 min ago".
    private var accessibilityText: String {
        [isUnread ? unreadTitle : nil, title, message, time].compactMap { $0 }.joined(separator: ", ")
    }
}

extension StanceNotificationRow {
    /// Creates a row whose time is a date, shown relative to now in the current locale
    /// ("5 minutes ago").
    @_disfavoredOverload
    public init(
        _ title: String,
        message: String? = nil,
        date: Date,
        isUnread: Bool = false,
        labels: StanceNotificationLabels = .init(),
        @ViewBuilder leading: () -> Leading = { EmptyView() },
        onTap: (() -> Void)? = nil,
        onToggleRead: (() -> Void)? = nil,
        onDelete: (() -> Void)? = nil
    ) {
        self.init(
            title, message: message, time: date.formatted(.relative(presentation: .named)), isUnread: isUnread, labels: labels,
            leading: leading, onTap: onTap, onToggleRead: onToggleRead, onDelete: onDelete
        )
    }
}

// MARK: Localised labels

extension StanceNotificationRow {
    /// Creates a row whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        message: String? = nil,
        time: String? = nil,
        isUnread: Bool = false,
        labels: StanceNotificationLabels = .init(),
        @ViewBuilder leading: () -> Leading = { EmptyView() },
        onTap: (() -> Void)? = nil,
        onToggleRead: (() -> Void)? = nil,
        onDelete: (() -> Void)? = nil
    ) {
        self.init(
            String(localized: titleKey), message: message, time: time, isUnread: isUnread, labels: labels,
            leading: leading, onTap: onTap, onToggleRead: onToggleRead, onDelete: onDelete
        )
    }
}
