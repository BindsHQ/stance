import Foundation
import SwiftUI
import Testing
@testable import StanceUI

private let english = Locale(identifier: "en")
private let arabic = Locale(identifier: "ar")
private let spanish = Locale(identifier: "es")

private enum AgentFixture {
    static let now = Date(timeIntervalSince1970: 1_794_390_060)

    static let plan = [
        StancePlanItem(id: "read", title: "Read the workbook", status: .complete),
        StancePlanItem(id: "compare", title: "Compare with last year", description: "Line by line", status: .running),
        StancePlanItem(id: "draft", title: "Draft the summary"),
        StancePlanItem(id: "mail", title: "Email finance", status: .skipped),
    ]

    static let files = [
        StanceDiffFile(id: "a", path: "Sources/Budget.swift", hunks: [
            StanceDiffHunk(id: "a1", header: "@@ -1,3 +1,4 @@", lines: [
                StanceDiffLine(.context, "let travel = 100", oldNumber: 1, newNumber: 1),
                StanceDiffLine(.remove, "let total = 3", oldNumber: 2),
                StanceDiffLine(.add, "let total = 4", newNumber: 2),
                StanceDiffLine(.add, "let tax = 2", newNumber: 3),
            ]),
            StanceDiffHunk(id: "a2", lines: [StanceDiffLine(.remove, "print(total)", oldNumber: 9)]),
        ]),
        StanceDiffFile(id: "b", path: "README.md", status: .added, hunks: [
            StanceDiffHunk(id: "b1", lines: [StanceDiffLine(.add, "# Budget", newNumber: 1)]),
        ]),
    ]

    static let log = [
        StanceLogEntry(id: "1", time: now, level: .info, text: "Run started"),
        StanceLogEntry(id: "2", time: now.addingTimeInterval(1), level: .debug, text: "GET /budget 200"),
        StanceLogEntry(id: "3", time: now.addingTimeInterval(2), level: .warn, text: "Slow response"),
        StanceLogEntry(id: "4", time: now.addingTimeInterval(3), level: .error, text: "Relay timed out"),
    ]

    static let tasks = [
        StanceAgentTask(id: "1", title: "Export report", status: .running, progress: 0.4, startedAt: now),
        StanceAgentTask(id: "2", title: "Email finance", status: .pending),
        StanceAgentTask(id: "3", title: "Sync calendar", status: .waiting, detail: "Paused by you"),
        StanceAgentTask(id: "4", title: "Archive files", status: .complete),
        StanceAgentTask(id: "5", title: "Post to chat", status: .error, detail: "Channel not found"),
    ]

    static let agents = [
        StanceSubagent(id: "lead", name: "Lead", status: .running, summary: "Coordinating", children: [
            StanceSubagent(id: "research", name: "Researcher", status: .complete, summary: "Found 3 sources"),
            StanceSubagent(id: "writer", name: "Writer", status: .waiting, children: [StanceSubagent(id: "editor", name: "Editor")]),
        ]),
    ]

    static let permissions = [
        StancePermission(id: "read", title: "Read your calendar", isGranted: false, isRequired: true),
        StancePermission(id: "write", title: "Create events", description: "Only in the Work calendar", isGranted: true, risk: .medium),
        StancePermission(id: "mail", title: "Send email", risk: .high),
    ]
}

@Suite("Step status")
struct StepStatusTests {
    @Test("The contract has six step statuses and three risk levels")
    func cases() {
        #expect(StanceStepStatus.allCases.map(\.rawValue) == ["pending", "running", "complete", "error", "skipped", "waiting"])
        #expect(StanceRiskLevel.allCases.map(\.rawValue) == ["low", "medium", "high"])
        #expect(StanceRiskLevel.low < .medium && StanceRiskLevel.medium < .high)
    }

