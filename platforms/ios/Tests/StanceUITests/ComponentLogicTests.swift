import Foundation
import SwiftUI
import Testing
@testable import StanceUI

@Suite("SVG path parser")
struct PathParserTests {
    @Test("Absolute and relative lines")
    func lines() {
        let s = StancePathParser.segments("M5 12.5l4.5 4.5L19 7.5")
        #expect(s == [.move(CGPoint(x: 5, y: 12.5)), .line(CGPoint(x: 9.5, y: 17)), .line(CGPoint(x: 19, y: 7.5))])
    }

    @Test("Implicit lineto after moveto, H and V, close")
    func implicit() {
        let s = StancePathParser.segments("M4 6 20 6v14H4z")
        #expect(s == [.move(CGPoint(x: 4, y: 6)), .line(CGPoint(x: 20, y: 6)), .line(CGPoint(x: 20, y: 20)), .line(CGPoint(x: 4, y: 20)), .close])
    }

    @Test("Compact numbers: negative signs and repeated decimals separate values")
    func compact() {
        let s = StancePathParser.segments("M12 7.5v5M10-2l.5.25")
        #expect(s.count == 4)
        #expect(s[3] == .line(CGPoint(x: 10.5, y: -1.75)))
    }

    @Test("Cubic and smooth cubic reflect the previous control point")
    func curves() {
        let s = StancePathParser.segments("M0 0C0 10 10 10 10 0S20 -10 20 0")
        #expect(s[1] == .curve(to: CGPoint(x: 10, y: 0), control1: CGPoint(x: 0, y: 10), control2: CGPoint(x: 10, y: 10)))
        #expect(s[2] == .curve(to: CGPoint(x: 20, y: 0), control1: CGPoint(x: 10, y: -10), control2: CGPoint(x: 20, y: -10)))
    }

    @Test("Arcs become curves that end exactly at the target, with compact flags")
    func arcs() {
        let s = StancePathParser.segments("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z")
        #expect(s.first == .move(CGPoint(x: 12, y: 21)))
        #expect(s.last == .close)
        let ends = s.compactMap { if case let .curve(to, _, _) = $0 { to } else { nil } }
        #expect(ends.contains { abs($0.x - 12) < 0.001 && abs($0.y - 3) < 0.001 })
        #expect(abs(ends.last!.x - 12) < 0.001 && abs(ends.last!.y - 21) < 0.001)
        let bounds = StancePathParser.path("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z").boundingRect
        #expect(abs(bounds.width - 18) < 0.05 && abs(bounds.height - 18) < 0.05)
        // Flags written without separators.
        #expect(StancePathParser.segments("M0 0a5 5 0 0110 0").count == StancePathParser.segments("M0 0a5 5 0 0 1 10 0").count)
    }

    @Test("Every shipped icon parses to drawable geometry inside the 24pt grid", arguments: StanceIconName.allCases)
    func icons(icon: StanceIconName) {
        var path = Path()
        for data in icon.pathData {
            let segments = StancePathParser.segments(data)
            #expect(!segments.isEmpty, "\(icon.rawValue) has an unparsed path")
            path.addPath(StancePathParser.path(data))
        }
        let b = path.boundingRect
        #expect(b.minX >= -0.5 && b.minY >= -0.5 && b.maxX <= 24.5 && b.maxY <= 24.5, "\(icon.rawValue) bounds \(b)")
    }

    @Test("The icon set matches the web set")
    func count() {
        #expect(StanceIconName.allCases.count >= 90)
        #expect(StanceIconName(rawValue: "chevron-down") == .chevronDown)
    }
}

@Suite("Form state")
struct FormStateTests {
    @Test("Invalid only with a non-empty error")
    func invalid() {
        #expect(!StanceFieldState().isInvalid)
        #expect(!StanceFieldState(error: "").isInvalid)
        #expect(StanceFieldState(error: "Enter a valid email").isInvalid)
    }

    @Test("VoiceOver hears required, then the error instead of the helper")
    func suffix() {
        #expect(StanceFieldState(isRequired: true).accessibilitySuffix(helper: "Visible to your organisation", locale: Locale(identifier: "en")) == "required, Visible to your organisation")
        #expect(StanceFieldState(error: "Required", isRequired: true).accessibilitySuffix(helper: "Help", locale: Locale(identifier: "en")) == "required, Error: Required")
        #expect(StanceFieldState().accessibilitySuffix(helper: nil) == "")
    }
}

