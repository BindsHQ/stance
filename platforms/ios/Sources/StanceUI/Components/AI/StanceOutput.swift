import SwiftUI

// Output components (wave two): what the assistant made, shown so it can be read, checked,
// copied and exported. All are presentational: data and status are passed in, and nothing is
// loaded from the network. ``StanceMarkdownRenderer`` lives in StanceOutputMarkdown.swift.

// MARK: Code suggestion

/// Words a ``StanceCodeSuggestion`` uses. Leave a value out to keep the localised default.
public struct StanceCodeSuggestionLabels: Sendable {
    public var apply: String?
    public var applied: String?
    public var run: String?
    public var output: String?

    /// - Parameters:
    ///   - apply: The apply button. Defaults to a localised "Apply".
    ///   - applied: The applied state and its announcement. Defaults to a localised "Applied".
    ///   - run: The run button. Defaults to a localised "Run".
    ///   - output: The heading of the run output. Defaults to a localised "Output".
    public init(apply: String? = nil, applied: String? = nil, run: String? = nil, output: String? = nil) {
        self.apply = apply
        self.applied = applied
        self.run = run
        self.output = output
    }
}

/// Generated code with its language and file name, and actions to copy, apply and run it,
/// followed by the result of a run.
///
/// Built on ``StanceCodeBlock``, so highlighting, copying and left to right layout come from
/// there. Applying confirms with a haptic and an announcement when `isApplied` turns on. The run
/// result is stated in words and announced once when the run status changes.
public struct StanceCodeSuggestion: View {
    private let code: String
    private let language: String?
    private let filename: String?
    private let isApplied: Bool
    private let runStatus: StanceStepStatus?
    private let runOutput: String?
    private let wraps: Bool
    private let showsLineNumbers: Bool
    private let isStreaming: Bool
    private let labels: StanceCodeSuggestionLabels
    private let onCopy: ((String) -> Void)?
    private let onApply: (() -> Void)?
    private let onRun: (() -> Void)?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - code: The source text, shown exactly as given.
    ///   - language: The language to highlight, also shown as the title when there is no file name.
    ///   - filename: The file the code belongs to.
    ///   - isApplied: Whether the code has been applied. Apply is then replaced by a confirmation.
    ///   - runStatus: The state of the last run, or `nil` when the code has not been run.
    ///   - runOutput: What the run printed.
    ///   - wraps: Wraps long lines instead of scrolling sideways.
    ///   - showsLineNumbers: Shows a line number gutter.
    ///   - isStreaming: Whether the code is still arriving. Apply and run wait until it is complete.
    ///   - labels: Replacements for the built in words.
    ///   - onCopy: Called after copying, with the code.
    ///   - onApply: Applies the code. Leave out to hide the button.
    ///   - onRun: Runs the code. Leave out to hide the button.
    public init(
        _ code: String,
        language: String? = nil,
        filename: String? = nil,
        isApplied: Bool = false,
        runStatus: StanceStepStatus? = nil,
        runOutput: String? = nil,
        wraps: Bool = false,
        showsLineNumbers: Bool = false,
        isStreaming: Bool = false,
        labels: StanceCodeSuggestionLabels = .init(),
        onCopy: ((String) -> Void)? = nil,
        onApply: (() -> Void)? = nil,
        onRun: (() -> Void)? = nil
    ) {
        self.code = code
        self.language = language
        self.filename = filename
        self.isApplied = isApplied
        self.runStatus = runStatus
        self.runOutput = runOutput
        self.wraps = wraps
        self.showsLineNumbers = showsLineNumbers
        self.isStreaming = isStreaming
        self.labels = labels
        self.onCopy = onCopy
        self.onApply = onApply
        self.onRun = onRun
    }

    /// The run result in words, such as "Run finished" or "Run failed", localised for `locale`.
    public nonisolated static func runSummary(_ status: StanceStepStatus, locale: Locale = .current) -> String {
        switch status {
        case .pending: stanceString("stance.ai.codeSuggestion.run.pending", locale)
        case .running: stanceString("stance.ai.codeSuggestion.run.running", locale)
        case .complete: stanceString("stance.ai.codeSuggestion.run.complete", locale)
        case .error: stanceString("stance.ai.codeSuggestion.run.error", locale)
        case .skipped: stanceString("stance.ai.codeSuggestion.run.skipped", locale)
        case .waiting: stanceString("stance.ai.codeSuggestion.run.waiting", locale)
        }
    }

    private var appliedLabel: String { labels.applied ?? stanceString("stance.ai.codeSuggestion.applied", locale) }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            StanceCodeBlock(code, language: language, title: filename ?? language, showsLineNumbers: showsLineNumbers, wraps: wraps, onCopy: onCopy)
            if onApply != nil || onRun != nil {
                StanceFlowLayout(spacing: StanceSpacing.sm, lineSpacing: StanceSpacing.xs) {
                    if let onApply {
                        if isApplied {
                            HStack(spacing: StanceSpacing.xs) {
                                StanceIcon(.check, size: StanceSize.iconSm)
                                Text(appliedLabel).stanceText(.label)
                            }
                            .foregroundStyle(theme.colors.successFg)
                            .frame(minHeight: StanceSize.touchTarget)
                            .accessibilityElement(children: .combine)
                        } else {
                            StanceButton(labels.apply ?? stanceString("stance.ai.codeSuggestion.apply", locale), variant: .outline, size: .small, leadingIcon: .check) {
                                StanceHaptics.success()
                                onApply()
                            }
                            .disabled(isStreaming)
                        }
                    }
                    if let onRun {
                        StanceButton(labels.run ?? stanceString("stance.ai.codeSuggestion.run", locale), variant: .ghost, size: .small, leadingIcon: .terminal, isLoading: runStatus == .running, action: onRun)
                            .disabled(isStreaming || runStatus == .running)
                    }
                }
            }
            if let runStatus { runResult(runStatus) }
        }
        .onChange(of: isApplied) { _, applied in
            if applied { StanceAnnouncer.announce(appliedLabel) }
        }
        .onChange(of: runStatus) { _, new in
            guard let new, new != .pending else { return }
            StanceAnnouncer.announce(Self.runSummary(new, locale: locale), urgent: new == .error)
        }
    }

    private func runResult(_ status: StanceStepStatus) -> some View {
        VStack(alignment: .leading, spacing: StanceSpacing.xs) {
            HStack(spacing: StanceSpacing.sm) {
                StanceStepStatusMark(status: status)
                Text(Self.runSummary(status, locale: locale)).stanceText(.label)
            }
            .accessibilityElement(children: .combine)
            if let runOutput, !runOutput.isEmpty {
                Text(verbatim: runOutput)
                    .stanceText(.mono)
                    .foregroundStyle(status == .error ? theme.colors.dangerFg : theme.colors.fgMuted)
                    .textSelection(.enabled)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .environment(\.layoutDirection, .leftToRight)
                    .accessibilityLabel("\(labels.output ?? stanceString("stance.ai.codeSuggestion.output", locale)): \(runOutput)")
            }
        }
        .padding(StanceSpacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .stanceSurface(.subtle, cornerRadius: StanceRadius.lg)
    }
}

