import SwiftUI

// Agent components (wave two): what an agent is doing, what it plans to do and what it asks
// permission for. Presentational: the app owns the run and passes steps and status in.

/// Joins short parts such as a status and a duration with the locale's comma.
private func stanceAgentsJoin(_ parts: [String], _ locale: Locale) -> String {
    guard var joined = parts.first else { return "" }
    for part in parts.dropFirst() { joined = stanceString("stance.ai.step.name \(joined) \(part)", locale) }
    return joined
}

// MARK: Tool call card

/// Words a ``StanceToolCallCard`` uses. Leave a value out to keep the localised default.
public struct StanceToolCallLabels: Sendable {
    public var input: String?
    public var output: String?
    public var error: String?

    /// - Parameters:
    ///   - input: The heading above the input. Defaults to a localised "Input".
    ///   - output: The heading above the output. Defaults to a localised "Output".
    ///   - error: The heading above the error. Defaults to a localised "Error".
    public init(input: String? = nil, output: String? = nil, error: String? = nil) {
        self.input = input
        self.output = output
        self.error = error
    }
}

/// The input and output of a tool call as code, used by the code initialiser of ``StanceToolCallCard``.
public struct StanceToolCallCode: View {
    let input: String?
    let output: String?
    let language: String?
    let labels: StanceToolCallLabels
    @Environment(\.locale) private var locale

    /// Whether there is an input or an output to show.
    var hasContent: Bool { input != nil || output != nil }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            if let input {
                StanceCodeBlock(input, language: language, title: labels.input ?? stanceString("stance.ai.tool.input", locale))
            }
            if let output {
                StanceCodeBlock(output, language: language, title: labels.output ?? stanceString("stance.ai.tool.output", locale))
            }
        }
    }
}

/// One tool call by the assistant: what ran, with what input, and what came back.
///
/// Built on the native `DisclosureGroup` with the Stance style, so VoiceOver hears a button with
/// its expanded state. The status is part of the name ("Search the web, complete") and each
/// status change is announced once.
public struct StanceToolCallCard<Content: View, Actions: View>: View {
    private let title: String
    private let name: String?
    private let icon: StanceIconName
    private let status: StanceStepStatus
    private let duration: TimeInterval?
    private let error: String?
    private let labels: StanceToolCallLabels
    private let external: Binding<Bool>?
    private let onExpandedChange: ((Bool) -> Void)?
    private let content: Content
    private let actions: Actions
    @State private var internalExpanded: Bool
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - title: What the call does in words, such as "Search the web".
    ///   - name: The tool's own name, such as `web.search`, shown in monospace.
    ///   - icon: The leading icon.
    ///   - status: The state of the call.
    ///   - duration: How long the call took, in seconds.
    ///   - error: What went wrong, shown when the card is open.
    ///   - isExpanded: The open state, when the app owns it.
    ///   - defaultExpanded: Whether the card starts open when it manages its own state.
    ///   - labels: Replacements for the built in words.
    ///   - onExpandedChange: Called when the reader opens or closes the card.
    ///   - content: The input and output.
    ///   - actions: Extra controls under the content, such as "Run again".
    @_disfavoredOverload
    public init(
        _ title: String,
        name: String? = nil,
        icon: StanceIconName = .terminal,
        status: StanceStepStatus,
        duration: TimeInterval? = nil,
        error: String? = nil,
        isExpanded: Binding<Bool>? = nil,
        defaultExpanded: Bool = false,
        labels: StanceToolCallLabels = .init(),
        onExpandedChange: ((Bool) -> Void)? = nil,
        @ViewBuilder content: () -> Content,
        @ViewBuilder actions: () -> Actions = { EmptyView() }
    ) {
        self.title = title
        self.name = name
        self.icon = icon
        self.status = status
        self.duration = duration
        self.error = error
        self.labels = labels
        external = isExpanded
        self.onExpandedChange = onExpandedChange
        self.content = content()
        self.actions = actions()
        _internalExpanded = State(initialValue: isExpanded?.wrappedValue ?? defaultExpanded)
    }

    /// The accessible name: the title with the status, and the duration when known.
    public nonisolated static func accessibilityName(title: String, status: StanceStepStatus, duration: TimeInterval? = nil, locale: Locale = .current) -> String {
        let name = status.accessibilityName(for: title, locale: locale)
        guard let duration else { return name }
        return stanceAgentsJoin([name, duration.stanceDuration(locale: locale)], locale)
    }

    private var expanded: Binding<Bool> {
        Binding(
            get: { external?.wrappedValue ?? internalExpanded },
            set: { new in
                if let external { external.wrappedValue = new } else { internalExpanded = new }
                onExpandedChange?(new)
            }
        )
    }

    /// Whether the card has anything to open: an error, content or actions.
    private var hasDetail: Bool {
        if let error, !error.isEmpty { return true }
        if let code = content as? StanceToolCallCode { return code.hasContent || Actions.self != EmptyView.self }
        return Content.self != EmptyView.self || Actions.self != EmptyView.self
    }

    public var body: some View {
        Group {
            if hasDetail {
                disclosure
            } else {
                // Nothing to open: a plain row, not a button.
                header
                    .padding(.vertical, StanceSpacing.sm)
                    .frame(maxWidth: .infinity, minHeight: StanceSize.touchTarget, alignment: .leading)
            }
        }
        .padding(.horizontal, StanceSpacing.md)
        .stanceSurface(.surface, cornerRadius: StanceRadius.lg)
        .modifier(StanceStepStatusAnnouncer(title: title, status: status))
    }

    private var disclosure: some View {
        DisclosureGroup(isExpanded: expanded) {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                if let error, !error.isEmpty {
                    HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.sm) {
                        StanceIcon(.alertCircle, size: StanceSize.iconSm).foregroundStyle(theme.colors.dangerFg)
                        VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                            Text(labels.error ?? stanceString("stance.ai.tool.error", locale)).stanceText(.label)
                            Text(error).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted)
                        }
                    }
                    .accessibilityElement(children: .combine)
                }
                content
                actions
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        } label: {
            header
        }
        .disclosureGroupStyle(.stance)
    }

    private var header: some View {
            HStack(spacing: StanceSpacing.sm) {
                StanceIcon(icon, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted)
                VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                    Text(title).stanceText(.label).foregroundStyle(theme.colors.fgDefault).multilineTextAlignment(.leading)
                    if let name {
                        Text(verbatim: name).stanceText(.mono).foregroundStyle(theme.colors.fgSubtle).environment(\.layoutDirection, .leftToRight)
                    }
                    HStack(spacing: StanceSpacing.xs) {
                        StanceStepStatusMark(status: status)
                        Text(statusText).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
                    }
                }
            }
            .padding(.vertical, StanceSpacing.xs)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(Self.accessibilityName(title: title, status: status, duration: duration, locale: locale))
    }

    private var statusText: String {
        guard let duration else { return status.label(locale: locale) }
        return stanceAgentsJoin([status.label(locale: locale), duration.stanceDuration(locale: locale, width: .narrow)], locale)
    }
}

extension StanceToolCallCard where Content == StanceToolCallCode, Actions == EmptyView {
    /// Creates a card whose input and output are shown as code blocks.
    /// - Parameters:
    ///   - input: What the tool was called with.
    ///   - output: What it returned.
    ///   - language: The language to highlight both with, such as `json`.
    @_disfavoredOverload
    public init(
        _ title: String,
        name: String? = nil,
        icon: StanceIconName = .terminal,
        status: StanceStepStatus,
        input: String?,
        output: String? = nil,
        language: String? = nil,
        duration: TimeInterval? = nil,
        error: String? = nil,
        isExpanded: Binding<Bool>? = nil,
        defaultExpanded: Bool = false,
        labels: StanceToolCallLabels = .init(),
        onExpandedChange: ((Bool) -> Void)? = nil
    ) {
        self.init(title, name: name, icon: icon, status: status, duration: duration, error: error, isExpanded: isExpanded, defaultExpanded: defaultExpanded, labels: labels, onExpandedChange: onExpandedChange) {
            StanceToolCallCode(input: input, output: output, language: language, labels: labels)
        }
    }

    /// Creates a code card whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        name: String? = nil,
        icon: StanceIconName = .terminal,
        status: StanceStepStatus,
        input: String?,
        output: String? = nil,
        language: String? = nil,
        duration: TimeInterval? = nil,
        error: String? = nil,
        isExpanded: Binding<Bool>? = nil,
        defaultExpanded: Bool = false,
        labels: StanceToolCallLabels = .init(),
        onExpandedChange: ((Bool) -> Void)? = nil
    ) {
        self.init(String(localized: titleKey), name: name, icon: icon, status: status, input: input, output: output, language: language, duration: duration, error: error, isExpanded: isExpanded, defaultExpanded: defaultExpanded, labels: labels, onExpandedChange: onExpandedChange)
    }
}

