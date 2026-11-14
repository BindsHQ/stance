# Stance brand assets

The official Stance logo, mark and app icons. Stance is the design system of [Binds](https://binds.si).

```text
brand/
├── logo/
│   ├── svg/                       vector masters (use these whenever possible)
│   │   ├── stance-logo.svg            full logo, currentColor (inherits text colour)
│   │   ├── stance-logo-indigo.svg     full logo on light backgrounds
│   │   ├── stance-logo-ivory.svg      full logo on dark backgrounds
│   │   ├── stance-mark.svg            mark only, currentColor
│   │   ├── stance-mark-indigo.svg     mark on light backgrounds
│   │   ├── stance-mark-ivory.svg      mark on dark backgrounds
│   │   ├── stance-app-icon.svg        ivory mark on an indigo tile (app icons)
│   │   ├── stance-app-icon-maskable.svg   full-bleed tile with safe-zone padding (PWA maskable)
│   │   └── stance-favicon.svg         tighter tile tuned for 16–48px favicons
│   └── png/                       raster versions for tools that cannot use SVG
│       ├── stance-logo-{indigo,ivory}.png      original artwork, 1682×376
│       ├── stance-logo-{indigo,ivory}@2x.png   3364×752, rendered from the SVG masters
│       ├── stance-mark-{indigo,ivory}.png      original artwork, 382×376
│       └── stance-mark-{indigo,ivory}@2x.png   764×752
└── favicon/
    ├── favicon.ico                16, 32, 48px
    ├── favicon-{16,32,48}.png
    ├── apple-touch-icon.png       180px, opaque
    ├── icon-{192,512}.png
    └── icon-maskable-512.png
```

## Colours

| | Hex | Use |
| --- | --- | --- |
| Binds Indigo | `#140C2E` | Logo on light backgrounds; app tile |
| Binds Ivory | `#FCF6EB` | Logo on dark backgrounds; mark on the app tile |

Use only these two colours for the logo. Do not recolour, outline, add effects or place it on busy imagery.

## Usage

- **Clear space:** keep at least the height of one quadrant of the mark (≈ half the mark height) around the logo.
- **Minimum size:** full logo 80px wide on screen; mark 16px (use `stance-favicon.svg` below 48px).
- **On the web:** prefer `stance-logo.svg` / `stance-mark.svg` inline with `currentColor` so the logo follows light, dark and high-contrast themes.
- **Don’t** stretch, rotate, rearrange the mark and wordmark, or recreate the wordmark in another typeface.

## Quality

- SVG masters were traced from the original artwork and verified against it by rendering both in Chromium: 99.8% shape overlap (IoU) and a mean alpha difference below 0.3/255.
- PNGs are optimised losslessly with `oxipng -o max --strip safe`; the original artwork PNGs are pixel-identical to the supplied files.

## Regenerating

```bash
node scripts/build-brand.mjs              # render rasters from the SVG masters
oxipng -o max --strip safe brand/logo/png/*.png brand/favicon/*.png
node scripts/build-brand.mjs --copy-only  # copy the web set into apps/docs/public
```

The Binds and Stance names and logos are trademarks of Binds. These files are not covered by the Apache License; their use is governed by [TRADEMARK.md](../TRADEMARK.md).
