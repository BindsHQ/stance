import { brand, ink, status } from './primitives.js';

/**
 * Semantic colour roles. Components only ever reference these roles,
 * never primitives, so a theme is a complete mapping of role → value.
 */
export interface ThemeColors {
  /* Backgrounds */
  'bg-canvas': string;
  'bg-subtle': string;
  'bg-muted': string;
  'bg-emphasis': string;
  'bg-surface': string;
  'bg-surface-raised': string;
  'bg-overlay': string;
  'bg-inverse': string;
  'bg-scrim': string;
  /* Foregrounds */
  'fg-default': string;
  'fg-muted': string;
  'fg-subtle': string;
  'fg-disabled': string;
  'fg-inverse': string;
  'fg-link': string;
  /* Borders and separators */
  'border-subtle': string;
  'border-default': string;
  'border-strong': string;
  'border-control': string;
  'border-control-hover': string;
  separator: string;
  /* Accent (the brand-on-brand interactive colour) */
  'accent-bg': string;
  'accent-bg-hover': string;
  'accent-bg-active': string;
  'accent-fg': string;
  /* Neutral interaction layers */
  'interactive-hover': string;
  'interactive-active': string;
  'interactive-selected': string;
  'interactive-selected-fg': string;
  /* Focus */
  'focus-ring': string;
  'focus-ring-offset': string;
  /* Disabled */
  'disabled-bg': string;
  'disabled-fg': string;
  'disabled-border': string;
  /* Status */
  'danger-fg': string;
  'danger-bg': string;
  'danger-border': string;
  'danger-solid': string;
  'danger-solid-hover': string;
  'danger-on-solid': string;
  'success-fg': string;
  'success-bg': string;
  'success-border': string;
  'success-solid': string;
  'success-on-solid': string;
  'warning-fg': string;
  'warning-bg': string;
  'warning-border': string;
  'warning-solid': string;
  'warning-on-solid': string;
  'info-fg': string;
  'info-bg': string;
  'info-border': string;
  'info-solid': string;
  'info-on-solid': string;
  /* Data visualisation (sequential ink ramp, theme aware) */
  'chart-1': string;
  'chart-2': string;
  'chart-3': string;
  'chart-4': string;
  'chart-5': string;
}

export interface ThemeEffects {
  'shadow-xs': string;
  'shadow-sm': string;
  'shadow-md': string;
  'shadow-lg': string;
  'shadow-xl': string;
  'focus-width': string;
  'focus-offset': string;
  'border-width': string;
  'border-width-control': string;
}

export interface Theme {
  name: ThemeName;
  label: string;
  colorScheme: 'light' | 'dark';
  colors: ThemeColors;
  effects: ThemeEffects;
}

export type ThemeName = 'light' | 'dark' | 'high-contrast';

/** Soft ivory-tinted surface used for raised cards in light mode. */
const ivoryLift = '#FFFCF6';

const indigoShadow = (a: number) => `rgba(20, 12, 46, ${a})`;