extension StanceToolCallCard {
    /// Creates a card whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        name: String? = nil,
        icon: StanceIconName = .terminal,
        status: StanceStepStatus,
        duration: TimeInterval? = nil,
        error: String? = nil,
        isExpanded: Binding<Bool>? = nil,
        defaultExpanded: Bool = false,
        labels: StanceToolCallLabels = .init(),
        onExpandedChange: ((Bool) -> Void)? = nil,
        @ViewBuilder content: () -> Content,
        @ViewBuilder actions: () -> Actions = { EmptyView() }
    ) {
        self.init(String(localized: titleKey), name: name, icon: icon, status: status, duration: duration, error: error, isExpanded: isExpanded, defaultExpanded: defaultExpanded, labels: labels, onExpandedChange: onExpandedChange, content: content, actions: actions)
    }
}

// MARK: Step timeline

/// One step of an agent run, shown by ``StanceStepTimeline``.
public struct StanceAgentStep: Identifiable, Equatable, Sendable {
    /// A stable identifier.
    public let id: String
    /// What the step does.
    public var title: String
    /// Optional secondary text.
    public var description: String?
    /// The state of the step.
    public var status: StanceStepStatus
    /// How long the step took, in seconds.
    public var duration: TimeInterval?
    /// Whether the step has detail content that can be opened.
    public var isExpandable: Bool

    /// Creates a step.
    public init(id: String, title: String, description: String? = nil, status: StanceStepStatus = .pending, duration: TimeInterval? = nil, isExpandable: Bool = false) {
        self.id = id
        self.title = title
        self.description = description
        self.status = status
        self.duration = duration
        self.isExpandable = isExpandable
    }
}

/// The ordered steps of an agent run, with the current step marked and each step expandable.
///
/// Drawn like ``StanceStepper`` and ``StanceTimeline``: a marker column joined by a line. Steps
/// with detail open with the native `DisclosureGroup`. VoiceOver reads "Step 2 of 4: title" with
/// the status in words, and the running step is called current.
public struct StanceStepTimeline<Content: View>: View {
    private let steps: [StanceAgentStep]
    private let isCompact: Bool
    private let label: String?
    private let external: Binding<Set<String>>?
    private let content: (StanceAgentStep) -> Content
    @State private var internalExpanded: Set<String>
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @ScaledMetric(relativeTo: .body) private var marker: CGFloat = StanceSize.controlXs

    /// - Parameters:
    ///   - steps: The steps, in order.
    ///   - expanded: The identifiers of open steps, when the app owns them.
    ///   - defaultExpanded: The steps that start open when the timeline manages its own state.
    ///   - isCompact: Hides descriptions and tightens the rows.
    ///   - label: The accessible name of the list. Defaults to a localised "Steps".
    ///   - content: The detail for an expandable step.
    public init(
        _ steps: [StanceAgentStep],
        expanded: Binding<Set<String>>? = nil,
        defaultExpanded: Set<String> = [],
        isCompact: Bool = false,
        label: String? = nil,
        @ViewBuilder content: @escaping (StanceAgentStep) -> Content
    ) {
        self.steps = steps
        external = expanded
        self.isCompact = isCompact
        self.label = label
        self.content = content
        _internalExpanded = State(initialValue: defaultExpanded)
    }

    /// The zero based index of the current step: the first that is running, or else the first
    /// that waits for the person. `nil` when nothing is in progress.
    public nonisolated static func currentIndex(_ steps: [StanceAgentStep]) -> Int? {
        steps.firstIndex { $0.status == .running } ?? steps.firstIndex { $0.status == .waiting }
    }

    /// What VoiceOver reads after a step's name: the status, "Current" for the current step and
    /// the duration when known.
    public nonisolated static func accessibilityValue(for step: StanceAgentStep, isCurrent: Bool, locale: Locale = .current) -> String {
        var parts = [step.status.label(locale: locale)]
        if isCurrent { parts.append(stanceString("stance.step.current", locale)) }
        if let duration = step.duration { parts.append(duration.stanceDuration(locale: locale)) }
        return parts.joined(separator: ", ")
    }

    private func isOpen(_ id: String) -> Binding<Bool> {
        Binding(
            get: { (external?.wrappedValue ?? internalExpanded).contains(id) },
            set: { open in
                var set = external?.wrappedValue ?? internalExpanded
                if open { set.insert(id) } else { set.remove(id) }
                if let external { external.wrappedValue = set } else { internalExpanded = set }
            }
        )
    }

    public var body: some View {
        let current = Self.currentIndex(steps)
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(steps.enumerated()), id: \.element.id) { index, step in
                HStack(alignment: .top, spacing: StanceSpacing.md) {
                    VStack(spacing: 0) {
                        StanceStepStatusMark(status: step.status)
                            .frame(width: marker, height: marker)
                            .background(index == current ? theme.colors.bgEmphasis : theme.colors.bgSurface, in: Circle())
                            .overlay { Circle().strokeBorder(index == current ? theme.colors.borderStrong : theme.colors.borderDefault, lineWidth: theme.controlBorderWidth) }
                            .padding(.top, (StanceSize.touchTarget - StanceSize.controlXs) / 2)
                        if index < steps.count - 1 {
                            Rectangle().fill(theme.colors.separator).frame(width: max(theme.borderWidth, StanceSpacing.xxs)).frame(maxHeight: .infinity)
                        }
                    }
                    .accessibilityHidden(true)
                    row(step, index: index, isCurrent: index == current)
                        .padding(.bottom, index < steps.count - 1 ? (isCompact ? StanceSpacing.xs : StanceSpacing.md) : 0)
                }
                // Each row takes its own height, so the connector stretches without making the row flexible.
                .fixedSize(horizontal: false, vertical: true)
                .modifier(StanceStepStatusAnnouncer(title: step.title, status: step.status))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label ?? stanceString("stance.ai.steps", locale))
    }

    @ViewBuilder private func row(_ step: StanceAgentStep, index: Int, isCurrent: Bool) -> some View {
        let name = stanceString("stance.step \(index + 1) \(steps.count) \(step.title)", locale)
        let value = Self.accessibilityValue(for: step, isCurrent: isCurrent, locale: locale)
        if step.isExpandable, Content.self != EmptyView.self {
            DisclosureGroup(isExpanded: isOpen(step.id)) {
                content(step).frame(maxWidth: .infinity, alignment: .leading)
            } label: {
                heading(step, isCurrent: isCurrent)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel([name, value].joined(separator: ", "))
            }
            .disclosureGroupStyle(.stance)
        } else {
            heading(step, isCurrent: isCurrent)
                .frame(maxWidth: .infinity, minHeight: StanceSize.touchTarget, alignment: .leading)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(name)
                .accessibilityValue(value)
        }
    }

    private func heading(_ step: StanceAgentStep, isCurrent: Bool) -> some View {
        VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
            Text(step.title)
                .stanceText(isCurrent ? .label : .bodySmall)
                .foregroundStyle(step.status == .pending || step.status == .skipped ? theme.colors.fgMuted : theme.colors.fgDefault)
            if let description = step.description, !isCompact {
                Text(description).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
            }
            Text(statusText(step)).stanceText(.caption).foregroundStyle(step.status.tone == .neutral ? theme.colors.fgSubtle : step.status.tone.foreground(theme))
        }
        .multilineTextAlignment(.leading)
        .padding(.vertical, StanceSpacing.xs)
    }

    private func statusText(_ step: StanceAgentStep) -> String {
        guard let duration = step.duration else { return step.status.label(locale: locale) }
        return stanceAgentsJoin([step.status.label(locale: locale), duration.stanceDuration(locale: locale, width: .narrow)], locale)
    }
}

extension StanceStepTimeline where Content == EmptyView {
    /// Creates a timeline whose steps have no detail content.
    public init(_ steps: [StanceAgentStep], isCompact: Bool = false, label: String? = nil) {
        self.init(steps, isCompact: isCompact, label: label) { _ in EmptyView() }
    }
}

// MARK: Plan checklist

/// One step of a plan, shown by ``StancePlanChecklist``.
public struct StancePlanItem: Identifiable, Equatable, Sendable {
    /// A stable identifier.
    public let id: String
    /// What the step will do. Editable when the checklist is editable.
    public var title: String
    /// Optional secondary text.
    public var description: String?
    /// The state of the step.
    public var status: StanceStepStatus

