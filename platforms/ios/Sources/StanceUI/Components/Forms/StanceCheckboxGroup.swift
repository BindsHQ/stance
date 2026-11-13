import SwiftUI

/// The checked state of a select all control: none, some or all of the options.
public enum StanceCheckState: String, Sendable {
    case unchecked, mixed, checked

    /// The state for `selectedCount` chosen out of `total`.
    public nonisolated static func resolve(selectedCount: Int, total: Int) -> StanceCheckState {
        if total <= 0 || selectedCount <= 0 { return .unchecked }
        return selectedCount >= total ? .checked : .mixed
    }
}

/// A labelled group of checkboxes for choosing any number of options from a short list, with
/// helper or error text and an optional select all.
///
/// Each option is a ``StanceCheckbox``. VoiceOver hears the group name as it enters the group,
/// and the select all control reports checked, not checked or partly checked.
/// For long lists use ``StanceMultiSelect``.
public struct StanceCheckboxGroup<Value: Hashable>: View {
    private let label: String
    private let options: [StanceSelectOption<Value>]
    private let helper: String?
    private let error: String?
    private let isRequired: Bool
    private let showsSelectAll: Bool
    private let selectAllLabel: String?
    @Binding private var selection: Set<Value>
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.isEnabled) private var isEnabled

    /// - Parameters:
    ///   - label: The group's visible heading and accessible name.
    ///   - selection: The checked values.
    ///   - options: Every option. The detail shows below the option label.
    ///   - showsSelectAll: Adds a control above the options that checks or clears them all.
    ///   - selectAllLabel: The select all label. Defaults to a localised "Select all".
    @_disfavoredOverload
    public init(
        _ label: String,
        selection: Binding<Set<Value>>,
        options: [StanceSelectOption<Value>],
        helper: String? = nil,
        error: String? = nil,
        isRequired: Bool = false,
        showsSelectAll: Bool = false,
        selectAllLabel: String? = nil
    ) {
        self.label = label
        _selection = selection
        self.options = options
        self.helper = helper
        self.error = error
        self.isRequired = isRequired
        self.showsSelectAll = showsSelectAll
        self.selectAllLabel = selectAllLabel
    }

    private var state: StanceCheckState {
        StanceCheckState.resolve(selectedCount: options.filter { selection.contains($0.value) }.count, total: options.count)
    }

    private var isInvalid: Bool { !(error ?? "").isEmpty }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.xs) {
            HStack(spacing: StanceSpacing.xs) {
                Text(label).stanceText(.label)
                if isRequired { Text(verbatim: "*").stanceText(.label).foregroundStyle(theme.colors.dangerFg).accessibilityHidden(true) }
            }
            .accessibilityAddTraits(.isHeader)
            if showsSelectAll {
                selectAll
                StanceDivider()
            }
            ForEach(options) { option in
                StanceCheckbox(option.label, description: option.detail, isOn: Binding(
                    get: { selection.contains(option.value) },
                    set: { checked in
                        if checked { selection.insert(option.value) } else { selection.remove(option.value) }
                    }
                ))
                .padding(.leading, showsSelectAll ? StanceSpacing.xl : 0)
            }
            if let error, isInvalid {
                Label {
                    Text(error)
                } icon: {
                    StanceIcon(.alertCircle, size: StanceSize.iconSm)
                }
                .stanceText(.caption)
                .foregroundStyle(theme.colors.dangerFg)
            } else if let helper {
                Text(helper).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
        .onChange(of: error) { _, new in
            if let new, !new.isEmpty { StanceAnnouncer.announce(stanceString("stance.field.announcement \(label) \(new)", locale), urgent: true) }
        }
    }

    private var selectAll: some View {
        let state = state
        let title = selectAllLabel ?? stanceString("stance.checkboxGroup.selectAll", locale)
        return Button {
            selection = state == .checked ? [] : Set(options.map(\.value))
        } label: {
            HStack(spacing: StanceSpacing.md) {
                ZStack {
                    let shape = RoundedRectangle(cornerRadius: StanceRadius.xs, style: .continuous)
                    shape.fill(state == .unchecked ? theme.colors.bgSurface : (isEnabled ? theme.colors.accentBg : theme.colors.disabledBg))
                    shape.strokeBorder(state == .unchecked ? (isEnabled ? theme.colors.borderControl : theme.colors.disabledBorder) : .clear, lineWidth: max(theme.controlBorderWidth, theme.borderWidth))
                    if state != .unchecked {
                        StanceIcon(state == .checked ? .check : .minus, size: StanceSize.iconSm)
                            .foregroundStyle(isEnabled ? theme.colors.accentFg : theme.colors.disabledFg)
                    }
                }
                .frame(width: StanceSize.iconMd + StanceSpacing.xxs, height: StanceSize.iconMd + StanceSpacing.xxs)
                .stanceAnimation(.fast, value: state)
                Text(title).stanceText(.body).fontWeight(.medium).foregroundStyle(isEnabled ? theme.colors.fgDefault : theme.colors.disabledFg)
                Spacer(minLength: 0)
            }
            .frame(minHeight: StanceSize.touchTarget)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(title)
        .accessibilityValue(stanceString(state == .checked ? "stance.checked" : state == .mixed ? "stance.checkboxGroup.mixed" : "stance.unchecked", locale))
        .accessibilityAddTraits(.isToggle)
        .sensoryFeedback(.selection, trigger: state)
    }
}

// MARK: Localised labels

extension StanceCheckboxGroup {
    /// Creates a checkbox group whose label is looked up in the app's string tables.
    public init(
        _ labelKey: LocalizedStringResource,
        selection: Binding<Set<Value>>,
        options: [StanceSelectOption<Value>],
        helper: String? = nil,
        error: String? = nil,
        isRequired: Bool = false,
        showsSelectAll: Bool = false,
        selectAllLabel: String? = nil
    ) {
        self.init(
            String(localized: labelKey), selection: selection, options: options, helper: helper, error: error,
            isRequired: isRequired, showsSelectAll: showsSelectAll, selectAllLabel: selectAllLabel
        )
    }
}
