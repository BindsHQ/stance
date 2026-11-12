import SwiftUI

// MARK: Thread

/// Decides when a thread follows the newest message.
///
/// The thread is pinned while the reader is at the bottom. Content that grows under a pinned
/// reader is followed, and so is a viewport that shrinks, as when the keyboard appears. Any
/// other move away from the bottom is the reader scrolling up, which releases the pin until
/// they return.
public struct StanceThreadScrollState: Equatable, Sendable {
    /// Whether the reader is following the latest message.
    public private(set) var isPinned: Bool
    /// The last known height of the content.
    public private(set) var contentHeight: CGFloat = 0
    /// The last known height of the viewport.
    public private(set) var viewportHeight: CGFloat = 0

    /// Creates a scroll state.
    public init(isPinned: Bool = true) { self.isPinned = isPinned }

    /// Records new geometry.
    ///
    /// - Parameters:
    ///   - distanceFromBottom: How far the content continues below the viewport.
    ///   - contentHeight: The height of the content.
    ///   - viewportHeight: The height of the viewport, when known.
    ///   - threshold: How close to the bottom still counts as being at the bottom.
    /// - Returns: `true` when the thread should scroll to the bottom to keep following.
    public mutating func update(distanceFromBottom: CGFloat, contentHeight: CGFloat, viewportHeight: CGFloat? = nil, threshold: CGFloat) -> Bool {
        var grew = contentHeight > self.contentHeight + 0.5
        self.contentHeight = contentHeight
        if let viewportHeight {
            if viewportHeight < self.viewportHeight - 0.5 { grew = true }
            self.viewportHeight = viewportHeight
        }
        if distanceFromBottom <= threshold {
            isPinned = true
            return false
        }
        if grew, isPinned { return true }
        isPinned = false
        return false
    }
}

/// Where the thread's content sits in its scroll view.
private struct StanceThreadGeometry: Equatable, Sendable {
    var top: CGFloat
    var bottom: CGFloat
    var height: CGFloat
}

/// The scrolling container for a conversation.
///
/// Built on `ScrollView` with a bottom scroll anchor. It follows the newest message while the
/// reader is at the bottom and releases as soon as they scroll up. A scroll to latest button
/// appears while they are away.
///
/// ```swift
/// StanceThread {
///     ForEach(messages) { message in
///         StanceMessage(role: message.role) { Text(message.text) }
///     }
/// }
/// ```
public struct StanceThread<Content: View>: View {
    private let label: String?
    private let stickToBottom: Bool
    private let unreadCount: Int
    private let showsScrollToLatest: Bool
    private let onReachTop: (() -> Void)?
    private let content: Content
    @State private var scroll = StanceThreadScrollState()
    @State private var viewportHeight: CGFloat = 0
    @State private var geometry: StanceThreadGeometry?
    @State private var isAtTop = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private static var bottomID: String { "stance-thread-bottom" }

    /// - Parameters:
    ///   - label: The accessible name of the region. Defaults to a localised "Conversation".
    ///   - stickToBottom: Follow the newest message while the reader is at the bottom.
    ///   - unreadCount: New messages below the viewport, shown on the scroll to latest button.
    ///   - showsScrollToLatest: Show the built in scroll to latest button while scrolled away.
    ///   - onReachTop: Called when the reader reaches the top, to load older messages.
    public init(
        _ label: String? = nil,
        stickToBottom: Bool = true,
        unreadCount: Int = 0,
        showsScrollToLatest: Bool = true,
        onReachTop: (() -> Void)? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.label = label
        self.stickToBottom = stickToBottom
        self.unreadCount = unreadCount
        self.showsScrollToLatest = showsScrollToLatest
        self.onReachTop = onReachTop
        self.content = content()
    }

