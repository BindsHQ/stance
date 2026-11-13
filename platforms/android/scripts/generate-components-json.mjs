// Builds platforms/android/components.json for the documentation site.
// Each example is copied from the compiled showcase source (Examples.kt, AiExamples.kt and ParityExamples.kt), so it always compiles.
// Run from the repository root: node platforms/android/scripts/generate-components-json.mjs
import { existsSync, openSync, readSync, closeSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..', '..');
const showcase = join(root, 'examples', 'android', 'StanceShowcase', 'app', 'src', 'main', 'kotlin', 'si', 'binds', 'stance', 'showcase');
const source = ['Examples.kt', 'AiExamples.kt', 'ParityExamples.kt'].map((file) => readFileSync(join(showcase, file), 'utf8')).join('\n');

const examples = {};
const lines = source.split('\n');
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^fun (\w+)Example\(\) \{$/);
  if (!m) continue;
  let end = i + 1;
  while (lines[end] !== '}') end++;
  examples[m[1]] = lines.slice(i + 1, end).map((l) => l.replace(/^ {4}/, '')).join('\n');
  i = end;
}

const touch = 'Touch target is at least 48dp.';
// [name, category, kind, wrapsNative, webEquivalent, summary, accessibility[], exampleKey?]
// webEquivalent is a web slug, an array of slugs when one native component covers several web components, or null.
const rows = [
  ['StanceTheme', 'theming', 'theme', 'MaterialTheme', 'theme-provider', 'Applies the Stance theme and bridges it into Material 3, with light, dark, high contrast and system modes.', ['System mode follows the device dark theme and contrast settings.', 'Reduced motion follows the system animation setting.']],
  ['StanceSurface', 'foundations', 'composable', 'Surface', 'box', 'A themed container with token elevation that becomes a solid outline in high contrast.', ['Clickable surfaces get button semantics and ripple.']],
  ['StanceCard', 'data-display', 'composable', 'Surface', 'card', 'Groups related content in outline, elevated or filled styles, optionally as one clickable target.', ['A clickable card is one action for screen readers.']],
  ['StanceDivider', 'foundations', 'composable', 'HorizontalDivider', ['separator', 'divider'], 'A thin horizontal or vertical line that separates content.', ['Decorative, so it is not announced.']],
  ['StanceScaffold', 'foundations', 'composable', 'Scaffold', null, 'The page frame: edge to edge on the canvas colour, with insets and an optional snackbar host.', ['Content receives system bar, cutout and keyboard insets as padding.']],
  ['StanceAdaptiveGrid', 'foundations', 'composable', 'LazyVerticalGrid', 'grid', 'A lazy grid that fits as many columns as the window allows on phones, tablets and foldables.', ['Reading order follows the grid from start to end.']],
  ['StanceIcon', 'foundations', 'composable', 'Icon', 'icon', 'Draws one of the 99 Stance icons, tinted with the current content colour.', ['Pass null as the description for decorative icons.']],
  ['stanceFocusRing', 'foundations', 'helper', 'Modifier.border', null, 'A modifier that draws the Stance focus ring while an element has keyboard or D-pad focus.', ['The ring is 2dp, or 3dp in high contrast.'], 'StanceFocusRing'],
  ['StanceButton', 'actions', 'composable', 'Button', 'button', 'Triggers an action, with six variants, three sizes, icons and a loading state.', [touch, 'Loading keeps focus and is announced as Loading.']],
  ['StanceIconButton', 'actions', 'composable', 'IconButton', 'icon-button', 'An icon-only button in ghost, outline or filled styles that requires an accessible name.', [touch, 'The content description is required.']],
  ['StanceFloatingActionButton', 'actions', 'composable', 'FloatingActionButton', 'floating-action-button', 'The primary action of a screen, as an icon or an extended button with a label.', ['Icon-only buttons are named by their content description.']],
  ['StanceButtonGroup', 'actions', 'composable', 'SingleChoiceSegmentedButtonRow', ['toggle-button', 'button-group'], 'Connected segments for choosing one of a few options.', ['Announced as a radio group with the selected segment.']],
  ['StanceSplitButton', 'actions', 'composable', 'DropdownMenu', 'split-button', 'A primary action paired with a menu of related actions.', ['The menu button has its own accessible name.']],
  ['StanceDropdownMenu', 'actions', 'composable', 'DropdownMenu', ['dropdown-menu', 'action-menu'], 'A menu of actions with icons, groups, disabled and destructive items.', ['Dismisses on back, outside taps and Escape.']],
  ['StanceFormField', 'forms', 'composable', null, ['form-field', 'label'], 'Lays out a label, a control, helper text and an announced error message.', ['Errors are a polite live region and include an icon.', 'The required marker is read as required.']],
  ['StanceTextField', 'forms', 'composable', 'OutlinedTextField', ['input', 'textarea'], 'A text input with a label above it, helper text, error state, prefix and suffix.', ['The label is the accessible name.', 'An error marks the field invalid and is announced.']],
  ['StancePasswordField', 'forms', 'composable', 'OutlinedTextField', 'password-input', 'A password input with a button to show or hide the value.', ['The toggle is named Show password or Hide password.']],
  ['StanceSearchBar', 'forms', 'composable', 'OutlinedTextField', 'search-input', 'A search field with a clear button and a search keyboard action.', ['The clear button has an accessible name.']],
  ['StanceCheckbox', 'forms', 'composable', 'TriStateCheckbox', 'checkbox', 'A checkbox with a label and description, including an indeterminate state.', [touch, 'The row is one toggle announced with its label and state.']],
  ['StanceRadioGroup', 'forms', 'composable', 'RadioButton', 'radio-group', 'A labelled set of mutually exclusive options with optional descriptions.', [touch, 'Announced as a group, with each option as a radio button.']],
  ['StanceSwitch', 'forms', 'composable', 'Switch', 'switch', 'A switch with its label for settings that apply immediately.', [touch, 'Announced as a switch with On or Off.']],
  ['StanceSlider', 'forms', 'composable', 'Slider', 'slider', 'Picks a number from a range, with a visible label and value.', ['Adjustable with arrow keys and accessibility actions.', 'The value text is announced.']],
  ['StanceRangeSlider', 'forms', 'composable', 'RangeSlider', 'range-slider', 'Picks a lower and an upper bound from a range using two thumbs.', ['Each thumb is separately focusable and adjustable.']],
  ['StanceSelect', 'forms', 'composable', 'ExposedDropdownMenuBox', ['select', 'native-select'], 'Chooses one value from a list using the platform exposed dropdown menu.', ['The field is named by its label and announces the selected value.']],
  ['StanceDatePicker', 'forms', 'composable', 'DatePickerDialog', 'date-picker', 'A date field that opens the Material date picker in a dialog.', ['Uses the platform picker, including its keyboard input mode.']],
  ['StanceDateRangePicker', 'forms', 'composable', 'DateRangePicker', 'date-range-picker', 'A field for a start and end date using the Material range picker.', ['Uses the platform picker semantics.']],
  ['StanceTimePicker', 'forms', 'composable', 'TimePicker', 'time-picker', 'A time field that opens the Material time picker, in 12 or 24 hour format.', ['Uses the platform picker semantics.']],
  ['StanceFilterChip', 'forms', 'composable', 'FilterChip', ['chip', 'filter-chip'], 'A chip that toggles a filter and shows a check when selected.', ['Announced with its selected state.']],
  ['StanceInputChip', 'forms', 'composable', 'InputChip', 'tag', 'A removable chip for something a person entered, such as a recipient.', ['The remove action has a descriptive label.']],
  ['StanceNavigationBar', 'navigation', 'composable', 'NavigationBar', 'tab-bar', 'Bottom navigation for three to five destinations on compact screens.', [touch, 'The selected destination is announced.']],
  ['StanceNavigationRail', 'navigation', 'composable', 'NavigationRail', 'sidebar', 'Side navigation for medium-width windows such as tablets in portrait.', ['The selected destination is announced.']],
  ['StanceNavigationDrawer', 'navigation', 'composable', 'PermanentNavigationDrawer', 'sidebar', 'A permanent navigation drawer for expanded windows.', ['The selected item is filled and announced as selected.']],
  ['StanceAdaptiveNavigation', 'navigation', 'composable', 'NavigationBar, NavigationRail, PermanentNavigationDrawer', ['navigation-menu', 'split-panel'], 'Navigation that switches between bar, rail and drawer by window width.', ['Order and selection are kept across layouts.']],
  ['StanceTopAppBar', 'navigation', 'composable', 'TopAppBar', null, 'The bar at the top of a screen with a title, navigation and actions.', ['The title is a heading.', 'The back button has an accessible name.']],
  ['StanceTabs', 'navigation', 'composable', 'PrimaryTabRow', 'tabs', 'Switches between views of the same context, fixed or scrollable.', ['Tabs are announced with their selected state.']],
  ['StancePagerIndicator', 'navigation', 'composable', null, null, 'Dots that show the current page of a horizontal pager.', ['Announced once as Page x of y.']],
  ['StanceStepper', 'navigation', 'composable', null, 'stepper', 'Shows progress through a multi-step flow with complete, current, upcoming and error states.', ['Each step is announced with its position and state.']],
  ['StanceListItem', 'data-display', 'composable', null, ['list-item', 'list'], 'A list row with leading content, headline, supporting text and trailing content.', [touch, 'A clickable row is one button.']],
  ['StanceBadge', 'data-display', 'composable', null, 'badge', 'A short status label in soft, solid or outline styles with five tones.', ['Status is carried by the text, not only colour.']],
  ['StanceTag', 'data-display', 'composable', null, 'tag', 'A compact keyword or category label with an optional icon.', ['Read as plain text.']],
  ['StanceAvatar', 'data-display', 'composable', null, 'avatar', 'Represents a person with their initials or an image, in three sizes.', ['Announced by the person’s name.']],
  ['StanceAvatarGroup', 'data-display', 'composable', null, 'avatar-group', 'A stack of overlapping avatars with a counter for the rest.', ['Announced as one summary of names.']],
  ['StanceProgressIndicator', 'feedback', 'composable', 'LinearProgressIndicator', 'progress', 'Linear progress with a label and percentage, determinate or indeterminate.', ['Announced with its label and percentage.']],
  ['StanceCircularProgressIndicator', 'feedback', 'composable', 'CircularProgressIndicator', ['progress-circle', 'spinner'], 'Circular progress for loading states, determinate or indeterminate.', ['Requires a description of what is loading.']],
  ['StanceSkeleton', 'feedback', 'composable', null, 'skeleton', 'A pulsing placeholder shown in place of content while it loads.', ['Hidden from screen readers.', 'The pulse stops when animations are off.']],
  ['StanceEmptyState', 'feedback', 'composable', null, 'empty-state', 'Explains an empty screen or list and offers the next step.', ['The title is a heading.']],
  ['StanceTimeline', 'data-display', 'composable', null, 'timeline', 'A vertical sequence of events with times and status tones.', ['Each event is read as one item.']],
  ['StanceStatCard', 'data-display', 'composable', null, 'stat-card', 'A key figure with its label, an icon and the change since last period.', ['The change is spoken in words.']],
  ['StanceDescriptionList', 'data-display', 'composable', null, 'description-list', 'Pairs of terms and details, such as the properties of a contract.', ['Each pair is read together.']],
  ['StanceDataTable', 'data-display', 'composable', null, ['table', 'data-table', 'data-grid'], 'A simple table that scrolls horizontally when columns do not fit.', ['Headers are headings.', 'Rows are read as header and value pairs.']],
  ['StanceSnackbarHost', 'feedback', 'composable', 'SnackbarHost', 'toast', 'Shows brief messages about completed actions, with tones and an action.', ['Messages are announced as they appear.']],
  ['StanceDialog', 'overlays', 'composable', 'BasicAlertDialog', 'dialog', 'A dialog for a focused task with custom content and actions.', ['The title is a heading.', 'Dismisses on back and outside taps.']],
  ['StanceAlertDialog', 'overlays', 'composable', 'AlertDialog', ['alert-dialog', 'confirmation-dialog'], 'Asks for a decision, with a danger style and loading state for destructive actions.', ['Uses the platform alert dialog semantics.']],
  ['StanceBottomSheet', 'overlays', 'composable', 'ModalBottomSheet', ['sheet', 'drawer'], 'A modal bottom sheet for secondary tasks, with a drag handle and title.', ['Supports drag, back and scrim taps to dismiss.']],
  ['StanceTooltip', 'overlays', 'composable', 'TooltipBox', 'tooltip', 'A short hint shown on long press, hover or keyboard focus.', ['Supplementary only, never essential information.']],
  ['StanceInlineAlert', 'feedback', 'composable', null, 'alert', 'A status message placed inside the content it relates to.', ['Warnings and errors are announced immediately.']],
  ['StanceBanner', 'feedback', 'composable', null, 'banner', 'A page-level announcement across the top of a screen.', ['Announced as a live region.', 'The dismiss button has a name.']],
  ['StanceLoadingOverlay', 'feedback', 'composable', null, 'loading-overlay', 'Covers content with a scrim and progress indicator while work is in progress.', ['The message is announced and taps are blocked.']],
  ['StanceErrorState', 'feedback', 'composable', null, 'error-boundary', 'Explains that something failed and offers a retry action.', ['The title is a heading.']],
  ['StancePullToRefresh', 'advanced', 'composable', 'PullToRefreshBox', null, 'Wraps scrollable content with the platform pull-to-refresh gesture.', ['Offer a refresh action for people who cannot use the gesture.']],
  ['StanceSwipeActions', 'advanced', 'composable', 'SwipeToDismissBox', null, 'Reveals an action such as delete or archive when a row is swiped.', ['The same actions are exposed as accessibility custom actions.']],
  ['StanceSearchableList', 'advanced', 'composable', 'LazyColumn', ['searchable-list', 'command-menu', 'command-palette'], 'A search field over a filtered list with a result count and empty state.', ['The result count is announced as people type.']],
  ['StanceFilterBar', 'advanced', 'composable', null, 'filter-bar', 'A scrolling row of filter chips with a clear-all action.', ['Each chip announces its selected state.']],
  ['StanceSignatureCanvas', 'advanced', 'composable', 'Canvas', 'signature-pad', 'An area for drawing a signature with undo, clear and image export.', ['Announces whether it is signed.', 'Offer a typed or uploaded alternative.']],
  ['rememberStancePhotoPicker', 'advanced', 'helper', 'ActivityResultContracts.PickVisualMedia', 'file-upload', 'Launches the system Photo Picker for one or more images, with no storage permission.', ['Uses the accessible system picker.'], 'StancePhotoPicker'],
  ['rememberStanceDocumentPicker', 'advanced', 'helper', 'ActivityResultContracts.OpenDocument', 'file-upload', 'Launches the system file picker for attaching documents.', ['Uses the accessible system picker.'], 'StanceDocumentPicker'],
  ['StanceButtonView', 'advanced', 'helper', 'AbstractComposeView', null, 'A Stance button usable from XML layouts and View code.', ['Keeps the same semantics as StanceButton.']],
  ['setStanceContent', 'advanced', 'helper', 'ComposeView', null, 'Hosts Stance content inside an existing View hierarchy.', ['Composed content keeps its semantics inside Views.'], 'StanceComposeView'],
  // AI components, wave one. The contract is specs/ai-components.json.
  ['StanceThread', 'ai', 'composable', 'LazyColumn', 'thread', 'The scrolling container for a conversation. Follows the newest message only while the reader is at the bottom.', ['A list named by its label.', 'New responses are announced once, when complete.']],
  ['StanceMessage', 'ai', 'composable', null, 'message', 'One turn in a conversation from the user, the assistant or the system, as a bubble or plain.', ['The author and time are a heading.', 'Status is read as the heading state while a response arrives.', 'Message actions are screen reader custom actions.']],
  ['StanceMessageGroup', 'ai', 'composable', null, 'message-group', 'Consecutive messages from one author under a single avatar and name.', ['The author row is a heading.']],
  ['StanceMessageActions', 'ai', 'composable', 'IconToggleButton', 'message-actions', 'The row of actions under a message: copy, retry, edit, good response and bad response.', [touch, 'Rating buttons are toggles.', 'Copy confirms with a polite announcement.']],
  ['StanceBranchSwitcher', 'ai', 'composable', null, 'branch-switcher', 'Steps between alternative versions of a message after an edit or retry.', [touch, 'The position, for example 2 of 3, is a polite live region.', 'Arrows mirror in right to left layouts.']],
  ['StanceScrollToLatest', 'ai', 'composable', 'Surface', 'scroll-to-latest', 'A floating button that appears when the reader has scrolled away from the newest message.', [touch, 'The name includes the number of new messages.']],
  ['StanceConversationList', 'ai', 'composable', 'LazyColumn', 'conversation-list', 'A list of past conversations grouped by date, with selection, rename, delete and pin.', ['Group names are headings.', 'The current conversation is announced as selected.', 'Row actions are also screen reader custom actions.']],
  ['StanceThreadEmptyState', 'ai', 'composable', null, 'thread-empty-state', 'The opening screen of a new conversation with a greeting and starter prompts.', ['The title is a heading.', 'Each starter is one button.']],
  ['StancePromptComposer', 'ai', 'composable', 'BasicTextField', 'prompt-composer', 'The message input: a text area that grows with content, with slots and a send button that becomes stop.', [touch, 'Send is disabled when the draft is empty.', 'While a response arrives the same button is named Stop.']],
  ['StanceAttachmentTray', 'ai', 'composable', null, 'attachment-tray', 'The attachments on a draft or a sent message, with progress, errors and remove.', ['Each remove button names its file.', 'Upload errors are announced.']],
  ['StanceMentionPicker', 'ai', 'composable', 'Popup', 'mention-picker', 'A filterable list that opens above the composer to reference files, people or tools.', ['Does not take focus, so typing continues.', 'The active row is announced as selected.', 'Closes on back, Escape and outside taps.']],
  ['StanceSlashCommandMenu', 'ai', 'composable', 'Popup', 'slash-command-menu', 'A command list that opens above the composer when the draft starts with a slash.', ['Same list behaviour as the mention picker.']],
  ['StanceModelPicker', 'ai', 'composable', 'ModalBottomSheet', 'model-picker', 'Chooses the model for the next message, with a short description and capability badges.', [touch, 'The sheet is a radio group with the chosen model selected.']],
  ['StanceContextChips', 'ai', 'composable', null, 'context-chips', 'Shows what the assistant can see for this message, such as files or pages, each removable.', [touch, 'A removable chip is one button named Remove and its label.']],
  ['StanceVoiceInputButton', 'ai', 'composable', 'IconButton', 'voice-input-button', 'A microphone button with idle, listening and processing states and a level ring.', [touch, 'A toggle button whose state changes are announced.']],
  ['StanceStopButton', 'ai', 'composable', 'IconButton', 'stop-button', 'Stops a response that is being generated, as an icon or a labelled button.', [touch, 'Named Stop for screen readers.']],
  ['StanceTokenBudgetMeter', 'ai', 'composable', null, 'token-budget-meter', 'A compact meter of how much of the context or message limit is used, as a ring, bar or text.', ['A progress value with value text.', 'Crossing the warning threshold or the limit is announced once.', 'The warning has an icon, not colour alone.']],
  ['StanceStreamingText', 'ai', 'composable', 'Text', 'streaming-text', 'Reveals text as it arrives at a steady cadence with a caret, without moving lines already shown.', ['Announced once when complete, never token by token.', 'Shows at once when animations are off.']],
  ['StanceThinkingIndicator', 'ai', 'composable', null, 'thinking-indicator', 'Shows that the assistant is working before any text arrives, with a label and elapsed time.', ['A polite status.', 'A static mark with the label when animations are off.']],
  ['StanceReasoningDisclosure', 'ai', 'composable', null, 'reasoning-disclosure', 'A collapsible block for reasoning: open while thinking, collapsed to a summary when done.', [touch, 'A button that reports expanded or collapsed.', 'The summary reads, for example, Thought for 12 seconds.']],
  ['StanceShimmerText', 'ai', 'composable', 'Text', 'shimmer-text', 'A label with a gentle moving highlight while work is under way, such as Searching the web.', ['Plain text to screen readers.', 'No sweep when animations are off.']],
  ['StanceGenerationProgress', 'ai', 'composable', 'LinearProgressIndicator', 'generation-progress', 'Progress for longer generations such as images or documents, with a stage label and cancel.', ['Announced with its label and percentage.', 'Stage changes are announced politely.']],
  ['StanceStreamingSkeleton', 'ai', 'composable', null, 'streaming-skeleton', 'Placeholder lines, card or image for a response that has been requested and has not started.', ['Read as one loading status.', 'The pulse stops when animations are off.']],
  ['StanceInterruptedState', 'ai', 'composable', null, 'interrupted-state', 'Marks a response that was stopped or failed part way, with retry and continue.', ['Errors and lost connections are alerts.', 'Stopped and limit are polite statuses.']],
  ['StanceCitationChip', 'ai', 'composable', 'ModalBottomSheet', 'citation-chip', 'A numbered marker that links a claim to its source and previews it in a bottom sheet.', [touch, 'A button named, for example, Source 2 and the title.', 'The preview is reachable by touch, keyboard and screen reader.']],
  ['StanceSourceList', 'ai', 'composable', null, 'source-list', 'The sources behind an answer, as a compact row of chips that expands to a full list.', ['The title is a heading.', 'Each chip is named by its source title.']],
  ['StanceSourcePreview', 'ai', 'composable', 'Surface', 'source-preview', 'A card for one source: site, title, snippet and a link to open it.', ['The link is a button with a visible label.']],
  ['StanceConfidenceBadge', 'ai', 'composable', null, 'confidence-badge', 'States how sure the system is in words with a distinct icon, never colour alone.', ['Read as the label and its description together.']],
  ['StanceAIGeneratedLabel', 'ai', 'composable', null, 'ai-generated-label', 'Marks content as generated, assisted or edited by AI, with the sparkle icon and the model name.', ['Read as one phrase.']],
  ['StanceDisclaimerNote', 'ai', 'composable', null, 'disclaimer-note', 'Small print beneath the composer or a reply, for example a reminder to verify key facts.', ['Read as plain text.']],
  ['StanceFeedbackBar', 'ai', 'composable', 'IconToggleButton', 'feedback-bar', 'Thumbs up or down, followed by optional reasons and a comment, then a thank you.', [touch, 'Rating buttons are toggles.', 'Reasons are a labelled group.', 'The thank you is announced.']],
  ['StanceReportDialog', 'ai', 'composable', 'ModalBottomSheet', 'report-dialog', 'A bottom sheet to report a response with a category and details.', ['The title is a heading.', 'Categories are a radio group.', 'Stays open and busy while the report is sent.']],
  ['StanceSensitiveContentGate', 'ai', 'composable', null, 'sensitive-content-gate', 'Hides content behind a notice until the reader chooses to see it.', ['Hidden content is absent from the accessibility tree.', 'Focus moves to the content on reveal.']],
  // Native parity: web components that had no Android counterpart. The plan is specs/native-parity.json.
  ['StanceAccordion', 'data-display', 'composable', 'AnimatedVisibility', 'accordion', 'Stacked section headings that open to reveal their content, one at a time or several together.', [touch, 'Each header is a heading that reports Expanded or Collapsed.', 'Opens at once when animations are off.']],
  ['StanceCollapsible', 'data-display', 'composable', 'AnimatedVisibility', 'collapsible', 'A single heading that shows or hides the content beneath it, for optional detail.', [touch, 'The header has expand and collapse actions and reports its state.']],
  ['StanceCalendar', 'forms', 'composable', 'DatePicker', 'calendar', 'An inline month grid for picking a day, built on the Material date picker without a dialog.', ['Each day is a button named by its full date.', 'Days outside the allowed range are disabled.']],
  ['StanceChart', 'data-display', 'composable', 'Canvas', 'chart-container', 'Line, bar and area charts drawn on Canvas, with a spoken summary and a stop for each category.', ['The chart is read as one summary, then one stop per category with every value.', 'Lines differ by dash pattern as well as colour.']],
  ['StanceCheckboxGroup', 'forms', 'composable', 'TriStateCheckbox', 'checkbox-group', 'A labelled set of checkboxes for choosing several options, with an optional select all.', [touch, 'Select all is a tri state checkbox that reads mixed when some are chosen.', 'Errors are announced.']],
  ['StanceCodeBlock', 'data-display', 'composable', 'SelectionContainer', ['code-block', 'copyable-code', 'code'], 'Monospaced source code in a bordered block that scrolls sideways, with line numbers and copy.', ['Line numbers are hidden from screen readers.', 'Code stays left to right in right to left layouts.']],
  ['StanceCopyButton', 'actions', 'composable', 'ClipboardManager', 'copy-button', 'Copies text to the clipboard, then confirms with a check, a haptic tick and a spoken Copied.', [touch, 'The confirmation is a polite live region.']],
  ['StanceCombobox', 'forms', 'composable', 'ExposedDropdownMenuBox', 'combobox', 'A text field that narrows a list of options as you type, then fills in the chosen one.', ['The keyboard stays open while the list filters.', 'An empty result is announced.']],
  ['StanceMultiSelect', 'forms', 'composable', 'ExposedDropdownMenuBox', 'multi-select', 'Picks several values from a searchable menu and shows each one as a removable chip.', ['Options are checkboxes announced with their state.', 'Each chip has a named remove action.']],
  ['stanceContextMenu', 'actions', 'helper', 'DropdownMenu', 'context-menu', 'A modifier that opens a menu of actions at the point where an element is long pressed.', ['Screen readers get a named long click action.', 'A long press never also clicks the element underneath.'], 'StanceContextMenu'],
  ['StanceTreeView', 'data-display', 'composable', 'LazyColumn', ['tree-view', 'file-tree'], 'A lazy hierarchy of folders and items that expand and collapse, with optional selection.', [touch, 'Rows report Expanded or Collapsed and their position.', 'Chevrons mirror in right to left layouts.']],
  ['StanceInlineEdit', 'forms', 'composable', 'OutlinedTextField', 'inline-edit', 'Text that becomes an editable field when tapped, with save, cancel and validation.', [touch, 'The read view is one button named, for example, Edit template name.', 'Back cancels the edit.']],
  ['StanceNotificationItem', 'feedback', 'composable', 'SwipeToDismissBox', 'notification', 'One notification row with title, body, time, an unread marker and swipe actions.', ['Unread is spoken, not shown by the dot alone.', 'Mark as read and swipe actions are also custom actions.']],
  ['StanceNumberField', 'forms', 'composable', 'OutlinedTextField', 'number-input', 'A numeric input with step buttons, bounds and number formatting for the current locale.', [touch, 'Step buttons are named and disabled at the bounds.', 'Arrow keys step on a hardware keyboard.']],
  ['StancePagination', 'navigation', 'composable', 'IconButton', 'pagination', 'Previous and next controls with a page summary, plus numbered page buttons on wide windows.', [touch, 'The page summary is a polite live region.', 'Arrows mirror in right to left layouts.']],
  ['StancePinField', 'forms', 'composable', 'BasicTextField', 'pin-input', 'Boxes for a one time code or PIN that accept typing, paste and SMS code autofill.', ['One field for screen readers, with progress such as 2 of 6 entered.', 'A masked field is announced as a password.']],
  ['StancePopover', 'overlays', 'composable', 'Popup', 'popover', 'A small floating panel with a caret that points at the control that opened it.', ['Announced as a pane named by its title.', 'Dismisses on back and outside taps.']],
  ['StanceRichText', 'data-display', 'composable', 'Text', 'rich-text', 'Renders Markdown with Stance type styles, including headings, lists, quotes and links.', ['Headings are marked as headings.', 'Links are real link annotations that TalkBack can open.']],
  ['StanceSortableList', 'advanced', 'composable', 'LazyColumn', 'sortable-list', 'A list reordered by dragging a handle, with move up and move down as accessible actions.', ['Move up and Move down are custom actions on every row.', 'The new position is announced after a move.']],
  ['StanceThemeSwitcher', 'theming', 'composable', 'SingleChoiceSegmentedButtonRow', 'theme-switcher', 'A segmented control for choosing system, light, dark or high contrast appearance.', [touch, 'Announced as a group with the chosen appearance selected.']],
  ['StanceToolbar', 'actions', 'composable', 'Surface', 'toolbar', 'A raised pill of related icon actions, such as text formatting, that floats over content.', ['Read as one group named by its label.', 'Scrolls when the actions do not fit.']],
];