// MARK: Artifact panel

/// One saved version of an artifact, for the version switcher of a ``StanceArtifactPanel``.
public struct StanceArtifactVersion: Identifiable, Hashable, Sendable {
    public let id: String
    public let label: String

    /// - Parameters:
    ///   - id: A stable identifier.
    ///   - label: The name shown in the switcher, such as "Version 2".
    public init(id: String, label: String) {
        self.id = id
        self.label = label
    }
}

/// What a ``StanceArtifactPanel`` is showing.
public enum StanceArtifactView: String, CaseIterable, Sendable {
    /// The rendered document, page or app.
    case preview
    /// Its source.
    case code
}

/// Words a ``StanceArtifactPanel`` uses. Leave a value out to keep the localised default.
public struct StanceArtifactPanelLabels: Sendable {
    public var preview: String?
    public var code: String?
    public var version: String?
    public var view: String?
    public var close: String?

    /// - Parameters:
    ///   - preview: The preview segment. Defaults to a localised "Preview".
    ///   - code: The code segment. Defaults to a localised "Code".
    ///   - version: The accessible name of the version switcher. Defaults to a localised "Version".
    ///   - view: The accessible name of the preview or code switch. Defaults to a localised "View".
    ///   - close: The close button. Defaults to a localised "Close".
    public init(preview: String? = nil, code: String? = nil, version: String? = nil, view: String? = nil, close: String? = nil) {
        self.preview = preview
        self.code = code
        self.version = version
        self.view = view
        self.close = close
    }
}

/// The panel for a generated document, page or app: a title, a version switcher, a preview or
/// code switch, actions and the content.
///
/// The switches are system pickers: a menu `Picker` for versions and a segmented `Picker` for
/// preview and code. Present it with `.stanceArtifactPanel(isPresented:panel:)`, which is the
/// system inspector: a trailing column in regular width and a sheet with detents in compact
/// width, where the system returns focus to the opener when it closes.
public struct StanceArtifactPanel<Preview: View, Code: View, Actions: View>: View {
    private let title: String
    private let kind: String?
    private let versions: [StanceArtifactVersion]
    private let status: StanceGenerationStatus
    private let labels: StanceArtifactPanelLabels
    private let onClose: (() -> Void)?
    private let preview: Preview
    private let code: Code
    private let actions: Actions
    @Binding private var versionID: String
    @Binding private var view: StanceArtifactView
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - title: The name of the artifact, and the accessible name of the panel.
    ///   - kind: What it is, such as "Document" or "Web page".
    ///   - versions: Saved versions. The switcher shows when there is more than one.
    ///   - versionID: The selected version.
    ///   - view: Preview or code. The switch shows when `code` is not empty.
    ///   - status: The generation status. While active, the header says so.
    ///   - labels: Replacements for the built in words.
    ///   - onClose: Closes the panel. Leave out to hide the close button.
    ///   - preview: The rendered artifact.
    ///   - code: Its source, usually a ``StanceCodeBlock``.
    ///   - actions: Buttons shown beside the switches, such as copy or download.
    @_disfavoredOverload
    public init(
        _ title: String,
        kind: String? = nil,
        versions: [StanceArtifactVersion] = [],
        versionID: Binding<String> = .constant(""),
        view: Binding<StanceArtifactView> = .constant(.preview),
        status: StanceGenerationStatus = .complete,
        labels: StanceArtifactPanelLabels = .init(),
        onClose: (() -> Void)? = nil,
        @ViewBuilder preview: () -> Preview,
        @ViewBuilder code: () -> Code = { EmptyView() },
        @ViewBuilder actions: () -> Actions = { EmptyView() }
    ) {
        self.title = title
        self.kind = kind
        self.versions = versions
        _versionID = versionID
        _view = view
        self.status = status
        self.labels = labels
        self.onClose = onClose
        self.preview = preview()
        self.code = code()
        self.actions = actions()
    }

    private var hasCode: Bool { Code.self != EmptyView.self }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                HStack(alignment: .top, spacing: StanceSpacing.sm) {
                    VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                        Text(title).stanceText(.subheading).accessibilityAddTraits(.isHeader)
                        if let detail = [kind, status.accessibilityDescription(locale: locale)].compactMap({ $0 }).joined(separator: ", ").nonEmpty {
                            HStack(spacing: StanceSpacing.xs) {
                                if status.isActive { ProgressView().controlSize(.mini).accessibilityHidden(true) }
                                Text(detail).stanceText(.caption).foregroundStyle(status == .error ? theme.colors.dangerFg : theme.colors.fgMuted)
                            }
                            .accessibilityElement(children: .combine)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    if let onClose {
                        StanceQuietIconButton(symbol: "xmark", label: labels.close ?? stanceString("stance.close", locale), action: onClose)
                            .padding(.trailing, -StanceSpacing.sm)
                    }
                }
                if versions.count > 1 || hasCode || Actions.self != EmptyView.self {
                    StanceFlowLayout(spacing: StanceSpacing.sm, lineSpacing: StanceSpacing.xs) {
                        if hasCode {
                            Picker(labels.view ?? stanceString("stance.ai.artifact.view", locale), selection: $view) {
                                Text(labels.preview ?? stanceString("stance.ai.artifact.preview", locale)).tag(StanceArtifactView.preview)
                                Text(labels.code ?? stanceString("stance.ai.artifact.code", locale)).tag(StanceArtifactView.code)
                            }
                            .pickerStyle(.segmented)
            .labelsHidden()
                            .fixedSize()
                            .frame(minHeight: StanceSize.touchTarget)
                        }
                        if versions.count > 1 {
                            Picker(labels.version ?? stanceString("stance.ai.artifact.version", locale), selection: $versionID) {
                                ForEach(versions) { Text($0.label).tag($0.id) }
                            }
                            .pickerStyle(.menu)
                            .tint(theme.colors.fgDefault)
                            .frame(minHeight: StanceSize.touchTarget)
                        }
                        actions
                    }
                }
            }
            .padding(.horizontal, StanceSpacing.lg)
            .padding(.vertical, StanceSpacing.md)
            StanceDivider()
            Group {
                if hasCode, view == .code { code } else { preview }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .background(theme.colors.bgSurface)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(title)
    }
}

extension StanceArtifactPanel {
    /// Creates a panel whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        kind: String? = nil,
        versions: [StanceArtifactVersion] = [],
        versionID: Binding<String> = .constant(""),
        view: Binding<StanceArtifactView> = .constant(.preview),
        status: StanceGenerationStatus = .complete,
        labels: StanceArtifactPanelLabels = .init(),
        onClose: (() -> Void)? = nil,
        @ViewBuilder preview: () -> Preview,
        @ViewBuilder code: () -> Code = { EmptyView() },
        @ViewBuilder actions: () -> Actions = { EmptyView() }
    ) {
        self.init(String(localized: titleKey), kind: kind, versions: versions, versionID: versionID, view: view, status: status, labels: labels, onClose: onClose, preview: preview, code: code, actions: actions)
    }
}

