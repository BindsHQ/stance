import Foundation
import SwiftUI

/// What a piece of source code is, as found by ``StanceCodeHighlighter``.
///
/// The kinds match the web code block, so the same snippet is marked up the same way on every
/// platform.
public enum StanceCodeTokenKind: String, CaseIterable, Sendable {
    case comment, string, keyword, number, tag, attr, punct, fn, prop, plain
}

/// One run of source code with its kind.
public struct StanceCodeToken: Equatable, Hashable, Sendable {
    public let kind: StanceCodeTokenKind
    public var value: String

    public init(_ kind: StanceCodeTokenKind, _ value: String) {
        self.kind = kind
        self.value = value
    }
}

/// A deliberately small, safe tokenizer for documentation grade highlighting.
///
/// It is a port of the web tokenizer: an ordered list of rules per language, tried at each
/// position, with anything unmatched kept as plain text. Tokens are data. They are only ever
/// drawn as text, never interpreted. An unknown language returns the code as one plain token.
public enum StanceCodeHighlighter {
    private typealias Rule = (kind: StanceCodeTokenKind, regex: NSRegularExpression)

    private static func rule(_ kind: StanceCodeTokenKind, _ pattern: String, caseInsensitive: Bool = false) -> Rule {
        // The patterns are constants checked by the tests, so a failure here is a programming error.
        (kind, try! NSRegularExpression(pattern: pattern, options: caseInsensitive ? [.caseInsensitive] : []))
    }

    private static let jsKeywords =
        "import|from|export|default|const|let|var|function|return|if|else|for|while|of|in|new|class|extends|type|interface|async|await|true|false|null|undefined|as|typeof|this|try|catch|throw|switch|case|break|void"

    private static let swiftKeywords =
        "import|let|var|func|return|if|else|guard|for|while|repeat|in|switch|case|default|break|continue|struct|class|enum|protocol|extension|actor|init|deinit|self|Self|super|static|private|fileprivate|internal|public|open|final|mutating|nonisolated|async|await|throws|throw|try|catch|do|defer|where|as|is|nil|true|false|some|any|typealias|associatedtype|inout|lazy|weak|unowned|override|convenience|required|subscript|operator|indirect|get|set|willSet|didSet"

    private static let kotlinKeywords =
        "package|import|val|var|fun|return|if|else|when|for|while|do|in|is|as|class|object|interface|enum|data|sealed|open|abstract|final|override|private|protected|internal|public|companion|constructor|init|this|super|null|true|false|suspend|inline|lateinit|by|typealias|try|catch|finally|throw|break|continue|const|annotation|operator|infix|vararg|out|get|set"

