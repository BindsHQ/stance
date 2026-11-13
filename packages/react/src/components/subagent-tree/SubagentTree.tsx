'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import {
  defaultStepStatusLabels,
  StepStatusIcon,
  type AgentStepStatus,
  type StepStatusLabels,
} from '../../internal/step-status.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { TreeView, type TreeItem } from '../tree-view/TreeView.js';

export interface SubagentTreeNode {
  /** Stable id. */
  id: string;
  /** The name of the agent. */
  name: string;
  /** What the agent is doing now. */
  status: AgentStepStatus;
  /** One line on what the agent is working on or found. */
  summary?: string;
  /** The agents this agent delegated to. */
  children?: SubagentTreeNode[];
}

export interface SubagentTreeLabels {
  /** Accessible name of the tree. Default "Agents". */
  label: string;
  /** The words for each status. */
  status: StepStatusLabels;
}

export interface SubagentTreeProps extends Omit<
  React.HTMLAttributes<HTMLUListElement>,
  'onSelect' | 'children'
> {
  /** The root agents, each with the agents it delegated to. */
  nodes: SubagentTreeNode[];
  /** Controlled ids of expanded agents. */
  expandedIds?: string[];
  /** Expanded agents on first render when uncontrolled. Default: every agent with children. */
  defaultExpandedIds?: string[];
  /** Called when an agent expands or collapses. */
  onExpandedChange?: (ids: string[]) => void;
  /** Controlled id of the selected agent. Pass null for none. */
  selectedId?: string | null;
  /** Selected agent on first render when uncontrolled. */
  defaultSelectedId?: string | null;
  /** Called when the reader selects an agent. */
  onSelect?: (id: string, node: SubagentTreeNode) => void;
  /** Row height. Default `md`. */
  size?: 'sm' | 'md';
  /** Translations for the built in strings. Nested groups can be partial too. */
  labels?: { label?: string; status?: Partial<StepStatusLabels> };
}

function collect(
  nodes: SubagentTreeNode[],
  byId = new Map<string, SubagentTreeNode>(),
  parents: string[] = [],
) {
  for (const node of nodes) {
    byId.set(node.id, node);
    if (node.children?.length) {
      parents.push(node.id);
      collect(node.children, byId, parents);
    }
  }
  return { byId, parents };
}

/**
 * A tree of an agent and the agents it delegated to. Each row shows a status icon, the
 * name, a one line summary and the status in words, and follows the standard tree keys.
 */
export const SubagentTree = React.forwardRef<HTMLUListElement, SubagentTreeProps>(
  function SubagentTree(
    {
      nodes,
      expandedIds,
      defaultExpandedIds,
      onExpandedChange,
      selectedId,
      defaultSelectedId = null,
      onSelect,
      size = 'md',
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels: SubagentTreeLabels = {
      label: labelsProp?.label ?? 'Agents',
      status: { ...defaultStepStatusLabels, ...labelsProp?.status },
    };
    const { byId, parents } = React.useMemo(() => collect(nodes), [nodes]);
    const [expanded, setExpanded] = useControllableState<string[]>({
      value: expandedIds,
      defaultValue: defaultExpandedIds ?? parents,
      onChange: onExpandedChange,
    });
    const [selected, setSelected] = React.useState<string | null>(defaultSelectedId);
    const current = selectedId !== undefined ? selectedId : selected;

    const toItems = (list: SubagentTreeNode[]): TreeItem[] =>
      list.map((node) => ({
        id: node.id,
        label: node.name,
        icon: <StepStatusIcon status={node.status} size={16} />,
        meta: (
          <>
            {/* Hidden commas keep the name readable: Researcher, Found 4 clauses, Complete. */}
            <span className="st-sr-only">, </span>
            {node.summary && <span className="st-subagent-tree__summary">{node.summary}</span>}
            {node.summary && <span className="st-sr-only">, </span>}
            <span className="st-subagent-tree__status" data-status={node.status}>
              {labels.status[node.status]}
            </span>
          </>
        ),
        ...(node.children?.length ? { children: toItems(node.children) } : null),
      }));

    return (
      <TreeView
        ref={ref}
        aria-label={labels.label}
        className={cx('st-subagent-tree', className)}
        size={size}
        {...props}
        items={toItems(nodes)}
        selectionMode="single"
        selected={current ? [current] : []}
        onSelectedChange={(ids) => {
          const id = ids[0];
          const node = id ? byId.get(id) : undefined;
          if (!id || !node) return;
          setSelected(id);
          onSelect?.(id, node);
        }}
        expanded={expanded}
        onExpandedChange={setExpanded}
      />
    );
  },
);