export const light: Theme = {
  name: 'light',
  label: 'Light',
  colorScheme: 'light',
  colors: {
    'bg-canvas': brand.ivory,
    'bg-subtle': ink[25],
    'bg-muted': ink[50],
    'bg-emphasis': ink[100],
    'bg-surface': ivoryLift,
    'bg-surface-raised': ivoryLift,
    'bg-overlay': ivoryLift,
    'bg-inverse': brand.indigo,
    'bg-scrim': 'rgba(20, 12, 46, 0.48)',
    'fg-default': brand.indigo,
    'fg-muted': ink[600],
    'fg-subtle': ink[500],
    'fg-disabled': ink[300],
    'fg-inverse': brand.ivory,
    'fg-link': brand.indigo,
    'border-subtle': ink[50],
    'border-default': ink[100],
    'border-strong': ink[200],
    'border-control': ink[400],
    'border-control-hover': ink[600],
    separator: ink[100],
    'accent-bg': brand.indigo,
    'accent-bg-hover': ink[800],
    'accent-bg-active': ink[700],
    'accent-fg': brand.ivory,
    'interactive-hover': 'rgba(20, 12, 46, 0.06)',
    'interactive-active': 'rgba(20, 12, 46, 0.11)',
    'interactive-selected': ink[50],
    'interactive-selected-fg': brand.indigo,
    'focus-ring': brand.indigo,
    'focus-ring-offset': brand.ivory,
    'disabled-bg': ink[50],
    'disabled-fg': ink[300],
    'disabled-border': ink[100],
    'danger-fg': status.danger.strong,
    'danger-bg': status.danger.soft,
    'danger-border': '#D9A39C',
    'danger-solid': status.danger.strong,
    'danger-solid-hover': '#8A1F27',
    'danger-on-solid': brand.ivory,
    'success-fg': status.success.strong,
    'success-bg': status.success.soft,
    'success-border': '#A9C6A3',
    'success-solid': status.success.strong,
    'success-on-solid': brand.ivory,
    'warning-fg': status.warning.strong,
    'warning-bg': status.warning.soft,
    'warning-border': '#DDBB7A',
    'warning-solid': status.warning.strong,
    'warning-on-solid': brand.ivory,
    'info-fg': brand.indigo,
    'info-bg': ink[50],
    'info-border': ink[150],
    'info-solid': brand.indigo,
    'info-on-solid': brand.ivory,
    'chart-1': brand.indigo,
    'chart-2': ink[700],
    'chart-3': ink[500],
    'chart-4': ink[300],
    'chart-5': ink[150],
  },
  effects: {
    'shadow-xs': `0 1px 2px ${indigoShadow(0.05)}`,
    'shadow-sm': `0 1px 3px ${indigoShadow(0.06)}, 0 1px 2px ${indigoShadow(0.04)}`,
    'shadow-md': `0 4px 12px -2px ${indigoShadow(0.08)}, 0 2px 4px -1px ${indigoShadow(0.04)}`,
    'shadow-lg': `0 12px 28px -6px ${indigoShadow(0.12)}, 0 4px 10px -2px ${indigoShadow(0.05)}`,
    'shadow-xl': `0 24px 48px -12px ${indigoShadow(0.2)}, 0 8px 16px -4px ${indigoShadow(0.06)}`,
    'focus-width': '2px',
    'focus-offset': '2px',
    'border-width': '1px',
    'border-width-control': '1px',
  },
};

export const dark: Theme = {
  name: 'dark',
  label: 'Dark',
  colorScheme: 'dark',
  colors: {
    'bg-canvas': brand.indigo,
    'bg-subtle': ink[950],
    'bg-muted': ink[900],
    'bg-emphasis': ink[800],
    'bg-surface': ink[950],
    'bg-surface-raised': ink[900],
    'bg-overlay': ink[900],
    'bg-inverse': brand.ivory,
    'bg-scrim': 'rgba(6, 3, 16, 0.64)',
    'fg-default': brand.ivory,
    'fg-muted': ink[150],
    'fg-subtle': ink[300],
    'fg-disabled': ink[600],
    'fg-inverse': brand.indigo,
    'fg-link': brand.ivory,
    'border-subtle': ink[900],
    'border-default': ink[800],
    'border-strong': ink[700],
    'border-control': ink[400],
    'border-control-hover': ink[200],
    separator: ink[800],
    'accent-bg': brand.ivory,
    'accent-bg-hover': ink[50],
    'accent-bg-active': ink[100],
    'accent-fg': brand.indigo,
    'interactive-hover': 'rgba(252, 246, 235, 0.07)',
    'interactive-active': 'rgba(252, 246, 235, 0.12)',
    'interactive-selected': ink[800],
    'interactive-selected-fg': brand.ivory,
    'focus-ring': brand.ivory,
    'focus-ring-offset': brand.indigo,
    'disabled-bg': ink[900],
    'disabled-fg': ink[600],
    'disabled-border': ink[800],
    'danger-fg': status.danger.onDark,
    'danger-bg': status.danger.softDark,
    'danger-border': '#7A3448',
    'danger-solid': status.danger.onDark,
    'danger-solid-hover': '#F4A0A3',
    'danger-on-solid': brand.indigo,
    'success-fg': status.success.onDark,
    'success-bg': status.success.softDark,
    'success-border': '#2F5A4C',
    'success-solid': status.success.onDark,
    'success-on-solid': brand.indigo,
    'warning-fg': status.warning.onDark,
    'warning-bg': status.warning.softDark,
    'warning-border': '#6B5038',
    'warning-solid': status.warning.onDark,
    'warning-on-solid': brand.indigo,
    'info-fg': brand.ivory,
    'info-bg': ink[900],
    'info-border': ink[700],
    'info-solid': brand.ivory,
    'info-on-solid': brand.indigo,
    'chart-1': brand.ivory,
    'chart-2': ink[150],
    'chart-3': ink[300],
    'chart-4': ink[500],
    'chart-5': ink[700],
  },
  effects: {
    'shadow-xs': '0 1px 2px rgba(0, 0, 0, 0.3)',
    'shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.36), 0 1px 2px rgba(0, 0, 0, 0.24)',
    'shadow-md': '0 4px 12px -2px rgba(0, 0, 0, 0.44), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    'shadow-lg': '0 12px 28px -6px rgba(0, 0, 0, 0.52), 0 4px 10px -2px rgba(0, 0, 0, 0.32)',
    'shadow-xl': '0 24px 48px -12px rgba(0, 0, 0, 0.6), 0 8px 16px -4px rgba(0, 0, 0, 0.36)',
    'focus-width': '2px',
    'focus-offset': '2px',
    'border-width': '1px',
    'border-width-control': '1px',
  },
};

