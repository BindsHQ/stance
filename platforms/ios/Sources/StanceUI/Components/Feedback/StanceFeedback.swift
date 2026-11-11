import SwiftUI

/// An inline status message inside content. Urgent tones are announced when they appear.
public struct StanceInlineAlert<Actions: View>: View {
    private let tone: StanceTone
    private let title: String
    private let message: String?
    private let actions: Actions
    @Environment(\.stanceTheme) private var theme

    public init(_ title: String, message: String? = nil, tone: StanceTone = .info, @ViewBuilder actions: () -> Actions = { EmptyView() }) {
        self.title = title
        self.message = message
        self.tone = tone
        self.actions = actions()
    }

    public var body: some View {
        HStack(alignment: .top, spacing: StanceSpacing.md) {
            StanceIcon(tone.icon, size: StanceSize.iconMd).foregroundStyle(tone.foreground(theme)).padding(.top, 1)
            VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                Text(title).stanceText(.label)
                if let message { Text(message).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted) }
                actions.padding(.top, StanceSpacing.xs)
            }
            Spacer(minLength: 0)
        }
        .padding(StanceSpacing.lg)
        .background(tone.background(theme), in: RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous).strokeBorder(tone.border(theme), lineWidth: theme.borderWidth) }
        .accessibilityElement(children: .combine)
        .onAppear {
            if tone == .danger || tone == .warning { StanceAnnouncer.announce([title, message].compactMap { $0 }.joined(separator: ". "), urgent: true) }
        }
    }
}

/// A full-width announcement at the top of a screen, optionally dismissible.
public struct StanceBanner: View {
    private let text: String
    private let tone: StanceTone
    private let actionTitle: String?
    private let action: (() -> Void)?
    private let onDismiss: (() -> Void)?
    @Environment(\.stanceTheme) private var theme

    public init(_ text: String, tone: StanceTone = .info, actionTitle: String? = nil, action: (() -> Void)? = nil, onDismiss: (() -> Void)? = nil) {
        self.text = text
        self.tone = tone
        self.actionTitle = actionTitle
        self.action = action
        self.onDismiss = onDismiss
    }

    public var body: some View {
        HStack(spacing: StanceSpacing.md) {
            StanceIcon(tone.icon, size: StanceSize.iconSm + 2).foregroundStyle(tone.foreground(theme))
            Text(text).stanceText(.bodySmall).frame(maxWidth: .infinity, alignment: .leading)
            if let actionTitle, let action {
                Button(actionTitle, action: action).buttonStyle(.stance(.link, size: .small))
            }
            if let onDismiss {
                Button(action: onDismiss) {
                    StanceIcon(.x, size: StanceSize.iconSm).frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget).contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityElement()
                .accessibilityAddTraits(.isButton)
                .accessibilityLabel("Dismiss")
                .padding(.trailing, -StanceSpacing.md)
            }
        }
        .padding(.horizontal, StanceSpacing.lg)
        .padding(.vertical, StanceSpacing.xs)
        .frame(minHeight: StanceSize.touchTarget)
        .background(tone.background(theme))
        .overlay(alignment: .bottom) { Rectangle().fill(tone.border(theme)).frame(height: theme.borderWidth) }
    }
}

/// A centred loading indicator with a message. Announced once when it appears.
public struct StanceLoadingState: View {
    private let message: String
    @Environment(\.stanceTheme) private var theme

    public init(_ message: String = "Loading") { self.message = message }

    public var body: some View {
        VStack(spacing: StanceSpacing.md) {
            ProgressView().controlSize(.large).tint(theme.colors.accentBg)
            Text(message).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(StanceSpacing.xl)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.updatesFrequently)
    }
}

/// Explains a failure and offers a way to retry.
public struct StanceErrorState: View {
    private let title: String
    private let message: String
    private let retryTitle: String
    private let retry: (() -> Void)?

    public init(title: String = "Something went wrong", message: String, retryTitle: String = "Try again", retry: (() -> Void)? = nil) {
        self.title = title
        self.message = message
        self.retryTitle = retryTitle
        self.retry = retry
    }

    public var body: some View {
        StanceEmptyState(icon: .alertTriangle, title: title, message: message) {
            if let retry { StanceButton(retryTitle, variant: .outline, leadingIcon: .refresh, action: retry) }
        }
    }
}

// MARK: Toast

/// A transient message.
public struct StanceToast: Identifiable, Equatable, Sendable {
    public let id: UUID
    public let message: String
    public let tone: StanceTone
    public let duration: TimeInterval

    public init(_ message: String, tone: StanceTone = .neutral, duration: TimeInterval = 4) {
        id = UUID()
        self.message = message
        self.tone = tone
        self.duration = duration
    }
}

/// Queues toasts and shows one at a time. Inject it with `.stanceToastHost()` and
/// read it with `@Environment(StanceToastCenter.self)`.
@MainActor
@Observable
public final class StanceToastCenter {
    public private(set) var current: StanceToast?
    public private(set) var queue: [StanceToast] = []
    private var dismissTask: Task<Void, Never>?
    /// Set to false in tests to stop automatic dismissal.
    public var autoDismiss = true

    public init() {}

    public func show(_ message: String, tone: StanceTone = .neutral, duration: TimeInterval = 4) {
        show(StanceToast(message, tone: tone, duration: duration))
    }

    public func show(_ toast: StanceToast) {
        queue.append(toast)
        if current == nil { advance() }
    }

    public func dismiss() {
        dismissTask?.cancel()
        current = nil
        advance()
    }

    private func advance() {
        guard current == nil, !queue.isEmpty else { return }
        let next = queue.removeFirst()
        current = next
        StanceAnnouncer.announce(next.message, urgent: next.tone == .danger)
        guard autoDismiss else { return }
        dismissTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(next.duration))
            guard !Task.isCancelled else { return }
            self?.dismiss()
        }
    }
}

struct StanceToastHost: ViewModifier {
    @State private var center = StanceToastCenter()
    @Environment(\.stanceTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .environment(center)
            .overlay(alignment: .bottom) {
                if let toast = center.current {
                    HStack(spacing: StanceSpacing.md) {
                        if toast.tone != .neutral { StanceIcon(toast.tone.icon, size: StanceSize.iconSm + 2) }
                        Text(toast.message).stanceText(.bodySmall).frame(maxWidth: .infinity, alignment: .leading)
                        Button {
                            center.dismiss()
                        } label: {
                            StanceIcon(.x, size: StanceSize.iconSm).frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget).contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityElement()
                        .accessibilityAddTraits(.isButton)
                        .accessibilityLabel("Dismiss")
                        .padding(.trailing, -StanceSpacing.md)
                    }
                    .padding(.horizontal, StanceSpacing.lg)
                    .frame(minHeight: StanceSize.controlLg)
                    .foregroundStyle(theme.colors.fgInverse)
                    .background(theme.colors.bgInverse, in: RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
                    .stanceShadow(.lg)
                    .frame(maxWidth: 480)
                    .padding(StanceSpacing.lg)
                    .transition(reduceMotion ? .opacity : .move(edge: .bottom).combined(with: .opacity))
                    .id(toast.id)
                    .accessibilityElement(children: .contain)
                }
            }
            .animation(StanceMotion.normal.animation(reduceMotion: reduceMotion), value: center.current)
    }
}

extension View {
    /// Hosts Stance toasts for this hierarchy. Apply once near the root.
    public func stanceToastHost() -> some View { modifier(StanceToastHost()) }
}
