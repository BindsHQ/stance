import SwiftUI

// MARK: Prompt composer

/// What the composer can do right now, derived from the draft, the status and whether it is enabled.
public enum StanceComposerState: String, CaseIterable, Sendable {
    /// Nothing to send.
    case empty
    /// A draft is ready to send.
    case ready
    /// The draft was sent and no content has arrived yet.
    case submitted
    /// A response is arriving. Send becomes stop.
    case streaming
    /// The composer is disabled.
    case disabled

    /// The state for a draft and a generation status.
    public static func resolve(text: String, status: StanceGenerationStatus, isEnabled: Bool = true) -> StanceComposerState {
        guard isEnabled else { return .disabled }
        switch status {
        case .submitted: return .submitted
        case .streaming: return .streaming
        default: return text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? .empty : .ready
        }
    }

    /// Whether the draft can be sent.
    public var canSubmit: Bool { self == .ready }

    /// Whether the send button acts as stop.
    public var showsStop: Bool { self == .submitted || self == .streaming }
}

/// The words used by ``StancePromptComposer``. Leave a value `nil` for the localised default.
public struct StancePromptComposerLabels: Sendable {
    /// Replaces the built in text for "input".
    public var input: String?
    /// Replaces the built in text for "send".
    public var send: String?
    /// Replaces the built in text for "stop".
    public var stop: String?
    /// Replaces the built in text for "done".
    public var done: String?

    /// Creates the labels. Every value defaults to the localised built in text.
    public init(input: String? = nil, send: String? = nil, stop: String? = nil, done: String? = nil) {
        self.input = input
        self.send = send
        self.stop = stop
        self.done = done
    }
}

/// The message input: a text field that grows with its content, with slots for attachments,
/// tools and the send or stop button.
///
/// Built on `TextField(axis: .vertical)` with a line limit. Return sends by default and Shift
/// Return on a hardware keyboard adds a line. While a response is generated the send button
/// becomes stop. On send, `onSubmit` gets the draft as typed and the draft is cleared.
///
/// ```swift
/// StancePromptComposer(text: $draft, status: status) { message in
///     send(message)
/// } onStop: {
///     stop()
/// }
/// ```
public struct StancePromptComposer<Header: View, Leading: View, Trailing: View, Footer: View>: View {
    private let status: StanceGenerationStatus
    private let placeholder: String?
    private let maxRows: Int
    private let submitOnReturn: Bool
    private let labels: StancePromptComposerLabels
    private let onSubmit: (String) -> Void
    private let onStop: (() -> Void)?
    private let header: Header
    private let leading: Leading
    private let trailing: Trailing
    private let footer: Footer
    @Binding private var text: String
    @FocusState private var focused: Bool
    @State private var keepsNextNewline = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.dynamicTypeSize) private var typeSize

    /// Whether an edit is the Return key adding one line break to the draft.
    public nonisolated static func isReturnKey(old: String, new: String) -> Bool {
        guard new.count == old.count + 1 else { return false }
        return new.filter(\.isNewline).count == old.filter(\.isNewline).count + 1
    }

    /// The draft without the line break the Return key just added.
    public nonisolated static func removingReturn(old: String, new: String) -> String {
        guard isReturnKey(old: old, new: new) else { return new }
        var index = new.startIndex
        for character in old {
            if new[index] != character { break }
            index = new.index(after: index)
        }
        var result = new
        result.remove(at: index)
        return result
    }

    /// - Parameters:
    ///   - text: The draft.
    ///   - status: The generation status. Send becomes stop while it is active.
    ///   - placeholder: The prompt shown while the draft is empty. Defaults to a localised "Message".
    ///   - maxRows: The most lines the field grows to before it scrolls.
    ///   - submitOnReturn: Return sends the draft. When off, Return adds a line.
    ///   - labels: Replacement words for the built in labels.
    ///   - onSubmit: Called with the draft as typed. The draft is cleared afterwards.
    ///   - onStop: Stops the response. Without it, send is disabled while a response is generated.
    ///   - header: Above the field: attachments and context.
    ///   - leading: Before the field: attach and tool buttons.
    ///   - trailing: After the field, before send: voice input or a model picker.
    ///   - footer: Below the field: hints and meters.
    public init(
        text: Binding<String>,
        status: StanceGenerationStatus = .idle,
        placeholder: String? = nil,
        maxRows: Int = 8,
        submitOnReturn: Bool = true,
        labels: StancePromptComposerLabels = .init(),
        onSubmit: @escaping (String) -> Void,
        onStop: (() -> Void)? = nil,
        @ViewBuilder header: () -> Header = { EmptyView() },
        @ViewBuilder leading: () -> Leading = { EmptyView() },
        @ViewBuilder trailing: () -> Trailing = { EmptyView() },
        @ViewBuilder footer: () -> Footer = { EmptyView() }
    ) {
        _text = text
        self.status = status
        self.placeholder = placeholder
        self.maxRows = max(1, maxRows)
        self.submitOnReturn = submitOnReturn
        self.labels = labels
        self.onSubmit = onSubmit
        self.onStop = onStop
        self.header = header()
        self.leading = leading()
        self.trailing = trailing()
        self.footer = footer()
    }

    private var state: StanceComposerState { .resolve(text: text, status: status, isEnabled: isEnabled) }
    private var inputLabel: String { labels.input ?? stanceString("stance.ai.composer.input", locale) }

    public var body: some View {
        let shape = RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous)
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            header
            if typeSize.isAccessibilitySize {
                // At the largest text sizes the field takes the full width and the controls sit below.
                field
                HStack(alignment: .center, spacing: StanceSpacing.xs) {
                    leading
                    Spacer(minLength: 0)
                    trailing
                    actionButton
                }
            } else {
                HStack(alignment: .bottom, spacing: StanceSpacing.xs) {
                    leading
                    field
                    trailing
                    actionButton
                }
            }
            footer
        }
        .padding(.leading, StanceSpacing.md)
        .padding(.trailing, StanceSpacing.xs)
        .padding(.vertical, StanceSpacing.xs)
        .background {
            // Tapping the empty parts of the box focuses the field. The gesture sits on the
            // background so it never competes with the buttons inside.
            shape.fill(isEnabled ? theme.colors.bgSurface : theme.colors.disabledBg)
                .onTapGesture { focused = true }
        }
        .overlay {
            shape.strokeBorder(
                !isEnabled ? theme.colors.disabledBorder : focused ? theme.colors.focusRing : theme.colors.borderControl,
                lineWidth: focused ? max(theme.focusWidth, theme.controlBorderWidth) : theme.controlBorderWidth
            )
            .allowsHitTesting(false)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(inputLabel)
    }

    private var field: some View {
        TextField(placeholder ?? inputLabel, text: $text, axis: .vertical)
            .lineLimit(1 ... maxRows)
            .stanceText(.body)
            .foregroundStyle(isEnabled ? theme.colors.fgDefault : theme.colors.disabledFg)
            .focused($focused)
            .submitLabel(submitOnReturn ? .send : .return)
            .onSubmit {
                if submitOnReturn {
                    submit()
                } else {
                    text.append("\n")
                }
                // A vertical field gives up focus on Return. Keep the keyboard for the next message.
                focused = true
            }
            .onKeyPress(keys: [.return], phases: .down) { press in
                guard press.modifiers.contains(.shift) else { return .ignored }
                keepsNextNewline = true
                text.append("\n")
                return .handled
            }
            .onChange(of: text) { old, new in
                // A vertical field adds a line on Return instead of submitting. When Return
                // should send, take the line break back out and send the draft.
                guard Self.isReturnKey(old: old, new: new) else { return }
                if keepsNextNewline || !submitOnReturn {
                    keepsNextNewline = false
                    return
                }
                text = Self.removingReturn(old: old, new: new)
                submit()
            }
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button(labels.done ?? stanceString("stance.done", locale)) { focused = false }
                }
            }
            .padding(.vertical, StanceSpacing.sm)
            .frame(minHeight: StanceSize.touchTarget)
            .accessibilityLabel(inputLabel)
    }

    @ViewBuilder private var actionButton: some View {
        let stops = state.showsStop
        Button {
            if stops {
                StanceHaptics.impact()
                onStop?()
            } else {
                submit()
            }
        } label: {
            StanceCircleSymbol(symbol: stops ? "stop.fill" : "arrow.up")
        }
        .buttonStyle(.plain)
        .disabled(stops ? onStop == nil : !state.canSubmit)
        .accessibilityLabel(stops ? labels.stop ?? stanceString("stance.ai.stop", locale) : labels.send ?? stanceString("stance.ai.send", locale))
    }

    private func submit() {
        guard state.canSubmit else { return }
        StanceHaptics.impact()
        let draft = text
        text = ""
        onSubmit(draft)
    }
}

