import StanceUI
import SwiftUI

/// Where a sample agent run is. `-assistant-agent <phase>` opens the Assistant screen at one.
enum AgentRunPhase: String, CaseIterable {
    /// The plan is waiting for approval.
    case plan
    /// Tools are running.
    case tools
    /// The agent asks before it writes a file.
    case approval
    /// The proposed change is shown as a diff.
    case review
    /// The run finished and the results are shown.
    case done
    /// The plan was rejected or the write was denied.
    case cancelled

    /// The phase named after `-assistant-agent`, if any.
    static var launch: AgentRunPhase? {
        let args = ProcessInfo.processInfo.arguments
        guard let i = args.firstIndex(of: "-assistant-agent") else { return nil }
        return i + 1 < args.count ? AgentRunPhase(rawValue: args[i + 1]) ?? .plan : .plan
    }

    var order: Int { Self.allCases.firstIndex(of: self) ?? 0 }
}

/// One agent run inside the conversation: a plan to approve, tool calls, an approval prompt, a
/// diff to review, then a generated table and chart with follow up prompts.
///
/// Everything is canned and local. Timers stand in for the tools.
struct AgentRunView: View {
    @State private var phase: AgentRunPhase
    @State private var plan = AIAgentsSample.plan
    @State private var readStatus = StanceStepStatus.pending
    @State private var compareStatus = StanceStepStatus.pending
    @State private var decisions: [String: StanceDiffDecision] = [:]
    @State private var work: Task<Void, Never>?
    let onFollowUp: (String) -> Void
    @Environment(StanceToastCenter.self) private var toasts

    init(startingAt phase: AgentRunPhase = .plan, onFollowUp: @escaping (String) -> Void) {
        _phase = State(initialValue: phase)
        // A run opened part way through shows the earlier steps as finished.
        _readStatus = State(initialValue: phase.order > AgentRunPhase.tools.order ? .complete : phase == .tools ? .complete : .pending)
        _compareStatus = State(initialValue: phase.order > AgentRunPhase.tools.order ? .complete : phase == .tools ? .running : .pending)
        _decisions = State(initialValue: phase == .done ? StanceDiffReview.acceptAll(AIAgentsSample.diff) : [:])
        self.onFollowUp = onFollowUp
    }

    private var status: StanceAgentStatus {
        switch phase {
        case .plan, .approval, .review: .waiting
        case .tools: .working
        case .done: .done
        case .cancelled: .paused
        }
    }

    private var detail: String {
        switch phase {
        case .plan: "Plan ready to review"
        case .tools: "Reading and comparing"
        case .approval: "Needs your approval"
        case .review: "Change ready to review"
        case .done: "Budget review finished"
        case .cancelled: "Stopped at your request"
        }
    }

    var body: some View {
        StanceMessage(role: .assistant, author: "Assistant") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                StanceAgentStatusPill(status, detail: detail)
                if phase == .plan {
                    Text("Here is how I would review the budget. Reorder or remove steps, then approve.").stanceText(.body)
                    StancePlanChecklist(items: $plan) {
                        runTools()
                    } onReject: {
                        phase = .cancelled
                    }
                }
                if phase.order >= AgentRunPhase.tools.order, phase != .cancelled {
                    StanceToolCallCard("Read the workbook", name: "files.read", icon: .fileText, status: readStatus, input: AIAgentsSample.toolInput, output: readStatus == .complete ? AIAgentsSample.toolOutput : nil, language: "json", duration: readStatus == .complete ? 3 : nil)
                    StanceToolCallCard("Compare with the Q3 review", name: "sheets.compare", icon: .copy, status: compareStatus, input: "{\n  \"against\": \"Q3 budget review\"\n}", output: compareStatus == .complete ? "{\n  \"movements\": 10\n}" : nil, language: "json", duration: compareStatus == .complete ? 5 : nil)
                }
                if phase == .approval {
                    StanceApprovalPrompt("Update the summary report", description: "Writes two changes to reports/fy27-summary.md. You can review them before they land.", risk: .medium) {
                        phase = .review
                    } onDeny: {
                        phase = .cancelled
                    } details: {
                        StanceCodeBlock("reports/fy27-summary.md\n2 sections, 3 lines added, 2 removed", title: "File")
                    }
                }
                if phase == .review {
                    Text("These are the changes I would make. Accept or reject each one.").stanceText(.body)
                    StanceDiffReview(files: AIAgentsSample.diff, decisions: $decisions)
                    StanceButton("Apply and finish", leadingIcon: .check) {
                        phase = .done
                        toasts.show("Summary updated", tone: .success)
                    }
                    .disabled(decisions.count < StanceDiffReview.hunkIDs(AIAgentsSample.diff).count)
                }
                if phase == .done {
                    StanceMarkdownRenderer("The review is done. **Travel** grows the most and **software** is the only line that falls. The summary report is updated.", baseHeadingLevel: 3)
                    StanceGeneratedTable("Largest budget movements", columns: AIOutputSample.tableColumns, rows: AIOutputSample.tableRows, maxRows: 3)
                    StanceGeneratedChart(AIOutputSample.chartTitle, takeaway: AIOutputSample.chartTakeaway, kind: .bar, series: AIOutputSample.chartSeries, source: AIOutputSample.chartSource)
                    StanceSuggestionChips(AIProductSample.followUps, label: "Follow up") { chip in
                        onFollowUp(chip.label)
                    }
                }
                if phase == .cancelled {
                    Text("Nothing was changed. Ask again whenever you want to continue.").stanceText(.body)
                }
            }
        }
        .onAppear { if phase == .tools, compareStatus == .running { finishTools(after: 2) } }
        .onDisappear { work?.cancel() }
    }

    /// Runs the two sample tools one after the other, then asks for approval.
    private func runTools() {
        phase = .tools
        readStatus = .running
        work?.cancel()
        work = Task {
            try? await Task.sleep(for: .seconds(1.2))
            if Task.isCancelled { return }
            readStatus = .complete
            compareStatus = .running
            try? await Task.sleep(for: .seconds(1.6))
            if Task.isCancelled { return }
            compareStatus = .complete
            phase = .approval
        }
    }

    private func finishTools(after seconds: Double) {
        work = Task {
            try? await Task.sleep(for: .seconds(seconds))
            if Task.isCancelled { return }
            compareStatus = .complete
            phase = .approval
        }
    }
}
