import Charts
import SwiftUI

/// One value in a ``StanceChartSeries``.
public struct StanceChartPoint: Identifiable, Hashable, Sendable {
    /// The category on the horizontal axis, such as a month.
    public let category: String
    public let value: Double
    public var id: String { category }

    public init(_ category: String, _ value: Double) {
        self.category = category
        self.value = value
    }
}

/// A named set of values drawn as one line, set of bars or area.
public struct StanceChartSeries: Identifiable, Hashable, Sendable {
    public let id: String
    public let label: String
    public let points: [StanceChartPoint]

    /// - Parameters:
    ///   - label: The name shown in the legend and read by VoiceOver.
    ///   - id: A stable identifier. Defaults to the label.
    ///   - points: Values in category order.
    public init(_ label: String, id: String? = nil, points: [StanceChartPoint]) {
        self.label = label
        self.id = id ?? label
        self.points = points
    }
}

/// The mark a ``StanceChart`` draws.
public enum StanceChartKind: String, CaseIterable, Sendable {
    case line, bar, area
}

/// Words a ``StanceChart`` uses. Leave a value out to keep the localised default.
public struct StanceChartLabels: Sendable {
    public var showTable: String?
    public var showChart: String?
    public var category: String?
    public var value: String?

    /// - Parameters:
    ///   - showTable: The toggle that shows the data as a table. Defaults to a localised "View as table".
    ///   - showChart: The toggle back to the chart. Defaults to a localised "View as chart".
    ///   - category: The horizontal axis and first table column. Defaults to a localised "Category".
    ///   - value: The vertical axis. Defaults to a localised "Value".
    public init(showTable: String? = nil, showChart: String? = nil, category: String? = nil, value: String? = nil) {
        self.showTable = showTable
        self.showChart = showChart
        self.category = category
        self.value = value
    }
}

/// A titled line, bar or area chart drawn with Swift Charts.
///
/// Series use the theme's chart colours, the ink scale, so a chart never adds new hues. Lines
/// also differ by symbol and dash, so series can be told apart without colour. VoiceOver reads
/// a summary in words, and the chart provides an accessibility chart descriptor, so Audio Graphs
/// can play it. A toggle shows the same data as a table, as the web chart container does.
public struct StanceChart: View {
    private let title: String
    private let description: String?
    private let kind: StanceChartKind
    private let series: [StanceChartSeries]
    private let format: (Double) -> String
    private let showsLegend: Bool
    private let allowsTable: Bool
    private let height: CGFloat
    private let labels: StanceChartLabels
    @State private var showsTable = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @ScaledMetric(relativeTo: .body) private var scale: CGFloat = 1

    /// - Parameters:
    ///   - title: The heading above the chart.
    ///   - description: Optional text under the title explaining what the chart shows.
    ///   - kind: Line, bar or area.
    ///   - series: The data. Up to five series get distinct chart colours.
    ///   - format: Formats a value for the axis, the table and VoiceOver. Defaults to a localised number.
    ///   - showsLegend: Shows the legend. It is hidden for a single series.
    ///   - allowsTable: Shows the "View as table" toggle.
    ///   - height: The plot height at the default text size. It grows with Dynamic Type.
    ///   - labels: Replacements for the built in words.
    @_disfavoredOverload
    public init(
        _ title: String,
        description: String? = nil,
        kind: StanceChartKind = .line,
        series: [StanceChartSeries],
        format: ((Double) -> String)? = nil,
        showsLegend: Bool = true,
        allowsTable: Bool = true,
        height: CGFloat = StanceSize.controlLg * 5,
        labels: StanceChartLabels = .init()
    ) {
        self.title = title
        self.description = description
        self.kind = kind
        self.series = series
        self.format = format ?? { $0.formatted(.number) }
        self.showsLegend = showsLegend
        self.allowsTable = allowsTable
        self.height = height
        self.labels = labels
    }

    // MARK: Words

    /// The categories in first-seen order across all series.
    public nonisolated static func categories(_ series: [StanceChartSeries]) -> [String] {
        var seen = Set<String>()
        return series.flatMap(\.points).map(\.category).filter { seen.insert($0).inserted }
    }

