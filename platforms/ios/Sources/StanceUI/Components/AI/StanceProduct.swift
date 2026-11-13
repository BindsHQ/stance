import SwiftUI

// AI inside a product, wave two: inline suggestions, smart fields, the rewrite menu, suggestion
// chips and the ask bar. These are quiet: a suggestion never moves focus, never blocks typing
// and is never part of a value until the person accepts it.

/// A quiet icon button with a 44pt target, used by the product components.
struct StanceProductIconButton: View {
    let icon: StanceIconName
    let label: String
    let action: () -> Void
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        Button(action: action) {
            StanceIcon(icon, size: StanceSize.iconSm)
                .foregroundStyle(theme.colors.fgMuted)
                .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement()
        .accessibilityAddTraits(.isButton)
        .accessibilityLabel(label)
    }
}

// MARK: Inline suggestion

/// The rules of a ``StanceInlineSuggestion``, usable without a view.
///
/// A suggestion is the whole text the field would hold if it were accepted. The ghost text is
/// the part that comes after what has been typed. A suggestion that does not start with the
/// typed text no longer applies and shows nothing.
public enum StanceInlineSuggestionLogic {
    /// The ghost text to draw after the caret, or `nil` when the suggestion does not apply.
    ///
    /// `suggestion` is the remainder: the text that would follow `anchor`, the value the field
    /// had when the suggestion arrived (as on the web, where the suggestion continues the value).
    /// While the person types characters that match it, the ghost shrinks; once they type
    /// something else, it is hidden.
    public nonisolated static func ghost(value: String, suggestion: String?, anchor: String) -> String? {
        guard let suggestion, !suggestion.isEmpty else { return nil }
        let full = anchor + suggestion
        guard full.count > value.count, full.hasPrefix(value) else { return nil }
        return String(full.dropFirst(value.count))
    }

    /// The ghost text when the suggestion continues the current value: the suggestion itself.
    public nonisolated static func ghost(value: String, suggestion: String?) -> String? {
        ghost(value: value, suggestion: suggestion, anchor: value)
    }

    /// The value after accepting the whole suggestion. The value is unchanged when it does not apply.
    public nonisolated static func accepting(value: String, suggestion: String?, anchor: String) -> String {
        guard let ghost = ghost(value: value, suggestion: suggestion, anchor: anchor) else { return value }
        return value + ghost
    }

    /// The value after accepting the whole suggestion that continues the current value.
    public nonisolated static func accepting(value: String, suggestion: String?) -> String {
        accepting(value: value, suggestion: suggestion, anchor: value)
    }

    /// The value after accepting the next word of the suggestion, with the space before it.
    public nonisolated static func acceptingWord(value: String, suggestion: String?, anchor: String) -> String {
        guard let ghost = ghost(value: value, suggestion: suggestion, anchor: anchor) else { return value }
        var end = ghost.startIndex
        while end < ghost.endIndex, ghost[end].isWhitespace { end = ghost.index(after: end) }
        while end < ghost.endIndex, !ghost[end].isWhitespace { end = ghost.index(after: end) }
        return value + ghost[..<end]
    }

    /// The value after accepting the next word of a suggestion that continues the current value.
    public nonisolated static func acceptingWord(value: String, suggestion: String?) -> String {
        acceptingWord(value: value, suggestion: suggestion, anchor: value)
    }

    /// The arrow key that accepts one word with Command or Control: the one pointing along the
    /// reading direction.
    public nonisolated static func acceptWordArrow(isRightToLeft: Bool) -> String {
        isRightToLeft ? "left" : "right"
    }
}

/// Words a ``StanceInlineSuggestion`` uses. Leave a value out to keep the localised default.
public struct StanceInlineSuggestionLabels: Sendable {
    public var accept: String?
    public var acceptWord: String?
    public var dismiss: String?
    public var announcement: (@Sendable (String) -> String)?

    /// - Parameters:
    ///   - accept: The accept button and VoiceOver action. Defaults to a localised "Accept suggestion".
    ///   - acceptWord: The accept word button. Defaults to a localised "Accept next word".
    ///   - dismiss: The dismiss action. Defaults to a localised "Dismiss suggestion".
    ///   - announcement: What VoiceOver hears for a new suggestion, given the ghost text.
    public init(accept: String? = nil, acceptWord: String? = nil, dismiss: String? = nil, announcement: (@Sendable (String) -> String)? = nil) {
        self.accept = accept
        self.acceptWord = acceptWord
        self.dismiss = dismiss
        self.announcement = announcement
    }
}

/// A text field with a ghost text completion after the caret.
///
/// Built on the system `TextField`. The suggestion is drawn behind the field in a muted ink
/// colour and is never part of the value until accepted. Tab accepts and Escape dismisses on a
/// hardware keyboard; on the software keyboard an Accept button sits in the keyboard accessory.
/// Typing is never interrupted, and VoiceOver hears a new suggestion once, with how to accept it.
///
/// `suggestion` is the remainder after the value, as on the web: the text that would follow
/// what is typed. Command or Control with the arrow along the reading direction accepts one
/// word. See ``StanceInlineSuggestionLogic``.
public struct StanceInlineSuggestion: View {
    private let label: String
    private let suggestion: String?
    private let placeholder: String?
    private let helper: String?
    private let axis: Axis
    private let isLoading: Bool
    private let labels: StanceInlineSuggestionLabels
    private let onAccept: ((String) -> Void)?
    private let onAcceptWord: ((String) -> Void)?
    private let onDismiss: (() -> Void)?
    @Binding private var text: String
    @State private var dismissed: String?
    @State private var anchor: String
    @FocusState private var focused: Bool
    @Environment(\.layoutDirection) private var layoutDirection
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - label: The visible label and accessible name.
    ///   - text: The field value. It changes only when the person types or accepts.
    ///   - suggestion: The text that would follow the current value, or `nil` for none.
    ///   - placeholder: Shown while the field is empty and there is no suggestion.
    ///   - helper: Optional text under the field.
    ///   - axis: `.vertical` lets the field grow with its text.
    ///   - isLoading: Shows a small spinner while a suggestion is being fetched.
    ///   - labels: Replacements for the built in words.
    ///   - onAccept: Called with the new value after the whole suggestion is accepted.
    ///   - onAcceptWord: Called with the new value after one word is accepted. Passing it adds the
    ///     accept word button to the keyboard accessory.
    ///   - onDismiss: Called when the suggestion is dismissed.
    @_disfavoredOverload
    public init(
        _ label: String,
        text: Binding<String>,
        suggestion: String?,
        placeholder: String? = nil,
        helper: String? = nil,
        axis: Axis = .horizontal,
        isLoading: Bool = false,
        labels: StanceInlineSuggestionLabels = .init(),
        onAccept: ((String) -> Void)? = nil,
        onAcceptWord: ((String) -> Void)? = nil,
        onDismiss: (() -> Void)? = nil
    ) {
        self.label = label
        _text = text
        _anchor = State(initialValue: text.wrappedValue)
        self.suggestion = suggestion
        self.placeholder = placeholder
        self.helper = helper
        self.axis = axis
        self.isLoading = isLoading
        self.labels = labels
        self.onAccept = onAccept
        self.onAcceptWord = onAcceptWord
        self.onDismiss = onDismiss
    }

