import StanceUI
import SwiftUI

/// Preview compositions for the accordion, tabs, copy, split and toggle buttons, chips and
/// notification rows, keyed by `components.json` slug. `PreviewCatalog.all` appends these.
@MainActor
enum ActionsParityPreviewCatalog {
    typealias Entry = PreviewCatalog.Entry

    static let entries: [Entry] = [
        Entry("stance-accordion") { AccordionPreview() },
        Entry("stance-tabs") { TabsPreview() },
        Entry("stance-copy-button") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                HStack(spacing: StanceSpacing.md) {
                    Text("org_7Hk2").stanceText(.mono)
                    Spacer()
                    StanceCopyButton(value: "org_7Hk2", label: "Copy ID")
                }
                StanceDivider()
                HStack(spacing: StanceSpacing.md) {
                    Text("https://binds.si/s/sales").stanceText(.mono).lineLimit(1)
                    Spacer()
                    StanceCopyButton(value: "https://binds.si/s/sales", label: "Copy link", showsLabel: false, variant: .ghost)
                }
            }
            .stanceCard()
        },
        Entry("stance-split-button") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                StanceSplitButton("Deploy", icon: .send, action: {}) {
                    Button("Deploy to a test group") {}
                    Button("Schedule deployment") {}
                }
                StanceSplitButton("Save draft", variant: .secondary, action: {}) {
                    Button("Save as new template") {}
                }
                StanceSplitButton("Export", variant: .outline, action: {}) {
                    Button("CSV") {}
                    Button("PDF") {}
                }
            }
        },
        Entry("stance-toggle-button") {
            HStack(spacing: StanceSpacing.sm) {
                StanceToggleButton("Show archived", icon: .inbox, isOn: .constant(true))
                StanceToggleButton("Only mine", isOn: .constant(false))
                Spacer(minLength: 0)
            }
            .stanceCard()
        },
        Entry("stance-toggle-button-group") { ToggleGroupPreview() },
        Entry("stance-chip") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                Text("Recipients").stanceText(.label)
                HStack(spacing: StanceSpacing.sm) {
                    StanceChip("Priya Nair", icon: .user, onRemove: {})
                    StanceChip("Sales team", icon: .users, onRemove: {})
                }
                HStack(spacing: StanceSpacing.sm) {
                    StanceChip("Add people", icon: .plus, action: {})
                    StanceChip("Read only")
                }
            }
            .stanceCard()
        },
        Entry("stance-filter-chip") {
            HStack(spacing: StanceSpacing.sm) {
                StanceFilterChip("Live", count: 12, isOn: .constant(true))
                StanceFilterChip("Draft", count: 3, isOn: .constant(false))
                StanceFilterChip("Mine", isOn: .constant(false))
                Spacer(minLength: 0)
            }
        },
        Entry("stance-notification-row") {
            VStack(spacing: 0) {
                StanceNotificationRow("Deployment finished", message: "48 mailboxes now use the sales team signature.", time: "2 min ago", isUnread: true) {
                    StanceAvatar(name: "Priya Nair", size: .small)
                }
                StanceDivider()
                StanceNotificationRow("Relay reconnected", message: "Exchange Online is back. Queued deployments will resume.", time: "1 h ago", isUnread: true) {
                    StanceIcon(.refresh).frame(width: StanceSize.controlSm, height: StanceSize.controlSm)
                }
                StanceDivider()
                StanceNotificationRow("Legal approved the disclaimer", time: "Yesterday") {
                    StanceAvatar(name: "Amara Okafor", size: .small)
                }
            }
            .stanceCard(padding: StanceSpacing.md)
        },
    ]
}

private struct AccordionPreview: View {
    @State private var open: Set<String> = ["relay"]

    var body: some View {
        StanceAccordion([
            StanceAccordionSection(id: "relay", title: "How do deployments reach Outlook?"),
            StanceAccordionSection(id: "sync", title: "How often do signatures sync?"),
            StanceAccordionSection(id: "legal", title: "Who can edit the legal disclaimer?"),
        ], expanded: $open, mode: .single) { section in
            Text(Self.answers[section.id] ?? "").stanceText(.bodySmall)
        }
    }

    static let answers = [
        "relay": "The Exchange relay adds the signature as each message leaves your organisation, on every device.",
        "sync": "Every 15 minutes. Changes made now appear after the next sync.",
        "legal": "Admins and members of the Legal team.",
    ]
}

private struct TabsPreview: View {
    @State private var tab = "details"
    @State private var view = "list"

    var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.xl) {
            StanceTabs([
                StanceTab(id: "details", title: "Details"),
                StanceTab(id: "activity", title: "Activity", badge: 3),
                StanceTab(id: "users", title: "Users"),
            ], selection: $tab, label: "Template") { _ in
                StanceDescriptionList([("Owner", "Priya Nair"), ("Mailboxes", "48")])
            }
            StanceTabs([StanceTab(id: "list", title: "List"), StanceTab(id: "grid", title: "Grid")], selection: $view, style: .segmented, label: "Layout") { _ in
                EmptyView()
            }
        }
        .stanceCard()
    }
}