@Suite("Toast queue")
@MainActor
struct ToastTests {
    @Test("Shows one at a time in order and advances on dismiss")
    func queue() {
        let center = StanceToastCenter()
        center.autoDismiss = false
        center.show("Template saved", tone: .success)
        center.show("Signature deployed")
        center.show("Upload failed", tone: .danger)
        #expect(center.current?.message == "Template saved")
        #expect(center.queue.map(\.message) == ["Signature deployed", "Upload failed"])
        center.dismiss()
        #expect(center.current?.message == "Signature deployed")
        center.dismiss()
        #expect(center.current?.tone == .danger)
        center.dismiss()
        #expect(center.current == nil)
        #expect(center.queue.isEmpty)
    }

    @Test("Dismisses automatically after its duration")
    func auto() async throws {
        let center = StanceToastCenter()
        center.show("Saved", duration: 0.05)
        #expect(center.current != nil)
        // Poll rather than sleep a fixed time: other suites may be using the main actor.
        for _ in 0 ..< 100 where center.current != nil {
            try await Task.sleep(for: .milliseconds(50))
        }
        #expect(center.current == nil)
    }
}

@Suite("Data display logic")
@MainActor
struct DataDisplayTests {
    @Test("Avatar initials", arguments: [("Priya Nair", "PN"), ("Amara", "A"), ("Jean-Luc Picard", "JP"), ("  ", "?"), ("tomás ruiz", "TR")])
    func initials(name: String, expected: String) {
        #expect(StanceAvatar.initials(for: name) == expected)
    }

    @Test("Stat changes are described in words")
    func stat() {
        #expect(StanceStatCard("Deployments", value: "48", change: 0.12).changeDescription(locale: Locale(identifier: "en")) == "up 12% from last month")
        #expect(StanceStatCard("Failures", value: "3", change: -0.5, period: "this week").changeDescription(locale: Locale(identifier: "en")) == "down 50% this week")
        #expect(StanceStatCard("Users", value: "10", change: 0).changeDescription(locale: Locale(identifier: "en")) == "no change from last month")
        #expect(StanceStatCard("Users", value: "10").changeDescription == nil)
    }

    @Test("Every tone has distinct foreground and background roles and an icon")
    func tones() {
        for tone in StanceTone.allCases {
            #expect(tone.foreground(.light) != tone.background(.light))
            _ = tone.icon
        }
    }
}

@Suite("Signature")
struct SignatureTests {
    @Test("Undo and clear")
    func editing() {
        var s = StanceSignature()
        #expect(s.isEmpty)
        s.strokes.append([CGPoint(x: 0, y: 0), CGPoint(x: 10, y: 10)])
        s.strokes.append([CGPoint(x: 5, y: 5)])
        #expect(!s.isEmpty)
        s.undo()
        #expect(s.strokes.count == 1)
        s.clear()
        #expect(s.isEmpty)
        s.undo() // no crash on empty
    }

    @Test("Path covers the drawn points, including single taps")
    func path() {
        let s = StanceSignature(strokes: [[CGPoint(x: 10, y: 20), CGPoint(x: 60, y: 40), CGPoint(x: 110, y: 20)], [CGPoint(x: 5, y: 5)]])
        let b = s.path.boundingRect
        // Strokes are smoothed through midpoints, so the curve peaks just short of the raw point.
        #expect(b.minX <= 5 && b.maxX >= 110 && b.maxY >= 29 && b.maxY <= 40)
    }
}

@Suite("Search filtering")
@MainActor
struct SearchTests {
    struct User: Identifiable { let id: Int; let name: String }
    let users = [User(id: 1, name: "Priya Nair"), User(id: 2, name: "Lukas Brenner"), User(id: 3, name: "Hana Sato")]

    @Test("Empty or whitespace query returns everything; otherwise matches")
    func filter() {
        typealias L = StanceSearchableList<User, EmptyView>
        func run(_ query: String) -> [Int] {
            L.filter(users, query: query) { $0.name.localizedCaseInsensitiveContains($1) }.map(\.id)
        }
        #expect(run("") == [1, 2, 3])
        #expect(run("   ") == [1, 2, 3])
        #expect(run(" sa ") == [3])
        #expect(run("zz").isEmpty)
    }
}
