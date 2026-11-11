import Foundation
import SwiftUI

/// A small SVG path-data parser (M, L, H, V, C, S, Q, T, A, Z and their relative forms).
///
/// It exists so the icon geometry authored once for the web can be drawn natively.
public enum StancePathParser {
    public enum Segment: Equatable, Sendable {
        case move(CGPoint)
        case line(CGPoint)
        case curve(to: CGPoint, control1: CGPoint, control2: CGPoint)
        case quad(to: CGPoint, control: CGPoint)
        case close
    }

    /// Parses path data into absolute segments. Elliptical arcs are converted to cubic curves.
    public static func segments(_ data: String) -> [Segment] {
        var tokens = Tokenizer(data)
        var out: [Segment] = []
        var current = CGPoint.zero
        var start = CGPoint.zero
        var lastControl: CGPoint?
        var lastCommand: Character = " "
        var command: Character = " "

        while true {
            if let c = tokens.nextCommand() {
                command = c
            } else if !tokens.hasNumber {
                break
            } else if command == "M" {
                command = "L" // implicit lineto after moveto
            } else if command == "m" {
                command = "l"
            } else if command == "Z" || command == "z" || command == " " {
                break
            }
            let relative = command.isLowercase
            func point() -> CGPoint? {
                guard let x = tokens.number(), let y = tokens.number() else { return nil }
                return relative ? CGPoint(x: current.x + x, y: current.y + y) : CGPoint(x: x, y: y)
            }
            switch command.uppercased() {
            case "M":
                guard let p = point() else { return out }
                out.append(.move(p)); current = p; start = p; lastControl = nil
            case "L":
                guard let p = point() else { return out }
                out.append(.line(p)); current = p; lastControl = nil
            case "H":
                guard let x = tokens.number() else { return out }
                current = CGPoint(x: relative ? current.x + x : x, y: current.y)
                out.append(.line(current)); lastControl = nil
            case "V":
                guard let y = tokens.number() else { return out }
                current = CGPoint(x: current.x, y: relative ? current.y + y : y)
                out.append(.line(current)); lastControl = nil
            case "C":
                guard let c1 = point(), let c2 = point(), let p = point() else { return out }
                out.append(.curve(to: p, control1: c1, control2: c2)); current = p; lastControl = c2
            case "S":
                guard let c2 = point(), let p = point() else { return out }
                let previous = "CcSs".contains(lastCommand) ? lastControl : nil
                let c1 = previous.map { CGPoint(x: 2 * current.x - $0.x, y: 2 * current.y - $0.y) } ?? current
                out.append(.curve(to: p, control1: c1, control2: c2)); current = p; lastControl = c2
            case "Q":
                guard let c = point(), let p = point() else { return out }
                out.append(.quad(to: p, control: c)); current = p; lastControl = c
            case "T":
                guard let p = point() else { return out }
                let previous = "QqTt".contains(lastCommand) ? lastControl : nil
                let c = previous.map { CGPoint(x: 2 * current.x - $0.x, y: 2 * current.y - $0.y) } ?? current
                out.append(.quad(to: p, control: c)); current = p; lastControl = c
            case "A":
                guard let rx = tokens.number(), let ry = tokens.number(), let rotation = tokens.number(),
                      let large = tokens.flag(), let sweep = tokens.flag(), let p = point() else { return out }
                out.append(contentsOf: arc(from: current, to: p, rx: rx, ry: ry, rotation: rotation, largeArc: large, sweep: sweep))
                current = p; lastControl = nil
            case "Z":
                out.append(.close); current = start; lastControl = nil
            default:
                return out
            }
            lastCommand = command
        }
        return out
    }

    /// Builds a SwiftUI path from SVG path data.
    public static func path(_ data: String) -> Path {
        var path = Path()
        for segment in segments(data) {
            switch segment {
            case let .move(p): path.move(to: p)
            case let .line(p): path.addLine(to: p)
            case let .curve(to, c1, c2): path.addCurve(to: to, control1: c1, control2: c2)
            case let .quad(to, c): path.addQuadCurve(to: to, control: c)
            case .close: path.closeSubpath()
            }
        }
        return path
    }