    /// Describes the chart in words: its kind, size, and highest and lowest values.
    /// For example "Bar chart with 6 categories and 2 series. Highest: Sent in March, 1,284. Lowest: Failed in January, 3."
    public nonisolated static func summary(kind: StanceChartKind, series: [StanceChartSeries], locale: Locale = .current, format: (Double) -> String) -> String {
        let kindName = StanceLocalization.string(kind == .line ? "stance.chart.kind.line" : kind == .bar ? "stance.chart.kind.bar" : "stance.chart.kind.area", locale: locale)
        let categoryCount = StanceLocalization.string("stance.chart.categories \(categories(series).count)", locale: locale)
        let seriesCount = StanceLocalization.string("stance.chart.series \(series.count)", locale: locale)
        var parts = [StanceLocalization.string("stance.chart.summary \(kindName) \(categoryCount) \(seriesCount)", locale: locale)]
        let all = series.flatMap { s in s.points.map { (series: s.label, point: $0) } }
        func name(_ entry: (series: String, point: StanceChartPoint)) -> String {
            series.count > 1 ? StanceLocalization.string("stance.chart.point \(entry.series) \(entry.point.category)", locale: locale) : entry.point.category
        }
        if let high = all.max(by: { $0.point.value < $1.point.value }), let low = all.min(by: { $0.point.value < $1.point.value }) {
            parts.append(StanceLocalization.string("stance.chart.highest \(name(high)) \(format(high.point.value))", locale: locale))
            if all.count > 1 {
                parts.append(StanceLocalization.string("stance.chart.lowest \(name(low)) \(format(low.point.value))", locale: locale))
            }
        }
        return parts.joined(separator: " ")
    }

    // MARK: View

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.sm) {
                VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                    Text(title).stanceText(.subheading).accessibilityAddTraits(.isHeader)
                    if let description { Text(description).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted) }
                }
                Spacer(minLength: 0)
            }
            if allowsTable {
                Button(showsTable ? labels.showChart ?? stanceString("stance.chart.showChart", locale) : labels.showTable ?? stanceString("stance.chart.showTable", locale)) {
                    showsTable.toggle()
                }
                .buttonStyle(.stance(.link, size: .small))
            }
            if showsTable { table } else { chart }
        }
        .stanceCard()
    }

    private var categoryTitle: String { labels.category ?? stanceString("stance.chart.category", locale) }
    private var valueTitle: String { labels.value ?? stanceString("stance.chart.value", locale) }
    private var seriesTitle: String { stanceString("stance.chart.seriesAxis", locale) }

    private var palette: [Color] {
        [theme.colors.chart1, theme.colors.chart2, theme.colors.chart3, theme.colors.chart4, theme.colors.chart5]
    }

    private var dashes: [StrokeStyle] {
        let width = StanceSpacing.xxs
        return [
            StrokeStyle(lineWidth: width, lineCap: .round),
            StrokeStyle(lineWidth: width, lineCap: .round, dash: [StanceSpacing.s1_5, StanceSpacing.xs]),
            StrokeStyle(lineWidth: width, lineCap: .round, dash: [StanceSpacing.xxs, StanceSpacing.xs]),
            StrokeStyle(lineWidth: width, lineCap: .round, dash: [StanceSpacing.md, StanceSpacing.xs, StanceSpacing.xxs, StanceSpacing.xs]),
            StrokeStyle(lineWidth: width, lineCap: .round, dash: [StanceSpacing.sm, StanceSpacing.sm]),
        ]
    }

    private var chart: some View {
        let names = series.map(\.label)
        let colors = names.indices.map { palette[$0 % palette.count] }
        let symbols: [BasicChartSymbolShape] = [.circle, .square, .triangle, .diamond, .pentagon]
        return Chart {
            ForEach(series) { s in
                ForEach(s.points) { point in
                    if kind == .bar {
                        BarMark(x: .value(categoryTitle, point.category), y: .value(valueTitle, point.value))
                            .foregroundStyle(by: .value(seriesTitle, s.label))
                            .position(by: .value(seriesTitle, s.label))
                            .cornerRadius(StanceRadius.xs)
                    } else if kind == .area {
                        AreaMark(x: .value(categoryTitle, point.category), y: .value(valueTitle, point.value))
                            .foregroundStyle(by: .value(seriesTitle, s.label))
                            .opacity(series.count > 1 ? StanceMotion.pulseRestOpacity : 1)
                        LineMark(x: .value(categoryTitle, point.category), y: .value(valueTitle, point.value))
                            .foregroundStyle(by: .value(seriesTitle, s.label))
                            .lineStyle(by: .value(seriesTitle, s.label))
                    } else {
                        LineMark(x: .value(categoryTitle, point.category), y: .value(valueTitle, point.value))
                            .foregroundStyle(by: .value(seriesTitle, s.label))
                            .symbol(by: .value(seriesTitle, s.label))
                            .lineStyle(by: .value(seriesTitle, s.label))
                    }
                }
            }
        }
        .chartForegroundStyleScale(domain: names, range: colors)
        .chartSymbolScale(domain: names, range: names.indices.map { symbols[$0 % symbols.count] })
        .chartLineStyleScale(domain: names, range: names.indices.map { dashes[$0 % dashes.count] })
        .chartLegend(showsLegend && series.count > 1 ? .visible : .hidden)
        .chartXAxis {
            AxisMarks { _ in
                AxisValueLabel().foregroundStyle(theme.colors.fgMuted)
            }
        }
        .chartYAxis {
            AxisMarks { value in
                AxisGridLine().foregroundStyle(theme.colors.separator)
                AxisValueLabel {
                    if let number = value.as(Double.self) { Text(format(number)) }
                }
                .foregroundStyle(theme.colors.fgMuted)
            }
        }
        .frame(height: height * scale)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(title)
        .accessibilityValue(Self.summary(kind: kind, series: series, locale: locale, format: format))
        .accessibilityChartDescriptor(StanceChartDescriptor(title: title, summary: Self.summary(kind: kind, series: series, locale: locale, format: format), categoryTitle: categoryTitle, valueTitle: valueTitle, series: series, locale: locale))
    }

    private var table: some View {
        let categories = Self.categories(series)
        return ScrollView(.horizontal) {
            Grid(alignment: .leading, horizontalSpacing: StanceSpacing.lg, verticalSpacing: StanceSpacing.sm) {
                GridRow {
                    Text(categoryTitle).stanceText(.label)
                    ForEach(series) { Text($0.label).stanceText(.label).gridColumnAlignment(.trailing) }
                }
                .accessibilityAddTraits(.isHeader)
                Divider().gridCellUnsizedAxes(.horizontal).overlay(theme.colors.separator)
                ForEach(categories, id: \.self) { category in
                    GridRow {
                        Text(category).stanceText(.bodySmall)
                        ForEach(series) { s in
                            Text(s.points.first { $0.category == category }.map { format($0.value) } ?? "").stanceText(.bodySmall).monospacedDigit()
                        }
                    }
                    .accessibilityElement(children: .combine)
                }
            }
            .padding(.vertical, StanceSpacing.xs)
        }
    }
}

