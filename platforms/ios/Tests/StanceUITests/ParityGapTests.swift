import Foundation
import SwiftUI
import Testing
@testable import StanceUI

private let english = Locale(identifier: "en")
private let arabic = Locale(identifier: "ar")
private let spanish = Locale(identifier: "es")

@Suite("Code highlighting")
struct CodeHighlighterTests {
    typealias H = StanceCodeHighlighter
    private let sample = "import { Button } from '@bindshq/stance-react';\n\n// Primary action\nexport const Save = () => <Button>Save</Button>;\n"

    private func kinds(_ code: String, _ language: String) -> [StanceCodeTokenKind] { H.tokenize(code, language: language).map(\.kind) }
    private func token(_ code: String, _ language: String, _ value: String) -> StanceCodeTokenKind? {
        H.tokenize(code, language: language).first { $0.value == value }?.kind
    }

    @Test("The token kinds are the web's")
    func kindNames() {
        #expect(StanceCodeTokenKind.allCases.map(\.rawValue) == ["comment", "string", "keyword", "number", "tag", "attr", "punct", "fn", "prop", "plain"])
    }

    @Test("Known languages are tokenized and unknown ones pass through, as on the web")
    func webCases() {
        #expect(kinds("const a = 'x'", "ts").contains(.string))
        #expect(H.tokenize("anything", language: "cobol") == [StanceCodeToken(.plain, "anything")])
        #expect(H.tokenize("anything", language: nil) == [StanceCodeToken(.plain, "anything")])
        #expect(H.supports("TSX") && H.supports("kotlin") && H.supports("swift") && !H.supports("cobol") && !H.supports(nil))
        for language in ["ts", "tsx", "js", "jsx", "css", "bash", "json", "swift", "kotlin"] { #expect(H.supportedLanguages.contains(language)) }
    }

    @Test("The sample has four lines, a highlighted import and a comment")
    func sampleLines() {
        let tokens = H.tokenize(StanceCodeBlock.lines(sample).joined(separator: "\n"), language: "tsx")
        let lines = H.lines(tokens)
        #expect(lines.count == 4)
        #expect(lines[1].isEmpty)
        #expect(lines[0].first == StanceCodeToken(.keyword, "import"))
        #expect(lines[0].contains(StanceCodeToken(.string, "'@bindshq/stance-react'")))
        #expect(lines[2] == [StanceCodeToken(.comment, "// Primary action")])
        #expect(lines[3].contains(StanceCodeToken(.tag, "<Button")) && lines[3].contains(StanceCodeToken(.tag, "</Button")))
        #expect(lines[3].contains(StanceCodeToken(.keyword, "export")) && lines[3].contains(StanceCodeToken(.keyword, "const")))
    }

    @Test("Code is never changed: joining the tokens gives the source back", arguments: ["ts", "css", "bash", "json", "swift", "kotlin", "html", "cobol"])
    func roundTrip(language: String) {
        let sources = [
            sample, "<img src=x onerror=\"alert(1)\">", ".card { color: var(--st-color-fg); margin: -4px 1.5rem; }",
            "npm install --save @bindshq/stance-react # add it\n", "{ \"name\": \"stance\", \"count\": 3, \"ok\": true, \"none\": null }",
            "@State private var name = \"Priya\" // owner\nfunc greet(_ who: String) -> String { \"Hi \\(who) 👩🏽‍💻\" }",
            "data class User(val id: Long = 42L) /* note */\n", "unterminated 'string and \u{1F600} emoji § ¶", "",
        ]
        for source in sources {
            #expect(H.tokenize(source, language: language).map(\.value).joined() == source)
        }
    }

    @Test("JavaScript and TypeScript rules")
    func javascript() {
        #expect(token("return save(1_000)", "js", "return") == .keyword)
        #expect(token("return save(1_000)", "js", "save") == .fn)
        #expect(token("return save(1_000)", "js", "1_000") == .number)
        #expect(token("<Button size=\"sm\">", "tsx", "size") == .attr)
        #expect(token("/* a\n b */ x", "ts", "/* a\n b */") == .comment)
        #expect(token("a.b;", "ts", ".") == .punct)
        // Neighbouring plain tokens merge, so words and the spaces between them are one run.
        #expect(H.tokenize("a b", language: "js") == [StanceCodeToken(.plain, "a b")])
    }

    @Test("CSS, shell and JSON rules")
    func otherWebLanguages() {
        let css = ".card { --gap: 4px; color: var(--x); } @media print {}"
        #expect(token(css, "css", ".card") == .tag)
        #expect(token(css, "css", "--gap") == .prop)
        #expect(token(css, "css", "4px") == .number)
        #expect(token(css, "css", "var") == .fn)
        #expect(token(css, "css", "@media") == .keyword)
        #expect(token("npm install --save-dev vitest # dev", "bash", "npm") == .keyword)
        #expect(token("npm install --save-dev vitest # dev", "sh", "--save-dev") == .attr)
        #expect(token("npm install --save-dev vitest # dev", "shell", "# dev") == .comment)
        #expect(token("echo 'hi there'", "bash", "'hi there'") == .string)
        let json = "{ \"name\": \"stance\", \"count\": -3.5e2, \"ok\": true }"
        #expect(token(json, "json", "\"name\"") == .prop)
        #expect(token(json, "json", "\"stance\"") == .string)
        #expect(token(json, "json", "-3.5e2") == .number)
        #expect(token(json, "json", "true") == .keyword)
        #expect(token(json, "json", "{") == .punct)
    }

    @Test("Swift and Kotlin rules")
    func nativeLanguages() {
        let swift = "@State private var count = 0x1F // total\nStanceButton(\"Deploy\") { await send() }"
        #expect(token(swift, "swift", "@State") == .attr)
        #expect(token(swift, "swift", "private") == .keyword)
        #expect(token(swift, "swift", "var") == .keyword)
        #expect(token(swift, "swift", "0x1F") == .number)
        #expect(token(swift, "swift", "// total") == .comment)
        #expect(token(swift, "swift", "StanceButton") == .fn)
        #expect(token(swift, "swift", "\"Deploy\"") == .string)
        #expect(token(swift, "swift", "await") == .keyword)
        #expect(token("let text = \"\"\"\nTwo\nlines\n\"\"\"", "swift", "\"\"\"\nTwo\nlines\n\"\"\"") == .string)
        let kotlin = "@Composable fun Greeting(name: String = \"Priya\") { val n = 42L; Text(text = name) }"
        #expect(token(kotlin, "kotlin", "@Composable") == .attr)
        #expect(token(kotlin, "kt", "fun") == .keyword)
        #expect(token(kotlin, "kotlin", "Greeting") == .fn)
        #expect(token(kotlin, "kotlin", "\"Priya\"") == .string)
        #expect(token(kotlin, "kotlin", "42L") == .number)
        #expect(token(kotlin, "kotlin", "val") == .keyword)
    }

    @Test("Markup is data: nothing is interpreted")
    func safety() {
        let tokens = H.tokenize("<img src=x onerror=\"alert(1)\">", language: "html")
        #expect(tokens.map(\.value).joined() == "<img src=x onerror=\"alert(1)\">")
        #expect(tokens.first == StanceCodeToken(.tag, "<img"))
    }

    @Test("Tokens that span line breaks are cut, and empty lines are kept")
    func lines() {
        let lines = H.lines([StanceCodeToken(.comment, "/* a\n\nb */"), StanceCodeToken(.plain, " x")])
        #expect(lines == [[StanceCodeToken(.comment, "/* a")], [], [StanceCodeToken(.comment, "b */"), StanceCodeToken(.plain, " x")]])
        #expect(StanceCodeBlock.lines("a\n\nb\n") == ["a", "", "b"])
    }

    @Test("One attributed string keeps the text and styles kinds by ink, weight, italics and underline", arguments: StanceTheme.Mode.allCases)
    func styling(mode: StanceTheme.Mode) {
        let theme = StanceTheme(mode: mode)
        let code = "// note\nconst total = sum(1, 'a')"
        let text = H.attributedString(H.tokenize(code, language: "ts"), theme: theme, fontSize: 14)
        #expect(String(text.characters) == code)
        func run(_ value: String) -> AttributedString.Runs.Run? { text.runs.first { String(text[$0.range].characters) == value } }
        #expect(run("// note")?.foregroundColor == theme.colors.fgSubtle)
        #expect(run("// note")?.font == Font.system(size: 14, weight: .regular, design: .monospaced).italic())
        #expect(run("const")?.font == Font.system(size: 14, weight: .semibold, design: .monospaced))
        #expect(run("const")?.foregroundColor == theme.colors.fgDefault)
        #expect(run("sum")?.underlineStyle != nil)
        #expect(run("1")?.foregroundColor == theme.colors.warningFg)
        #expect(run("'a'")?.foregroundColor == theme.colors.successFg)
        #expect(run("(")?.foregroundColor == theme.colors.fgSubtle)
        #expect(run("// note")?.underlineStyle == nil)
    }

    @Test("Long code is highlighted off the main thread")
    func threshold() async {
        let long = String(repeating: "const a = 1;\n", count: 400)
        #expect(long.utf16.count > StanceCodeBlock.backgroundThreshold)
        let tokens = await Task.detached { StanceCodeHighlighter.tokenize(long, language: "ts") }.value
        #expect(tokens.filter { $0.kind == .keyword }.count == 400)
    }
}

@Suite("Custom values and empty numbers")
struct CustomValueTests {
    private let people = [StanceSelectOption("u1", label: "Ana Kovač", detail: "Design"), StanceSelectOption("u2", label: "Ben Hughes")]

