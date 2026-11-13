import SwiftUI

/// A choice in a ``StanceCombobox``, ``StanceMultiSelect`` or ``StanceCheckboxGroup``.
public struct StanceSelectOption<Value: Hashable>: Identifiable {
    public let value: Value
    public let label: String
    /// A second line, such as a team or an email address. It is searched too.
    public let detail: String?
    public var id: Value { value }

    public init(_ value: Value, label: String, detail: String? = nil) {
        self.value = value
        self.label = label
        self.detail = detail
    }
}

extension StanceSelectOption: Sendable where Value: Sendable {}

/// The search rule shared by ``StanceCombobox`` and ``StanceMultiSelect``.
public enum StanceOptionFilter {
    /// The options that match `query`, ignoring case and accents.
    ///
    /// An empty or blank query returns every option. Options whose label starts with the query
    /// come first, then options that contain it in the label or detail, each in their original order.
    public nonisolated static func filter<Value: Hashable>(_ options: [StanceSelectOption<Value>], query: String) -> [StanceSelectOption<Value>] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return options }
        let compare: String.CompareOptions = [.caseInsensitive, .diacriticInsensitive]
        var prefix: [StanceSelectOption<Value>] = []
        var contains: [StanceSelectOption<Value>] = []
        for option in options {
            if option.label.range(of: trimmed, options: compare.union(.anchored)) != nil {
                prefix.append(option)
            } else if option.label.range(of: trimmed, options: compare) != nil || option.detail?.range(of: trimmed, options: compare) != nil {
                contains.append(option)
            }
        }
        return prefix + contains
    }

    /// The custom value a query offers, or `nil` when there is nothing to offer.
    ///
    /// A blank query offers nothing. Neither does a query that is the label of an option, ignoring
    /// case and accents: that option is chosen instead, as the web combobox does.
    public nonisolated static func customText<Value: Hashable>(for query: String, in options: [StanceSelectOption<Value>]) -> String? {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        let compare: String.CompareOptions = [.caseInsensitive, .diacriticInsensitive]
        return options.contains { $0.label.compare(trimmed, options: compare) == .orderedSame } ? nil : trimmed
    }
}

/// Lets a ``StanceCombobox`` or ``StanceMultiSelect`` accept text that is not one of its options.
///
/// The value type stays yours: you say how typed text becomes a value and how such a value is
/// shown. For `String` values use `.text`.
///
/// ```swift
/// StanceCombobox("Tag", selection: $tag, options: tags, custom: .text)
/// StanceCombobox("Owner", selection: $owner, options: people, custom: .init(make: { Owner.invited(email: $0) }, label: \.name))
/// ```
public struct StanceCustomValue<Value: Hashable> {
    let make: (String) -> Value?
    let label: (Value) -> String
    let actionLabel: ((String) -> String)?

    /// - Parameters:
    ///   - make: Turns the typed text into a value, or returns `nil` to refuse it (for example an invalid email).
    ///   - label: The text shown for a value that is not among the options.
    ///   - actionLabel: The row that offers the typed text. Defaults to a localised "Use “text”" in a
    ///     combobox and "Create “text”" in a multi select.
    public init(make: @escaping (String) -> Value?, label: @escaping (Value) -> String, actionLabel: ((String) -> String)? = nil) {
        self.make = make
        self.label = label
        self.actionLabel = actionLabel
    }
}

extension StanceCustomValue where Value == String {
    /// The typed text is the value.
    public static var text: StanceCustomValue { StanceCustomValue(make: { $0 }, label: { $0 }) }
}

