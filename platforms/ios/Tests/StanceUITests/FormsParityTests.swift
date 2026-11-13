import Foundation
import SwiftUI
import Testing
@testable import StanceUI

@Suite("FormsParity range slider")
struct FormsParityRangeSliderTests {
    typealias L = StanceRangeSliderLogic

    @Test("Values snap to the step from the lower bound and stay inside the bounds")
    func snapping() {
        #expect(L.snap(42, in: 0 ... 100, step: 5) == 40)
        #expect(L.snap(43, in: 0 ... 100, step: 5) == 45)
        #expect(L.snap(-20, in: 0 ... 100, step: 5) == 0)
        #expect(L.snap(140, in: 0 ... 100, step: 5) == 100)
        #expect(L.snap(13, in: 10 ... 30, step: 4) == 14)
        #expect(L.snap(42.37, in: 0 ... 100, step: 0) == 42.37)
    }

    @Test("A thumb never passes the other thumb, and the other thumb never moves")
    func noCrossing() {
        #expect(L.moving(.lower, to: 90, in: 20 ... 60, bounds: 0 ... 100, step: 1) == 60 ... 60)
        #expect(L.moving(.upper, to: 5, in: 20 ... 60, bounds: 0 ... 100, step: 1) == 20 ... 20)
        #expect(L.moving(.lower, to: 31, in: 20 ... 60, bounds: 0 ... 100, step: 10) == 30 ... 60)
        #expect(L.moving(.upper, to: 200, in: 20 ... 60, bounds: 0 ... 100, step: 10) == 20 ... 100)
    }

    @Test("The minimum distance keeps the thumbs apart")
    func minimumDistance() {
        #expect(L.moving(.lower, to: 58, in: 20 ... 60, bounds: 0 ... 100, step: 1, minDistance: 10) == 50 ... 60)
        #expect(L.moving(.upper, to: 21, in: 20 ... 60, bounds: 0 ... 100, step: 1, minDistance: 10) == 20 ... 30)
        // Near a bound the gap cannot push a thumb outside the bounds.
        #expect(L.moving(.upper, to: 0, in: 95 ... 100, bounds: 0 ... 100, step: 1, minDistance: 10) == 95 ... 100)
    }

    @Test("VoiceOver increments and decrements move one thumb by one step")
    func adjustable() {
        #expect(L.adjusting(.lower, by: 1, in: 20 ... 60, bounds: 0 ... 100, step: 5) == 25 ... 60)
        #expect(L.adjusting(.lower, by: -1, in: 20 ... 60, bounds: 0 ... 100, step: 5) == 15 ... 60)
        #expect(L.adjusting(.upper, by: 1, in: 20 ... 60, bounds: 0 ... 100, step: 5) == 20 ... 65)
        #expect(L.adjusting(.upper, by: -1, in: 20 ... 20, bounds: 0 ... 100, step: 5) == 20 ... 20)
        #expect(L.adjusting(.lower, by: -1, in: 0 ... 60, bounds: 0 ... 100, step: 5) == 0 ... 60)
        // A continuous slider moves by a hundredth of its bounds.
        #expect(L.adjusting(.upper, by: 1, in: 0 ... 500, bounds: 0 ... 1000, step: 0) == 0 ... 510)
    }

    @Test("Fractions place values along the track")
    func fractions() {
        #expect(L.fraction(of: 25, in: 0 ... 100) == 0.25)
        #expect(L.fraction(of: -5, in: 0 ... 100) == 0)
        #expect(L.fraction(of: 5, in: 5 ... 5) == 0)
    }
}

@Suite("FormsParity pin field")
struct FormsParityPinFieldTests {
    typealias L = StancePinFieldLogic

    @Test("Numeric codes keep digits only")
    func numeric() {
        #expect(L.sanitize("12a3", length: 6, characters: .numeric) == "123")
        #expect(L.sanitize("", length: 6, characters: .numeric) == "")
    }

    @Test("Pasted codes drop separators and stop at the length")
    func paste() {
        #expect(L.sanitize("123 456", length: 6, characters: .numeric) == "123456")
        #expect(L.sanitize("123-456", length: 6, characters: .numeric) == "123456")
        #expect(L.sanitize("Your code is 482913.", length: 6, characters: .numeric) == "482913")
        #expect(L.sanitize("12345678", length: 6, characters: .numeric) == "123456")
        #expect(L.sanitize("12345678", length: 4, characters: .numeric) == "1234")
    }

    @Test("Digits from other scripts become 0 to 9")
    func otherScripts() {
        #expect(L.sanitize("\u{0661}\u{0662}\u{0663}", length: 6, characters: .numeric) == "123")
    }

    @Test("Alphanumeric codes keep Latin letters and digits")
    func alphanumeric() {
        #expect(L.sanitize("ab-12 cd", length: 6, characters: .alphanumeric) == "ab12cd")
        #expect(L.sanitize("é1", length: 6, characters: .alphanumeric) == "1")
        #expect(L.sanitize("ABCDEFGH", length: 6, characters: .alphanumeric) == "ABCDEF")
    }