    @Test("Typed text is offered only when it is not blank and is not an option's label")
    func offer() {
        typealias F = StanceOptionFilter
        #expect(F.customText(for: "Partners", in: people) == "Partners")
        #expect(F.customText(for: "  Partners  ", in: people) == "Partners")
        #expect(F.customText(for: "", in: people) == nil)
        #expect(F.customText(for: "   ", in: people) == nil)
        #expect(F.customText(for: "ben hughes", in: people) == nil)
        #expect(F.customText(for: "ana kovac", in: people) == nil)
        // A partial match still filters the list and can also become a value of its own.
        #expect(F.customText(for: "Ben", in: people) == "Ben")
        #expect(F.filter(people, query: "Ben").map(\.value) == ["u2"])
    }

    @Test("Text values are used as typed; other types convert and may refuse")
    func typeSafety() {
        let text = StanceCustomValue<String>.text
        #expect(text.make("Partners") == "Partners")
        #expect(text.label("Partners") == "Partners")
        let number = StanceCustomValue<Int>(make: { Int($0) }, label: { "No. \($0)" }, actionLabel: { "Add number \($0)" })
        #expect(number.make("42") == 42)
        #expect(number.make("forty") == nil)
        #expect(number.label(7) == "No. 7")
        #expect(number.actionLabel?("42") == "Add number 42")
    }