private struct ToggleGroupPreview: View {
    @State private var layout: String? = "list"
    @State private var channels: Set<String> = ["email", "teams"]

    var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.lg) {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                Text("Layout").stanceText(.label)
                StanceToggleButtonGroup("Layout", selection: $layout, options: [
                    StanceToggleOption("list", title: "List", icon: .list),
                    StanceToggleOption("grid", title: "Grid", icon: .layoutGrid),
                ], isRequired: true)
            }
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                Text("Notify by").stanceText(.label)
                StanceToggleButtonGroup("Notify by", selection: $channels, options: [
                    StanceToggleOption("email", title: "Email"),
                    StanceToggleOption("teams", title: "Teams"),
                    StanceToggleOption("sms", title: "SMS"),
                ], size: .small)
            }
        }
        .stanceCard()
    }
}

/// Interactive sections for the actions catalogue.
struct ActionsParityDemo: View {
    @State private var archived = false
    @State private var layout: String? = "list"
    @State private var chips = ["Priya Nair", "Sales team", "Legal"]
    @Environment(StanceToastCenter.self) private var toasts

    var body: some View {
        Group {
            StanceSection("Split, copy and toggle buttons", caption: "Touch and hold Deploy, or tap the chevron, for more options.") {
                VStack(alignment: .leading, spacing: StanceSpacing.md) {
                    StanceSplitButton("Deploy", icon: .send, action: { toasts.show("Deployment started") }) {
                        Button("Deploy to a test group") { toasts.show("Sent to the test group") }
                        Button("Schedule deployment") {}
                    }
                    HStack {
                        Text("org_7Hk2").stanceText(.mono)
                        Spacer()
                        StanceCopyButton(value: "org_7Hk2", label: "Copy ID")
                    }
                    StanceToggleButton("Show archived", icon: .inbox, isOn: $archived)
                    StanceToggleButtonGroup("Layout", selection: $layout, options: [
                        StanceToggleOption("list", title: "List", icon: .list),
                        StanceToggleOption("grid", title: "Grid", icon: .layoutGrid),
                    ], isRequired: true)
                }
                .stanceCard()
            }
            StanceSection("Chips") {
                StanceButtonGroup {
                    ForEach(chips, id: \.self) { name in
                        StanceChip(name, onRemove: { chips.removeAll { $0 == name } })
                    }
                    StanceChip("Reset", icon: .refresh, action: { chips = ["Priya Nair", "Sales team", "Legal"] })
                }
                .stanceCard()
            }
        }
    }
}

/// The accordion and notification rows, for the data display catalogue.
struct DisplayParityDemo: View {
    @State private var open: Set<String> = []
    @State private var unread: Set<String> = ["deploy", "relay"]
    @State private var notices = ["deploy", "relay", "legal"]

    private let titles = ["deploy": "Deployment finished", "relay": "Relay reconnected", "legal": "Legal approved the disclaimer"]

    var body: some View {
        Group {
            StanceSection("Accordion", caption: "Several sections can be open at once.") {
                StanceAccordion([
                    StanceAccordionSection(id: "relay", title: "How do deployments reach Outlook?"),
                    StanceAccordionSection(id: "sync", title: "How often do signatures sync?"),
                ], expanded: $open) { section in
                    Text(AccordionPreview.answers[section.id] ?? "").stanceText(.bodySmall)
                }
            }
            StanceSection("Notifications", caption: "Swipe a row, or use the VoiceOver actions.") {
                List {
                    ForEach(notices, id: \.self) { id in
                        StanceNotificationRow(titles[id] ?? id, time: "Today", isUnread: unread.contains(id), onToggleRead: {
                            if unread.contains(id) { unread.remove(id) } else { unread.insert(id) }
                        }, onDelete: {
                            notices.removeAll { $0 == id }
                        })
                        .stanceListRow()
                    }
                }
                .stanceListStyle()
                .scrollDisabled(true)
                .frame(height: CGFloat(max(notices.count, 1)) * 72)
                .clipShape(RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous))
            }
        }
    }
}

/// Underline and segmented tabs, for the navigation catalogue.
struct TabsParityDemo: View {
    @State private var tab = "details"

    var body: some View {
        StanceSection("Tabs", caption: "Switch views inside one screen.") {
            StanceTabs([
                StanceTab(id: "details", title: "Details"),
                StanceTab(id: "activity", title: "Activity", icon: .activity, badge: 3),
                StanceTab(id: "users", title: "Users", icon: .users),
                StanceTab(id: "settings", title: "Settings", icon: .settings),
            ], selection: $tab, label: "Template") { tab in
                Text("Showing \(tab)").stanceText(.bodySmall)
            }
            .stanceCard()
        }
    }
}

/// Filter chips, for the advanced catalogue.
struct FilterChipParityDemo: View {
    @State private var live = true
    @State private var drafts = false

    var body: some View {
        StanceSection("Filter chips") {
            HStack(spacing: StanceSpacing.sm) {
                StanceFilterChip("Live", count: 12, isOn: $live)
                StanceFilterChip("Draft", count: 3, isOn: $drafts)
                Spacer(minLength: 0)
            }
        }
    }
}
