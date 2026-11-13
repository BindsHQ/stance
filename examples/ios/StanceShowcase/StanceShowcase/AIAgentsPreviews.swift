import StanceUI
import SwiftUI

/// Sample content for the agent demos. Everything is local: the showcase makes no network requests.
enum AIAgentsSample {
    static let now = Date(timeIntervalSince1970: 1_794_390_060)

    static let plan = [
        StancePlanItem(id: "read", title: "Read the FY27 workbook", description: "Budget FY27.xlsx, 214 rows"),
        StancePlanItem(id: "compare", title: "Compare with the Q3 review"),
        StancePlanItem(id: "table", title: "Build a table of the ten biggest movements"),
        StancePlanItem(id: "mail", title: "Email the summary to finance", description: "Needs your approval"),
    ]

    static let planInProgress = [
        StancePlanItem(id: "read", title: "Read the FY27 workbook", status: .complete),
        StancePlanItem(id: "compare", title: "Compare with the Q3 review", status: .running),
        StancePlanItem(id: "table", title: "Build a table of the ten biggest movements"),
    ]

    static let steps = [
        StanceAgentStep(id: "read", title: "Read the FY27 workbook", status: .complete, duration: 3),
        StanceAgentStep(id: "compare", title: "Compare with the Q3 review", description: "214 rows, line by line", status: .running, isExpandable: true),
        StanceAgentStep(id: "approve", title: "Ask before sending email", status: .pending),
        StanceAgentStep(id: "mail", title: "Email the summary to finance", status: .pending),
    ]

    static let toolInput = "{\n  \"file\": \"Budget FY27.xlsx\",\n  \"sheet\": \"Summary\"\n}"
    static let toolOutput = "{\n  \"rows\": 214,\n  \"changed\": 31\n}"

    static let permissions = [
        StancePermission(id: "files", title: "Read files you attach", description: "Only in this conversation", isGranted: true, isRequired: true),
        StancePermission(id: "calendar", title: "Read your calendar", description: "Titles and times, not notes", isGranted: true),
        StancePermission(id: "mail", title: "Send email as you", description: "Each message still asks first", isGranted: false, risk: .high),
    ]

    static let tasks = [
        StanceAgentTask(id: "export", title: "Export the summary as PDF", status: .running, progress: 0.4, startedAt: now),
        StanceAgentTask(id: "mail", title: "Email finance", status: .pending),
        StanceAgentTask(id: "sync", title: "Sync the forecast sheet", status: .error, detail: "The sheet is locked"),
        StanceAgentTask(id: "read", title: "Read the workbook", status: .complete),
    ]

    static let agents = [
        StanceSubagent(id: "lead", name: "Budget analyst", status: .running, summary: "Coordinating two agents", children: [
            StanceSubagent(id: "reader", name: "Workbook reader", status: .complete, summary: "214 rows read"),
            StanceSubagent(id: "writer", name: "Summary writer", status: .waiting, summary: "Needs approval to send"),
        ]),
    ]

    static let log = [
        StanceLogEntry(id: "1", time: now, level: .info, text: "Run started"),
        StanceLogEntry(id: "2", time: now.addingTimeInterval(1), level: .debug, text: "open Budget FY27.xlsx"),
        StanceLogEntry(id: "3", time: now.addingTimeInterval(3), level: .info, text: "Read 214 rows from Summary"),
        StanceLogEntry(id: "4", time: now.addingTimeInterval(4), level: .warn, text: "Row 87 has no cost centre"),
        StanceLogEntry(id: "5", time: now.addingTimeInterval(6), level: .error, text: "Forecast sheet is locked"),
        StanceLogEntry(id: "6", time: now.addingTimeInterval(7), level: .info, text: "Retrying in 5 seconds"),
    ]