// MARK: Attachment tray

/// A file or image on a draft or a sent message.
public struct StanceAttachmentItem: Identifiable, Sendable {
    /// What the attachment is.
    public enum Kind: String, CaseIterable, Sendable {
        case image, file
    }

    /// A stable identifier.
    public let id: String
    /// The name.
    public var name: String
    /// Whether it is an image or a file.
    public var kind: Kind
    /// The size in bytes.
    public var size: Int64?
    /// A thumbnail supplied by the app. The tray loads nothing itself.
    public var preview: Image?
    /// Upload progress from 0 to 1, or `nil` when the upload is not running.
    public var progress: Double?
    /// Why the upload failed.
    public var error: String?

    /// Creates an attachment.
    public init(id: String, name: String, kind: Kind = .file, size: Int64? = nil, preview: Image? = nil, progress: Double? = nil, error: String? = nil) {
        self.id = id
        self.name = name
        self.kind = kind
        self.size = size
        self.preview = preview
        self.progress = progress
        self.error = error
    }
}

/// The words used by ``StanceAttachmentTray``. Leave a value `nil` for the localised default.
public struct StanceAttachmentTrayLabels: Sendable {
    /// Replaces the built in text for "list".
    public var list: String?
    /// The accessible name of a remove button, from the file name.
    public var remove: (@Sendable (String) -> String)?

    /// Creates the labels. Every value defaults to the localised built in text.
    public init(list: String? = nil, remove: (@Sendable (String) -> String)? = nil) {
        self.list = list
        self.remove = remove
    }
}

