import type * as React from 'react';
import type { ComponentDoc } from './docs-types';

export type ComponentModule = { doc: ComponentDoc } & Record<
  string,
  React.ComponentType | ComponentDoc
>;

export interface ComponentMeta {
  slug: string;
  name: string;
  category: ComponentDoc['category'];
  summary: string;
  status: 'stable' | 'beta';
}
