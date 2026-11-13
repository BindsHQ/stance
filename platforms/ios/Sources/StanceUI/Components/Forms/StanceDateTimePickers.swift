import SwiftUI

/// A named range offered as a shortcut in a ``StanceDateRangePicker``, such as "Last 7 days".
public struct StanceDateRangePreset: Identifiable {
    public let title: String
    public let range: ClosedRange<Date>
    public var id: String { title }

    /// - Parameters:
    ///   - title: The menu item's text, shown as written.
    ///   - range: The dates the preset chooses.
    @_disfavoredOverload
    public init(_ title: String, range: ClosedRange<Date>) {
        self.title = title
        self.range = range
    }
}

/// The rules of a ``StanceDateRangePicker``, exposed for apps and tests.
public enum StanceDateRangeLogic {
    /// The range after choosing a new start. When the start passes the end, the end moves with it,
    /// so the range always stays valid.
    public nonisolated static func settingStart(_ start: Date, in range: ClosedRange<Date>) -> ClosedRange<Date> {
        start ... max(start, range.upperBound)
    }

    /// The range after choosing a new end. An end before the start is moved up to the start.
    public nonisolated static func settingEnd(_ end: Date, in range: ClosedRange<Date>) -> ClosedRange<Date> {
        range.lowerBound ... max(end, range.lowerBound)
    }

    /// How many calendar days the range covers, counting both the first and the last day.
    public nonisolated static func dayCount(_ range: ClosedRange<Date>, calendar: Calendar = .current) -> Int {
        let start = calendar.startOfDay(for: range.lowerBound)
        let end = calendar.startOfDay(for: range.upperBound)
        return (calendar.dateComponents([.day], from: start, to: end).day ?? 0) + 1
    }
}

/// A start and an end date, picked with two system `DatePicker`s, with the range summarised
/// in words below them.
///
/// The end date can never be before the start date. Optional presets offer common ranges from a
/// system `Menu`. VoiceOver reads each picker by name and the summary as one line.
public struct StanceDateRangePicker: View {
    private let label: String
    private let bounds: ClosedRange<Date>?
    private let presets: [StanceDateRangePreset]
    private let startLabel: String?
    private let endLabel: String?
    private let helper: String?
    @Binding private var range: ClosedRange<Date>
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.calendar) private var calendar
    @Environment(\.timeZone) private var timeZone

    /// - Parameters:
    ///   - label: The visible heading and the accessible name of the group.
    ///   - range: The chosen dates.
    ///   - bounds: The earliest and latest dates that can be chosen, if limited.
    ///   - presets: Shortcuts offered in a menu, such as "Last 30 days".
    ///   - startLabel: The first picker's label. Defaults to a localised "Start".
    ///   - endLabel: The second picker's label. Defaults to a localised "End".
    @_disfavoredOverload
    public init(
        _ label: String,
        range: Binding<ClosedRange<Date>>,
        in bounds: ClosedRange<Date>? = nil,
        presets: [StanceDateRangePreset] = [],
        startLabel: String? = nil,
        endLabel: String? = nil,
        helper: String? = nil
    ) {
        self.label = label
        _range = range
        self.bounds = bounds
        self.presets = presets
        self.startLabel = startLabel
        self.endLabel = endLabel
        self.helper = helper
    }

    private var summary: String {
        var calendar = calendar
        calendar.timeZone = timeZone
        let days = StanceDateRangeLogic.dayCount(range, calendar: calendar)
        let style = Date.IntervalFormatStyle(date: .abbreviated, time: .omitted, locale: locale, calendar: calendar, timeZone: timeZone)
        let span = calendar.isDate(range.lowerBound, inSameDayAs: range.upperBound)
            ? range.lowerBound.formatted(.dateTime.day().month(.abbreviated).year().locale(locale))
            : style.format(range.lowerBound ..< range.upperBound)
        return stanceString("stance.dateRange.summary \(span) \(stanceString("stance.dateRange.days \(days)", locale))", locale)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.xs) {
            HStack(alignment: .firstTextBaseline) {
                Text(label).stanceText(.label).accessibilityAddTraits(.isHeader)
                Spacer(minLength: StanceSpacing.sm)
                if !presets.isEmpty {
                    Menu {
                        ForEach(presets) { preset in
                            Button(preset.title) { range = preset.range }
                        }
                    } label: {
                        Text(stanceString("stance.dateRange.presets", locale)).stanceText(.label)
                    }
                    .frame(minHeight: StanceSize.touchTarget)
                }
            }
            picker(startLabel ?? stanceString("stance.dateRange.start", locale), selection: Binding(
                get: { range.lowerBound },
                set: { range = StanceDateRangeLogic.settingStart($0, in: range) }
            ), in: bounds)
            StanceDivider()
            picker(endLabel ?? stanceString("stance.dateRange.end", locale), selection: Binding(
                get: { range.upperBound },
                set: { range = StanceDateRangeLogic.settingEnd($0, in: range) }
            ), in: range.lowerBound ... (bounds?.upperBound ?? Date.distantFuture))
            StanceDivider()
            Text(summary)
                .stanceText(.bodySmall)
                .foregroundStyle(theme.colors.fgMuted)
                .padding(.top, StanceSpacing.xs)
            if let helper { Text(helper).stanceText(.caption).foregroundStyle(theme.colors.fgMuted) }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    private func picker(_ title: String, selection: Binding<Date>, in limits: ClosedRange<Date>?) -> some View {
        Group {
            if let limits {
                DatePicker(title, selection: selection, in: limits, displayedComponents: .date)
            } else {
                DatePicker(title, selection: selection, displayedComponents: .date)
            }
        }
        .stanceText(.body)
        .tint(theme.colors.accentBg)
        .frame(minHeight: StanceSize.touchTarget)
    }
}