/// The attachments on a draft or a sent message: files and images with progress, errors and remove.
///
/// A scrolling row at standard text sizes and a column at accessibility sizes. Upload errors are
/// announced when they appear.
public struct StanceAttachmentTray: View {
    private let items: [StanceAttachmentItem]
    private let isReadOnly: Bool
    private let labels: StanceAttachmentTrayLabels
    private let onRemove: ((StanceAttachmentItem) -> Void)?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.dynamicTypeSize) private var typeSize

    /// - Parameters:
    ///   - items: The attachments.
    ///   - isReadOnly: Hide the remove buttons, for sent messages.
    ///   - labels: Replacement words for the built in labels.
    ///   - onRemove: Called when an attachment is removed.
    public init(_ items: [StanceAttachmentItem], isReadOnly: Bool = false, labels: StanceAttachmentTrayLabels = .init(), onRemove: ((StanceAttachmentItem) -> Void)? = nil) {
        self.items = items
        self.isReadOnly = isReadOnly
        self.labels = labels
        self.onRemove = onRemove
    }

    /// The line under a file name: the error, the upload progress or the size.
    public nonisolated static func detail(for item: StanceAttachmentItem, locale: Locale = .current) -> String? {
        if let error = item.error, !error.isEmpty { return error }
        if let progress = item.progress, progress < 1 {
            let percent = min(max(progress, 0), 1).formatted(.percent.precision(.fractionLength(0)).locale(locale))
            return stanceString("stance.ai.attachment.uploading \(percent)", locale)
        }
        return item.size.map { $0.formatted(.byteCount(style: .file).locale(locale)) }
    }

    private var errors: [String] {
        items.compactMap { item in item.error.flatMap { $0.isEmpty ? nil : "\(item.id)\u{1F}\(item.name)\u{1F}\($0)" } }
    }

    public var body: some View {
        Group {
            if typeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: StanceSpacing.sm) { chips }
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: StanceSpacing.sm) { chips }
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(labels.list ?? stanceString("stance.ai.attachments", locale))
        .onChange(of: errors, initial: true) { old, new in
            for entry in new where !old.contains(entry) || old == new {
                let parts = entry.split(separator: "\u{1F}", omittingEmptySubsequences: false)
                guard parts.count == 3 else { continue }
                StanceAnnouncer.announce(stanceString("stance.field.announcement \(String(parts[1])) \(String(parts[2]))", locale), urgent: true)
            }
        }
    }

    private var chips: some View {
        ForEach(items) { item in
            let failed = !(item.error ?? "").isEmpty
            let shape = RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous)
            HStack(spacing: StanceSpacing.sm) {
                thumbnail(item)
                VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                    Text(item.name).stanceText(.label).lineLimit(1).truncationMode(.middle)
                    if let detail = Self.detail(for: item, locale: locale) {
                        HStack(spacing: StanceSpacing.xs) {
                            if failed { StanceIcon(.alertCircle, size: StanceSize.iconSm - StanceSpacing.xxs) }
                            Text(detail).stanceText(.caption).lineLimit(typeSize.isAccessibilitySize ? nil : 1)
                        }
                        .foregroundStyle(failed ? theme.colors.dangerFg : theme.colors.fgMuted)
                    }
                    if let progress = item.progress, progress < 1, !failed {
                        ProgressView(value: min(max(progress, 0), 1)).tint(theme.colors.accentBg)
                    }
                }
                .accessibilityElement(children: .combine)
                if !isReadOnly, let onRemove {
                    Button { onRemove(item) } label: {
                        StanceIcon(.x, size: StanceSize.iconSm)
                            .foregroundStyle(theme.colors.fgMuted)
                            .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(labels.remove?(item.name) ?? stanceString("stance.remove \(item.name)", locale))
                    .padding(.trailing, -StanceSpacing.sm)
                }
            }
            .padding(.leading, StanceSpacing.sm)
            .padding(.trailing, StanceSpacing.md)
            .padding(.vertical, StanceSpacing.xs)
            .frame(minHeight: StanceSize.controlLg)
            .frame(maxWidth: typeSize.isAccessibilitySize ? .infinity : StanceSize.touchTarget * 6, alignment: .leading)
            .background(theme.colors.bgSurface, in: shape)
            .overlay { shape.strokeBorder(failed ? theme.colors.dangerBorder : theme.colors.borderDefault, lineWidth: theme.borderWidth) }
        }
    }

    private func thumbnail(_ item: StanceAttachmentItem) -> some View {
        let shape = RoundedRectangle(cornerRadius: StanceRadius.sm, style: .continuous)
        return ZStack {
            shape.fill(theme.colors.bgMuted)
            if let preview = item.preview {
                preview.resizable().scaledToFill()
            } else {
                StanceIcon(item.kind == .image ? .image : .fileText, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted)
            }
        }
        .frame(width: StanceSize.controlSm, height: StanceSize.controlSm)
        .clipShape(shape)
        .accessibilityHidden(true)
    }
}

// MARK: Suggestions

/// An entry in a ``StanceMentionPicker``: a file, a person or a tool.
public struct StanceSuggestion: Identifiable, Hashable, Sendable {
    /// A stable identifier.
    public let id: String
    /// The visible text.
    public var label: String
    /// A short supporting line.
    public var description: String?
    /// An icon shown before the text.
    public var icon: StanceIconName?
    /// A section name, such as "Files" or "People".
    public var group: String?

    /// Creates a suggestion.
    public init(id: String, label: String, description: String? = nil, icon: StanceIconName? = nil, group: String? = nil) {
        self.id = id
        self.label = label
        self.description = description
        self.icon = icon
        self.group = group
    }
}

/// A command in a ``StanceSlashCommandMenu``.
public struct StanceSlashCommand: Identifiable, Hashable, Sendable {
    /// A stable identifier.
    public let id: String
    /// The command name, without the slash.
    public var name: String
    /// A short supporting line.
    public var description: String?
    /// An icon shown before the text.
    public var icon: StanceIconName?
    /// A keyboard shortcut shown at the trailing edge, such as "⌘K".
    public var shortcut: String?

    /// Creates a command.
    public init(id: String, name: String, description: String? = nil, icon: StanceIconName? = nil, shortcut: String? = nil) {
        self.id = id
        self.name = name
        self.description = description
        self.icon = icon
        self.shortcut = shortcut
    }
}

/// One row of the shared suggestion panel.
struct StanceSuggestionRow: Identifiable, Equatable {
    let id: String
    let title: String
    let subtitle: String?
    let icon: StanceIconName?
    let trailing: String?
    let group: String?
}

