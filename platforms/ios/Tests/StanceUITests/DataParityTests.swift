import Foundation
import SwiftUI
import Testing
@testable import StanceUI

private let english = Locale(identifier: "en")

@Suite("Data parity: tree view")
struct DataParityTreeTests {
    typealias Node = StanceTreeNode<String>
    let tree: [Node] = [
        Node(id: "sales", title: "Sales", children: [
            Node(id: "emea", title: "EMEA", children: [Node(id: "standard", title: "Standard signature")]),
            Node(id: "launch", title: "Launch banner"),
        ]),
        Node(id: "legal", title: "Legal", children: []),
        Node(id: "readme", title: "Read me"),
    ]

    @Test("Collapsed tree shows only top level rows")
    func collapsed() {
        let rows = StanceTreeState.visibleRows(tree, expanded: [])
        #expect(rows.map(\.id) == ["sales", "legal", "readme"])
        #expect(rows.map(\.depth) == [0, 0, 0])
        #expect(rows.map(\.position) == [1, 2, 3])
        #expect(rows.allSatisfy { $0.siblingCount == 3 })
    }

    @Test("Expanding shows children with their depth; a collapsed parent hides expanded children")
    func expanded() {
        let rows = StanceTreeState.visibleRows(tree, expanded: ["sales", "emea"])
        #expect(rows.map(\.id) == ["sales", "emea", "standard", "launch", "legal", "readme"])
        #expect(rows.map(\.depth) == [0, 1, 2, 1, 0, 0])
        #expect(StanceTreeState.visibleRows(tree, expanded: ["emea"]).map(\.id) == ["sales", "legal", "readme"])
    }

    @Test("Toggle expands and collapses branches and ignores leaves")
    func toggle() {
        var expanded = Set<String>()
        StanceTreeState.toggle(tree[0], in: &expanded)
        #expect(expanded == ["sales"])
        StanceTreeState.toggle(tree[2], in: &expanded)
        #expect(expanded == ["sales"])
        StanceTreeState.toggle(tree[1], in: &expanded)
        #expect(expanded == ["sales", "legal"])
        StanceTreeState.toggle(tree[0], in: &expanded)
        #expect(expanded == ["legal"])
    }

    @Test("Expand all and reveal a nested node")
    func expandAll() {
        #expect(StanceTreeState.allBranches(tree) == ["sales", "emea", "legal"])
        #expect(StanceTreeState.ancestors(of: "standard", in: tree) == ["sales", "emea"])
        #expect(StanceTreeState.ancestors(of: "readme", in: tree) == [])
        #expect(StanceTreeState.ancestors(of: "missing", in: tree) == nil)
    }
}

@Suite("Data parity: sortable list")
@MainActor
struct DataParitySortableTests {
    struct Step: Identifiable, Equatable { let id: Int }
    typealias List = StanceSortableList<Step, EmptyView>

    @Test("Moves by one place and stops at the ends")
    func moveByOffset() {
        var steps = [1, 2, 3, 4].map(Step.init)
        #expect(List.move(&steps, from: 0, by: 1) == 1)
        #expect(steps.map(\.id) == [2, 1, 3, 4])
        #expect(List.move(&steps, from: 0, by: -1) == nil)
        #expect(List.move(&steps, from: 3, by: 1) == nil)
        #expect(List.move(&steps, from: 1, by: 10) == 3)
        #expect(steps.map(\.id) == [2, 3, 4, 1])
        #expect(List.move(&steps, from: 9, by: 1) == nil)
    }

    @Test("List drag moves match Array.move(fromOffsets:toOffset:)")
    func dragMove() {
        var steps = [1, 2, 3, 4].map(Step.init)
        List.move(&steps, fromOffsets: IndexSet(integer: 0), toOffset: 3)
        #expect(steps.map(\.id) == [2, 3, 1, 4])
        List.move(&steps, fromOffsets: IndexSet([2, 3]), toOffset: 0)
        #expect(steps.map(\.id) == [1, 4, 2, 3])
    }
}

@Suite("Data parity: pagination")
@MainActor
struct DataParityPaginationTests {
    @Test("Pages are clamped to 1 to the page count")
    func clamp() {
        #expect(StancePagination.clamp(0, pageCount: 10) == 1)
        #expect(StancePagination.clamp(-4, pageCount: 10) == 1)
        #expect(StancePagination.clamp(11, pageCount: 10) == 10)
        #expect(StancePagination.clamp(5, pageCount: 10) == 5)
        #expect(StancePagination.clamp(3, pageCount: 0) == 1)
    }

