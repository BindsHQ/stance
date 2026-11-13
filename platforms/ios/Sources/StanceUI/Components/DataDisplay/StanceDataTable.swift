import SwiftUI

/// How a ``StanceTableColumn`` aligns its values.
public enum StanceTableAlignment: Sendable {
    /// Text and identifiers. Follows the reading direction.
    case leading
    /// Numbers and amounts, so digits line up.
    case trailing
}

/// One column of a ``StanceDataTable``.
public struct StanceTableColumn<Row>: Identifiable {
    public let id: String
    public let title: String
    public let alignment: StanceTableAlignment
    /// Whether people can sort by this column.
    public let isSortable: Bool
    let value: (Row) -> String
    let areInIncreasingOrder: (Row, Row) -> Bool

    /// A column whose values sort as text, the way Finder sorts names ("Item 2" before "Item 10").
    /// - Parameters:
    ///   - title: The header.
    ///   - id: A stable identifier. Defaults to the title.
    ///   - alignment: `.trailing` for numbers.
    ///   - isSortable: Whether the column can be sorted.
    ///   - value: The text shown in a cell.
    @_disfavoredOverload
    public init(_ title: String, id: String? = nil, alignment: StanceTableAlignment = .leading, isSortable: Bool = true, value: @escaping (Row) -> String) {
        self.title = title
        self.id = id ?? title
        self.alignment = alignment
        self.isSortable = isSortable
        self.value = value
        areInIncreasingOrder = { value($0).localizedStandardCompare(value($1)) == .orderedAscending }
    }

    /// A column shown as text but sorted by an underlying comparable value, such as a date or a count.
    /// - Parameters:
    ///   - title: The header.
    ///   - id: A stable identifier. Defaults to the title.
    ///   - alignment: `.trailing` for numbers.
    ///   - value: The text shown in a cell.
    ///   - sortValue: The value the column sorts by.
    public init<Value: Comparable>(_ title: String, id: String? = nil, alignment: StanceTableAlignment = .leading, value: @escaping (Row) -> String, sortValue: @escaping (Row) -> Value) {
        self.title = title
        self.id = id ?? title
        self.alignment = alignment
        isSortable = true
        self.value = value
        areInIncreasingOrder = { sortValue($0) < sortValue($1) }
    }
}

/// The column a ``StanceDataTable`` is sorted by, and the direction.
public struct StanceTableSort: Equatable, Hashable, Sendable {
    public var column: String
    public var ascending: Bool

    /// - Parameters:
    ///   - column: The `id` of a ``StanceTableColumn``.
    ///   - ascending: Smallest first when `true`.
    public init(column: String, ascending: Bool = true) {
        self.column = column
        self.ascending = ascending
    }
}

/// Words a ``StanceDataTable`` uses. Leave a value out to keep the localised default.
public struct StanceDataTableLabels: Sendable {
    public var sortBy: String?
    public var empty: String?

    /// - Parameters:
    ///   - sortBy: The sort menu in the compact layout. Defaults to a localised "Sort by".
    ///   - empty: Shown when there are no rows. Defaults to a localised "Nothing to show".
    public init(sortBy: String? = nil, empty: String? = nil) {
        self.sortBy = sortBy
        self.empty = empty
    }
}

/// Rows people scan, compare, sort and select, such as organisation users or deployments.
///
/// In regular width (iPad, Mac) this is the system `Table`, with sortable column headers and
/// multiple selection. In compact width, where a table cannot show its columns, each row becomes
/// a card in a `List` with every column as a labelled value, and a sort menu replaces the
/// headers. VoiceOver reads each card as one element with column names and values.
///
/// The system `Table` can only take a dynamic list of columns from iOS 17.4. On iOS 17.0 to 17.3
/// regular width gets a table all the same: a lazy stack with a pinned header row, sortable
/// headers, selection and the same VoiceOver wording, so no iPad falls back to cards.
///
/// Pass rows in any order: the table sorts them by `sort`.
public struct StanceDataTable<Row: Identifiable>: View {
    /// Which layout to use.
    public enum Layout: Sendable {
        /// A table in regular width and cards in compact width.
        case automatic
        /// Always a table: the system `Table` on iOS 17.4 or later, the grid table before that.
        case table
        /// Always the grid table that iOS 17.0 to 17.3 use in regular width: a lazy stack with a
        /// pinned header. Useful where the system table's own chrome is not wanted.
        case grid
        /// Always cards.
        case list
    }