extension View {
    /// Presents a ``StanceArtifactPanel`` beside this view with the system inspector: a trailing
    /// column in regular width, and a sheet with medium and large detents in compact width.
    public func stanceArtifactPanel<Panel: View>(isPresented: Binding<Bool>, @ViewBuilder panel: @escaping () -> Panel) -> some View {
        modifier(StanceOutputInspector(isPresented: isPresented, panel: panel))
    }
}

private struct StanceOutputInspector<Panel: View>: ViewModifier {
    @Binding var isPresented: Bool
    @ViewBuilder let panel: () -> Panel
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.layoutDirection) private var layoutDirection

    func body(content: Content) -> some View {
        content.inspector(isPresented: $isPresented) {
            panel()
                .inspectorColumnWidth(min: StanceSize.readableWidth / 2, ideal: StanceSize.readableWidth * 3 / 4, max: StanceSize.readableWidth)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
                .modifier(StancePresentationChrome(theme: theme, locale: locale, layoutDirection: layoutDirection))
        }
    }
}

private extension String {
    var nonEmpty: String? { isEmpty ? nil : self }
}

// MARK: Generated image

/// One alternative of a ``StanceGeneratedImage``.
public struct StanceImageVariation: Identifiable {
    public let id: String
    public let image: Image
    /// Describes the picture for people who cannot see it.
    public let alt: String

    /// - Parameters:
    ///   - id: A stable identifier.
    ///   - image: The picture, supplied by the app.
    ///   - alt: The text alternative.
    public init(id: String, image: Image, alt: String) {
        self.id = id
        self.image = image
        self.alt = alt
    }
}

/// Words a ``StanceGeneratedImage`` uses. Leave a value out to keep the localised default.
public struct StanceGeneratedImageLabels: Sendable {
    public var generating: String?
    public var failed: String?
    public var variations: String?
    public var share: String?
    public var download: String?
    public var regenerate: String?
    public var edit: String?

    /// - Parameters:
    ///   - generating: The progress label. Defaults to a localised "Generating image".
    ///   - failed: Shown when generation failed. Defaults to a localised "The image could not be generated".
    ///   - variations: The accessible name of the variations. Defaults to a localised "Variations".
    ///   - share: The share button. Defaults to a localised "Share".
    ///   - download: The download button. Defaults to a localised "Download".
    ///   - regenerate: The regenerate button. Defaults to a localised "Regenerate".
    ///   - edit: The edit button. Defaults to a localised "Edit".
    public init(generating: String? = nil, failed: String? = nil, variations: String? = nil, share: String? = nil, download: String? = nil, regenerate: String? = nil, edit: String? = nil) {
        self.generating = generating
        self.failed = failed
        self.variations = variations
        self.share = share
        self.download = download
        self.regenerate = regenerate
        self.edit = edit
    }
}

/// A generated image with a loading state, variations, and actions to export, regenerate and
/// edit it.
///
/// The picture is a SwiftUI `Image` your app supplies; nothing is downloaded. Alt text is
/// required. While generating, the frame holds its aspect ratio and shows the system
/// `ProgressView`, so nothing moves when the picture arrives. Export is the system `ShareLink`
/// unless you pass `onDownload`.
public struct StanceGeneratedImage: View {
    private let image: Image?
    private let alt: String
    private let status: StanceGenerationStatus
    private let progress: Double?
    private let aspectRatio: CGFloat
    private let variations: [StanceImageVariation]
    private let prompt: String?
    private let labels: StanceGeneratedImageLabels
    private let onDownload: (() -> Void)?
    private let onRegenerate: (() -> Void)?
    private let onEdit: (() -> Void)?
    @Binding private var selection: String?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @ScaledMetric(relativeTo: .body) private var thumbnail: CGFloat = StanceSize.controlLg

    /// - Parameters:
    ///   - image: The picture, or `nil` while there is none yet.
    ///   - alt: Describes the picture for people who cannot see it. Required.
    ///   - status: The generation status. The progress state shows while it is active.
    ///   - progress: Progress from 0 to 1, or `nil` when it is not known.
    ///   - aspectRatio: Width divided by height. The frame keeps it while loading.
    ///   - variations: Alternatives to choose from.
    ///   - selection: The identifier of the chosen variation.
    ///   - prompt: The prompt the image was made from, shown under it.
    ///   - labels: Replacements for the built in words.
    ///   - onDownload: Saves the image. Without it, export is the system share sheet.
    ///   - onRegenerate: Makes a new image. Leave out to hide the button.
    ///   - onEdit: Edits the image. Leave out to hide the button.
    public init(
        _ image: Image?,
        alt: String,
        status: StanceGenerationStatus = .complete,
        progress: Double? = nil,
        aspectRatio: CGFloat = 1,
        variations: [StanceImageVariation] = [],
        selection: Binding<String?> = .constant(nil),
        prompt: String? = nil,
        labels: StanceGeneratedImageLabels = .init(),
        onDownload: (() -> Void)? = nil,
        onRegenerate: (() -> Void)? = nil,
        onEdit: (() -> Void)? = nil
    ) {
        self.image = image
        self.alt = alt
        self.status = status
        self.progress = progress
        self.aspectRatio = aspectRatio
        self.variations = variations
        _selection = selection
        self.prompt = prompt
        self.labels = labels
        self.onDownload = onDownload
        self.onRegenerate = onRegenerate
        self.onEdit = onEdit
    }

    /// Progress kept between 0 and 1, or `nil` when it is not known.
    public nonisolated static func clampedProgress(_ progress: Double?) -> Double? {
        progress.map { min(max($0, 0), 1) }
    }

    private var chosen: StanceImageVariation? { variations.first { $0.id == selection } }
    private var shown: (image: Image, alt: String)? {
        if let chosen { return (chosen.image, chosen.alt) }
        return image.map { ($0, alt) }
    }

