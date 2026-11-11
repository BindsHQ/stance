import XCTest

/// Captures the documentation previews that need interaction: menus, sheets, alerts and
/// confirmation dialogs presented from a tapped trigger, plus full-screen navigation examples.
///
/// Inline component previews are captured by `platforms/ios/Scripts/build-previews.sh` with the
/// simulator's own screenshot instead, because XCUITest screenshots redact secure text fields.
/// This test runs only when `PREVIEW_OUT` is set, which that script does.
final class PreviewCaptureTests: XCTestCase {
    private let themes = ["light", "dark", "high-contrast"]
    /// Full-screen previews. `true` means a trigger must be tapped to present the system UI.
    private let screens: [(slug: String, tapTrigger: Bool)] = [
        ("stance-menu", true),
        ("stance-sheet", true),
        ("stance-alert", true),
        ("stance-confirmation-dialog", true),
        ("stance-adaptive-navigation", false),
        ("stance-navigation-chrome", false),
        ("stance-searchable-list", false),
        ("stance-document-preview", false),
    ]

    private func outputDirectory() throws -> URL {
        guard let path = ProcessInfo.processInfo.environment["PREVIEW_OUT"] else {
            throw XCTSkip("Set PREVIEW_OUT to capture previews. Use platforms/ios/Scripts/build-previews.sh.")
        }
        return URL(fileURLWithPath: path, isDirectory: true)
    }

    private func write(_ screenshot: XCUIScreenshot, _ name: String, to directory: URL) throws {
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        try screenshot.pngRepresentation.write(to: directory.appendingPathComponent(name))
    }

    func testCaptureScreenPreviews() throws {
        let out = try outputDirectory()
        for theme in themes {
            for screen in screens {
                let app = XCUIApplication()
                app.launchArguments = ["-preview", screen.slug, "-stance-theme", theme]
                app.launch()
                if screen.tapTrigger {
                    let trigger = app.descendants(matching: .any)["preview-trigger"].firstMatch
                    XCTAssertTrue(trigger.waitForExistence(timeout: 10), "no trigger for \(screen.slug)")
                    trigger.tap()
                }
                Thread.sleep(forTimeInterval: 1.6) // presentation animation
                try write(app.screenshot(), "\(screen.slug).\(theme).png", to: out)
                app.terminate()
            }
        }
    }
}