// Previews are rendered from the real composables by the showcase build:
//   cd examples/android/StanceShowcase && ./gradlew :app:generateStancePreviews
const previewsDir = join(root, 'platforms', 'android', 'previews');
const themes = ['light', 'dark', 'high-contrast'];
const SCALE = 2; // previews are rendered at xhdpi
const slug = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
/** Entries that draw nothing on their own. */
const nonVisual = new Set(['rememberStancePhotoPicker', 'rememberStanceDocumentPicker', 'setStanceContent']);

function pngSize(file) {
  const fd = openSync(file, 'r');
  const header = Buffer.alloc(24);
  readSync(fd, header, 0, 24, 0);
  closeSync(fd);
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

const missingPreviews = [];
function previewFor(name) {
  if (nonVisual.has(name)) return null;
  const files = Object.fromEntries(themes.map((t) => [t, `previews/${slug(name)}.${t}.png`]));
  const absent = themes.filter((t) => !existsSync(join(root, 'platforms', 'android', files[t])));
  if (absent.length) {
    missingPreviews.push(`${name} (${absent.join(', ')})`);
    return null;
  }
  const { width, height } = pngSize(join(previewsDir, `${slug(name)}.light.png`));
  return { ...files, width: Math.round(width / SCALE), height: Math.round(height / SCALE) };
}

const missing = [];
const components = rows.map(([name, category, kind, wrapsNative, webEquivalent, summary, accessibility, key]) => {
  const example = examples[key ?? name];
  if (!example) missing.push(name);
  if (summary.length < 50 || summary.length > 160) throw new Error(`${name}: summary is ${summary.length} characters`);
  const slugs = Array.isArray(webEquivalent) ? webEquivalent : webEquivalent === null ? [] : [webEquivalent];
  if (Array.isArray(webEquivalent) && webEquivalent.length < 2) throw new Error(`${name}: use a plain string for a single web equivalent`);
  if (slugs.some((s) => typeof s !== 'string' || !/^[a-z0-9-]+$/.test(s)) || new Set(slugs).size !== slugs.length) {
    throw new Error(`${name}: webEquivalent must be web slugs without repeats`);
  }
  return { name, category, summary, kind, wrapsNative, status: 'beta', example, accessibility, webEquivalent, preview: previewFor(name) };
});
if (missing.length) throw new Error(`No compiled example for: ${missing.join(', ')}`);
const unused = Object.keys(examples).filter((k) => !rows.some((r) => (r[7] ?? r[0]) === k));
if (unused.length) throw new Error(`Examples without an inventory entry: ${unused.join(', ')}`);
const repeated = components.map((c) => c.summary).filter((summary, i, all) => all.indexOf(summary) !== i);
if (repeated.length) throw new Error(`Summaries must be unique: ${repeated.join(' | ')}`);

writeFileSync(join(root, 'platforms', 'android', 'components.json'), JSON.stringify(components, null, 2) + '\n');
if (missingPreviews.length) console.warn(`No preview image yet for: ${missingPreviews.join('; ')}`);
const withPreview = components.filter((c) => c.preview).length;
console.log(`components.json: ${components.length} entries, ${withPreview} with previews, ${components.length - withPreview} without`);