    private let title: String?
    private let rows: [Row]
    private let columns: [StanceTableColumn<Row>]
    private let layout: Layout
    private let labels: StanceDataTableLabels
    private let externalSelection: Binding<Set<Row.ID>>?
    @Binding private var sort: StanceTableSort?
    @State private var internalSelection = Set<Row.ID>()
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.horizontalSizeClass) private var sizeClass

    /// - Parameters:
    ///   - title: An optional accessible name for the table.
    ///   - rows: The rows, in any order.
    ///   - columns: The columns. The first column titles each card in the compact layout.
    ///   - sort: The current sort, or `nil` to keep the given order.
    ///   - selection: Selected row identifiers. Leave out for a table without selection.
    ///   - layout: The layout. `.automatic` follows the size class.
    ///   - labels: Replacements for the built in words.
    @_disfavoredOverload
    public init(
        _ title: String? = nil,
        rows: [Row],
        columns: [StanceTableColumn<Row>],
        sort: Binding<StanceTableSort?> = .constant(nil),
        selection: Binding<Set<Row.ID>>? = nil,
        layout: Layout = .automatic,
        labels: StanceDataTableLabels = .init()
    ) {
        self.title = title
        self.rows = rows
        self.columns = columns
        _sort = sort
        externalSelection = selection
        self.layout = layout
        self.labels = labels
    }

    /// The rows in display order for a sort. Rows that compare equal keep their given order.
    public nonisolated static func sorted(_ rows: [Row], columns: [StanceTableColumn<Row>], by sort: StanceTableSort?) -> [Row] {
        guard let sort, let column = columns.first(where: { $0.id == sort.column }), column.isSortable else { return rows }
        return rows.enumerated().sorted { a, b in
            if column.areInIncreasingOrder(a.element, b.element) { return sort.ascending }
            if column.areInIncreasingOrder(b.element, a.element) { return !sort.ascending }
            return a.offset < b.offset
        }
        .map(\.element)
    }

    /// The sort after a header is chosen: the same column flips direction, a new column starts ascending.
    public nonisolated static func toggled(_ sort: StanceTableSort?, column: String) -> StanceTableSort {
        guard let sort, sort.column == column else { return StanceTableSort(column: column) }
        return StanceTableSort(column: column, ascending: !sort.ascending)
    }

    private var selection: Binding<Set<Row.ID>> { externalSelection ?? $internalSelection }
    private var displayed: [Row] { Self.sorted(rows, columns: columns, by: sort) }

    public var body: some View {
        Group {
            if rows.isEmpty {
                StanceEmptyState(icon: .inbox, title: labels.empty ?? stanceString("stance.table.empty", locale), message: "")
            } else if layout == .grid {
                gridTable
            } else if useTable {
                if #available(iOS 17.4, macOS 14.4, *) {
                    StanceSystemTable(rows: displayed, columns: columns, sort: $sort, selection: selection, allowsSelection: externalSelection != nil)
                } else {
                    gridTable
                }
            } else {
                cards
            }
        }
        .accessibilityLabel(title ?? "")
    }

    private var useTable: Bool {
        switch layout {
        case .automatic: sizeClass == .regular
        case .table, .grid: true
        case .list: false
        }
    }

    private var gridTable: some View {
        StanceGridTable(rows: displayed, columns: columns, sort: $sort, selection: selection, allowsSelection: externalSelection != nil)
    }

    // MARK: Compact layout

    private var cards: some View {
        List {
            if columns.contains(where: \.isSortable) {
                sortMenu.listRowBackground(Color.clear).listRowSeparator(.hidden)
            }
            ForEach(displayed) { row in
                card(row).stanceListRow()
            }
        }
        .stanceListStyle()
    }

    private var sortMenu: some View {
        HStack {
            Spacer(minLength: 0)
            Menu {
                ForEach(columns.filter(\.isSortable)) { column in
                    Button {
                        sort = Self.toggled(sort, column: column.id)
                        StanceHaptics.selection()
                    } label: {
                        if sort?.column == column.id {
                            Label(column.title, systemImage: sort?.ascending == true ? "chevron.up" : "chevron.down")
                        } else {
                            Text(column.title)
                        }
                    }
                }
            } label: {
                HStack(spacing: StanceSpacing.xs) {
                    StanceIcon(.arrowsUpDown, size: StanceSize.iconSm)
                    Text(sortTitle)
                }
            }
            .buttonStyle(.stance(.ghost, size: .small))
            .accessibilityValue(sortValue)
        }
    }

    private var sortTitle: String {
        let base = labels.sortBy ?? stanceString("stance.table.sortBy", locale)
        guard let sort, let column = columns.first(where: { $0.id == sort.column }) else { return base }
        return "\(base): \(column.title)"
    }

    private var sortValue: String {
        guard let sort else { return "" }
        return stanceString(sort.ascending ? "stance.table.ascending" : "stance.table.descending", locale)
    }

    private func card(_ row: Row) -> some View {
        let selected = selection.wrappedValue.contains(row.id)
        let primary = columns.first
        let rest = columns.dropFirst()
        return Button {
            guard externalSelection != nil else { return }
            if selected { selection.wrappedValue.remove(row.id) } else { selection.wrappedValue.insert(row.id) }
            StanceHaptics.selection()
        } label: {
            HStack(alignment: .top, spacing: StanceSpacing.md) {
                if externalSelection != nil {
                    StanceIcon(selected ? .checkCircle : .circle, size: StanceSize.iconMd)
                        .foregroundStyle(selected ? theme.colors.accentBg : theme.colors.borderControl)
                        .padding(.top, StanceSpacing.xxs)
                }
                VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                    if let primary { Text(primary.value(row)).stanceText(.label) }
                    StanceDescriptionList(rest.map { ($0.title, $0.value(row)) })
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, StanceSpacing.xs)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(columns.map { "\($0.title): \($0.value(row))" }.joined(separator: ", "))
        .accessibilityAddTraits(externalSelection == nil ? [] : selected ? [.isButton, .isSelected] : .isButton)
    }
}