/**
 * High contrast: ivory and indigo only for text and boundaries.
 * Every boundary is full-strength indigo, focus rings are thicker,
 * and secondary text is never lighter than 12:1.
 */
export const highContrast: Theme = {
  name: 'high-contrast',
  label: 'High contrast',
  colorScheme: 'light',
  colors: {
    'bg-canvas': brand.ivory,
    'bg-subtle': brand.ivory,
    'bg-muted': ink[25],
    'bg-emphasis': ink[50],
    'bg-surface': brand.ivory,
    'bg-surface-raised': brand.ivory,
    'bg-overlay': brand.ivory,
    'bg-inverse': brand.indigo,
    'bg-scrim': 'rgba(20, 12, 46, 0.72)',
    'fg-default': brand.indigo,
    'fg-muted': ink[800],
    'fg-subtle': ink[800],
    'fg-disabled': ink[600],
    'fg-inverse': brand.ivory,
    'fg-link': brand.indigo,
    'border-subtle': brand.indigo,
    'border-default': brand.indigo,
    'border-strong': brand.indigo,
    'border-control': brand.indigo,
    'border-control-hover': brand.indigo,
    separator: brand.indigo,
    'accent-bg': brand.indigo,
    'accent-bg-hover': ink[800],
    'accent-bg-active': ink[700],
    'accent-fg': brand.ivory,
    'interactive-hover': ink[50],
    'interactive-active': ink[100],
    'interactive-selected': brand.indigo,
    'interactive-selected-fg': brand.ivory,
    'focus-ring': brand.indigo,
    'focus-ring-offset': brand.ivory,
    'disabled-bg': ink[25],
    'disabled-fg': ink[600],
    'disabled-border': ink[600],
    'danger-fg': '#8A1F27',
    'danger-bg': brand.ivory,
    'danger-border': '#8A1F27',
    'danger-solid': '#8A1F27',
    'danger-solid-hover': '#701820',
    'danger-on-solid': brand.ivory,
    'success-fg': '#235530',
    'success-bg': brand.ivory,
    'success-border': '#235530',
    'success-solid': '#235530',
    'success-on-solid': brand.ivory,
    'warning-fg': '#6B4000',
    'warning-bg': brand.ivory,
    'warning-border': '#6B4000',
    'warning-solid': '#6B4000',
    'warning-on-solid': brand.ivory,
    'info-fg': brand.indigo,
    'info-bg': brand.ivory,
    'info-border': brand.indigo,
    'info-solid': brand.indigo,
    'info-on-solid': brand.ivory,
    'chart-1': brand.indigo,
    'chart-2': ink[800],
    'chart-3': ink[600],
    'chart-4': ink[500],
    'chart-5': ink[400],
  },
  effects: {
    'shadow-xs': 'none',
    'shadow-sm': 'none',
    'shadow-md': `0 0 0 1px ${brand.indigo}`,
    'shadow-lg': `0 0 0 2px ${brand.indigo}`,
    'shadow-xl': `0 0 0 2px ${brand.indigo}`,
    'focus-width': '3px',
    'focus-offset': '2px',
    'border-width': '1px',
    'border-width-control': '2px',
  },
};

export const themes = { light, dark, 'high-contrast': highContrast } as const;
export const themeNames = Object.keys(themes) as ThemeName[];
