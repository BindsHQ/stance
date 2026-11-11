import StanceUI
import SwiftUI

enum ComponentCategory: String, CaseIterable, Identifiable, Hashable {
    case actions, forms, dataDisplay, feedback, overlays, navigation, advanced

    var id: String { rawValue }

    var title: String {
        switch self {
        case .actions: "Actions"
        case .forms: "Forms"
        case .dataDisplay: "Data display"
        case .feedback: "Feedback"
        case .overlays: "Overlays"
        case .navigation: "Navigation"
        case .advanced: "Advanced"
        }
    }

    var summary: String {
        switch self {
        case .actions: "Buttons, icon buttons, groups and menus"
        case .forms: "Text fields, pickers, checkboxes, switches and sliders"
        case .dataDisplay: "Cards, badges, avatars, progress, timelines and lists"
        case .feedback: "Alerts, banners, toasts, loading and error states"
        case .overlays: "Sheets, alerts and confirmation dialogs"
        case .navigation: "Steppers, page indicators and adaptive navigation"
        case .advanced: "Filters, calendar, signature and attachments"
        }
    }

    var icon: StanceIconName {
        switch self {
        case .actions: .zap
        case .forms: .pencil
        case .dataDisplay: .layoutGrid
        case .feedback: .bell
        case .overlays: .panelLeft
        case .navigation: .arrowUpRight
        case .advanced: .sparkle
        }
    }

    /// `-category <name>` opens a category directly (used for screenshots and UI tests).
    static var initial: ComponentCategory? {
        let args = ProcessInfo.processInfo.arguments
        guard let i = args.firstIndex(of: "-category"), i + 1 < args.count else { return nil }
        return ComponentCategory(rawValue: args[i + 1])
    }
}

struct ComponentsView: View {
    /// Set from `-category` so screenshots and UI tests can open a category directly.
    @State private var deepLink = ComponentCategory.initial
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        // The enclosing NavigationStack comes from StanceAdaptiveNavigation; links push onto it.
        Page(title: "Components") {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                Text("Native SwiftUI components on Stance tokens.").stanceText(.bodyLarge)
                Text("System controls are wrapped, not replaced.").stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted)
            }
            VStack(spacing: StanceSpacing.md) {
                ForEach(ComponentCategory.allCases) { category in
                    NavigationLink(value: category) {
                        StanceListRow(category.title, subtitle: category.summary) {
                            StanceIcon(category.icon, size: 22)
                                .frame(width: 44, height: 44)
                                .background(theme.colors.bgMuted, in: RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous))
                        } trailing: {
                            StanceIcon(.chevronRight, size: 16).foregroundStyle(theme.colors.fgSubtle)
                        }
                        .stanceCard(padding: StanceSpacing.md)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("category-\(category.rawValue)")
                }
            }
        }
        .navigationDestination(for: ComponentCategory.self) { $0.destination }
        .navigationDestination(item: $deepLink) { $0.destination }
    }
}

extension ComponentCategory {
    @MainActor @ViewBuilder var destination: some View {
        switch self {
        case .actions: ActionsDemo()
        case .forms: FormsDemo()
        case .dataDisplay: DataDisplayDemo()
        case .feedback: FeedbackDemo()
        case .overlays: OverlaysDemo()
        case .navigation: NavigationDemo()
        case .advanced: AdvancedDemo()
        }
    }
}

struct ActionsDemo: View {
    @State private var loading = false

