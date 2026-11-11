'use client';
import * as React from 'react';
import { Icon } from '../../icons/Icon.js';
import type { IconName } from '../../icons/paths.js';
import { TreeView, type TreeItem, type TreeViewProps } from '../tree-view/TreeView.js';

export interface FileTreeProps extends Omit<TreeViewProps, 'renderIcon'> {
  /** Pick an icon per file, e.g. by extension. Defaults to a document icon. */
  getFileIcon?: (item: TreeItem) => IconName;
}

const byExtension = (label: string): IconName => {
  const ext = label.split('.').pop()?.toLowerCase();
  if (!ext || ext === label.toLowerCase()) return 'file';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
  if (['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'html'].includes(ext)) return 'code';
  if (['md', 'txt', 'pdf', 'doc', 'docx', 'csv', 'xlsx'].includes(ext)) return 'file-text';
  return 'file';
};

/** A TreeView preset for folders and files, with open/closed folder icons. */
export const FileTree = React.forwardRef<HTMLUListElement, FileTreeProps>(function FileTree(
  { getFileIcon, 'aria-label': ariaLabel = 'Files', ...props },
  ref,
) {
  return (
    <TreeView
      ref={ref}
      aria-label={ariaLabel}
      className="st-file-tree"
      renderIcon={(item, state) =>
        item.children ? (
          <Icon name={state.expanded ? 'folder-open' : 'folder'} size={16} />
        ) : (
          <Icon name={getFileIcon ? getFileIcon(item) : byExtension(item.label)} size={16} />
        )
      }
      {...props}
    />
  );
});