    public var body: some View {
        let shape = RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous)
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            Color.clear
                .aspectRatio(max(aspectRatio, .leastNonzeroMagnitude), contentMode: .fit)
                .frame(maxWidth: .infinity)
                .overlay { canvas }
                .background(theme.colors.bgMuted)
                .clipShape(shape)
                .overlay { shape.strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
            if variations.count > 1, !status.isActive { variationStrip }
            if let prompt {
                Text(prompt).stanceText(.caption).foregroundStyle(theme.colors.fgMuted).fixedSize(horizontal: false, vertical: true)
            }
            if !status.isActive, shown != nil || onRegenerate != nil { actions }
        }
    }

    @ViewBuilder private var canvas: some View {
        if status.isActive || (shown == nil && status != .error) {
            let label = labels.generating ?? stanceString("stance.ai.image.generating", locale)
            Group {
                if let value = Self.clampedProgress(progress) {
                    ProgressView(value: value) { Text(label).stanceText(.label) }
                } else {
                    ProgressView { Text(label).stanceText(.label) }
                }
            }
            .tint(theme.colors.accentBg)
            .foregroundStyle(theme.colors.fgMuted)
            .padding(StanceSpacing.lg)
        } else if let shown {
            shown.image
                .resizable()
                .scaledToFill()
                .accessibilityLabel(shown.alt)
                .accessibilityAddTraits(.isImage)
        } else {
            VStack(spacing: StanceSpacing.sm) {
                StanceIcon(.alertCircle, size: StanceSize.iconLg)
                Text(labels.failed ?? stanceString("stance.ai.image.failed", locale)).stanceText(.label).multilineTextAlignment(.center)
            }
            .foregroundStyle(theme.colors.dangerFg)
            .padding(StanceSpacing.lg)
            .accessibilityElement(children: .combine)
        }
    }

    private var variationStrip: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: StanceSpacing.sm) {
                ForEach(Array(variations.enumerated()), id: \.element.id) { index, variation in
                    let isSelected = variation.id == selection
                    let shape = RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous)
                    Button {
                        selection = variation.id
                        StanceHaptics.selection()
                    } label: {
                        variation.image
                            .resizable()
                            .scaledToFill()
                            .frame(width: thumbnail, height: thumbnail)
                            .clipShape(shape)
                            .overlay { shape.strokeBorder(isSelected ? theme.colors.accentBg : theme.colors.borderDefault, lineWidth: isSelected ? theme.focusWidth : theme.borderWidth) }
                            .overlay(alignment: .bottomTrailing) {
                                // Selection is a tick as well as a border, never colour alone.
                                if isSelected {
                                    StanceIcon(.check, size: StanceSize.iconSm - StanceSpacing.xs)
                                        .foregroundStyle(theme.colors.accentFg)
                                        .padding(StanceSpacing.xxs)
                                        .background(theme.colors.accentBg, in: Circle())
                                        .padding(StanceSpacing.xs)
                                }
                            }
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(variation.alt)
                    .accessibilityValue(stanceString("stance.ai.image.variation \(index + 1) \(variations.count)", locale))
                    .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(labels.variations ?? stanceString("stance.ai.image.variations", locale))
    }

    private var actions: some View {
        StanceFlowLayout(spacing: StanceSpacing.sm, lineSpacing: StanceSpacing.xs) {
            if let shown {
                if let onDownload {
                    StanceButton(labels.download ?? stanceString("stance.ai.image.download", locale), variant: .outline, size: .small, leadingIcon: .download, action: onDownload)
                } else {
                    ShareLink(item: shown.image, preview: SharePreview(shown.alt, image: shown.image)) {
                        HStack(spacing: StanceSpacing.xs) {
                            StanceIcon(.upload, size: StanceSize.iconSm)
                            Text(labels.share ?? stanceString("stance.ai.image.share", locale))
                        }
                    }
                    .buttonStyle(.stance(.outline, size: .small))
                }
            }
            if let onRegenerate {
                StanceButton(labels.regenerate ?? stanceString("stance.ai.image.regenerate", locale), variant: .ghost, size: .small, leadingIcon: .refresh, action: onRegenerate)
            }
            if let onEdit, shown != nil {
                StanceButton(labels.edit ?? stanceString("stance.ai.image.edit", locale), variant: .ghost, size: .small, leadingIcon: .pencil, action: onEdit)
            }
        }
    }
}

// MARK: Generated table

/// One column of a ``StanceGeneratedTable``.
public struct StanceGeneratedTableColumn: Identifiable, Hashable, Sendable {
    public let id: String
    public let header: String
    /// Numeric columns align to the trailing edge and sort by value, not by spelling.
    public let isNumeric: Bool

    /// - Parameters:
    ///   - id: The key of this column in each row.
    ///   - header: The column heading.
    ///   - isNumeric: Whether the values are numbers.
    public init(id: String, header: String, isNumeric: Bool = false) {
        self.id = id
        self.header = header
        self.isNumeric = isNumeric
    }
}

/// One row of a ``StanceGeneratedTable``: text by column identifier.
public struct StanceGeneratedTableRow: Identifiable, Hashable, Sendable {
    public let id: String
    public let values: [String: String]

    /// - Parameters:
    ///   - id: A stable identifier, so rows keep their place while more arrive.
    ///   - values: The cell text for each column identifier.
    public init(id: String, _ values: [String: String]) {
        self.id = id
        self.values = values
    }

    /// The text in a column, or an empty string when the row has none.
    public subscript(column: String) -> String { values[column] ?? "" }
}

/// Words a ``StanceGeneratedTable`` uses. Leave a value out to keep the localised default.
public struct StanceGeneratedTableLabels: Sendable {
    public var copy: String?
    public var export: String?
    public var expand: String?
    public var showAll: String?
    public var showFewer: String?
    public var streaming: String?

    /// - Parameters:
    ///   - copy: The copy button. Defaults to a localised "Copy as CSV".
    ///   - export: The export button. Defaults to a localised "Export".
    ///   - expand: The expand button. Defaults to a localised "Expand".
    ///   - showAll: Shows the rows past the cap. Defaults to a localised "Show all rows".
    ///   - showFewer: Returns to the cap. Defaults to a localised "Show fewer rows".
    ///   - streaming: Shown while rows are arriving. Defaults to a localised "Adding rows".
    public init(copy: String? = nil, export: String? = nil, expand: String? = nil, showAll: String? = nil, showFewer: String? = nil, streaming: String? = nil) {
        self.copy = copy
        self.export = export
        self.expand = expand
        self.showAll = showAll
        self.showFewer = showFewer
        self.streaming = streaming
    }
}

/// A table the assistant produced, with a caption, sortable columns, a row cap, copy as CSV and
/// callbacks to export or expand it.
///
/// Built on ``StanceDataTable``: a real table in regular width and labelled cards in compact
/// width, both with sorting. The table scrolls inside a fixed height so it can sit in a message.
/// Rows that arrive while streaming are not announced one by one; the header only says that
/// rows are being added.
public struct StanceGeneratedTable: View {
    private let caption: String?
    private let columns: [StanceGeneratedTableColumn]
    private let rows: [StanceGeneratedTableRow]
    private let isStreaming: Bool
    private let maxRows: Int?
    private let height: CGFloat
    private let labels: StanceGeneratedTableLabels
    private let onCopy: ((String) -> Void)?
    private let onExport: (() -> Void)?
    private let onExpand: (() -> Void)?
    @State private var sort: StanceTableSort?
    @State private var showsAll = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @ScaledMetric(relativeTo: .body) private var scale: CGFloat = 1

