import StanceTokens
import StanceUI
import SwiftUI
import UniformTypeIdentifiers

/// Compositions rendered for the documentation previews in `platforms/ios/previews`.
///
/// Each entry is keyed by the slug of a `components.json` entry. Inline previews are captured
/// one component at a time from `PreviewGalleryView`. Screen previews (system presentations and
/// navigation) are captured full screen with `-preview <slug>`.
@MainActor
enum PreviewCatalog {
    struct Entry: Identifiable {
        enum Kind { case inline, screen }
        let id: String
        let kind: Kind
        let view: AnyView

        init<V: View>(_ id: String, _ kind: Kind = .inline, @ViewBuilder _ view: () -> V) {
            self.id = id
            self.kind = kind
            self.view = AnyView(view())
        }
    }

    static let contentWidth: CGFloat = 345
    static let padding: CGFloat = StanceSpacing.xl
    static let maxHeight: CGFloat = 520

    static var inline: [Entry] { all.filter { $0.kind == .inline } }
    static func screen(_ id: String) -> Entry? { all.first { $0.id == id && $0.kind == .screen } }

    static let all: [Entry] = [
        // Theming
        Entry("stance-theme") { ThemeModifierPreview() },
        Entry("stance-scoped-theme") { ScopedThemePreview() },
        // Foundations
        Entry("stance-card") {
            StanceCard("Sales team signature", description: "Deployed to 48 organisation users", elevated: true) {
                StanceProgressView("Mailboxes updated", value: 0.72)
            } footer: {
                HStack {
                    StanceBadge("Live", tone: .success)
                    Spacer()
                    StanceButton("Open", variant: .outline, size: .small) {}
                }
            }
        },
        Entry("stance-card-modifier") {
            VStack(spacing: StanceSpacing.md) {
                Text("Any view can take the card treatment.").stanceText(.body).stanceCard()
                Text("Elevated cards lift off the canvas.").stanceText(.body).stanceCard(elevated: true)
            }
        },
        Entry("stance-surface") { SurfacePreview() },
        Entry("stance-shadow") { ShadowPreview() },
        Entry("stance-divider") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                Text("Owner").stanceText(.label)
                StanceDivider()
                Text("Priya Nair").stanceText(.body)
                HStack(spacing: StanceSpacing.md) {
                    Text("Draft").stanceText(.bodySmall)
                    StanceDivider(vertical: true).frame(height: 20)
                    Text("Updated today").stanceText(.bodySmall)
                }
            }
            .stanceCard()
        },
        Entry("stance-section") {
            StanceSection("Rollout", caption: "How this template reaches your organisation") {
                StanceDescriptionList([("Relay", "Exchange Online"), ("Mailboxes", "48")]).stanceCard()
            }
        },
        Entry("stance-container") { ContainerPreview() },
        Entry("stance-grid") {
            StanceGrid(minItemWidth: 150) {
                StanceStatCard("Deployments", value: "1,284", change: 0.12)
                StanceStatCard("Failed", value: "3", change: -0.5)
                StanceStatCard("Templates", value: "12")
                StanceStatCard("Users", value: "48", change: 0)
            }
        },
        Entry("stance-icon") { IconPreview() },
        Entry("stance-touch-target") { TouchTargetPreview() },
        // Typography
        Entry("stance-text") { TextPreview() },
        // Actions
        Entry("stance-button") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                StanceButton("Deploy signature", leadingIcon: .send, fullWidth: true) {}
                StanceButtonGroup {
                    StanceButton("Save draft", variant: .secondary) {}
                    StanceButton("Preview", variant: .outline) {}
                }
                StanceButtonGroup {
                    StanceButton("Cancel", variant: .ghost) {}
                    StanceButton("Delete", variant: .danger, leadingIcon: .trash) {}
                }
                StanceButtonGroup {
                    StanceButton("Publishing", isLoading: true) {}
                    StanceButton("Disabled") {}.disabled(true)
                }
                StanceButton("Learn about deployments", variant: .link, trailingIcon: .arrowRight) {}
            }
        },
        Entry("stance-button-style") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                Button("Primary") {}.buttonStyle(.stance(.primary, fullWidth: true))
                Button("Outline, pill") {}.buttonStyle(.stance(.outline, fullWidth: true, pill: true))
                HStack(spacing: StanceSpacing.sm) {
                    Button("Small") {}.buttonStyle(.stance(.secondary, size: .small))
                    Button("Medium") {}.buttonStyle(.stance(.secondary))
                    Button("Large") {}.buttonStyle(.stance(.secondary, size: .large))
                }
            }
        },
        Entry("stance-icon-button") {
            HStack(spacing: StanceSpacing.md) {
                StanceIconButton(.pencil, label: "Edit template") {}
                StanceIconButton(.copy, label: "Duplicate template", variant: .outline) {}
                StanceIconButton(.send, label: "Deploy", variant: .primary) {}
                StanceIconButton(.trash, label: "Delete template", variant: .secondary) {}
                Spacer(minLength: 0)
            }
            .stanceCard()
        },
        Entry("stance-button-group") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceButtonGroup {
                    StanceButton("Back", variant: .outline) {}
                    StanceButton("Continue", trailingIcon: .arrowRight) {}
                }
                StanceButtonGroup {
                    StanceButton("Decline", variant: .ghost) {}
                    StanceButton("Request changes", variant: .outline) {}
                    StanceButton("Approve") {}
                }
            }
            .stanceCard()
        },
        Entry("stance-menu", .screen) { MenuScreen() },
        // Forms
        Entry("stance-form-field") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceFormField("Plan", helper: "Billed monthly per mailbox.") {
                    Text("Team").stanceText(.body).frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                }
                StanceFormField("Organisation ID", error: "This ID is already in use.", isRequired: true) {
                    Text("org_7Hk2").stanceText(.body).frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                }
            }
            .stanceCard()
        },
        Entry("stance-text-field") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceTextField("Template name", text: .constant("Sales team signature"), helper: "Visible to everyone in your organisation.", isRequired: true)
                StanceTextField("Reply-to email", text: .constant("priya.nair@"), error: "Enter a complete email address.", leadingIcon: .mail)
                StanceTextField("Website", text: .constant(""), placeholder: "binds.si", leadingIcon: .globe)
                StanceTextField("Organisation ID", text: .constant("org_7Hk2")).disabled(true)
            }
        },
        Entry("stance-secure-field") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                Stateful("sk_live_2f9a81c0") { StanceSecureField("Relay API key", text: $0, helper: "Stored in the keychain.") }
                Stateful("sk_live") { StanceSecureField("Confirm key", text: $0, error: "The keys do not match.", isRequired: true) }
            }
        },
        Entry("stance-text-editor") {
            Stateful("Use the 2026 logo and the Ljubljana office address. Legal has approved the disclaimer.") { StanceTextEditor("Notes for the team", text: $0, limit: 200) }
        },
        Entry("stance-search-field") {
            VStack(spacing: StanceSpacing.md) {
                StanceSearchField("Search organisation users", text: .constant(""))
                StanceSearchField("Search organisation users", text: .constant("Priya"))
            }
        },
        Entry("stance-picker") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StancePicker("Plan", selection: .constant("team"), options: [("free", "Free"), ("team", "Team"), ("business", "Business")], helper: "Billed monthly per mailbox.")
                StancePicker("Default role", selection: .constant("member"), options: [("admin", "Admin"), ("member", "Member")])
            }
        },
        Entry("stance-checkbox") {
            VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                StanceCheckbox("Apply to new members automatically", description: "People added later get this signature.", isOn: .constant(true))
                StanceCheckbox("Email me when a deployment fails", isOn: .constant(false))
                StanceCheckbox("Managed by your administrator", isOn: .constant(true)).disabled(true)
            }
            .stanceCard()
        },
        Entry("stance-radio-group") {
            StanceRadioGroup("Role", selection: .constant("member"), options: [
                .init("admin", label: "Admin", description: "Manages templates, users and integrations"),
                .init("member", label: "Member", description: "Uses assigned signatures"),
                .init("viewer", label: "Viewer", description: "Can preview templates"),
            ])
            .stanceCard()
        },
        Entry("stance-toggle-style") {
            VStack(spacing: StanceSpacing.xs) {
                Toggle("Auto-deploy on save", isOn: .constant(true)).toggleStyle(.stance)
                StanceDivider()
                Toggle("Include legal disclaimer", isOn: .constant(false)).toggleStyle(.stance)
                StanceDivider()
                Toggle("Managed by your administrator", isOn: .constant(true)).toggleStyle(.stance).disabled(true)
            }
            .stanceCard()
        },
        Entry("stance-slider") {
            VStack(spacing: StanceSpacing.lg) {
                StanceSlider("Logo width", value: .constant(96), in: 24 ... 160, step: 4) { "\(Int($0)) pt" }
                StanceSlider("Banner opacity", value: .constant(40)) { "\(Int($0))%" }
            }
            .stanceCard()
        },
        Entry("stance-date-picker") {
            VStack(spacing: StanceSpacing.xs) {
                StanceDatePicker("Deploy on", selection: .constant(PreviewData.date), helper: "Signatures update after the next sync.")
                StanceDivider()
                StanceDatePicker("At", selection: .constant(PreviewData.date), displayedComponents: .hourAndMinute)
            }
            .stanceCard()
        },
        // Navigation
        Entry("stance-adaptive-navigation", .screen) { RootView() },
        Entry("stance-navigation-chrome", .screen) { NavigationChromeScreen() },
        Entry("stance-stepper") {
            StanceStepper(steps: ["Choose a template", "Customise details", "Assign users", "Deploy"], current: 2).stanceCard()
        },
        Entry("stance-page-indicator") {
            VStack(spacing: StanceSpacing.lg) {
                StancePageIndicator(count: 4, current: 0)
                StancePageIndicator(count: 4, current: 2)
                StancePageIndicator(count: 6, current: 5)
            }
            .frame(maxWidth: .infinity)
            .stanceCard()
        },
        // Data display
        Entry("stance-badge") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                HStack(spacing: StanceSpacing.sm) {
                    StanceBadge("Draft")
                    StanceBadge("Scheduled", tone: .info)
                    StanceBadge("Live", tone: .success)
                }
                HStack(spacing: StanceSpacing.sm) {
                    StanceBadge("Pending", tone: .warning)
                    StanceBadge("Failed", tone: .danger)
                }
                StanceListRow("Sales team signature", subtitle: "48 users") { EmptyView() } trailing: { StanceBadge("Live", tone: .success) }
            }
            .stanceCard()
        },
        Entry("stance-tag") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                HStack(spacing: StanceSpacing.sm) { StanceTag("Sales") {}; StanceTag("Legal") {}; StanceTag("Finance") {} }
                HStack(spacing: StanceSpacing.sm) { StanceTag("Read only"); StanceTag("Template") }
            }
            .stanceCard()
        },
        Entry("stance-avatar") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                HStack(spacing: StanceSpacing.lg) {
                    StanceAvatar(name: "Priya Nair", size: .small)
                    StanceAvatar(name: "Lukas Brenner")
                    StanceAvatar(name: "Hana Sato", size: .large)
                }
                StanceListRow("Priya Nair", subtitle: "priya.nair@binds.si") { StanceAvatar(name: "Priya Nair") }
            }
            .stanceCard()
        },
        Entry("stance-avatar-group") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceAvatarGroup(names: PreviewData.people, max: 4)
                StanceAvatarGroup(names: PreviewData.people, max: 3, size: .medium)
                StanceAvatarGroup(names: Array(PreviewData.people.prefix(2)), size: .large)
            }
            .stanceCard()
        },
        Entry("stance-progress-view") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceProgressView("Mailboxes updated", value: 0.72)
                StanceProgressView("Uploading logo", value: 0.25)
                HStack(spacing: StanceSpacing.xl) {
                    StanceProgressView("Rollout", value: 0.72, shape: .circular)
                    StanceProgressView("Storage", value: 0.3, shape: .circular)
                    StanceProgressView("Complete", value: 1, shape: .circular)
                }
            }
            .stanceCard()
        },
        Entry("stance-skeleton") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                HStack(spacing: StanceSpacing.md) {
                    StanceSkeleton(.circle, height: 44)
                    VStack(alignment: .leading, spacing: StanceSpacing.sm) { StanceSkeleton(width: 180); StanceSkeleton(width: 110, height: 10) }
                }
                StanceSkeleton(.rectangle, height: 72)
                VStack(alignment: .leading, spacing: StanceSpacing.sm) { StanceSkeleton(); StanceSkeleton(); StanceSkeleton(width: 200) }
            }
            .stanceCard()
        },
        Entry("stance-empty-state") {
            StanceEmptyState(icon: .signature, title: "No templates yet", message: "Create a signature template to deploy it to your organisation.") {
                StanceButton("New template", leadingIcon: .plus) {}
            }
            .stanceSurface(.subtle, cornerRadius: StanceRadius.xl)
        },
        Entry("stance-timeline") {
            StanceTimeline([
                .init(id: "1", title: "Deployed to 48 mailboxes", detail: "Exchange relay confirmed delivery", time: "Today, 09:41", tone: .success),
                .init(id: "2", title: "Template updated", detail: "Logo and address changed", time: "Yesterday, 17:20"),
                .init(id: "3", title: "Deployment failed", detail: "Relay was offline", time: "9 Nov, 08:02", tone: .danger),
                .init(id: "4", title: "Template created", time: "8 Nov, 14:10"),
            ])
            .stanceCard()
        },
        Entry("stance-stat-card") {
            VStack(spacing: StanceSpacing.md) {
                HStack(alignment: .top, spacing: StanceSpacing.md) {
                    StanceStatCard("Deployments", value: "1,284", change: 0.12)
                    StanceStatCard("Failed", value: "3", change: -0.5)
                }
                StanceStatCard("Active templates", value: "12", change: 0)
            }
        },
        Entry("stance-description-list") {
            StanceDescriptionList([("Owner", "Priya Nair"), ("Relay", "Exchange Online"), ("Last deployed", "Today, 09:41"), ("Mailboxes", "48")]).stanceCard()
        },
        Entry("stance-list-row") {
            VStack(spacing: 0) {
                StanceListRow("Sales team signature", subtitle: "48 users") {
                    StanceIcon(.signature).frame(width: 40, height: 40)
                } trailing: { StanceBadge("Live", tone: .success) }
                StanceDivider()
                StanceListRow("Legal disclaimer", subtitle: "12 users") {
                    StanceIcon(.fileText).frame(width: 40, height: 40)
                } trailing: { StanceBadge("Draft") }
                StanceDivider()
                StanceListRow("Priya Nair", subtitle: "Admin") { StanceAvatar(name: "Priya Nair") } trailing: {
                    StanceIcon(.chevronRight, size: 16)
                }
            }
            .stanceCard(padding: StanceSpacing.md)
        },
        Entry("stance-list-style") { ListStylePreview() },
        Entry("stance-disclosure-group-style") { DisclosurePreview() },
        // Feedback
        Entry("stance-inline-alert") {
            VStack(spacing: StanceSpacing.md) {
                StanceInlineAlert("Signatures sync every 15 minutes", message: "Changes appear in Outlook after the next sync.")
                StanceInlineAlert("Deployment complete", message: "48 mailboxes updated.", tone: .success)
                StanceInlineAlert("Relay offline", message: "Deployments resume when the connector is back.", tone: .warning)
                StanceInlineAlert("Deployment failed", message: "3 mailboxes rejected the signature.", tone: .danger)
            }
        },
        Entry("stance-banner") {
            VStack(spacing: StanceSpacing.md) {
                StanceBanner("Scheduled maintenance on Sunday at 02:00.", actionTitle: "Details", action: {}, onDismiss: {})
                StanceBanner("Your plan renews in 3 days.", tone: .warning, onDismiss: {})
                StanceBanner("Exchange relay connected.", tone: .success)
            }
            .clipShape(RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous))
        },
        Entry("stance-toast-center") { ToastPreview() },
        Entry("stance-loading-state") {
            StanceLoadingState("Loading organisation users").frame(height: 180).stanceSurface(.subtle, cornerRadius: StanceRadius.xl)
        },
        Entry("stance-error-state") {
            StanceErrorState(message: "We could not load your templates. Check your connection and try again.") {}
                .stanceSurface(.subtle, cornerRadius: StanceRadius.xl)
        },
        // Overlays
        Entry("stance-sheet", .screen) { SheetScreen() },
        Entry("stance-alert", .screen) { AlertScreen() },
        Entry("stance-confirmation-dialog", .screen) { ConfirmationScreen() },
        // Advanced
        Entry("stance-filter-bar") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                StanceFilterBar(
                    filters: [.init(id: "live", title: "Live"), .init(id: "draft", title: "Draft"), .init(id: "failed", title: "Failed")],
                    selection: .constant(["live"])
                )
                .padding(.horizontal, -StanceSpacing.lg)
                StanceListRow("Sales team signature", subtitle: "48 users") { EmptyView() } trailing: { StanceBadge("Live", tone: .success) }
                    .stanceCard(padding: StanceSpacing.md)
            }
        },
        Entry("stance-searchable-list", .screen) { SearchableScreen() },
        Entry("stance-calendar") { StanceCalendar("Deployment date", selection: .constant(PreviewData.date)) },
        Entry("stance-signature-canvas") { SignaturePreview() },
        Entry("stance-attachment-picker") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                Text("Countersigned contract").stanceText(.label)
                StanceAttachmentPicker { _ in }
                StanceListRow("master-services-agreement.pdf", subtitle: "PDF, 248 KB") { StanceIcon(.fileText).frame(width: 32, height: 32) }
            }
            .stanceCard()
        },
        Entry("stance-document-preview", .screen) { DocumentScreen() },
    ]
}