    @Test("Generation statuses map onto step statuses")
    func mapping() {
        #expect(StanceStepStatus(.idle) == .pending)
        #expect(StanceStepStatus(.submitted) == .running)
        #expect(StanceStepStatus(.streaming) == .running)
        #expect(StanceStepStatus(.complete) == .complete)
        #expect(StanceStepStatus(.stopped) == .skipped)
        #expect(StanceStepStatus(.error) == .error)
        #expect(StanceStepStatus.allCases.filter(\.isFinished) == [.complete, .error, .skipped])
        #expect(StanceStepStatus.allCases.filter(\.isActive) == [.running])
    }

    @Test("Status is part of the name, and a change is announced once")
    func names() {
        #expect(StanceStepStatus.complete.accessibilityName(for: "Search the web", locale: english) == "Search the web, Complete")
        #expect(StanceStepStatus.announcement(for: "Search", from: .running, to: .running, locale: english) == nil)
        #expect(StanceStepStatus.announcement(for: "Search", from: .running, to: .pending, locale: english) == nil)
        #expect(StanceStepStatus.announcement(for: "Search", from: .running, to: .error, locale: english) == "Search, Failed")
        #expect(StanceStepStatus.allCases.filter(\.isUrgent) == [.error, .waiting])
        #expect(StanceStepStatus.waiting.label(locale: spanish) == "Esperando tu respuesta")
        #expect(StanceToolCallCard<EmptyView, EmptyView>.accessibilityName(title: "Search the web", status: .complete, duration: 2, locale: english) == "Search the web, Complete, 2 seconds")
        #expect(StanceToolCallCard<EmptyView, EmptyView>.accessibilityName(title: "Search", status: .running, locale: english) == "Search, Running")
    }

    @Test("The timeline marks the running step as current, then the waiting one")
    func timeline() {
        typealias T = StanceStepTimeline<EmptyView>
        let steps = [
            StanceAgentStep(id: "1", title: "Read", status: .complete, duration: 3),
            StanceAgentStep(id: "2", title: "Ask", status: .waiting),
            StanceAgentStep(id: "3", title: "Write", status: .running),
        ]
        #expect(T.currentIndex(steps) == 2)
        #expect(T.currentIndex(Array(steps.prefix(2))) == 1)
        #expect(T.currentIndex(Array(steps.prefix(1))) == nil)
        #expect(T.accessibilityValue(for: steps[2], isCurrent: true, locale: english) == "Running, Current")
        #expect(T.accessibilityValue(for: steps[0], isCurrent: false, locale: english) == "Complete, 3 seconds")
    }

    @Test("Agent status words, and only waiting interrupts")
    func agentStatus() {
        #expect(StanceAgentStatus.allCases.map(\.rawValue) == ["idle", "working", "waiting", "done", "error", "paused"])
        #expect(StanceAgentStatus.allCases.filter(\.isUrgent) == [.waiting])
        #expect(StanceAgentStatus.waiting.label(locale: english) == "Waiting for you")
        #expect(StanceAgentStatus.paused.label(locale: spanish) == "En pausa")
        #expect(StanceAgentStatusPill.accessibilityText(status: .working, detail: "Step 2 of 5", locale: english) == "Working, Step 2 of 5")
        #expect(StanceAgentStatusPill.accessibilityText(status: .working, label: "Researching", locale: english) == "Researching")
    }
}

@Suite("Plan checklist")
struct PlanChecklistTests {
    @Test("Steps move up and down by zero based index and stop at the ends")
    func reorder() {
        var items = AgentFixture.plan
        #expect(StancePlanChecklist.move(&items, from: 0, by: -1) == nil)
        #expect(StancePlanChecklist.move(&items, from: 0, by: 1) == 1)
        #expect(items.map(\.id) == ["compare", "read", "draft", "mail"])
        #expect(StancePlanChecklist.move(&items, from: 3, by: 1) == nil)
        #expect(StancePlanChecklist.move(&items, from: 3, by: -10) == 0)
        #expect(items.map(\.id) == ["mail", "compare", "read", "draft"])
        #expect(StancePlanChecklist.move(&items, from: 9, by: 1) == nil)
        StancePlanChecklist.move(&items, fromOffsets: IndexSet(integer: 0), toOffset: 4)
        #expect(items.map(\.id) == ["compare", "read", "draft", "mail"])
    }

