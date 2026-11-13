import Foundation
import SwiftUI
import Testing
@testable import StanceUI

private let english = Locale(identifier: "en")
private let arabic = Locale(identifier: "ar")
private let spanish = Locale(identifier: "es")

private func plain(_ text: AttributedString) -> String { String(text.characters) }
private func links(_ text: AttributedString) -> [URL] { text.runs.compactMap(\.link) }

@Suite("Output: Markdown blocks")
struct OutputMarkdownBlockTests {
    typealias Renderer = StanceMarkdownRenderer

    @Test("Headings keep their written level, and the base level shifts the outline")
    func headings() {
        let blocks = Renderer.parse("# Budget\n### Travel\n#hashtag")
        #expect(blocks.count == 3)
        if case let .heading(level, text) = blocks[0] { #expect(level == 1 && plain(text) == "Budget") } else { Issue.record("h1") }
        if case let .heading(level, _) = blocks[1] { #expect(level == 3) } else { Issue.record("h3") }
        if case .paragraph = blocks[2] {} else { Issue.record("#hashtag is a paragraph") }
        #expect(Renderer.headingLevel(1, base: 1) == 1)
        #expect(Renderer.headingLevel(1, base: 3) == 3)
        #expect(Renderer.headingLevel(2, base: 3) == 4)
        #expect(Renderer.headingLevel(5, base: 4) == 6)
        #expect(Renderer.headingLevel(2, base: 0) == 2)
    }

    @Test("Bullets, numbers, nesting and tasks share one list with depth and numbering")
    func lists() throws {
        let blocks = Renderer.parse("""
        - Travel
          - Vienna workshop
          - Flights
            continued here
        - Software
        """)
        guard case let .list(items) = try #require(blocks.first), blocks.count == 1 else { Issue.record("one list"); return }
        #expect(items.map(\.depth) == [0, 1, 1, 0])
        #expect(items.map { plain($0.text) } == ["Travel", "Vienna workshop", "Flights continued here", "Software"])
        #expect(items.allSatisfy { $0.number == nil && $0.isChecked == nil })

        guard case let .list(ordered) = try #require(Renderer.parse("3. Three\n7. Next\n   - Inner\n   1. First inner\n9) Last").first) else { Issue.record("ordered"); return }
        #expect(ordered.map(\.number) == [3, 4, nil, 1, 5])
        #expect(ordered.map(\.depth) == [0, 0, 1, 1, 0])

        guard case let .list(tasks) = try #require(Renderer.parse("- [ ] Book flights\n- [x] Approve budget\n- [X] Done\n- [link] not a task").first) else { Issue.record("tasks"); return }
        #expect(tasks.map(\.isChecked) == [false, true, true, nil])
        #expect(plain(tasks[0].text) == "Book flights")
        #expect(plain(tasks[3].text) == "[link] not a task")
    }

    @Test("Quotes, rules and paragraphs")
    func quotesAndRules() {
        let blocks = Renderer.parse("First line\nsecond line\n\n> Quoted\n> again\n\n---\n\n* * *\nAfter")
        #expect(blocks.count == 5)
        if case let .paragraph(text) = blocks[0] { #expect(plain(text) == "First line second line") } else { Issue.record("paragraph") }
        if case let .quote(text) = blocks[1] { #expect(plain(text) == "Quoted again") } else { Issue.record("quote") }
        #expect(blocks[2] == .rule && blocks[3] == .rule)
        #expect(Renderer.parse("").isEmpty)
    }

    @Test("Tables keep alignment, pad short rows and allow escaped pipes")
    func tables() throws {
        let blocks = Renderer.parse("""
        Intro
        | Line | Change | Note |
        |:-----|-------:|:----:|
        | Travel | +8% | Two **workshops** |
        | Software \\| tools | -3% |
        After
        """)
        #expect(blocks.count == 3)
        guard case let .table(header, alignments, rows) = blocks[1] else { Issue.record("table"); return }
        #expect(header.map(plain) == ["Line", "Change", "Note"])
        #expect(alignments == [.leading, .trailing, .center])
        #expect(rows.count == 2)
        #expect(rows[0].map(plain) == ["Travel", "+8%", "Two workshops"])
        #expect(rows[1].map(plain) == ["Software | tools", "-3%", ""])
        // A line with a pipe but no separator under it is a paragraph.
        if case .paragraph = try #require(Renderer.parse("a | b\nc").first) {} else { Issue.record("not a table") }
    }

    @Test("Fenced code keeps its language and text exactly; an open fence is still code")
    func code() throws {
        let blocks = Renderer.parse("```swift\nlet a = 1\n  # not a heading\n```\nDone")
        #expect(blocks.count == 2)
        #expect(blocks[0] == .code(language: "swift", text: "let a = 1\n  # not a heading", isOpen: false))
        #expect(Renderer.parse("```\nplain\n```")[0] == .code(language: nil, text: "plain", isOpen: false))
        #expect(Renderer.parse("Text\n```json\n{ \"a\": 1")[1] == .code(language: "json", text: "{ \"a\": 1", isOpen: true))
    }

    @Test("Citations are found in order, once each, and bracketed link text is not a citation")
    func citations() {
        #expect(Renderer.citationIndices(in: "Travel is up [2] and software is down [1][2].") == [2, 1])
        #expect(Renderer.citationIndices(in: "See [1](https://binds.si) and [x] and [12") == [])
        #expect(Renderer.citationIndices(in: "") == [])
        // The marker stays in the sentence as written.
        if case let .paragraph(text) = Renderer.parse("Up 8% [1].")[0] { #expect(plain(text) == "Up 8% [1].") } else { Issue.record("paragraph") }
    }

    @Test("Images are a block of alt text on their own line and plain alt text inside a line")
    func images() {
        let blocks = Renderer.parse("![Bar chart of spend](https://example.com/chart.png)\n\nSee ![logo](https://example.com/logo.png) here")
        #expect(blocks.count == 2)
        #expect(blocks[0] == .image(alt: "Bar chart of spend", url: URL(string: "https://example.com/chart.png")))
        if case let .paragraph(text) = blocks[1] {
            #expect(plain(text) == "See logo here")
            #expect(text.runs.allSatisfy { $0.imageURL == nil && $0.link == nil })
        } else { Issue.record("paragraph") }
    }
}

@Suite("Output: Markdown safety and streaming")
struct OutputMarkdownSafetyTests {
    typealias Renderer = StanceMarkdownRenderer

    @Test("Only http, https and mailto may be followed", arguments: [
        ("https://binds.si/docs", true), ("http://example.com", true), ("HTTPS://EXAMPLE.COM", true), ("mailto:priya@binds.si", true),
        ("javascript:alert(1)", false), ("data:text/html,hi", false), ("file:///etc/passwd", false), ("/relative/path", false),
        ("docs/page", false), ("tel:+38640123456", false), ("stance://open", false),
    ])
    func safeLinks(address: String, expected: Bool) throws {
        #expect(Renderer.isSafeLink(try #require(URL(string: address))) == expected)
    }

    @Test("Unsafe links become plain text and safe ones stay links")
    func sanitised() {
        let text = Renderer.inline("[docs](https://binds.si) [mail](mailto:a@binds.si) [bad](javascript:alert(1)) [file](file:///etc/passwd) [rel](/settings) [data](data:text/html,x)")
        #expect(links(text).map(\.absoluteString) == ["https://binds.si", "mailto:a@binds.si"])
        #expect(plain(text).contains("bad") && plain(text).contains("rel"))
        // Raw HTML is never interpreted: it stays text.
        #expect(plain(Renderer.inline("<img src=x onerror=\"alert(1)\"> **bold**")).contains("bold"))
        if case let .paragraph(html) = Renderer.parse("<script>alert(1)</script>")[0] { #expect(links(html).isEmpty) } else { Issue.record("html is a paragraph") }
    }

    @Test("Unfinished emphasis, code and links are closed while streaming")
    func closing() {
        #expect(Renderer.closingOpenInline("Travel is **up 8") == "Travel is **up 8**")
        #expect(Renderer.closingOpenInline("Travel is **up 8 ") == "Travel is **up 8** ")
        #expect(Renderer.closingOpenInline("an *important") == "an *important*")
        #expect(Renderer.closingOpenInline("run `deploy --all") == "run `deploy --all`")
        #expect(Renderer.closingOpenInline("**bold and *both") == "**bold and *both***")
        // A marker with nothing after it is held back.
        #expect(Renderer.closingOpenInline("Travel is **") == "Travel is ")
        #expect(Renderer.closingOpenInline("Travel is *") == "Travel is ")
        #expect(Renderer.closingOpenInline("run `") == "run ")
        // Finished text and plain arithmetic are left alone.
        #expect(Renderer.closingOpenInline("2 * 3 = 6") == "2 * 3 = 6")
        #expect(Renderer.closingOpenInline("**done** and `code`") == "**done** and `code`")
        #expect(Renderer.closingOpenInline("stars `**` in code") == "stars `**` in code")
        // Links: the text shows, the half written address does not.
        #expect(Renderer.closingOpenInline("See the [travel policy](https://docs.bin") == "See the travel policy")
        #expect(Renderer.closingOpenInline("See the [travel pol") == "See the travel pol")
        #expect(Renderer.closingOpenInline("Up 8% [1") == "Up 8% ")
        #expect(Renderer.closingOpenInline("Chart ![Spend by team](https://exa") == "Chart Spend by team")
        #expect(Renderer.closingOpenInline("Done [1] and [docs](https://binds.si)") == "Done [1] and [docs](https://binds.si)")

        let bold = Renderer.inline("Travel is **up 8", isStreaming: true)
        #expect(plain(bold) == "Travel is up 8")
        #expect(bold.runs.contains { $0.inlinePresentationIntent?.contains(.stronglyEmphasized) == true })
        #expect(plain(Renderer.inline("Travel is **up 8")) == "Travel is **up 8")
    }

    @Test("Every prefix of a streamed answer parses, and blocks never change kind once started")
    func prefixes() {
        let answer = """
        ## Summary

        Travel is **up 8%** [1] and see the [policy](https://docs.binds.si/policy).

        - [x] Compare versions
        - [ ] Check *approvals*

        | Line | Change |
        |------|-------:|
        | Travel | +8% |

        ```swift
        let total = 1284
        ```

        > Trips over 400 EUR need approval.
        """
        func kind(_ block: StanceMarkdownBlock) -> String {
            switch block {
            case .heading: "heading"
            case .paragraph: "paragraph"
            case .list: "list"
            case .quote: "quote"
            case .code: "code"
            case .table: "table"
            case .image: "image"
            case .rule: "rule"
            }
        }
        let final = StanceMarkdownRenderer.parse(answer).map(kind)
        #expect(final == ["heading", "paragraph", "list", "table", "code", "quote"])
        var previous: [String] = []
        for end in answer.indices {
            let kinds = StanceMarkdownRenderer.parse(String(answer[...end]), isStreaming: true).map(kind)
            // Blocks only get added at the end: every earlier block keeps its kind.
            #expect(kinds.count >= previous.count, "block count shrank at \(answer[...end].count)")
            #expect(Array(kinds.prefix(max(previous.count - 1, 0))) == Array(previous.dropLast()), "structure changed at \(answer[...end].count)")
            #expect(Array(final.prefix(kinds.count)) == kinds, "unexpected kinds \(kinds) at \(answer[...end].count)")
            previous = kinds
        }
        #expect(previous == final)
    }

    @Test("An open fence, a half written table and a lone marker while streaming")
    func streamingBlocks() {
        typealias R = StanceMarkdownRenderer
        #expect(R.parse("Intro\n```sw", isStreaming: true).last == .code(language: "sw", text: "", isOpen: true))
        #expect(R.parse("Intro\n``", isStreaming: true).count == 1)
        #expect(R.parse("Intro\n\n#", isStreaming: true).count == 1)
        #expect(R.parse("Intro\n\n-", isStreaming: true).count == 1)
        #expect(R.parse("Intro\n\n1.", isStreaming: true).count == 1)
        // A header row alone is already a table while streaming, and a paragraph when finished.
        if case let .table(header, alignments, rows) = R.parse("| Line | Change |", isStreaming: true)[0] {
            #expect(header.map(plain) == ["Line", "Change"] && alignments == [.leading, .leading] && rows.isEmpty)
        } else { Issue.record("header only table") }
        if case .paragraph = R.parse("| Line | Change |")[0] {} else { Issue.record("finished text needs a separator") }
        if case let .table(_, alignments, rows) = R.parse("| Line | Change |\n|---", isStreaming: true)[0] {
            #expect(alignments.count == 2 && rows.isEmpty)
        } else { Issue.record("partial separator") }
        if case let .table(_, _, rows) = R.parse("| Line | Change |\n|---|---:|\n| Travel | +8", isStreaming: true)[0] {
            #expect(rows.map { $0.map(plain) } == [["Travel", "+8"]])
        } else { Issue.record("partial row") }
        if case let .list(items) = R.parse("- Done\n- [", isStreaming: true)[0] { #expect(items.count == 2 && plain(items[1].text).isEmpty) } else { Issue.record("partial task") }
    }
}

@Suite("Output: logic")
struct OutputLogicTests {
    private let columns = [
        StanceGeneratedTableColumn(id: "line", header: "Budget line"),
        StanceGeneratedTableColumn(id: "amount", header: "Amount, EUR", isNumeric: true),
    ]
    private let rows = [
        StanceGeneratedTableRow(id: "1", ["line": "Travel", "amount": "12,400"]),
        StanceGeneratedTableRow(id: "2", ["line": "Software \"seats\"", "amount": "9,800"]),
        StanceGeneratedTableRow(id: "3", ["line": "Events\nand venues", "amount": "1,250.50"]),
        StanceGeneratedTableRow(id: "4", ["line": " Padded"]),
    ]

    @Test("CSV quotes commas, quotes, line breaks and outer spaces")
    func csv() {
        let csv = StanceGeneratedTable.csv(columns: columns, rows: rows)
        #expect(csv == "Budget line,\"Amount, EUR\"\nTravel,\"12,400\"\n\"Software \"\"seats\"\"\",\"9,800\"\n\"Events\nand venues\",\"1,250.50\"\n\" Padded\",")
        #expect(StanceGeneratedTable.csv(columns: columns, rows: []) == "Budget line,\"Amount, EUR\"")
    }

    @Test("CSV never lets a spreadsheet run a cell as a formula")
    func csvFormulas() {
        let formulas = [
            StanceGeneratedTableRow(id: "1", ["line": "=SUM(A1:A9)", "amount": "-40"]),
            StanceGeneratedTableRow(id: "2", ["line": "+1", "amount": "@cmd"]),
        ]
        #expect(StanceGeneratedTable.csv(columns: columns, rows: formulas) == "Budget line,\"Amount, EUR\"\n'=SUM(A1:A9),'-40\n'+1,'@cmd")
    }

    @Test("The row cap applies until the reader asks for every row")
    func cap() {
        typealias T = StanceGeneratedTable
        #expect(T.visibleRows(rows, max: 2, showsAll: false).map(\.id) == ["1", "2"])
        #expect(T.visibleRows(rows, max: 2, showsAll: true).count == 4)
        #expect(T.visibleRows(rows, max: nil, showsAll: false).count == 4)
        #expect(T.visibleRows(rows, max: 10, showsAll: false).count == 4)
        #expect(T.visibleRows(rows, max: -1, showsAll: false).isEmpty)
        #expect(rows[3]["amount"] == "")
    }

    @Test("Numeric cells sort by value")
    func numbers() {
        typealias T = StanceGeneratedTable
        #expect(T.number("12,400") == 12400)
        #expect(T.number("8%") == 8)
        #expect(T.number("\u{2212}3.5") == -3.5)
        #expect(T.number("€ 40.50") == 40.5)
        #expect(T.number("n/a") == nil)
    }

    @Test("A chart becomes a table with one row per category")
    func chartTable() {
        let series = [
            StanceChartSeries("Sent", points: [.init("Jan", 10), .init("Feb", 20)]),
            StanceChartSeries("Failed", points: [.init("Feb", 2), .init("Mar", 1)]),
        ]
        let data = StanceGeneratedChart.tableData(series: series, categoryTitle: "Month") { String(Int($0)) }
        #expect(data.header == ["Month", "Sent", "Failed"])
        #expect(data.rows == [["Jan", "10", ""], ["Feb", "20", "2"], ["Mar", "", "1"]])
        #expect(StanceGeneratedChartView.allCases == [.chart, .table])
    }

    @Test("The split keeps both minimum widths and falls back to a switch when narrow")
    func canvas() {
        typealias L = StanceCanvasSplitLayout
        #expect(L.clampedRatio(0.5, width: 1000, minConversation: 320, minCanvas: 320) == 0.5)
        #expect(L.clampedRatio(0.1, width: 1000, minConversation: 320, minCanvas: 320) == 0.32)
        #expect(L.clampedRatio(0.95, width: 1000, minConversation: 320, minCanvas: 400) == 0.6)
        #expect(L.clampedRatio(0.9, width: 500, minConversation: 320, minCanvas: 320) == 0.5)
        #expect(L.clampedRatio(2, width: 0, minConversation: 320, minCanvas: 320) == 1)
        #expect(L.usesColumns(width: 1000, isRegular: true, minConversation: 320, minCanvas: 320))
        #expect(!L.usesColumns(width: 1000, isRegular: false, minConversation: 320, minCanvas: 320))
        #expect(!L.usesColumns(width: 600, isRegular: true, minConversation: 320, minCanvas: 320))
        #expect(L.narrowPane(.canvas, isCanvasOpen: true) == .canvas)
        #expect(L.narrowPane(.canvas, isCanvasOpen: false) == .conversation)
        #expect(L.narrowPane(.conversation, isCanvasOpen: true) == .conversation)
        #expect(L.step > 0 && L.step < 0.25)
    }

    @Test("File kind, size and detail text")
    func files() {
        #expect(StanceFileDetail.kind(forName: "Budget FY27.xlsx") == "XLSX")
        #expect(StanceFileDetail.kind(forName: "archive.tar.gz") == "GZ")
        #expect(StanceFileDetail.kind(forName: "README") == nil)
        #expect(StanceFileDetail.kind(forName: ".env") == nil)
        #expect(StanceFileDetail.size(482_000, locale: english) == "482 kB")
        #expect(StanceFileDetail.text(name: "report.pdf", size: 1_200_000, meta: "12 pages", locale: english) == "PDF, 1.2 MB, 12 pages")
        #expect(StanceFileDetail.text(name: "report.pdf", kind: "Document", locale: english) == "Document")
        #expect(StanceFileDetail.text(name: "notes", locale: english) == nil)
        #expect(StanceGeneratedImage.clampedProgress(1.4) == 1)
        #expect(StanceGeneratedImage.clampedProgress(-1) == 0)
        #expect(StanceGeneratedImage.clampedProgress(nil) == nil)
    }

    @Test("Run results are stated in words in every language")
    func runWords() {
        typealias C = StanceCodeSuggestion
        #expect(C.runSummary(.running, locale: english) == "Running code")
        #expect(C.runSummary(.complete, locale: english) == "Run finished")
        #expect(C.runSummary(.error, locale: english) == "Run failed")
        #expect(C.runSummary(.error, locale: spanish) == "La ejecución ha fallado")
        #expect(C.runSummary(.complete, locale: arabic) == "اكتمل التشغيل")
        #expect(Set(StanceStepStatus.allCases.map { C.runSummary($0, locale: english) }).count == StanceStepStatus.allCases.count)
        #expect(StanceLocalization.string("stance.ai.table.showing \(5) \(12)", locale: english) == "Rows shown: 5 of 12")
        #expect(StanceLocalization.string("stance.ai.genChart.source \("Finance")", locale: spanish).hasPrefix("Fuente: "))
    }
}

/// Renders the output components off screen in every theme, at accessibility text sizes and right to left.
@Suite("Output rendering")
@MainActor
struct OutputRenderingTests {
    static let markdown = """
    ## Budget changes

    Travel is **up 8%** [1]. See the [travel policy](https://docs.binds.si/policy) or run `stance deploy`.

    1. Compare the workbooks
       - [x] FY26
       - [ ] FY27
    2. Check approvals

    > Trips over 400 EUR need approval.

    | Line | Change |
    |:-----|-------:|
    | Travel | +8% |
    | Software | -3% |

    ```swift
    let total = lines.reduce(0, +)
    ```

    ---

    ![Bar chart of spend by team](https://example.com/chart.png)
    """

    static let series = [StanceChartSeries("Spend", points: [.init("Travel", 12.4), .init("Software", 9.8), .init("Events", 4.1)])]
    static let columns = [StanceGeneratedTableColumn(id: "line", header: "Line"), StanceGeneratedTableColumn(id: "change", header: "Change", isNumeric: true)]
    static let rows = [StanceGeneratedTableRow(id: "1", ["line": "Travel", "change": "+8%"]), StanceGeneratedTableRow(id: "2", ["line": "Software", "change": "-3%"])]

    struct Gallery: View {
        @State private var selection: String? = "b"
        @State private var view = StanceArtifactView.preview
        @State private var version = "2"
        let source = StanceSource(id: "1", title: "Q3 budget review", url: URL(string: "https://docs.binds.si/q3"))

        var body: some View {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceMarkdownRenderer(OutputRenderingTests.markdown, citations: [1: source])
                StanceMarkdownRenderer("Streaming **text", isStreaming: true, size: .small)
                StanceCodeSuggestion("let total = 1284\nprint(total)", language: "swift", filename: "Budget.swift", runStatus: .complete, runOutput: "1284", showsLineNumbers: true, onApply: {}, onRun: {})
                StanceCodeSuggestion("npm test", language: "bash", isApplied: true, runStatus: .error, runOutput: "1 test failed", onApply: {}, onRun: {})
                StanceArtifactPanel("Travel policy summary", kind: "Document", versions: [.init(id: "1", label: "Version 1"), .init(id: "2", label: "Version 2")], versionID: $version, view: $view, status: .streaming, onClose: {}) {
                    Text("Trips over 400 EUR need approval.").padding()
                } code: {
                    StanceCodeBlock("# Travel policy", language: "md")
                } actions: {
                    StanceButton("Copy", variant: .ghost, size: .small) {}
                }
                .frame(height: 320)
                StanceGeneratedImage(Image(systemName: "photo"), alt: "A paper plane over a city", variations: [.init(id: "a", image: Image(systemName: "photo"), alt: "First"), .init(id: "b", image: Image(systemName: "photo.fill"), alt: "Second")], selection: $selection, prompt: "A paper plane over a city, ink drawing", onRegenerate: {}, onEdit: {})
                StanceGeneratedImage(nil, alt: "A paper plane", status: .streaming, progress: 0.4, aspectRatio: 16 / 9)
                StanceGeneratedImage(nil, alt: "A paper plane", status: .error, aspectRatio: 16 / 9, onRegenerate: {})
                StanceGeneratedTable("Budget changes", columns: OutputRenderingTests.columns, rows: OutputRenderingTests.rows, isStreaming: true, maxRows: 1, onExport: {}, onExpand: {})
                StanceGeneratedChart("Spend by line", takeaway: "Travel is the largest line.", series: OutputRenderingTests.series, source: "FY27 workbook")
                StanceGeneratedChart("Spend by line", takeaway: "Travel is the largest line.", series: OutputRenderingTests.series, view: .constant(.table))
                StanceFilePreviewCard("Budget FY27.xlsx", size: 482_000, meta: "3 sheets", onOpen: {}, onDownload: {})
                StanceFilePreviewCard("Report.pdf", status: .streaming, progress: 0.6)
                StanceFilePreviewCard("Broken.docx", status: .error)
                StanceCanvasSplitView { Text("Conversation") } canvas: { Text("Canvas") }.frame(height: 200)
            }
            .padding()
            .frame(width: 390)
        }
    }

    private func image<V: View>(_ view: V) throws -> CGImage {
        let renderer = ImageRenderer(content: view)
        renderer.scale = 1
        return try #require(renderer.cgImage)
    }

    @Test("Every output component renders in every theme", arguments: StanceTheme.Mode.allCases, [DynamicTypeSize.large, .accessibility5])
    func renders(mode: StanceTheme.Mode, size: DynamicTypeSize) throws {
        let theme = StanceTheme(mode: mode)
        let rendered = try image(
            Gallery()
                .environment(\.stanceTheme, theme)
                .environment(\.dynamicTypeSize, size)
                .foregroundStyle(theme.colors.fgDefault)
                .background(theme.colors.bgCanvas)
        )
        #expect(rendered.width == 390)
        #expect(rendered.height > 2400)
    }

    @Test("Layout reflows at the largest text size and right to left")
    func reflows() throws {
        let standard = try image(Gallery())
        let large = try image(Gallery().environment(\.dynamicTypeSize, .accessibility5))
        #expect(large.height > standard.height)
        let rtl = try image(Gallery().environment(\.locale, arabic).environment(\.layoutDirection, .rightToLeft))
        #expect(rtl.width == 390 && rtl.height > 2400)
    }

    @Test("The split view shows columns in regular width and a switch in compact width")
    func split() throws {
        let wide = try image(
            StanceCanvasSplitView(defaultRatio: 0.4) { Color.black } canvas: { Color.white }
                .environment(\.horizontalSizeClass, .regular)
                .frame(width: 1000, height: 300)
                .background(Color.white)
        )
        #expect(wide.width == 1000 && wide.height == 300)
        let data = try #require(wide.dataProvider?.data)
        let bytes = try #require(CFDataGetBytePtr(data))
        let row = wide.bytesPerRow * 150, pixel = wide.bitsPerPixel / 8
        func isDark(_ x: Int) -> Bool { Int(bytes[row + x * pixel]) + Int(bytes[row + x * pixel + 1]) + Int(bytes[row + x * pixel + 2]) < 200 }
        // The conversation takes 40% of 1000pt: dark at 300, light at 600.
        #expect(isDark(300) && !isDark(600))
        let narrow = try image(StanceCanvasSplitView { Color.black } canvas: { Color.white }.frame(width: 390, height: 300))
        #expect(narrow.height == 300)
        let closed = try image(StanceCanvasSplitView(isCanvasOpen: .constant(false)) { Text("Only") } canvas: { Text("Hidden") }.frame(width: 390, height: 120))
        #expect(closed.height == 120)
    }

    @Test("Output controls keep the 44pt minimum target")
    func targets() throws {
        func size<V: View>(_ view: V) throws -> CGSize {
            let rendered = try image(view.environment(\.stanceTheme, .light))
            return CGSize(width: rendered.width, height: rendered.height)
        }
        #expect(try size(StanceFilePreviewCard("a.pdf", onOpen: {}).frame(width: 320)).height >= 44)
        #expect(try size(StanceGeneratedChart("Spend", takeaway: "Up.", series: Self.series).frame(width: 320)).height >= 44)
        #expect(try size(StanceCodeSuggestion("a", onApply: {}).frame(width: 320)).height >= 88)
    }
}
