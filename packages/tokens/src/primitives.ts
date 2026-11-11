/**
 * Primitive tokens: raw values with no semantic meaning.
 *
 * Binds has exactly two official brand colours. Every neutral in Stance is an
 * OKLab interpolation between them, so the whole palette stays inside the brand.
 * Status colours are *functional* (errors, success, warnings). They are not
 * brand colours and must only be used to communicate state.
 */

export const brand = {
  ivory: '#FCF6EB',
  indigo: '#140C2E',
} as const;

/**
 * The ink scale: ivory (0) → indigo (1000), interpolated in OKLab.
 * Contrast ratios against ivory / indigo are noted for quick reference.
 */
export const ink = {
  0: '#FCF6EB', //    1.00 / 17.40
  25: '#F4EEE5', //   1.07 / 16.23
  50: '#ECE6DF', //   1.15 / 15.11
  100: '#DED9D5', //  1.30 / 13.36
  150: '#CFC9C9', //  1.52 / 11.46
  200: '#BDB8BB', //  1.82 /  9.57
  300: '#9E9AA3', //  2.57 /  6.78
  400: '#817D8C', //  3.72 /  4.68
  500: '#6A657A', //  5.20 /  3.35
  600: '#555169', //  7.05 /  2.47
  700: '#423D58', //  9.57 /  1.82
  800: '#2F2A48', // 12.63 /  1.38
  900: '#201A3A', // 15.37 /  1.13
  950: '#191233', // 16.60 /  1.05
  1000: '#140C2E', // 17.40 / 1.00
} as const;

/** Functional status colours, tuned warm to sit beside ivory and indigo. */
export const status = {
  danger: { strong: '#A3262E', soft: '#F6E2DC', onDark: '#F0868A', softDark: '#3A1530' },
  success: { strong: '#2E6B3D', soft: '#E3EEDC', onDark: '#7FC99A', softDark: '#15283A' },
  warning: { strong: '#8A5300', soft: '#F7E8C8', onDark: '#E8B464', softDark: '#2E1F2C' },
} as const;

export const fontFamily = {
  sans: '"DM Sans", var(--font-dm-sans, ui-sans-serif), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, "SFMono-Regular", "JetBrains Mono", Menlo, Consolas, monospace',
} as const;

/** Type scale on a 1.2 (minor third) ratio, anchored at 16px. */
export const fontSize = {
  '2xs': '0.6875rem', // 11
  xs: '0.75rem', // 12
  sm: '0.875rem', // 14
  md: '1rem', // 16
  lg: '1.125rem', // 18
  xl: '1.375rem', // 22
  '2xl': '1.75rem', // 28
  '3xl': '2.25rem', // 36
  '4xl': '3rem', // 48
  '5xl': '4rem', // 64
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  tight: '1.1',
  snug: '1.25',
  normal: '1.5',
  relaxed: '1.65',
} as const;

export const letterSpacing = {
  tighter: '-0.035em',
  tight: '-0.015em',
  normal: '0',
  wide: '0.04em',
  caps: '0.08em',
} as const;

/** 4px base spacing grid. */
export const space = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
} as const;

/** Control heights shared by buttons, inputs, selects. */
export const size = {
  'control-xs': '1.5rem', // 24
  'control-sm': '2rem', // 32
  'control-md': '2.5rem', // 40
  'control-lg': '3rem', // 48
  'icon-sm': '1rem',
  'icon-md': '1.25rem',
  'icon-lg': '1.5rem',
  'container-sm': '40rem',
  'container-md': '55rem',
  'container-lg': '77.5rem',
  'container-xl': '90rem',
} as const;

export const radius = {
  none: '0',
  xs: '0.25rem',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const;

export const zIndex = {
  base: '0',
  raised: '1',
  sticky: '100',
  dropdown: '1000',
  overlay: '1100',
  modal: '1200',
  popover: '1300',
  toast: '1400',
  tooltip: '1500',
} as const;

export const breakpoint = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const duration = {
  instant: '0ms',
  fast: '120ms',
  normal: '200ms',
  slow: '320ms',
} as const;

export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;
