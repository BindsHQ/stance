'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CommandGroup, CommandItem, CommandPalette, Icon } from '@bindshq/stance-react';
import meta from '../generated/meta.json';
import type { ComponentMeta } from '../lib/registry-types';
import { categoryLabels, categoryOrder, guideNav } from '../lib/site';
import { native, nativePath, nativePlatforms, platformLabels } from '../lib/native';

const components = meta as ComponentMeta[];

/** Site-wide ⌘K search, built on Stance's own CommandPalette. */
export function SiteSearch() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  return (
    <CommandPalette
      open={open}
      onOpenChange={setOpen}
      label="Search documentation"
      placeholder="Search components and guides…"
      emptyMessage="No matching pages."
      trigger={
        <button type="button" className="site-search-trigger">
          <Icon name="search" />
          <span>Search docs…</span>
          <kbd>⌘K</kbd>
        </button>
      }
    >
      {guideNav.map((section) => (
        <CommandGroup key={section.title} heading={section.title}>
          {section.items.map((item) => (
            <CommandItem
              key={item.href}
              value={`${section.title} ${item.title}`}
              onSelect={() => go(item.href)}
            >
              <Icon name="file-text" />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
      ))}
      {categoryOrder.map((cat) => {
        const items = components.filter((c) => c.category === cat);
        if (!items.length) return null;
        return (
          <CommandGroup key={cat} heading={categoryLabels[cat]}>
            {items.map((c) => (
              <CommandItem
                key={c.slug}
                value={c.name}
                keywords={[
                  c.slug,
                  ...c.summary
                    .toLowerCase()
                    .split(/\W+/)
                    .filter((w) => w.length > 3),
                ]}
                onSelect={() => go(`/components/${c.slug}`)}
              >
                <Icon name="layout-grid" />
                {c.name}
              </CommandItem>
            ))}
          </CommandGroup>
        );
      })}
      {nativePlatforms.map((p) => (
        <CommandGroup key={p} heading={`${platformLabels[p].name} components`}>
          {native[p].map((c) => (
            <CommandItem
              key={c.name}
              value={`${platformLabels[p].name} ${c.name}`}
              keywords={[
                p,
                platformLabels[p].ui,
                ...c.summary
                  .toLowerCase()
                  .split(/\W+/)
                  .filter((w) => w.length > 3),
              ]}
              onSelect={() => go(nativePath(p, c))}
            >
              <Icon name="layout-grid" />
              {c.name}
            </CommandItem>
          ))}
        </CommandGroup>
      ))}
    </CommandPalette>
  );
}