    /// - Parameters:
    ///   - caption: Says what the table shows. Also its accessible name.
    ///   - columns: The columns, in order.
    ///   - rows: The rows, in the order the assistant gave them.
    ///   - isStreaming: Whether rows are still arriving.
    ///   - maxRows: Shows at most this many rows until the reader asks for all of them.
    ///   - height: The height of the table at the default text size. It grows with Dynamic Type.
    ///   - labels: Replacements for the built in words.
    ///   - onCopy: Called after the table is copied as CSV, with the CSV text.
    ///   - onExport: Exports the table. Leave out to hide the button.
    ///   - onExpand: Opens the table in a full view. Leave out to hide the button.
    public init(
        _ caption: String? = nil,
        columns: [StanceGeneratedTableColumn],
        rows: [StanceGeneratedTableRow],
        isStreaming: Bool = false,
        maxRows: Int? = nil,
        height: CGFloat = StanceSize.controlLg * 6,
        labels: StanceGeneratedTableLabels = .init(),
        onCopy: ((String) -> Void)? = nil,
        onExport: (() -> Void)? = nil,
        onExpand: (() -> Void)? = nil
    ) {
        self.caption = caption
        self.columns = columns
        self.rows = rows
        self.isStreaming = isStreaming
        self.maxRows = maxRows
        self.height = height
        self.labels = labels
        self.onCopy = onCopy
        self.onExport = onExport
        self.onExpand = onExpand
    }

    /// The table as CSV with a header line. Fields with a comma, a quote, a line break or outer
    /// spaces are quoted, and quotes inside them are doubled. A field that starts with `=`, `+`,
    /// `-` or `@` gets a leading apostrophe, so a spreadsheet never runs it as a formula.
    public nonisolated static func csv(columns: [StanceGeneratedTableColumn], rows: [StanceGeneratedTableRow]) -> String {
        func field(_ raw: String) -> String {
            let text = raw.first.map { "=+-@".contains($0) } == true ? "'" + raw : raw
            let needsQuotes = text.contains(",") || text.contains("\"") || text.contains("\n") || text.contains("\r") || text.first == " " || text.last == " "
            return needsQuotes ? "\"" + text.replacingOccurrences(of: "\"", with: "\"\"") + "\"" : text
        }
        let lines = [columns.map { field($0.header) }] + rows.map { row in columns.map { field(row[$0.id]) } }
        return lines.map { $0.joined(separator: ",") }.joined(separator: "\n")
    }

    /// The rows to show: all of them, or the first `max` until the reader asks for the rest.
    public nonisolated static func visibleRows(_ rows: [StanceGeneratedTableRow], max: Int?, showsAll: Bool) -> [StanceGeneratedTableRow] {
        guard let max, !showsAll, rows.count > Swift.max(0, max) else { return rows }
        return Array(rows.prefix(Swift.max(0, max)))
    }

    /// The number in a cell such as "1,284", "8%" or "€ 40.50", for sorting. `nil` when there is none.
    public nonisolated static func number(_ text: String) -> Double? {
        let digits = text.replacingOccurrences(of: "\u{2212}", with: "-").filter { ($0.isASCII && $0.isNumber) || $0 == "." || $0 == "-" }
        return Double(digits)
    }

    public var body: some View {
        let visible = Self.visibleRows(rows, max: maxRows, showsAll: showsAll)
        let shape = RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous)
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            if caption != nil || isStreaming {
                HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.sm) {
                    if let caption {
                        Text(caption).stanceText(.label).fixedSize(horizontal: false, vertical: true).accessibilityAddTraits(.isHeader)
                    }
                    Spacer(minLength: 0)
                    if isStreaming {
                        Text(labels.streaming ?? stanceString("stance.ai.table.streaming", locale)).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
                    }
                }
            }
            StanceDataTable(caption, rows: visible, columns: tableColumns, sort: $sort)
                // The card list sits in a message: no list margin above the sort menu.
                .contentMargins(.top, StanceSpacing.none, for: .scrollContent)
                .frame(height: height * scale)
                .clipShape(shape)
                .overlay { shape.strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
            if let maxRows, rows.count > max(0, maxRows) {
                Text(stanceString("stance.ai.table.showing \(visible.count) \(rows.count)", locale)).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
            }
            StanceFlowLayout(spacing: StanceSpacing.sm, lineSpacing: StanceSpacing.xs) {
                if let maxRows, rows.count > max(0, maxRows) {
                    StanceButton(showsAll ? labels.showFewer ?? stanceString("stance.ai.table.showFewer", locale) : labels.showAll ?? stanceString("stance.ai.table.showAll", locale), variant: .outline, size: .small) {
                        showsAll.toggle()
                    }
                }
                StanceCopyButton(value: Self.csv(columns: columns, rows: rows), label: labels.copy ?? stanceString("stance.ai.table.copy", locale), variant: .ghost, onCopy: onCopy)
                    .disabled(isStreaming)
                if let onExport {
                    StanceButton(labels.export ?? stanceString("stance.ai.table.export", locale), variant: .ghost, size: .small, leadingIcon: .download, action: onExport)
                        .disabled(isStreaming)
                }
                if let onExpand {
                    StanceButton(labels.expand ?? stanceString("stance.ai.table.expand", locale), variant: .ghost, size: .small, leadingIcon: .maximize, action: onExpand)
                }
            }
        }
    }

    private var tableColumns: [StanceTableColumn<StanceGeneratedTableRow>] {
        columns.map { column in
            let id = column.id
            if column.isNumeric {
                return StanceTableColumn(column.header, id: id, alignment: .trailing, value: { $0[id] }, sortValue: { Self.number($0[id]) ?? -Double.greatestFiniteMagnitude })
            }
            return StanceTableColumn(column.header, id: id, value: { $0[id] })
        }
    }
}

// MARK: Generated chart

/// What a ``StanceGeneratedChart`` is showing.
public enum StanceGeneratedChartView: String, CaseIterable, Sendable {
    case chart, table
}

/// Words a ``StanceGeneratedChart`` uses. Leave a value out to keep the localised default.
public struct StanceGeneratedChartLabels: Sendable {
    public var chart: String?
    public var table: String?
    public var view: String?
    public var category: String?
    public var source: (@Sendable (String) -> String)?

    /// - Parameters:
    ///   - chart: The chart segment. Defaults to a localised "Chart".
    ///   - table: The table segment. Defaults to a localised "Table".
    ///   - view: The accessible name of the switch. Defaults to a localised "View".
    ///   - category: The first table column. Defaults to a localised "Category".
    ///   - source: Builds the source note from the source. Defaults to a localised "Source: name".
    public init(chart: String? = nil, table: String? = nil, view: String? = nil, category: String? = nil, source: (@Sendable (String) -> String)? = nil) {
        self.chart = chart
        self.table = table
        self.view = view
        self.category = category
        self.source = source
    }
}