    /// Creates a plan item.
    public init(id: String, title: String, description: String? = nil, status: StanceStepStatus = .pending) {
        self.id = id
        self.title = title
        self.description = description
        self.status = status
    }
}

/// Words a ``StancePlanChecklist`` uses. Leave a value out to keep the localised default.
public struct StancePlanChecklistLabels: Sendable {
    public var approve: String?
    public var reject: String?
    public var moveUp: String?
    public var moveDown: String?
    public var remove: (@Sendable (String) -> String)?
    public var progress: (@Sendable (Int, Int) -> String)?
    public var stepTitle: String?

    /// - Parameters:
    ///   - approve: The approve button. Defaults to a localised "Approve plan".
    ///   - reject: The reject button. Defaults to a localised "Reject".
    ///   - moveUp: The VoiceOver action that moves a step up. Defaults to a localised "Move up".
    ///   - moveDown: The VoiceOver action that moves a step down. Defaults to a localised "Move down".
    ///   - remove: The VoiceOver action that removes a step, given its title. Defaults to a localised "Remove title".
    ///   - progress: The progress summary, given completed and total steps. Defaults to a localised "2 of 5 steps complete".
    ///   - stepTitle: The accessible name of a step's text field. Defaults to a localised "Step title".
    public init(
        approve: String? = nil,
        reject: String? = nil,
        moveUp: String? = nil,
        moveDown: String? = nil,
        remove: (@Sendable (String) -> String)? = nil,
        progress: (@Sendable (Int, Int) -> String)? = nil,
        stepTitle: String? = nil
    ) {
        self.approve = approve
        self.reject = reject
        self.moveUp = moveUp
        self.moveDown = moveDown
        self.remove = remove
        self.progress = progress
        self.stepTitle = stepTitle
    }
}

/// The plan an agent proposes before it starts: steps that can be reviewed, edited, reordered or
/// removed, then approved or rejected.
///
/// Built on `List` with `onMove` and `onDelete`, so the system reorder handles and delete
/// controls are used. Dragging is not the only way: every step offers Move up, Move down and
/// Remove as VoiceOver actions, and each change is announced.
public struct StancePlanChecklist: View {
    private let title: String?
    private let isEditable: Bool
    private let progress: Double?
    private let height: CGFloat?
    private let labels: StancePlanChecklistLabels
    private let onApprove: (() -> Void)?
    private let onReject: (() -> Void)?
    @Binding private var items: [StancePlanItem]
    @State private var measured: [String: CGFloat] = [:]
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @ScaledMetric(relativeTo: .body) private var rowEstimate: CGFloat = StanceSize.touchTarget + StanceSpacing.xl

    /// - Parameters:
    ///   - title: The heading. Defaults to a localised "Plan".
    ///   - items: The steps, in order. Edits, moves and removals update this binding.
    ///   - isEditable: Whether steps can be renamed, reordered and removed.
    ///   - progress: Progress from 0 to 1. Derived from the step statuses when left out.
    ///   - height: A fixed height for the list. By default the list is as tall as its steps.
    ///   - labels: Replacements for the built in words.
    ///   - onApprove: Approves the plan. Without it there is no approve button.
    ///   - onReject: Rejects the plan. Without it there is no reject button.
    @_disfavoredOverload
    public init(
        _ title: String? = nil,
        items: Binding<[StancePlanItem]>,
        isEditable: Bool = true,
        progress: Double? = nil,
        height: CGFloat? = nil,
        labels: StancePlanChecklistLabels = .init(),
        onApprove: (() -> Void)? = nil,
        onReject: (() -> Void)? = nil
    ) {
        self.title = title
        _items = items
        self.isEditable = isEditable
        self.progress = progress
        self.height = height
        self.labels = labels
        self.onApprove = onApprove
        self.onReject = onReject
    }

    // MARK: Logic

    /// Moves the step at `index` by `offset` places, clamped to the ends of the plan.
    /// Returns the new zero based index, or `nil` when the step could not move.
    @discardableResult
    public nonisolated static func move(_ items: inout [StancePlanItem], from index: Int, by offset: Int) -> Int? {
        guard items.indices.contains(index) else { return nil }
        let target = min(max(index + offset, 0), items.count - 1)
        guard target != index else { return nil }
        let item = items.remove(at: index)
        items.insert(item, at: target)
        return target
    }

    /// Applies a `List` move: the same arithmetic as `Array.move(fromOffsets:toOffset:)`.
    public nonisolated static func move(_ items: inout [StancePlanItem], fromOffsets source: IndexSet, toOffset destination: Int) {
        items.move(fromOffsets: source, toOffset: destination)
    }

    /// Removes the step with `id`. Returns the removed step, or `nil` when there is none.
    @discardableResult
    public nonisolated static func remove(_ items: inout [StancePlanItem], id: String) -> StancePlanItem? {
        guard let index = items.firstIndex(where: { $0.id == id }) else { return nil }
        return items.remove(at: index)
    }

    /// Finished steps and all steps. A skipped step counts as finished, as on the web.
    public nonisolated static func counts(_ items: [StancePlanItem]) -> (completed: Int, total: Int) {
        (items.filter { $0.status == .complete || $0.status == .skipped }.count, items.count)
    }

    /// Progress from 0 to 1 derived from the step statuses. An empty plan has no progress.
    public nonisolated static func progress(_ items: [StancePlanItem]) -> Double {
        let (completed, total) = counts(items)
        return total == 0 ? 0 : Double(completed) / Double(total)
    }

    /// The progress in words, for example "2 of 5 steps complete".
    public nonisolated static func summary(_ items: [StancePlanItem], locale: Locale = .current) -> String {
        let (completed, total) = counts(items)
        return stanceString("stance.ai.plan.progress \(completed) \(total)", locale)
    }

    // MARK: View

    private var heading: String { title ?? stanceString("stance.ai.plan", locale) }

    private var summary: String {
        let (completed, total) = Self.counts(items)
        return labels.progress?(completed, total) ?? Self.summary(items, locale: locale)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                Text(heading).stanceText(.subheading).accessibilityAddTraits(.isHeader)
                ProgressView(value: min(max(progress ?? Self.progress(items), 0), 1))
                    .tint(theme.colors.accentBg)
                    .accessibilityHidden(true)
                Text(summary).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
            }
            list
            if onApprove != nil || onReject != nil {
                StanceButtonGroup {
                    if let onReject {
                        StanceButton(labels.reject ?? stanceString("stance.ai.plan.reject", locale), variant: .outline) {
                            StanceHaptics.warning()
                            onReject()
                        }
                        .keyboardShortcut(.cancelAction)
                    }
                    if let onApprove {
                        StanceButton(labels.approve ?? stanceString("stance.ai.plan.approve", locale), leadingIcon: .check) {
                            StanceHaptics.success()
                            onApprove()
                        }
                        .disabled(items.isEmpty)
                    }
                }
            }
        }
        .stanceCard()
    }

    private var listHeight: CGFloat {
        height ?? items.reduce(0) { $0 + (measured[$1.id] ?? rowEstimate) }
    }

    private var list: some View {
        List {
            ForEach($items) { $item in
                row($item)
                    .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { measured[item.id] = $0 + StanceSpacing.sm * 2 }
                    .listRowInsets(EdgeInsets(top: StanceSpacing.sm, leading: StanceSpacing.xs, bottom: StanceSpacing.sm, trailing: StanceSpacing.xs))
                    .listRowBackground(theme.colors.bgSurface)
                    .listRowSeparatorTint(theme.colors.separator)
            }
            .onMove(perform: isEditable ? { source, destination in
                Self.move(&items, fromOffsets: source, toOffset: destination)
                StanceHaptics.selection()
            } : nil)
            .onDelete(perform: isEditable ? { offsets in
                items.remove(atOffsets: offsets)
                StanceHaptics.selection()
            } : nil)
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .scrollDisabled(height == nil)
        .frame(height: listHeight)
        #if os(iOS)
        .environment(\.editMode, .constant(isEditable ? .active : .inactive))
        #endif
    }

    private func row(_ item: Binding<StancePlanItem>) -> some View {
        let value = item.wrappedValue
        let index = items.firstIndex { $0.id == value.id } ?? 0
        return HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.sm) {
            StanceStepStatusMark(status: value.status)
            VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                if isEditable {
                    TextField(labels.stepTitle ?? stanceString("stance.ai.plan.stepTitle", locale), text: item.title, axis: .vertical)
                        .stanceText(.body)
                        .foregroundStyle(theme.colors.fgDefault)
                } else {
                    Text(value.title).stanceText(.body).foregroundStyle(theme.colors.fgDefault)
                }
                if let description = value.description {
                    Text(description).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
                }
                if value.status != .pending {
                    Text(value.status.label(locale: locale)).stanceText(.caption).foregroundStyle(theme.colors.fgSubtle)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(minHeight: StanceSize.touchTarget - StanceSpacing.sm * 2)
        .accessibilityElement(children: .combine)
        .accessibilityValue([value.status.label(locale: locale), stanceString("stance.sortable.position \(index + 1) \(items.count)", locale)].joined(separator: ", "))
        .accessibilityActions {
            if isEditable {
                Button(labels.moveUp ?? stanceString("stance.sortable.moveUp", locale)) { move(value, by: -1) }
                Button(labels.moveDown ?? stanceString("stance.sortable.moveDown", locale)) { move(value, by: 1) }
                Button(labels.remove?(value.title) ?? stanceString("stance.remove \(value.title)", locale)) { remove(value) }
            }
        }
    }

    private func move(_ item: StancePlanItem, by offset: Int) {
        guard let index = items.firstIndex(where: { $0.id == item.id }), let target = Self.move(&items, from: index, by: offset) else { return }
        StanceHaptics.selection()
        StanceAnnouncer.announce(stanceString("stance.sortable.moved \(item.title) \(target + 1) \(items.count)", locale))
    }

    private func remove(_ item: StancePlanItem) {
        guard Self.remove(&items, id: item.id) != nil else { return }
        StanceHaptics.selection()
        StanceAnnouncer.announce(stanceString("stance.ai.plan.removed \(item.title)", locale))
    }
}

extension StancePlanChecklist {
    /// Creates a plan whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        items: Binding<[StancePlanItem]>,
        isEditable: Bool = true,
        progress: Double? = nil,
        height: CGFloat? = nil,
        labels: StancePlanChecklistLabels = .init(),
        onApprove: (() -> Void)? = nil,
        onReject: (() -> Void)? = nil
    ) {
        self.init(String(localized: titleKey), items: items, isEditable: isEditable, progress: progress, height: height, labels: labels, onApprove: onApprove, onReject: onReject)
    }
}