    private static let js: [Rule] = [
        rule(.comment, #"(//[^\n]*|/\*[\s\S]*?\*/)"#),
        rule(.string, #"(`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")"#),
        rule(.tag, #"</?[A-Za-z][\w.]*"#),
        rule(.keyword, #"\b(?:"# + jsKeywords + #")\b"#),
        rule(.number, #"\b\d[\d_.]*\b"#),
        rule(.fn, #"[A-Za-z_$][\w$]*(?=\s*\()"#),
        rule(.attr, #"[A-Za-z_-][\w-]*(?==)"#),
        rule(.plain, #"[A-Za-z_$][\w$]*"#),
        rule(.punct, #"[{}()\[\];,.<>/=+\-*!?:\&|]+"#),
    ]

    private static let css: [Rule] = [
        rule(.comment, #"/\*[\s\S]*?\*/"#),
        rule(.string, #"('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")"#),
        rule(.prop, #"--?[a-z][\w-]*(?=\s*:)"#, caseInsensitive: true),
        rule(.keyword, #"@[a-z-]+"#),
        rule(.fn, #"[a-z-]+(?=\()"#, caseInsensitive: true),
        rule(.number, #"-?\d[\d.]*(?:px|rem|em|%|ms|s|vh|vw|dvh|fr)?"#),
        rule(.tag, #"[.#]?[a-z][\w-]*"#, caseInsensitive: true),
        rule(.punct, #"[{}():;,>+~*\[\]=]+"#),
    ]

    private static let bash: [Rule] = [
        rule(.comment, #"#[^\n]*"#),
        rule(.string, #"('(?:[^'])*'|"(?:\\.|[^"\\])*")"#),
        rule(.keyword, #"\b(?:npm|npx|pnpm|yarn|git|cd|export|echo|node|install|run|add)\b"#),
        rule(.attr, #"--?[\w-]+"#),
        rule(.plain, ##"[^\s'"#]+"##),
    ]

    private static let json: [Rule] = [
        rule(.prop, #""(?:\\.|[^"\\])*"(?=\s*:)"#),
        rule(.string, #""(?:\\.|[^"\\])*""#),
        rule(.number, #"-?\d[\d.eE+-]*"#),
        rule(.keyword, #"\b(?:true|false|null)\b"#),
        rule(.punct, #"[{}\[\]:,]"#),
    ]

    private static let swift: [Rule] = [
        rule(.comment, #"(//[^\n]*|/\*[\s\S]*?\*/)"#),
        rule(.string, #"("""[\s\S]*?"""|"(?:\\.|[^"\\\n])*")"#),
        rule(.attr, #"[@#][A-Za-z_]\w*"#),
        rule(.keyword, #"\b(?:"# + swiftKeywords + #")\b"#),
        rule(.number, #"\b(?:0x[0-9A-Fa-f_]+|\d[\d_.]*)\b"#),
        rule(.fn, #"[A-Za-z_][\w]*(?=\s*\()"#),
        rule(.plain, #"[A-Za-z_$][\w$]*"#),
        rule(.punct, #"[{}()\[\];,.<>/=+\-*!?:\&|]+"#),
    ]

    private static let kotlin: [Rule] = [
        rule(.comment, #"(//[^\n]*|/\*[\s\S]*?\*/)"#),
        rule(.string, #"("""[\s\S]*?"""|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])')"#),
        rule(.attr, #"@[A-Za-z_][\w:.]*"#),
        rule(.keyword, #"\b(?:"# + kotlinKeywords + #")\b"#),
        rule(.number, #"\b(?:0x[0-9A-Fa-f_]+|\d[\d_.]*[fFL]?)\b"#),
        rule(.fn, #"[A-Za-z_][\w]*(?=\s*\()"#),
        rule(.plain, #"[A-Za-z_$][\w$]*"#),
        rule(.punct, #"[{}()\[\];,.<>/=+\-*!?:\&|]+"#),
    ]

    private static let rules: [String: [Rule]] = [
        "js": js, "ts": js, "tsx": js, "jsx": js, "html": js,
        "css": css,
        "bash": bash, "sh": bash, "shell": bash,
        "json": json,
        "swift": swift,
        "kotlin": kotlin, "kt": kotlin,
    ]

    private static let whitespace = rule(.plain, #"\s+"#).regex

    /// The language names the highlighter knows, in alphabetical order. Matching ignores case.
    public static var supportedLanguages: [String] { rules.keys.sorted() }

    /// Whether `language` has highlighting rules.
    public static func supports(_ language: String?) -> Bool {
        language.map { rules[$0.lowercased()] != nil } ?? false
    }

    /// Splits `code` into tokens for `language`.
    ///
    /// Joining the token values always gives back `code` exactly. Neighbouring plain tokens are
    /// merged. An unknown or missing language returns one plain token.
    public static func tokenize(_ code: String, language: String?) -> [StanceCodeToken] {
        guard let language, let set = rules[language.lowercased()] else { return [StanceCodeToken(.plain, code)] }
        let text = code as NSString
        var tokens: [StanceCodeToken] = []
        var position = 0

        func push(_ kind: StanceCodeTokenKind, _ range: NSRange) {
            let value = text.substring(with: range)
            if kind == .plain, let last = tokens.indices.last, tokens[last].kind == .plain {
                tokens[last].value += value
            } else {
                tokens.append(StanceCodeToken(kind, value))
            }
            position = range.location + range.length
        }

        while position < text.length {
            let rest = NSRange(location: position, length: text.length - position)
            if let space = whitespace.firstMatch(in: code, options: .anchored, range: rest), space.range.length > 0 {
                push(.plain, space.range)
                continue
            }
            var matched = false
            for (kind, regex) in set {
                if let match = regex.firstMatch(in: code, options: .anchored, range: rest), match.range.length > 0 {
                    push(kind, match.range)
                    matched = true
                    break
                }
            }
            if !matched {
                // Step over one whole character, so a surrogate pair is never split.
                push(.plain, text.rangeOfComposedCharacterSequence(at: position))
            }
        }
        return tokens
    }

    /// Splits tokens into lines, cutting tokens that span line breaks. Empty pieces are dropped,
    /// so an empty line is an empty array.
    public static func lines(_ tokens: [StanceCodeToken]) -> [[StanceCodeToken]] {
        var lines: [[StanceCodeToken]] = [[]]
        for token in tokens {
            for (index, part) in token.value.components(separatedBy: "\n").enumerated() {
                if index > 0 { lines.append([]) }
                if !part.isEmpty { lines[lines.count - 1].append(StanceCodeToken(token.kind, part)) }
            }
        }
        return lines
    }

    /// One attributed string for the tokens, styled for a theme.
    ///
    /// Stance adds no hues for code. Like the web code block, kinds differ by the ink scale,
    /// weight, italics and an underline: comments are subtle and italic, keywords semibold, tags
    /// medium, function names underlined, properties and attributes muted, punctuation subtle.
    /// Strings and numbers use the success and warning text roles.
    /// - Parameters:
    ///   - tokens: The tokens, in order.
    ///   - theme: The theme whose roles colour the text.
    ///   - fontSize: The point size of the monospaced font, already scaled for Dynamic Type.
    public static func attributedString(_ tokens: [StanceCodeToken], theme: StanceTheme, fontSize: CGFloat) -> AttributedString {
        var result = AttributedString()
        let colors = theme.colors
        for token in tokens {
            var run = AttributedString(token.value)
            var weight = Font.Weight.regular
            var italic = false
            switch token.kind {
            case .plain: run.foregroundColor = colors.fgDefault
            case .comment: run.foregroundColor = colors.fgSubtle; italic = true
            case .string: run.foregroundColor = colors.successFg
            case .keyword: run.foregroundColor = colors.fgDefault; weight = .semibold
            case .number: run.foregroundColor = colors.warningFg
            case .tag: run.foregroundColor = colors.fgDefault; weight = .medium
            case .attr, .prop: run.foregroundColor = colors.fgMuted
            case .fn:
                run.foregroundColor = colors.fgDefault
                run.underlineStyle = Text.LineStyle(pattern: .solid, color: colors.borderStrong)
            case .punct: run.foregroundColor = colors.fgSubtle
            }
            let font = Font.system(size: fontSize, weight: weight, design: .monospaced)
            run.font = italic ? font.italic() : font
            result.append(run)
        }
        return result
    }
}