    @Test("Steps can be removed by identifier")
    func removal() {
        var items = AgentFixture.plan
        #expect(StancePlanChecklist.remove(&items, id: "draft")?.title == "Draft the summary")
        #expect(StancePlanChecklist.remove(&items, id: "draft") == nil)
        #expect(items.count == 3)
    }

    @Test("Progress is derived from the statuses: complete and skipped steps count as done, as on the web")
    func progress() {
        let counts = StancePlanChecklist.counts(AgentFixture.plan)
        #expect(counts.completed == 2 && counts.total == 4)
        #expect(abs(StancePlanChecklist.progress(AgentFixture.plan) - 0.5) < 0.0001)
        #expect(StancePlanChecklist.progress([]) == 0)
        #expect(StancePlanChecklist.summary(AgentFixture.plan, locale: english) == "2 of 4 steps complete")
        #expect(StancePlanChecklist.summary(AgentFixture.plan, locale: spanish) == "2 de 4 pasos completados")
    }

    @Test("A paused task offers resume and cancel; status has no paused value")
    func pausedTasks() {
        let running = StanceAgentTask(id: "a", title: "Sync", status: .running)
        var paused = running
        paused.isPaused = true
        #expect(StanceTaskQueue.actions(for: running) == [.pause, .cancel])
        #expect(StanceTaskQueue.actions(for: paused) == [.resume, .cancel])
        #expect(StanceTaskQueue.actions(for: StanceAgentTask(id: "b", title: "Done", status: .complete, isPaused: true)).isEmpty)
        #expect(StanceTaskQueue.actions(for: StanceAgentTask(id: "c", title: "Failed", status: .error, isPaused: true)) == [.retry])
    }
}

@Suite("Approval and permissions")
struct ApprovalTests {
    @Test("Deny reports why: the button, Escape or the countdown")
    func denyReasons() {
        #expect(StanceApprovalDenyReason.allCases.map(\.rawValue) == ["deny", "escape", "timeout"])
        #expect(StanceLocalization.string("stance.ai.approval.keepWaiting", locale: english) == "Keep waiting")
        #expect(StanceLocalization.string("stance.ai.approval.keepWaiting", locale: spanish) == "Seguir esperando")
    }

    @Test("A countdown can only deny, and denies exactly once")
    func countdown() {
        #expect(StanceApprovalCountdown.Outcome.allCases == [.deny])
        var countdown = StanceApprovalCountdown(seconds: 3)
        #expect(countdown.tick() == nil)
        #expect(countdown.tick() == nil)
        #expect(!countdown.isExpired)
        #expect(countdown.tick() == .deny)
        #expect(countdown.isExpired && countdown.remaining == 0)
        #expect(countdown.tick() == nil)
        var instant = StanceApprovalCountdown(seconds: -5)
        #expect(instant.remaining == 0)
        #expect(instant.tick(by: 10) == .deny)
        #expect(instant.tick() == nil)
        var slow = StanceApprovalCountdown(seconds: 2)
        #expect(slow.tick(by: -1) == nil)
        #expect(slow.remaining == 2)
    }

    @Test("The Return key allows only on request and never for high risk")
    func defaultAction() {
        typealias P = StanceApprovalPrompt<EmptyView>
        for risk in StanceRiskLevel.allCases {
            #expect(!P.allowIsDefaultAction(risk: risk, returnKeyAllows: false))
        }
        #expect(P.allowIsDefaultAction(risk: .low, returnKeyAllows: true))
        #expect(P.allowIsDefaultAction(risk: .medium, returnKeyAllows: true))
        #expect(!P.allowIsDefaultAction(risk: .high, returnKeyAllows: true))
        #expect(P.announcement(title: "Send the email", risk: .high, locale: english) == "Approval needed: Send the email. High risk")
    }

