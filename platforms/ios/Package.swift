// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "Stance",
    defaultLocalization: "en",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "StanceTokens", targets: ["StanceTokens"]),
        .library(name: "StanceUI", targets: ["StanceUI"]),
    ],
    targets: [
        // Generated from packages/tokens/source. Never edited by hand.
        .target(name: "StanceTokens"),
        // Resources holds the string tables for the built in strings (English base, Arabic, Spanish).
        .target(name: "StanceUI", dependencies: ["StanceTokens"], resources: [.process("Resources")]),
        .testTarget(name: "StanceUITests", dependencies: ["StanceUI", "StanceTokens"]),
    ],
    swiftLanguageModes: [.v6]
)
