import type { Metadata } from 'next';
import { ComponentIndex } from '../../../components/component-index';

export const metadata: Metadata = {
  title: 'Components',
  description:
    'Every Stance component, grouped by purpose, with live previews and API documentation.',
};

export default function Page() {
  return <ComponentIndex />;
}