    static let diff = [
        StanceDiffFile(id: "summary", path: "reports/fy27-summary.md", hunks: [
            StanceDiffHunk(id: "summary-1", header: "@@ -4,3 +4,4 @@", lines: [
                StanceDiffLine(.context, "## Travel", oldNumber: 4, newNumber: 4),
                StanceDiffLine(.remove, "Travel is flat on the year.", oldNumber: 5),
                StanceDiffLine(.add, "Travel is up 8% on the year.", newNumber: 5),
                StanceDiffLine(.add, "Two workshops in Vienna explain it.", newNumber: 6),
            ]),
            StanceDiffHunk(id: "summary-2", header: "@@ -12,2 +13,2 @@", lines: [
                StanceDiffLine(.remove, "Software: no change.", oldNumber: 12),
                StanceDiffLine(.add, "Software: down 3%.", newNumber: 13),
            ]),
        ]),
    ]
}

/// Preview compositions for the agent components, keyed by `components.json` slug.
@MainActor
enum AIAgentsPreviewCatalog {
    typealias Entry = PreviewCatalog.Entry

    static let entries: [Entry] = [
        Entry("stance-tool-call-card") {
            VStack(spacing: StanceSpacing.md) {
                StanceToolCallCard("Read the workbook", name: "files.read", icon: .fileText, status: .complete, input: AIAgentsSample.toolInput, output: AIAgentsSample.toolOutput, language: "json", duration: 3, defaultExpanded: true)
                StanceToolCallCard("Search the web", name: "web.search", icon: .globe, status: .running, input: nil)
            }
        },
        Entry("stance-step-timeline") {
            StanceStepTimeline(AIAgentsSample.steps, defaultExpanded: ["compare"]) { _ in
                Text("31 rows changed so far.").stanceText(.bodySmall)
            }
            .stanceCard()
        },
        Entry("stance-plan-checklist") { PlanPreview() },
        Entry("stance-approval-prompt") {
            StanceApprovalPrompt("Email the summary to finance", description: "Sends one message to 6 people outside this conversation.", risk: .high, countdown: 30, onAllow: {}, onAllowAlways: {}, onDeny: {}) {
                Text("To: finance@binds.si")
            }
        },
        Entry("stance-permission-sheet", .screen) { PermissionScreen() },
        Entry("stance-agent-status-pill") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                HStack(spacing: StanceSpacing.sm) {
                    StanceAgentStatusPill(.working, detail: "Step 2 of 4")
                    StanceAgentStatusPill(.waiting)
                }
                HStack(spacing: StanceSpacing.sm) {
                    StanceAgentStatusPill(.done)
                    StanceAgentStatusPill(.error)
                    StanceAgentStatusPill(.paused)
                }
                HStack(spacing: StanceSpacing.sm) {
                    StanceAgentStatusPill(.idle, size: .small)
                    StanceAgentStatusPill(.working, label: "Researching", size: .small)
                }
            }
            .stanceCard()
        },
        Entry("stance-task-queue") {
            StanceTaskQueue(tasks: AIAgentsSample.tasks, onPause: { _ in }, onResume: { _ in }, onCancel: { _ in }, onRetry: { _ in })
        },
        Entry("stance-subagent-tree") { SubagentPreview() },
        Entry("stance-run-log") {
            StanceRunLog(entries: AIAgentsSample.log, follows: false, maxHeight: 220)
        },
        Entry("stance-diff-review") { DiffPreview(files: [StanceDiffFile(id: "summary", path: "reports/fy27-summary.md", hunks: [AIAgentsSample.diff[0].hunks[0]])]) },
    ]
}

private struct PlanPreview: View {
    @State private var items = AIAgentsSample.plan

    var body: some View {
        StancePlanChecklist(items: $items, onApprove: {}, onReject: {})
    }
}

private struct SubagentPreview: View {
    @State private var expanded: Set<String> = ["lead"]
    @State private var selection: String? = "writer"

    var body: some View {
        StanceSubagentTree(nodes: AIAgentsSample.agents, expanded: $expanded, selection: $selection)
    }
}

private struct DiffPreview: View {
    let files: [StanceDiffFile]
    @State private var decisions: [String: StanceDiffDecision] = [:]

    var body: some View {
        StanceDiffReview(files: files, decisions: $decisions)
    }
}