    private var ghost: String? {
        guard dismissed != suggestion else { return nil }
        return StanceInlineSuggestionLogic.ghost(value: text, suggestion: suggestion, anchor: anchor)
    }

    private var acceptLabel: String { labels.accept ?? stanceString("stance.ai.inline.accept", locale) }
    private var acceptWordLabel: String { labels.acceptWord ?? stanceString("stance.ai.inline.acceptWord", locale) }
    private var dismissLabel: String { labels.dismiss ?? stanceString("stance.ai.inline.dismiss", locale) }

    public var body: some View {
        let ghost = ghost
        StanceFormField(label, helper: helper) {
            HStack(spacing: StanceSpacing.sm) {
                ZStack(alignment: .topLeading) {
                    if let ghost {
                        Text(ghostText(ghost))
                            .lineLimit(axis == .horizontal ? 1 : nil)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .accessibilityHidden(true)
                            .allowsHitTesting(false)
                    }
                    TextField(ghost == nil ? placeholder ?? "" : "", text: $text, axis: axis)
                        .focused($focused)
                        .onKeyPress(.tab) {
                            guard self.ghost != nil else { return .ignored }
                            accept()
                            return .handled
                        }
                        .onKeyPress(.escape) {
                            guard self.ghost != nil else { return .ignored }
                            dismiss()
                            return .handled
                        }
                        .onKeyPress(keys: [.leftArrow, .rightArrow], phases: .down) { press in
                            // Command or Control with the arrow along the reading direction accepts one word.
                            let forward: KeyEquivalent = layoutDirection == .rightToLeft ? .leftArrow : .rightArrow
                            guard self.ghost != nil, onAcceptWord != nil, press.key == forward,
                                  !press.modifiers.intersection([.command, .control]).isEmpty else { return .ignored }
                            acceptWord()
                            return .handled
                        }
                        .accessibilityActions {
                            if ghost != nil {
                                Button(acceptLabel, action: accept)
                                if onAcceptWord != nil { Button(acceptWordLabel, action: acceptWord) }
                                Button(dismissLabel, action: dismiss)
                            }
                        }
                }
                .padding(.vertical, axis == .vertical ? StanceSpacing.s2_5 : StanceSpacing.none)
                if isLoading {
                    ProgressView().controlSize(.small).tint(theme.colors.fgMuted).accessibilityHidden(true)
                }
            }
            .modifier(StanceFieldChrome(isFocused: focused, isInvalid: false))
            .contentShape(Rectangle())
            .onTapGesture { focused = true }
        }
        #if os(iOS)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                if focused, ghost != nil {
                    Button(dismissLabel, action: dismiss)
                    Spacer()
                    if onAcceptWord != nil { Button(acceptWordLabel, action: acceptWord) }
                    Button(acceptLabel, action: accept).fontWeight(.semibold)
                }
            }
        }
        #endif
        .onChange(of: suggestion) { _, _ in
            // A new suggestion is announced once, politely. Typing through it stays silent.
            dismissed = nil
            anchor = text
            guard let ghost = StanceInlineSuggestionLogic.ghost(value: text, suggestion: suggestion) else { return }
            StanceAnnouncer.announce(labels.announcement?(ghost) ?? stanceString("stance.ai.inline.announcement \(ghost)", locale))
        }
    }

    /// The typed text, invisible, followed by the ghost: the ghost starts where the caret is.
    private func ghostText(_ ghost: String) -> AttributedString {
        var typed = AttributedString(text)
        typed.foregroundColor = .clear
        var rest = AttributedString(ghost)
        rest.foregroundColor = theme.colors.fgSubtle
        return typed + rest
    }

    private func accept() {
        guard ghost != nil else { return }
        text = StanceInlineSuggestionLogic.accepting(value: text, suggestion: suggestion, anchor: anchor)
        StanceHaptics.selection()
        onAccept?(text)
    }

    private func acceptWord() {
        guard ghost != nil else { return }
        text = StanceInlineSuggestionLogic.acceptingWord(value: text, suggestion: suggestion, anchor: anchor)
        StanceHaptics.selection()
        onAcceptWord?(text)
    }

    private func dismiss() {
        guard ghost != nil else { return }
        dismissed = suggestion
        onDismiss?()
    }
}

// MARK: Smart field

/// Where a ``StanceSmartField`` is in the life of a suggestion.
public enum StanceSmartFieldStatus: String, CaseIterable, Sendable {
    /// The value is the person's own.
    case idle
    /// A suggestion is being worked out.
    case suggesting
    /// A suggestion is offered and not yet used.
    case suggested
    /// The value was filled in from a suggestion and has not been edited since.
    case accepted
}