enum PreviewData {
    /// Wednesday 11 November 2026, 09:41 UTC. Fixed so previews are reproducible.
    static let date = Date(timeIntervalSince1970: 1_794_390_060)
    static let people = ["Amara Okafor", "Lukas Brenner", "Priya Nair", "Tomás Ruiz", "Hana Sato", "Owen Price"]
}

// MARK: Gallery

/// Shows one inline preview at a time. The UI test reads the content rect from `preview-rect`,
/// crops the screenshot to it, then taps Next.
struct PreviewGalleryView: View {
    /// `-preview-start <slug>` opens the gallery at one entry, for checking a single preview.
    @State private var index: Int = {
        let args = ProcessInfo.processInfo.arguments
        guard let i = args.firstIndex(of: "-preview-start"), i + 1 < args.count else { return 0 }
        return PreviewCatalog.inline.firstIndex { $0.id == args[i + 1] } ?? 0
    }()
    @State private var rect = CGRect.zero
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        let entries = PreviewCatalog.inline
        VStack(spacing: 0) {
            if index < entries.count {
                entries[index].view
                    .frame(width: PreviewCatalog.contentWidth, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(PreviewCatalog.padding)
                    .background(theme.colors.bgCanvas)
                    .onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { new in
                        rect = new
                        PreviewManifest.write(slug: entries[index].id, rect: new)
                    }
                    .id(entries[index].id)
            }
            Spacer(minLength: 0)
            HStack {
                Text(index < entries.count ? entries[index].id : "done").font(.caption2).accessibilityIdentifier("preview-slug")
                Text("\(Int(rect.minX)),\(Int(rect.minY)),\(Int(rect.width)),\(Int(rect.height))")
                    .font(.caption2)
                    .accessibilityIdentifier("preview-rect")
                Spacer()
                Button("Next") { index += 1 }.accessibilityIdentifier("preview-next")
            }
            .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(theme.colors.bgCanvas.ignoresSafeArea())
        // Fixed time zone so the 09:41 sample date renders the same on every machine.
        .environment(\.timeZone, TimeZone(identifier: "UTC")!)
        .stanceToastHost()
        .onAppear { PreviewManifest.writeCatalogue() }
    }
}

/// Files the capture script reads from the app container: the inline catalogue and the
/// on-screen rect of the preview currently shown.
@MainActor
enum PreviewManifest {
    private static var documents: URL { FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0] }

