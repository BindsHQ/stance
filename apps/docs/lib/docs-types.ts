/**
 * The contract every component documentation entry fulfils.
 * One file per component in content/components/<slug>.tsx exports:
 *   - `doc: ComponentDoc`
 *   - one exported function component per example named in `doc.examples`.
 * Example source code is extracted at build time from those functions, so the
 * code shown on the page is always exactly the code that renders the preview.
 */
import type * as React from 'react';

export type ComponentCategory =
  | 'foundations'
  | 'typography'
  | 'actions'
  | 'forms'
  | 'navigation'
  | 'data-display'
  | 'feedback'
  | 'overlays'
  | 'media'
  | 'advanced'
  | 'ai'
  | 'theming';

export interface PropDoc {
  /** Which exported component the prop belongs to (for compound components). */
  component: string;
  name: string;
  /** TypeScript type as written in source, e.g. `'sm' | 'md' | 'lg'`. */
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

export interface KeyboardDoc {
  keys: string[];
  description: string;
}

export interface ExampleDoc {
  /** Name of the exported function in the same file. */
  name: string;
  title: string;
  description?: string;
  /** Preview canvas layout. Default `center`. */
  layout?: 'center' | 'start' | 'fill';
  /** Minimum canvas height in px, for overlays and menus. */
  minHeight?: number;
}

export type ControlDoc =
  | { type: 'select'; options: string[]; default: string }
  | { type: 'boolean'; default: boolean }
  | { type: 'text'; default: string }
  | { type: 'number'; default: number; min?: number; max?: number; step?: number };

export interface PlaygroundDoc {
  /** Renders the component from the current control values. */
  render: (props: Record<string, unknown>) => React.ReactNode;
  controls: Record<string, ControlDoc>;
}

export interface ComponentDoc {
  slug: string;
  name: string;
  category: ComponentCategory;
  /** One sentence, shown in cards and search. */
  summary: string;
  /** A short paragraph on purpose and when to use / not use it. */
  description: string;
  /** Named exports to show in the import snippet. */
  imports: string[];
  status: 'stable' | 'beta';
  /** Examples; the first is the hero preview, shown in all three themes. */
  examples: ExampleDoc[];
  props: PropDoc[];
  accessibility: string[];
  keyboard?: KeyboardDoc[];
  /** Short do/don't usage guidance. */
  guidelines?: { do: string[]; dont: string[] };
  playground?: PlaygroundDoc;
  related?: string[];
}