    @Test("A multi select lists created tags after the options, sorted by label")
    func createdTags() {
        typealias M = StanceMultiSelect<String>
        #expect(M.options(people, selection: ["u2", "Zeta", "Alpha"], custom: .text).map(\.value) == ["u1", "u2", "Alpha", "Zeta"])
        #expect(M.options(people, selection: ["u2", "Zeta"], custom: nil).map(\.value) == ["u1", "u2"])
    }

    @Test("The offer is localised")
    func words() {
        #expect(StanceLocalization.string("stance.select.useCustom \("Partners")", locale: english) == "Use “Partners”")
        #expect(StanceLocalization.string("stance.select.createCustom \("Partners")", locale: english) == "Create “Partners”")
        #expect(StanceLocalization.string("stance.select.useCustom \("Partners")", locale: spanish).hasPrefix("Usar «"))
        #expect(StanceLocalization.string("stance.select.createCustom \("Partners")", locale: arabic).hasPrefix("إنشاء"))
    }

    @Test("An optional number is nil when the field is cleared or is not a number")
    func optionalNumber() {
        typealias L = StanceNumberFieldLogic
        #expect(L.commitOptional("", min: 0, max: 10, precision: 0, locale: english) == nil)
        #expect(L.commitOptional("   ", min: nil, max: nil, precision: 0, locale: english) == nil)
        #expect(L.commitOptional("abc", min: nil, max: nil, precision: 0, locale: english) == nil)
        #expect(L.commitOptional("7.26", min: 0, max: 10, precision: 1, locale: english) == 7.3)
        #expect(L.commitOptional("42", min: 0, max: 10, precision: 0, locale: english) == 10)
        #expect(L.commitOptional("1,5", min: nil, max: nil, precision: 1, locale: spanish) == 1.5)
        // The existing rule is unchanged: a field that always has a number keeps it.
        #expect(L.commit("", fallback: 4, min: 0, max: 10, precision: 0, locale: english) == 4)
    }