/// The chart as data for assistive technology, so VoiceOver users can explore it with Audio Graphs.
struct StanceChartDescriptor: AXChartDescriptorRepresentable {
    let title: String
    let summary: String
    let categoryTitle: String
    let valueTitle: String
    let series: [StanceChartSeries]
    let locale: Locale

    func makeChartDescriptor() -> AXChartDescriptor {
        let values = series.flatMap(\.points).map(\.value)
        let low = min(values.min() ?? 0, 0)
        let high = max(values.max() ?? 1, low + 1)
        let locale = locale
        let xAxis = AXCategoricalDataAxisDescriptor(title: categoryTitle, categoryOrder: StanceChart.categories(series))
        let yAxis = AXNumericDataAxisDescriptor(title: valueTitle, range: low ... high, gridlinePositions: []) { $0.formatted(.number.locale(locale)) }
        let data = series.map { s in
            AXDataSeriesDescriptor(name: s.label, isContinuous: true, dataPoints: s.points.map { AXDataPoint(x: $0.category, y: $0.value) })
        }
        return AXChartDescriptor(title: title, summary: summary, xAxis: xAxis, yAxis: yAxis, additionalAxes: [], series: data)
    }
}

// MARK: Localised labels

extension StanceChart {
    /// Creates a chart whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        description: String? = nil,
        kind: StanceChartKind = .line,
        series: [StanceChartSeries],
        format: ((Double) -> String)? = nil,
        showsLegend: Bool = true,
        allowsTable: Bool = true,
        height: CGFloat = StanceSize.controlLg * 5,
        labels: StanceChartLabels = .init()
    ) {
        self.init(String(localized: titleKey), description: description, kind: kind, series: series, format: format, showsLegend: showsLegend, allowsTable: allowsTable, height: height, labels: labels)
    }
}
