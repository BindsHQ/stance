import SwiftUI
import Testing
@testable import StanceUI

/// Renders real views off-screen in every theme and at the largest accessibility text size.
/// These catch layout crashes and views that collapse to nothing.
@Suite("Rendering")
@MainActor
struct RenderingTests {
    struct Gallery: View {
        @State private var text = "Sales team signature"
        @State private var on = true
        @State private var value = 40.0
        @State private var role = "admin"
        @State private var filters: Set<String> = ["live"]
        @State private var signature = StanceSignature()

        var body: some View {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceSection("Template", caption: "Deployed to 48 organisation users") {
                    StanceButtonGroup {
                        StanceButton("Deploy", leadingIcon: .send) {}
                        StanceButton("Preview", variant: .outline) {}
                        StanceButton("Delete", variant: .danger, isLoading: true) {}
                        StanceIconButton(.moreHorizontal, label: "More actions") {}
                    }
                    StanceTextField("Template name", text: $text, helper: "Visible to your organisation", isRequired: true)
                    StanceTextField("Reply-to", text: .constant(""), error: "Enter a valid email address")
                    StanceSecureField("API key", text: .constant("secret"))
                    StanceCheckbox("Apply to new members", description: "Members added later get this signature", isOn: $on)
                    StanceRadioGroup("Role", selection: $role, options: [.init("admin", label: "Admin"), .init("member", label: "Member", description: "Can use templates")])
                    Toggle("Auto-deploy", isOn: $on).toggleStyle(.stance)
                    StanceSlider("Logo size", value: $value)
                    StanceFilterBar(filters: [.init(id: "live", title: "Live"), .init(id: "draft", title: "Draft")], selection: $filters)
                }
                StanceCard("Rollout", description: "Exchange relay") {
                    StanceProgressView("Mailboxes updated", value: 0.72)
                    HStack { StanceBadge("Live", tone: .success); StanceTag("Sales") {}; StanceAvatarGroup(names: ["Priya Nair", "Lukas Brenner", "Hana Sato", "Owen Price", "Amara Okafor"]) }
                } footer: {
                    StanceDescriptionList([("Owner", "Priya Nair"), ("Updated", "3 minutes ago")])
                }
                StanceInlineAlert("Relay offline", message: "Deployments will resume when the connector is back.", tone: .warning)
                StanceBanner("A new version is available", actionTitle: "Update", action: {}, onDismiss: {})
                StanceTimeline([.init(id: "1", title: "Deployed", detail: "48 mailboxes", time: "09:41", tone: .success), .init(id: "2", title: "Created", time: "Yesterday")])
                StanceStepper(steps: ["Choose template", "Customise", "Deploy"], current: 1)
                StanceStatCard("Deployments", value: "1,284", change: 0.12)
                StanceEmptyState(title: "No templates yet", message: "Create your first signature template.") { StanceButton("New template") {} }
                StanceSignatureCanvas(signature: $signature)
                StancePageIndicator(count: 4, current: 1)
                StanceSkeleton(.rectangle, height: 40)
            }
            .padding()
            .frame(width: 390)
        }
    }

    @Test("Gallery renders in every theme at default and accessibility text sizes",
          arguments: StanceTheme.Mode.allCases, [DynamicTypeSize.large, .accessibility3])
    func renders(mode: StanceTheme.Mode, size: DynamicTypeSize) throws {
        let theme = StanceTheme(mode: mode)
        let renderer = ImageRenderer(content:
            Gallery()
                .environment(\.stanceTheme, theme)
                .environment(\.dynamicTypeSize, size)
                .foregroundStyle(theme.colors.fgDefault)
                .background(theme.colors.bgCanvas)
        )
        renderer.scale = 1
        let image = try #require(renderer.cgImage)
        #expect(image.width == 390)
        #expect(image.height > 1200)
    }

    @Test("Layout grows with text size instead of clipping")
    func reflows() throws {
        func height(_ size: DynamicTypeSize) throws -> Int {
            let r = ImageRenderer(content: Gallery().environment(\.dynamicTypeSize, size))
            r.scale = 1
            return try #require(r.cgImage).height
        }
        #expect(try height(.accessibility3) > height(.large))
    }

    @Test("Interactive controls keep the 44pt minimum target")
    func targets() throws {
        func size<V: View>(_ view: V) throws -> CGSize {
            let r = ImageRenderer(content: view.environment(\.stanceTheme, .light))
            r.scale = 1
            let image = try #require(r.cgImage)
            return CGSize(width: image.width, height: image.height)
        }
        #expect(try size(StanceButton("Save", size: .small) {}).height >= 44)
        #expect(try size(StanceIconButton(.x, label: "Close") {}).height >= 44)
        #expect(try size(StanceIconButton(.x, label: "Close") {}).width >= 44)
        #expect(try size(StanceCheckbox("Accept", isOn: .constant(true)).frame(width: 300)).height >= 44)
        #expect(try size(StanceTextField("Name", text: .constant("")).frame(width: 300)).height >= 44)
    }
}