// MARK: Approval prompt

/// The countdown of a ``StanceApprovalPrompt``. Its only possible outcome is a denial: an
/// approval prompt never allows on its own.
public struct StanceApprovalCountdown: Equatable, Sendable {
    /// What a countdown can do when it runs out. There is deliberately no case that allows.
    public enum Outcome: String, CaseIterable, Sendable {
        case deny
    }

    /// Seconds left.
    public private(set) var remaining: TimeInterval
    private var fired = false

    /// Creates a countdown of `seconds`. Negative values count as zero.
    public init(seconds: TimeInterval) {
        remaining = max(0, seconds)
    }

    /// Whether the countdown has run out.
    public var isExpired: Bool { remaining <= 0 }

    /// Advances the countdown. Returns ``Outcome/deny`` once, when the time runs out, and `nil`
    /// before and after that.
    public mutating func tick(by interval: TimeInterval = 1) -> Outcome? {
        guard !fired else { return nil }
        remaining = max(0, remaining - max(0, interval))
        guard remaining <= 0 else { return nil }
        fired = true
        return .deny
    }
}

/// Why an approval prompt denied, as the web reports it.
public enum StanceApprovalDenyReason: String, CaseIterable, Sendable {
    /// The person pressed Deny.
    case deny
    /// The person pressed Escape on a hardware keyboard.
    case escape
    /// The countdown ran out.
    case timeout
}

/// Words a ``StanceApprovalPrompt`` uses. Leave a value out to keep the localised default.
public struct StanceApprovalPromptLabels: Sendable {
    public var allow: String?
    public var allowAlways: String?
    public var deny: String?
    public var details: String?
    public var countdown: (@Sendable (String) -> String)?
    public var autoDenied: String?
    public var keepWaiting: String?

    /// - Parameters:
    ///   - allow: Defaults to a localised "Allow".
    ///   - allowAlways: Defaults to a localised "Always allow".
    ///   - deny: Defaults to a localised "Deny".
    ///   - details: The button that opens the details sheet. Defaults to a localised "View details".
    ///   - countdown: The countdown text, given the time left. Defaults to a localised "Denies automatically in 30 seconds".
    ///   - autoDenied: Announced when the countdown denies. Defaults to a localised "Denied automatically".
    ///   - keepWaiting: Stops the countdown. Defaults to a localised "Keep waiting".
    public init(allow: String? = nil, allowAlways: String? = nil, deny: String? = nil, details: String? = nil, countdown: (@Sendable (String) -> String)? = nil, autoDenied: String? = nil, keepWaiting: String? = nil) {
        self.keepWaiting = keepWaiting
        self.allow = allow
        self.allowAlways = allowAlways
        self.deny = deny
        self.details = details
        self.countdown = countdown
        self.autoDenied = autoDenied
    }
}