/// A chart the assistant built from data: a title, a takeaway in plain language, a switch to
/// the same data as a table, and a source note.
///
/// Built on ``StanceChart`` (Swift Charts with Audio Graphs). The takeaway is shown under the
/// title and is the text alternative, and the table view is always one tap away on a system
/// segmented `Picker`.
public struct StanceGeneratedChart: View {
    private let title: String
    private let takeaway: String
    private let kind: StanceChartKind
    private let series: [StanceChartSeries]
    private let source: String?
    private let format: (Double) -> String
    private let labels: StanceGeneratedChartLabels
    private let external: Binding<StanceGeneratedChartView>?
    @State private var internalView = StanceGeneratedChartView.chart
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - title: The heading.
    ///   - takeaway: The point of the chart in one or two sentences. It is the text alternative.
    ///   - kind: Line, bar or area.
    ///   - series: The data.
    ///   - source: Where the data came from, shown as a note.
    ///   - view: Chart or table. Leave out to let the component keep the state.
    ///   - format: Formats a value for the axis, the table and VoiceOver. Defaults to a localised number.
    ///   - labels: Replacements for the built in words.
    @_disfavoredOverload
    public init(
        _ title: String,
        takeaway: String,
        kind: StanceChartKind = .bar,
        series: [StanceChartSeries],
        source: String? = nil,
        view: Binding<StanceGeneratedChartView>? = nil,
        format: ((Double) -> String)? = nil,
        labels: StanceGeneratedChartLabels = .init()
    ) {
        self.title = title
        self.takeaway = takeaway
        self.kind = kind
        self.series = series
        self.source = source
        external = view
        self.format = format ?? { $0.formatted(.number) }
        self.labels = labels
    }

    /// Creates a chart whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        takeaway: String,
        kind: StanceChartKind = .bar,
        series: [StanceChartSeries],
        source: String? = nil,
        view: Binding<StanceGeneratedChartView>? = nil,
        format: ((Double) -> String)? = nil,
        labels: StanceGeneratedChartLabels = .init()
    ) {
        self.init(String(localized: titleKey), takeaway: takeaway, kind: kind, series: series, source: source, view: view, format: format, labels: labels)
    }

    /// The chart as a table: a header of the category title and every series, then one row per
    /// category in first seen order. A series with no value for a category gets an empty cell.
    public nonisolated static func tableData(series: [StanceChartSeries], categoryTitle: String, format: (Double) -> String) -> (header: [String], rows: [[String]]) {
        let rows = StanceChart.categories(series).map { category in
            [category] + series.map { s in s.points.first { $0.category == category }.map { format($0.value) } ?? "" }
        }
        return ([categoryTitle] + series.map(\.label), rows)
    }

    private var view: Binding<StanceGeneratedChartView> { external ?? $internalView }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            Picker(labels.view ?? stanceString("stance.ai.genChart.view", locale), selection: view) {
                Text(labels.chart ?? stanceString("stance.ai.genChart.chart", locale)).tag(StanceGeneratedChartView.chart)
                Text(labels.table ?? stanceString("stance.ai.genChart.table", locale)).tag(StanceGeneratedChartView.table)
            }
            .pickerStyle(.segmented)
            .labelsHidden()
            .frame(minHeight: StanceSize.touchTarget)
            if view.wrappedValue == .chart {
                StanceChart(title, description: takeaway, kind: kind, series: series, format: format, allowsTable: false)
            } else {
                table
            }
            if let source {
                Text(labels.source?(source) ?? stanceString("stance.ai.genChart.source \(source)", locale))
                    .stanceText(.caption)
                    .foregroundStyle(theme.colors.fgMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var table: some View {
        let data = Self.tableData(series: series, categoryTitle: labels.category ?? stanceString("stance.chart.category", locale), format: format)
        return VStack(alignment: .leading, spacing: StanceSpacing.md) {
            VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                Text(title).stanceText(.subheading).accessibilityAddTraits(.isHeader)
                Text(takeaway).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted).fixedSize(horizontal: false, vertical: true)
            }
            ScrollView(.horizontal) {
                Grid(alignment: .leading, horizontalSpacing: StanceSpacing.lg, verticalSpacing: StanceSpacing.sm) {
                    GridRow {
                        ForEach(Array(data.header.enumerated()), id: \.offset) { index, title in
                            Text(title).stanceText(.label).gridColumnAlignment(index == 0 ? .leading : .trailing)
                        }
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityAddTraits(.isHeader)
                    Divider().gridCellUnsizedAxes(.horizontal).overlay(theme.colors.separator)
                    ForEach(Array(data.rows.enumerated()), id: \.offset) { _, row in
                        GridRow {
                            ForEach(Array(row.enumerated()), id: \.offset) { _, cell in
                                Text(cell).stanceText(.bodySmall).monospacedDigit()
                            }
                        }
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel(zip(data.header, row).map { "\($0): \($1)" }.joined(separator: ", "))
                    }
                }
                .padding(.vertical, StanceSpacing.xs)
            }
        }
        .stanceCard()
    }
}

// MARK: File preview card

/// Words a ``StanceFilePreviewCard`` uses. Leave a value out to keep the localised default.
public struct StanceFilePreviewCardLabels: Sendable {
    public var open: (@Sendable (String) -> String)?
    public var download: (@Sendable (String) -> String)?
    public var preparing: String?
    public var failed: String?

    /// - Parameters:
    ///   - open: The accessible name of the open button for a file name. Defaults to a localised "Open name".
    ///   - download: The accessible name of the download button. Defaults to a localised "Download name".
    ///   - preparing: Shown while the file is being made. Defaults to a localised "Preparing file".
    ///   - failed: Shown when it failed. Defaults to a localised "The file could not be created".
    public init(open: (@Sendable (String) -> String)? = nil, download: (@Sendable (String) -> String)? = nil, preparing: String? = nil, failed: String? = nil) {
        self.open = open
        self.download = download
        self.preparing = preparing
        self.failed = failed
    }
}

/// A card for a file the assistant made or used: its name, kind, size and a thumbnail, with
/// open and download.
///
/// Pass a local file `url` and the card opens it in ``StanceDocumentPreview`` (Quick Look) on
/// iOS; pass `onOpen` to open it your own way. Sizes use the system byte count format.
public struct StanceFilePreviewCard<Actions: View>: View {
    private let name: String
    private let kind: String?
    private let size: Int64?
    private let meta: String?
    private let thumbnail: Image?
    private let status: StanceGenerationStatus
    private let progress: Double?
    private let url: URL?
    private let labels: StanceFilePreviewCardLabels
    private let onOpen: (() -> Void)?
    private let onDownload: (() -> Void)?
    private let actions: Actions
    @State private var showsPreview = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @ScaledMetric(relativeTo: .body) private var tile: CGFloat = StanceSize.controlLg

    /// - Parameters:
    ///   - name: The file name.
    ///   - kind: What it is, such as "PDF". Defaults to the file extension in capitals.
    ///   - size: The size in bytes.
    ///   - meta: One more detail, such as a page count.
    ///   - thumbnail: A small preview supplied by the app.
    ///   - status: The generation status. Progress shows while it is active.
    ///   - progress: Progress from 0 to 1, or `nil` when it is not known.
    ///   - url: A local file to preview with Quick Look when the card is opened (iOS).
    ///   - labels: Replacements for the built in words.
    ///   - onOpen: Opens the file. Takes the place of the Quick Look preview.
    ///   - onDownload: Saves the file. Leave out to hide the button.
    ///   - actions: More buttons, shown after open and download.
    public init(
        _ name: String,
        kind: String? = nil,
        size: Int64? = nil,
        meta: String? = nil,
        thumbnail: Image? = nil,
        status: StanceGenerationStatus = .complete,
        progress: Double? = nil,
        url: URL? = nil,
        labels: StanceFilePreviewCardLabels = .init(),
        onOpen: (() -> Void)? = nil,
        onDownload: (() -> Void)? = nil,
        @ViewBuilder actions: () -> Actions = { EmptyView() }
    ) {
        self.name = name
        self.kind = kind
        self.size = size
        self.meta = meta
        self.thumbnail = thumbnail
        self.status = status
        self.progress = progress
        self.url = url
        self.labels = labels
        self.onOpen = onOpen
        self.onDownload = onDownload
        self.actions = actions()
    }