    @Test("Short ranges list every page")
    func short() {
        #expect(StancePagination.range(page: 1, pageCount: 0).isEmpty)
        #expect(StancePagination.range(page: 2, pageCount: 5) == (1 ... 5).map(StancePaginationItem.page))
        #expect(StancePagination.range(page: 1, pageCount: 7) == (1 ... 7).map(StancePaginationItem.page))
    }

    @Test("Long ranges keep a stable length with gaps, as on the web")
    func long() {
        let p = StancePaginationItem.page
        #expect(StancePagination.range(page: 1, pageCount: 20) == [p(1), p(2), p(3), p(4), p(5), .endEllipsis, p(20)])
        #expect(StancePagination.range(page: 10, pageCount: 20) == [p(1), .startEllipsis, p(9), p(10), p(11), .endEllipsis, p(20)])
        #expect(StancePagination.range(page: 20, pageCount: 20) == [p(1), .startEllipsis, p(16), p(17), p(18), p(19), p(20)])
        #expect(StancePagination.range(page: 4, pageCount: 20) == [p(1), p(2), p(3), p(4), p(5), .endEllipsis, p(20)])
        #expect(StancePagination.range(page: 99, pageCount: 20) == StancePagination.range(page: 20, pageCount: 20))
        for page in 1 ... 20 {
            #expect(StancePagination.range(page: page, pageCount: 20).count == 7)
            #expect(StancePagination.range(page: page, pageCount: 20, siblingCount: 2, boundaryCount: 2).count == 11)
        }
    }
}

@Suite("Data parity: rich text")
struct DataParityRichTextTests {
    func plain(_ text: AttributedString) -> String { String(text.characters) }

    @Test("Headings, paragraphs, lists, quotes, code and rules map to blocks")
    func blocks() {
        let markdown = """
        # Rollout
        Signatures deploy
        after the next sync.

        - Sales
        - Legal
        3. Choose a template
        4. Deploy

        > Changes reach every mailbox.
        ---
        ```swift
        StanceButton("Deploy") {}
        ```
        """
        let blocks = StanceRichText.parse(markdown)
        #expect(blocks.count == 7)
        guard case let .heading(level, heading) = blocks[0] else { Issue.record("heading"); return }
        #expect(level == 1 && plain(heading) == "Rollout")
        guard case let .paragraph(paragraph) = blocks[1] else { Issue.record("paragraph"); return }
        #expect(plain(paragraph) == "Signatures deploy after the next sync.")
        guard case let .bulletList(bullets) = blocks[2] else { Issue.record("bullets"); return }
        #expect(bullets.map(plain) == ["Sales", "Legal"])
        guard case let .numberedList(start, numbered) = blocks[3] else { Issue.record("numbers"); return }
        #expect(start == 3 && numbered.map(plain) == ["Choose a template", "Deploy"])
        guard case let .quote(quote) = blocks[4] else { Issue.record("quote"); return }
        #expect(plain(quote) == "Changes reach every mailbox.")
        #expect(blocks[5] == .rule)
        #expect(blocks[6] == .code(language: "swift", text: "StanceButton(\"Deploy\") {}"))
    }

    @Test("Inline emphasis, code spans and links keep their intents")
    func inline() {
        let text = StanceRichText.inline("Read the **guide** at [binds.si](https://binds.si) or run `deploy`.")
        #expect(plain(text) == "Read the guide at binds.si or run deploy.")
        let links = text.runs.compactMap(\.link)
        #expect(links == [URL(string: "https://binds.si")!])
        #expect(text.runs.contains { $0.inlinePresentationIntent?.contains(.stronglyEmphasized) == true })
        #expect(text.runs.contains { $0.inlinePresentationIntent?.contains(.code) == true })
    }