/// Asks for permission before an agent acts: the action, its effect and the risk, with allow,
/// always allow and deny.
///
/// An inline card. Details such as a command or a diff open in a native sheet with detents.
/// Deny is the safe choice: it is the cancel action, so Escape on a hardware keyboard denies,
/// and an optional countdown can only deny. The Return key allows only when the app opts in and
/// never for a high risk action. Allow and deny give haptic feedback.
public struct StanceApprovalPrompt<Details: View>: View {
    private let title: String
    private let description: String?
    private let risk: StanceRiskLevel
    private let isBusy: Bool
    private let countdown: TimeInterval?
    private let returnKeyAllows: Bool
    private let takesFocus: Bool
    private let labels: StanceApprovalPromptLabels
    private let onAllow: () -> Void
    private let onAllowAlways: (() -> Void)?
    private let onDeny: () -> Void
    private let onDenyReason: ((StanceApprovalDenyReason) -> Void)?
    private let details: Details
    @State private var timer: StanceApprovalCountdown?
    @State private var showsDetails = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.layoutDirection) private var layoutDirection

    /// - Parameters:
    ///   - title: The action, such as "Send the email to 48 people".
    ///   - description: The effect of the action.
    ///   - risk: How much is at stake. Shown in words.
    ///   - isBusy: Disables the buttons while the answer is being applied. Pauses the countdown.
    ///   - countdown: Seconds until the prompt denies on its own. It never allows on its own.
    ///   - returnKeyAllows: Makes Allow the default action for the Return key. Ignored for high risk.
    ///   - takesFocus: Moves VoiceOver focus to the prompt when it appears.
    ///   - labels: Replacements for the built in words.
    ///   - onAllow: Allows this once.
    ///   - onAllowAlways: Allows this and similar actions from now on. Without it there is no such button.
    ///   - onDeny: Denies. Also called when the countdown runs out.
    ///   - onDenyReason: Called with why the prompt denied, after `onDeny`.
    ///   - details: The command, diff or other detail, shown in a sheet.
    @_disfavoredOverload
    public init(
        _ title: String,
        description: String? = nil,
        risk: StanceRiskLevel = .medium,
        isBusy: Bool = false,
        countdown: TimeInterval? = nil,
        returnKeyAllows: Bool = false,
        takesFocus: Bool = false,
        labels: StanceApprovalPromptLabels = .init(),
        onAllow: @escaping () -> Void,
        onAllowAlways: (() -> Void)? = nil,
        onDeny: @escaping () -> Void,
        onDenyReason: ((StanceApprovalDenyReason) -> Void)? = nil,
        @ViewBuilder details: () -> Details = { EmptyView() }
    ) {
        self.onDenyReason = onDenyReason
        self.title = title
        self.description = description
        self.risk = risk
        self.isBusy = isBusy
        self.countdown = countdown
        self.returnKeyAllows = returnKeyAllows
        self.takesFocus = takesFocus
        self.labels = labels
        self.onAllow = onAllow
        self.onAllowAlways = onAllowAlways
        self.onDeny = onDeny
        self.details = details()
        _timer = State(initialValue: countdown.map(StanceApprovalCountdown.init(seconds:)))
    }

    /// Whether the Return key may allow: only when the app opted in, and never for high risk.
    public nonisolated static func allowIsDefaultAction(risk: StanceRiskLevel, returnKeyAllows: Bool) -> Bool {
        returnKeyAllows && risk != .high
    }

    /// What VoiceOver hears when the prompt appears, for example "Approval needed: Send the email. High risk".
    public nonisolated static func announcement(title: String, risk: StanceRiskLevel, locale: Locale = .current) -> String {
        stanceString("stance.ai.approval.needed \(title) \(risk.label(locale: locale))", locale)
    }

    private var countdownText: String? {
        guard let timer, !timer.isExpired else { return nil }
        let time = timer.remaining.stanceDuration(locale: locale)
        return labels.countdown?(time) ?? stanceString("stance.ai.approval.countdown \(time)", locale)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                HStack(spacing: StanceSpacing.xs) {
                    StanceIcon(risk == .low ? .shield : risk.tone.icon, size: StanceSize.iconSm)
                        .foregroundStyle(risk == .low ? theme.colors.fgMuted : risk.tone.foreground(theme))
                    Text(risk.label(locale: locale)).stanceText(.caption).fontWeight(.semibold)
                        .foregroundStyle(risk == .low ? theme.colors.fgMuted : risk.tone.foreground(theme))
                }
                Text(title).stanceText(.subheading).accessibilityAddTraits(.isHeader)
                if let description {
                    Text(description).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted)
                }
                if let countdownText {
                    HStack(spacing: StanceSpacing.xs) {
                        StanceIcon(.clock, size: StanceSize.iconSm)
                        Text(countdownText).stanceText(.caption).monospacedDigit()
                    }
                    .foregroundStyle(theme.colors.fgMuted)
                    // The time left is read on demand, never announced every second.
                    .accessibilityElement(children: .combine)
                    .accessibilityAddTraits(.updatesFrequently)
                }
            }
            .accessibilityElement(children: .combine)
            .modifier(StanceApprovalFocus(isOn: takesFocus))
            if Details.self != EmptyView.self || countdownText != nil {
                HStack(spacing: StanceSpacing.md) {
                    if Details.self != EmptyView.self {
                        Button(labels.details ?? stanceString("stance.ai.approval.details", locale)) { showsDetails = true }
                            .buttonStyle(.stance(.link, size: .small))
                    }
                    if countdownText != nil {
                        // Stops the countdown so the prompt waits for an answer.
                        Button(labels.keepWaiting ?? stanceString("stance.ai.approval.keepWaiting", locale)) { timer = nil }
                            .buttonStyle(.stance(.link, size: .small))
                    }
                }
            }
            StanceButtonGroup {
                StanceButton(labels.deny ?? stanceString("stance.ai.approval.deny", locale), variant: .outline) { deny(.deny) }
                    .background {
                        // Escape denies too, and is reported as such.
                        Button("") { deny(.escape) }
                            .keyboardShortcut(.cancelAction)
                            .opacity(0)
                            .frame(width: 0, height: 0)
                            .accessibilityHidden(true)
                    }
                if let onAllowAlways {
                    StanceButton(labels.allowAlways ?? stanceString("stance.ai.approval.allowAlways", locale), variant: .outline) {
                        StanceHaptics.success()
                        onAllowAlways()
                    }
                }
                allowButton
            }
            .disabled(isBusy)
        }
        .padding(StanceSpacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(theme.colors.bgSurface, in: RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous)
                .strokeBorder(risk == .high ? theme.colors.dangerBorder : theme.colors.borderStrong, lineWidth: theme.controlBorderWidth)
        }
        .accessibilityElement(children: .contain)
        .sheet(isPresented: $showsDetails) {
            NavigationStack {
                ScrollView {
                    details.padding(StanceSpacing.lg).frame(maxWidth: .infinity, alignment: .leading)
                }
                .background(theme.colors.bgCanvas)
                .navigationTitle(title)
                #if os(iOS)
                .navigationBarTitleDisplayMode(.inline)
                #endif
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button(stanceString("stance.close", locale)) { showsDetails = false }
                    }
                }
            }
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
            .modifier(StancePresentationChrome(theme: theme, locale: locale, layoutDirection: layoutDirection))
        }
        .onAppear {
            StanceAnnouncer.announce(Self.announcement(title: title, risk: risk, locale: locale), urgent: true)
        }
        .task(id: isBusy) {
            guard timer != nil, !isBusy else { return }
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(1))
                if Task.isCancelled { return }
                if timer?.tick() == .deny {
                    deny(.timeout)
                    return
                }
            }
        }
    }

    @ViewBuilder private var allowButton: some View {
        let button = StanceButton(labels.allow ?? stanceString("stance.ai.approval.allow", locale), variant: risk == .high ? .danger : .primary, isLoading: isBusy) {
            StanceHaptics.success()
            onAllow()
        }
        if Self.allowIsDefaultAction(risk: risk, returnKeyAllows: returnKeyAllows) {
            button.keyboardShortcut(.defaultAction)
        } else {
            button
        }
    }

    private func deny(_ reason: StanceApprovalDenyReason) {
        StanceHaptics.warning()
        if reason == .timeout { StanceAnnouncer.announce(labels.autoDenied ?? stanceString("stance.ai.approval.autoDenied", locale), urgent: true) }
        timer = nil
        onDeny()
        onDenyReason?(reason)
    }
}

/// Moves VoiceOver focus to an approval prompt when it appears, only when the app asks for it.
private struct StanceApprovalFocus: ViewModifier {
    let isOn: Bool
    @AccessibilityFocusState private var focused: Bool

    func body(content: Content) -> some View {
        if isOn {
            content.accessibilityFocused($focused).onAppear { focused = true }
        } else {
            content
        }
    }
}

extension StanceApprovalPrompt {
    /// Creates a prompt whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        description: String? = nil,
        risk: StanceRiskLevel = .medium,
        isBusy: Bool = false,
        countdown: TimeInterval? = nil,
        returnKeyAllows: Bool = false,
        takesFocus: Bool = false,
        labels: StanceApprovalPromptLabels = .init(),
        onAllow: @escaping () -> Void,
        onAllowAlways: (() -> Void)? = nil,
        onDeny: @escaping () -> Void,
        @ViewBuilder details: () -> Details = { EmptyView() }
    ) {
        self.init(String(localized: titleKey), description: description, risk: risk, isBusy: isBusy, countdown: countdown, returnKeyAllows: returnKeyAllows, takesFocus: takesFocus, labels: labels, onAllow: onAllow, onAllowAlways: onAllowAlways, onDeny: onDeny, details: details)
    }
}

// MARK: Permission sheet

/// One thing an agent or connector may access, shown by ``StancePermissionSheet``.
public struct StancePermission: Identifiable, Equatable, Sendable {
    /// A stable identifier.
    public let id: String
    /// What may be accessed, such as "Read your calendar".
    public var title: String
    /// The scope in plain words.
    public var description: String?
    /// Whether access is allowed.
    public var isGranted: Bool
    /// Whether the agent cannot work without it. Required permissions stay on.
    public var isRequired: Bool
    /// How much is at stake, if worth stating.
    public var risk: StanceRiskLevel?

    /// Creates a permission.
    public init(id: String, title: String, description: String? = nil, isGranted: Bool = false, isRequired: Bool = false, risk: StanceRiskLevel? = nil) {
        self.id = id
        self.title = title
        self.description = description
        self.isGranted = isGranted
        self.isRequired = isRequired
        self.risk = risk
    }
}

/// Words a ``StancePermissionSheet`` uses. Leave a value out to keep the localised default.
public struct StancePermissionSheetLabels: Sendable {
    public var save: String?
    public var cancel: String?
    public var required: String?
    public var requiredHint: String?

    /// - Parameters:
    ///   - save: Defaults to a localised "Save".
    ///   - cancel: Defaults to a localised "Cancel".
    ///   - required: The mark on a required permission. Defaults to a localised "Required".
    ///   - requiredHint: Explains why a required switch is disabled.
    public init(save: String? = nil, cancel: String? = nil, required: String? = nil, requiredHint: String? = nil) {
        self.save = save
        self.cancel = cancel
        self.required = required
        self.requiredHint = requiredHint
    }
}

/// Lists what an agent or connector may access, with a switch for each permission.
///
/// Present it with `.stancePermissionSheet(...)`, which shows it in a native sheet with medium
/// and large detents. Each permission is the system `Toggle` in the Stance style. Required
/// permissions are on, disabled and explained in words.
public struct StancePermissionSheet: View {
    private let title: String?
    private let description: String?
    private let labels: StancePermissionSheetLabels
    private let onSave: (([StancePermission]) -> Void)?
    private let onCancel: () -> Void
    @Binding private var permissions: [StancePermission]
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - title: The sheet title. Defaults to a localised "Permissions".
    ///   - description: Who is asking and why.
    ///   - permissions: The permissions. Switches update this binding.
    ///   - labels: Replacements for the built in words.
    ///   - onSave: Called with the permissions when the person saves. Without it there is no save button.
    ///   - onCancel: Called when the person cancels.
    @_disfavoredOverload
    public init(
        _ title: String? = nil,
        description: String? = nil,
        permissions: Binding<[StancePermission]>,
        labels: StancePermissionSheetLabels = .init(),
        onSave: (([StancePermission]) -> Void)? = nil,
        onCancel: @escaping () -> Void = {}
    ) {
        self.title = title
        self.description = description
        _permissions = permissions
        self.labels = labels
        self.onSave = onSave
        self.onCancel = onCancel
    }

