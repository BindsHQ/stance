// swift-tools-version: 6.0
// Root manifest so Swift Package Manager can resolve Stance from the repository URL:
//   .package(url: "https://github.com/BindsHQ/stance.git", from: "0.1.0")
// The sources live in platforms/ios. Tests run from platforms/ios/Package.swift.
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
        .target(name: "StanceTokens", path: "platforms/ios/Sources/StanceTokens"),
        .target(name: "StanceUI", dependencies: ["StanceTokens"], path: "platforms/ios/Sources/StanceUI"),
    ],
    swiftLanguageModes: [.v6]
)