    private var canPreview: Bool {
        #if canImport(UIKit) && canImport(QuickLook)
        url?.isFileURL == true
        #else
        false
        #endif
    }

    public var body: some View {
        let layout = dynamicTypeSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: StanceSpacing.sm)) : AnyLayout(HStackLayout(spacing: StanceSpacing.md))
        layout {
            HStack(spacing: StanceSpacing.md) {
                thumbnailView
                VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                    Text(name).stanceText(.label).lineLimit(2).multilineTextAlignment(.leading)
                    statusLine
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .accessibilityElement(children: .combine)
            if status == .complete || status == .idle {
                HStack(spacing: 0) {
                    if onOpen != nil || canPreview {
                        StanceQuietIconButton(symbol: "arrow.up.forward.square", label: labels.open?(name) ?? stanceString("stance.ai.file.open \(name)", locale)) {
                            if let onOpen { onOpen() } else { showsPreview = true }
                        }
                    }
                    if let onDownload {
                        StanceQuietIconButton(symbol: "arrow.down.to.line", label: labels.download?(name) ?? stanceString("stance.ai.file.download \(name)", locale), action: onDownload)
                    }
                    actions
                }
            }
        }
        .padding(StanceSpacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .stanceSurface(.surface, cornerRadius: StanceRadius.lg)
        #if canImport(UIKit) && canImport(QuickLook)
        .sheet(isPresented: $showsPreview) {
            if let url { StanceDocumentPreview(url: url).ignoresSafeArea() }
        }
        #endif
    }

    @ViewBuilder private var thumbnailView: some View {
        let shape = RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous)
        Group {
            if let thumbnail {
                thumbnail.resizable().scaledToFill()
            } else {
                StanceIcon(.fileText, size: StanceSize.iconMd).foregroundStyle(theme.colors.fgMuted)
            }
        }
        .frame(width: tile, height: tile)
        .background(theme.colors.bgMuted)
        .clipShape(shape)
        .overlay { shape.strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
        .accessibilityHidden(true)
    }

    @ViewBuilder private var statusLine: some View {
        if status.isActive {
            let label = labels.preparing ?? stanceString("stance.ai.file.preparing", locale)
            Group {
                if let value = StanceGeneratedImage.clampedProgress(progress) {
                    ProgressView(value: value) { Text(label).stanceText(.caption) }
                } else {
                    ProgressView { Text(label).stanceText(.caption) }.progressViewStyle(.linear)
                }
            }
            .tint(theme.colors.accentBg)
            .foregroundStyle(theme.colors.fgMuted)
        } else if status == .error {
            Text(labels.failed ?? stanceString("stance.ai.file.failed", locale)).stanceText(.caption).foregroundStyle(theme.colors.dangerFg)
        } else if let detail = StanceFileDetail.text(name: name, kind: kind, size: size, meta: meta, locale: locale) {
            Text(detail).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
        }
    }
}

/// The words under a file name in a ``StanceFilePreviewCard``.
public enum StanceFileDetail {
    /// The kind of a file from its extension in capitals, such as "PDF" for "report.pdf".
    /// `nil` when the name has no extension.
    public nonisolated static func kind(forName name: String) -> String? {
        guard let dot = name.lastIndex(of: "."), dot != name.startIndex else { return nil }
        let ext = name[name.index(after: dot)...]
        return ext.isEmpty || ext.contains(" ") ? nil : ext.uppercased()
    }

    /// The size in the system file format for `locale`, such as "482 KB".
    public nonisolated static func size(_ bytes: Int64, locale: Locale = .current) -> String {
        bytes.formatted(.byteCount(style: .file).locale(locale))
    }

    /// The detail line: the kind (given, or from the extension), the size and the extra detail,
    /// separated by commas. `nil` when there is nothing to show.
    public nonisolated static func text(name: String, kind: String? = nil, size: Int64? = nil, meta: String? = nil, locale: Locale = .current) -> String? {
        let parts = [kind ?? self.kind(forName: name), size.map { self.size($0, locale: locale) }, meta].compactMap { $0 }.filter { !$0.isEmpty }
        guard !parts.isEmpty else { return nil }
        return parts.joined(separator: ", ")
    }
}

// MARK: Canvas split view

/// One side of a ``StanceCanvasSplitView``.
public enum StanceCanvasPane: String, CaseIterable, Sendable {
    case conversation, canvas
}

/// The layout rules of a ``StanceCanvasSplitView``, usable without a view.
public enum StanceCanvasSplitLayout {
    /// How far one arrow key press or VoiceOver adjustment moves the divider.
    public static let step: CGFloat = 1 / 20

    /// Whether both panes fit side by side: regular width with room for both minimum widths.
    public nonisolated static func usesColumns(width: CGFloat, isRegular: Bool, minConversation: CGFloat, minCanvas: CGFloat) -> Bool {
        isRegular && width >= minConversation + minCanvas
    }

    /// The share of the width the conversation takes, kept so both panes keep their minimum width.
    /// When they cannot both fit, the space is split by the two minimums.
    public nonisolated static func clampedRatio(_ ratio: CGFloat, width: CGFloat, minConversation: CGFloat, minCanvas: CGFloat) -> CGFloat {
        guard width > 0 else { return min(max(ratio, 0), 1) }
        let lower = minConversation / width, upper = 1 - minCanvas / width
        guard lower <= upper else { return minConversation / max(minConversation + minCanvas, 1) }
        return min(max(ratio, lower), upper)
    }

    /// The pane shown in a narrow layout: the canvas only while it is open.
    public nonisolated static func narrowPane(_ selected: StanceCanvasPane, isCanvasOpen: Bool) -> StanceCanvasPane {
        isCanvasOpen ? selected : .conversation
    }
}

/// Words a ``StanceCanvasSplitView`` uses. Leave a value out to keep the localised default.
public struct StanceCanvasSplitLabels: Sendable {
    public var conversation: String?
    public var canvas: String?
    public var divider: String?
    public var switcher: String?

    /// - Parameters:
    ///   - conversation: The conversation region and segment. Defaults to a localised "Conversation".
    ///   - canvas: The canvas region and segment. Defaults to a localised "Canvas".
    ///   - divider: The accessible name of the divider. Defaults to a localised "Resize panels".
    ///   - switcher: The accessible name of the narrow switch. Defaults to a localised "View".
    public init(conversation: String? = nil, canvas: String? = nil, divider: String? = nil, switcher: String? = nil) {
        self.conversation = conversation
        self.canvas = canvas
        self.divider = divider
        self.switcher = switcher
    }
}