    @Test("Completion and the active box")
    func completion() {
        #expect(L.isComplete("123456", length: 6))
        #expect(!L.isComplete("12345", length: 6))
        #expect(!L.isComplete("", length: 0))
        #expect(L.activeIndex(for: "12", length: 6) == 2)
        #expect(L.activeIndex(for: "123456", length: 6) == nil)
    }
}

@Suite("FormsParity number field")
struct FormsParityNumberFieldTests {
    typealias L = StanceNumberFieldLogic
    let english = Locale(identifier: "en_US")
    let german = Locale(identifier: "de_DE")

    @Test("Bounds clamp, and open bounds do not")
    func bounds() {
        #expect(L.clamp(120, min: 1, max: 100) == 100)
        #expect(L.clamp(-3, min: 1, max: 100) == 1)
        #expect(L.clamp(1e9, min: nil, max: nil) == 1e9)
    }

    @Test("Stepping rounds to the precision and stops at the bounds")
    func stepping() {
        #expect(L.stepping(48, by: 1, min: 1, max: 50, precision: 0) == 49)
        #expect(L.stepping(50, by: 1, min: 1, max: 50, precision: 0) == 50)
        #expect(L.stepping(0.1, by: 0.2, min: nil, max: nil, precision: 1) == 0.3)
        #expect(L.stepping(1, by: -5, min: 0, max: nil, precision: 0) == 0)
    }

    @Test("Precision rounding")
    func rounding() {
        #expect(L.round(2.345, precision: 2) == 2.35)
        #expect(L.round(2.5, precision: 0) == 3)
        #expect(L.round(7.0, precision: -1) == 7)
    }

    @Test("Formatting follows the locale and the precision")
    func formatting() {
        #expect(L.format(1234.5, precision: 2, locale: english) == "1,234.50")
        #expect(L.format(1234.5, precision: 2, locale: german) == "1.234,50")
        #expect(L.format(48, precision: 0, locale: english) == "48")
    }

    @Test("Parsing reads grouped and plain numbers, and rejects text")
    func parsing() {
        #expect(L.parse("1,234.5", locale: english) == 1234.5)
        #expect(L.parse("1.234,5", locale: german) == 1234.5)
        #expect(L.parse(" 42 ", locale: english) == 42)
        #expect(L.parse("seats", locale: english) == nil)
        #expect(L.parse("", locale: english) == nil)
    }

    @Test("Committing a draft parses, rounds and clamps, or keeps the old value")
    func commit() {
        #expect(L.commit("500", fallback: 10, min: 1, max: 100, precision: 0, locale: english) == 100)
        #expect(L.commit("12.6", fallback: 10, min: 1, max: 100, precision: 0, locale: english) == 13)
        #expect(L.commit("lots", fallback: 10, min: 1, max: 100, precision: 0, locale: english) == 10)
    }
}

@Suite("FormsParity option filtering")
struct FormsParityFilterTests {
    let people: [StanceSelectOption<String>] = [
        .init("amara", label: "Amara Okafor", detail: "Legal"),
        .init("lukas", label: "Lukas Brenner", detail: "Sales"),
        .init("tomas", label: "Tomás Ruiz", detail: "Sales"),
        .init("priya", label: "Priya Nair", detail: "Admin"),
        .init("sam", label: "Samira Haddad", detail: "Finance"),
    ]

    private func run(_ query: String) -> [String] {
        StanceOptionFilter.filter(people, query: query).map(\.value)
    }

    @Test("An empty or blank query returns every option in order")
    func empty() {
        #expect(run("") == ["amara", "lukas", "tomas", "priya", "sam"])
        #expect(run("  ") == run(""))
    }

    @Test("Matching ignores case and accents and searches the detail")
    func matching() {
        #expect(run("TOMAS") == ["tomas"])
        #expect(run("sales") == ["lukas", "tomas"])
        #expect(run("zz").isEmpty)
    }

    @Test("Labels that start with the query come first")
    func ranking() {
        // "Sa" starts Samira's name and appears in the Sales detail of Lukas and Tomás.
        #expect(run("sa") == ["sam", "lukas", "tomas"])
    }

    @Test("Select all reports none, some or all")
    func checkState() {
        #expect(StanceCheckState.resolve(selectedCount: 0, total: 3) == .unchecked)
        #expect(StanceCheckState.resolve(selectedCount: 2, total: 3) == .mixed)
        #expect(StanceCheckState.resolve(selectedCount: 3, total: 3) == .checked)
        #expect(StanceCheckState.resolve(selectedCount: 0, total: 0) == .unchecked)
    }
}