    @Test("Required permissions stay granted")
    func permissions() {
        var permissions = AgentFixture.permissions
        #expect(StancePermissionSheet.normalized(permissions).map(\.isGranted) == [true, true, false])
        #expect(StancePermissionSheet.setGranted(false, id: "read", in: &permissions))
        #expect(permissions[0].isGranted)
        #expect(!StancePermissionSheet.setGranted(false, id: "read", in: &permissions))
        #expect(StancePermissionSheet.setGranted(true, id: "mail", in: &permissions))
        #expect(!StancePermissionSheet.setGranted(true, id: "mail", in: &permissions))
        #expect(!StancePermissionSheet.setGranted(true, id: "missing", in: &permissions))
        #expect(StancePermissionSheet.setGranted(false, id: "write", in: &permissions))
        #expect(permissions.map(\.isGranted) == [true, false, true])
        #expect(StancePermissionSheet.summary(permissions, locale: english) == "2 of 3 allowed")
    }
}

@Suite("Tasks and subagents")
struct TaskQueueTests {
    @Test("Tasks are counted as running, queued and finished")
    func counts() {
        #expect(StanceTaskQueue.counts(AgentFixture.tasks) == StanceTaskQueueCounts(running: 1, queued: 2, finished: 2))
        #expect(StanceTaskQueue.summary(AgentFixture.tasks, locale: english) == "1 running, 2 queued, 2 finished")
        #expect(StanceTaskQueue.counts([]) == StanceTaskQueueCounts(running: 0, queued: 0, finished: 0))
    }

    @Test("Each status offers only the actions that make sense")
    func actions() {
        #expect(StanceTaskQueue.actions(for: .running) == [.pause, .cancel])
        #expect(StanceTaskQueue.actions(for: .waiting) == [.resume, .cancel])
        #expect(StanceTaskQueue.actions(for: .pending) == [.cancel])
        #expect(StanceTaskQueue.actions(for: .error) == [.retry])
        #expect(StanceTaskQueue.actions(for: .complete).isEmpty)
        #expect(StanceTaskQueue.actions(for: .skipped).isEmpty)
    }

    @Test("Agents map onto tree nodes with the status in each row's name")
    func tree() throws {
        let nodes = StanceSubagentTree.treeNodes(AgentFixture.agents, locale: english)
        #expect(nodes.count == 1)
        #expect(nodes[0].title == "Lead")
        #expect(nodes[0].subtitle == "Running: Coordinating")
        #expect(nodes[0].isBranch)
        let children = try #require(nodes[0].children)
        #expect(children.map(\.id) == ["research", "writer"])
        #expect(!children[0].isBranch)
        #expect(children[0].subtitle == "Complete: Found 3 sources")
        #expect(children[1].subtitle == "Waiting for you")
        #expect(children[1].children?.first?.subtitle == "Pending")
        #expect(StanceSubagentTree.allBranches(AgentFixture.agents) == ["lead", "writer"])
        #expect(StanceTreeState.visibleRows(nodes, expanded: ["lead"]).count == 3)
    }
}

@Suite("Run log")
struct RunLogTests {
    @Test("Levels filter the lines and toggle on and off")
    func filter() {
        #expect(StanceLogLevel.allCases.map(\.rawValue) == ["debug", "info", "warn", "error"])
        #expect(StanceRunLog.filter(AgentFixture.log, levels: [.warn, .error]).map(\.id) == ["3", "4"])
        #expect(StanceRunLog.filter(AgentFixture.log, levels: []).isEmpty)
        #expect(StanceRunLog.filter(AgentFixture.log, levels: Set(StanceLogLevel.allCases)) == AgentFixture.log)
        #expect(StanceRunLog.toggled([.info], level: .info).isEmpty)
        #expect(StanceRunLog.toggled([.info], level: .error) == [.info, .error])
    }