    var body: some View {
        Page(title: "Actions") {
            StanceSection("Variants", caption: "Use one primary action per screen.") {
                VStack(alignment: .leading, spacing: StanceSpacing.md) {
                    StanceButton("Deploy signature", leadingIcon: .send, fullWidth: true) {}
                    StanceButton("Save draft", variant: .secondary, fullWidth: true) {}
                    StanceButton("Preview", variant: .outline, fullWidth: true) {}
                    StanceButtonGroup {
                        StanceButton("Cancel", variant: .ghost) {}
                        StanceButton("Delete template", variant: .danger, leadingIcon: .trash) {}
                    }
                    StanceButton("Learn about deployments", variant: .link, trailingIcon: .arrowRight) {}
                }
                .stanceCard()
            }
            StanceSection("Sizes and states") {
                VStack(alignment: .leading, spacing: StanceSpacing.md) {
                    StanceButtonGroup {
                        StanceButton("Small", size: .small) {}
                        StanceButton("Medium") {}
                        StanceButton("Large", size: .large) {}
                    }
                    StanceButtonGroup {
                        StanceButton(loading ? "Publishing" : "Publish", isLoading: loading) {
                            loading = true
                            Task { try? await Task.sleep(for: .seconds(2)); loading = false }
                        }
                        StanceButton("Disabled") {}.disabled(true)
                        StanceButton("Let’s talk", pill: true) {}
                    }
                }
                .stanceCard()
            }
            StanceSection("Icon buttons and menus", caption: "Icon buttons always carry an accessibility label.") {
                HStack(spacing: StanceSpacing.sm) {
                    StanceIconButton(.pencil, label: "Edit template") {}
                    StanceIconButton(.copy, label: "Duplicate template", variant: .outline) {}
                    StanceIconButton(.trash, label: "Delete template", variant: .secondary) {}
                    Spacer()
                    StanceMenu("More") {
                        Button("Rename", systemImage: "pencil") {}
                        Button("Duplicate", systemImage: "doc.on.doc") {}
                        Divider()
                        Button("Delete", systemImage: "trash", role: .destructive) {}
                    }
                }
                .stanceCard()
            }
        }
    }
}

struct FormsDemo: View {
    @State private var name = "Sales team signature"
    @State private var email = "priya.nair@"
    @State private var key = "sk_live_2f9a"
    @State private var notes = "Use the 2026 logo and the Ljubljana office address."
    @State private var query = ""
    @State private var role = "member"
    @State private var plan = "team"
    @State private var auto = true
    @State private var notify = false
    @State private var size = 64.0
    @State private var date = Date(timeIntervalSince1970: 1_794_355_200)

    var body: some View {
        Page(title: "Forms") {
            StanceSection("Text input", caption: "Labels stay visible; errors are announced.") {
                VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                    StanceTextField("Template name", text: $name, helper: "Visible to everyone in your organisation.", isRequired: true)
                    StanceTextField("Reply-to email", text: $email, error: "Enter a complete email address.", leadingIcon: .mail)
                    StanceSecureField("Relay API key", text: $key, helper: "Stored in the keychain.")
                    StanceTextEditor("Notes", text: $notes, limit: 200)
                    StanceSearchField("Search organisation users", text: $query)
                }
                .stanceCard()
            }
            StanceSection("Selection") {
                VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                    StancePicker("Plan", selection: $plan, options: [("free", "Free"), ("team", "Team"), ("business", "Business")])
                    StanceRadioGroup("Role", selection: $role, options: [
                        .init("admin", label: "Admin", description: "Manages templates, users and integrations"),
                        .init("member", label: "Member", description: "Uses assigned signatures"),
                    ])
                    StanceCheckbox("Apply to new members automatically", description: "People added later get this signature.", isOn: $auto)
                    StanceCheckbox("Email me when a deployment fails", isOn: $notify)
                    Toggle("Auto-deploy on save", isOn: $auto).toggleStyle(.stance)
                    StanceSlider("Logo width", value: $size, in: 24 ... 160, step: 4) { "\(Int($0)) pt" }
                    StanceDatePicker("Deploy on", selection: $date)
                    StanceDatePicker("At", selection: $date, displayedComponents: .hourAndMinute)
                }
                .stanceCard()
            }
            StanceSection("Disabled") {
                VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                    StanceTextField("Organisation ID", text: .constant("org_7Hk2"))
                    StanceCheckbox("Managed by your administrator", isOn: .constant(true))
                }
                .disabled(true)
                .stanceCard()
            }
        }
    }
}

