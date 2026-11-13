import StanceUI
import SwiftUI

/// Sample content for the output components. Everything is local: nothing is loaded.
enum AIOutputSample {
    /// A model answer with a heading, a citation, a task list, a table and code.
    static let markdown = """
    ## What changed in FY27

    Travel is **up 8%** after two customer workshops [1]. Software falls 3% [2]. \
    The limits are in the [travel policy](https://docs.binds.si/people/travel-policy).

    - [x] Compare the FY26 and FY27 workbooks
    - [ ] Confirm the Vienna dates

    | Line | FY26 | FY27 |
    |:-----|-----:|-----:|
    | Travel | 11,480 | 12,400 |
    | Software | 10,100 | 9,800 |

    ```swift
    let change = (fy27 - fy26) / fy26
    ```
    """

    static let shortMarkdown = """
    ## What changed in FY27

    Travel is **up 8%** after two workshops [1]. See the [travel policy](https://docs.binds.si/people/travel-policy).

    - [x] Compare the workbooks
    - [ ] Confirm the Vienna dates

    | Line | FY26 | FY27 |
    |:-----|-----:|-----:|
    | Travel | 11,480 | 12,400 |
    | Software | 10,100 | 9,800 |
    """

    static let citations: [Int: StanceSource] = [1: AISample.sources[0], 2: AISample.sources[2]]

    static let code = """
    func change(from old: Double, to new: Double) -> Double {
        // Share of last year's value
        return (new - old) / old
    }
    """

    static let tableColumns = [
        StanceGeneratedTableColumn(id: "line", header: "Budget line"),
        StanceGeneratedTableColumn(id: "fy26", header: "FY26", isNumeric: true),
        StanceGeneratedTableColumn(id: "fy27", header: "FY27", isNumeric: true),
        StanceGeneratedTableColumn(id: "change", header: "Change", isNumeric: true),
    ]

    static let tableRows = [
        StanceGeneratedTableRow(id: "travel", ["line": "Travel", "fy26": "11,480", "fy27": "12,400", "change": "+8%"]),
        StanceGeneratedTableRow(id: "software", ["line": "Software", "fy26": "10,100", "fy27": "9,800", "change": "-3%"]),
        StanceGeneratedTableRow(id: "events", ["line": "Events", "fy26": "4,000", "fy27": "4,100", "change": "+2.5%"]),
        StanceGeneratedTableRow(id: "training", ["line": "Training", "fy26": "2,600", "fy27": "2,600", "change": "0%"]),
        StanceGeneratedTableRow(id: "salaries", ["line": "Salaries", "fy26": "184,000", "fy27": "184,000", "change": "0%"]),
    ]

    static let chartSeries = [
        StanceChartSeries("FY26", points: [.init("Travel", 11480), .init("Software", 10100), .init("Events", 4000)]),
        StanceChartSeries("FY27", points: [.init("Travel", 12400), .init("Software", 9800), .init("Events", 4100)]),
    ]
    static let chartTitle = "Spend by budget line"
    static let chartTakeaway = "Travel grows the most, by 920 EUR. Software is the only line that falls."
    static let chartSource = "FY27 forecast workbook"

    static let versions = [StanceArtifactVersion(id: "1", label: "Version 1"), StanceArtifactVersion(id: "2", label: "Version 2")]
    static let artifactText = "Trips over 400 EUR need approval from the budget owner before booking. Book rail for journeys under four hours."

    /// A drawn picture in greys, so the showcase needs no image assets.
    static func artwork(_ variant: Int = 0) -> Image {
        Image(size: CGSize(width: 320, height: 320)) { context in
            let size = CGSize(width: 320, height: 320)
            let tones: [Double] = variant == 1 ? [0.82, 0.62, 0.42, 0.24] : variant == 2 ? [0.9, 0.5, 0.36, 0.2] : [0.86, 0.68, 0.48, 0.3]
            context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(Color(white: tones[0])))
            context.fill(Path(ellipseIn: CGRect(x: variant == 1 ? 60 : 200, y: 50, width: 64, height: 64)), with: .color(Color(white: 0.97)))
            for (index, tone) in tones.dropFirst().enumerated() {
                var hill = Path()
                let base = 170 + CGFloat(index) * 45
                hill.move(to: CGPoint(x: 0, y: base + 30))
                hill.addCurve(to: CGPoint(x: size.width, y: base + (index.isMultiple(of: 2) ? 10 : 40)), control1: CGPoint(x: 90, y: base - 50 + CGFloat(variant * 12)), control2: CGPoint(x: 210, y: base + 60 - CGFloat(variant * 10)))
                hill.addLine(to: CGPoint(x: size.width, y: size.height))
                hill.addLine(to: CGPoint(x: 0, y: size.height))
                hill.closeSubpath()
                context.fill(hill, with: .color(Color(white: tone)))
            }
        }
    }

    static let imageAlt = "Layered grey hills under a pale sun, drawn in ink"
    static var variations: [StanceImageVariation] {
        [
            StanceImageVariation(id: "a", image: artwork(0), alt: "Hills with the sun on the right"),
            StanceImageVariation(id: "b", image: artwork(1), alt: "Hills with the sun on the left"),
            StanceImageVariation(id: "c", image: artwork(2), alt: "Darker hills with a high sun"),
        ]
    }
}

