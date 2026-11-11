import type * as React from 'react';

export interface GuidePage {
  section: 'docs' | 'foundations' | 'ios' | 'android' | 'patterns' | 'guidelines' | 'resources';
  slug: string;
  title: string;
  description: string;
  Component: React.ComponentType;
}
