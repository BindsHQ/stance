// Builds platforms/android/components.json for the documentation site.
// Each example is copied from the compiled showcase source (Examples.kt), so it always compiles.
// Run from the repository root: node platforms/android/scripts/generate-components-json.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..', '..');
const source = readFileSync(join(root, 'examples', 'android', 'StanceShowcase', 'app', 'src', 'main', 'kotlin', 'si', 'binds', 'stance', 'showcase', 'Examples.kt'), 'utf8');

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
const rows = [
  ['StanceTheme', 'theming', 'theme', 'MaterialTheme', 'theme-provider', 'Applies the Stance theme and bridges it into Material 3, with light, dark, high contrast and system modes.', ['System mode follows the device dark theme and contrast settings.', 'Reduced motion follows the system animation setting.']],
  ['StanceSurface', 'foundations', 'composable', 'Surface', 'box', 'A themed container with token elevation that becomes a solid outline in high contrast.', ['Clickable surfaces get button semantics and ripple.']],
  ['StanceCard', 'data-display', 'composable', 'Surface', 'card', 'Groups related content in outline, elevated or filled styles, optionally as one clickable target.', ['A clickable card is one action for screen readers.']],
  ['StanceDivider', 'foundations', 'composable', 'HorizontalDivider', 'separator', 'A thin horizontal or vertical line that separates content.', ['Decorative, so it is not announced.']],
  ['StanceScaffold', 'foundations', 'composable', 'Scaffold', null, 'The page frame: edge to edge on the canvas colour, with insets and an optional snackbar host.', ['Content receives system bar, cutout and keyboard insets as padding.']],
  ['StanceAdaptiveGrid', 'foundations', 'composable', 'LazyVerticalGrid', 'grid', 'A lazy grid that fits as many columns as the window allows on phones, tablets and foldables.', ['Reading order follows the grid from start to end.']],
  ['StanceIcon', 'foundations', 'composable', 'Icon', 'icon', 'Draws one of the 90 Stance icons, tinted with the current content colour.', ['Pass null as the description for decorative icons.']],
  ['stanceFocusRing', 'foundations', 'helper', 'Modifier.border', null, 'A modifier that draws the Stance focus ring while an element has keyboard or D-pad focus.', ['The ring is 2dp, or 3dp in high contrast.'], 'StanceFocusRing'],
  ['StanceButton', 'actions', 'composable', 'Button', 'button', 'Triggers an action, with six variants, three sizes, icons and a loading state.', [touch, 'Loading keeps focus and is announced as Loading.']],
  ['StanceIconButton', 'actions', 'composable', 'IconButton', 'icon-button', 'An icon-only button in ghost, outline or filled styles that requires an accessible name.', [touch, 'The content description is required.']],
  ['StanceFloatingActionButton', 'actions', 'composable', 'FloatingActionButton', 'floating-action-button', 'The primary action of a screen, as an icon or an extended button with a label.', ['Icon-only buttons are named by their content description.']],
  ['StanceButtonGroup', 'actions', 'composable', 'SingleChoiceSegmentedButtonRow', 'toggle-button', 'Connected segments for choosing one of a few options.', ['Announced as a radio group with the selected segment.']],
  ['StanceSplitButton', 'actions', 'composable', 'DropdownMenu', 'split-button', 'A primary action paired with a menu of related actions.', ['The menu button has its own accessible name.']],
  ['StanceDropdownMenu', 'actions', 'composable', 'DropdownMenu', 'dropdown-menu', 'A menu of actions with icons, groups, disabled and destructive items.', ['Dismisses on back, outside taps and Escape.']],
  ['StanceFormField', 'forms', 'composable', null, 'form-field', 'Lays out a label, a control, helper text and an announced error message.', ['Errors are a polite live region and include an icon.', 'The required marker is read as required.']],
  ['StanceTextField', 'forms', 'composable', 'OutlinedTextField', 'input', 'A text input with a label above it, helper text, error state, prefix and suffix.', ['The label is the accessible name.', 'An error marks the field invalid and is announced.']],
  ['StancePasswordField', 'forms', 'composable', 'OutlinedTextField', 'password-input', 'A password input with a button to show or hide the value.', ['The toggle is named Show password or Hide password.']],
  ['StanceSearchBar', 'forms', 'composable', 'OutlinedTextField', 'search-input', 'A search field with a clear button and a search keyboard action.', ['The clear button has an accessible name.']],
  ['StanceCheckbox', 'forms', 'composable', 'TriStateCheckbox', 'checkbox', 'A checkbox with a label and description, including an indeterminate state.', [touch, 'The row is one toggle announced with its label and state.']],
  ['StanceRadioGroup', 'forms', 'composable', 'RadioButton', 'radio-group', 'A labelled set of mutually exclusive options with optional descriptions.', [touch, 'Announced as a group, with each option as a radio button.']],
  ['StanceSwitch', 'forms', 'composable', 'Switch', 'switch', 'A switch with its label for settings that apply immediately.', [touch, 'Announced as a switch with On or Off.']],
  ['StanceSlider', 'forms', 'composable', 'Slider', 'slider', 'Picks a number from a range, with a visible label and value.', ['Adjustable with arrow keys and accessibility actions.', 'The value text is announced.']],
  ['StanceRangeSlider', 'forms', 'composable', 'RangeSlider', 'range-slider', 'Picks a lower and an upper bound from a range using two thumbs.', ['Each thumb is separately focusable and adjustable.']],
  ['StanceSelect', 'forms', 'composable', 'ExposedDropdownMenuBox', 'select', 'Chooses one value from a list using the platform exposed dropdown menu.', ['The field is named by its label and announces the selected value.']],
  ['StanceDatePicker', 'forms', 'composable', 'DatePickerDialog', 'date-picker', 'A date field that opens the Material date picker in a dialog.', ['Uses the platform picker, including its keyboard input mode.']],
  ['StanceDateRangePicker', 'forms', 'composable', 'DateRangePicker', 'date-range-picker', 'A field for a start and end date using the Material range picker.', ['Uses the platform picker semantics.']],
  ['StanceTimePicker', 'forms', 'composable', 'TimePicker', 'time-picker', 'A time field that opens the Material time picker, in 12 or 24 hour format.', ['Uses the platform picker semantics.']],
  ['StanceFilterChip', 'forms', 'composable', 'FilterChip', 'chip', 'A chip that toggles a filter and shows a check when selected.', ['Announced with its selected state.']],
  ['StanceInputChip', 'forms', 'composable', 'InputChip', 'tag', 'A removable chip for something a person entered, such as a recipient.', ['The remove action has a descriptive label.']],
  ['StanceNavigationBar', 'navigation', 'composable', 'NavigationBar', 'tab-bar', 'Bottom navigation for three to five destinations on compact screens.', [touch, 'The selected destination is announced.']],
  ['StanceNavigationRail', 'navigation', 'composable', 'NavigationRail', 'sidebar', 'Side navigation for medium-width windows such as tablets in portrait.', ['The selected destination is announced.']],
  ['StanceNavigationDrawer', 'navigation', 'composable', 'PermanentNavigationDrawer', 'sidebar', 'A permanent navigation drawer for expanded windows.', ['The selected item is filled and announced as selected.']],
  ['StanceAdaptiveNavigation', 'navigation', 'composable', 'NavigationBar, NavigationRail, PermanentNavigationDrawer', null, 'Navigation that switches between bar, rail and drawer by window width.', ['Order and selection are kept across layouts.']],
  ['StanceTopAppBar', 'navigation', 'composable', 'TopAppBar', null, 'The bar at the top of a screen with a title, navigation and actions.', ['The title is a heading.', 'The back button has an accessible name.']],
  ['StanceTabs', 'navigation', 'composable', 'PrimaryTabRow', 'tabs', 'Switches between views of the same context, fixed or scrollable.', ['Tabs are announced with their selected state.']],
  ['StancePagerIndicator', 'navigation', 'composable', null, null, 'Dots that show the current page of a horizontal pager.', ['Announced once as Page x of y.']],
  ['StanceStepper', 'navigation', 'composable', null, 'stepper', 'Shows progress through a multi-step flow with complete, current, upcoming and error states.', ['Each step is announced with its position and state.']],
  ['StanceListItem', 'data-display', 'composable', null, 'list-item', 'A list row with leading content, headline, supporting text and trailing content.', [touch, 'A clickable row is one button.']],
  ['StanceBadge', 'data-display', 'composable', null, 'badge', 'A short status label in soft, solid or outline styles with five tones.', ['Status is carried by the text, not only colour.']],
  ['StanceTag', 'data-display', 'composable', null, 'tag', 'A compact keyword or category label with an optional icon.', ['Read as plain text.']],
  ['StanceAvatar', 'data-display', 'composable', null, 'avatar', 'Represents a person with their initials or an image, in three sizes.', ['Announced by the person’s name.']],
  ['StanceAvatarGroup', 'data-display', 'composable', null, 'avatar-group', 'A stack of overlapping avatars with a counter for the rest.', ['Announced as one summary of names.']],
  ['StanceProgressIndicator', 'feedback', 'composable', 'LinearProgressIndicator', 'progress', 'Linear progress with a label and percentage, determinate or indeterminate.', ['Announced with its label and percentage.']],
  ['StanceCircularProgressIndicator', 'feedback', 'composable', 'CircularProgressIndicator', 'progress-circle', 'Circular progress for loading states, determinate or indeterminate.', ['Requires a description of what is loading.']],
  ['StanceSkeleton', 'feedback', 'composable', null, 'skeleton', 'A pulsing placeholder shown in place of content while it loads.', ['Hidden from screen readers.', 'The pulse stops when animations are off.']],
  ['StanceEmptyState', 'feedback', 'composable', null, 'empty-state', 'Explains an empty screen or list and offers the next step.', ['The title is a heading.']],
  ['StanceTimeline', 'data-display', 'composable', null, 'timeline', 'A vertical sequence of events with times and status tones.', ['Each event is read as one item.']],
  ['StanceStatCard', 'data-display', 'composable', null, 'stat-card', 'A key figure with its label, an icon and the change since last period.', ['The change is spoken in words.']],
  ['StanceDescriptionList', 'data-display', 'composable', null, 'description-list', 'Pairs of terms and details, such as the properties of a contract.', ['Each pair is read together.']],
  ['StanceDataTable', 'data-display', 'composable', null, 'table', 'A simple table that scrolls horizontally when columns do not fit.', ['Headers are headings.', 'Rows are read as header and value pairs.']],
  ['StanceSnackbarHost', 'feedback', 'composable', 'SnackbarHost', 'toast', 'Shows brief messages about completed actions, with tones and an action.', ['Messages are announced as they appear.']],
  ['StanceDialog', 'overlays', 'composable', 'BasicAlertDialog', 'dialog', 'A dialog for a focused task with custom content and actions.', ['The title is a heading.', 'Dismisses on back and outside taps.']],
  ['StanceAlertDialog', 'overlays', 'composable', 'AlertDialog', 'alert-dialog', 'Asks for a decision, with a danger style and loading state for destructive actions.', ['Uses the platform alert dialog semantics.']],
  ['StanceBottomSheet', 'overlays', 'composable', 'ModalBottomSheet', 'sheet', 'A modal bottom sheet for secondary tasks, with a drag handle and title.', ['Supports drag, back and scrim taps to dismiss.']],
  ['StanceTooltip', 'overlays', 'composable', 'TooltipBox', 'tooltip', 'A short hint shown on long press, hover or keyboard focus.', ['Supplementary only, never essential information.']],
  ['StanceInlineAlert', 'feedback', 'composable', null, 'alert', 'A status message placed inside the content it relates to.', ['Warnings and errors are announced immediately.']],
  ['StanceBanner', 'feedback', 'composable', null, 'banner', 'A page-level announcement across the top of a screen.', ['Announced as a live region.', 'The dismiss button has a name.']],
  ['StanceLoadingOverlay', 'feedback', 'composable', null, 'loading-overlay', 'Covers content with a scrim and progress indicator while work is in progress.', ['The message is announced and taps are blocked.']],
  ['StanceErrorState', 'feedback', 'composable', null, 'error-boundary', 'Explains that something failed and offers a retry action.', ['The title is a heading.']],
  ['StancePullToRefresh', 'advanced', 'composable', 'PullToRefreshBox', null, 'Wraps scrollable content with the platform pull-to-refresh gesture.', ['Offer a refresh action for people who cannot use the gesture.']],
  ['StanceSwipeActions', 'advanced', 'composable', 'SwipeToDismissBox', null, 'Reveals an action such as delete or archive when a row is swiped.', ['The same actions are exposed as accessibility custom actions.']],
  ['StanceSearchableList', 'advanced', 'composable', 'LazyColumn', 'searchable-list', 'A search field over a filtered list with a result count and empty state.', ['The result count is announced as people type.']],
  ['StanceFilterBar', 'advanced', 'composable', null, 'filter-bar', 'A scrolling row of filter chips with a clear-all action.', ['Each chip announces its selected state.']],
  ['StanceSignatureCanvas', 'advanced', 'composable', 'Canvas', null, 'An area for drawing a signature with undo, clear and image export.', ['Announces whether it is signed.', 'Offer a typed or uploaded alternative.']],
  ['rememberStancePhotoPicker', 'advanced', 'helper', 'ActivityResultContracts.PickVisualMedia', 'file-upload', 'Launches the system Photo Picker for one or more images, with no storage permission.', ['Uses the accessible system picker.'], 'StancePhotoPicker'],
  ['rememberStanceDocumentPicker', 'advanced', 'helper', 'ActivityResultContracts.OpenDocument', 'file-upload', 'Launches the system file picker for attaching documents.', ['Uses the accessible system picker.'], 'StanceDocumentPicker'],
  ['StanceButtonView', 'advanced', 'helper', 'AbstractComposeView', null, 'A Stance button usable from XML layouts and View code.', ['Keeps the same semantics as StanceButton.']],
  ['setStanceContent', 'advanced', 'helper', 'ComposeView', null, 'Hosts Stance content inside an existing View hierarchy.', ['Composed content keeps its semantics inside Views.'], 'StanceComposeView'],
];

const missing = [];
const components = rows.map(([name, category, kind, wrapsNative, webEquivalent, summary, accessibility, key]) => {
  const example = examples[key ?? name];
  if (!example) missing.push(name);
  if (summary.length < 50 || summary.length > 160) throw new Error(`${name}: summary is ${summary.length} characters`);
  return { name, category, summary, kind, wrapsNative, status: 'beta', example, accessibility, webEquivalent };
});
if (missing.length) throw new Error(`No compiled example for: ${missing.join(', ')}`);
const unused = Object.keys(examples).filter((k) => !rows.some((r) => (r[7] ?? r[0]) === k));
if (unused.length) throw new Error(`Examples without an inventory entry: ${unused.join(', ')}`);

writeFileSync(join(root, 'platforms', 'android', 'components.json'), JSON.stringify(components, null, 2) + '\n');
console.log(`components.json: ${components.length} entries`);