    static func writeCatalogue() {
        let slugs = PreviewCatalog.inline.map(\.id).joined(separator: "\n")
        try? slugs.write(to: documents.appendingPathComponent("preview-slugs.txt"), atomically: true, encoding: .utf8)
    }

    static func write(slug: String, rect: CGRect) {
        let line = "\(slug) \(rect.minX) \(rect.minY) \(rect.width) \(rect.height)"
        try? line.write(to: documents.appendingPathComponent("preview-rect.txt"), atomically: true, encoding: .utf8)
    }
}

/// Text inputs in previews need real state: a secure field bound to a constant shows no bullets.
private struct Stateful<Value, Content: View>: View {
    @State private var value: Value
    private let content: (Binding<Value>) -> Content

    init(_ value: Value, @ViewBuilder content: @escaping (Binding<Value>) -> Content) {
        _value = State(initialValue: value)
        self.content = content
    }

    var body: some View { content($value) }
}

// MARK: Inline compositions

private struct ThemeModifierPreview: View {
    var body: some View {
        VStack(spacing: StanceSpacing.md) {
            ForEach([StanceAppearance.light, .dark, .highContrast], id: \.self) { appearance in
                HStack {
                    Text(appearance.title).stanceText(.label)
                    Spacer()
                    StanceBadge("Live", tone: .success)
                    StanceButton("Deploy", size: .small) {}
                }
                .padding(StanceSpacing.lg)
                .stanceTheme(appearance)
                .clipShape(RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
                .overlay { RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous).strokeBorder(.gray.opacity(0.35)) }
            }
        }
    }
}