/// The inline list behind the mention picker and the slash command menu.
struct StanceSuggestionPanel: View {
    let label: String
    let rows: [StanceSuggestionRow]
    let isLoading: Bool
    let emptyLabel: String
    let onSelect: (String) -> Void
    let onDismiss: () -> Void
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// Rows gathered under their group names, keeping the order groups first appear in.
    static func grouped(_ rows: [StanceSuggestionRow]) -> [(group: String?, rows: [StanceSuggestionRow])] {
        var result: [(group: String?, rows: [StanceSuggestionRow])] = []
        for row in rows {
            if let index = result.firstIndex(where: { $0.group == row.group }) {
                result[index].rows.append(row)
            } else {
                result.append((row.group, [row]))
            }
        }
        return result
    }

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous)
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                if isLoading {
                    HStack(spacing: StanceSpacing.sm) {
                        ProgressView().controlSize(.small).tint(theme.colors.fgMuted)
                        Text(stanceString("stance.loading", locale)).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted)
                    }
                    .frame(maxWidth: .infinity, minHeight: StanceSize.touchTarget, alignment: .leading)
                    .padding(.horizontal, StanceSpacing.md)
                    .accessibilityElement(children: .combine)
                } else if rows.isEmpty {
                    Text(emptyLabel)
                        .stanceText(.bodySmall)
                        .foregroundStyle(theme.colors.fgMuted)
                        .frame(maxWidth: .infinity, minHeight: StanceSize.touchTarget, alignment: .leading)
                        .padding(.horizontal, StanceSpacing.md)
                } else {
                    ForEach(Array(Self.grouped(rows).enumerated()), id: \.offset) { _, section in
                        if let group = section.group {
                            Text(group)
                                .stanceText(.caption)
                                .fontWeight(.semibold)
                                .foregroundStyle(theme.colors.fgMuted)
                                .padding(.horizontal, StanceSpacing.md)
                                .padding(.top, StanceSpacing.sm)
                                .accessibilityAddTraits(.isHeader)
                        }
                        ForEach(section.rows) { row in
                            Button { onSelect(row.id) } label: {
                                HStack(spacing: StanceSpacing.md) {
                                    if let icon = row.icon { StanceIcon(icon, size: StanceSize.iconSm + StanceSpacing.xxs).foregroundStyle(theme.colors.fgMuted) }
                                    VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                                        Text(row.title).stanceText(.label)
                                        if let subtitle = row.subtitle { Text(subtitle).stanceText(.caption).foregroundStyle(theme.colors.fgMuted) }
                                    }
                                    .multilineTextAlignment(.leading)
                                    Spacer(minLength: StanceSpacing.sm)
                                    if let trailing = row.trailing { Text(trailing).stanceText(.mono).foregroundStyle(theme.colors.fgSubtle) }
                                }
                            }
                            .buttonStyle(StanceRowButtonStyle(bordered: false))
                        }
                    }
                }
            }
            .padding(.vertical, StanceSpacing.xs)
        }
        .frame(maxHeight: StanceSize.touchTarget * 5)
        .fixedSize(horizontal: false, vertical: true)
        .background(theme.colors.bgSurfaceRaised, in: shape)
        .overlay { shape.strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
        .clipShape(shape)
        .stanceShadow(.md)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
        .accessibilityAction(.escape, onDismiss)
        .onKeyPress(.escape) {
            onDismiss()
            return .handled
        }
        .onChange(of: rows.count) { _, count in
            if !isLoading { StanceAnnouncer.announce(stanceString("stance.results.count \(count)", locale)) }
        }
    }
}

/// A filterable list that opens from a trigger character to reference files, people or tools.
///
/// Place it directly above the composer. It renders nothing while closed. The Escape key and
/// the VoiceOver escape gesture close it.
///
/// ```swift
/// StanceMentionPicker(isPresented: $showsMentions, query: query, items: files) { file in
///     insert(file)
/// }
/// ```
public struct StanceMentionPicker: View {
    private let query: String
    private let items: [StanceSuggestion]
    private let isLoading: Bool
    private let emptyLabel: String?
    private let label: String?
    private let onSelect: (StanceSuggestion) -> Void
    @Binding private var isPresented: Bool
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - isPresented: Whether the list is open.
    ///   - query: The text typed after the trigger. Filters the items by label.
    ///   - items: Everything that can be mentioned.
    ///   - isLoading: Show a loading row in place of the items.
    ///   - emptyLabel: Shown when nothing matches. Defaults to a localised "No matches".
    ///   - label: The accessible name. Defaults to a localised "Mentions".
    ///   - onSelect: Called with the chosen item. The picker closes itself.
    public init(
        isPresented: Binding<Bool>,
        query: String = "",
        items: [StanceSuggestion],
        isLoading: Bool = false,
        emptyLabel: String? = nil,
        label: String? = nil,
        onSelect: @escaping (StanceSuggestion) -> Void
    ) {
        _isPresented = isPresented
        self.query = query
        self.items = items
        self.isLoading = isLoading
        self.emptyLabel = emptyLabel
        self.label = label
        self.onSelect = onSelect
    }

    /// The items whose label or description contains the query, ignoring case and accents.
    public nonisolated static func filter(_ items: [StanceSuggestion], query: String) -> [StanceSuggestion] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return items }
        return items.filter {
            $0.label.range(of: trimmed, options: [.caseInsensitive, .diacriticInsensitive]) != nil
                || ($0.description?.range(of: trimmed, options: [.caseInsensitive, .diacriticInsensitive]) != nil)
        }
    }

    /// The query being typed after a trigger at the end of a draft, or `nil` when no mention is open.
    ///
    /// The trigger must start the draft or follow white space, and the query has no white space:
    /// `"Summarise @bud"` gives `"bud"`, `"mail@example"` gives `nil`.
    public nonisolated static func activeQuery(in text: String, trigger: Character = "@") -> String? {
        guard let index = text.lastIndex(of: trigger) else { return nil }
        let query = text[text.index(after: index)...]
        guard !query.contains(where: \.isWhitespace) else { return nil }
        if index > text.startIndex, !text[text.index(before: index)].isWhitespace { return nil }
        return String(query)
    }

    public var body: some View {
        if isPresented {
            let matches = Self.filter(items, query: query)
            StanceSuggestionPanel(
                label: label ?? stanceString("stance.ai.mentions", locale),
                rows: matches.map { StanceSuggestionRow(id: $0.id, title: $0.label, subtitle: $0.description, icon: $0.icon, trailing: nil, group: $0.group) },
                isLoading: isLoading,
                emptyLabel: emptyLabel ?? stanceString("stance.ai.suggestions.empty", locale),
                onSelect: { id in
                    guard let item = matches.first(where: { $0.id == id }) else { return }
                    StanceHaptics.selection()
                    onSelect(item)
                    isPresented = false
                },
                onDismiss: { isPresented = false }
            )
        }
    }
}