/// Sorts table rows by one ``StanceTableColumn``, so the system `Table` headers can drive the sort.
struct StanceTableComparator<Row>: SortComparator, @unchecked Sendable {
    let columnID: String
    let compare: (Row, Row) -> Bool
    var order: SortOrder

    func compare(_ lhs: Row, _ rhs: Row) -> ComparisonResult {
        let forward: ComparisonResult = compare(lhs, rhs) ? .orderedAscending : compare(rhs, lhs) ? .orderedDescending : .orderedSame
        guard order == .reverse else { return forward }
        return forward == .orderedAscending ? .orderedDescending : forward == .orderedDescending ? .orderedAscending : .orderedSame
    }

    static func == (lhs: Self, rhs: Self) -> Bool { lhs.columnID == rhs.columnID && lhs.order == rhs.order }
    func hash(into hasher: inout Hasher) {
        hasher.combine(columnID)
        hasher.combine(order == .forward)
    }
}

// MARK: Grid table (iOS 17.0 to 17.3)

/// How every row of a table is selected, for the select all control.
public enum StanceTableSelectionState: String, CaseIterable, Sendable {
    case none, some, all
}

/// The layout and wording rules of the table ``StanceDataTable`` draws where the system `Table`
/// cannot take dynamic columns (iOS 17.0 to 17.3). Exposed for apps and tests.
public enum StanceGridTableModel {
    /// Column widths that fill `available`.
    ///
    /// Every column gets at least `minimum`. Space left over is shared in proportion to
    /// `weights`, so a column of long names is wider than a column of counts. When the minimums
    /// alone are wider than `available`, the table is wider than its container and scrolls.
    public nonisolated static func columnWidths(weights: [Double], available: CGFloat, minimum: CGFloat) -> [CGFloat] {
        guard !weights.isEmpty else { return [] }
        let spare = Swift.max(0, available - minimum * CGFloat(weights.count))
        let total = weights.reduce(0) { $0 + Swift.max($1, 0) }
        return weights.map { weight in
            minimum + (total > 0 ? spare * CGFloat(Swift.max(weight, 0) / total) : spare / CGFloat(weights.count))
        }
    }

