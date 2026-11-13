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
        isClearable: Bool = true
    ) {
        self.label = label
        _selection = selection
        self.options = options
        self.placeholder = placeholder
        self.searchPrompt = searchPrompt
        self.helper = helper
        self.error = error
        self.isRequired = isRequired
        self.isClearable = isClearable
    }

    private var selected: StanceSelectOption<Value>? { options.first { $0.value == selection } }

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
                    onDone: { isOpen = false }
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
        maxTags: Int? = nil
    ) {
        self.label = label
        _selection = selection
        self.options = options
        self.placeholder = placeholder
        self.searchPrompt = searchPrompt
        self.helper = helper
        self.error = error
        self.isRequired = isRequired
        self.maxTags = maxTags
    }

    /// The chosen options in list order.
    private var chosen: [StanceSelectOption<Value>] { options.filter { selection.contains($0.value) } }

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
                        options: options,
                        searchPrompt: searchPrompt,
                        isSelected: { selection.contains($0) },
                        onToggle: { value in
                            if selection.contains(value) { selection.remove(value) } else { selection.insert(value) }
                        },
                        onClear: { selection.removeAll() },
                        onDone: { isOpen = false }
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

/// The searchable list inside a combobox or multi select.
struct StanceOptionList<Value: Hashable>: View {
    let title: String
    let options: [StanceSelectOption<Value>]
    let searchPrompt: String?
    let isSelected: (Value) -> Bool
    let onToggle: (Value) -> Void
    let onClear: (() -> Void)?
    let onDone: () -> Void
    @State private var query = ""
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    var body: some View {
        let results = StanceOptionFilter.filter(options, query: query)
        NavigationStack {
            List {
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
                if results.isEmpty { ContentUnavailableView.search(text: query) }
            }
            .searchable(text: $query, prompt: searchPrompt ?? stanceString("stance.search", locale))
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
        isClearable: Bool = true
    ) {
        self.init(
            String(localized: labelKey), selection: selection, options: options, placeholder: placeholder, searchPrompt: searchPrompt,
            helper: helper, error: error, isRequired: isRequired, isClearable: isClearable
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
        maxTags: Int? = nil
    ) {
        self.init(
            String(localized: labelKey), selection: selection, options: options, placeholder: placeholder, searchPrompt: searchPrompt,
            helper: helper, error: error, isRequired: isRequired, maxTags: maxTags
        )
    }
}