/// A command list that opens when the draft starts with a slash.
///
/// Place it directly above the composer. It renders nothing while closed.
public struct StanceSlashCommandMenu: View {
    private let query: String
    private let commands: [StanceSlashCommand]
    private let emptyLabel: String?
    private let label: String?
    private let onSelect: (StanceSlashCommand) -> Void
    @Binding private var isPresented: Bool
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - isPresented: Whether the menu is open.
    ///   - query: The text typed after the slash. Filters the commands by name.
    ///   - commands: Every command.
    ///   - emptyLabel: Shown when nothing matches. Defaults to a localised "No matches".
    ///   - label: The accessible name. Defaults to a localised "Commands".
    ///   - onSelect: Called with the chosen command. The menu closes itself.
    public init(
        isPresented: Binding<Bool>,
        query: String = "",
        commands: [StanceSlashCommand],
        emptyLabel: String? = nil,
        label: String? = nil,
        onSelect: @escaping (StanceSlashCommand) -> Void
    ) {
        _isPresented = isPresented
        self.query = query
        self.commands = commands
        self.emptyLabel = emptyLabel
        self.label = label
        self.onSelect = onSelect
    }

    /// The commands whose name starts with the query, then those that contain it.
    public nonisolated static func filter(_ commands: [StanceSlashCommand], query: String) -> [StanceSlashCommand] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return commands }
        let options: String.CompareOptions = [.caseInsensitive, .diacriticInsensitive]
        let prefixed = commands.filter { $0.name.range(of: trimmed, options: options.union(.anchored)) != nil }
        let contained = commands.filter { command in
            !prefixed.contains(command) && command.name.range(of: trimmed, options: options) != nil
        }
        return prefixed + contained
    }

    /// The command being typed, or `nil` when the draft is not a command.
    ///
    /// The draft must start with a slash and hold no white space: `"/sum"` gives `"sum"`.
    public nonisolated static func query(in text: String) -> String? {
        guard text.hasPrefix("/") else { return nil }
        let query = text.dropFirst()
        return query.contains(where: \.isWhitespace) ? nil : String(query)
    }

    public var body: some View {
        if isPresented {
            let matches = Self.filter(commands, query: query)
            StanceSuggestionPanel(
                label: label ?? stanceString("stance.ai.commands", locale),
                rows: matches.map { StanceSuggestionRow(id: $0.id, title: "/\($0.name)", subtitle: $0.description, icon: $0.icon, trailing: $0.shortcut, group: nil) },
                isLoading: false,
                emptyLabel: emptyLabel ?? stanceString("stance.ai.suggestions.empty", locale),
                onSelect: { id in
                    guard let command = matches.first(where: { $0.id == id }) else { return }
                    StanceHaptics.selection()
                    onSelect(command)
                    isPresented = false
                },
                onDismiss: { isPresented = false }
            )
        }
    }
}

// MARK: Model picker

/// A model the reader can choose in a ``StanceModelPicker``.
public struct StanceModel: Identifiable, Hashable, Sendable {
    /// A stable identifier.
    public let id: String
    /// The name.
    public var name: String
    /// A short supporting line.
    public var description: String?
    /// Short capability words, such as "Fast" or "Vision".
    public var badges: [String]
    /// Whether the model can be chosen.
    public var isDisabled: Bool

    /// Creates a model.
    public init(id: String, name: String, description: String? = nil, badges: [String] = [], isDisabled: Bool = false) {
        self.id = id
        self.name = name
        self.description = description
        self.badges = badges
        self.isDisabled = isDisabled
    }

    /// The description followed by the badges, as one line for the menu.
    public func subtitle(locale: Locale = .current) -> String? {
        let badgeList = badges.isEmpty ? nil : badges.formatted(.list(type: .and, width: .narrow).locale(locale))
        guard let description else { return badgeList }
        return badgeList.map { "\(description) (\($0))" } ?? description
    }
}

/// Chooses the model for the next message, with a short description and capability badges.
///
/// Built on the native `Menu` and `Picker`, so it gets the system menu, its tick and its
/// accessibility for free.
public struct StanceModelPicker: View {
    private let label: String?
    private let models: [StanceModel]
    private let size: StanceButtonSize
    @Binding private var selection: String
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - label: The accessible name. Defaults to a localised "Model".
    ///   - models: The models to choose from.
    ///   - selection: The identifier of the chosen model.
    ///   - size: The size of the trigger.
    public init(_ label: String? = nil, models: [StanceModel], selection: Binding<String>, size: StanceButtonSize = .small) {
        self.label = label
        self.models = models
        _selection = selection
        self.size = size
    }

    public var body: some View {
        let title = label ?? stanceString("stance.ai.model", locale)
        let selected = models.first { $0.id == selection }
        Menu {
            Picker(title, selection: $selection) {
                ForEach(models) { model in
                    VStack {
                        Text(model.name)
                        if let subtitle = model.subtitle(locale: locale) { Text(subtitle) }
                    }
                    .tag(model.id)
                    .selectionDisabled(model.isDisabled)
                }
            }
        } label: {
            HStack(spacing: StanceSpacing.xs) {
                StanceIcon(.sparkle, size: StanceSize.iconSm)
                Text(selected?.name ?? title)
                StanceIcon(.chevronsUpDown, size: StanceSize.iconSm - StanceSpacing.xxs).foregroundStyle(theme.colors.fgMuted)
            }
        }
        .buttonStyle(.stance(.ghost, size: size))
        .accessibilityLabel(title)
        .accessibilityValue(selected?.name ?? "")
        .sensoryFeedback(.selection, trigger: selection)
    }
}