private struct ScopedThemePreview: View {
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            Text("The page keeps its theme.").stanceText(.body)
            let inverted: StanceTheme.Mode = theme.isDark ? .light : .dark
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                Text("Roll out your new signature").stanceText(.subheading)
                Text("Deploy to every mailbox in one step.").stanceText(.bodySmall)
                StanceButton("Start rollout", pill: true) {}
            }
            .padding(StanceSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(StanceTheme(mode: inverted).tokens.colors.bgCanvas), in: RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous))
            .stanceScopedTheme(inverted)
        }
    }
}

private struct SurfacePreview: View {
    var body: some View {
        VStack(spacing: StanceSpacing.md) {
            ForEach([("surface", StanceSurfaceLevel.surface), ("subtle", .subtle), ("muted", .muted), ("raised", .raised)], id: \.0) { item in
                Text(item.0).stanceText(.label)
                    .frame(maxWidth: .infinity, minHeight: 52, alignment: .leading)
                    .padding(.horizontal, StanceSpacing.lg)
                    .stanceSurface(item.1, elevation: item.0 == "raised" ? .md : nil)
            }
        }
    }
}

private struct ShadowPreview: View {
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        HStack(spacing: StanceSpacing.lg) {
            ForEach([("sm", StanceElevation.sm), ("md", .md), ("lg", .lg), ("xl", .xl)], id: \.0) { item in
                Text(item.0).stanceText(.label)
                    .frame(maxWidth: .infinity, minHeight: 72)
                    .background(theme.colors.bgSurfaceRaised, in: RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
                    .stanceShadow(item.1)
            }
        }
        .padding(.vertical, StanceSpacing.lg)
    }
}