    @Test("Stepping from empty starts at the minimum or zero, as on the web")
    func steppingFromEmpty() {
        typealias L = StanceNumberFieldLogic
        #expect(L.steppingBase(min: nil, step: 1) == 0)
        #expect(L.steppingBase(min: -5, step: 1) == 0)
        #expect(L.steppingBase(min: 0, step: 1) == 0)
        #expect(L.steppingBase(min: 10, step: 5) == 5)
        #expect(L.stepping(L.steppingBase(min: 10, step: 5), by: 5, min: 10, max: nil, precision: 0) == 10)
    }

    @Test("Both bindings compile, and an empty field renders")
    @MainActor
    func bindings() throws {
        let amount: Double? = nil
        let fixed = 3.0
        _ = StanceNumberField("Seats", value: .constant(fixed))
        _ = StanceNumberField("Seats", value: .constant(amount), placeholder: "Any")
        _ = StanceCombobox("Tag", selection: .constant(String?.none), options: people, custom: .text)
        _ = StanceMultiSelect("Tags", selection: .constant(Set(["Partners"])), options: people, custom: .text)
        let renderer = ImageRenderer(content: VStack {
            StanceNumberField("Budget", value: .constant(amount), prefix: "€", placeholder: "No limit")
            StanceCombobox("Tag", selection: .constant(String?.some("Partners")), options: people, custom: .text)
            StanceMultiSelect("Tags", selection: .constant(Set(["Partners", "u1"])), options: people, custom: .text)
        }.frame(width: 360).environment(\.stanceTheme, .light))
        renderer.scale = 1
        #expect(try #require(renderer.cgImage).height > 150)
    }
}

@Suite("Grid table for iOS 17.0 to 17.3")
struct GridTableTests {
    struct User: Identifiable { let id: String; let name: String; let seats: Int }
    private let users = [User(id: "a", name: "Priya Nair", seats: 12), User(id: "b", name: "Lukas Brenner", seats: 3), User(id: "c", name: "Hana Sato", seats: 48)]
    private var columns: [StanceTableColumn<User>] {
        [StanceTableColumn("Name") { $0.name }, StanceTableColumn("Seats", alignment: .trailing, value: { String($0.seats) }, sortValue: { $0.seats })]
    }

    typealias M = StanceGridTableModel

    @Test("Columns fill the width in proportion to their content and never go under the minimum")
    func widths() {
        #expect(M.columnWidths(weights: [], available: 500, minimum: 96).isEmpty)
        #expect(M.columnWidths(weights: [1, 1], available: 500, minimum: 96) == [250, 250])
        #expect(M.columnWidths(weights: [3, 1], available: 592, minimum: 96) == [396, 196])
        // Too narrow: every column keeps its minimum and the table scrolls sideways.
        #expect(M.columnWidths(weights: [3, 1, 1], available: 200, minimum: 96) == [96, 96, 96])
        #expect(M.columnWidths(weights: [0, 0], available: 300, minimum: 96) == [150, 150])
        #expect(M.weights(rows: users, columns: columns) == [13, 5])
        #expect(M.weights(rows: [User(id: "x", name: String(repeating: "n", count: 90), seats: 1)], columns: columns) == [32, 5])
    }

    @Test("Headers say how they are sorted, and rows read every column")
    func words() {
        #expect(M.sortDescription(column: "Name", sort: nil, locale: english) == "Not sorted")
        #expect(M.sortDescription(column: "Name", sort: .init(column: "Seats"), locale: english) == "Not sorted")
        #expect(M.sortDescription(column: "Seats", sort: .init(column: "Seats"), locale: english) == "Ascending")
        #expect(M.sortDescription(column: "Seats", sort: .init(column: "Seats", ascending: false), locale: spanish) == "Descendente")
        #expect(M.rowLabel(users[0], columns: columns, locale: english) == "Name: Priya Nair, Seats: 12")
        #expect(StanceLocalization.string("stance.table.row \(2) \(3)", locale: english) == "Row 2 of 3")
        #expect(StanceLocalization.string("stance.table.selectAll", locale: arabic) == "تحديد كل الصفوف")
    }