/// How a ``StanceTimePicker`` shows the time.
public enum StanceTimePickerStyle: Sendable {
    /// A compact button that opens the system time editor. The default.
    case compact
    /// The system wheels, always visible.
    case wheel
}

/// A labelled time of day, built on the system `DatePicker` with `.hourAndMinute`.
///
/// The hour cycle (12 or 24 hours) and the digits follow the locale, as every system time
/// picker does. VoiceOver reads the label and the time.
public struct StanceTimePicker: View {
    private let label: String
    private let style: StanceTimePickerStyle
    private let range: ClosedRange<Date>?
    private let helper: String?
    @Binding private var time: Date
    @Environment(\.stanceTheme) private var theme

    /// - Parameters:
    ///   - label: The visible label and accessible name.
    ///   - selection: The chosen time. Only the hour and minute are changed.
    ///   - range: The earliest and latest times, if limited.
    ///   - style: Compact by default, or wheels.
    @_disfavoredOverload
    public init(_ label: String, selection: Binding<Date>, in range: ClosedRange<Date>? = nil, style: StanceTimePickerStyle = .compact, helper: String? = nil) {
        self.label = label
        _time = selection
        self.range = range
        self.style = style
        self.helper = helper
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.s1_5) {
            switch style {
            case .compact:
                picker.datePickerStyle(.compact).frame(minHeight: StanceSize.touchTarget)
            case .wheel:
                Text(label).stanceText(.label).accessibilityHidden(true)
                #if os(iOS)
                picker.datePickerStyle(.wheel).labelsHidden().frame(maxWidth: .infinity)
                #else
                picker.labelsHidden()
                #endif
            }
            if let helper { Text(helper).stanceText(.caption).foregroundStyle(theme.colors.fgMuted) }
        }
    }

    private var picker: some View {
        Group {
            if let range {
                DatePicker(label, selection: $time, in: range, displayedComponents: .hourAndMinute)
            } else {
                DatePicker(label, selection: $time, displayedComponents: .hourAndMinute)
            }
        }
        .stanceText(.label)
        .tint(theme.colors.accentBg)
    }
}

// MARK: Localised labels

extension StanceDateRangePicker {
    /// Creates a date range picker whose label is looked up in the app's string tables.
    public init(
        _ labelKey: LocalizedStringResource,
        range: Binding<ClosedRange<Date>>,
        in bounds: ClosedRange<Date>? = nil,
        presets: [StanceDateRangePreset] = [],
        startLabel: String? = nil,
        endLabel: String? = nil,
        helper: String? = nil
    ) {
        self.init(String(localized: labelKey), range: range, in: bounds, presets: presets, startLabel: startLabel, endLabel: endLabel, helper: helper)
    }
}

extension StanceDateRangePreset {
    /// Creates a preset whose title is looked up in the app's string tables.
    public init(_ titleKey: LocalizedStringResource, range: ClosedRange<Date>) {
        self.init(String(localized: titleKey), range: range)
    }
}

extension StanceTimePicker {
    /// Creates a time picker whose label is looked up in the app's string tables.
    public init(_ labelKey: LocalizedStringResource, selection: Binding<Date>, in range: ClosedRange<Date>? = nil, style: StanceTimePickerStyle = .compact, helper: String? = nil) {
        self.init(String(localized: labelKey), selection: selection, in: range, style: style, helper: helper)
    }
}