private struct ContainerPreview: View {
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        StanceContainer(maxWidth: 280) {
            Text("Content keeps a readable width and page gutters, and centres itself when the screen is wider.")
                .stanceText(.body)
                .padding(.vertical, StanceSpacing.lg)
        }
        .background(theme.colors.bgMuted, in: RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous)
                .strokeBorder(theme.colors.borderStrong, style: StrokeStyle(lineWidth: 1, dash: [4, 4]))
        }
    }
}

private struct IconPreview: View {
    private let icons: [StanceIconName] = [.signature, .send, .mail, .calendar, .users, .fileText, .search, .settings, .bell, .shield, .globe, .checkCircle, .alertTriangle, .download, .upload, .pencil, .trash, .lock]

    var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.lg) {
            StanceGrid(minItemWidth: 44, spacing: StanceSpacing.sm) {
                ForEach(icons, id: \.self) { StanceIcon($0, size: 24).frame(width: 44, height: 44) }
            }
            HStack(spacing: StanceSpacing.xl) {
                StanceIcon(.signature, size: 16)
                StanceIcon(.signature, size: 24)
                StanceIcon(.signature, size: 32)
                StanceIcon(.signature, size: 44)
            }
        }
        .stanceCard()
    }
}

private struct TouchTargetPreview: View {
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        HStack(spacing: StanceSpacing.xl) {
            ForEach(["xmark", "plus", "ellipsis"], id: \.self) { symbol in
                Image(systemName: symbol)
                    .stanceTouchTarget()
                    .overlay { Rectangle().strokeBorder(theme.colors.borderStrong, style: StrokeStyle(lineWidth: 1, dash: [3, 3])) }
            }
            Text("44 by 44 pt").stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
        }
        .stanceCard()
    }
}