@Suite("FormsParity dates and inline edit")
struct FormsParityDateTests {
    let utc: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        return calendar
    }()

    private func day(_ value: Int) -> Date {
        utc.date(from: DateComponents(year: 2026, month: 11, day: value, hour: 9))!
    }

    @Test("The end never comes before the start")
    func ordering() {
        let range = day(10) ... day(14)
        #expect(StanceDateRangeLogic.settingStart(day(12), in: range) == day(12) ... day(14))
        #expect(StanceDateRangeLogic.settingStart(day(20), in: range) == day(20) ... day(20))
        #expect(StanceDateRangeLogic.settingEnd(day(5), in: range) == day(10) ... day(10))
        #expect(StanceDateRangeLogic.settingEnd(day(18), in: range) == day(10) ... day(18))
    }

    @Test("Day counts include both ends")
    func days() {
        #expect(StanceDateRangeLogic.dayCount(day(10) ... day(14), calendar: utc) == 5)
        #expect(StanceDateRangeLogic.dayCount(day(10) ... day(10), calendar: utc) == 1)
    }

    @Test("Inline edit trims on commit when asked")
    func trimming() {
        #expect(StanceInlineEditLogic.committedValue("  Sales team  \n", trims: true) == "Sales team")
        #expect(StanceInlineEditLogic.committedValue("  Sales team ", trims: false) == "  Sales team ")
    }
}

/// Renders every forms parity component off screen in every theme, at the largest
/// accessibility text size and right to left in Arabic.
@Suite("FormsParity rendering")
@MainActor
struct FormsParityRenderingTests {
    struct Gallery: View {
        @State private var range = 1000.0 ... 5000.0
        @State private var code = "4829"
        @State private var seats = 48.0
        @State private var owner: String? = "priya"
        @State private var teams: Set<String> = ["sales", "legal"]
        @State private var channels: Set<String> = ["email"]
        @State private var dates = Date(timeIntervalSince1970: 1_794_390_060) ... Date(timeIntervalSince1970: 1_794_390_060 + 6 * 86400)
        @State private var time = Date(timeIntervalSince1970: 1_794_390_060)
        @State private var name = "Sales team signature"

        private let people: [StanceSelectOption<String>] = [.init("priya", label: "Priya Nair", detail: "Admin"), .init("lukas", label: "Lukas Brenner", detail: "Sales")]
        private let departments: [StanceSelectOption<String>] = [.init("sales", label: "Sales"), .init("legal", label: "Legal"), .init("finance", label: "Finance")]

        var body: some View {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceRangeSlider("Contract value", value: $range, in: 0 ... 10000, step: 500)
                StancePinField("Verification code", code: $code)
                StancePinField("PIN", code: $code, length: 4, isMasked: true, error: "That code has expired.")
                StanceNumberField("Licence seats", value: $seats, min: 1, max: 500, suffix: "seats")
                StanceCombobox("Template owner", selection: $owner, options: people)
                StanceMultiSelect("Departments", selection: $teams, options: departments, maxTags: 1)
                StanceCheckboxGroup("Notify by", selection: $channels, options: [.init("email", label: "Email"), .init("push", label: "Push", detail: "On this device")], showsSelectAll: true)
                StanceDateRangePicker("Campaign window", range: $dates, presets: [.init("Next 7 days", range: dates)])
                StanceTimePicker("Deploy at", selection: $time)
                StanceInlineEdit("Template name", text: $name)
            }
            .padding()
            .frame(width: 390)
        }
    }

    private func render(_ mode: StanceTheme.Mode, size: DynamicTypeSize = .large, rightToLeft: Bool = false) throws -> CGImage {
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
        #expect(image.height > 700)
    }

    @Test("Renders and grows at the largest accessibility text size", arguments: StanceTheme.Mode.allCases)
    func accessibilitySize(mode: StanceTheme.Mode) throws {
        let large = try render(mode, size: .accessibility5).height, regular = try render(mode).height
        #expect(large >= regular)
        #if os(iOS)
        // Dynamic Type scales text on iOS only; macOS renders every size alike.
        #expect(large > regular, "\(large) vs \(regular)")
        #endif
    }

    @Test("Renders right to left in Arabic", arguments: StanceTheme.Mode.allCases)
    func rightToLeft(mode: StanceTheme.Mode) throws {
        let image = try render(mode, rightToLeft: true)
        #expect(image.width == 390)
        #expect(image.height > 700)
    }

    @Test("Fields keep the 44pt minimum target")
    func targets() throws {
        func height<V: View>(_ view: V) throws -> Int {
            let renderer = ImageRenderer(content: view.frame(width: 300).environment(\.stanceTheme, .light))
            renderer.scale = 1
            return try #require(renderer.cgImage).height
        }
        #expect(try height(StanceRangeSlider("Value", value: .constant(10 ... 20))) >= 44)
        #expect(try height(StanceInlineEdit("Name", text: .constant("Sales"))) >= 44)
        #expect(try height(StanceTimePicker("Time", selection: .constant(Date()))) >= 44)
    }
}