/// The state of a field AI can fill in: its value, the suggestion and what undo restores.
///
/// Keep one in your model and call its methods from the ``StanceSmartField`` callbacks. Editing
/// the value by hand clears the AI mark; undo puts back the value from before the suggestion.
public struct StanceSmartFieldState<Value: Equatable>: Equatable {
    /// The current value of the field.
    public private(set) var value: Value
    /// The suggestion on offer, if any.
    public private(set) var suggestedValue: Value?
    /// The value undo restores, set when a suggestion is accepted.
    public private(set) var previousValue: Value?
    /// Where the field is in the life of a suggestion.
    public private(set) var status: StanceSmartFieldStatus = .idle

    /// Creates a state with the person's own value.
    public init(value: Value) { self.value = value }

    /// Whether the value came from AI and should carry the mark.
    public var isAIFilled: Bool { status == .accepted }

    /// Whether there is an accepted suggestion to undo.
    public var canUndo: Bool { status == .accepted && previousValue != nil }

    /// A suggestion was requested.
    public mutating func beginSuggesting() {
        suggestedValue = nil
        status = .suggesting
    }

    /// A suggestion arrived. The value does not change until it is accepted.
    public mutating func suggest(_ suggestion: Value) {
        suggestedValue = suggestion
        status = .suggested
    }

    /// Uses the suggestion as the value. Returns `false` when there is nothing to accept.
    @discardableResult
    public mutating func accept() -> Bool {
        guard status == .suggested, let suggestedValue else { return false }
        previousValue = value
        value = suggestedValue
        status = .accepted
        return true
    }

    /// The person changed the value: the AI mark and the pending suggestion are cleared.
    public mutating func edit(_ newValue: Value) {
        guard newValue != value else { return }
        value = newValue
        suggestedValue = nil
        previousValue = nil
        status = .idle
    }

    /// Restores the value from before the suggestion. Returns `false` when there is nothing to undo.
    @discardableResult
    public mutating func undo() -> Bool {
        guard canUndo, let previousValue else { return false }
        value = previousValue
        self.previousValue = nil
        suggestedValue = nil
        status = .idle
        return true
    }

    /// Withdraws a suggestion that was offered or in progress, without changing the value.
    public mutating func dismiss() {
        guard status == .suggesting || status == .suggested else { return }
        suggestedValue = nil
        status = .idle
    }
}

extension StanceSmartFieldState: Sendable where Value: Sendable {}

/// Words a ``StanceSmartField`` uses. Leave a value out to keep the localised default.
public struct StanceSmartFieldLabels: Sendable {
    public var suggesting: String?
    public var suggestion: (@Sendable (String) -> String)?
    public var source: (@Sendable (String) -> String)?
    public var accepted: String?
    public var accept: String?
    public var undo: String?
    public var regenerate: String?
    public var applied: String?
    public var undone: String?

    /// - Parameters:
    ///   - suggesting: Shown while a suggestion is worked out. Defaults to a localised "Suggesting a value".
    ///   - suggestion: The offered value in words. Defaults to a localised "Suggested: value".
    ///   - source: Where the suggestion came from. Defaults to a localised "From source".
    ///   - accepted: The mark on a value filled in from a suggestion. Defaults to a localised "Filled in by AI".
    ///   - accept: Defaults to a localised "Use suggestion".
    ///   - undo: Defaults to a localised "Undo".
    ///   - regenerate: Defaults to a localised "Suggest again".
    ///   - applied: Announced after accepting. Defaults to a localised "Suggestion applied".
    ///   - undone: Announced after undo. Defaults to a localised "Suggestion undone".
    public init(
        suggesting: String? = nil,
        suggestion: (@Sendable (String) -> String)? = nil,
        source: (@Sendable (String) -> String)? = nil,
        accepted: String? = nil,
        accept: String? = nil,
        undo: String? = nil,
        regenerate: String? = nil,
        applied: String? = nil,
        undone: String? = nil
    ) {
        self.suggesting = suggesting
        self.suggestion = suggestion
        self.source = source
        self.accepted = accepted
        self.accept = accept
        self.undo = undo
        self.regenerate = regenerate
        self.applied = applied
        self.undone = undone
    }
}

/// A form field AI can fill in. It says in words that a value was suggested, where it came
/// from, and lets people use it, undo it or ask again.
///
/// It wraps any control you pass as content, usually a `TextField` or a picker, and never
/// changes the value itself: the app applies the suggestion in `onAccept` and restores the old
/// value in `onUndo`. ``StanceSmartFieldState`` holds those rules. Clear the mark when the
/// person edits the value by moving `status` back to `.idle`.
public struct StanceSmartField<Content: View>: View {
    private let label: String
    private let status: StanceSmartFieldStatus
    private let suggestedValue: String?
    private let suggestionSource: String?
    private let helper: String?
    private let labels: StanceSmartFieldLabels
    private let onAccept: (() -> Void)?
    private let onUndo: (() -> Void)?
    private let onRegenerate: (() -> Void)?
    private let content: Content
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - label: The visible label and the accessible name of the control.
    ///   - status: Where the field is in the life of a suggestion.
    ///   - suggestedValue: The offered value, in words, shown while `status` is `.suggested`.
    ///   - suggestionSource: Where the suggestion came from, such as a document name.
    ///   - helper: Optional text under the control.
    ///   - labels: Replacements for the built in words.
    ///   - onAccept: Uses the suggestion. Shown while a suggestion is offered.
    ///   - onUndo: Restores the earlier value. Shown on a value that was filled in.
    ///   - onRegenerate: Asks for another suggestion.
    ///   - content: The control.
    @_disfavoredOverload
    public init(
        _ label: String,
        status: StanceSmartFieldStatus = .idle,
        suggestedValue: String? = nil,
        suggestionSource: String? = nil,
        helper: String? = nil,
        labels: StanceSmartFieldLabels = .init(),
        onAccept: (() -> Void)? = nil,
        onUndo: (() -> Void)? = nil,
        onRegenerate: (() -> Void)? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.label = label
        self.status = status
        self.suggestedValue = suggestedValue
        self.suggestionSource = suggestionSource
        self.helper = helper
        self.labels = labels
        self.onAccept = onAccept
        self.onUndo = onUndo
        self.onRegenerate = onRegenerate
        self.content = content()
    }