    public var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(spacing: 0) {
                    VStack(alignment: .leading, spacing: StanceSpacing.lg) { content }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, StanceSpacing.lg)
                        .padding(.vertical, StanceSpacing.md)
                    Color.clear.frame(height: 0).id(Self.bottomID)
                }
                .onGeometryChange(for: StanceThreadGeometry.self) { geometry in
                    let frame = geometry.frame(in: .scrollView)
                    return StanceThreadGeometry(top: frame.minY, bottom: frame.maxY, height: frame.height)
                } action: { new in
                    geometry = new
                    update(new, proxy: proxy)
                }
            }
            .defaultScrollAnchor(stickToBottom ? .bottom : .top)
            .scrollDismissesKeyboard(.interactively)
            .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { height in
                viewportHeight = height
                if let geometry { update(geometry, proxy: proxy) }
            }
            .overlay(alignment: .bottom) {
                if showsScrollToLatest {
                    StanceScrollToLatest(isVisible: !scroll.isPinned, unreadCount: unreadCount) {
                        withAnimation(StanceMotion.slow.animation(reduceMotion: reduceMotion)) {
                            proxy.scrollTo(Self.bottomID, anchor: .bottom)
                        }
                    }
                    .padding(.bottom, StanceSpacing.sm)
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label ?? stanceString("stance.ai.thread", locale))
    }

    private func update(_ geometry: StanceThreadGeometry, proxy: ScrollViewProxy) {
        // Wait for the first layout of the viewport: until then every message looks off screen.
        guard viewportHeight > 0 else { return }
        let threshold = StanceSize.touchTarget
        let follow = scroll.update(distanceFromBottom: geometry.bottom - viewportHeight, contentHeight: geometry.height, viewportHeight: viewportHeight, threshold: threshold)
        if follow, stickToBottom { proxy.scrollTo(Self.bottomID, anchor: .bottom) }
        let atTop = geometry.top >= -threshold
        if atTop, !isAtTop { onReachTop?() }
        isAtTop = atTop
    }
}

// MARK: Message

/// How a message is drawn.
public enum StanceMessageVariant: String, CaseIterable, Sendable {
    /// On a filled, rounded surface.
    case bubble
    /// Directly on the canvas.
    case plain
}

/// One turn in a conversation from the user, the assistant or the system.
///
/// User messages default to a bubble at the trailing edge. Assistant messages default to plain
/// text at the leading edge. System messages are centred and quiet.
///
/// ```swift
/// StanceMessage(role: .assistant, status: status, author: "Assistant") {
///     StanceStreamingText(text, isStreaming: status == .streaming)
/// } actions: {
///     StanceMessageActions(onCopy: copy, onRetry: retry)
/// }
/// ```
public struct StanceMessage<Content: View, Actions: View, Footer: View>: View {
    private let role: StanceMessageRole
    private let status: StanceGenerationStatus
    private let author: String?
    private let avatar: Image?
    private let timestamp: Date?
    private let variant: StanceMessageVariant?
    private let announcesStatus: Bool
    private let content: Content
    private let actions: Actions
    private let footer: Footer
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - role: Who the message is from.
    ///   - status: The generation status. Pass it for assistant messages that stream.
    ///   - author: The author's name. With a name, the message shows a header with an avatar.
    ///   - avatar: An image for the avatar. The assistant shows the sparkle mark without one.
    ///   - timestamp: When the message was sent, shown in the header.
    ///   - variant: Bubble or plain. Defaults to a bubble for the user and plain otherwise.
    ///   - announcesStatus: Announce started, finished, stopped and failed to VoiceOver. Leave
    ///     off when the content already announces itself, as ``StanceStreamingText``,
    ///     ``StanceThinkingIndicator`` and ``StanceInterruptedState`` do.
    ///   - content: The message body.
    ///   - actions: A row under the body, usually ``StanceMessageActions``.
    ///   - footer: Content under the actions, such as sources or an interrupted state.
    public init(
        role: StanceMessageRole = .assistant,
        status: StanceGenerationStatus = .complete,
        author: String? = nil,
        avatar: Image? = nil,
        timestamp: Date? = nil,
        variant: StanceMessageVariant? = nil,
        announcesStatus: Bool = false,
        @ViewBuilder content: () -> Content,
        @ViewBuilder actions: () -> Actions = { EmptyView() },
        @ViewBuilder footer: () -> Footer = { EmptyView() }
    ) {
        self.role = role
        self.status = status
        self.author = author
        self.avatar = avatar
        self.timestamp = timestamp
        self.variant = variant
        self.announcesStatus = announcesStatus
        self.content = content()
        self.actions = actions()
        self.footer = footer()
    }

    private var resolvedVariant: StanceMessageVariant { variant ?? (role == .user ? .bubble : .plain) }
    private var alignment: HorizontalAlignment { role == .user ? .trailing : role == .system ? .center : .leading }
    private var frameAlignment: Alignment { role == .user ? .trailing : role == .system ? .center : .leading }

    /// The accessible name: the author, then the time.
    private var accessibilityName: String {
        let name = author ?? role.defaultName(locale: locale)
        guard let timestamp else { return name }
        return [name, timestamp.formatted(Date.FormatStyle(date: .omitted, time: .shortened).locale(locale))].formatted(.list(type: .and, width: .narrow).locale(locale))
    }

