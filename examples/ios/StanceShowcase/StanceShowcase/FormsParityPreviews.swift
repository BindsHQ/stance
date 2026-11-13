import StanceUI
import SwiftUI

/// Preview compositions for the native parity form components, keyed by `components.json` slug.
/// `PreviewCatalog.all` appends these to the other entries.
@MainActor
enum FormsParityPreviewCatalog {
    typealias Entry = PreviewCatalog.Entry

    static let entries: [Entry] = [
        Entry("stance-range-slider") {
            FormsState(1500.0 ... 6000.0) { range in
                VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                    StanceRangeSlider("Contract value", value: range, in: 0 ... 10000, step: 500, minimumStepsBetween: 1) {
                        $0.formatted(.currency(code: "EUR").precision(.fractionLength(0)))
                    }
                    FormsCaption("12 contracts in this range")
                }
                .stanceCard()
            }
        },
        Entry("stance-pin-field") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                FormsState("4829") { StancePinField("Verification code", code: $0, helper: "Sent to priya.nair@binds.si") }
                FormsState("1234") { StancePinField("Signing PIN", code: $0, length: 4, isMasked: true, error: "That PIN is not correct.") }
            }
            .stanceCard()
        },
        Entry("stance-number-field") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                FormsState(48.0) { StanceNumberField("Licence seats", value: $0, min: 1, max: 500, suffix: "seats", helper: "Billed monthly per seat.") }
                FormsState(7.5) { StanceNumberField("Reminder interval", value: $0, min: 0.5, max: 30, step: 0.5, precision: 1, suffix: "days") }
                FormsState(Double?.none) { StanceNumberField("Spending limit", value: $0, min: 0, prefix: "€", placeholder: "No limit", helper: "Leave empty for no limit.") }
            }
            .stanceCard()
        },
        Entry("stance-combobox") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                FormsState(Optional("priya")) { StanceCombobox("Template owner", selection: $0, options: FormsSample.people, helper: "Owners can edit and deploy.") }
                FormsState(String?.none) { StanceCombobox("Approver", selection: $0, options: FormsSample.people, placeholder: "Choose a person", isRequired: true) }
                FormsState(Optional("Partners")) { StanceCombobox("Team", selection: $0, options: FormsSample.departments, helper: "Pick a team or type a new one.", custom: .text) }
            }
            .stanceCard()
        },
        Entry("stance-multi-select") {
            FormsState(Set(["sales", "legal", "Partners"])) {
                StanceMultiSelect("Departments", selection: $0, options: FormsSample.departments, helper: "Choose teams, or type a new one to create it.", custom: .text)
            }
            .stanceCard()
        },
        Entry("stance-checkbox-group") {
            FormsState(Set(["email", "teams"])) {
                StanceCheckboxGroup("Notify when a deployment finishes", selection: $0, options: FormsSample.channels, helper: "Admins are always notified.", showsSelectAll: true)
            }
            .stanceCard()
        },
        Entry("stance-date-range-picker") {
            FormsState(PreviewData.date ... PreviewData.date.addingTimeInterval(13 * 86400)) {
                StanceDateRangePicker("Campaign window", range: $0, presets: FormsSample.presets, helper: "The banner shows in signatures during these dates.")
            }
            .stanceCard()
        },
        Entry("stance-time-picker") {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                FormsState(PreviewData.date) { StanceTimePicker("Deploy at", selection: $0, helper: "Signatures update at this time each day.") }
                StanceDivider()
                FormsState(PreviewData.date.addingTimeInterval(8 * 3600)) { StanceTimePicker("Quiet hours end", selection: $0) }
            }
            .stanceCard()
        },
        Entry("stance-inline-edit") {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                FormsCaption("Template name")
                FormsState("Sales team signature") { StanceInlineEdit("Template name", text: $0) }
                FormsCaption("Description")
                FormsState("") { StanceInlineEdit("Description", text: $0, placeholder: "Add a description") }
            }
            .stanceCard()
        },
    ]
}

/// Sample content shared by the form previews and the demo.
enum FormsSample {
    static let people: [StanceSelectOption<String>] = [
        .init("amara", label: "Amara Okafor", detail: "Legal"),
        .init("hana", label: "Hana Sato", detail: "Finance"),
        .init("lukas", label: "Lukas Brenner", detail: "Sales"),
        .init("owen", label: "Owen Price", detail: "Operations"),
        .init("priya", label: "Priya Nair", detail: "Admin"),
        .init("tomas", label: "Tomás Ruiz", detail: "Sales"),
    ]