    /// How much room each column wants: the length of its header or its longest value, capped so
    /// one long cell cannot starve the others.
    public nonisolated static func weights<Row>(rows: [Row], columns: [StanceTableColumn<Row>], cap: Int = 32) -> [Double] {
        columns.map { column in
            let longest = rows.reduce(column.title.count) { Swift.max($0, column.value($1).count) }
            return Double(Swift.min(longest, cap))
        }
    }

    /// What VoiceOver says for a header: "Ascending", "Descending" or "Not sorted".
    public nonisolated static func sortDescription(column: String, sort: StanceTableSort?, locale: Locale = .current) -> String {
        guard let sort, sort.column == column else { return StanceLocalization.string("stance.table.notSorted", locale: locale) }
        return StanceLocalization.string(sort.ascending ? "stance.table.ascending" : "stance.table.descending", locale: locale)
    }

    /// What VoiceOver reads for a row: every column name with its value, in column order.
    public nonisolated static func rowLabel<Row>(_ row: Row, columns: [StanceTableColumn<Row>], locale: Locale = .current) -> String {
        columns.map { StanceLocalization.string("stance.table.cell \($0.title) \($0.value(row))", locale: locale) }.joined(separator: ", ")
    }

    /// Whether none, some or all of `rows` are selected.
    public nonisolated static func selectionState<ID: Hashable>(selection: Set<ID>, rows: [ID]) -> StanceTableSelectionState {
        let count = rows.filter(selection.contains).count
        return count == 0 ? .none : count == rows.count ? .all : .some
    }

    /// The selection after the select all control is pressed: everything, or nothing when
    /// everything was already selected. Selected rows that are not in `rows` are kept.
    public nonisolated static func togglingAll<ID: Hashable>(selection: Set<ID>, rows: [ID]) -> Set<ID> {
        selectionState(selection: selection, rows: rows) == .all ? selection.subtracting(rows) : selection.union(rows)
    }

    /// The selection after one row is pressed.
    public nonisolated static func toggling<ID: Hashable>(_ id: ID, in selection: Set<ID>) -> Set<ID> {
        var selection = selection
        if selection.contains(id) { selection.remove(id) } else { selection.insert(id) }
        return selection
    }
}

/// A table for regular width where the system `Table` cannot be used: a lazy stack of rows under
/// a pinned header. Headers sort, rows select, and VoiceOver hears headers as headers with their
/// sort direction and each row as its column names and values with its position.
private struct StanceGridTable<Row: Identifiable>: View {
    let rows: [Row]
    let columns: [StanceTableColumn<Row>]
    @Binding var sort: StanceTableSort?
    @Binding var selection: Set<Row.ID>
    let allowsSelection: Bool
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @ScaledMetric(relativeTo: .subheadline) private var minimumColumnWidth: CGFloat = StanceSize.controlLg * 2

    var body: some View {
        GeometryReader { geometry in
            let lead = allowsSelection ? StanceSize.touchTarget : 0
            let widths = StanceGridTableModel.columnWidths(
                weights: StanceGridTableModel.weights(rows: rows, columns: columns),
                available: geometry.size.width - lead,
                minimum: minimumColumnWidth
            )
            let total = widths.reduce(lead, +)
            ScrollView(.horizontal) {
                ScrollView(.vertical) {
                    LazyVStack(alignment: .leading, spacing: 0, pinnedViews: [.sectionHeaders]) {
                        Section {
                            ForEach(Array(rows.enumerated()), id: \.element.id) { index, row in
                                rowView(row, index: index, widths: widths)
                            }
                        } header: {
                            header(widths: widths)
                        }
                    }
                    .frame(width: total, alignment: .leading)
                }
                .frame(width: total, height: geometry.size.height)
            }
            .scrollBounceBehavior(.basedOnSize, axes: .horizontal)
        }
        .background(theme.colors.bgSurface)
        .clipShape(RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous).strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
        .accessibilityElement(children: .contain)
    }