    public var body: some View {
        VStack(alignment: alignment, spacing: StanceSpacing.sm) {
            if author != nil || timestamp != nil { header }
            bubble
            actions
            footer
        }
        .frame(maxWidth: .infinity, alignment: frameAlignment)
        .padding(.leading, role == .user && resolvedVariant == .bubble ? StanceSpacing.xxl : 0)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(accessibilityName)
        .accessibilityValue(status.accessibilityDescription(locale: locale) ?? "")
        .onChange(of: status) { old, new in
            guard announcesStatus, let message = StanceGenerationStatus.announcement(from: old, to: new, locale: locale) else { return }
            StanceAnnouncer.announce(message, urgent: new == .error)
        }
    }

    private var header: some View {
        HStack(spacing: StanceSpacing.sm) {
            StanceAuthorMark(role: role, author: author, avatar: avatar)
            if let author { Text(author).stanceText(.label) }
            if let timestamp {
                Text(timestamp, format: Date.FormatStyle(date: .omitted, time: .shortened)).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
            }
        }
        .accessibilityHidden(true)
    }

    @ViewBuilder private var bubble: some View {
        let shape = RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous)
        let body = content
            .stanceText(role == .system ? .bodySmall : .body)
            .foregroundStyle(role == .system ? theme.colors.fgMuted : theme.colors.fgDefault)
            .multilineTextAlignment(role == .system ? .center : .leading)
        if resolvedVariant == .bubble {
            body
                .padding(.horizontal, StanceSpacing.lg)
                .padding(.vertical, StanceSpacing.md)
                .background(role == .user ? theme.colors.bgMuted : theme.colors.bgSurface, in: shape)
                .overlay {
                    shape.strokeBorder(
                        status == .error ? theme.colors.dangerBorder : role == .user && !theme.isHighContrast ? .clear : theme.colors.borderDefault,
                        lineWidth: theme.borderWidth
                    )
                }
        } else {
            body
        }
    }
}

/// Consecutive messages from one author under a single avatar and name.
public struct StanceMessageGroup<Content: View>: View {
    private let role: StanceMessageRole
    private let author: String?
    private let avatar: Image?
    private let content: Content
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - role: Who the messages are from.
    ///   - author: The name shown once above the group. Defaults to a localised role name.
    ///   - avatar: An image for the avatar.
    ///   - content: The messages. Leave `author` off each ``StanceMessage`` inside.
    public init(role: StanceMessageRole = .assistant, author: String? = nil, avatar: Image? = nil, @ViewBuilder content: () -> Content) {
        self.role = role
        self.author = author
        self.avatar = avatar
        self.content = content()
    }

    public var body: some View {
        let name = author ?? role.defaultName(locale: locale)
        VStack(alignment: role == .user ? .trailing : .leading, spacing: StanceSpacing.sm) {
            HStack(spacing: StanceSpacing.sm) {
                StanceAuthorMark(role: role, author: name, avatar: avatar)
                Text(name).stanceText(.label)
            }
            .accessibilityHidden(true)
            VStack(alignment: role == .user ? .trailing : .leading, spacing: StanceSpacing.xs) { content }
        }
        .frame(maxWidth: .infinity, alignment: role == .user ? .trailing : .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(name)
    }
}

// MARK: Message actions

/// The words used by ``StanceMessageActions``. Leave a value `nil` for the localised default.
public struct StanceMessageActionsLabels: Sendable {
    /// Replaces the built in text for "copy".
    public var copy: String?
    /// Replaces the built in text for "copied".
    public var copied: String?
    /// Replaces the built in text for "retry".
    public var retry: String?
    /// Replaces the built in text for "edit".
    public var edit: String?
    /// Replaces the built in text for "good response".
    public var goodResponse: String?
    /// Replaces the built in text for "bad response".
    public var badResponse: String?
    /// Replaces the built in text for "toolbar".
    public var toolbar: String?