private struct PermissionScreen: View {
    @State private var shown = false
    @State private var permissions = AIAgentsSample.permissions
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                    StanceAgentStatusPill(.waiting, detail: "Needs access")
                    Text("The budget analyst asks for access before it starts.").stanceText(.body)
                    StanceButton("Review access", variant: .outline, leadingIcon: .shield) { shown = true }
                        .accessibilityIdentifier("preview-trigger")
                }
                .padding(StanceSpacing.lg)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(theme.colors.bgCanvas.ignoresSafeArea())
            .navigationTitle("Budget analyst")
        }
        .stancePermissionSheet(isPresented: $shown, description: "The budget analyst can use these while it works on your request.", permissions: $permissions) { _ in }
    }
}

/// The agent components with their variants and states, as sections for the AI page.
struct AIAgentsDemo: View {
    @State private var plan = AIAgentsSample.plan
    @State private var permissions = AIAgentsSample.permissions
    @State private var showsPermissions = false
    @State private var tasks = AIAgentsSample.tasks
    @State private var expanded: Set<String> = ["lead"]
    @State private var selection: String?
    @State private var decisions: [String: StanceDiffDecision] = [:]
    @State private var approval: String?
    @Environment(StanceToastCenter.self) private var toasts

    var body: some View {
        StanceSection("Agents", caption: "Steps, tools and status are shown in words and can be opened.") {
            AgentsPillRow {
                StanceAgentStatusPill(.working, detail: "Step 2 of 4")
                StanceAgentStatusPill(.waiting) { showsPermissions = true }
                StanceAgentStatusPill(.done, size: .small)
            }
            StanceStepTimeline(AIAgentsSample.steps) { _ in
                Text("31 rows changed so far.").stanceText(.bodySmall)
            }
            .stanceCard()
            StanceToolCallCard("Read the workbook", name: "files.read", icon: .fileText, status: .complete, input: AIAgentsSample.toolInput, output: AIAgentsSample.toolOutput, language: "json", duration: 3)
            StanceToolCallCard("Sync the forecast sheet", name: "sheets.sync", status: .error, input: nil, error: "The sheet is locked by another editor.")
            StanceTaskQueue(
                tasks: tasks,
                onPause: { set($0, .waiting) },
                onResume: { set($0, .running) },
                onCancel: { task in tasks.removeAll { $0.id == task.id } },
                onRetry: { set($0, .running) }
            )
            StanceSubagentTree(nodes: AIAgentsSample.agents, expanded: $expanded, selection: $selection)
        }
        StanceSection("Approval", caption: "Nothing that changes data or leaves the product happens without a clear yes.") {
            StancePlanChecklist(items: $plan) {
                toasts.show("Plan approved", tone: .success)
            } onReject: {
                toasts.show("Plan rejected")
            }
            StanceApprovalPrompt("Email the summary to finance", description: "Sends one message to 6 people outside this conversation.", risk: .high) {
                approval = "Allowed"
            } onAllowAlways: {
                approval = "Always allowed"
            } onDeny: {
                approval = "Denied"
            } details: {
                StanceCodeBlock("To: finance@binds.si\nSubject: FY27 budget summary", title: "Message")
            }
            if let approval {
                Text(approval).stanceText(.bodySmall)
            }
            StanceButton("Review access", variant: .outline, leadingIcon: .shield) { showsPermissions = true }
        }
        .stancePermissionSheet(isPresented: $showsPermissions, description: "The budget analyst can use these while it works on your request.", permissions: $permissions) { _ in
            toasts.show("Access saved", tone: .success)
        }
        StanceSection("Review", caption: "Every change can be read before it lands. Logs and diffs stay left to right.") {
            StanceDiffReview(files: AIAgentsSample.diff, decisions: $decisions)
            StanceRunLog(entries: AIAgentsSample.log)
        }
    }

    private func set(_ task: StanceAgentTask, _ status: StanceStepStatus) {
        if let index = tasks.firstIndex(where: { $0.id == task.id }) { tasks[index].status = status }
    }
}

/// A row of pills that wraps onto more lines at large text sizes.
private struct AgentsPillRow<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: StanceSpacing.sm) { content }
            VStack(alignment: .leading, spacing: StanceSpacing.sm) { content }
        }
    }
}
