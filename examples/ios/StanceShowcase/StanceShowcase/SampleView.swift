import StanceUI
import SwiftUI

/// A composed screen with realistic content: signature template settings.
struct SampleView: View {
    @State private var name = "Sales team signature"
    @State private var domain = "binds.si"
    @State private var autoApply = true
    @State private var showAssign = false
    @State private var confirmDeploy: StanceConfirmation?
    @State private var assigned: Set<String> = ["Priya Nair", "Lukas Brenner"]
    @Environment(StanceToastCenter.self) private var toasts
    @Environment(\.stanceTheme) private var theme

    private let people = ["Amara Okafor", "Hana Sato", "Lukas Brenner", "Owen Price", "Priya Nair", "Tomás Ruiz"]

    var body: some View {
        Page(title: "Template") {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                HStack {
                    Text("Signature template").stanceText(.eyebrow).foregroundStyle(theme.colors.fgMuted)
                    Spacer()
                    StanceBadge("Live", tone: .success)
                }
                Text(name.isEmpty ? "Untitled template" : name).stanceText(.title)
                Text("Deployed to 48 organisation users").stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted)
            }
            StanceCard("Details") {
                StanceTextField("Template name", text: $name, error: name.isEmpty ? "Give the template a name." : nil, isRequired: true)
                StanceTextField("Reply-to domain", text: $domain, helper: "Used for every signature link.", leadingIcon: .globe)
                Toggle("Apply to new members automatically", isOn: $autoApply).toggleStyle(.stance)
            }
            StanceCard("Rollout", description: "Exchange relay") {
                StanceProgressView("Mailboxes updated", value: 0.72)
                HStack {
                    StanceAvatarGroup(names: Array(assigned).sorted() + ["Amara Okafor", "Hana Sato", "Owen Price"])
                    Spacer()
                    StanceButton("Assign users", variant: .outline, size: .small) { showAssign = true }
                }
            } footer: {
                StanceDescriptionList([("Owner", "Priya Nair"), ("Last deployed", "Today, 09:41")])
            }
            StanceButtonGroup {
                StanceButton("Preview", variant: .ghost) { toasts.show("Preview sent to your inbox") }
                StanceButton("Deploy", leadingIcon: .send) {
                    confirmDeploy = .init(title: "Deploy to 48 mailboxes?", message: "People will see the new signature after the next sync.", confirmTitle: "Deploy")
                }
                .disabled(name.isEmpty)
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .stanceSheet("Assign users", isPresented: $showAssign) {
            VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                ForEach(people, id: \.self) { person in
                    StanceCheckbox(person, isOn: Binding(
                        get: { assigned.contains(person) },
                        set: { if $0 { assigned.insert(person) } else { assigned.remove(person) } }
                    ))
                }
                StanceButton("Done", fullWidth: true) { showAssign = false; toasts.show("\(assigned.count) users assigned", tone: .success) }
                    .padding(.top, StanceSpacing.md)
            }
        }
        .stanceAlert($confirmDeploy) { toasts.show("Deployment started", tone: .success) }
    }
}