/// Preview compositions for the output components, keyed by `components.json` slug.
@MainActor
enum AIOutputPreviewCatalog {
    typealias Entry = PreviewCatalog.Entry

    static let entries: [Entry] = [
        Entry("stance-markdown-renderer") {
            StanceMarkdownRenderer(AIOutputSample.shortMarkdown, citations: AIOutputSample.citations, baseHeadingLevel: 2).stanceCard()
        },
        Entry("stance-code-suggestion") {
            StanceCodeSuggestion(AIOutputSample.code, language: "swift", filename: "Budget.swift", runStatus: .complete, runOutput: "change(from: 11480, to: 12400) = 0.08", onApply: {}, onRun: {})
        },
        Entry("stance-artifact-panel") { ArtifactPanelPreview() },
        Entry("stance-generated-image") { GeneratedImagePreview() },
        Entry("stance-generated-table") {
            StanceGeneratedTable("Largest budget movements", columns: AIOutputSample.tableColumns, rows: AIOutputSample.tableRows, maxRows: 2, height: StanceSize.controlLg * 8, onExport: {})
        },
        Entry("stance-generated-chart") {
            StanceGeneratedChart(AIOutputSample.chartTitle, takeaway: AIOutputSample.chartTakeaway, series: AIOutputSample.chartSeries, source: AIOutputSample.chartSource)
        },
        Entry("stance-file-preview-card") {
            VStack(spacing: StanceSpacing.md) {
                StanceFilePreviewCard("Budget FY27.xlsx", size: 482_000, meta: "3 sheets", onOpen: {}, onDownload: {})
                StanceFilePreviewCard("Hills study.png", size: 1_240_000, thumbnail: AIOutputSample.artwork(), onOpen: {})
                StanceFilePreviewCard("Travel summary.pdf", status: .streaming, progress: 0.6)
            }
        },
        Entry("stance-canvas-split-view") { CanvasSplitPreview() },
    ]
}

private struct ArtifactPanelPreview: View {
    @State private var view = StanceArtifactView.preview
    @State private var version = "2"

    var body: some View {
        StanceArtifactPanel("Travel policy summary", kind: "Document", versions: AIOutputSample.versions, versionID: $version, view: $view, onClose: {}) {
            ScrollView {
                StanceMarkdownRenderer("## Approvals\n\n\(AIOutputSample.artifactText)\n\n- Rail under four hours\n- Economy for flights", baseHeadingLevel: 2)
                    .padding(StanceSpacing.lg)
            }
        } code: {
            ScrollView { StanceCodeBlock("## Approvals\n\n\(AIOutputSample.artifactText)", language: "md", wraps: true).padding(StanceSpacing.lg) }
        } actions: {
            StanceCopyButton(value: AIOutputSample.artifactText, variant: .ghost)
        }
        .frame(height: 420)
        .stanceSurface(.surface, cornerRadius: StanceRadius.xl)
    }
}

private struct GeneratedImagePreview: View {
    @State private var selection: String? = "a"

    var body: some View {
        StanceGeneratedImage(AIOutputSample.artwork(), alt: AIOutputSample.imageAlt, aspectRatio: 16 / 10, variations: AIOutputSample.variations, selection: $selection, prompt: "Layered hills under a pale sun, ink drawing", onRegenerate: {}, onEdit: {})
    }
}

private struct CanvasSplitPreview: View {
    @State private var pane = StanceCanvasPane.canvas

    var body: some View {
        StanceCanvasSplitView(narrowView: $pane) {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                StanceMessage(role: .user) { Text("Summarise the travel policy.") }
                StanceMessage(role: .assistant) { Text("Done. The summary is in the canvas.") }
            }
            .padding(StanceSpacing.lg)
        } canvas: {
            StanceMarkdownRenderer("## Approvals\n\n\(AIOutputSample.artifactText)", baseHeadingLevel: 2).padding(StanceSpacing.lg)
        }
        .frame(height: 320)
        .stanceSurface(.surface, cornerRadius: StanceRadius.xl)
    }
}