    private var suggestionText: String? {
        suggestedValue.map { labels.suggestion?($0) ?? stanceString("stance.ai.smartField.suggestion \($0)", locale) }
    }

    private var sourceText: String? {
        suggestionSource.map { labels.source?($0) ?? stanceString("stance.ai.smartField.source \($0)", locale) }
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.s1_5) {
            StanceFormField(label, helper: helper) { content }
            switch status {
            case .idle:
                EmptyView()
            case .suggesting:
                mark { StanceShimmerText(labels.suggesting ?? stanceString("stance.ai.smartField.suggesting", locale)) }
            case .suggested:
                mark {
                    VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                        if let suggestionText { Text(suggestionText).stanceText(.label).foregroundStyle(theme.colors.fgDefault) }
                        if let sourceText { Text(sourceText).stanceText(.caption).foregroundStyle(theme.colors.fgMuted) }
                    }
                    .accessibilityElement(children: .combine)
                }
                actions
            case .accepted:
                mark {
                    VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                        Text(labels.accepted ?? stanceString("stance.ai.smartField.accepted", locale)).stanceText(.label).foregroundStyle(theme.colors.fgMuted)
                        if let sourceText { Text(sourceText).stanceText(.caption).foregroundStyle(theme.colors.fgMuted) }
                    }
                    .accessibilityElement(children: .combine)
                }
                actions
            }
        }
        .onChange(of: status) { _, new in
            // The suggested state is announced once, in words.
            if new == .suggested, let suggestionText {
                StanceAnnouncer.announce([suggestionText, sourceText].compactMap { $0 }.joined(separator: ". "))
            } else if new == .accepted {
                StanceAnnouncer.announce(labels.applied ?? stanceString("stance.ai.smartField.applied", locale))
            }
        }
    }

    private func mark<Words: View>(@ViewBuilder words: () -> Words) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.xs) {
            StanceIcon(.sparkle, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted).accessibilityHidden(true)
            words()
        }
    }

    @ViewBuilder private var actions: some View {
        let showsAccept = status == .suggested && onAccept != nil
        let showsUndo = status == .accepted && onUndo != nil
        if showsAccept || showsUndo || onRegenerate != nil {
            StanceFlowLayout(spacing: StanceSpacing.sm, lineSpacing: StanceSpacing.none) {
                if showsAccept, let onAccept {
                    StanceButton(labels.accept ?? stanceString("stance.ai.smartField.accept", locale), variant: .secondary, size: .small, leadingIcon: .check) {
                        StanceHaptics.success()
                        onAccept()
                    }
                }
                if showsUndo, let onUndo {
                    StanceButton(labels.undo ?? stanceString("stance.undo", locale), variant: .outline, size: .small) {
                        StanceHaptics.selection()
                        onUndo()
                        StanceAnnouncer.announce(labels.undone ?? stanceString("stance.ai.smartField.undone", locale))
                    }
                }
                if let onRegenerate {
                    StanceButton(labels.regenerate ?? stanceString("stance.ai.smartField.regenerate", locale), variant: .ghost, size: .small, leadingIcon: .refresh, action: onRegenerate)
                }
            }
        }
    }
}

// MARK: Rewrite menu

/// One way to change selected text in a ``StanceRewriteMenu``. An action with children opens a submenu.
public struct StanceRewriteAction: Identifiable, Hashable, Sendable {
    /// A stable identifier, unique in the menu.
    public let id: String
    /// The menu item title.
    public let label: String
    /// An optional SF Symbol. System menus draw symbols, not custom icon views.
    public let systemImage: String?
    /// Choices in a submenu, such as tones or languages. Empty for a plain action.
    public let children: [StanceRewriteAction]

    /// Creates an action. Pass `children` for a submenu.
    public init(id: String, label: String, systemImage: String? = nil, children: [StanceRewriteAction] = []) {
        self.id = id
        self.label = label
        self.systemImage = systemImage
        self.children = children
    }

    /// The usual set: improve, shorten, lengthen and a tone submenu, localised for `locale`.
    public static func standard(locale: Locale = .current) -> [StanceRewriteAction] {
        [
            StanceRewriteAction(id: "improve", label: stanceString("stance.ai.rewrite.improve", locale), systemImage: "wand.and.stars"),
            StanceRewriteAction(id: "shorten", label: stanceString("stance.ai.rewrite.shorten", locale), systemImage: "arrow.down.right.and.arrow.up.left"),
            StanceRewriteAction(id: "lengthen", label: stanceString("stance.ai.rewrite.lengthen", locale), systemImage: "arrow.up.left.and.arrow.down.right"),
            StanceRewriteAction(id: "tone", label: stanceString("stance.ai.rewrite.tone", locale), systemImage: "theatermasks", children: [
                StanceRewriteAction(id: "tone.professional", label: stanceString("stance.ai.rewrite.tone.professional", locale)),
                StanceRewriteAction(id: "tone.friendly", label: stanceString("stance.ai.rewrite.tone.friendly", locale)),
                StanceRewriteAction(id: "tone.direct", label: stanceString("stance.ai.rewrite.tone.direct", locale)),
            ]),
        ]
    }

    /// Every action that can be chosen, in menu order: submenus contribute their choices, not themselves.
    public static func flattened(_ actions: [StanceRewriteAction]) -> [StanceRewriteAction] {
        actions.flatMap { $0.children.isEmpty ? [$0] : flattened($0.children) }
    }

    /// The action with `id`, at any depth.
    public static func find(_ id: String, in actions: [StanceRewriteAction]) -> StanceRewriteAction? {
        for action in actions {
            if action.id == id { return action }
            if let found = find(id, in: action.children) { return found }
        }
        return nil
    }

