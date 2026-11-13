import { AiAssistantDemo } from '../../../components/ai-assistant-demo';
import { Preview } from '../../../components/preview';

export default function AiAssistantPattern() {
  return (
    <>
      <p>
        An assistant answers. An agent acts. Both earn trust the same way: they show their work, ask
        before they change anything, and make every change easy to review and undo.
      </p>
      <h2 id="example">A conversation with an agent</h2>
      <p>
        One request, from question to result. Allow the edit to see the answer, or deny it to see
        that nothing changes.
      </p>
      <div className="not-prose">
        <Preview layout="fill">
          <AiAssistantDemo />
        </Preview>
      </div>
      <h2 id="show-the-work">Show the work</h2>
      <ul>
        <li>
          List the steps of a run and mark the current one. A spinner alone says nothing about
          progress.
        </li>
        <li>
          Show each tool call with its input and result, folded by default and one press away.
        </li>
        <li>Keep reasoning optional. It opens while thinking and folds to a summary when done.</li>
        <li>Announce started, finished, stopped and failed. Never announce each token.</li>
      </ul>
      <h2 id="ask-first">Ask before acting</h2>
      <ul>
        <li>
          Anything that changes data, spends money or leaves the product goes through an approval
          that states the action, its effect and the risk.
        </li>
        <li>Deny is the safe default. Escape denies, and a timer may only ever deny.</li>
        <li>High risk needs an explicit press. Enter never allows it.</li>
        <li>Offer allow always only for low risk, repeatable actions.</li>
      </ul>
      <h2 id="review">Review and undo</h2>
      <ul>
        <li>Show a proposed change as a diff, with accept and reject for each part and for all.</li>
        <li>Mark added and removed lines with a prefix and a word, never with colour alone.</li>
        <li>Say how to undo before the change lands, and keep that promise after.</li>
      </ul>
      <h2 id="answers">Render answers safely</h2>
      <ul>
        <li>Parse Markdown to elements. Never inject model output as HTML.</li>
        <li>Limit links to web, mail and relative addresses, and keep images off by default.</li>
        <li>Give tables a caption and charts a one sentence takeaway.</li>
        <li>Link claims to their sources with numbered citations.</li>
      </ul>
      <h2 id="in-product">Assistants inside a product</h2>
      <ul>
        <li>Suggestions never move focus and never block typing. Escape dismisses them.</li>
        <li>A suggested value is not the value until the person accepts it.</li>
        <li>Mark what AI wrote, say where it came from and let people undo it.</li>
        <li>
          Dock the assistant beside the page on wide screens and open it as a sheet on phones.
        </li>
      </ul>
      <h2 id="components">Components</h2>
      <div
        className="docs-table-wrap"
        role="region"
        aria-label="Assistant and agent components"
        tabIndex={0}
      >
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">Components</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Conversation</th>
              <td>Thread, Message, MessageActions, PromptComposer, SuggestionChips</td>
            </tr>
            <tr>
              <th scope="row">Progress</th>
              <td>
                AgentStatusPill, StepTimeline, PlanChecklist, TaskQueue, SubagentTree, RunLog,
                ToolCallCard, ReasoningDisclosure
              </td>
            </tr>
            <tr>
              <th scope="row">Control</th>
              <td>ApprovalPrompt, PermissionSheet, DiffReview</td>
            </tr>
            <tr>
              <th scope="row">Output</th>
              <td>
                MarkdownRenderer, CodeSuggestion, GeneratedTable, GeneratedChart, GeneratedImage,
                FilePreviewCard, ArtifactPanel, CanvasSplitView
              </td>
            </tr>
            <tr>
              <th scope="row">In product</th>
              <td>
                CopilotPanel, AskBar, InlineSuggestion, SmartField, RewriteMenu, SummaryCard,
                InsightCallout, SemanticSearchResults
              </td>
            </tr>
            <tr>
              <th scope="row">Trust</th>
              <td>CitationChip, SourceList, AIGeneratedLabel, ConfidenceBadge, FeedbackBar</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The same names, parts and states exist on iOS and Android. Platform idioms decide the rest:
        sheets, navigation and system controls stay native.
      </p>
    </>
  );
}
