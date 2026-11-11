#!/bin/sh
# Captures every inline preview in every theme with `simctl io screenshot` and crops it to the
# rect the showcase reports. Called by build-previews.sh. Arguments: device, output directory.
set -eu
DEVICE="$1"; RAW="$2"
BUNDLE="si.binds.stance.showcase"
DATA="$(xcrun simctl get_app_container "$DEVICE" "$BUNDLE" data)/Documents"

launch() {
  xcrun simctl terminate "$DEVICE" "$BUNDLE" >/dev/null 2>&1 || true
  xcrun simctl launch "$DEVICE" "$BUNDLE" "$@" >/dev/null
}

launch -preview-gallery -stance-theme light
sleep 3
SLUGS="$(cat "$DATA/preview-slugs.txt")"
for theme in light dark high-contrast; do
  for slug in $SLUGS; do
    find "$DATA" -name preview-rect.txt -delete
    launch -preview-gallery -preview-start "$slug" -stance-theme "$theme"
    tries=0
    until grep -q "^$slug " "$DATA/preview-rect.txt" 2>/dev/null || [ $tries -ge 40 ]; do sleep 0.25; tries=$((tries + 1)); done
    sleep 1.2 # let fonts, images and entrance animations settle
    xcrun simctl io "$DEVICE" screenshot "$RAW/full.png" >/dev/null 2>&1
    python3 - "$RAW/full.png" "$DATA/preview-rect.txt" "$RAW/$slug.$theme.png" <<'PY'
import sys
from PIL import Image
full, rect_file, out = sys.argv[1:4]
_, x, y, w, h = open(rect_file).read().split()
x, y, w, h = (float(v) for v in (x, y, w, h))
h = min(h, 520 + 48)  # content cap plus padding
image = Image.open(full)
scale = image.width / 402  # iPhone 17 Pro is 402pt wide
image.crop((round(x * scale), round(y * scale), round((x + w) * scale), round((y + h) * scale))).save(out)
PY
  done
done
rm -f "$RAW/full.png"