    @Test("Headings need a space and at most six marks; HTML is kept as text")
    func edges() {
        #expect(StanceRichText.parse("#hashtag").count == 1)
        if case .paragraph = StanceRichText.parse("#hashtag")[0] {} else { Issue.record("#hashtag is a paragraph") }
        if case let .heading(level, _) = StanceRichText.parse("###### Six")[0] { #expect(level == 6) } else { Issue.record("h6") }
        if case let .paragraph(text) = StanceRichText.parse("<b>bold</b>")[0] { #expect(plain(text).contains("bold")) }
        #expect(StanceRichText.parse("").isEmpty)
    }
}

@Suite("Data parity: chart")
struct DataParityChartTests {
    let sent = StanceChartSeries("Sent", points: [.init("Jan", 120), .init("Feb", 340), .init("Mar", 1284)])
    let failed = StanceChartSeries("Failed", points: [.init("Jan", 3), .init("Feb", 9), .init("Apr", 4)])

    @Test("Categories keep first-seen order across series")
    func categories() {
        #expect(StanceChart.categories([sent, failed]) == ["Jan", "Feb", "Mar", "Apr"])
    }

    @Test("The summary names the kind, size, and highest and lowest values")
    func summary() {
        let format: (Double) -> String = { $0.formatted(.number.locale(english)) }
        #expect(StanceChart.summary(kind: .bar, series: [sent, failed], locale: english, format: format)
            == "Bar chart with 4 categories and 2 series. Highest: Sent in Mar, 1,284. Lowest: Failed in Jan, 3.")
        #expect(StanceChart.summary(kind: .line, series: [sent], locale: english, format: format)
            == "Line chart with 3 categories and 1 series. Highest: Mar, 1,284. Lowest: Jan, 120.")
        #expect(StanceChart.summary(kind: .area, series: [], locale: english, format: format) == "Area chart with 0 categories and 0 series.")
    }

    @Test("The summary is localised")
    func localised() {
        let arabic = StanceChart.summary(kind: .line, series: [sent], locale: Locale(identifier: "ar")) { String($0) }
        #expect(!arabic.contains("stance.chart"))
        #expect(arabic.contains("Mar"))
    }
}

@Suite("Data parity: data table")
@MainActor
struct DataParityTableTests {
    struct User: Identifiable, Equatable { let id: Int; let name: String; let mailboxes: Int }
    typealias Table = StanceDataTable<User>
    let users = [User(id: 1, name: "Priya Nair", mailboxes: 12), User(id: 2, name: "Amara Okafor", mailboxes: 3), User(id: 3, name: "Lukas Brenner", mailboxes: 12), User(id: 4, name: "item 10", mailboxes: 1), User(id: 5, name: "item 2", mailboxes: 1)]
    var columns: [StanceTableColumn<User>] {
        [
            StanceTableColumn("Name") { $0.name },
            StanceTableColumn("Mailboxes", alignment: .trailing, value: { String($0.mailboxes) }, sortValue: { $0.mailboxes }),
            StanceTableColumn("Notes", isSortable: false) { _ in "" },
        ]
    }

    @Test("Text columns sort naturally, numbers by value, and ties keep their order")
    func sorting() {
        #expect(Table.sorted(users, columns: columns, by: nil).map(\.id) == [1, 2, 3, 4, 5])
        #expect(Table.sorted(users, columns: columns, by: .init(column: "Name")).map(\.id) == [2, 5, 4, 3, 1])
        #expect(Table.sorted(users, columns: columns, by: .init(column: "Name", ascending: false)).map(\.id) == [1, 3, 4, 5, 2])
        #expect(Table.sorted(users, columns: columns, by: .init(column: "Mailboxes")).map(\.id) == [4, 5, 2, 1, 3])
        #expect(Table.sorted(users, columns: columns, by: .init(column: "Mailboxes", ascending: false)).map(\.id) == [1, 3, 2, 4, 5])
        #expect(Table.sorted(users, columns: columns, by: .init(column: "Notes")).map(\.id) == [1, 2, 3, 4, 5])
        #expect(Table.sorted(users, columns: columns, by: .init(column: "Unknown")).map(\.id) == [1, 2, 3, 4, 5])
    }

    @Test("Choosing a header starts ascending, choosing it again flips")
    func toggle() {
        #expect(Table.toggled(nil, column: "Name") == .init(column: "Name"))
        #expect(Table.toggled(.init(column: "Name"), column: "Name") == .init(column: "Name", ascending: false))
        #expect(Table.toggled(.init(column: "Name", ascending: false), column: "Mailboxes") == .init(column: "Mailboxes"))
    }

    @Test("The system table comparator agrees with the column")
    func comparator() {
        let column = columns[1]
        var comparator = StanceTableComparator<User>(columnID: column.id, compare: column.areInIncreasingOrder, order: .forward)
        #expect(users.sorted(using: comparator).map(\.mailboxes) == [1, 1, 3, 12, 12])
        comparator.order = .reverse
        #expect(users.sorted(using: comparator).map(\.mailboxes) == [12, 12, 3, 1, 1])
    }

    @Test("Code blocks split lines and keep blank ones")
    func codeLines() {
        #expect(StanceCodeBlock.lines("a\n\nb\n") == ["a", "", "b"])
        #expect(StanceCodeBlock.lines("") == [""])
    }
}

