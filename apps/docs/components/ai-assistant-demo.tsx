'use client';
import * as React from 'react';
import {
  AgentStatusPill,
  ApprovalPrompt,
  Button,
  DiffReview,
  GeneratedTable,
  MarkdownRenderer,
  Message,
  MessageActions,
  PromptComposer,
  ReasoningDisclosure,
  StepTimeline,
  SuggestionChips,
  Thread,
  ToolCallCard,
  diffLines,
} from '@bindshq/stance-react';
import type { AgentStatus, StepTimelineStep } from '@bindshq/stance-react';

type Stage = 'waiting' | 'working' | 'done' | 'denied';

const before = [
  'Either party may end this agreement',
  'with 90 days written notice.',
  'Notice is sent to the address in clause 12.',
].join('\n');
const after = before.replace('90 days', '60 days');

const files = [
  {
    id: 'msa',
    path: 'templates/master-services.md',
    status: 'modified' as const,
    hunks: diffLines(before, after, { idPrefix: 'msa' }),
  },
];

const sources = {
  1: {
    title: 'Master services template',
    url: 'https://example.com/templates/master-services',
    snippet: 'Either party may end this agreement with 60 days written notice.',
  },
};

const answer = [
  'Done. The notice period is now **60 days** in both templates [1].',
  '',
  '- Agreements already signed keep their own terms',
  '- New drafts use the shorter period from today',
].join('\n');

const columns = [
  { id: 'template', header: 'Template' },
  { id: 'before', header: 'Before', numeric: true },
  { id: 'after', header: 'After', numeric: true },
];
const rows = [
  { template: 'Master services', before: 90, after: 60 },
  { template: 'Reseller', before: 90, after: 60 },
];

const statusOf: Record<Stage, { status: AgentStatus; detail: string }> = {
  waiting: { status: 'waiting', detail: 'Needs your approval' },
  working: { status: 'working', detail: 'Editing templates' },
  done: { status: 'done', detail: '2 templates updated' },
  denied: { status: 'idle', detail: 'No changes made' },
};

/** Wave one and wave two components composed as one agent conversation. */
export function AiAssistantDemo() {
  const [stage, setStage] = React.useState<Stage>('waiting');
  React.useEffect(() => {
    if (stage !== 'working') return;
    const timer = window.setTimeout(() => setStage('done'), 1600);
    return () => window.clearTimeout(timer);
  }, [stage]);

  const edit =
    stage === 'done'
      ? 'complete'
      : stage === 'working'
        ? 'running'
        : stage === 'denied'
          ? 'skipped'
          : 'waiting';
  const steps: StepTimelineStep[] = [
    { id: 'find', title: 'Find templates with a notice period', status: 'complete', duration: 1.2 },
    { id: 'draft', title: 'Draft the change', status: 'complete', duration: 3.4 },
    { id: 'edit', title: 'Edit 2 templates', status: edit },
    {
      id: 'report',
      title: 'Summarise the effect',
      status: stage === 'done' ? 'complete' : stage === 'denied' ? 'skipped' : 'pending',
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: 640,
        height: 680,
        border: '1px solid var(--st-color-border-default)',
        borderRadius: 'var(--st-radius-xl)',
        background: 'var(--st-color-bg-surface)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 16px',
          borderBottom: '1px solid var(--st-color-border-default)',
        }}
      >
        <strong style={{ fontSize: 14 }}>Contract assistant</strong>
        <AgentStatusPill size="sm" {...statusOf[stage]} />
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Thread label="Conversation with the contract assistant">
          <Message role="user" author="Priya" timestamp="10:41">
            Shorten the notice period to 60 days in our templates and tell me what changes.
          </Message>
          <Message author="Assistant" timestamp="10:41" variant="plain">
            <div style={{ display: 'grid', gap: 12 }}>
              <ReasoningDisclosure duration={6}>
                Two templates set a notice period. Both say 90 days in the termination clause.
              </ReasoningDisclosure>
              <StepTimeline steps={steps} compact />
              <ToolCallCard
                name="search_templates"
                title="Search templates"
                status="complete"
                duration={1.2}
                input={'{ "query": "notice period" }'}
                output={'{ "matches": ["master-services.md", "reseller.md"] }'}
              />
              {stage === 'waiting' && (
                <ApprovalPrompt
                  title="Edit 2 templates"
                  description="Changes the notice period from 90 to 60 days. You can undo this from version history."
                  risk="medium"
                  details={<DiffReview files={files} readOnly />}
                  onAllow={() => setStage('working')}
                  onDeny={() => setStage('denied')}
                />
              )}
              {stage === 'denied' && (
                <MarkdownRenderer size="sm">
                  No changes were made. Say the word if you would like a different notice period.
                </MarkdownRenderer>
              )}
              {stage === 'done' && (
                <>
                  <MarkdownRenderer size="sm" citations={sources} linkTarget="_blank">
                    {answer}
                  </MarkdownRenderer>
                  <GeneratedTable
                    columns={columns}
                    rows={rows}
                    caption="Notice period in days"
                    sortable={false}
                  />
                  <MessageActions onCopy={() => {}} copyValue={answer} onRate={() => {}} />
                  <SuggestionChips
                    label="Follow up"
                    size="sm"
                    items={[
                      { id: 'undo', label: 'Undo the change' },
                      { id: 'who', label: 'Who uses these templates?' },
                    ]}
                    onSelect={(item) => {
                      if (item.id === 'undo') setStage('waiting');
                    }}
                  />
                </>
              )}
            </div>
          </Message>
        </Thread>
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--st-color-border-default)' }}>
        <PromptComposer
          placeholder="Ask a follow up"
          status={stage === 'working' ? 'streaming' : 'idle'}
          onStop={() => setStage('denied')}
          footer={
            stage === 'waiting' ? undefined : (
              <Button size="xs" variant="ghost" onClick={() => setStage('waiting')}>
                Start again
              </Button>
            )
          }
        />
      </div>
    </div>
  );
}
