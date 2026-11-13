import SwiftUI

/// The value rules of a ``StanceNumberField``, exposed for apps and tests.
public enum StanceNumberFieldLogic {
    /// Keeps `value` inside the optional bounds.
    public nonisolated static func clamp(_ value: Double, min lower: Double?, max upper: Double?) -> Double {
        var result = value
        if let lower { result = Swift.max(result, lower) }
        if let upper { result = Swift.min(result, upper) }
        return result
    }

    /// Rounds `value` to `precision` decimal places.
    public nonisolated static func round(_ value: Double, precision: Int) -> Double {
        let factor = pow(10, Double(Swift.max(0, precision)))
        return (value * factor).rounded() / factor
    }

    /// The value after stepping by `delta`, rounded and clamped.
    public nonisolated static func stepping(_ value: Double, by delta: Double, min lower: Double?, max upper: Double?, precision: Int) -> Double {
        clamp(round(value + delta, precision: precision), min: lower, max: upper)
    }

    /// Reads a number typed in the conventions of `locale`, with or without grouping separators.
    /// Returns `nil` for text that is not a number.
    public nonisolated static func parse(_ text: String, locale: Locale) -> Double? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        if let value = try? Double(trimmed, format: .number.locale(locale)) { return value }
        return Double(trimmed)
    }

    /// Writes a number in the conventions of `locale` with exactly `precision` decimal places.
    public nonisolated static func format(_ value: Double, precision: Int, locale: Locale) -> String {
        value.formatted(.number.precision(.fractionLength(Swift.max(0, precision))).locale(locale))
    }

    /// The value a committed draft becomes: parsed, rounded and clamped, or `fallback` when the
    /// draft is not a number.
    public nonisolated static func commit(_ draft: String, fallback: Double, min lower: Double?, max upper: Double?, precision: Int, locale: Locale) -> Double {
        guard let parsed = parse(draft, locale: locale) else { return fallback }
        return clamp(round(parsed, precision: precision), min: lower, max: upper)
    }

    /// The value a committed draft becomes when the field may be empty: `nil` for blank text or
    /// text that is not a number, otherwise the number parsed, rounded and clamped.
    public nonisolated static func commitOptional(_ draft: String, min lower: Double?, max upper: Double?, precision: Int, locale: Locale) -> Double? {
        guard let parsed = parse(draft, locale: locale) else { return nil }
        return clamp(round(parsed, precision: precision), min: lower, max: upper)
    }

    /// Where the stepper starts from when the field is empty: just below a positive minimum, so
    /// the first step up lands on it, otherwise zero. This matches the web number input.
    public nonisolated static func steppingBase(min lower: Double?, step: Double) -> Double {
        if let lower, lower > 0 { return lower - step }
        return 0
    }
}

/// A labelled number field with locale formatting, bounds and the system `Stepper`.
///
/// People type a value or use the stepper. Typed values are rounded to the precision and kept
/// inside the bounds when the field loses focus or Return is pressed, as the web field does.
///
/// Bind a `Double` when there is always a number, or a `Double?` when the field may be empty:
/// clearing the text then sets `nil`, and the stepper starts from the minimum or zero.
public struct StanceNumberField: View {
    private let label: String
    private let lower: Double?
    private let upper: Double?
    private let step: Double
    private let precision: Int
    private let prefix: String?
    private let suffix: String?
    private var placeholder: String?
    private let helper: String?
    private let error: String?
    private let isRequired: Bool
    private let isOptional: Bool
    @Binding private var value: Double?
    @State private var draft: String?
    @FocusState private var focused: Bool
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - label: The visible label and accessible name.
    ///   - value: The number.
    ///   - min: The lowest allowed value, if any.
    ///   - max: The highest allowed value, if any.
    ///   - step: How much the stepper adds or removes.
    ///   - precision: Decimal places shown and kept.
    ///   - prefix: Text before the number, such as a currency symbol.
    ///   - suffix: Text after the number, such as a unit.
    @_disfavoredOverload
    public init(
        _ label: String,
        value: Binding<Double>,
        min: Double? = nil,
        max: Double? = nil,
        step: Double = 1,
        precision: Int = 0,
        prefix: String? = nil,
        suffix: String? = nil,
        helper: String? = nil,
        error: String? = nil,
        isRequired: Bool = false
    ) {
        self.label = label
        // A number is always present here: writes that would clear it keep the last value.
        _value = Binding(get: { value.wrappedValue }, set: { if let new = $0 { value.wrappedValue = new } })
        isOptional = false
        lower = min
        upper = max
        self.step = step
        self.precision = Swift.max(0, precision)
        self.prefix = prefix
        self.suffix = suffix
        self.helper = helper
        self.error = error
        self.isRequired = isRequired
    }