/// The conversation on one side and the working document on the other.
///
/// In regular width the two sit in columns with a divider that can be dragged, moved with the
/// arrow keys, or adjusted with VoiceOver. In compact width, where both cannot fit, a system
/// segmented `Picker` switches between them. Each side is a labelled region. Fill the screen
/// with it: it takes all the space it is offered.
public struct StanceCanvasSplitView<Conversation: View, Canvas: View>: View {
    private let minConversation: CGFloat
    private let minCanvas: CGFloat
    private let labels: StanceCanvasSplitLabels
    private let externalNarrow: Binding<StanceCanvasPane>?
    private let conversation: Conversation
    private let canvas: Canvas
    @Binding private var isCanvasOpen: Bool
    @State private var ratio: CGFloat
    @State private var dragStart: CGFloat?
    @State private var internalNarrow = StanceCanvasPane.conversation
    @FocusState private var dividerFocused: Bool
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.horizontalSizeClass) private var sizeClass
    @Environment(\.layoutDirection) private var layoutDirection

    /// - Parameters:
    ///   - isCanvasOpen: Whether the canvas is shown. Closed, the conversation takes all the space.
    ///   - narrowView: The side shown in compact width. Leave out to let the component keep the state.
    ///   - defaultRatio: The share of the width the conversation starts with, from 0 to 1.
    ///   - minConversation: The narrowest the conversation may get.
    ///   - minCanvas: The narrowest the canvas may get.
    ///   - labels: Replacements for the built in words.
    ///   - conversation: The conversation, usually a ``StanceThread`` and a composer.
    ///   - canvas: The working document.
    public init(
        isCanvasOpen: Binding<Bool> = .constant(true),
        narrowView: Binding<StanceCanvasPane>? = nil,
        defaultRatio: CGFloat = 1 / 2,
        minConversation: CGFloat = StanceSize.readableWidth / 2,
        minCanvas: CGFloat = StanceSize.readableWidth / 2,
        labels: StanceCanvasSplitLabels = .init(),
        @ViewBuilder conversation: () -> Conversation,
        @ViewBuilder canvas: () -> Canvas
    ) {
        _isCanvasOpen = isCanvasOpen
        externalNarrow = narrowView
        _ratio = State(initialValue: defaultRatio)
        self.minConversation = minConversation
        self.minCanvas = minCanvas
        self.labels = labels
        self.conversation = conversation()
        self.canvas = canvas()
    }

    private var narrow: Binding<StanceCanvasPane> { externalNarrow ?? $internalNarrow }
    private var conversationLabel: String { labels.conversation ?? stanceString("stance.ai.canvas.conversation", locale) }
    private var canvasLabel: String { labels.canvas ?? stanceString("stance.ai.canvas.canvas", locale) }

    public var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            if StanceCanvasSplitLayout.usesColumns(width: width, isRegular: sizeClass == .regular, minConversation: minConversation, minCanvas: minCanvas) {
                columns(width: width)
            } else {
                stacked
            }
        }
    }

    private func region<Pane: View>(_ pane: Pane, label: String) -> some View {
        pane
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .accessibilityElement(children: .contain)
            .accessibilityLabel(label)
    }

    private func columns(width: CGFloat) -> some View {
        let share = StanceCanvasSplitLayout.clampedRatio(ratio, width: width, minConversation: minConversation, minCanvas: minCanvas)
        return HStack(spacing: 0) {
            if isCanvasOpen {
                region(conversation, label: conversationLabel).frame(width: width * share)
                divider(width: width, share: share)
                region(canvas, label: canvasLabel)
            } else {
                region(conversation, label: conversationLabel)
            }
        }
    }

    private func move(by delta: CGFloat, width: CGFloat) {
        ratio = StanceCanvasSplitLayout.clampedRatio(ratio + delta, width: width, minConversation: minConversation, minCanvas: minCanvas)
    }

    private func divider(width: CGFloat, share: CGFloat) -> some View {
        let direction: CGFloat = layoutDirection == .rightToLeft ? -1 : 1
        return Rectangle()
            .fill(dragStart != nil || dividerFocused ? theme.colors.focusRing : theme.colors.separator)
            .frame(width: dragStart != nil || dividerFocused ? theme.focusWidth : theme.borderWidth)
            .frame(maxHeight: .infinity)
            .overlay {
                Capsule()
                    .fill(theme.colors.borderStrong)
                    .frame(width: StanceSpacing.xs, height: StanceSize.controlMd)
            }
            .frame(width: StanceSpacing.lg)
            .contentShape(Rectangle().inset(by: -(StanceSize.touchTarget - StanceSpacing.lg) / 2))
            .gesture(
                DragGesture(minimumDistance: 0, coordinateSpace: .global)
                    .onChanged { value in
                        let start = dragStart ?? share
                        dragStart = start
                        ratio = StanceCanvasSplitLayout.clampedRatio(start + value.translation.width * direction / width, width: width, minConversation: minConversation, minCanvas: minCanvas)
                    }
                    .onEnded { _ in dragStart = nil }
            )
            .focusable()
            .focused($dividerFocused)
            .onKeyPress(.leftArrow) { move(by: -StanceCanvasSplitLayout.step * direction, width: width); return .handled }
            .onKeyPress(.rightArrow) { move(by: StanceCanvasSplitLayout.step * direction, width: width); return .handled }
            .accessibilityElement()
            .accessibilityLabel(labels.divider ?? stanceString("stance.ai.canvas.resize", locale))
            .accessibilityValue(Double(share).formatted(.percent.precision(.fractionLength(0)).locale(locale)))
            .accessibilityAdjustableAction { adjustment in
                switch adjustment {
                case .increment: move(by: StanceCanvasSplitLayout.step, width: width)
                case .decrement: move(by: -StanceCanvasSplitLayout.step, width: width)
                @unknown default: break
                }
            }
            #if os(iOS)
            .hoverEffect(.highlight)
            #endif
    }

    private var stacked: some View {
        let pane = StanceCanvasSplitLayout.narrowPane(narrow.wrappedValue, isCanvasOpen: isCanvasOpen)
        return VStack(spacing: 0) {
            if isCanvasOpen {
                Picker(labels.switcher ?? stanceString("stance.ai.canvas.switch", locale), selection: narrow) {
                    Text(conversationLabel).tag(StanceCanvasPane.conversation)
                    Text(canvasLabel).tag(StanceCanvasPane.canvas)
                }
                .pickerStyle(.segmented)
            .labelsHidden()
                .frame(minHeight: StanceSize.touchTarget)
                .padding(.horizontal, StanceSpacing.lg)
                .padding(.vertical, StanceSpacing.xs)
                StanceDivider()
            }
            if pane == .canvas {
                region(canvas, label: canvasLabel)
            } else {
                region(conversation, label: conversationLabel)
            }
        }
    }
}