    @Test("Sorting from a header uses the shared rules")
    func sorting() {
        typealias T = StanceDataTable<User>
        var sort = T.toggled(nil, column: "Seats")
        #expect(T.sorted(users, columns: columns, by: sort).map(\.id) == ["b", "a", "c"])
        sort = T.toggled(sort, column: "Seats")
        #expect(T.sorted(users, columns: columns, by: sort).map(\.id) == ["c", "a", "b"])
        sort = T.toggled(sort, column: "Name")
        #expect(sort == StanceTableSort(column: "Name"))
    }

    @Test("Selecting rows and selecting all")
    func selection() {
        let ids = users.map(\.id)
        #expect(M.selectionState(selection: Set<String>(), rows: ids) == .none)
        #expect(M.selectionState(selection: ["a"], rows: ids) == .some)
        #expect(M.selectionState(selection: ["a", "b", "c", "other"], rows: ids) == .all)
        #expect(M.toggling("a", in: Set<String>()) == ["a"])
        #expect(M.toggling("a", in: ["a", "b"]) == ["b"])
        #expect(M.togglingAll(selection: ["a"], rows: ids) == ["a", "b", "c"])
        #expect(M.togglingAll(selection: ["a", "b", "c", "other"], rows: ids) == ["other"])
    }

    @Test("The grid table renders in every theme, at the largest text size and right to left", arguments: StanceTheme.Mode.allCases)
    @MainActor
    func renders(mode: StanceTheme.Mode) throws {
        let theme = StanceTheme(mode: mode)
        func image(_ size: DynamicTypeSize, _ direction: LayoutDirection) throws -> CGImage {
            let table = StanceDataTable("Users", rows: users, columns: columns, sort: .constant(StanceTableSort(column: "Seats")), selection: .constant(Set(["a"])), layout: .grid)
                .frame(width: 600, height: 320)
                .environment(\.stanceTheme, theme)
                .environment(\.dynamicTypeSize, size)
                .environment(\.layoutDirection, direction)
                .environment(\.locale, direction == .rightToLeft ? arabic : english)
                .background(theme.colors.bgCanvas)
            let renderer = ImageRenderer(content: table)
            renderer.scale = 1
            return try #require(renderer.cgImage)
        }
        #expect(try image(.large, .leftToRight).width == 600)
        #expect(try image(.accessibility5, .leftToRight).height == 320)
        #expect(try image(.large, .rightToLeft).height == 320)
    }

    @Test("Highlighted code renders in every theme, wrapped, numbered and right to left", arguments: StanceTheme.Mode.allCases)
    @MainActor
    func codeRenders(mode: StanceTheme.Mode) throws {
        let theme = StanceTheme(mode: mode)
        let code = "struct Settings: View {\n    @State private var name = \"Sales\" // default\n    var body: some View { StanceButton(\"Deploy\") {} }\n}"
        func height(_ view: some View) throws -> Int {
            let renderer = ImageRenderer(content: view.frame(width: 390).environment(\.stanceTheme, theme).background(theme.colors.bgCanvas))
            renderer.scale = 1
            return try #require(renderer.cgImage).height
        }
        let plain = try height(StanceCodeBlock(code, title: "Settings.swift", showsLineNumbers: true))
        let highlighted = try height(StanceCodeBlock(code, language: "swift", title: "Settings.swift", showsLineNumbers: true))
        // Highlighting changes ink and weight, never the layout.
        #expect(plain == highlighted && plain > 100)
        #expect(try height(StanceCodeBlock(code, language: "swift", wraps: true)) >= highlighted - 60)
        #expect(try height(StanceCodeBlock(code, language: "swift").environment(\.layoutDirection, .rightToLeft)) > 80)
        let large = try height(StanceCodeBlock(code, language: "swift").environment(\.dynamicTypeSize, .accessibility5))
        #expect(large >= highlighted - 60)
        #expect(try height(StanceCodeBlock(code, language: "cobol")) > 80)
    }
}
