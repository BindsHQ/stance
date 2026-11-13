import StanceUI
import SwiftUI

/// Preview compositions for the data components added for web parity, keyed by
/// `components.json` slug. `PreviewCatalog.all` appends these to the other entries.
@MainActor
enum DataParityPreviewCatalog {
    typealias Entry = PreviewCatalog.Entry

    static let entries: [Entry] = [
        Entry("stance-data-table") { DataTablePreview() },
        Entry("stance-pagination") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                DataStateful(3) { StancePagination(page: $0, pageCount: 12) }
                DataStateful(1) { StancePagination(page: $0, pageCount: 4) }
            }
            .stanceCard()
        },
        Entry("stance-tree-view") { TreePreview() },
        Entry("stance-sortable-list") { SortablePreview() },
        Entry("stance-chart") {
            StanceChart("Deployments", description: "Signatures sent and updated each month", kind: .line, series: DataSample.deployments, allowsTable: false)
        },
        Entry("stance-rich-text") {
            StanceRichText(markdown: DataSample.markdown).stanceCard()
        },
        Entry("stance-code-block") {
            StanceCodeBlock(DataSample.code, language: "swift", title: "TemplateSettings.swift", showsLineNumbers: true)
        },
        Entry("stance-progress-circle") {
            HStack(alignment: .center, spacing: StanceSpacing.md) {
                StanceProgressCircle("Mailboxes updated", value: 0.72, size: .large)
                StanceProgressCircle("Upload", value: 0.35)
                StanceProgressCircle("Verified", value: 1, tone: .success)
                StanceProgressCircle("Preparing", value: nil, size: .small)
                Spacer(minLength: 0)
            }
            .stanceCard()
        },
    ]
}

/// Sample content shared by the previews and the demo.
@MainActor
enum DataSample {
    struct User: Identifiable, Hashable {
        let id: Int
        let name: String
        let role: String
        let mailboxes: Int
    }

    struct Step: Identifiable, Hashable {
        let id: Int
        let name: String
        let owner: String
    }

    static let users = [
        User(id: 1, name: "Priya Nair", role: "Admin", mailboxes: 12),
        User(id: 2, name: "Lukas Brenner", role: "Sales", mailboxes: 3),
        User(id: 3, name: "Hana Sato", role: "Finance", mailboxes: 5),
        User(id: 4, name: "Amara Okafor", role: "Legal", mailboxes: 2),
        User(id: 5, name: "Owen Price", role: "Operations", mailboxes: 8),
    ]

    static let columns: [StanceTableColumn<User>] = [
        StanceTableColumn("Name") { $0.name },
        StanceTableColumn("Role") { $0.role },
        StanceTableColumn("Mailboxes", alignment: .trailing, value: { String($0.mailboxes) }, sortValue: { $0.mailboxes }),
    ]

    static let steps = [
        Step(id: 1, name: "Legal review", owner: "Amara Okafor"),
        Step(id: 2, name: "Brand check", owner: "Hana Sato"),
        Step(id: 3, name: "Finance sign off", owner: "Owen Price"),
        Step(id: 4, name: "Deploy to mailboxes", owner: "Priya Nair"),
    ]

    static let tree: [StanceTreeNode<String>] = [
        StanceTreeNode(id: "templates", title: "Templates", children: [
            StanceTreeNode(id: "sales", title: "Sales", children: [
                StanceTreeNode(id: "sales-standard", title: "Standard signature", subtitle: "48 users", icon: .signature),
                StanceTreeNode(id: "sales-launch", title: "Launch banner", subtitle: "Draft", icon: .image),
            ]),
            StanceTreeNode(id: "legal", title: "Legal", children: [
                StanceTreeNode(id: "legal-disclaimer", title: "Disclaimer", subtitle: "12 users", icon: .shield),
            ]),
        ]),
        StanceTreeNode(id: "archive", title: "Archive", children: []),
    ]

    static let deployments = [
        StanceChartSeries("Sent", points: [.init("Jun", 420), .init("Jul", 610), .init("Aug", 580), .init("Sep", 890), .init("Oct", 1040), .init("Nov", 1284)]),
        StanceChartSeries("Updated", points: [.init("Jun", 160), .init("Jul", 240), .init("Aug", 310), .init("Sep", 280), .init("Oct", 450), .init("Nov", 520)]),
    ]

    static let markdown = """
    ## Rollout plan
    The new signature reaches **48 mailboxes** after the next sync. Read the [deployment guide](https://binds.si) first.

    1. Choose the *Sales* template
    2. Check the `{{phone}}` field
    3. Deploy

    > Legal approved the disclaimer on 11 November.
    """

