'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { AIGeneratedLabel } from '../ai-generated-label/AIGeneratedLabel.js';
import { Button } from '../button/Button.js';
import { FormField } from '../form-field/FormField.js';
import { Input } from '../input/Input.js';
import { ShimmerText } from '../shimmer-text/ShimmerText.js';

export type SmartFieldStatus = 'idle' | 'suggesting' | 'suggested' | 'accepted';

export interface SmartFieldLabels {
  /** Shown while a value is being suggested. Default "Suggesting a value". */
  suggesting: string;
  /** The mark on a suggested value. Default "Suggested by AI". */
  suggested: string;
  /** The mark on an accepted value. Default "Filled in by AI". */
  accepted: string;
  /** Builds the source note. Default "From source". */
  source: (source: React.ReactNode) => React.ReactNode;
  /** The button that keeps the suggestion. Default "Accept". */
  accept: string;
  /** The button that removes the suggestion. Default "Undo". */
  undo: string;
  /** The button that asks for another suggestion. Default "Suggest again". */
  regenerate: string;
  /** Announced when a suggestion arrives. Default "Suggestion ready". */
  ready: string;
  /** Announced on accept. Default "Suggestion accepted". */
  acceptedAnnouncement: string;
  /** Announced on undo. Default "Suggestion removed". */
  undone: string;
}

/** What a custom control receives from SmartField. */
export interface SmartFieldControlProps {
  /** The text to show: the suggestion while it is offered, the value otherwise. */
  value: string;
  /** Call with the new text when the person edits the control. */
  onValueChange: (value: string) => void;
  /** Points the control at the AI mark so it is read with the field. */
  'aria-describedby': string | undefined;
  /** True while a value is being suggested. */
  'aria-busy': boolean | undefined;
}

export interface SmartFieldProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'defaultValue' | 'onChange'
> {
  /** The visible label of the field. */
  label: React.ReactNode;
  /** The value of the field. Controlled. */
  value?: string;
  /** The value on first render when uncontrolled. Default empty. */
  defaultValue?: string;
  /** Called when the value changes: on edit, on accept and on undo. */
  onValueChange?: (value: string) => void;
  /** The value AI suggests. Shown in the control while the status is `suggested`. */
  suggestedValue?: string;
  /** Where the suggestion came from, for example a file name. */
  suggestionSource?: React.ReactNode;
  /** Where the field is in the suggestion flow. Controlled. */
  status?: SmartFieldStatus;
  /** The status on first render when uncontrolled. Default `idle`. */
  defaultStatus?: SmartFieldStatus;
  /** Called when accepting, undoing or editing changes the status. */
  onStatusChange?: (status: SmartFieldStatus) => void;
  /** Called with the suggestion when the person accepts it. */
  onAccept?: (value: string) => void;
  /** Called when the person removes the suggestion. */
  onUndo?: () => void;
  /** Called when the person asks for another suggestion. Shows a button. */
  onRegenerate?: () => void;
  /**
   * The control. Omit it for a text input. Pass a function to wire your own control to the
   * field, or an element that you wire yourself.
   */
  children?: React.ReactNode | ((control: SmartFieldControlProps) => React.ReactNode);
  /** Helper text under the control. */
  description?: React.ReactNode;
  /** Error message. Marks the field invalid. */
  error?: React.ReactNode;
  /** Marks the field required. */
  required?: boolean;
  /** Disables the control and the actions. */
  disabled?: boolean;
  /** Placeholder of the built in text input. */
  placeholder?: string;
  /** Translations for the built in strings. */
  labels?: Partial<SmartFieldLabels>;
}

/**
 * A form field that AI can fill in. It says in words that the value was suggested and
 * where it came from, and lets people accept it, undo it or simply type over it.
 */