@Suite("Data parity: rendering")
@MainActor
struct DataParityRenderingTests {
    struct User: Identifiable { let id: Int; let name: String; let role: String }

    struct Gallery: View {
        @State private var page = 3
        @State private var expanded: Set<String> = ["templates"]
        @State private var selected: String? = "sales"
        @State private var steps = [User(id: 1, name: "Legal review", role: "Legal"), User(id: 2, name: "Finance sign off", role: "Finance")]
        @State private var sort: StanceTableSort? = .init(column: "Name")

        var body: some View {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceDataTable(rows: [User(id: 1, name: "Priya Nair", role: "Admin"), User(id: 2, name: "Hana Sato", role: "Member")],
                                columns: [StanceTableColumn("Name") { $0.name }, StanceTableColumn("Role") { $0.role }],
                                sort: $sort, layout: .list)
                    .frame(height: 260)
                StancePagination(page: $page, pageCount: 12)
                StanceTreeView(nodes: [StanceTreeNode(id: "templates", title: "Templates", children: [StanceTreeNode(id: "sales", title: "Sales signature")])], expanded: $expanded, selection: $selected)
                    .frame(height: 160)
                StanceSortableList("Approval steps", items: $steps, itemLabel: \.name) { Text($0.name) }
                    .frame(height: 180)
                StanceChart("Deployments", description: "Per month", kind: .bar, series: [StanceChartSeries("Sent", points: [.init("Jan", 120), .init("Feb", 340)])])
                StanceChart("Trend", kind: .line, series: [StanceChartSeries("Sent", points: [.init("Jan", 120), .init("Feb", 340)]), StanceChartSeries("Failed", points: [.init("Jan", 3), .init("Feb", 9)])])
                StanceRichText(markdown: "## Rollout\nSignatures deploy **after** the next sync.\n- Sales\n- Legal\n> Quoted")
                StanceCodeBlock("StanceButton(\"Deploy\") {}\nStanceBadge(\"Live\")", title: "Swift", showsLineNumbers: true)
                HStack {
                    StanceProgressCircle("Mailboxes updated", value: 0.72)
                    StanceProgressCircle("Uploading", value: nil, size: .small)
                    StanceProgressCircle("Done", value: 1, size: .large, tone: .success)
                }
            }
            .padding()
            .frame(width: 390)
        }
    }

    func render(_ mode: StanceTheme.Mode, size: DynamicTypeSize = .large, rightToLeft: Bool = false) throws -> CGImage {
        let theme = StanceTheme(mode: mode)
        let renderer = ImageRenderer(content:
            Gallery()
                .environment(\.stanceTheme, theme)
                .environment(\.dynamicTypeSize, size)
                .environment(\.layoutDirection, rightToLeft ? .rightToLeft : .leftToRight)
                .environment(\.locale, Locale(identifier: rightToLeft ? "ar" : "en"))
                .foregroundStyle(theme.colors.fgDefault)
                .background(theme.colors.bgCanvas)
        )
        renderer.scale = 1
        return try #require(renderer.cgImage)
    }

    @Test("Renders in every theme", arguments: StanceTheme.Mode.allCases)
    func themes(mode: StanceTheme.Mode) throws {
        let image = try render(mode)
        #expect(image.width == 390)
        #expect(image.height > 900)
    }

    @Test("Renders at the largest accessibility text size without collapsing", arguments: StanceTheme.Mode.allCases)
    func accessibilitySize(mode: StanceTheme.Mode) throws {
        let large = try render(mode).height, huge = try render(mode, size: .accessibility5).height
        #expect(huge > 900)
        #if os(iOS)
        // Text scales with Dynamic Type on iOS, so the content grows. macOS keeps a fixed text size.
        #expect(huge > large, "\(huge) vs \(large)")
        #else
        #expect(large > 900)
        #endif
    }

    @Test("Renders right to left in Arabic", arguments: StanceTheme.Mode.allCases)
    func rightToLeft(mode: StanceTheme.Mode) throws {
        let image = try render(mode, rightToLeft: true)
        #expect(image.width == 390)
        #expect(image.height > 900)
    }

    @Test("Progress circles and pagination keep the 44pt target")
    func targets() throws {
        let circle = ImageRenderer(content: StanceProgressCircle("Done", value: 0.5, size: .small))
        circle.scale = 1
        #expect(try #require(circle.cgImage).height >= 44)
        let pager = ImageRenderer(content: StancePagination(page: .constant(2), pageCount: 5).frame(width: 340))
        pager.scale = 1
        #expect(try #require(pager.cgImage).height >= 44)
    }
}