    static let code = """
    struct TemplateSettings: View {
        @State private var name = "Sales team signature"

        var body: some View {
            StanceButton("Deploy", leadingIcon: .send) {}
        }
    }
    """
}

/// Previews need real state for controls that change it.
private struct DataStateful<Value, Content: View>: View {
    @State private var value: Value
    private let content: (Binding<Value>) -> Content

    init(_ value: Value, @ViewBuilder content: @escaping (Binding<Value>) -> Content) {
        _value = State(initialValue: value)
        self.content = content
    }

    var body: some View { content($value) }
}

private struct DataTablePreview: View {
    @State private var sort: StanceTableSort? = StanceTableSort(column: "Name")
    @State private var selection: Set<Int> = [1]

    var body: some View {
        StanceDataTable("Organisation users", rows: DataSample.users, columns: DataSample.columns, sort: $sort, selection: $selection, layout: .list)
            .scrollDisabled(true)
            .frame(height: 500)
            .clipShape(RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous))
    }
}

private struct TreePreview: View {
    @State private var expanded: Set<String> = ["templates", "sales"]
    @State private var selection: String? = "sales-standard"

    var body: some View {
        StanceTreeView("Templates", nodes: DataSample.tree, expanded: $expanded, selection: $selection)
            .scrollDisabled(true)
            .frame(height: 330)
            .clipShape(RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous))
    }
}

private struct SortablePreview: View {
    @State private var steps = DataSample.steps

    var body: some View {
        StanceSortableList("Approval steps", items: $steps, itemLabel: \.name) { step in
            StanceListRow(step.name, subtitle: step.owner)
        }
        .environment(\.editMode, .constant(.active))
        .scrollDisabled(true)
        .frame(height: 380)
    }
}

/// The data components in use, for the Data display category.
struct DataParityDemo: View {
    @State private var sort: StanceTableSort? = StanceTableSort(column: "Name")
    @State private var selection: Set<Int> = []
    @State private var page = 1
    @State private var expanded: Set<String> = ["templates"]
    @State private var treeSelection: String?
    @State private var steps = DataSample.steps
    @State private var kind = StanceChartKind.bar
    @State private var progress = 0.4

    var body: some View {
        StanceSection("Data table", caption: "A table on iPad, cards on iPhone. Sort and select.") {
            StanceDataTable("Organisation users", rows: DataSample.users, columns: DataSample.columns, sort: $sort, selection: $selection)
                .frame(height: 420)
                .clipShape(RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous))
            StancePagination(page: $page, pageCount: 8)
        }
        StanceSection("Grid table", caption: "The table iOS 17.0 to 17.3 get in regular width, with a pinned header.") {
            StanceDataTable("Organisation users", rows: DataSample.users, columns: DataSample.columns, sort: $sort, selection: $selection, layout: .grid)
                .frame(height: 320)
        }
        StanceSection("Tree view", caption: "Expand folders and pick a template.") {
            StanceTreeView("Templates", nodes: DataSample.tree, expanded: $expanded, selection: $treeSelection)
                .frame(height: 320)
                .clipShape(RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous))
        }
        StanceSection("Sortable list", caption: "Tap Edit to drag, or use the VoiceOver actions.") {
            StanceSortableList("Approval steps", items: $steps, itemLabel: \.name) { step in
                StanceListRow(step.name, subtitle: step.owner)
            }
            .frame(height: 360)
        }
        StanceSection("Chart", caption: "Swift Charts in ink tones, with a table view.") {
            Picker("Chart type", selection: $kind) {
                Text("Line").tag(StanceChartKind.line)
                Text("Bar").tag(StanceChartKind.bar)
                Text("Area").tag(StanceChartKind.area)
            }
            .pickerStyle(.segmented)
            StanceChart("Deployments", description: "Signatures sent and updated each month", kind: kind, series: DataSample.deployments)
        }
        StanceSection("Rich text and code") {
            StanceRichText(markdown: DataSample.markdown).stanceCard()
            StanceCodeBlock(DataSample.code, language: "swift", title: "TemplateSettings.swift", showsLineNumbers: true)
        }
        StanceSection("Progress circle") {
            HStack(spacing: StanceSpacing.xl) {
                StanceProgressCircle("Mailboxes updated", value: progress, size: .large)
                StanceButton("Advance", variant: .outline) { progress = progress >= 1 ? 0 : min(progress + 0.2, 1) }
            }
        }
    }
}