    /// Endpoint-to-centre arc conversion (SVG 1.1 implementation notes, F.6.5), emitted as cubic curves.
    static func arc(from p0: CGPoint, to p1: CGPoint, rx rxIn: CGFloat, ry ryIn: CGFloat, rotation: CGFloat, largeArc: Bool, sweep: Bool) -> [Segment] {
        if p0 == p1 { return [] }
        var rx = abs(rxIn), ry = abs(ryIn)
        if rx == 0 || ry == 0 { return [.line(p1)] }
        let phi = rotation * .pi / 180
        let cosPhi = cos(phi), sinPhi = sin(phi)
        let dx = (p0.x - p1.x) / 2, dy = (p0.y - p1.y) / 2
        let x1 = cosPhi * dx + sinPhi * dy
        let y1 = -sinPhi * dx + cosPhi * dy
        let lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)
        if lambda > 1 { rx *= sqrt(lambda); ry *= sqrt(lambda) }
        let num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
        let den = rx * rx * y1 * y1 + ry * ry * x1 * x1
        var coefficient = den == 0 ? 0 : sqrt(max(0, num / den))
        if largeArc == sweep { coefficient = -coefficient }
        let cxp = coefficient * rx * y1 / ry
        let cyp = -coefficient * ry * x1 / rx
        let cx = cosPhi * cxp - sinPhi * cyp + (p0.x + p1.x) / 2
        let cy = sinPhi * cxp + cosPhi * cyp + (p0.y + p1.y) / 2
        func angle(_ ux: CGFloat, _ uy: CGFloat, _ vx: CGFloat, _ vy: CGFloat) -> CGFloat {
            let dot = ux * vx + uy * vy
            let length = sqrt(ux * ux + uy * uy) * sqrt(vx * vx + vy * vy)
            var a = acos(min(1, max(-1, dot / length)))
            if ux * vy - uy * vx < 0 { a = -a }
            return a
        }
        let theta1 = angle(1, 0, (x1 - cxp) / rx, (y1 - cyp) / ry)
        var delta = angle((x1 - cxp) / rx, (y1 - cyp) / ry, (-x1 - cxp) / rx, (-y1 - cyp) / ry)
        if !sweep && delta > 0 { delta -= 2 * .pi } else if sweep && delta < 0 { delta += 2 * .pi }
        let count = max(1, Int(ceil(abs(delta) / (.pi / 2) - 0.0001)))
        let step = delta / CGFloat(count)
        let t = 4 / 3 * tan(step / 4)
        var result: [Segment] = []
        var theta = theta1
        func transform(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
            CGPoint(x: cosPhi * rx * x - sinPhi * ry * y + cx, y: sinPhi * rx * x + cosPhi * ry * y + cy)
        }
        for index in 0 ..< count {
            let next = theta + step
            let c1 = transform(cos(theta) - t * sin(theta), sin(theta) + t * cos(theta))
            let c2 = transform(cos(next) + t * sin(next), sin(next) - t * cos(next))
            let end = index == count - 1 ? p1 : transform(cos(next), sin(next))
            result.append(.curve(to: end, control1: c1, control2: c2))
            theta = next
        }
        return result
    }

    private struct Tokenizer {
        private let scalars: [Character]
        private var index = 0

        init(_ string: String) { scalars = Array(string) }

        private mutating func skipSeparators() {
            while index < scalars.count, scalars[index] == " " || scalars[index] == "," || scalars[index] == "\n" || scalars[index] == "\t" { index += 1 }
        }

        var hasNumber: Bool {
            var copy = self
            copy.skipSeparators()
            guard copy.index < copy.scalars.count else { return false }
            let c = copy.scalars[copy.index]
            return c.isNumber || c == "-" || c == "+" || c == "."
        }

        mutating func nextCommand() -> Character? {
            skipSeparators()
            guard index < scalars.count, scalars[index].isLetter, scalars[index] != "e", scalars[index] != "E" else { return nil }
            defer { index += 1 }
            return scalars[index]
        }

        mutating func number() -> CGFloat? {
            skipSeparators()
            var text = ""
            var seenDot = false, seenExponent = false
            while index < scalars.count {
                let c = scalars[index]
                if c.isNumber {
                    text.append(c)
                } else if c == "-" || c == "+" {
                    if text.isEmpty || text.last == "e" || text.last == "E" { text.append(c) } else { break }
                } else if c == "." {
                    if seenDot || seenExponent { break }
                    seenDot = true; text.append(c)
                } else if (c == "e" || c == "E"), !text.isEmpty, !seenExponent {
                    seenExponent = true; text.append(c)
                } else {
                    break
                }
                index += 1
            }
            return Double(text).map { CGFloat($0) }
        }

        /// Arc flags are single digits and may be written without separators ("a1 1 0 01.5 2").
        mutating func flag() -> Bool? {
            skipSeparators()
            guard index < scalars.count, scalars[index] == "0" || scalars[index] == "1" else { return nil }
            defer { index += 1 }
            return scalars[index] == "1"
        }
    }
}