private struct TextPreview: View {
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            Text("Signature template").stanceText(.eyebrow).foregroundStyle(theme.colors.fgMuted)
            Text("Contracts, signed").stanceText(.display)
            Text("Sales team signature").stanceText(.title)
            Text("Rollout").stanceText(.heading)
            Text("Deployed to 48 organisation users").stanceText(.body)
            Text("Changes appear after the next sync.").stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted)
            Text("Last deployed today at 09:41").stanceText(.caption).foregroundStyle(theme.colors.fgSubtle)
            Text("org_7Hk2").stanceText(.mono)
        }
        .stanceCard()
    }
}

private struct ListStylePreview: View {
    var body: some View {
        List {
            Section("Templates") {
                StanceListRow("Sales team signature", subtitle: "48 users") { EmptyView() } trailing: { StanceBadge("Live", tone: .success) }.stanceListRow()
                StanceListRow("Legal disclaimer", subtitle: "12 users") { EmptyView() } trailing: { StanceBadge("Draft") }.stanceListRow()
                StanceListRow("Support team", subtitle: "9 users").stanceListRow()
            }
        }
        .stanceListStyle()
        .scrollDisabled(true)
        .frame(height: 300)
        .clipShape(RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous))
    }
}

private struct DisclosurePreview: View {
    @State private var open = true
    @State private var closed = false