    /// The labels from the top of the menu down to the action with `id`, for example
    /// `["Change tone", "Friendly"]`. Empty when there is no such action.
    public static func path(to id: String, in actions: [StanceRewriteAction]) -> [String] {
        for action in actions {
            if action.id == id { return [action.label] }
            let rest = path(to: id, in: action.children)
            if !rest.isEmpty { return [action.label] + rest }
        }
        return []
    }
}

/// Words a ``StanceRewriteMenu`` uses. Leave a value out to keep the localised default.
public struct StanceRewriteMenuLabels: Sendable {
    public var custom: String?
    public var customPlaceholder: String?
    public var customSubmit: String?
    public var working: String?
    public var preview: String?
    public var replace: String?
    public var discard: String?
    public var replaced: String?
    public var discarded: String?

    /// - Parameters:
    ///   - custom: The custom instruction item. Defaults to a localised "Custom instruction".
    ///   - customPlaceholder: The instruction field. Defaults to a localised "Describe the change".
    ///   - customSubmit: Sends the instruction. Defaults to a localised "Apply instruction".
    ///   - working: Shown while the rewrite is generated. Defaults to a localised "Rewriting".
    ///   - preview: The name of the preview region. Defaults to a localised "Suggested rewrite".
    ///   - replace: Defaults to a localised "Replace".
    ///   - discard: Defaults to a localised "Discard".
    ///   - replaced: Announced after replacing. Defaults to a localised "Text replaced".
    ///   - discarded: Announced after discarding. Defaults to a localised "Suggestion discarded".
    public init(
        custom: String? = nil,
        customPlaceholder: String? = nil,
        customSubmit: String? = nil,
        working: String? = nil,
        preview: String? = nil,
        replace: String? = nil,
        discard: String? = nil,
        replaced: String? = nil,
        discarded: String? = nil
    ) {
        self.custom = custom
        self.customPlaceholder = customPlaceholder
        self.customSubmit = customSubmit
        self.working = working
        self.preview = preview
        self.replace = replace
        self.discard = discard
        self.replaced = replaced
        self.discarded = discarded
    }
}

/// The menu items of a rewrite menu. Actions with children become nested system menus.
private struct StanceRewriteMenuItems: View {
    let actions: [StanceRewriteAction]
    let onAction: (StanceRewriteAction) -> Void

    var body: some View {
        ForEach(actions) { action in
            if action.children.isEmpty {
                Button {
                    onAction(action)
                } label: {
                    itemLabel(action)
                }
            } else {
                Menu {
                    StanceRewriteMenuItems(actions: action.children, onAction: onAction)
                } label: {
                    itemLabel(action)
                }
            }
        }
    }

    @ViewBuilder private func itemLabel(_ action: StanceRewriteAction) -> some View {
        if let systemImage = action.systemImage { Label(action.label, systemImage: systemImage) } else { Text(action.label) }
    }
}

/// A menu of ways to change selected text, with a preview of the result to replace or discard.
///
/// Built on the system `Menu`, with nested menus for choices such as tone. The system owns the
/// open state, focus and dismissal. An optional custom instruction opens a text field under the
/// button. When you pass a preview, it appears in a labelled card with Replace and Discard, so
/// the change can be reviewed before it lands.
public struct StanceRewriteMenu<Preview: View>: View {
    private let title: String?
    private let actions: [StanceRewriteAction]?
    private let allowsCustom: Bool
    private let status: StanceGenerationStatus
    private let labels: StanceRewriteMenuLabels
    private let onAction: (StanceRewriteAction) -> Void
    private let onCustomSubmit: ((String) -> Void)?
    private let onAcceptPreview: (() -> Void)?
    private let onDiscardPreview: (() -> Void)?
    private let preview: Preview
    @State private var showsCustom = false
    @State private var instruction = ""
    @FocusState private var instructionFocused: Bool
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - title: The button title. Defaults to a localised "Rewrite".
    ///   - actions: The menu. Defaults to ``StanceRewriteAction/standard(locale:)``.
    ///   - allowsCustom: Adds a custom instruction item.
    ///   - status: The state of the rewrite. While it is active the button is busy and the preview is hidden.
    ///   - labels: Replacements for the built in words.
    ///   - onAction: Called with the chosen action.
    ///   - preview: The rewritten text. Leave out when there is nothing to review.
    ///   - onCustomSubmit: Called with a custom instruction.
    ///   - onAcceptPreview: Replaces the text with the preview.
    ///   - onDiscardPreview: Throws the preview away.
    @_disfavoredOverload
    public init(
        _ title: String? = nil,
        actions: [StanceRewriteAction]? = nil,
        allowsCustom: Bool = false,
        status: StanceGenerationStatus = .idle,
        labels: StanceRewriteMenuLabels = .init(),
        onAction: @escaping (StanceRewriteAction) -> Void,
        @ViewBuilder preview: () -> Preview = { EmptyView() },
        onCustomSubmit: ((String) -> Void)? = nil,
        onAcceptPreview: (() -> Void)? = nil,
        onDiscardPreview: (() -> Void)? = nil
    ) {
        self.title = title
        self.actions = actions
        self.allowsCustom = allowsCustom
        self.status = status
        self.labels = labels
        self.onAction = onAction
        self.onCustomSubmit = onCustomSubmit
        self.onAcceptPreview = onAcceptPreview
        self.onDiscardPreview = onDiscardPreview
        self.preview = preview()
    }