    /// Creates the labels. Every value defaults to the localised built in text.
    public init(copy: String? = nil, copied: String? = nil, retry: String? = nil, edit: String? = nil, goodResponse: String? = nil, badResponse: String? = nil, toolbar: String? = nil) {
        self.copy = copy
        self.copied = copied
        self.retry = retry
        self.edit = edit
        self.goodResponse = goodResponse
        self.badResponse = badResponse
        self.toolbar = toolbar
    }
}

/// The row of actions under a message: copy, retry, edit, good response and bad response.
///
/// Only the actions with a handler are shown. Copy confirms with a tick and a polite
/// announcement. The rating buttons are toggles: tapping the current rating clears it.
public struct StanceMessageActions<Extra: View>: View {
    private let rating: StanceRating?
    private let labels: StanceMessageActionsLabels
    private let onCopy: (() -> Void)?
    private let onRetry: (() -> Void)?
    private let onEdit: (() -> Void)?
    private let onRate: ((StanceRating?) -> Void)?
    private let extra: Extra
    @State private var copied = false
    @State private var bounce = 0
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - rating: The current rating, if any.
    ///   - labels: Replacement words for the built in labels.
    ///   - onCopy: Copies the message. The app writes to the pasteboard.
    ///   - onRetry: Asks for the response again.
    ///   - onEdit: Edits the message.
    ///   - onRate: Called with the new rating, or `nil` when the rating is cleared.
    ///   - extra: More actions, placed after the built in ones.
    public init(
        rating: StanceRating? = nil,
        labels: StanceMessageActionsLabels = .init(),
        onCopy: (() -> Void)? = nil,
        onRetry: (() -> Void)? = nil,
        onEdit: (() -> Void)? = nil,
        onRate: ((StanceRating?) -> Void)? = nil,
        @ViewBuilder extra: () -> Extra = { EmptyView() }
    ) {
        self.rating = rating
        self.labels = labels
        self.onCopy = onCopy
        self.onRetry = onRetry
        self.onEdit = onEdit
        self.onRate = onRate
        self.extra = extra()
    }

    public var body: some View {
        StanceFlowLayout(spacing: 0, lineSpacing: 0) {
            if let onCopy {
                StanceQuietIconButton(
                    symbol: copied ? "checkmark" : "doc.on.doc",
                    label: copied ? labels.copied ?? stanceString("stance.ai.actions.copied", locale) : labels.copy ?? stanceString("stance.ai.actions.copy", locale)
                ) {
                    onCopy()
                    confirmCopy()
                }
            }
            if let onRetry {
                StanceQuietIconButton(symbol: "arrow.clockwise", label: labels.retry ?? stanceString("stance.ai.actions.retry", locale), action: onRetry)
            }
            if let onEdit {
                StanceQuietIconButton(symbol: "pencil", label: labels.edit ?? stanceString("stance.ai.actions.edit", locale), action: onEdit)
            }
            if onRate != nil {
                StanceQuietIconButton(
                    symbol: rating == .up ? "hand.thumbsup.fill" : "hand.thumbsup",
                    label: labels.goodResponse ?? stanceString("stance.ai.actions.good", locale),
                    isOn: rating == .up,
                    bounce: rating == .up ? bounce : 0
                ) { rate(.up) }
                StanceQuietIconButton(
                    symbol: rating == .down ? "hand.thumbsdown.fill" : "hand.thumbsdown",
                    label: labels.badResponse ?? stanceString("stance.ai.actions.bad", locale),
                    isOn: rating == .down,
                    bounce: rating == .down ? bounce : 0
                ) { rate(.down) }
            }
            extra
        }
        // Line the first glyph up with the message text: the 44pt target is wider than the glyph.
        .padding(.leading, -(StanceSize.touchTarget - StanceSize.iconSm - StanceSpacing.xxs) / 2)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(labels.toolbar ?? stanceString("stance.ai.actions", locale))
    }

    private func rate(_ tapped: StanceRating) {
        StanceHaptics.selection()
        bounce += 1
        onRate?(StanceRating.toggled(rating, tapped: tapped))
    }

    private func confirmCopy() {
        copied = true
        StanceHaptics.selection()
        StanceAnnouncer.announce(labels.copied ?? stanceString("stance.ai.actions.copied", locale))
        Task {
            try? await Task.sleep(for: .seconds(StanceMotion.confirmationDuration))
            copied = false
        }
    }
}

// MARK: Branch switcher

/// The words used by ``StanceBranchSwitcher``. Leave a value `nil` for the localised default.
public struct StanceBranchSwitcherLabels: Sendable {
    /// Replaces the built in text for "previous".
    public var previous: String?
    /// Replaces the built in text for "next".
    public var next: String?

    /// Creates the labels. Every value defaults to the localised built in text.
    public init(previous: String? = nil, next: String? = nil) {
        self.previous = previous
        self.next = next
    }
}

/// Steps between alternative versions of a message after an edit or retry.
///
/// Hidden when there is only one version.
public struct StanceBranchSwitcher: View {
    private let count: Int
    private let labels: StanceBranchSwitcherLabels
    @Binding private var index: Int
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - count: How many versions exist.
    ///   - index: The zero based index of the version on screen.
    ///   - labels: Replacement words for the previous and next buttons.
    public init(count: Int, index: Binding<Int>, labels: StanceBranchSwitcherLabels = .init()) {
        self.count = max(0, count)
        _index = index
        self.labels = labels
    }

