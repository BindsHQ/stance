#!/bin/sh
# Renders the documentation previews in platforms/ios/previews from the real StanceUI components
# running in the showcase app on the iPhone 17 Pro simulator, then records them in components.json.
#
# Inline component previews are captured with the simulator's own screenshot (capture-inline.sh).
# Presented system UI (menus, sheets, alerts, dialogs) is captured by PreviewCaptureTests, which
# taps the trigger first.
#
# Requirements: Xcode, xcodegen, oxipng, python3 with Pillow, node.
# Usage (from the repository root):  sh platforms/ios/Scripts/build-previews.sh
set -eu

export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
IOS="$ROOT/platforms/ios"
APP_DIR="$ROOT/examples/ios/StanceShowcase"
OUT="$IOS/previews"
# Scratch space for raw captures and the build. Removed by the caller or the system temp cleaner.
WORK="${STANCE_PREVIEW_WORK:-$(mktemp -d)}"
RAW="$WORK/raw"
PHONE="iPhone 17 Pro"
PAD="iPad Pro 13-inch (M5)"
BUNDLE="si.binds.stance.showcase"

mkdir -p "$RAW" "$OUT"
find "${RAW:?}" -name '*.png' -type f -delete
cd "$APP_DIR" && xcodegen generate >/dev/null

boot() {
  xcrun simctl boot "$1" 2>/dev/null || true
  xcrun simctl bootstatus "$1" -b >/dev/null
  xcrun simctl status_bar "$1" override --time "9:41" --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularBars 4
}

boot "$PHONE"
# TEST_RUNNER_ variables are passed to the UI test runner with the prefix removed.
TEST_RUNNER_PREVIEW_OUT="$RAW" xcodebuild test -quiet \
  -project StanceShowcase.xcodeproj -scheme StanceShowcase \
  -destination "platform=iOS Simulator,name=$PHONE" -derivedDataPath "$WORK/derived" \
  -only-testing:StanceShowcaseUITests/PreviewCaptureTests

APP="$WORK/derived/Build/Products/Debug-iphonesimulator/StanceShowcase.app"
xcrun simctl install "$PHONE" "$APP"
sh "$IOS/Scripts/capture-inline.sh" "$PHONE" "$RAW"
shot() { # device, output name, launch arguments...
  device="$1"; name="$2"; shift 2
  xcrun simctl terminate "$device" "$BUNDLE" >/dev/null 2>&1 || true
  xcrun simctl launch "$device" "$BUNDLE" "$@" >/dev/null
  sleep 4
  xcrun simctl io "$device" screenshot "$RAW/$name" >/dev/null 2>&1
}
shot "$PHONE" showcase-sample.light.png -screen sample -stance-theme light
shot "$PHONE" showcase-sample.dark.png -screen sample -stance-theme dark
shot "$PHONE" showcase-components.light.png -screen components -stance-theme light
xcrun simctl status_bar "$PHONE" clear
xcrun simctl shutdown "$PHONE"

boot "$PAD"
xcrun simctl install "$PAD" "$APP"
shot "$PAD" showcase-sample-ipad.light.png -screen sample -stance-theme light
xcrun simctl status_bar "$PAD" clear
xcrun simctl shutdown "$PAD"

# Resample iPhone captures from 3x to 2x, optimise losslessly, and update the inventory.
find "${OUT:?}" -maxdepth 1 -name '*.png' -type f -delete
python3 "$IOS/Scripts/process-previews.py" "$RAW" "$OUT"
oxipng -o max --strip safe -q "$OUT"/*.png
node "$IOS/Scripts/update-preview-manifest.mjs"
echo "previews written to $OUT (scratch files in $WORK)"