    /// The instruction to send, trimmed, or `nil` when it is blank.
    public nonisolated static func instruction(_ text: String) -> String? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    private var resolvedTitle: String { title ?? stanceString("stance.ai.rewrite.title", locale) }
    private var workingLabel: String { labels.working ?? stanceString("stance.ai.rewrite.working", locale) }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            HStack(spacing: StanceSpacing.sm) {
                Menu {
                    StanceRewriteMenuItems(actions: actions ?? StanceRewriteAction.standard(locale: locale)) { action in
                        StanceHaptics.selection()
                        onAction(action)
                    }
                    if allowsCustom {
                        Divider()
                        Button {
                            showsCustom = true
                            instructionFocused = true
                        } label: {
                            Label(labels.custom ?? stanceString("stance.ai.rewrite.custom", locale), systemImage: "pencil.line")
                        }
                    }
                } label: {
                    HStack(spacing: StanceSpacing.xs) {
                        StanceIcon(.sparkle, size: StanceSize.iconSm)
                        Text(resolvedTitle)
                        StanceIcon(.chevronDown, size: StanceSize.iconSm)
                    }
                }
                .buttonStyle(.stance(.outline, size: .small))
                .disabled(status.isActive)
                if status.isActive { StanceShimmerText(workingLabel) }
            }
            if showsCustom, allowsCustom { customField }
            if Preview.self != EmptyView.self, !status.isActive { previewCard }
        }
        .onChange(of: status) { old, new in
            if let text = StanceGenerationStatus.announcement(from: old, to: new, locale: locale) { StanceAnnouncer.announce(text) }
        }
    }

    private var customField: some View {
        let placeholder = labels.customPlaceholder ?? stanceString("stance.ai.rewrite.customPlaceholder", locale)
        return HStack(spacing: StanceSpacing.sm) {
            TextField(placeholder, text: $instruction)
                .focused($instructionFocused)
                .submitLabel(.send)
                .onSubmit(submitCustom)
                .onKeyPress(.escape) {
                    showsCustom = false
                    return .handled
                }
                .accessibilityLabel(placeholder)
            Button(action: submitCustom) {
                StanceIcon(.arrowUp, size: StanceSize.iconSm)
                    .foregroundStyle(Self.instruction(instruction) == nil ? theme.colors.disabledFg : theme.colors.fgDefault)
                    .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .disabled(Self.instruction(instruction) == nil)
            .accessibilityLabel(labels.customSubmit ?? stanceString("stance.ai.rewrite.customSubmit", locale))
            .padding(.trailing, -StanceSpacing.md)
        }
        .modifier(StanceFieldChrome(isFocused: instructionFocused, isInvalid: false))
    }

    private var previewCard: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            HStack(spacing: StanceSpacing.xs) {
                StanceIcon(.sparkle, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted)
                Text(labels.preview ?? stanceString("stance.ai.rewrite.preview", locale))
                    .stanceText(.label)
                    .foregroundStyle(theme.colors.fgMuted)
                    .accessibilityAddTraits(.isHeader)
            }
            preview.stanceText(.body).frame(maxWidth: .infinity, alignment: .leading)
            if onAcceptPreview != nil || onDiscardPreview != nil {
                StanceFlowLayout(spacing: StanceSpacing.sm, lineSpacing: StanceSpacing.none) {
                    if let onAcceptPreview {
                        StanceButton(labels.replace ?? stanceString("stance.ai.rewrite.replace", locale), size: .small, leadingIcon: .check) {
                            StanceHaptics.success()
                            onAcceptPreview()
                            StanceAnnouncer.announce(labels.replaced ?? stanceString("stance.ai.rewrite.replaced", locale))
                        }
                    }
                    if let onDiscardPreview {
                        StanceButton(labels.discard ?? stanceString("stance.ai.rewrite.discard", locale), variant: .ghost, size: .small) {
                            StanceHaptics.warning()
                            onDiscardPreview()
                            StanceAnnouncer.announce(labels.discarded ?? stanceString("stance.ai.rewrite.discarded", locale))
                        }
                    }
                }
            }
        }
        .stanceCard(padding: StanceSpacing.md)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(labels.preview ?? stanceString("stance.ai.rewrite.preview", locale))
    }

    private func submitCustom() {
        guard let text = Self.instruction(instruction) else { return }
        onCustomSubmit?(text)
        instruction = ""
        showsCustom = false
    }
}

// MARK: Suggestion chips

/// One follow up prompt or next action in ``StanceSuggestionChips`` or a ``StanceAskBar``.
public struct StanceSuggestionChip: Identifiable, Hashable, Sendable {
    /// A stable identifier.
    public let id: String
    /// The visible text and accessible name.
    public let label: String
    /// An optional leading Stance icon.
    public let icon: StanceIconName?

    /// Creates a chip.
    public init(id: String, label: String, icon: StanceIconName? = nil) {
        self.id = id
        self.label = label
        self.icon = icon
    }
}

/// Short follow up prompts or next actions, offered after a response or beside content.
///
/// Each chip is a system `Button` with a 44pt target. Chips wrap onto more lines by default, so
/// they reflow at large text sizes; pass `wraps: false` for one scrolling row. While loading,
/// placeholders hold the space and VoiceOver hears one "Loading suggestions".
public struct StanceSuggestionChips: View {
    private let items: [StanceSuggestionChip]
    private let label: String?
    private let isLoading: Bool
    private let wraps: Bool
    private let onSelect: (StanceSuggestionChip) -> Void
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - items: The chips, in order.
    ///   - label: The accessible name of the group. Defaults to a localised "Suggestions".
    ///   - isLoading: Shows placeholders in place of the chips.
    ///   - wraps: Wraps onto more lines. `false` scrolls sideways in one row.
    ///   - onSelect: Called with the chosen chip.
    public init(_ items: [StanceSuggestionChip], label: String? = nil, isLoading: Bool = false, wraps: Bool = true, onSelect: @escaping (StanceSuggestionChip) -> Void) {
        self.items = items
        self.label = label
        self.isLoading = isLoading
        self.wraps = wraps
        self.onSelect = onSelect
    }

    /// The chips with repeated identifiers removed, keeping the first of each.
    public nonisolated static func unique(_ items: [StanceSuggestionChip]) -> [StanceSuggestionChip] {
        var seen = Set<String>()
        return items.filter { seen.insert($0.id).inserted }
    }