    /// An index kept inside `0 ..< count`.
    public nonisolated static func clampedIndex(_ index: Int, count: Int) -> Int {
        min(max(index, 0), max(count - 1, 0))
    }

    /// Whether there is an earlier version to step to.
    public nonisolated static func canGoBack(index: Int, count: Int) -> Bool {
        count > 1 && clampedIndex(index, count: count) > 0
    }

    /// Whether there is a later version to step to.
    public nonisolated static func canGoForward(index: Int, count: Int) -> Bool {
        count > 1 && clampedIndex(index, count: count) < count - 1
    }

    /// The position in words, for example "2 of 3".
    public nonisolated static func position(index: Int, count: Int, locale: Locale = .current) -> String {
        stanceString("stance.ai.branch.position \(clampedIndex(index, count: count) + 1) \(max(count, 1))", locale)
    }

    public var body: some View {
        if count > 1 {
            let current = Self.clampedIndex(index, count: count)
            HStack(spacing: 0) {
                StanceQuietIconButton(symbol: "chevron.backward", label: labels.previous ?? stanceString("stance.ai.branch.previous", locale)) { step(-1) }
                    .disabled(!Self.canGoBack(index: index, count: count))
                Text(Self.position(index: index, count: count, locale: locale))
                    .stanceText(.caption)
                    .monospacedDigit()
                    .foregroundStyle(theme.colors.fgMuted)
                    .contentTransition(.numericText(value: Double(current)))
                    .stanceAnimation(.fast, value: current)
                    .accessibilityLabel(stanceString("stance.ai.branch.label \(current + 1) \(count)", locale))
                StanceQuietIconButton(symbol: "chevron.forward", label: labels.next ?? stanceString("stance.ai.branch.next", locale)) { step(1) }
                    .disabled(!Self.canGoForward(index: index, count: count))
            }
            .accessibilityElement(children: .contain)
        }
    }

    private func step(_ delta: Int) {
        let next = Self.clampedIndex(Self.clampedIndex(index, count: count) + delta, count: count)
        guard next != index else { return }
        index = next
        StanceHaptics.selection()
        StanceAnnouncer.announce(stanceString("stance.ai.branch.label \(next + 1) \(count)", locale))
    }
}

// MARK: Scroll to latest

/// A floating button that appears when the reader has scrolled away from the newest message.
public struct StanceScrollToLatest: View {
    private let isVisible: Bool
    private let unreadCount: Int
    private let label: String?
    private let action: () -> Void
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// - Parameters:
    ///   - isVisible: Whether the button is on screen.
    ///   - unreadCount: New messages below the viewport. Shown as a count when above zero.
    ///   - label: The accessible name. Defaults to a localised "Scroll to latest".
    ///   - action: Scrolls to the newest message.
    public init(isVisible: Bool = true, unreadCount: Int = 0, label: String? = nil, action: @escaping () -> Void) {
        self.isVisible = isVisible
        self.unreadCount = max(0, unreadCount)
        self.label = label
        self.action = action
    }