    /// The permissions with every required one granted.
    public nonisolated static func normalized(_ permissions: [StancePermission]) -> [StancePermission] {
        permissions.map { permission in
            var permission = permission
            if permission.isRequired { permission.isGranted = true }
            return permission
        }
    }

    /// Grants or revokes one permission. A required permission cannot be revoked.
    /// Returns `true` when the list changed.
    @discardableResult
    public nonisolated static func setGranted(_ granted: Bool, id: String, in permissions: inout [StancePermission]) -> Bool {
        guard let index = permissions.firstIndex(where: { $0.id == id }) else { return false }
        let value = permissions[index].isRequired ? true : granted
        guard permissions[index].isGranted != value else { return false }
        permissions[index].isGranted = value
        return true
    }

    /// How many permissions are allowed, in words, for example "2 of 4 allowed".
    public nonisolated static func summary(_ permissions: [StancePermission], locale: Locale = .current) -> String {
        stanceString("stance.ai.permissions.summary \(normalized(permissions).filter(\.isGranted).count) \(permissions.count)", locale)
    }

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                    if let description {
                        Text(description).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted)
                    }
                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(Array(permissions.enumerated()), id: \.element.id) { index, permission in
                            if index > 0 { StanceDivider() }
                            row(permission)
                        }
                    }
                    .padding(.horizontal, StanceSpacing.lg)
                    .stanceSurface(.surface, cornerRadius: StanceRadius.xl)
                    .accessibilityElement(children: .contain)
                    .accessibilityLabel(title ?? stanceString("stance.ai.permissions", locale))
                    Text(Self.summary(permissions, locale: locale)).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
                }
                .padding(StanceSpacing.lg)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(theme.colors.bgCanvas)
            .navigationTitle(title ?? stanceString("stance.ai.permissions", locale))
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(labels.cancel ?? stanceString("stance.cancel", locale), action: onCancel)
                }
                if let onSave {
                    ToolbarItem(placement: .confirmationAction) {
                        Button(labels.save ?? stanceString("stance.ai.permissions.save", locale)) {
                            StanceHaptics.success()
                            onSave(Self.normalized(permissions))
                        }
                    }
                }
            }
        }
    }

    private func row(_ permission: StancePermission) -> some View {
        let isOn = Binding(
            get: { permission.isRequired || permission.isGranted },
            set: { new in
                if Self.setGranted(new, id: permission.id, in: &permissions) { StanceHaptics.selection() }
            }
        )
        let requiredHint = labels.requiredHint ?? stanceString("stance.ai.permissions.requiredHint", locale)
        return Toggle(isOn: isOn) {
            VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                Text(permission.title).stanceText(.label).foregroundStyle(theme.colors.fgDefault)
                if let description = permission.description {
                    Text(description).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
                }
                if let risk = permission.risk, risk != .low {
                    Text(risk.label(locale: locale)).stanceText(.caption).fontWeight(.semibold).foregroundStyle(risk.tone.foreground(theme))
                }
                if permission.isRequired {
                    Text(labels.required ?? stanceString("stance.ai.permissions.required", locale)).stanceText(.caption).fontWeight(.semibold).foregroundStyle(theme.colors.fgMuted)
                    Text(requiredHint).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
                }
            }
            .multilineTextAlignment(.leading)
        }
        .toggleStyle(.stance)
        .disabled(permission.isRequired)
        .padding(.vertical, StanceSpacing.sm)
        .frame(minHeight: StanceSize.touchTarget)
    }
}

extension StancePermissionSheet {
    /// Creates a permission sheet whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        description: String? = nil,
        permissions: Binding<[StancePermission]>,
        labels: StancePermissionSheetLabels = .init(),
        onSave: (([StancePermission]) -> Void)? = nil,
        onCancel: @escaping () -> Void = {}
    ) {
        self.init(String(localized: titleKey), description: description, permissions: permissions, labels: labels, onSave: onSave, onCancel: onCancel)
    }
}

extension View {
    /// Presents ``StancePermissionSheet`` in a native sheet with medium and large detents.
    ///
    /// Save calls `onSave` with the permissions and closes the sheet. Cancel closes it.
    public func stancePermissionSheet(
        isPresented: Binding<Bool>,
        title: String? = nil,
        description: String? = nil,
        permissions: Binding<[StancePermission]>,
        labels: StancePermissionSheetLabels = .init(),
        onSave: (([StancePermission]) -> Void)? = nil
    ) -> some View {
        modifier(StancePermissionSheetModifier(isPresented: isPresented, title: title, description: description, permissions: permissions, labels: labels, onSave: onSave))
    }
}

private struct StancePermissionSheetModifier: ViewModifier {
    @Binding var isPresented: Bool
    let title: String?
    let description: String?
    @Binding var permissions: [StancePermission]
    let labels: StancePermissionSheetLabels
    let onSave: (([StancePermission]) -> Void)?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.layoutDirection) private var layoutDirection

    func body(content: Content) -> some View {
        content.sheet(isPresented: $isPresented) {
            StancePermissionSheet(title, description: description, permissions: $permissions, labels: labels, onSave: { saved in
                onSave?(saved)
                isPresented = false
            }, onCancel: {
                isPresented = false
            })
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
            .modifier(StancePresentationChrome(theme: theme, locale: locale, layoutDirection: layoutDirection))
        }
    }
}

// MARK: Agent status pill

/// What an agent is doing now, shown by ``StanceAgentStatusPill``.
public enum StanceAgentStatus: String, CaseIterable, Sendable {
    case idle, working, waiting, done, error, paused

    /// The status in words, such as "Working" or "Waiting for you", localised for `locale`.
    public func label(locale: Locale = .current) -> String {
        switch self {
        case .idle: stanceString("stance.ai.agent.idle", locale)
        case .working: stanceString("stance.ai.agent.working", locale)
        case .waiting: stanceString("stance.ai.agent.waiting", locale)
        case .done: stanceString("stance.ai.agent.done", locale)
        case .error: stanceString("stance.ai.agent.error", locale)
        case .paused: stanceString("stance.ai.agent.paused", locale)
        }
    }

    /// Whether a change to this status interrupts VoiceOver. Only waiting for the person does.
    public var isUrgent: Bool { self == .waiting }

    /// The step status drawn for this agent status.
    var step: StanceStepStatus {
        switch self {
        case .idle, .paused: .pending
        case .working: .running
        case .waiting: .waiting
        case .done: .complete
        case .error: .error
        }
    }
}

/// The size of a ``StanceAgentStatusPill``.
public enum StanceAgentStatusPillSize: String, CaseIterable, Sendable {
    case small, medium
}

/// A compact pill showing what an agent is doing now: idle, working, waiting for you, done,
/// failed or paused.
///
/// A status, or a button when an action is given. The status is always in words. A change is
/// announced once: waiting for you interrupts, the rest are polite.
public struct StanceAgentStatusPill: View {
    private let status: StanceAgentStatus
    private let label: String?
    private let detail: String?
    private let size: StanceAgentStatusPillSize
    private let action: (() -> Void)?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - status: What the agent is doing.
    ///   - label: Replaces the status word, for example "Researching".
    ///   - detail: A short second part, such as "Step 2 of 5".
    ///   - size: Small or medium.
    ///   - action: Makes the pill a button, for example to open the run.
    @_disfavoredOverload
    public init(_ status: StanceAgentStatus, label: String? = nil, detail: String? = nil, size: StanceAgentStatusPillSize = .medium, action: (() -> Void)? = nil) {
        self.status = status
        self.label = label
        self.detail = detail
        self.size = size
        self.action = action
    }

    /// The text VoiceOver reads and announces: the label and the detail.
    public nonisolated static func accessibilityText(status: StanceAgentStatus, label: String? = nil, detail: String? = nil, locale: Locale = .current) -> String {
        [label ?? status.label(locale: locale), detail].compactMap { $0 }.joined(separator: ", ")
    }