    /// The chip with `id`, if it is on offer.
    public nonisolated static func item(_ id: String, in items: [StanceSuggestionChip]) -> StanceSuggestionChip? {
        items.first { $0.id == id }
    }

    public var body: some View {
        if isLoading {
            HStack(spacing: StanceSpacing.sm) {
                ForEach(0 ..< 3, id: \.self) { index in
                    StanceSkeleton(.rectangle, width: StanceSize.touchTarget * CGFloat(2 + index % 2), height: StanceSize.controlSm)
                        .clipShape(Capsule())
                }
            }
            .frame(minHeight: StanceSize.touchTarget, alignment: .leading)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(stanceString("stance.ai.chips.loading", locale))
        } else if !items.isEmpty {
            Group {
                if wraps {
                    StanceFlowLayout(spacing: StanceSpacing.sm, lineSpacing: StanceSpacing.none) { chips }
                } else {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: StanceSpacing.sm) { chips }
                    }
                }
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(label ?? stanceString("stance.ai.chips.label", locale))
        }
    }

    private var chips: some View {
        ForEach(Self.unique(items)) { item in
            Button {
                StanceHaptics.selection()
                onSelect(item)
            } label: {
                HStack(spacing: StanceSpacing.xs) {
                    if let icon = item.icon { StanceIcon(icon, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted) }
                    Text(item.label).stanceText(.label).multilineTextAlignment(.leading)
                }
                .padding(.horizontal, StanceSpacing.md)
                .padding(.vertical, StanceSpacing.xs)
                .frame(minHeight: StanceSize.controlSm + StanceSpacing.xs)
                .foregroundStyle(theme.colors.fgDefault)
                .background(theme.colors.bgSurface, in: RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous)
                        .strokeBorder(theme.colors.borderControl, lineWidth: theme.controlBorderWidth)
                }
                .frame(minHeight: StanceSize.touchTarget)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            #if os(iOS)
            .hoverEffect(.highlight)
            #endif
        }
    }
}

// MARK: Ask bar

/// Words a ``StanceAskBar`` uses. Leave a value out to keep the localised default.
public struct StanceAskBarLabels: Sendable {
    public var clear: String?
    public var suggestions: String?
    public var answer: String?
    public var answerReady: String?
    public var failed: String?

    /// - Parameters:
    ///   - clear: The clear button. Defaults to a localised "Clear question".
    ///   - suggestions: The name of the suggestion group. Defaults to a localised "Suggestions".
    ///   - answer: The name of the answer region. Defaults to a localised "Answer".
    ///   - answerReady: Announced when the answer is complete. Defaults to a localised "Answer ready".
    ///   - failed: Shown and announced when the answer fails. Defaults to a localised "The answer could not be loaded.".
    public init(clear: String? = nil, suggestions: String? = nil, answer: String? = nil, answerReady: String? = nil, failed: String? = nil) {
        self.clear = clear
        self.suggestions = suggestions
        self.answer = answer
        self.answerReady = answerReady
        self.failed = failed
    }
}

/// A single line "ask anything" bar for a page or a product, with suggestions and an answer
/// that appears in place.
///
/// The field is a system `TextField` with the search trait and a Search return key. Suggestions
/// are ``StanceSuggestionChips`` under it. The answer area shows a skeleton while the request is
/// pending, then your answer view; VoiceOver hears "Answer ready" once, never the stream.
public struct StanceAskBar<Answer: View>: View {
    private let placeholder: String?
    private let suggestions: [StanceSuggestionChip]
    private let status: StanceGenerationStatus
    private let shortcut: String?
    private let labels: StanceAskBarLabels
    private let onSubmit: (String) -> Void
    private let onSuggestionSelect: ((StanceSuggestionChip) -> Void)?
    private let onClear: (() -> Void)?
    private let answer: Answer
    @Binding private var text: String
    @FocusState private var focused: Bool
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - text: The question being typed.
    ///   - placeholder: The prompt and accessible name. Defaults to a localised "Ask anything".
    ///   - suggestions: Prompts offered under the field while nothing is in progress.
    ///   - status: The state of the answer.
    ///   - shortcut: A keyboard shortcut to show as a hint in the empty field, such as "⌘K". The app registers the shortcut.
    ///   - labels: Replacements for the built in words.
    ///   - onSubmit: Called with the trimmed question. Blank questions and questions asked while an answer is in progress are not sent.
    ///   - onSuggestionSelect: Called with a chosen suggestion. Without it, the suggestion is asked at once.
    ///   - onClear: Called when the field is cleared.
    ///   - answer: The answer. Leave out for a bar without an answer area.
    public init(
        text: Binding<String>,
        placeholder: String? = nil,
        suggestions: [StanceSuggestionChip] = [],
        status: StanceGenerationStatus = .idle,
        shortcut: String? = nil,
        labels: StanceAskBarLabels = .init(),
        onSubmit: @escaping (String) -> Void,
        onSuggestionSelect: ((StanceSuggestionChip) -> Void)? = nil,
        onClear: (() -> Void)? = nil,
        @ViewBuilder answer: () -> Answer = { EmptyView() }
    ) {
        _text = text
        self.placeholder = placeholder
        self.suggestions = suggestions
        self.status = status
        self.shortcut = shortcut
        self.labels = labels
        self.onSubmit = onSubmit
        self.onSuggestionSelect = onSuggestionSelect
        self.onClear = onClear
        self.answer = answer()
    }