// MARK: Context chips

/// Something the assistant can see for this message: a file, a page or a selection.
public struct StanceContextItem: Identifiable, Hashable, Sendable {
    /// A stable identifier.
    public let id: String
    /// The visible text.
    public var label: String
    /// An icon shown before the text.
    public var icon: StanceIconName?
    /// What the item is, in words, read before the label by VoiceOver. For example "File".
    public var kind: String?

    /// Creates a context item.
    public init(id: String, label: String, icon: StanceIconName? = nil, kind: String? = nil) {
        self.id = id
        self.label = label
        self.icon = icon
        self.kind = kind
    }
}

/// The words used by ``StanceContextChips``. Leave a value `nil` for the localised default.
public struct StanceContextChipsLabels: Sendable {
    /// Replaces the built in text for "list".
    public var list: String?
    /// Replaces the built in text for "add".
    public var add: String?
    /// The accessible name of a remove button, from the item label.
    public var remove: (@Sendable (String) -> String)?

    /// Creates the labels. Every value defaults to the localised built in text.
    public init(list: String? = nil, add: String? = nil, remove: (@Sendable (String) -> String)? = nil) {
        self.list = list
        self.add = add
        self.remove = remove
    }
}

/// Shows what the assistant can see for this message, each item removable.
///
/// Chips wrap onto as many lines as they need. Items past `max` collapse into a count.
public struct StanceContextChips: View {
    private let items: [StanceContextItem]
    private let max: Int?
    private let labels: StanceContextChipsLabels
    private let onRemove: ((StanceContextItem) -> Void)?
    private let onAdd: (() -> Void)?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - items: The context items.
    ///   - max: The most chips to show before the rest collapse into a count.
    ///   - labels: Replacement words for the built in labels.
    ///   - onRemove: Called when an item is removed. Without it, chips have no remove button.
    ///   - onAdd: Adds context. Without it, there is no add button.
    public init(
        _ items: [StanceContextItem],
        max: Int? = nil,
        labels: StanceContextChipsLabels = .init(),
        onRemove: ((StanceContextItem) -> Void)? = nil,
        onAdd: (() -> Void)? = nil
    ) {
        self.items = items
        self.max = max
        self.labels = labels
        self.onRemove = onRemove
        self.onAdd = onAdd
    }

    /// The items to show and how many are left over.
    public nonisolated static func visible(_ items: [StanceContextItem], max: Int?) -> (shown: [StanceContextItem], hidden: Int) {
        guard let max, max >= 0, items.count > max else { return (items, 0) }
        return (Array(items.prefix(max)), items.count - max)
    }