    @Test("Follows the tail while pinned and releases when the reader scrolls up")
    func follow() {
        var scroll = StanceThreadScrollState()
        do { let follow = scroll.update(distanceFromBottom: 0, contentHeight: 300, viewportHeight: 240, threshold: 44); #expect(!follow) }
        #expect(scroll.isPinned)
        // A new line arrives under a pinned reader: follow it.
        do { let follow = scroll.update(distanceFromBottom: 60, contentHeight: 360, viewportHeight: 240, threshold: 44); #expect(follow) }
        // The reader scrolls up: release, and stay released while more lines arrive.
        do { let follow = scroll.update(distanceFromBottom: 200, contentHeight: 360, viewportHeight: 240, threshold: 44); #expect(!follow) }
        #expect(!scroll.isPinned)
        do { let follow = scroll.update(distanceFromBottom: 260, contentHeight: 420, viewportHeight: 240, threshold: 44); #expect(!follow) }
        // Back at the bottom: pinned again.
        do { let follow = scroll.update(distanceFromBottom: 10, contentHeight: 420, viewportHeight: 240, threshold: 44); #expect(!follow) }
        #expect(scroll.isPinned)
    }

    @Test("Only new errors are announced")
    func errors() {
        #expect(StanceRunLog.newErrors(in: AgentFixture.log, after: 0).map(\.id) == ["4"])
        #expect(StanceRunLog.newErrors(in: AgentFixture.log, after: 3).map(\.id) == ["4"])
        #expect(StanceRunLog.newErrors(in: AgentFixture.log, after: 4).isEmpty)
        #expect(StanceRunLog.newErrors(in: Array(AgentFixture.log.prefix(3)), after: 1).isEmpty)
        #expect(StanceRunLog.newErrors(in: AgentFixture.log, after: 9).isEmpty)
        #expect(StanceRunLog.accessibilityLabel(for: AgentFixture.log[3], locale: english) == "Error: Relay timed out")
    }

    @Test("The copied text has one line per entry with time and level")
    func plainText() {
        let utc = TimeZone(identifier: "UTC")!
        let text = StanceRunLog.plainText(AgentFixture.log, locale: english, timeZone: utc)
        let lines = text.components(separatedBy: "\n")
        #expect(lines.count == 4)
        #expect(lines[0] == "09:41:00 INFO Run started")
        #expect(lines[3] == "09:41:03 ERROR Relay timed out")
        #expect(StanceRunLog.plainText([StanceLogEntry(id: "x", text: "No time")]) == "INFO No time")
    }
}

@Suite("Diff review")
struct DiffReviewTests {
    @Test("Accept all and reject all decide every hunk")
    func all() {
        #expect(StanceDiffReview.hunkIDs(AgentFixture.files) == ["a1", "a2", "b1"])
        #expect(StanceDiffReview.acceptAll(AgentFixture.files) == ["a1": .accepted, "a2": .accepted, "b1": .accepted])
        #expect(StanceDiffReview.rejectAll(AgentFixture.files) == ["a1": .rejected, "a2": .rejected, "b1": .rejected])
        #expect(StanceDiffReview.acceptAll([]).isEmpty)
    }

    @Test("A hunk is accepted, switched, and cleared by pressing the same decision again")
    func deciding() {
        var decisions: [String: StanceDiffDecision] = [:]
        decisions = StanceDiffReview.deciding(decisions, hunk: "a1", as: .accepted)
        #expect(decisions == ["a1": .accepted])
        decisions = StanceDiffReview.deciding(decisions, hunk: "a1", as: .rejected)
        #expect(decisions == ["a1": .rejected])
        decisions = StanceDiffReview.deciding(decisions, hunk: "a1", as: .rejected)
        #expect(decisions.isEmpty)
    }

    @Test("The summary counts accepted, rejected and undecided hunks")
    func summary() {
        let decisions: [String: StanceDiffDecision] = ["a1": .accepted, "b1": .rejected, "unknown": .accepted]
        #expect(StanceDiffReview.summary(AgentFixture.files, decisions: decisions) == StanceDiffSummary(accepted: 1, rejected: 1, pending: 1))
        #expect(StanceDiffReview.summaryText(AgentFixture.files, decisions: decisions, locale: english) == "1 accepted, 1 rejected, 1 to review")
        let stats = StanceDiffReview.stats(AgentFixture.files[0])
        #expect(stats.added == 2 && stats.removed == 2)
    }

    @Test("Lines carry a prefix and a word, never colour alone")
    func lines() {
        #expect(StanceDiffLineKind.add.prefix == "+")
        #expect(StanceDiffLineKind.remove.prefix == "-")
        #expect(StanceDiffLineKind.context.prefix == " ")
        let hunk = AgentFixture.files[0].hunks[0]
        #expect(StanceDiffReview.accessibilityLabel(for: hunk.lines[2], locale: english) == "Added: let total = 4")
        #expect(StanceDiffReview.accessibilityLabel(for: hunk.lines[1], locale: english) == "Removed: let total = 3")
        #expect(StanceDiffReview.accessibilityLabel(for: hunk.lines[1], locale: spanish) == "Eliminado: let total = 3")
        #expect(StanceDiffFileStatus.renamed.label(locale: english) == "Renamed")
    }

    @Test("Split rows pair removed lines with the added lines that replace them")
    func split() {
        let rows = StanceDiffReview.splitRows(AgentFixture.files[0].hunks[0].lines)
        #expect(rows.count == 3)
        #expect(rows[0].old == rows[0].new)
        #expect(rows[1].old?.text == "let total = 3" && rows[1].new?.text == "let total = 4")
        #expect(rows[2].old == nil && rows[2].new?.text == "let tax = 2")
        #expect(StanceDiffReview.splitRows([StanceDiffLine(.add, "a"), StanceDiffLine(.remove, "b")]).count == 2)
    }

    @Test("Unified in compact width and split in regular width, unless set")
    func layout() {
        #expect(!StanceDiffReview.isSplit(.automatic, isRegularWidth: false))
        #expect(StanceDiffReview.isSplit(.automatic, isRegularWidth: true))
        #expect(!StanceDiffReview.isSplit(.unified, isRegularWidth: true))
        #expect(StanceDiffReview.isSplit(.split, isRegularWidth: false))
    }
}

/// Renders the agent components off screen in every theme, at accessibility text sizes and right to left.
@Suite("Agents rendering")
@MainActor
struct AgentsRenderingTests {
    struct Gallery: View {
        @State private var plan = AgentFixture.plan
        @State private var permissions = AgentFixture.permissions
        @State private var decisions: [String: StanceDiffDecision] = ["a1": .accepted, "a2": .rejected]
        @State private var expanded: Set<String> = ["lead", "writer"]
        @State private var selection: String? = "research"
        var layout = StanceDiffLayout.unified

        var body: some View {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceToolCallCard("Search the web", name: "web.search", status: .complete, input: "{ \"query\": \"FY27 budget\" }", output: "3 results", language: "json", duration: 2, defaultExpanded: true)
                StanceToolCallCard("Read the workbook", icon: .fileText, status: .error, error: "The file is locked.", defaultExpanded: true) {
                    Text("Budget FY27.xlsx")
                } actions: {
                    StanceButton("Run again", variant: .outline, size: .small) {}
                }
                StanceStepTimeline([
                    StanceAgentStep(id: "1", title: "Read the workbook", status: .complete, duration: 3),
                    StanceAgentStep(id: "2", title: "Compare with last year", description: "Line by line", status: .running, isExpandable: true),
                    StanceAgentStep(id: "3", title: "Ask for approval", status: .waiting),
                    StanceAgentStep(id: "4", title: "Email finance", status: .pending),
                ], defaultExpanded: ["2"]) { _ in Text("Comparing 214 rows") }
                StanceStepTimeline([StanceAgentStep(id: "1", title: "Skipped", status: .skipped), StanceAgentStep(id: "2", title: "Failed", status: .error)], isCompact: true)
                StancePlanChecklist(items: $plan, onApprove: {}, onReject: {})
                StancePlanChecklist("Read only plan", items: $plan, isEditable: false)
                StanceApprovalPrompt("Send the summary to 48 people", description: "The email leaves your organisation.", risk: .high, countdown: 30, onAllow: {}, onAllowAlways: {}, onDeny: {}) {
                    Text("To: finance@binds.si")
                }
                StanceApprovalPrompt("Read the calendar", risk: .low, isBusy: true, onAllow: {}, onDeny: {})
                StancePermissionSheet(description: "Calendar connector", permissions: $permissions, onSave: { _ in }).frame(height: 520)
                StanceFlowLayout {
                    ForEach(StanceAgentStatus.allCases, id: \.self) { StanceAgentStatusPill($0) }
                    StanceAgentStatusPill(.working, label: "Researching", detail: "Step 2 of 5", size: .small) {}
                }
                StanceTaskQueue(tasks: AgentFixture.tasks, onSelect: { _ in }, onPause: { _ in }, onResume: { _ in }, onCancel: { _ in }, onRetry: { _ in })
                StanceTaskQueue(tasks: [])
                StanceSubagentTree(nodes: AgentFixture.agents, expanded: $expanded, selection: $selection)
                StanceRunLog(entries: AgentFixture.log)
                StanceRunLog("Errors", entries: [], wraps: false)
                StanceDiffReview(files: AgentFixture.files, decisions: $decisions, layout: layout)
            }
            .padding()
            .frame(width: 390)
            .environment(\.timeZone, TimeZone(identifier: "UTC")!)
        }
    }

    private func image<V: View>(_ view: V) throws -> CGImage {
        let renderer = ImageRenderer(content: view)
        renderer.scale = 1
        return try #require(renderer.cgImage)
    }

    @Test("Every agent component renders in every theme", arguments: StanceTheme.Mode.allCases, [DynamicTypeSize.large, .accessibility5])
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

    @Test("Layout reflows at the largest text size, right to left and in the split layout")
    func reflows() throws {
        let standard = try image(Gallery())
        let large = try image(Gallery().environment(\.dynamicTypeSize, .accessibility5))
        #expect(large.height > standard.height)
        let arabic = try image(
            Gallery()
                .environment(\.locale, Locale(identifier: "ar"))
                .environment(\.layoutDirection, .rightToLeft)
        )
        #expect(arabic.width == 390 && arabic.height > 2400)
        let split = try image(Gallery(layout: .split))
        #expect(split.width == 390 && split.height > 2400)
    }

    @Test("Agent controls keep the 44pt minimum target")
    func targets() throws {
        func size<V: View>(_ view: V) throws -> CGSize {
            let rendered = try image(view.environment(\.stanceTheme, .light))
            return CGSize(width: rendered.width, height: rendered.height)
        }
        #expect(try size(StanceAgentStatusPill(.waiting) {}).height >= 44)
        #expect(try size(StanceToolCallCard("Search", status: .running, input: nil).frame(width: 320)).height >= 44)
        #expect(try size(StanceStepTimeline([StanceAgentStep(id: "1", title: "Read")]).frame(width: 320)).height >= 44)
        #expect(try size(StanceApprovalPrompt("Read the calendar", onAllow: {}, onDeny: {}).frame(width: 320)).height >= 88)
        #expect(try size(StanceTaskQueue(tasks: [StanceAgentTask(id: "1", title: "Export", status: .running)], onCancel: { _ in }).frame(width: 320)).height >= 88)
    }
}