    /// Creates a number field that may be empty.
    /// - Parameters:
    ///   - label: The visible label and accessible name.
    ///   - value: The number, or `nil` when the field is empty.
    ///   - min: The lowest allowed value, if any.
    ///   - max: The highest allowed value, if any.
    ///   - step: How much the stepper adds or removes.
    ///   - precision: Decimal places shown and kept.
    ///   - prefix: Text before the number, such as a currency symbol.
    ///   - suffix: Text after the number, such as a unit.
    ///   - placeholder: Shown while the field is empty.
    @_disfavoredOverload
    public init(
        _ label: String,
        value: Binding<Double?>,
        min: Double? = nil,
        max: Double? = nil,
        step: Double = 1,
        precision: Int = 0,
        prefix: String? = nil,
        suffix: String? = nil,
        placeholder: String? = nil,
        helper: String? = nil,
        error: String? = nil,
        isRequired: Bool = false
    ) {
        self.label = label
        _value = value
        isOptional = true
        lower = min
        upper = max
        self.step = step
        self.precision = Swift.max(0, precision)
        self.prefix = prefix
        self.suffix = suffix
        self.placeholder = placeholder
        self.helper = helper
        self.error = error
        self.isRequired = isRequired
    }

    private var formatted: String { value.map { StanceNumberFieldLogic.format($0, precision: precision, locale: locale) } ?? "" }

    private var stepperValue: Binding<Double> {
        Binding(
            get: { value ?? StanceNumberFieldLogic.steppingBase(min: lower, step: step) },
            set: { new in
                draft = nil
                value = StanceNumberFieldLogic.clamp(StanceNumberFieldLogic.round(new, precision: precision), min: lower, max: upper)
            }
        )
    }

    private func commit() {
        guard let text = draft else { return }
        if isOptional {
            value = StanceNumberFieldLogic.commitOptional(text, min: lower, max: upper, precision: precision, locale: locale)
        } else if let current = value {
            value = StanceNumberFieldLogic.commit(text, fallback: current, min: lower, max: upper, precision: precision, locale: locale)
        }
        draft = nil
    }

    /// The number with its prefix and suffix, or a localised "Empty".
    private var accessibilityValue: String {
        let text = draft ?? formatted
        guard !text.isEmpty else { return stanceString("stance.number.empty", locale) }
        return [prefix, text, suffix].compactMap { $0 }.joined(separator: " ")
    }

    public var body: some View {
        StanceFormField(label, helper: helper, error: error, isRequired: isRequired) {
            HStack(spacing: StanceSpacing.sm) {
                HStack(spacing: StanceSpacing.xs) {
                    if let prefix { Text(prefix).foregroundStyle(theme.colors.fgMuted).accessibilityHidden(true) }
                    TextField("", text: Binding(get: { draft ?? formatted }, set: { draft = $0 }), prompt: placeholder.map { Text($0).foregroundStyle(theme.colors.fgSubtle) })
                        .focused($focused)
                        .monospacedDigit()
                        .autocorrectionDisabled()
                        #if os(iOS)
                        .keyboardType(precision > 0 || (lower ?? 0) < 0 ? .numbersAndPunctuation : .numberPad)
                        #endif
                        .submitLabel(.done)
                        .onSubmit(commit)
                        .frame(minHeight: StanceSize.touchTarget)
                        .accessibilityValue(accessibilityValue)
                    if let suffix { Text(suffix).foregroundStyle(theme.colors.fgMuted).accessibilityHidden(true) }
                }
                .modifier(StanceFieldChrome(isFocused: focused, isInvalid: !(error ?? "").isEmpty))
                .contentShape(Rectangle())
                .onTapGesture { focused = true }
                Stepper(
                    value: stepperValue,
                    in: (lower ?? -Double.greatestFiniteMagnitude) ... (upper ?? Double.greatestFiniteMagnitude),
                    step: step
                ) {
                    Text(label)
                }
                .labelsHidden()
                .tint(theme.colors.accentBg)
                .accessibilityLabel(label)
                .accessibilityValue(accessibilityValue)
            }
            .onChange(of: focused) { _, isFocused in
                if !isFocused { commit() }
            }
        }
    }
}

// MARK: Localised labels

extension StanceNumberField {
    /// Creates a number field whose label is looked up in the app's string tables.
    public init(
        _ labelKey: LocalizedStringResource,
        value: Binding<Double>,
        min: Double? = nil,
        max: Double? = nil,
        step: Double = 1,
        precision: Int = 0,
        prefix: String? = nil,
        suffix: String? = nil,
        helper: String? = nil,
        error: String? = nil,
        isRequired: Bool = false
    ) {
        self.init(
            String(localized: labelKey), value: value, min: min, max: max, step: step, precision: precision,
            prefix: prefix, suffix: suffix, helper: helper, error: error, isRequired: isRequired
        )
    }

    /// Creates a number field that may be empty, whose label is looked up in the app's string tables.
    public init(
        _ labelKey: LocalizedStringResource,
        value: Binding<Double?>,
        min: Double? = nil,
        max: Double? = nil,
        step: Double = 1,
        precision: Int = 0,
        prefix: String? = nil,
        suffix: String? = nil,
        placeholder: String? = nil,
        helper: String? = nil,
        error: String? = nil,
        isRequired: Bool = false
    ) {
        self.init(
            String(localized: labelKey), value: value, min: min, max: max, step: step, precision: precision,
            prefix: prefix, suffix: suffix, placeholder: placeholder, helper: helper, error: error, isRequired: isRequired
        )
    }
}