    public var body: some View {
        Group {
            if let action {
                Button(action: action) { pill }
                    .buttonStyle(.plain)
                    #if os(iOS)
                    .hoverEffect(.highlight)
                    #endif
            } else {
                pill
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Self.accessibilityText(status: status, label: label, detail: detail, locale: locale))
        .accessibilityAddTraits(action == nil ? [] : .isButton)
        .onChange(of: status) { _, new in
            StanceAnnouncer.announce(Self.accessibilityText(status: new, label: label, detail: detail, locale: locale), urgent: new.isUrgent)
        }
    }

    private var pill: some View {
        HStack(spacing: StanceSpacing.s1_5) {
            if status == .paused {
                StanceSymbol("pause.fill", size: StanceSize.iconSm - StanceSpacing.xs).foregroundStyle(theme.colors.fgMuted)
            } else {
                StanceStepStatusMark(status: status.step, size: size == .small ? StanceSize.iconSm - StanceSpacing.xxs : StanceSize.iconSm)
            }
            Text(label ?? status.label(locale: locale)).stanceText(size == .small ? .caption : .label).foregroundStyle(theme.colors.fgDefault).layoutPriority(1)
            if let detail {
                Text(detail).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
            }
        }
        .padding(.horizontal, size == .small ? StanceSpacing.sm : StanceSpacing.md)
        .frame(minHeight: size == .small ? StanceSize.controlXs : StanceSize.controlSm)
        .background(status == .waiting ? theme.colors.warningBg : theme.colors.bgSurface, in: Capsule())
        .overlay { Capsule().strokeBorder(status == .waiting ? theme.colors.warningBorder : status == .error ? theme.colors.dangerBorder : theme.colors.borderDefault, lineWidth: theme.borderWidth) }
        .frame(minHeight: action == nil ? nil : StanceSize.touchTarget)
        .contentShape(Rectangle())
    }
}

extension StanceAgentStatusPill {
    /// Creates a pill whose label is looked up in the app's string tables.
    public init(_ status: StanceAgentStatus, label labelKey: LocalizedStringResource, detail: String? = nil, size: StanceAgentStatusPillSize = .medium, action: (() -> Void)? = nil) {
        self.init(status, label: String(localized: labelKey), detail: detail, size: size, action: action)
    }
}

// MARK: Task queue

/// One task an agent has queued, is running or has finished, shown by ``StanceTaskQueue``.
public struct StanceAgentTask: Identifiable, Equatable, Sendable {
    /// A stable identifier.
    public let id: String
    /// What the task does.
    public var title: String
    /// The state of the task.
    public var status: StanceStepStatus
    /// Whether the person paused the task. Status has no paused value, as on the web: a paused
    /// task keeps its status and offers resume instead of pause.
    public var isPaused: Bool
    /// Progress from 0 to 1, when it can be measured.
    public var progress: Double?
    /// Optional secondary text.
    public var detail: String?
    /// When the task started.
    public var startedAt: Date?

    /// Creates a task.
    public init(id: String, title: String, status: StanceStepStatus = .pending, isPaused: Bool = false, progress: Double? = nil, detail: String? = nil, startedAt: Date? = nil) {
        self.id = id
        self.title = title
        self.status = status
        self.isPaused = isPaused
        self.progress = progress
        self.detail = detail
        self.startedAt = startedAt
    }
}

/// Something that can be done to a task in a ``StanceTaskQueue``.
public enum StanceTaskAction: String, CaseIterable, Sendable {
    case pause, resume, cancel, retry
}

/// How many tasks are in each state.
public struct StanceTaskQueueCounts: Equatable, Sendable {
    /// Tasks in progress.
    public var running: Int
    /// Tasks not started or paused.
    public var queued: Int
    /// Tasks that ended in any way.
    public var finished: Int
}

/// Words a ``StanceTaskQueue`` uses. Leave a value out to keep the localised default.
public struct StanceTaskQueueLabels: Sendable {
    public var pause: (@Sendable (String) -> String)?
    public var resume: (@Sendable (String) -> String)?
    public var cancel: (@Sendable (String) -> String)?
    public var retry: (@Sendable (String) -> String)?
    public var emptyTitle: String?
    public var emptyMessage: String?

    /// - Parameters:
    ///   - pause: The pause button's name, given the task title. Defaults to a localised "Pause title".
    ///   - resume: Defaults to a localised "Resume title".
    ///   - cancel: Defaults to a localised "Cancel title".
    ///   - retry: Defaults to a localised "Retry title".
    ///   - emptyTitle: Shown when there are no tasks. Defaults to a localised "No tasks".
    ///   - emptyMessage: The text under the empty title.
    public init(
        pause: (@Sendable (String) -> String)? = nil,
        resume: (@Sendable (String) -> String)? = nil,
        cancel: (@Sendable (String) -> String)? = nil,
        retry: (@Sendable (String) -> String)? = nil,
        emptyTitle: String? = nil,
        emptyMessage: String? = nil
    ) {
        self.pause = pause
        self.resume = resume
        self.cancel = cancel
        self.retry = retry
        self.emptyTitle = emptyTitle
        self.emptyMessage = emptyMessage
    }
}

/// The tasks an agent has queued, running and finished, with pause, resume, cancel and retry.
///
/// A list with a count summary. Every action button names its task ("Cancel Export report"),
/// and the same actions are offered as VoiceOver actions on the row.
public struct StanceTaskQueue: View {
    private let title: String?
    private let tasks: [StanceAgentTask]
    private let labels: StanceTaskQueueLabels
    private let onSelect: ((StanceAgentTask) -> Void)?
    private let onPause: ((StanceAgentTask) -> Void)?
    private let onResume: ((StanceAgentTask) -> Void)?
    private let onCancel: ((StanceAgentTask) -> Void)?
    private let onRetry: ((StanceAgentTask) -> Void)?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.timeZone) private var timeZone

    /// - Parameters:
    ///   - title: The heading. Defaults to a localised "Tasks".
    ///   - tasks: The tasks, in the order to show them.
    ///   - labels: Replacements for the built in words.
    ///   - onSelect: Opens a task. Without it rows are not buttons.
    ///   - onPause: Pauses a running task.
    ///   - onResume: Resumes a waiting task.
    ///   - onCancel: Cancels a task that has not finished.
    ///   - onRetry: Retries a failed task.
    @_disfavoredOverload
    public init(
        _ title: String? = nil,
        tasks: [StanceAgentTask],
        labels: StanceTaskQueueLabels = .init(),
        onSelect: ((StanceAgentTask) -> Void)? = nil,
        onPause: ((StanceAgentTask) -> Void)? = nil,
        onResume: ((StanceAgentTask) -> Void)? = nil,
        onCancel: ((StanceAgentTask) -> Void)? = nil,
        onRetry: ((StanceAgentTask) -> Void)? = nil
    ) {
        self.title = title
        self.tasks = tasks
        self.labels = labels
        self.onSelect = onSelect
        self.onPause = onPause
        self.onResume = onResume
        self.onCancel = onCancel
        self.onRetry = onRetry
    }

    /// Counts tasks by state: running, queued (pending or waiting) and finished.
    public nonisolated static func counts(_ tasks: [StanceAgentTask]) -> StanceTaskQueueCounts {
        StanceTaskQueueCounts(
            running: tasks.filter { $0.status == .running }.count,
            queued: tasks.filter { $0.status == .pending || $0.status == .waiting }.count,
            finished: tasks.filter(\.status.isFinished).count
        )
    }

    /// The counts in words, for example "1 running, 2 queued, 3 finished".
    public nonisolated static func summary(_ tasks: [StanceAgentTask], locale: Locale = .current) -> String {
        let counts = counts(tasks)
        return stanceString("stance.ai.tasks.summary \(counts.running) \(counts.queued) \(counts.finished)", locale)
    }

    /// The actions a task in `status` can take, in display order.
    public nonisolated static func actions(for status: StanceStepStatus) -> [StanceTaskAction] {
        switch status {
        case .running: [.pause, .cancel]
        case .waiting: [.resume, .cancel]
        case .pending: [.cancel]
        case .error: [.retry]
        case .complete, .skipped: []
        }
    }

    /// The actions a task can take, in display order. A paused task that has not finished
    /// offers resume and cancel.
    public nonisolated static func actions(for task: StanceAgentTask) -> [StanceTaskAction] {
        guard task.isPaused, !task.status.isFinished, task.status != .error else { return actions(for: task.status) }
        return [.resume, .cancel]
    }

    private func handler(_ action: StanceTaskAction) -> ((StanceAgentTask) -> Void)? {
        switch action {
        case .pause: onPause
        case .resume: onResume
        case .cancel: onCancel
        case .retry: onRetry
        }
    }

    private func name(_ action: StanceTaskAction, _ task: StanceAgentTask) -> String {
        switch action {
        case .pause: labels.pause?(task.title) ?? stanceString("stance.ai.tasks.pause \(task.title)", locale)
        case .resume: labels.resume?(task.title) ?? stanceString("stance.ai.tasks.resume \(task.title)", locale)
        case .cancel: labels.cancel?(task.title) ?? stanceString("stance.ai.tasks.cancel \(task.title)", locale)
        case .retry: labels.retry?(task.title) ?? stanceString("stance.ai.tasks.retry \(task.title)", locale)
        }
    }

