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
/// Pass rows in any order: the table sorts them by `sort`.
public struct StanceDataTable<Row: Identifiable>: View {
    /// Which layout to use.
    public enum Layout: Sendable {
        /// A table in regular width and cards in compact width.
        case automatic
        /// Always the system table (iOS 17.4 or later; earlier versions use cards).
        case table
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
            } else if useTable, #available(iOS 17.4, macOS 14.4, *) {
                StanceSystemTable(rows: displayed, columns: columns, sort: $sort, selection: selection, allowsSelection: externalSelection != nil)
            } else {
                cards
            }
        }
        .accessibilityLabel(title ?? "")
    }

    private var useTable: Bool {
        switch layout {
        case .automatic: sizeClass == .regular
        case .table: true
        case .list: false
        }
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