    /// The question to send, trimmed, or `nil` when it is blank or an answer is in progress.
    public nonisolated static func submission(text: String, status: StanceGenerationStatus) -> String? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !status.isActive else { return nil }
        return trimmed
    }

    /// Whether suggestions are offered: only while nothing has been asked.
    public nonisolated static func showsSuggestions(status: StanceGenerationStatus, count: Int) -> Bool {
        status == .idle && count > 0
    }

    private var prompt: String { placeholder ?? stanceString("stance.ai.ask.placeholder", locale) }
    private var failedLabel: String { labels.failed ?? stanceString("stance.ai.ask.failed", locale) }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            field
            if Self.showsSuggestions(status: status, count: suggestions.count) {
                StanceSuggestionChips(suggestions, label: labels.suggestions ?? stanceString("stance.ai.ask.suggestions", locale)) { chip in
                    if let onSuggestionSelect {
                        onSuggestionSelect(chip)
                    } else {
                        text = chip.label
                        submit()
                    }
                }
            }
            if Answer.self != EmptyView.self, status != .idle { answerArea }
        }
        .onChange(of: status) { _, new in
            // One polite announcement when the answer is complete; a failure interrupts.
            if new == .complete {
                StanceAnnouncer.announce(labels.answerReady ?? stanceString("stance.ai.ask.answerReady", locale))
            } else if new == .error {
                StanceAnnouncer.announce(failedLabel, urgent: true)
            }
        }
    }

    private var field: some View {
        HStack(spacing: StanceSpacing.sm) {
            Group {
                if status.isActive {
                    ProgressView().controlSize(.small).tint(theme.colors.fgMuted)
                } else {
                    StanceIcon(.search, size: StanceSize.iconSm + StanceSpacing.xxs).foregroundStyle(theme.colors.fgMuted)
                }
            }
            .frame(width: StanceSize.iconMd, height: StanceSize.iconMd)
            .accessibilityHidden(true)
            TextField(prompt, text: $text)
                .frame(minHeight: StanceSize.touchTarget)
                .focused($focused)
                .submitLabel(.search)
                .onSubmit(submit)
                .accessibilityLabel(prompt)
                .accessibilityAddTraits(.isSearchField)
                .accessibilityValue(status.accessibilityDescription(locale: locale) ?? "")
            if !text.isEmpty {
                Button {
                    text = ""
                    onClear?()
                } label: {
                    StanceIcon(.xCircle, size: StanceSize.iconSm + StanceSpacing.xxs)
                        .foregroundStyle(theme.colors.fgMuted)
                        .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityElement()
                .accessibilityAddTraits(.isButton)
                .accessibilityLabel(labels.clear ?? stanceString("stance.ai.ask.clear", locale))
                .padding(.trailing, -StanceSpacing.md)
            } else if let shortcut {
                Text(verbatim: shortcut)
                    .stanceText(.caption)
                    .foregroundStyle(theme.colors.fgMuted)
                    .padding(.horizontal, StanceSpacing.s1_5)
                    .padding(.vertical, StanceSpacing.xxs)
                    .background(theme.colors.bgMuted, in: RoundedRectangle(cornerRadius: StanceRadius.xs, style: .continuous))
                    .accessibilityHidden(true)
            }
        }
        .modifier(StanceFieldChrome(isFocused: focused, isInvalid: false))
        .contentShape(Rectangle())
        .onTapGesture { focused = true }
    }

    private var answerArea: some View {
        Group {
            switch status {
            case .submitted: StanceStreamingSkeleton()
            case .error:
                Label {
                    Text(failedLabel)
                } icon: {
                    StanceIcon(.alertCircle, size: StanceSize.iconSm)
                }
                .stanceText(.bodySmall)
                .foregroundStyle(theme.colors.dangerFg)
            default: answer
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .stanceCard(padding: StanceSpacing.md)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(labels.answer ?? stanceString("stance.ai.ask.answer", locale))
    }

    private func submit() {
        guard let question = Self.submission(text: text, status: status) else { return }
        onSubmit(question)
    }
}

// MARK: Localised labels

extension StanceInlineSuggestion {
    /// Creates an inline suggestion field whose label is looked up in the app's string tables.
    public init(
        _ labelKey: LocalizedStringResource,
        text: Binding<String>,
        suggestion: String?,
        placeholder: String? = nil,
        helper: String? = nil,
        axis: Axis = .horizontal,
        isLoading: Bool = false,
        labels: StanceInlineSuggestionLabels = .init(),
        onAccept: ((String) -> Void)? = nil,
        onAcceptWord: ((String) -> Void)? = nil,
        onDismiss: (() -> Void)? = nil
    ) {
        self.init(
            String(localized: labelKey), text: text, suggestion: suggestion, placeholder: placeholder, helper: helper, axis: axis,
            isLoading: isLoading, labels: labels, onAccept: onAccept, onAcceptWord: onAcceptWord, onDismiss: onDismiss
        )
    }
}

extension StanceSmartField {
    /// Creates a smart field whose label is looked up in the app's string tables.
    public init(
        _ labelKey: LocalizedStringResource,
        status: StanceSmartFieldStatus = .idle,
        suggestedValue: String? = nil,
        suggestionSource: String? = nil,
        helper: String? = nil,
        labels: StanceSmartFieldLabels = .init(),
        onAccept: (() -> Void)? = nil,
        onUndo: (() -> Void)? = nil,
        onRegenerate: (() -> Void)? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.init(
            String(localized: labelKey), status: status, suggestedValue: suggestedValue, suggestionSource: suggestionSource, helper: helper,
            labels: labels, onAccept: onAccept, onUndo: onUndo, onRegenerate: onRegenerate, content: content
        )
    }
}

extension StanceRewriteMenu {
    /// Creates a rewrite menu whose button title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        actions: [StanceRewriteAction]? = nil,
        allowsCustom: Bool = false,
        status: StanceGenerationStatus = .idle,
        labels: StanceRewriteMenuLabels = .init(),
        onAction: @escaping (StanceRewriteAction) -> Void,
        @ViewBuilder preview: () -> Preview = { EmptyView() },
        onCustomSubmit: ((String) -> Void)? = nil,
        onAcceptPreview: (() -> Void)? = nil,
        onDiscardPreview: (() -> Void)? = nil
    ) {
        self.init(
            String(localized: titleKey), actions: actions, allowsCustom: allowsCustom, status: status, labels: labels, onAction: onAction,
            preview: preview, onCustomSubmit: onCustomSubmit, onAcceptPreview: onAcceptPreview, onDiscardPreview: onDiscardPreview
        )
    }
}