/// A field that opens a searchable list and picks one value, such as a template owner from
/// the people in an organisation.
///
/// Native first: the list is a system `List` with `.searchable`, shown in a sheet with detents
/// on iPhone and in a popover on iPad. For a handful of options use ``StancePicker`` instead.
public struct StanceCombobox<Value: Hashable>: View {
    private let label: String
    private let options: [StanceSelectOption<Value>]
    private let placeholder: String?
    private let searchPrompt: String?
    private let helper: String?
    private let error: String?
    private let isRequired: Bool
    private let isClearable: Bool
    private let custom: StanceCustomValue<Value>?
    @Binding private var selection: Value?
    @State private var isOpen = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.isEnabled) private var isEnabled

    /// - Parameters:
    ///   - label: The visible label, the list title and the accessible name.
    ///   - selection: The chosen value, or `nil`.
    ///   - options: Every choice.
    ///   - placeholder: Shown when nothing is chosen. Defaults to a localised "Select".
    ///   - searchPrompt: The search field prompt. Defaults to a localised "Search".
    ///   - isClearable: Adds a button that clears the choice.
    ///   - custom: Accepts typed text that matches no option: the list offers "Use “text”" as its
    ///     first row, and Return in the search field commits it.
    @_disfavoredOverload
    public init(
        _ label: String,
        selection: Binding<Value?>,
        options: [StanceSelectOption<Value>],
        placeholder: String? = nil,
        searchPrompt: String? = nil,
        helper: String? = nil,
        error: String? = nil,
        isRequired: Bool = false,
        isClearable: Bool = true,
        custom: StanceCustomValue<Value>? = nil
    ) {
        self.label = label
        self.custom = custom
        _selection = selection
        self.options = options
        self.placeholder = placeholder
        self.searchPrompt = searchPrompt
        self.helper = helper
        self.error = error
        self.isRequired = isRequired
        self.isClearable = isClearable
    }

    /// The chosen option, or a stand in for a custom value that is not among the options.
    private var selected: StanceSelectOption<Value>? {
        guard let selection else { return nil }
        if let option = options.first(where: { $0.value == selection }) { return option }
        return custom.map { StanceSelectOption(selection, label: $0.label(selection)) }
    }

    /// The row that offers the typed text, when custom values are accepted.
    private var customRow: StanceCustomRow? {
        guard let custom else { return nil }
        return StanceCustomRow(title: { custom.actionLabel?($0) ?? stanceString("stance.select.useCustom \($0)", locale) }) { text in
            guard let value = custom.make(text) else { return }
            selection = value
            isOpen = false
        }
    }

    public var body: some View {
        StanceFormField(label, helper: helper, error: error, isRequired: isRequired) {
            HStack(spacing: StanceSpacing.sm) {
                Button {
                    isOpen = true
                } label: {
                    HStack(spacing: StanceSpacing.sm) {
                        Text(selected?.label ?? placeholder ?? stanceString("stance.select.placeholder", locale))
                            .foregroundStyle(selected == nil ? theme.colors.fgSubtle : (isEnabled ? theme.colors.fgDefault : theme.colors.disabledFg))
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        StanceIcon(.chevronsUpDown, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted)
                    }
                    .frame(minHeight: StanceSize.touchTarget)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityValue(selected?.label ?? stanceString("stance.select.none", locale))
                if isClearable, selected != nil {
                    Button {
                        selection = nil
                    } label: {
                        StanceIcon(.xCircle, size: StanceSize.iconSm + StanceSpacing.xxs)
                            .foregroundStyle(theme.colors.fgMuted)
                            .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityElement()
                    .accessibilityAddTraits(.isButton)
                    .accessibilityLabel(stanceString("stance.select.clear", locale))
                    .padding(.trailing, -StanceSpacing.md)
                }
            }
            .modifier(StanceFieldChrome(isFocused: isOpen, isInvalid: !(error ?? "").isEmpty))
            .modifier(StanceOptionPresenter(isPresented: $isOpen) {
                StanceOptionList(
                    title: label,
                    options: options,
                    searchPrompt: searchPrompt,
                    isSelected: { $0 == selection },
                    onToggle: { value in
                        selection = value
                        isOpen = false
                    },
                    onClear: nil,
                    onDone: { isOpen = false },
                    custom: customRow
                )
            })
        }
    }
}

/// A field for choosing several values from a searchable list, such as the departments a
/// signature template applies to. Chosen values show below the field as removable tags.
///
/// Native first: the list is a system `List` with `.searchable` and checkmarks, shown in a
/// sheet with detents on iPhone and in a popover on iPad.
public struct StanceMultiSelect<Value: Hashable>: View {
    private let label: String
    private let options: [StanceSelectOption<Value>]
    private let placeholder: String?
    private let searchPrompt: String?
    private let helper: String?
    private let error: String?
    private let isRequired: Bool
    private let maxTags: Int?
    private let custom: StanceCustomValue<Value>?
    @Binding private var selection: Set<Value>
    @State private var isOpen = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.isEnabled) private var isEnabled

    /// - Parameters:
    ///   - label: The visible label, the list title and the accessible name.
    ///   - selection: The chosen values.
    ///   - options: Every choice, in the order tags and rows appear.
    ///   - placeholder: Shown when nothing is chosen. Defaults to a localised "Select".
    ///   - searchPrompt: The search field prompt. Defaults to a localised "Search".
    ///   - maxTags: Shows at most this many tags and a count of the rest.
    ///   - custom: Accepts typed text that matches no option as a new tag: the list offers
    ///     "Create “text”" as its first row, and Return in the search field commits it.
    @_disfavoredOverload
    public init(
        _ label: String,
        selection: Binding<Set<Value>>,
        options: [StanceSelectOption<Value>],
        placeholder: String? = nil,
        searchPrompt: String? = nil,
        helper: String? = nil,
        error: String? = nil,
        isRequired: Bool = false,
        maxTags: Int? = nil,
        custom: StanceCustomValue<Value>? = nil
    ) {
        self.label = label
        self.custom = custom
        _selection = selection
        self.options = options
        self.placeholder = placeholder
        self.searchPrompt = searchPrompt
        self.helper = helper
        self.error = error
        self.isRequired = isRequired
        self.maxTags = maxTags
    }

    /// The options plus the chosen custom values that are not among them, which sort by label.
    private var allOptions: [StanceSelectOption<Value>] {
        Self.options(options, selection: selection, custom: custom)
    }

    /// The given options followed by chosen values that are not among them, labelled by `custom`
    /// and sorted by label. Without `custom`, unknown values are left out.
    public nonisolated static func options(_ options: [StanceSelectOption<Value>], selection: Set<Value>, custom: StanceCustomValue<Value>?) -> [StanceSelectOption<Value>] {
        guard let custom else { return options }
        let known = Set(options.map(\.value))
        let extras = selection.subtracting(known)
            .map { StanceSelectOption($0, label: custom.label($0)) }
            .sorted { $0.label.localizedStandardCompare($1.label) == .orderedAscending }
        return options + extras
    }

    /// The chosen options in list order.
    private var chosen: [StanceSelectOption<Value>] { allOptions.filter { selection.contains($0.value) } }

    /// The row that offers the typed text as a new tag, when custom values are accepted.
    private var customRow: StanceCustomRow? {
        guard let custom else { return nil }
        return StanceCustomRow(title: { custom.actionLabel?($0) ?? stanceString("stance.select.createCustom \($0)", locale) }) { text in
            if let value = custom.make(text) { selection.insert(value) }
        }
    }

    public var body: some View {
        let chosen = chosen
        let shown = maxTags.map { Array(chosen.prefix(Swift.max(0, $0))) } ?? chosen
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            StanceFormField(label, helper: helper, error: error, isRequired: isRequired) {
                Button {
                    isOpen = true
                } label: {
                    HStack(spacing: StanceSpacing.sm) {
                        Text(chosen.isEmpty ? (placeholder ?? stanceString("stance.select.placeholder", locale)) : stanceString("stance.select.count \(chosen.count)", locale))
                            .foregroundStyle(chosen.isEmpty ? theme.colors.fgSubtle : (isEnabled ? theme.colors.fgDefault : theme.colors.disabledFg))
                            .frame(maxWidth: .infinity, alignment: .leading)
                        StanceIcon(.chevronsUpDown, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted)
                    }
                    .modifier(StanceFieldChrome(isFocused: isOpen, isInvalid: !(error ?? "").isEmpty))
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityValue(chosen.isEmpty ? stanceString("stance.select.none", locale) : chosen.map(\.label).formatted(.list(type: .and).locale(locale)))
                .modifier(StanceOptionPresenter(isPresented: $isOpen) {
                    StanceOptionList(
                        title: label,
                        options: allOptions,
                        searchPrompt: searchPrompt,
                        isSelected: { selection.contains($0) },
                        onToggle: { value in
                            if selection.contains(value) { selection.remove(value) } else { selection.insert(value) }
                        },
                        onClear: { selection.removeAll() },
                        onDone: { isOpen = false },
                        custom: customRow
                    )
                })
            }
            if !chosen.isEmpty {
                StanceFlowLayout(spacing: StanceSpacing.xs, lineSpacing: StanceSpacing.xs) {
                    ForEach(shown) { option in
                        StanceTag(option.label) { selection.remove(option.value) }
                    }
                    if shown.count < chosen.count {
                        Text(stanceString("stance.more \(chosen.count - shown.count)", locale))
                            .stanceText(.label)
                            .foregroundStyle(theme.colors.fgMuted)
                            .frame(minHeight: StanceSize.controlSm)
                    }
                }
                .disabled(!isEnabled)
            }
        }
    }
}