/// The output components with their variants and states, as sections for the AI page.
struct AIOutputDemo: View {
    @State private var applied = false
    @State private var runStatus: StanceStepStatus?
    @State private var showsPanel = false
    @State private var artifactView = StanceArtifactView.preview
    @State private var version = "2"
    @State private var variation: String? = "a"
    @State private var streaming = false
    @State private var streamed = AIOutputSample.markdown
    @Environment(StanceToastCenter.self) private var toasts

    var body: some View {
        StanceSection("Generated text and code", caption: "Markdown is parsed to native views. Links are limited to http, https and mailto.") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                StanceMarkdownRenderer(streamed, isStreaming: streaming, citations: AIOutputSample.citations, baseHeadingLevel: 3)
                StanceButton("Stream again", variant: .outline, size: .small) { replay() }
            }
            .stanceCard()
            StanceCodeSuggestion(AIOutputSample.code, language: "swift", filename: "Budget.swift", isApplied: applied, runStatus: runStatus, runOutput: runStatus == .complete ? "change(from: 11480, to: 12400) = 0.08" : nil) { _ in
                toasts.show("Copied")
            } onApply: {
                applied = true
            } onRun: {
                run()
            }
        }
        StanceSection("Generated data", caption: "Tables sort and copy as CSV. Charts always offer the same data as a table.") {
            StanceGeneratedTable("Largest budget movements", columns: AIOutputSample.tableColumns, rows: AIOutputSample.tableRows, maxRows: 3, onExport: { toasts.show("Exported") }, onExpand: { toasts.show("Expanded") })
            StanceGeneratedChart(AIOutputSample.chartTitle, takeaway: AIOutputSample.chartTakeaway, series: AIOutputSample.chartSeries, source: AIOutputSample.chartSource)
        }
        StanceSection("Files, images and artifacts", caption: "Pictures and files come from your app. Nothing is downloaded.") {
            StanceGeneratedImage(AIOutputSample.artwork(), alt: AIOutputSample.imageAlt, aspectRatio: 16 / 10, variations: AIOutputSample.variations, selection: $variation, prompt: "Layered hills under a pale sun, ink drawing", onRegenerate: {}, onEdit: {})
            StanceGeneratedImage(nil, alt: AIOutputSample.imageAlt, status: .streaming, progress: 0.4, aspectRatio: 16 / 6)
            StanceFilePreviewCard("Budget FY27.xlsx", size: 482_000, meta: "3 sheets", onOpen: { toasts.show("Opened") }, onDownload: { toasts.show("Saved") })
            StanceFilePreviewCard("Travel summary.pdf", status: .streaming, progress: 0.6)
            StanceButton("Open the artifact panel", variant: .outline, leadingIcon: .panelLeft) { showsPanel = true }
            StanceCanvasSplitView {
                StanceMessage(role: .assistant) { Text("The summary is in the canvas.") }.padding(StanceSpacing.lg)
            } canvas: {
                StanceMarkdownRenderer("### Approvals\n\n\(AIOutputSample.artifactText)", baseHeadingLevel: 3).padding(StanceSpacing.lg)
            }
            .frame(height: 280)
            .stanceSurface(.surface, cornerRadius: StanceRadius.xl)
        }
        .stanceArtifactPanel(isPresented: $showsPanel) {
            StanceArtifactPanel("Travel policy summary", kind: "Document", versions: AIOutputSample.versions, versionID: $version, view: $artifactView, onClose: { showsPanel = false }) {
                ScrollView { StanceMarkdownRenderer("## Approvals\n\n\(AIOutputSample.artifactText)").padding(StanceSpacing.lg) }
            } code: {
                ScrollView { StanceCodeBlock("## Approvals\n\n\(AIOutputSample.artifactText)", language: "md", wraps: true).padding(StanceSpacing.lg) }
            }
        }
    }

    private func replay() {
        streamed = ""
        streaming = true
        Task {
            for word in AIOutputSample.markdown.split(separator: " ", omittingEmptySubsequences: false) {
                try? await Task.sleep(for: .milliseconds(60))
                streamed += (streamed.isEmpty ? "" : " ") + word
            }
            streaming = false
        }
    }

    private func run() {
        runStatus = .running
        Task {
            try? await Task.sleep(for: .seconds(1))
            runStatus = .complete
        }
    }
}