struct DataDisplayDemo: View {
    var body: some View {
        Page(title: "Data display") {
            StanceGrid(minItemWidth: 150) {
                StanceStatCard("Deployments", value: "1,284", change: 0.12)
                StanceStatCard("Failed", value: "3", change: -0.5)
            }
            StanceCard("Sales team signature", description: "Deployed to 48 organisation users", elevated: true) {
                HStack(spacing: StanceSpacing.sm) {
                    StanceBadge("Live", tone: .success)
                    StanceBadge("Draft")
                    StanceBadge("Pending", tone: .warning)
                    StanceBadge("Failed", tone: .danger)
                }
                StanceProgressView("Mailboxes updated", value: 0.72)
                HStack {
                    StanceAvatarGroup(names: ["Amara Okafor", "Lukas Brenner", "Priya Nair", "Tomás Ruiz", "Hana Sato", "Owen Price"])
                    Spacer()
                    StanceProgressView("Rollout", value: 0.72, shape: .circular)
                }
            } footer: {
                StanceDescriptionList([("Owner", "Priya Nair"), ("Last updated", "3 minutes ago"), ("Relay", "Exchange Online")])
            }
            StanceSection("Tags and avatars") {
                VStack(alignment: .leading, spacing: StanceSpacing.md) {
                    HStack { StanceTag("Sales") {}; StanceTag("Legal") {}; StanceTag("Read only") }
                    HStack(spacing: StanceSpacing.md) {
                        StanceAvatar(name: "Priya Nair", size: .small)
                        StanceAvatar(name: "Lukas Brenner")
                        StanceAvatar(name: "Hana Sato", size: .large)
                    }
                }
                .stanceCard()
            }
            StanceSection("Timeline") {
                StanceTimeline([
                    .init(id: "1", title: "Deployed to 48 mailboxes", detail: "Exchange relay confirmed delivery", time: "Today, 09:41", tone: .success),
                    .init(id: "2", title: "Template updated", detail: "Logo and address changed", time: "Yesterday, 17:20"),
                    .init(id: "3", title: "Deployment failed", detail: "Relay was offline", time: "9 Nov, 08:02", tone: .danger),
                ])
                .stanceCard()
            }
            StanceSection("Loading and empty") {
                VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                    HStack(spacing: StanceSpacing.md) {
                        StanceSkeleton(.circle, height: 40)
                        VStack(alignment: .leading, spacing: StanceSpacing.sm) { StanceSkeleton(width: 160); StanceSkeleton(width: 100, height: 10) }
                    }
                }
                .stanceCard()
                StanceEmptyState(icon: .signature, title: "No templates yet", message: "Create a signature template to deploy it to your organisation.") {
                    StanceButton("New template", leadingIcon: .plus) {}
                }
                .stanceSurface(.subtle, cornerRadius: StanceRadius.xl)
            }
        }
    }
}

struct FeedbackDemo: View {
    @Environment(StanceToastCenter.self) private var toasts
    @State private var bannerVisible = true

    var body: some View {
        Page(title: "Feedback") {
            if bannerVisible {
                StanceBanner("Scheduled maintenance on Sunday at 02:00.", actionTitle: "Details", action: {}, onDismiss: { bannerVisible = false })
                    .clipShape(RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
            }
            StanceSection("Inline alerts", caption: "Tone is always paired with an icon and text.") {
                StanceInlineAlert("Signatures sync every 15 minutes", message: "Changes appear in Outlook after the next sync.")
                StanceInlineAlert("Deployment complete", message: "48 mailboxes updated.", tone: .success)
                StanceInlineAlert("Relay offline", message: "Deployments will resume when the connector is back.", tone: .warning) {
                    StanceButton("Check status", variant: .outline, size: .small) {}
                }
                StanceInlineAlert("Deployment failed", message: "3 mailboxes rejected the signature.", tone: .danger)
            }
            StanceSection("Toasts", caption: "Queued, announced to VoiceOver and dismissible.") {
                StanceButtonGroup {
                    StanceButton("Saved", variant: .outline) { toasts.show("Template saved", tone: .success) }
                    StanceButton("Error", variant: .outline) { toasts.show("Could not reach the relay", tone: .danger) }
                }
            }
            StanceSection("States") {
                StanceLoadingState("Loading organisation users").frame(height: 140).stanceSurface(.subtle, cornerRadius: StanceRadius.xl)
                StanceErrorState(message: "We could not load your templates. Check your connection.") {}
                    .stanceSurface(.subtle, cornerRadius: StanceRadius.xl)
            }
        }
    }
}

struct OverlaysDemo: View {
    @State private var sheet = false
    @State private var alert: StanceConfirmation?
    @State private var dialog: StanceConfirmation?
    @State private var name = "Sales team signature"
    @Environment(StanceToastCenter.self) private var toasts