/// Shows option lists in a sheet with detents in compact width and a popover in regular width.
struct StanceOptionPresenter<ListContent: View>: ViewModifier {
    @Binding var isPresented: Bool
    @ViewBuilder let list: () -> ListContent
    @Environment(\.horizontalSizeClass) private var sizeClass
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.layoutDirection) private var layoutDirection

    func body(content: Content) -> some View {
        let chrome = StancePresentationChrome(theme: theme, locale: locale, layoutDirection: layoutDirection)
        if sizeClass == .regular {
            content.popover(isPresented: $isPresented) {
                list()
                    .frame(idealWidth: StanceSize.readableWidth / 2, idealHeight: StanceSize.readableWidth * 3 / 4)
                    .modifier(chrome)
            }
        } else {
            content.sheet(isPresented: $isPresented) {
                list()
                    .presentationDetents([.medium, .large])
                    .presentationDragIndicator(.visible)
                    .modifier(chrome)
            }
        }
    }
}

/// The first row of an option list when typed text can become a value.
struct StanceCustomRow {
    /// The row title for the typed text, such as "Use “Partners”".
    let title: (String) -> String
    /// Commits the typed text.
    let commit: (String) -> Void
}

/// The searchable list inside a combobox or multi select.
struct StanceOptionList<Value: Hashable>: View {
    let title: String
    let options: [StanceSelectOption<Value>]
    let searchPrompt: String?
    let isSelected: (Value) -> Bool
    let onToggle: (Value) -> Void
    let onClear: (() -> Void)?
    let onDone: () -> Void
    var custom: StanceCustomRow?
    @State private var query = ""
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    var body: some View {
        let results = StanceOptionFilter.filter(options, query: query)
        let customText = custom == nil ? nil : StanceOptionFilter.customText(for: query, in: options)
        NavigationStack {
            List {
                if let custom, let customText {
                    Button {
                        commit(customText, with: custom)
                    } label: {
                        HStack(spacing: StanceSpacing.md) {
                            StanceIcon(.plus, size: StanceSize.iconSm + StanceSpacing.xxs).foregroundStyle(theme.colors.fgMuted)
                            Text(custom.title(customText)).stanceText(.body).foregroundStyle(theme.colors.fgDefault)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .frame(minHeight: StanceSize.touchTarget)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .stanceListRow()
                }
                ForEach(results) { option in
                    let selected = isSelected(option.value)
                    Button {
                        onToggle(option.value)
                        StanceHaptics.selection()
                    } label: {
                        HStack(spacing: StanceSpacing.md) {
                            VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                                Text(option.label).stanceText(.body).foregroundStyle(theme.colors.fgDefault)
                                if let detail = option.detail {
                                    Text(detail).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            if selected {
                                StanceIcon(.check, size: StanceSize.iconSm + StanceSpacing.xxs).foregroundStyle(theme.colors.accentBg)
                            }
                        }
                        .frame(minHeight: StanceSize.touchTarget)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
                    .stanceListRow()
                }
            }
            .stanceListStyle()
            .overlay {
                if results.isEmpty, customText == nil { ContentUnavailableView.search(text: query) }
            }
            .searchable(text: $query, prompt: searchPrompt ?? stanceString("stance.search", locale))
            .onSubmit(of: .search) {
                // Return commits the typed text, as Enter does on the web.
                if let custom, let customText { commit(customText, with: custom) }
            }
            .navigationTitle(title)
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                if let onClear {
                    ToolbarItem(placement: .cancellationAction) {
                        Button(stanceString("stance.filters.clear", locale), action: onClear)
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(stanceString("stance.done", locale), action: onDone)
                }
            }
            .onChange(of: results.count) { _, count in
                if !query.isEmpty { StanceAnnouncer.announce(stanceString("stance.results.count \(count)", locale)) }
            }
        }
    }
}

extension StanceOptionList {
    private func commit(_ text: String, with custom: StanceCustomRow) {
        custom.commit(text)
        query = ""
        StanceHaptics.selection()
    }
}

// MARK: Localised labels

extension StanceCombobox {
    /// Creates a combobox whose label is looked up in the app's string tables.
    public init(
        _ labelKey: LocalizedStringResource,
        selection: Binding<Value?>,
        options: [StanceSelectOption<Value>],
        placeholder: String? = nil,
        searchPrompt: String? = nil,
        helper: String? = nil,
        error: String? = nil,
        isRequired: Bool = false,
        isClearable: Bool = true,
        custom: StanceCustomValue<Value>? = nil
    ) {
        self.init(
            String(localized: labelKey), selection: selection, options: options, placeholder: placeholder, searchPrompt: searchPrompt,
            helper: helper, error: error, isRequired: isRequired, isClearable: isClearable, custom: custom
        )
    }
}

extension StanceMultiSelect {
    /// Creates a multi select whose label is looked up in the app's string tables.
    public init(
        _ labelKey: LocalizedStringResource,
        selection: Binding<Set<Value>>,
        options: [StanceSelectOption<Value>],
        placeholder: String? = nil,
        searchPrompt: String? = nil,
        helper: String? = nil,
        error: String? = nil,
        isRequired: Bool = false,
        maxTags: Int? = nil,
        custom: StanceCustomValue<Value>? = nil
    ) {
        self.init(
            String(localized: labelKey), selection: selection, options: options, placeholder: placeholder, searchPrompt: searchPrompt,
            helper: helper, error: error, isRequired: isRequired, maxTags: maxTags, custom: custom
        )
    }
}