    var body: some View {
        VStack(spacing: 0) {
            DisclosureGroup("Advanced options", isExpanded: $open) {
                Toggle("Include legal disclaimer", isOn: .constant(true)).toggleStyle(.stance)
            }
            .disclosureGroupStyle(.stance)
            StanceDivider()
            DisclosureGroup("Relay settings", isExpanded: $closed) { Text("Exchange Online") }
                .disclosureGroupStyle(.stance)
        }
        .stanceCard(padding: StanceSpacing.md)
    }
}

private struct ToastPreview: View {
    var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            StanceListRow("Sales team signature", subtitle: "48 users") { EmptyView() } trailing: { StanceBadge("Live", tone: .success) }
                .stanceCard(padding: StanceSpacing.md)
            Spacer(minLength: 0)
        }
        .frame(height: 190)
        .modifier(ToastTrigger())
        .stanceToastHost()
    }

    private struct ToastTrigger: ViewModifier {
        func body(content: Content) -> some View {
            content.overlay { Shower() }
        }
    }

    /// Shows a toast as soon as the host is available.
    private struct Shower: View {
        @Environment(StanceToastCenter.self) private var toasts

        var body: some View {
            Color.clear.onAppear {
                toasts.autoDismiss = false
                toasts.show("Template saved and deployed", tone: .success)
            }
        }
    }
}

private struct SignaturePreview: View {
    @State private var signature = StanceSignature(strokes: SignaturePreview.sample)

    var body: some View {
        StanceSignatureCanvas(signature: $signature) {
            StanceTextField("Or type your full name", text: .constant(""), placeholder: "Priya Nair")
        }
        .stanceCard()
    }

    /// A handwritten-style stroke so the canvas is shown in use.
    static let sample: [[CGPoint]] = {
        var stroke: [CGPoint] = []
        for step in 0 ... 120 {
            let t = Double(step) / 120
            let x = 40 + t * 220
            let y = 96 - sin(t * .pi * 5) * (34 - t * 22) - sin(t * .pi * 1.2) * 14
            stroke.append(CGPoint(x: x, y: y))
        }
        let underline = stride(from: 0.0, through: 1.0, by: 0.05).map { CGPoint(x: 70 + $0 * 170, y: 132 - sin($0 * .pi) * 6) }
        return [stroke, underline]
    }()
}

// MARK: Screen compositions

/// A page behind a system presentation, so the capture shows the presentation in context.
private struct ScreenBackdrop<Overlay: View>: View {
    let title: String
    @ViewBuilder let trigger: Overlay

    var body: some View {
        NavigationStack {
            Page(title: title) {
                StanceCard("Sales team signature", description: "Deployed to 48 organisation users") {
                    StanceProgressView("Mailboxes updated", value: 0.72)
                    trigger
                }
            }
        }
    }
}

private struct MenuScreen: View {
    var body: some View {
        ScreenBackdrop(title: "Templates") {
            HStack {
                StanceBadge("Live", tone: .success)
                Spacer()
                StanceMenu("More") {
                    Button("Rename", systemImage: "pencil") {}
                    Button("Duplicate", systemImage: "doc.on.doc") {}
                    Button("Assign users", systemImage: "person.2") {}
                    Divider()
                    Button("Delete template", systemImage: "trash", role: .destructive) {}
                }
                .accessibilityIdentifier("preview-trigger")
            }
        }
    }
}

private struct SheetScreen: View {
    @State private var shown = false
    @State private var name = "Sales team signature"

    var body: some View {
        ScreenBackdrop(title: "Templates") {
            StanceButton("Rename", variant: .outline) { shown = true }.accessibilityIdentifier("preview-trigger")
        }
        .stanceSheet("Rename template", isPresented: $shown, detents: [.medium]) {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceTextField("Template name", text: $name, helper: "Visible to everyone in your organisation.", isRequired: true)
                Toggle("Apply to new members", isOn: .constant(true)).toggleStyle(.stance)
                StanceButton("Save", fullWidth: true) { shown = false }
            }
        }
    }
}

private struct AlertScreen: View {
    @State private var confirmation: StanceConfirmation?

    var body: some View {
        ScreenBackdrop(title: "Templates") {
            StanceButton("Deploy", leadingIcon: .send) {
                confirmation = .init(title: "Deploy to 48 mailboxes?", message: "People will see the new signature after the next sync.", confirmTitle: "Deploy")
            }
            .accessibilityIdentifier("preview-trigger")
        }
        .stanceAlert($confirmation) {}
    }
}