    private func symbol(_ action: StanceTaskAction) -> String {
        switch action {
        case .pause: "pause.fill"
        case .resume: "play.fill"
        case .cancel: "xmark"
        case .retry: "arrow.clockwise"
        }
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                Text(title ?? stanceString("stance.ai.tasks", locale)).stanceText(.subheading).accessibilityAddTraits(.isHeader)
                if !tasks.isEmpty {
                    Text(Self.summary(tasks, locale: locale)).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
                }
            }
            if tasks.isEmpty {
                StanceEmptyState(
                    icon: .list,
                    title: labels.emptyTitle ?? stanceString("stance.ai.tasks.emptyTitle", locale),
                    message: labels.emptyMessage ?? stanceString("stance.ai.tasks.emptyMessage", locale)
                )
            } else {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(tasks.enumerated()), id: \.element.id) { index, task in
                        if index > 0 { StanceDivider() }
                        row(task)
                    }
                }
            }
        }
        .stanceCard()
    }

    private func row(_ task: StanceAgentTask) -> some View {
        let actions = Self.actions(for: task).filter { handler($0) != nil }
        return HStack(alignment: .center, spacing: StanceSpacing.xs) {
            Group {
                if let onSelect {
                    Button { onSelect(task) } label: { summary(task) }.buttonStyle(.plain)
                } else {
                    summary(task)
                }
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(task.status.accessibilityName(for: task.title, locale: locale))
            .accessibilityValue(value(task))
            .accessibilityAddTraits(onSelect == nil ? [] : .isButton)
            .accessibilityActions {
                ForEach(actions, id: \.self) { action in
                    Button(name(action, task)) { handler(action)?(task) }
                }
            }
            ForEach(actions, id: \.self) { action in
                StanceQuietIconButton(symbol: symbol(action), label: name(action, task)) {
                    StanceHaptics.selection()
                    handler(action)?(task)
                }
            }
        }
        .modifier(StanceStepStatusAnnouncer(title: task.title, status: task.status))
    }

    private func value(_ task: StanceAgentTask) -> String {
        var parts: [String] = []
        if let progress = task.progress, task.status == .running { parts.append(min(max(progress, 0), 1).formatted(.percent.precision(.fractionLength(0)).locale(locale))) }
        if let detail = task.detail { parts.append(detail) }
        return parts.joined(separator: ", ")
    }

    private func summary(_ task: StanceAgentTask) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.sm) {
            StanceStepStatusMark(status: task.status)
            VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                Text(task.title).stanceText(.label).foregroundStyle(theme.colors.fgDefault).multilineTextAlignment(.leading)
                Text(meta(task)).stanceText(.caption).foregroundStyle(theme.colors.fgMuted).multilineTextAlignment(.leading)
                if let progress = task.progress, task.status == .running {
                    ProgressView(value: min(max(progress, 0), 1)).tint(theme.colors.accentBg)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, StanceSpacing.sm)
        .frame(minHeight: StanceSize.touchTarget)
        .contentShape(Rectangle())
    }

    private func meta(_ task: StanceAgentTask) -> String {
        var parts = [task.status.label(locale: locale)]
        if let detail = task.detail { parts.append(detail) }
        if let startedAt = task.startedAt {
            var style = Date.FormatStyle(date: .omitted, time: .shortened, locale: locale)
            style.timeZone = timeZone
            parts.append(stanceString("stance.ai.tasks.started \(startedAt.formatted(style))", locale))
        }
        return stanceAgentsJoin(parts, locale)
    }
}

extension StanceTaskQueue {
    /// Creates a task queue whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        tasks: [StanceAgentTask],
        labels: StanceTaskQueueLabels = .init(),
        onSelect: ((StanceAgentTask) -> Void)? = nil,
        onPause: ((StanceAgentTask) -> Void)? = nil,
        onResume: ((StanceAgentTask) -> Void)? = nil,
        onCancel: ((StanceAgentTask) -> Void)? = nil,
        onRetry: ((StanceAgentTask) -> Void)? = nil
    ) {
        self.init(String(localized: titleKey), tasks: tasks, labels: labels, onSelect: onSelect, onPause: onPause, onResume: onResume, onCancel: onCancel, onRetry: onRetry)
    }
}

// MARK: Subagent tree

/// An agent in a ``StanceSubagentTree``, with the agents it has delegated to.
public struct StanceSubagent: Identifiable, Equatable, Sendable {
    /// A stable identifier, unique in the tree.
    public let id: String
    /// The agent's name.
    public var name: String
    /// What the agent is doing.
    public var status: StanceStepStatus
    /// One line about its work.
    public var summary: String?
    /// The agents it has delegated to.
    public var children: [StanceSubagent]

    /// Creates an agent.
    public init(id: String, name: String, status: StanceStepStatus = .pending, summary: String? = nil, children: [StanceSubagent] = []) {
        self.id = id
        self.name = name
        self.status = status
        self.summary = summary
        self.children = children
    }
}

/// A tree of an agent and the agents it has delegated to, each with its status and a one line
/// summary.
///
/// Built on ``StanceTreeView``, so rows tell VoiceOver their level, position and expanded state.
/// The status is part of each row's name, in words.
public struct StanceSubagentTree: View {
    private let title: String?
    private let nodes: [StanceSubagent]
    private let height: CGFloat?
    @Binding private var expanded: Set<String>
    @Binding private var selection: String?
    @Environment(\.locale) private var locale
    /// A row with a name and a status line: the 44pt target plus the two lines of text.
    @ScaledMetric(relativeTo: .body) private var rowHeight: CGFloat = StanceSize.touchTarget + StanceSpacing.lg

    /// - Parameters:
    ///   - title: The accessible name of the tree. Defaults to a localised "Agents".
    ///   - nodes: The top level agents.
    ///   - expanded: The identifiers of expanded agents.
    ///   - selection: The selected agent, if any.
    ///   - height: A fixed height. By default the tree is as tall as its visible rows.
    @_disfavoredOverload
    public init(_ title: String? = nil, nodes: [StanceSubagent], expanded: Binding<Set<String>>, selection: Binding<String?> = .constant(nil), height: CGFloat? = nil) {
        self.title = title
        self.nodes = nodes
        _expanded = expanded
        _selection = selection
        self.height = height
    }

    /// The second line of a row: the status, then the summary when there is one.
    public nonisolated static func subtitle(for agent: StanceSubagent, locale: Locale = .current) -> String {
        let status = agent.status.label(locale: locale)
        guard let summary = agent.summary, !summary.isEmpty else { return status }
        return stanceString("stance.ai.subagents.subtitle \(status) \(summary)", locale)
    }

    /// Maps agents onto ``StanceTreeNode`` values. An agent with no children is a leaf.
    public nonisolated static func treeNodes(_ agents: [StanceSubagent], locale: Locale = .current) -> [StanceTreeNode<String>] {
        agents.map { agent in
            StanceTreeNode(
                id: agent.id,
                title: agent.name,
                subtitle: subtitle(for: agent, locale: locale),
                icon: agent.status.icon,
                children: agent.children.isEmpty ? nil : treeNodes(agent.children, locale: locale)
            )
        }
    }

    /// The identifiers of every agent that has delegated, for expanding the whole tree.
    public nonisolated static func allBranches(_ agents: [StanceSubagent]) -> Set<String> {
        StanceTreeState.allBranches(treeNodes(agents))
    }

    public var body: some View {
        let tree = Self.treeNodes(nodes, locale: locale)
        let rows = StanceTreeState.visibleRows(tree, expanded: expanded).count
        StanceTreeView(title ?? stanceString("stance.ai.subagents", locale), nodes: tree, expanded: $expanded, selection: $selection)
            // No list margins above and below, so the height is just the rows.
            .contentMargins(.vertical, StanceSpacing.none, for: .scrollContent)
            .frame(height: height ?? CGFloat(rows) * rowHeight)
            .clipShape(RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
    }
}

extension StanceSubagentTree {
    /// Creates a tree whose accessible name is looked up in the app's string tables.
    public init(_ titleKey: LocalizedStringResource, nodes: [StanceSubagent], expanded: Binding<Set<String>>, selection: Binding<String?> = .constant(nil), height: CGFloat? = nil) {
        self.init(String(localized: titleKey), nodes: nodes, expanded: expanded, selection: selection, height: height)
    }
}