    static let departments: [StanceSelectOption<String>] = [
        .init("sales", label: "Sales"), .init("legal", label: "Legal"), .init("finance", label: "Finance"),
        .init("support", label: "Support"), .init("operations", label: "Operations"), .init("marketing", label: "Marketing"),
    ]

    static let channels: [StanceSelectOption<String>] = [
        .init("email", label: "Email", detail: "To the template owner"),
        .init("teams", label: "Microsoft Teams", detail: "In the Signatures channel"),
        .init("push", label: "Push notification", detail: "On this device"),
    ]

    static var presets: [StanceDateRangePreset] {
        [
            .init("Next 7 days", range: PreviewData.date ... PreviewData.date.addingTimeInterval(6 * 86400)),
            .init("Next 30 days", range: PreviewData.date ... PreviewData.date.addingTimeInterval(29 * 86400)),
        ]
    }
}

/// A muted caption in the active theme.
private struct FormsCaption: View {
    let text: String
    @Environment(\.stanceTheme) private var theme

    init(_ text: String) { self.text = text }

    var body: some View { Text(text).stanceText(.caption).foregroundStyle(theme.colors.fgMuted) }
}

/// Holds real state for a preview, so fields respond as they would in an app.
private struct FormsState<Value, Content: View>: View {
    @State private var value: Value
    private let content: (Binding<Value>) -> Content

    init(_ value: Value, @ViewBuilder content: @escaping (Binding<Value>) -> Content) {
        _value = State(initialValue: value)
        self.content = content
    }

    var body: some View { content($value) }
}

/// Interactive examples of the native parity form components, for the Forms category.
struct FormsParityDemo: View {
    @State private var range = 1500.0 ... 6000.0
    @State private var code = ""
    @State private var seats = 48.0
    @State private var limit: Double?
    @State private var team: String?
    @State private var owner: String? = "priya"
    @State private var departments: Set<String> = ["sales"]
    @State private var channels: Set<String> = ["email"]
    @State private var window = PreviewData.date ... PreviewData.date.addingTimeInterval(13 * 86400)
    @State private var time = PreviewData.date
    @State private var name = "Sales team signature"

    var body: some View {
        Group {
            StanceSection("Ranges and numbers", caption: "Each thumb and the stepper adjust with VoiceOver swipes.") {
                VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                    StanceRangeSlider("Contract value", value: $range, in: 0 ... 10000, step: 500, minimumStepsBetween: 1) {
                        $0.formatted(.currency(code: "EUR").precision(.fractionLength(0)))
                    }
                    StanceNumberField("Licence seats", value: $seats, min: 1, max: 500, suffix: "seats")
                    StanceNumberField("Spending limit", value: $limit, min: 0, prefix: "€", placeholder: "No limit", helper: "Leave empty for no limit.")
                }
            }
            StanceSection("Codes", caption: "Codes from Messages fill every box.") {
                StancePinField("Verification code", code: $code, helper: "Sent to priya.nair@binds.si")
            }
            StanceSection("Choosing from lists", caption: "Searchable system lists in a sheet or popover.") {
                VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                    StanceCombobox("Template owner", selection: $owner, options: FormsSample.people)
                    StanceCombobox("Team", selection: $team, options: FormsSample.departments, helper: "Pick a team or type a new one.", custom: .text)
                    StanceMultiSelect("Departments", selection: $departments, options: FormsSample.departments, helper: "Type a new name to create a tag.", custom: .text)
                    StanceCheckboxGroup("Notify by", selection: $channels, options: FormsSample.channels, showsSelectAll: true)
                }
            }
            StanceSection("Dates and times", caption: "System date pickers in Stance colours.") {
                VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                    StanceDateRangePicker("Campaign window", range: $window, presets: FormsSample.presets)
                    StanceTimePicker("Deploy at", selection: $time)
                }
            }
            StanceSection("Inline edit", caption: "Tap to rename. Return saves.") {
                StanceInlineEdit("Template name", text: $name, validate: { $0.isEmpty ? "Enter a name." : nil })
            }
        }
    }
}
