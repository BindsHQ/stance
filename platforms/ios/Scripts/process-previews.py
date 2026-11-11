"""Resamples raw simulator captures to 2x and writes them to the previews folder.

iPhone 17 Pro renders at 3x. Previews are published at 2x to keep files small while staying
sharp on high-density displays. iPad captures are already 2x and are copied unchanged.
"""
import sys
from pathlib import Path

from PIL import Image

raw, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
count = 0
for path in sorted(raw.glob("*.png")):
    image = Image.open(path).convert("RGB")
    if "ipad" not in path.name:
        size = (round(image.width * 2 / 3), round(image.height * 2 / 3))
        image = image.resize(size, Image.LANCZOS)
    image.save(out / path.name, optimize=True)
    count += 1
print(f"processed {count} images")
