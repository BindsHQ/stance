import { DocsSidebar } from '../../components/docs-sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="docs-shell">
      <DocsSidebar />
      <main id="main" className="docs-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
