import XCTest

final class StanceShowcaseUITests: XCTestCase {
    override func setUp() {
        continueAfterFailure = true
    }

    private func launch(_ arguments: [String]) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = arguments
        app.launch()
        return app
    }

    /// Runs the system accessibility audit and reports each issue with the element it concerns.
    ///
    /// Three classes of finding are excluded, all artefacts of how the audit samples the screen:
    /// 1. Contrast for content scrolled beneath the translucent system tab bar or inside the soft
    ///   scroll-edge fade iOS 26 draws above it. The audit measures the dimmed pixels there, not
    ///   the element's own colours. Token contrast is verified exactly in the package's tests.
    /// 2. Hit region for secure text fields. The system reports the 20pt text line as the frame;
    ///   the real target is the 44pt field box, which focuses the field when tapped.
    /// 3. "Potentially inaccessible text" with no element: the visible field label and required
    ///   marker are deliberately hidden because the field itself carries them as its label and hint.
    private func audit(_ app: XCUIApplication, _ context: String) throws {
        let scrollEdgeFade: CGFloat = 72
        let tabBarTop = app.tabBars.firstMatch.exists ? app.tabBars.firstMatch.frame.minY : app.frame.maxY
        try app.performAccessibilityAudit(for: [.contrast, .hitRegion, .sufficientElementDescription, .elementDetection, .trait]) { issue in
            let element = issue.element
            if issue.auditType == .contrast, let frame = element?.frame, frame.maxY > tabBarTop - scrollEdgeFade { return true }
            if issue.auditType == .elementDetection, element == nil { return true }
            if issue.auditType == .hitRegion, element?.elementType == .secureTextField { return true }
            let name = element.map { "\($0.elementType.rawValue) “\($0.label)” \($0.frame.integral)" } ?? "unknown element"
            XCTFail("[\(context)] \(issue.compactDescription): \(name)")
            return true
        }
    }

    func testComponentsOverviewShowsEveryCategory() {
        let app = launch(["-screen", "components"])
        for id in ["actions", "forms", "dataDisplay", "feedback", "overlays", "navigation", "advanced", "ai"] {
            XCTAssertTrue(app.descendants(matching: .any)["category-\(id)"].waitForExistence(timeout: 5), "missing \(id)")
        }
    }

    func testSampleScreenValidatesAndOpensSheet() {
        let app = launch(["-screen", "sample"])
        XCTAssertTrue(app.buttons["Deploy"].waitForExistence(timeout: 5))
        app.buttons["Assign users"].tap()
        XCTAssertTrue(app.buttons["Done"].waitForExistence(timeout: 5))
        app.buttons["Done"].tap()
    }

    func testAssistantSendsADraftAndStreamsAReply() {
        let app = launch(["-screen", "assistant"])
        let field = app.textFields["Message"].firstMatch
        // The keyboard has a "send" key of its own. Match the composer's button by its label.
        let send = app.buttons.matching(NSPredicate(format: "label == %@", "Send")).firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        XCTAssertFalse(send.isEnabled)
        field.tap()
        field.typeText("List the biggest movements")
        XCTAssertTrue(send.isEnabled)
        send.tap()
        // The draft appears as a message, the reply streams in, and the composer is empty again.
        XCTAssertTrue(app.staticTexts["List the biggest movements"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["Thought for 2 seconds"].waitForExistence(timeout: 30))
        XCTAssertFalse(send.isEnabled)
        // Return sends too.
        field.tap()
        field.typeText("And the smallest\n")
        XCTAssertTrue(app.staticTexts["And the smallest"].waitForExistence(timeout: 10))
    }

    func testAccessibilityAuditAIComponentsInEveryTheme() throws {
        for theme in ["light", "dark", "high-contrast"] {
            let app = launch(["-screen", "components", "-category", "ai", "-stance-theme", theme])
            XCTAssertTrue(app.staticTexts["Conversation"].waitForExistence(timeout: 5), theme)
            try audit(app, "ai \(theme)")
            app.terminate()
        }
    }

    func testAccessibilityAuditSampleScreen() throws {
        let app = launch(["-screen", "sample", "-stance-theme", "light"])
        XCTAssertTrue(app.buttons["Deploy"].waitForExistence(timeout: 5))
        try audit(app, "sample")
    }

    func testAccessibilityAuditFormsInEveryTheme() throws {
        for theme in ["light", "dark", "high-contrast"] {
            let app = launch(["-screen", "components", "-category", "forms", "-stance-theme", theme])
            XCTAssertTrue(app.staticTexts["Text input"].waitForExistence(timeout: 5), theme)
            try audit(app, "forms \(theme)")
            app.terminate()
        }
    }
}