    private func cellAlignment(_ column: StanceTableColumn<Row>) -> Alignment {
        column.alignment == .trailing ? .trailing : .leading
    }

    private func header(widths: [CGFloat]) -> some View {
        let ids = rows.map(\.id)
        let state = StanceGridTableModel.selectionState(selection: selection, rows: ids)
        return HStack(spacing: 0) {
            if allowsSelection {
                Button {
                    selection = StanceGridTableModel.togglingAll(selection: selection, rows: ids)
                    StanceHaptics.selection()
                } label: {
                    StanceIcon(state == .all ? .checkCircle : state == .some ? .minus : .circle, size: StanceSize.iconMd)
                        .foregroundStyle(state == .none ? theme.colors.borderControl : theme.colors.accentBg)
                        .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(stanceString("stance.table.selectAll", locale))
                .accessibilityAddTraits(state == .all ? [.isButton, .isSelected] : .isButton)
            }
            ForEach(Array(columns.enumerated()), id: \.element.id) { index, column in
                headerCell(column).frame(width: widths[index], alignment: cellAlignment(column))
            }
        }
        .frame(minHeight: StanceSize.touchTarget)
        .background(theme.colors.bgSubtle)
        .overlay(alignment: .bottom) { Rectangle().fill(theme.colors.borderDefault).frame(height: theme.borderWidth) }
    }

    @ViewBuilder private func headerCell(_ column: StanceTableColumn<Row>) -> some View {
        let active = sort?.column == column.id
        let title = Text(column.title).stanceText(.label).multilineTextAlignment(column.alignment == .trailing ? .trailing : .leading)
        if column.isSortable {
            Button {
                sort = StanceDataTable<Row>.toggled(sort, column: column.id)
                StanceHaptics.selection()
                StanceAnnouncer.announce(stanceString("stance.table.sorted \(column.title) \(StanceGridTableModel.sortDescription(column: column.id, sort: sort, locale: locale))", locale))
            } label: {
                HStack(spacing: StanceSpacing.xs) {
                    title
                    StanceIcon(active ? (sort?.ascending == true ? .arrowUp : .arrowDown) : .arrowsUpDown, size: StanceSize.iconSm)
                        .foregroundStyle(active ? theme.colors.fgDefault : theme.colors.fgSubtle)
                }
                .foregroundStyle(active ? theme.colors.fgDefault : theme.colors.fgMuted)
                .padding(.horizontal, StanceSpacing.md)
                .frame(minHeight: StanceSize.touchTarget)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(column.title)
            .accessibilityValue(StanceGridTableModel.sortDescription(column: column.id, sort: sort, locale: locale))
            .accessibilityAddTraits([.isHeader, .isButton])
        } else {
            title
                .foregroundStyle(theme.colors.fgMuted)
                .padding(.horizontal, StanceSpacing.md)
                .accessibilityAddTraits(.isHeader)
        }
    }

    private func rowView(_ row: Row, index: Int, widths: [CGFloat]) -> some View {
        let selected = selection.contains(row.id)
        return HStack(spacing: 0) {
            if allowsSelection {
                StanceIcon(selected ? .checkCircle : .circle, size: StanceSize.iconMd)
                    .foregroundStyle(selected ? theme.colors.accentBg : theme.colors.borderControl)
                    .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
            }
            ForEach(Array(columns.enumerated()), id: \.element.id) { column, definition in
                Text(definition.value(row))
                    .stanceText(.bodySmall)
                    .monospacedDigit()
                    .multilineTextAlignment(definition.alignment == .trailing ? .trailing : .leading)
                    .foregroundStyle(selected ? theme.colors.interactiveSelectedFg : theme.colors.fgDefault)
                    .padding(.horizontal, StanceSpacing.md)
                    .padding(.vertical, StanceSpacing.sm)
                    .frame(width: widths[column], alignment: cellAlignment(definition))
            }
        }
        .frame(minHeight: StanceSize.touchTarget)
        .background(selected ? theme.colors.interactiveSelected : theme.colors.bgSurface)
        .overlay(alignment: .bottom) { Rectangle().fill(theme.colors.separator).frame(height: theme.borderWidth) }
        .contentShape(Rectangle())
        .onTapGesture {
            guard allowsSelection else { return }
            selection = StanceGridTableModel.toggling(row.id, in: selection)
            StanceHaptics.selection()
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(StanceGridTableModel.rowLabel(row, columns: columns, locale: locale))
        .accessibilityValue(stanceString("stance.table.row \(index + 1) \(rows.count)", locale))
        .accessibilityAddTraits(!allowsSelection ? [] : selected ? [.isButton, .isSelected] : .isButton)
        .accessibilityAction {
            guard allowsSelection else { return }
            selection = StanceGridTableModel.toggling(row.id, in: selection)
        }
    }
}

/// The regular width layout: the system `Table` with one column per ``StanceTableColumn``.
@available(iOS 17.4, macOS 14.4, *)
private struct StanceSystemTable<Row: Identifiable>: View {
    let rows: [Row]
    let columns: [StanceTableColumn<Row>]
    @Binding var sort: StanceTableSort?
    @Binding var selection: Set<Row.ID>
    let allowsSelection: Bool
    @Environment(\.stanceTheme) private var theme

    private var sortOrder: Binding<[StanceTableComparator<Row>]> {
        Binding {
            guard let sort, let column = columns.first(where: { $0.id == sort.column }) else { return [] }
            return [StanceTableComparator(columnID: column.id, compare: column.areInIncreasingOrder, order: sort.ascending ? .forward : .reverse)]
        } set: { order in
            guard let first = order.first else { sort = nil; return }
            sort = StanceTableSort(column: first.columnID, ascending: first.order == .forward)
            StanceHaptics.selection()
        }
    }

    var body: some View {
        Table(of: Row.self, selection: allowsSelection ? $selection : .constant([]), sortOrder: sortOrder) {
            TableColumnForEach(columns) { column in
                TableColumn(column.title, sortUsing: StanceTableComparator(columnID: column.id, compare: column.areInIncreasingOrder, order: .forward)) { row in
                    Text(column.value(row))
                        .stanceText(.bodySmall)
                        .monospacedDigit()
                        .foregroundStyle(theme.colors.fgDefault)
                }
                .alignment(column.alignment == .trailing ? .trailing : .leading)
            }
        } rows: {
            ForEach(rows) { TableRow($0) }
        }
        .scrollContentBackground(.hidden)
        .background(theme.colors.bgSurface)
        .tint(theme.colors.accentBg)
    }
}

// MARK: Localised labels

extension StanceTableColumn {
    /// A text column whose header is looked up in the app's string tables.
    public init(_ titleKey: LocalizedStringResource, id: String? = nil, alignment: StanceTableAlignment = .leading, isSortable: Bool = true, value: @escaping (Row) -> String) {
        self.init(String(localized: titleKey), id: id, alignment: alignment, isSortable: isSortable, value: value)
    }
}

extension StanceDataTable {
    /// Creates a table whose accessible name is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        rows: [Row],
        columns: [StanceTableColumn<Row>],
        sort: Binding<StanceTableSort?> = .constant(nil),
        selection: Binding<Set<Row.ID>>? = nil,
        layout: Layout = .automatic,
        labels: StanceDataTableLabels = .init()
    ) {
        self.init(String(localized: titleKey), rows: rows, columns: columns, sort: sort, selection: selection, layout: layout, labels: labels)
    }
}