    var body: some View {
        Page(title: "Overlays") {
            StanceSection("Native presentations", caption: "Sheets, alerts and dialogs are the system’s own, themed with Stance.") {
                VStack(alignment: .leading, spacing: StanceSpacing.md) {
                    StanceButton("Rename in a sheet", variant: .outline, fullWidth: true) { sheet = true }
                    StanceButton("Confirm with an alert", variant: .outline, fullWidth: true) {
                        alert = .init(title: "Deploy to 48 mailboxes?", message: "People will see the new signature after the next sync.", confirmTitle: "Deploy")
                    }
                    StanceButton("Delete with a confirmation dialog", variant: .danger, fullWidth: true) {
                        dialog = .init(title: "Delete “Sales team signature”?", message: "This cannot be undone.", confirmTitle: "Delete template", isDestructive: true)
                    }
                }
                .stanceCard()
            }
        }
        .stanceSheet("Rename template", isPresented: $sheet, detents: [.medium]) {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceTextField("Template name", text: $name, isRequired: true)
                StanceButton("Save", fullWidth: true) { sheet = false; toasts.show("Template renamed", tone: .success) }
            }
        }
        .stanceAlert($alert) { toasts.show("Deployment started") }
        .stanceConfirmationDialog($dialog) { toasts.show("Template deleted") }
    }
}

struct NavigationDemo: View {
    @State private var step = 1
    @State private var page = 0

    var body: some View {
        Page(title: "Navigation") {
            StanceSection("Stepper") {
                VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                    StanceStepper(steps: ["Choose a template", "Customise details", "Assign users", "Deploy"], current: step)
                    StanceButtonGroup {
                        StanceButton("Back", variant: .outline) { step = max(0, step - 1) }
                        StanceButton("Continue") { step = min(3, step + 1) }
                    }
                }
                .stanceCard()
            }
            StanceSection("Page indicator") {
                VStack(spacing: StanceSpacing.md) {
                    StancePageIndicator(count: 4, current: page)
                    StanceButton("Next page", variant: .ghost) { page = (page + 1) % 4 }
                }
                .frame(maxWidth: .infinity)
                .stanceCard()
            }
            StanceInlineAlert("Adaptive navigation", message: "This app uses StanceAdaptiveNavigation: a tab bar on iPhone and a sidebar on iPad, both the system’s own.")
        }
    }
}

struct AdvancedDemo: View {
    @State private var filters: Set<String> = ["live"]
    @State private var date = Date(timeIntervalSince1970: 1_794_355_200)
    @State private var signature = StanceSignature()
    @State private var typed = ""
    @State private var picked = "Nothing attached"

    var body: some View {
        Page(title: "Advanced") {
            StanceSection("Filter bar") {
                StanceFilterBar(filters: [.init(id: "live", title: "Live"), .init(id: "draft", title: "Draft"), .init(id: "failed", title: "Failed"), .init(id: "mine", title: "Owned by me")], selection: $filters)
                    .padding(.horizontal, -StanceSpacing.lg)
            }
            StanceSection("Calendar", caption: "The system date picker in Stance colours.") {
                StanceCalendar("Deployment date", selection: $date)
            }
            StanceSection("Signature", caption: "Finger or Apple Pencil, with a typed alternative.") {
                StanceSignatureCanvas(signature: $signature) {
                    StanceTextField("Or type your full name", text: $typed)
                }
                .stanceCard()
            }
            StanceSection("Attachments", caption: "System pickers: no photo library permission is requested.") {
                VStack(alignment: .leading, spacing: StanceSpacing.md) {
                    StanceAttachmentPicker { attachment in
                        switch attachment {
                        case let .file(url): picked = url.lastPathComponent
                        case let .imageData(data): picked = "Photo, \(data.count / 1024) KB"
                        }
                    }
                    Text(picked).stanceText(.bodySmall)
                }
                .stanceCard()
            }
        }
    }
}