    public var body: some View {
        ZStack {
            if isVisible {
                Button(action: action) {
                    StanceSymbol("arrow.down", size: StanceSize.iconSm)
                        .foregroundStyle(theme.colors.fgDefault)
                        .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
                        .background(theme.colors.bgSurfaceRaised, in: Circle())
                        .overlay { Circle().strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
                        .stanceShadow(.md, cornerRadius: StanceRadius.full)
                        .overlay(alignment: .topTrailing) {
                            if unreadCount > 0 {
                                Text(unreadCount.formatted(.number.notation(.compactName).locale(locale)))
                                    .stanceText(.caption)
                                    .fontWeight(.semibold)
                                    .monospacedDigit()
                                    .contentTransition(.numericText(value: Double(unreadCount)))
                                    .padding(.horizontal, StanceSpacing.s1_5)
                                    .padding(.vertical, StanceSpacing.xxs)
                                    .foregroundStyle(theme.colors.accentFg)
                                    .background(theme.colors.accentBg, in: Capsule())
                                    .alignmentGuide(.top) { $0[VerticalAlignment.center] }
                                    .alignmentGuide(.trailing) { $0[.trailing] - StanceSpacing.sm }
                            }
                        }
                        .contentShape(Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(label ?? stanceString("stance.ai.scrollToLatest", locale))
                .accessibilityValue(unreadCount > 0 ? stanceString("stance.ai.unread \(unreadCount)", locale) : "")
                .transition(reduceMotion ? .opacity : .scale.combined(with: .opacity))
            }
        }
        .stanceAnimation(.normal, value: isVisible)
        .stanceAnimation(.fast, value: unreadCount)
    }
}

// MARK: Conversation list

/// A past conversation in a ``StanceConversationList``.
public struct StanceConversation: Identifiable, Hashable, Sendable {
    /// A stable identifier.
    public let id: String
    /// The title.
    public var title: String
    /// When the conversation last changed.
    public var updatedAt: Date
    /// A custom section name. Without one, conversations are grouped by date.
    public var group: String?
    /// Whether the conversation is pinned to the top.
    public var isPinned: Bool

    /// Creates a conversation.
    public init(id: String, title: String, updatedAt: Date, group: String? = nil, isPinned: Bool = false) {
        self.id = id
        self.title = title
        self.updatedAt = updatedAt
        self.group = group
        self.isPinned = isPinned
    }
}

/// One titled group of conversations.
public struct StanceConversationSection: Identifiable, Equatable, Sendable {
    /// A stable identifier.
    public let id: String
    /// The title.
    public let title: String
    /// The conversations in the group, newest first.
    public let items: [StanceConversation]
}

/// The words used by ``StanceConversationList``. Leave a value `nil` for the localised default.
public struct StanceConversationListLabels: Sendable {
    /// Replaces the built in text for "list".
    public var list: String?
    /// Replaces the built in text for "rename".
    public var rename: String?
    /// Replaces the built in text for "delete".
    public var delete: String?
    /// Replaces the built in text for "pin".
    public var pin: String?
    /// Replaces the built in text for "unpin".
    public var unpin: String?
    /// Replaces the built in text for "save".
    public var save: String?
    /// Replaces the built in text for "cancel".
    public var cancel: String?
    /// Replaces the built in text for "title field".
    public var titleField: String?
    /// Replaces the built in text for "empty title".
    public var emptyTitle: String?
    /// Replaces the built in text for "empty message".
    public var emptyMessage: String?

    /// Creates the labels. Every value defaults to the localised built in text.
    public init(
        list: String? = nil, rename: String? = nil, delete: String? = nil, pin: String? = nil, unpin: String? = nil,
        save: String? = nil, cancel: String? = nil, titleField: String? = nil, emptyTitle: String? = nil, emptyMessage: String? = nil
    ) {
        self.list = list
        self.rename = rename
        self.delete = delete
        self.pin = pin
        self.unpin = unpin
        self.save = save
        self.cancel = cancel
        self.titleField = titleField
        self.emptyTitle = emptyTitle
        self.emptyMessage = emptyMessage
    }
}

/// A list of past conversations grouped by date, with selection, rename, pin and delete.
///
/// Built on the native `List`. Rename, pin and delete are swipe actions and a context menu, and
/// rename uses the system alert with a text field. Only the actions with a handler are offered.
public struct StanceConversationList<EmptyContent: View>: View {
    private let items: [StanceConversation]
    private let labels: StanceConversationListLabels
    private let now: Date
    private let onRename: ((StanceConversation, String) -> Void)?
    private let onDelete: ((StanceConversation) -> Void)?
    private let onPin: ((StanceConversation) -> Void)?
    private let emptyState: EmptyContent
    @Binding private var selection: String?
    @State private var renaming: StanceConversation?
    @State private var draftTitle = ""
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.calendar) private var calendar

    /// - Parameters:
    ///   - items: The conversations, in any order.
    ///   - selection: The identifier of the open conversation.
    ///   - labels: Replacement words for the built in labels.
    ///   - now: The date that "Today" is measured from. Fixed in tests and previews.
    ///   - onRename: Called with the conversation and its new title.
    ///   - onDelete: Called when a conversation is deleted.
    ///   - onPin: Called to pin or unpin a conversation.
    ///   - emptyState: Shown when there are no conversations. Defaults to a short empty state.
    public init(
        _ items: [StanceConversation],
        selection: Binding<String?>,
        labels: StanceConversationListLabels = .init(),
        now: Date = .now,
        onRename: ((StanceConversation, String) -> Void)? = nil,
        onDelete: ((StanceConversation) -> Void)? = nil,
        onPin: ((StanceConversation) -> Void)? = nil,
        @ViewBuilder emptyState: () -> EmptyContent = { EmptyView() }
    ) {
        self.items = items
        _selection = selection
        self.labels = labels
        self.now = now
        self.onRename = onRename
        self.onDelete = onDelete
        self.onPin = onPin
        self.emptyState = emptyState()
    }

    /// Groups conversations for display: pinned first, then by custom group or by date, newest first.
    public nonisolated static func sections(_ items: [StanceConversation], now: Date = .now, calendar: Calendar = .current, locale: Locale = .current) -> [StanceConversationSection] {
        let sorted = items.sorted { $0.updatedAt > $1.updatedAt }
        var order: [String] = []
        var titles: [String: String] = [:]
        var grouped: [String: [StanceConversation]] = [:]
        let today = calendar.startOfDay(for: now)
        for item in sorted {
            let key: String, title: String
            if item.isPinned {
                (key, title) = ("pinned", stanceString("stance.ai.conversations.pinned", locale))
            } else if let group = item.group {
                (key, title) = ("group:\(group)", group)
            } else {
                let days = calendar.dateComponents([.day], from: calendar.startOfDay(for: item.updatedAt), to: today).day ?? 0
                switch days {
                case ...0: (key, title) = ("today", stanceString("stance.ai.conversations.today", locale))
                case 1: (key, title) = ("yesterday", stanceString("stance.ai.conversations.yesterday", locale))
                case 2 ... 7: (key, title) = ("week", stanceString("stance.ai.conversations.week", locale))
                case 8 ... 30: (key, title) = ("month", stanceString("stance.ai.conversations.month", locale))
                default: (key, title) = ("earlier", stanceString("stance.ai.conversations.earlier", locale))
                }
            }
            if grouped[key] == nil {
                order.append(key)
                titles[key] = title
            }
            grouped[key, default: []].append(item)
        }
        // Pinned leads; the rest keep newest first order.
        let keys = order.filter { $0 == "pinned" } + order.filter { $0 != "pinned" }
        return keys.map { StanceConversationSection(id: $0, title: titles[$0] ?? "", items: grouped[$0] ?? []) }
    }

    public var body: some View {
        Group {
            if items.isEmpty {
                if EmptyContent.self == EmptyView.self {
                    StanceEmptyState(
                        icon: .inbox,
                        title: labels.emptyTitle ?? stanceString("stance.ai.conversations.emptyTitle", locale),
                        message: labels.emptyMessage ?? stanceString("stance.ai.conversations.emptyMessage", locale)
                    )
                } else {
                    emptyState
                }
            } else {
                list
            }
        }
        .alert(
            labels.rename ?? stanceString("stance.ai.conversations.rename", locale),
            isPresented: Binding(get: { renaming != nil }, set: { if !$0 { renaming = nil } }),
            presenting: renaming
        ) { item in
            TextField(labels.titleField ?? stanceString("stance.ai.conversations.titleField", locale), text: $draftTitle)
            Button(labels.save ?? stanceString("stance.ai.conversations.save", locale)) {
                let title = draftTitle.trimmingCharacters(in: .whitespacesAndNewlines)
                if !title.isEmpty { onRename?(item, title) }
            }
            Button(labels.cancel ?? stanceString("stance.cancel", locale), role: .cancel) {}
        }
    }

    private var list: some View {
        List {
            ForEach(Self.sections(items, now: now, calendar: calendar, locale: locale)) { section in
                Section {
                    ForEach(section.items) { item in row(item) }
                } header: {
                    Text(section.title).stanceText(.caption).fontWeight(.semibold).foregroundStyle(theme.colors.fgMuted)
                }
            }
        }
        .listStyle(.plain)
        .stanceListStyle()
        .accessibilityLabel(labels.list ?? stanceString("stance.ai.conversations", locale))
    }

    private func row(_ item: StanceConversation) -> some View {
        let selected = item.id == selection
        let pinTitle = item.isPinned ? labels.unpin ?? stanceString("stance.ai.conversations.unpin", locale) : labels.pin ?? stanceString("stance.ai.conversations.pin", locale)
        let deleteTitle = labels.delete ?? stanceString("stance.ai.conversations.delete", locale)
        let renameTitle = labels.rename ?? stanceString("stance.ai.conversations.rename", locale)
        return Button {
            selection = item.id
        } label: {
            HStack(spacing: StanceSpacing.sm) {
                Text(item.title).stanceText(.body).fontWeight(selected ? .semibold : .regular).lineLimit(2).multilineTextAlignment(.leading)
                Spacer(minLength: StanceSpacing.sm)
                if item.isPinned { StanceSymbol("pin.fill", size: StanceSize.iconSm - StanceSpacing.xxs).foregroundStyle(theme.colors.fgMuted) }
            }
            .frame(minHeight: StanceSize.touchTarget)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .foregroundStyle(selected ? theme.colors.interactiveSelectedFg : theme.colors.fgDefault)
        .listRowBackground(selected ? theme.colors.interactiveSelected : theme.colors.bgCanvas)
        .listRowSeparatorTint(theme.colors.separator)
        .accessibilityAddTraits(selected ? .isSelected : [])
        .swipeActions(edge: .trailing) {
            if let onDelete {
                Button(role: .destructive) { onDelete(item) } label: { Label(deleteTitle, systemImage: "trash") }
            }
        }
        .swipeActions(edge: .leading) {
            if let onPin {
                Button { onPin(item) } label: { Label(pinTitle, systemImage: item.isPinned ? "pin.slash" : "pin") }
                    .tint(theme.colors.accentBg)
            }
        }
        .contextMenu {
            if onRename != nil {
                Button {
                    draftTitle = item.title
                    renaming = item
                } label: { Label(renameTitle, systemImage: "pencil") }
            }
            if let onPin {
                Button { onPin(item) } label: { Label(pinTitle, systemImage: item.isPinned ? "pin.slash" : "pin") }
            }
            if let onDelete {
                Button(role: .destructive) { onDelete(item) } label: { Label(deleteTitle, systemImage: "trash") }
            }
        }
    }
}

// MARK: Thread empty state

/// A starter prompt on a ``StanceThreadEmptyState``.
public struct StanceStarter: Identifiable, Hashable, Sendable {
    /// A stable identifier.
    public let id: String
    /// The visible text.
    public var label: String
    /// A short supporting line.
    public var description: String?
    /// An icon shown before the text.
    public var icon: StanceIconName?

    /// Creates a starter prompt.
    public init(id: String, label: String, description: String? = nil, icon: StanceIconName? = nil) {
        self.id = id
        self.label = label
        self.description = description
        self.icon = icon
    }
}

/// The opening screen of a new conversation with a greeting and starter prompts.
public struct StanceThreadEmptyState: View {
    private let title: String?
    private let description: String?
    private let icon: StanceIconName
    private let starters: [StanceStarter]
    private let onStarterSelect: (StanceStarter) -> Void
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - title: The greeting. Defaults to a localised "How can I help?".
    ///   - description: A line under the greeting.
    ///   - icon: The mark above the greeting. The sparkle identifies the assistant.
    ///   - starters: Prompts the reader can start from.
    ///   - onStarterSelect: Called with the chosen starter.
    public init(
        title: String? = nil,
        description: String? = nil,
        icon: StanceIconName = .sparkle,
        starters: [StanceStarter] = [],
        onStarterSelect: @escaping (StanceStarter) -> Void = { _ in }
    ) {
        self.title = title
        self.description = description
        self.icon = icon
        self.starters = starters
        self.onStarterSelect = onStarterSelect
    }

    public var body: some View {
        VStack(spacing: StanceSpacing.lg) {
            VStack(spacing: StanceSpacing.md) {
                StanceIcon(icon, size: StanceSize.iconLg)
                    .foregroundStyle(theme.colors.fgDefault)
                    .padding(StanceSpacing.md)
                    .background(theme.colors.bgMuted, in: Circle())
                Text(title ?? stanceString("stance.ai.empty.title", locale)).stanceText(.heading).accessibilityAddTraits(.isHeader)
                if let description { Text(description).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted) }
            }
            .multilineTextAlignment(.center)
            if !starters.isEmpty {
                VStack(spacing: StanceSpacing.sm) {
                    ForEach(starters) { starter in
                        Button {
                            StanceHaptics.selection()
                            onStarterSelect(starter)
                        } label: {
                            HStack(spacing: StanceSpacing.md) {
                                if let icon = starter.icon { StanceIcon(icon, size: StanceSize.iconMd).foregroundStyle(theme.colors.fgMuted) }
                                VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                                    Text(starter.label).stanceText(.label)
                                    if let description = starter.description {
                                        Text(description).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
                                    }
                                }
                                .multilineTextAlignment(.leading)
                            }
                        }
                        .buttonStyle(StanceRowButtonStyle())
                    }
                }
            }
        }
        .frame(maxWidth: StanceSize.readableWidth)
        .padding(StanceSpacing.lg)
        .frame(maxWidth: .infinity)
    }
}
