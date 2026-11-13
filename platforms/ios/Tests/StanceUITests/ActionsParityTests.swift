import Foundation
import SwiftUI
import Testing
@testable import StanceUI

@Suite("Actions parity: accordion")
struct AccordionLogicTests {
    typealias L = StanceAccordionLogic

    @Test("Multiple mode opens and closes sections independently")
    func multiple() {
        #expect(L.toggling("a", in: [], mode: .multiple) == ["a"])
        #expect(L.toggling("b", in: ["a"], mode: .multiple) == ["a", "b"])
        #expect(L.toggling("a", in: ["a", "b"], mode: .multiple) == ["b"])
    }

    @Test("Single mode keeps at most one section open")
    func single() {
        #expect(L.toggling("b", in: ["a"], mode: .single) == ["b"])
        #expect(L.toggling("a", in: ["a"], mode: .single) == [])
        // Not collapsible: the open section stays open.
        #expect(L.toggling("a", in: ["a"], mode: .single, collapsible: false) == ["a"])
        #expect(L.toggling("b", in: ["a"], mode: .single, collapsible: false) == ["b"])
    }
}

@Suite("Actions parity: toggle buttons")
struct ToggleGroupLogicTests {
    typealias L = StanceToggleGroupLogic

    @Test("Single choice selects, switches and clears unless required")
    func single() {
        #expect(L.toggling("left", in: nil, isRequired: false) == "left")
        #expect(L.toggling("right", in: "left", isRequired: false) == "right")
        #expect(L.toggling("left", in: "left", isRequired: false) == nil)
        #expect(L.toggling("left", in: "left", isRequired: true) == "left")
    }

    @Test("Multiple choice adds and removes")
    func multiple() {
        #expect(L.toggling("bold", in: []) == ["bold"])
        #expect(L.toggling("italic", in: ["bold"]) == ["bold", "italic"])
        #expect(L.toggling("bold", in: ["bold", "italic"]) == ["italic"])
    }
}

@Suite("Actions parity: tabs and strings")
@MainActor
struct TabsAndStringsTests {
    @Test("Tab titles carry their badge count in the locale's digits")
    func titles() {
        typealias T = StanceTabs<String, EmptyView>
        #expect(T.title(for: StanceTab(id: "a", title: "Activity"), locale: Locale(identifier: "en")) == "Activity")
        #expect(T.title(for: StanceTab(id: "a", title: "Activity", badge: 1200), locale: Locale(identifier: "en")) == "Activity (1,200)")
    }

    @Test("Built in strings resolve in every language")
    func strings() {
        let en = Locale(identifier: "en"), ar = Locale(identifier: "ar"), es = Locale(identifier: "es")
        #expect(StanceLocalization.string("stance.tabs.position \(2) \(4)", locale: en) == "Tab 2 of 4")
        #expect(StanceLocalization.string("stance.tabs.position \(2) \(4)", locale: es) == "Pestaña 2 de 4")
        #expect(StanceLocalization.string("stance.splitButton.more", locale: en) == "More options")
        #expect(StanceLocalization.string("stance.notification.unread", locale: ar) == "غير مقروء")
        #expect(StanceLocalization.string("stance.notification.markRead", locale: es) == "Marcar como leído")
        #expect(StanceLocalization.string("stance.pagination.next", locale: en) == "Next")
        #expect(StanceLocalization.string("stance.range.lower", locale: en) == "Minimum")
        #expect(StanceLocalization.string("stance.select.count \(3)", locale: en) == "3 selected")
        #expect(StanceLocalization.string("stance.chart.categories \(2)", locale: ar) == "فئتان")
    }
}

/// Renders the actions, chips, tabs, accordion and notification rows in every theme, at the
/// largest accessibility size and right to left.
@Suite("Actions parity: rendering")
@MainActor
struct ActionsParityRenderingTests {
    struct Gallery: View {
        @State private var open: Set<String> = ["billing"]
        @State private var tab = "details"
        @State private var bold = true
        @State private var align: String? = "left"
        @State private var channels: Set<String> = ["email"]
        @State private var live = true

        var body: some View {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceAccordion([
                    StanceAccordionSection(id: "billing", title: "Billing", subtitle: "Invoices and payment"),
                    StanceAccordionSection(id: "relay", title: "Relay settings"),
                    StanceAccordionSection(id: "legacy", title: "Legacy import", isDisabled: true),
                ], expanded: $open, mode: .single) { _ in
                    Text("Invoices go out on the first of the month.")
                }
                StanceAccordion([StanceAccordionSection(id: "a", title: "Separated")], expanded: .constant(["a"]), variant: .separated) { _ in Text("Body") }
                StanceTabs([StanceTab(id: "details", title: "Details"), StanceTab(id: "activity", title: "Activity", icon: .activity, badge: 3), StanceTab(id: "users", title: "Users")], selection: $tab) { Text($0) }
                StanceTabs([StanceTab(id: "details", title: "Details"), StanceTab(id: "activity", title: "Activity")], selection: $tab, style: .segmented) { Text($0) }
                StanceButtonGroup {
                    StanceCopyButton(value: "org_7Hk2")
                    StanceCopyButton(value: "org_7Hk2", showsLabel: false, variant: .ghost)
                    StanceSplitButton("Deploy", icon: .send, action: {}) { Button("Schedule") {} }
                    StanceSplitButton("Export", variant: .outline, action: {}) { Button("CSV") {} }
                }
                StanceToggleButton("Bold", isOn: $bold)
                StanceToggleButtonGroup("Alignment", selection: $align, options: [StanceToggleOption("left", title: "Left"), StanceToggleOption("right", title: "Right")])
                StanceToggleButtonGroup("Channels", selection: $channels, options: [StanceToggleOption("email", title: "Email"), StanceToggleOption("sms", title: "SMS"), StanceToggleOption("push", title: "Push")])
                HStack {
                    StanceChip("Priya Nair", icon: .user, onRemove: {})
                    StanceChip("Sales", action: {})
                }
                HStack {
                    StanceFilterChip("Live", count: 12, isOn: $live)
                    StanceFilterChip("Draft", isOn: .constant(false))
                }
                StanceNotificationRow("Deployment finished", message: "48 mailboxes now use the sales signature.", time: "2 min ago", isUnread: true) {
                    StanceAvatar(name: "Priya Nair", size: .small)
                } onToggleRead: {} onDelete: {}
                StanceNotificationRow("Template approved", time: "Yesterday")
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

    @Test("Controls keep the 44pt minimum target")
    func targets() throws {
        func size<V: View>(_ view: V) throws -> CGSize {
            let renderer = ImageRenderer(content: view.environment(\.stanceTheme, .light))
            renderer.scale = 1
            let image = try #require(renderer.cgImage)
            return CGSize(width: image.width, height: image.height)
        }
        #expect(try size(StanceCopyButton(value: "x")).height >= 44)
        #expect(try size(StanceToggleButton("Bold", isOn: .constant(true), size: .small).fixedSize()).height >= 44)
        #expect(try size(StanceFilterChip("Live", isOn: .constant(true))).height >= 44)
        #expect(try size(StanceChip("Sales", onRemove: {})).height >= 44)
        #expect(try size(StanceSplitButton("Deploy", action: {}) { Button("Later") {} }).height >= 44)
        #expect(try size(StanceNotificationRow("Saved").frame(width: 300)).height >= 44)
    }
}