private struct ConfirmationScreen: View {
    @State private var confirmation: StanceConfirmation?

    var body: some View {
        ScreenBackdrop(title: "Templates") {
            StanceButton("Delete template", variant: .danger, leadingIcon: .trash) {
                confirmation = .init(title: "Delete “Sales team signature”?", message: "This cannot be undone.", confirmTitle: "Delete template", isDestructive: true)
            }
            .accessibilityIdentifier("preview-trigger")
        }
        .stanceConfirmationDialog($confirmation) {}
    }
}

private struct NavigationChromeScreen: View {
    var body: some View {
        TabView {
            NavigationStack {
                Page(title: "Templates") {
                    StanceListRow("Sales team signature", subtitle: "48 users") { EmptyView() } trailing: { StanceBadge("Live", tone: .success) }
                        .stanceCard(padding: StanceSpacing.md)
                    StanceListRow("Legal disclaimer", subtitle: "12 users") { EmptyView() } trailing: { StanceBadge("Draft") }
                        .stanceCard(padding: StanceSpacing.md)
                }
                .toolbar {
                    ToolbarItem(placement: .primaryAction) { Button("New", systemImage: "plus") {} }
                }
            }
            .tabItem { Label("Templates", systemImage: "signature") }
            Text("Users").tabItem { Label("Users", systemImage: "person.2") }
            Text("Settings").tabItem { Label("Settings", systemImage: "gearshape") }
        }
        .stanceNavigationChrome()
    }
}

private struct SearchableScreen: View {
    struct Person: Identifiable {
        let name: String
        let role: String
        var id: String { name }
    }

    private let people = [
        Person(name: "Amara Okafor", role: "Legal"), Person(name: "Hana Sato", role: "Finance"), Person(name: "Lukas Brenner", role: "Sales"),
        Person(name: "Owen Price", role: "Operations"), Person(name: "Priya Nair", role: "Admin"), Person(name: "Tomás Ruiz", role: "Sales"),
    ]

    var body: some View {
        NavigationStack {
            StanceSearchableList(people, prompt: "Search organisation users", matches: { $0.name.localizedCaseInsensitiveContains($1) }) { person in
                StanceListRow(person.name, subtitle: person.role) { StanceAvatar(name: person.name) }
            }
            .navigationTitle("Organisation users")
        }
    }
}

private struct DocumentScreen: View {
    var body: some View {
        StanceDocumentPreview(url: Self.samplePDF).ignoresSafeArea()
    }

    /// A one-page sample contract, drawn at launch so the preview needs no bundled file.
    static let samplePDF: URL = {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("Master services agreement.pdf")
        let page = CGRect(x: 0, y: 0, width: 595, height: 842)
        let renderer = UIGraphicsPDFRenderer(bounds: page)
        let ink = UIColor(red: StanceTokens.Brand.indigo.red, green: StanceTokens.Brand.indigo.green, blue: StanceTokens.Brand.indigo.blue, alpha: 1)
        try? renderer.writePDF(to: url) { context in
            context.beginPage()
            let title: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 26, weight: .semibold), .foregroundColor: ink]
            let body: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 12), .foregroundColor: ink]
            ("Master services agreement" as NSString).draw(at: CGPoint(x: 56, y: 64), withAttributes: title)
            ("Between Binds d.o.o. and Acme Ltd. Draft 3, 11 November 2026." as NSString).draw(at: CGPoint(x: 56, y: 104), withAttributes: body)
            let clauses = [
                "1. Services. Binds will provide the signature management services described in Schedule A.",
                "2. Term. This agreement starts on the effective date and continues for twelve months.",
                "3. Fees. The customer pays the fees in Schedule B within thirty days of each invoice.",
                "4. Confidentiality. Each party protects the other party's confidential information.",
                "5. Data protection. Binds processes personal data only on the customer's instructions.",
                "6. Liability. Each party's total liability is limited to the fees paid in the prior year.",
            ]
            for (index, clause) in clauses.enumerated() {
                (clause as NSString).draw(in: CGRect(x: 56, y: 150 + CGFloat(index) * 44, width: 483, height: 40), withAttributes: body)
            }
            ink.setStroke()
            let line = UIBezierPath()
            line.move(to: CGPoint(x: 56, y: 520))
            line.addLine(to: CGPoint(x: 280, y: 520))
            line.stroke()
            ("Signed for Binds" as NSString).draw(at: CGPoint(x: 56, y: 528), withAttributes: body)
        }
        return url
    }()
}
