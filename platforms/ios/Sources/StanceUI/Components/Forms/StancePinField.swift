import SwiftUI

/// The characters a ``StancePinField`` accepts.
public enum StancePinCharacters: String, Sendable {
    /// Digits only. Digits from other scripts, such as Arabic-Indic digits, become 0 to 9.
    case numeric
    /// Latin letters and digits.
    case alphanumeric
}

/// The input rules of a ``StancePinField``, exposed for apps and tests.
public enum StancePinFieldLogic {
    /// Cleans typed, pasted or autofilled text into a code: keeps only accepted characters,
    /// drops spaces, dashes and other separators, and stops at `length`.
    ///
    /// A pasted "123 456" or "123-456" becomes "123456".
    public nonisolated static func sanitize(_ input: String, length: Int, characters: StancePinCharacters) -> String {
        var result = ""
        for character in input {
            guard result.count < max(0, length) else { break }
            switch characters {
            case .numeric:
                if character.isNumber, let digit = character.wholeNumberValue, (0 ... 9).contains(digit) {
                    result.append(String(digit))
                }
            case .alphanumeric:
                if character.isASCII, character.isLetter || character.isNumber { result.append(character) }
            }
        }
        return result
    }

    /// Whether `code` fills every box.
    public nonisolated static func isComplete(_ code: String, length: Int) -> Bool {
        length > 0 && code.count == length
    }

    /// The box that receives the next character, or `nil` when the code is complete.
    public nonisolated static func activeIndex(for code: String, length: Int) -> Int? {
        code.count < length ? code.count : nil
    }
}

/// One time code entry, such as a six digit verification code, drawn as a row of boxes.
///
/// Native first: the boxes are drawn over a single real `TextField` with the one time code
/// content type, so the code from Messages or Mail appears above the keyboard, a pasted code
/// fills every box, and Backspace and VoiceOver behave as in any text field.
/// The code always reads left to right, also in right to left layouts.
public struct StancePinField: View {
    private let label: String
    private let length: Int
    private let characters: StancePinCharacters
    private let isMasked: Bool
    private let helper: String?
    private let error: String?
    private let onComplete: ((String) -> Void)?
    @Binding private var code: String
    @FocusState private var focused: Bool
    @ScaledMetric(relativeTo: .title) private var boxHeight: CGFloat = StanceSize.controlLg + StanceSpacing.xs
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.isEnabled) private var isEnabled

    /// - Parameters:
    ///   - label: The visible label and accessible name.
    ///   - code: The entered code. Text set here is cleaned the same way typed text is.
    ///   - length: How many boxes to show.
    ///   - characters: Digits only, or letters and digits.
    ///   - isMasked: Shows dots instead of the characters, for a PIN.
    ///   - onComplete: Called with the code when the last box is filled.
    @_disfavoredOverload
    public init(
        _ label: String,
        code: Binding<String>,
        length: Int = 6,
        characters: StancePinCharacters = .numeric,
        isMasked: Bool = false,
        helper: String? = nil,
        error: String? = nil,
        onComplete: ((String) -> Void)? = nil
    ) {
        self.label = label
        _code = code
        self.length = max(1, length)
        self.characters = characters
        self.isMasked = isMasked
        self.helper = helper
        self.error = error
        self.onComplete = onComplete
    }

    private var input: Binding<String> {
        Binding(
            get: { code },
            set: { new in
                let clean = StancePinFieldLogic.sanitize(new, length: length, characters: characters)
                guard clean != code else { return }
                code = clean
                if StancePinFieldLogic.isComplete(clean, length: length) { onComplete?(clean) }
            }
        )
    }

    public var body: some View {
        StanceFormField(label, helper: helper, error: error) {
            ZStack {
                TextField("", text: input)
                    .focused($focused)
                    // The real field stays accessible and receives input; the boxes draw it.
                    .foregroundStyle(.clear)
                    .tint(.clear)
                    .autocorrectionDisabled()
                    #if os(iOS)
                    .textContentType(.oneTimeCode)
                    .keyboardType(characters == .numeric ? .numberPad : .asciiCapable)
                    .textInputAutocapitalization(characters == .numeric ? .never : .characters)
                    #endif
                    .frame(maxWidth: .infinity, minHeight: boxHeight)
                    .accessibilityValue(isMasked ? stanceString("stance.pin.progress \(code.count) \(length)", locale) : code)
                    .privacySensitive(isMasked)
                boxes
                    .allowsHitTesting(false)
                    .accessibilityHidden(true)
            }
            .contentShape(Rectangle())
            .onTapGesture { focused = true }
        }
    }

    private var boxes: some View {
        let characters = Array(code)
        let active = focused ? StancePinFieldLogic.activeIndex(for: code, length: length) : nil
        let invalid = !(error ?? "").isEmpty
        return HStack(spacing: StanceSpacing.sm) {
            ForEach(0 ..< length, id: \.self) { index in
                let shape = RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous)
                let isActive = index == active
                ZStack {
                    shape.fill(isEnabled ? theme.colors.bgSurface : theme.colors.disabledBg)
                    shape.strokeBorder(
                        invalid ? theme.colors.dangerFg : isActive ? theme.colors.focusRing : theme.colors.borderControl,
                        lineWidth: isActive || invalid ? max(theme.focusWidth, theme.controlBorderWidth) : theme.controlBorderWidth
                    )
                    if index < characters.count {
                        Text(verbatim: isMasked ? "\u{2022}" : String(characters[index]))
                            .stanceText(.title)
                            .monospacedDigit()
                            .foregroundStyle(isEnabled ? theme.colors.fgDefault : theme.colors.disabledFg)
                            .minimumScaleFactor(0.5)
                            .lineLimit(1)
                    } else if isActive {
                        Capsule()
                            .fill(theme.colors.fgDefault)
                            .frame(width: theme.focusWidth, height: boxHeight / 2)
                    }
                }
                .frame(maxWidth: StanceSize.controlLg + StanceSpacing.lg, minHeight: boxHeight, maxHeight: boxHeight)
                .stanceAnimation(.fast, value: isActive)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        // Codes read left to right in every language.
        .environment(\.layoutDirection, .leftToRight)
    }
}

// MARK: Localised labels

extension StancePinField {
    /// Creates a code field whose label is looked up in the app's string tables.
    public init(
        _ labelKey: LocalizedStringResource,
        code: Binding<String>,
        length: Int = 6,
        characters: StancePinCharacters = .numeric,
        isMasked: Bool = false,
        helper: String? = nil,
        error: String? = nil,
        onComplete: ((String) -> Void)? = nil
    ) {
        self.init(
            String(localized: labelKey), code: code, length: length, characters: characters, isMasked: isMasked,
            helper: helper, error: error, onComplete: onComplete
        )
    }
}