    public var body: some View {
        let (shown, hidden) = Self.visible(items, max: max)
        StanceFlowLayout(spacing: StanceSpacing.sm, lineSpacing: StanceSpacing.xs) {
            ForEach(shown) { item in chip(item) }
            if hidden > 0 {
                Text(verbatim: "+\(hidden.formatted(.number.locale(locale)))")
                    .stanceText(.label)
                    .foregroundStyle(theme.colors.fgMuted)
                    .padding(.horizontal, StanceSpacing.md)
                    .frame(minHeight: StanceSize.controlSm)
                    .background(theme.colors.bgMuted, in: Capsule())
                    .accessibilityLabel(stanceString("stance.more \(hidden)", locale))
            }
            if let onAdd {
                Button(action: onAdd) {
                    HStack(spacing: StanceSpacing.xs) {
                        StanceIcon(.plus, size: StanceSize.iconSm - StanceSpacing.xxs)
                        Text(labels.add ?? stanceString("stance.ai.context.add", locale)).stanceText(.label)
                    }
                    .padding(.horizontal, StanceSpacing.md)
                    .frame(minHeight: StanceSize.controlSm)
                    .foregroundStyle(theme.colors.fgDefault)
                    .overlay { Capsule().strokeBorder(theme.colors.borderControl, style: StrokeStyle(lineWidth: theme.controlBorderWidth, dash: [StanceSpacing.xs, StanceSpacing.xs])) }
                    .frame(minHeight: StanceSize.touchTarget)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(labels.list ?? stanceString("stance.ai.context", locale))
    }

    private func chip(_ item: StanceContextItem) -> some View {
        HStack(spacing: StanceSpacing.xs) {
            HStack(spacing: StanceSpacing.xs) {
                if let icon = item.icon { StanceIcon(icon, size: StanceSize.iconSm - StanceSpacing.xxs).foregroundStyle(theme.colors.fgMuted) }
                Text(item.label).stanceText(.label).lineLimit(1).truncationMode(.middle)
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel([item.kind, item.label].compactMap { $0 }.formatted(.list(type: .and, width: .narrow).locale(locale)))
            if let onRemove {
                Button { onRemove(item) } label: {
                    StanceIcon(.x, size: StanceSize.iconSm - StanceSpacing.xxs)
                        .frame(width: StanceSize.controlXs, height: StanceSize.controlXs)
                        .contentShape(Rectangle().inset(by: -(StanceSize.touchTarget - StanceSize.controlXs) / 2))
                }
                .buttonStyle(.plain)
                .accessibilityLabel(labels.remove?(item.label) ?? stanceString("stance.remove \(item.label)", locale))
            }
        }
        .padding(.leading, StanceSpacing.md)
        .padding(.trailing, onRemove == nil ? StanceSpacing.md : StanceSpacing.xs)
        .frame(minHeight: StanceSize.controlSm)
        .background(theme.colors.bgMuted, in: Capsule())
        .overlay { Capsule().strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
    }
}

// MARK: Voice input

/// The state of a ``StanceVoiceInputButton``.
public enum StanceVoiceInputState: String, CaseIterable, Sendable {
    case idle, listening, processing, unavailable

    /// The state in words, localised for `locale`.
    public func description(locale: Locale = .current) -> String {
        switch self {
        case .idle: stanceString("stance.ai.voice.idle", locale)
        case .listening: stanceString("stance.ai.voice.listening", locale)
        case .processing: stanceString("stance.ai.voice.processing", locale)
        case .unavailable: stanceString("stance.ai.voice.unavailable", locale)
        }
    }
}

/// The words used by ``StanceVoiceInputButton``. Leave a value `nil` for the localised default.
public struct StanceVoiceInputLabels: Sendable {
    /// Replaces the built in text for "button".
    public var button: String?
    /// Replaces the built in text for "idle".
    public var idle: String?
    /// Replaces the built in text for "listening".
    public var listening: String?
    /// Replaces the built in text for "processing".
    public var processing: String?
    /// Replaces the built in text for "unavailable".
    public var unavailable: String?

    /// Creates the labels. Every value defaults to the localised built in text.
    public init(button: String? = nil, idle: String? = nil, listening: String? = nil, processing: String? = nil, unavailable: String? = nil) {
        self.button = button
        self.idle = idle
        self.listening = listening
        self.processing = processing
        self.unavailable = unavailable
    }
}

/// A microphone button with idle, listening and processing states and a level indicator.
///
/// The button does not record. The app owns speech recognition and passes the state and the
/// input level in. State changes are announced to VoiceOver.
public struct StanceVoiceInputButton: View {
    private let state: StanceVoiceInputState
    private let level: Double
    private let labels: StanceVoiceInputLabels
    private let action: () -> Void
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// - Parameters:
    ///   - state: What the microphone is doing.
    ///   - level: The input level from 0 to 1, drawn as a ring while listening.
    ///   - labels: Replacement words for the built in labels.
    ///   - action: Starts or stops listening.
    public init(state: StanceVoiceInputState = .idle, level: Double = 0, labels: StanceVoiceInputLabels = .init(), action: @escaping () -> Void) {
        self.state = state
        self.level = Self.clampedLevel(level)
        self.labels = labels
        self.action = action
    }

    /// A level kept between 0 and 1. Values that are not numbers count as silence.
    public nonisolated static func clampedLevel(_ level: Double) -> Double {
        level.isNaN ? 0 : min(max(level, 0), 1)
    }

    private func description(_ state: StanceVoiceInputState) -> String {
        switch state {
        case .idle: labels.idle ?? state.description(locale: locale)
        case .listening: labels.listening ?? state.description(locale: locale)
        case .processing: labels.processing ?? state.description(locale: locale)
        case .unavailable: labels.unavailable ?? state.description(locale: locale)
        }
    }

    public var body: some View {
        // The ring grows from the control to the edge of the touch target with the input level.
        let reach = StanceSize.touchTarget / StanceSize.controlMd - 1
        Button {
            StanceHaptics.impact()
            action()
        } label: {
            ZStack {
                if state == .listening {
                    Circle()
                        .strokeBorder(theme.colors.borderStrong, lineWidth: theme.focusWidth)
                        .frame(width: StanceSize.controlMd, height: StanceSize.controlMd)
                        .scaleEffect(1 + (reduceMotion ? 1 : level) * reach)
                        .animation(StanceMotion.fast.animation(reduceMotion: reduceMotion), value: level)
                }
                if state == .processing {
                    ProgressView().controlSize(.small).tint(theme.colors.fgMuted)
                        .frame(minWidth: StanceSize.touchTarget, minHeight: StanceSize.touchTarget)
                } else {
                    StanceCircleSymbol(
                        symbol: state == .unavailable ? "mic.slash" : state == .listening ? "mic.fill" : "mic",
                        diameter: StanceSize.controlMd - StanceSpacing.sm,
                        filled: state == .listening
                    )
                }
            }
            .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(state == .unavailable || state == .processing)
        .accessibilityLabel(labels.button ?? stanceString("stance.ai.voice", locale))
        .accessibilityValue(description(state))
        .accessibilityAddTraits(state == .listening ? [.isToggle, .isSelected] : .isToggle)
        .onChange(of: state) { _, new in StanceAnnouncer.announce(description(new)) }
    }
}

// MARK: Stop button

/// How a ``StanceStopButton`` is drawn.
public enum StanceStopButtonVariant: String, CaseIterable, Sendable {
    /// A filled circle with the stop glyph.
    case icon
    /// An outline button with the glyph and the word.
    case labelled
}

/// Stops a response that is being generated.
public struct StanceStopButton: View {
    private let label: String?
    private let size: StanceButtonSize
    private let variant: StanceStopButtonVariant
    private let action: () -> Void
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - label: The visible or accessible name. Defaults to a localised "Stop".
    ///   - size: The size of the control.
    ///   - variant: An icon only circle, or an outline button with the word.
    ///   - action: Stops the response.
    public init(_ label: String? = nil, size: StanceButtonSize = .medium, variant: StanceStopButtonVariant = .icon, action: @escaping () -> Void) {
        self.label = label
        self.size = size
        self.variant = variant
        self.action = action
    }

    private var diameter: CGFloat {
        switch size {
        case .small: StanceSize.controlSm
        case .medium: StanceSize.controlMd
        case .large: StanceSize.controlLg
        }
    }

    public var body: some View {
        let title = label ?? stanceString("stance.ai.stop", locale)
        let stop = {
            StanceHaptics.impact()
            action()
        }
        switch variant {
        case .icon:
            Button(action: stop) { StanceCircleSymbol(symbol: "stop.fill", diameter: diameter) }
                .buttonStyle(.plain)
                .accessibilityLabel(title)
        case .labelled:
            Button(action: stop) {
                HStack(spacing: StanceSpacing.sm) {
                    StanceSymbol("stop.fill", size: StanceSize.iconSm - StanceSpacing.xs)
                    Text(title)
                }
            }
            .buttonStyle(.stance(.outline, size: size))
        }
    }
}

// MARK: Token budget meter

/// How close a budget is to its limit.
public enum StanceTokenBudgetLevel: String, CaseIterable, Sendable {
    case normal, warning, exceeded
}

/// How a ``StanceTokenBudgetMeter`` is drawn.
public enum StanceTokenBudgetVariant: String, CaseIterable, Sendable {
    case ring, bar, text
}

/// A compact meter of how much of the context or message limit is used, with a warning near the limit.
///
/// The warning is a triangle icon and words, never colour alone, and crossing the threshold is
/// announced once.
public struct StanceTokenBudgetMeter: View {
    private let used: Int
    private let limit: Int
    private let warnAt: Double
    private let variant: StanceTokenBudgetVariant
    private let label: String?
    private let format: ((Int, Int) -> String)?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - used: The amount used.
    ///   - limit: The limit.
    ///   - warnAt: The fraction of the limit where the warning starts.
    ///   - variant: A ring, a bar or text only.
    ///   - label: The accessible name and the bar's caption. Defaults to a localised "Context used".
    ///   - format: Builds the value text from `used` and `limit`. Defaults to compact numbers.
    public init(
        used: Int,
        limit: Int,
        warnAt: Double = 0.8,
        variant: StanceTokenBudgetVariant = .ring,
        label: String? = nil,
        format: ((Int, Int) -> String)? = nil
    ) {
        self.used = max(0, used)
        self.limit = max(0, limit)
        self.warnAt = warnAt
        self.variant = variant
        self.label = label
        self.format = format
    }

    /// The fraction of the limit used, from 0 to 1. A limit of zero counts as empty.
    public nonisolated static func fraction(used: Int, limit: Int) -> Double {
        guard limit > 0 else { return 0 }
        return min(max(Double(used) / Double(limit), 0), 1)
    }

    /// Normal below `warnAt`, a warning from there, and exceeded at or past the limit.
    public nonisolated static func level(used: Int, limit: Int, warnAt: Double = 0.8) -> StanceTokenBudgetLevel {
        guard limit > 0 else { return .normal }
        if used >= limit { return .exceeded }
        return Double(used) / Double(limit) >= warnAt ? .warning : .normal
    }

    /// The value in words, for example "12K of 16K".
    public nonisolated static func valueText(used: Int, limit: Int, locale: Locale = .current) -> String {
        let style = IntegerFormatStyle<Int>.number.notation(.compactName).locale(locale)
        return stanceString("stance.ai.tokens.value \(used.formatted(style)) \(limit.formatted(style))", locale)
    }

    private var level: StanceTokenBudgetLevel { Self.level(used: used, limit: limit, warnAt: warnAt) }
    private var valueText: String { format?(used, limit) ?? Self.valueText(used: used, limit: limit, locale: locale) }

    private var warningText: String? {
        switch level {
        case .normal: nil
        case .warning: stanceString("stance.ai.tokens.warning", locale)
        case .exceeded: stanceString("stance.ai.tokens.exceeded", locale)
        }
    }

    private var tint: Color {
        switch level {
        case .normal: theme.colors.accentBg
        case .warning: theme.colors.warningFg
        case .exceeded: theme.colors.dangerFg
        }
    }

    public var body: some View {
        let title = label ?? stanceString("stance.ai.tokens", locale)
        let fraction = Self.fraction(used: used, limit: limit)
        Group {
            switch variant {
            case .ring:
                HStack(spacing: StanceSpacing.sm) {
                    ZStack {
                        Circle().stroke(theme.colors.bgEmphasis, lineWidth: StanceSpacing.xxs + theme.borderWidth)
                        Circle().trim(from: 0, to: fraction)
                            .stroke(tint, style: StrokeStyle(lineWidth: StanceSpacing.xxs + theme.borderWidth, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                            .stanceAnimation(.normal, value: fraction)
                    }
                    .frame(width: StanceSize.iconMd, height: StanceSize.iconMd)
                    if let warningText { warning(warningText) }
                }
            case .bar:
                VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                    HStack(alignment: .firstTextBaseline) {
                        Text(title).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
                        Spacer(minLength: StanceSpacing.sm)
                        Text(valueText).stanceText(.caption).monospacedDigit().foregroundStyle(theme.colors.fgMuted)
                            .contentTransition(.numericText(value: Double(used)))
                            .stanceAnimation(.normal, value: used)
                    }
                    ProgressView(value: fraction).tint(tint)
                    if let warningText { warning(warningText) }
                }
            case .text:
                HStack(spacing: StanceSpacing.sm) {
                    Text(valueText).stanceText(.caption).monospacedDigit().foregroundStyle(theme.colors.fgMuted)
                        .contentTransition(.numericText(value: Double(used)))
                        .stanceAnimation(.normal, value: used)
                    if let warningText { warning(warningText) }
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(title)
        .accessibilityValue([valueText, warningText].compactMap { $0 }.formatted(.list(type: .and, width: .narrow).locale(locale)))
        .onChange(of: level) { old, new in
            // Announced once, when the threshold is crossed upwards.
            guard new != .normal, new != old, old != .exceeded, let warningText else { return }
            StanceAnnouncer.announce(warningText, urgent: new == .exceeded)
        }
    }

    private func warning(_ text: String) -> some View {
        HStack(spacing: StanceSpacing.xs) {
            StanceIcon(.alertTriangle, size: StanceSize.iconSm - StanceSpacing.xxs)
            Text(text).stanceText(.caption)
        }
        .foregroundStyle(tint)
    }
}