export const SmartField = React.forwardRef<HTMLDivElement, SmartFieldProps>(function SmartField(
  {
    label,
    value: valueProp,
    defaultValue = '',
    onValueChange,
    suggestedValue,
    suggestionSource,
    status: statusProp,
    defaultStatus = 'idle',
    onStatusChange,
    onAccept,
    onUndo,
    onRegenerate,
    children,
    description,
    error,
    required,
    disabled,
    placeholder,
    labels: labelsProp,
    className,
    ...props
  },
  ref,
) {
  const labels: SmartFieldLabels = {
    suggesting: 'Suggesting a value',
    suggested: 'Suggested by AI',
    accepted: 'Filled in by AI',
    source: (source) => <>From {source}</>,
    accept: 'Accept',
    undo: 'Undo',
    regenerate: 'Suggest again',
    ready: 'Suggestion ready',
    acceptedAnnouncement: 'Suggestion accepted',
    undone: 'Suggestion removed',
    ...labelsProp,
  };
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });
  const [status, setStatus] = useControllableState({
    value: statusProp,
    defaultValue: defaultStatus,
    onChange: onStatusChange,
  });
  const markId = React.useId();
  const { announce, region } = useAnnouncer();
  // The value before a suggestion was accepted, so undo can bring it back.
  const before = React.useRef<string | null>(null);

  const offered = status === 'suggested' && suggestedValue !== undefined;
  const shown = offered ? suggestedValue : value;
  const marked = status === 'suggested' || status === 'accepted';

  const labelsRef = React.useRef(labels);
  labelsRef.current = labels;
  const previous = React.useRef(status);
  React.useEffect(() => {
    const was = previous.current;
    previous.current = status;
    if (status === 'suggested' && was !== 'suggested') announce(labelsRef.current.ready);
  }, [status, announce]);

  const edit = (next: string) => {
    before.current = null;
    setValue(next);
    // Typing over an AI value makes it the person's own.
    if (marked) setStatus('idle');
  };
  const accept = () => {
    const next = suggestedValue ?? value;
    before.current = value;
    setValue(next);
    setStatus('accepted');
    onAccept?.(next);
    announce(labels.acceptedAnnouncement);
  };
  const undo = () => {
    if (status === 'accepted' && before.current !== null) setValue(before.current);
    before.current = null;
    setStatus('idle');
    onUndo?.();
    announce(labels.undone);
  };

  const control: SmartFieldControlProps = {
    value: shown,
    onValueChange: edit,
    'aria-describedby': marked || status === 'suggesting' ? markId : undefined,
    'aria-busy': status === 'suggesting' || undefined,
  };

  return (
    <div
      ref={ref}
      className={cx('st-smart-field', className)}
      data-status={status}
      data-disabled={disabled ? '' : undefined}
      {...props}
    >
      <FormField
        label={label}
        description={description}
        error={error}
        {...(required !== undefined && { required })}
        {...(disabled !== undefined && { disabled })}
      >
        {typeof children === 'function' ? (
          children(control)
        ) : children != null ? (
          children
        ) : (
          <Input
            value={control.value}
            placeholder={placeholder}
            aria-describedby={control['aria-describedby']}
            aria-busy={control['aria-busy']}
            onChange={(event) => edit(event.target.value)}
          />
        )}
      </FormField>
      {status === 'suggesting' && (
        <div id={markId} className="st-smart-field__mark">
          <Icon name="sparkle" size={14} className="st-smart-field__sparkle" />
          <ShimmerText role="status">{labels.suggesting}</ShimmerText>
        </div>
      )}
      {marked && (
        <div className="st-smart-field__mark">
          <span id={markId} className="st-smart-field__note">
            <AIGeneratedLabel
              size="sm"
              variant={status === 'accepted' ? 'assisted' : 'generated'}
              label={status === 'accepted' ? labels.accepted : labels.suggested}
            />
            {suggestionSource != null && (
              <>
                {/* A hidden separator, so the mark and the source read as two phrases. */}
                <span className="st-sr-only">, </span>
                <span className="st-smart-field__source">{labels.source(suggestionSource)}</span>
              </>
            )}
          </span>
          <span className="st-smart-field__actions">
            {status === 'suggested' && (
              <Button size="xs" variant="outline" disabled={disabled} onClick={accept}>
                {labels.accept}
              </Button>
            )}
            <Button size="xs" variant="ghost" disabled={disabled} onClick={undo}>
              {labels.undo}
            </Button>
            {onRegenerate && (
              <Button size="xs" variant="ghost" disabled={disabled} onClick={onRegenerate}>
                {labels.regenerate}
              </Button>
            )}
          </span>
        </div>
      )}
      {region}
    </div>
  );
});
