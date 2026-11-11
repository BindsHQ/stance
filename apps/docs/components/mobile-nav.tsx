'use client';
import * as React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger, Icon } from '@bindshq/stance-react';
import { DocsNavList } from './docs-sidebar';

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="site-header__icon-link site-mobile-trigger"
        aria-label="Open navigation"
      >
        <Icon name="menu" size={20} />
      </DialogTrigger>
      <DialogContent
        placement="left"
        size="sm"
        className="mobile-nav"
        closeLabel="Close navigation"
      >
        <DialogTitle className="st-sr-only">Navigation</DialogTitle>
        <nav aria-label="Mobile">
          <DocsNavList onNavigate={() => setOpen(false)} />
        </nav>
      </DialogContent>
    </Dialog>
  );
}
