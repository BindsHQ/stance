'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Badge } from '../badge/Badge.js';
import { Select, type SelectProps } from '../select/Select.js';

export interface ModelOption {
  /** Stable identifier, used as the value. */
  id: string;
  /** The name shown in the trigger and the list. */
  name: string;
  /** One short line on what the model is good at. */
  description?: string;
  /** Capability words shown as badges, for example "Fast" or "Vision". */
  badges?: string[];
  /** Listed but not selectable. */
  disabled?: boolean;
}

export interface ModelPickerProps extends Omit<
  SelectProps,
  'options' | 'value' | 'defaultValue' | 'onValueChange' | 'renderOption' | 'size'
> {
  /** The models on offer. */
  models: ModelOption[];
  /** The selected model id (controlled). */
  value?: string;
  /** The initially selected model id when uncontrolled. */
  defaultValue?: string;
  /** Called with the id of the chosen model. */
  onValueChange?: (value: string) => void;
  /** Control height: sm 32, md 40, lg 48. Default `sm`. */
  size?: 'sm' | 'md' | 'lg';
  /** Names the picker. Default "Model". */
  label?: string;
  /** Keep the label for assistive technology only. Default true. */
  hideLabel?: boolean;
}

/**
 * Chooses the model for the next message. Each option can carry a short description
 * and capability badges.
 */
export const ModelPicker = React.forwardRef<HTMLButtonElement, ModelPickerProps>(
  function ModelPicker(
    {
      models,
      value,
      defaultValue,
      onValueChange,
      size = 'sm',
      label = 'Model',
      hideLabel = true,
      placeholder = 'Choose a model',
      className,
      contentClassName,
      id,
      ...props
    },
    ref,
  ) {
    const generatedId = React.useId();
    const triggerId = id ?? `${generatedId}-trigger`;
    const labelId = `${generatedId}-label`;
    const byId = React.useMemo(() => new Map(models.map((model) => [model.id, model])), [models]);
    const options = React.useMemo(
      () =>
        models.map((model) => ({
          value: model.id,
          label: model.name,
          ...(model.description !== undefined && { description: model.description }),
          ...(model.disabled !== undefined && { disabled: model.disabled }),
        })),
      [models],
    );
    return (
      <span className={cx('st-model-picker', className)} data-size={size}>
        <label
          id={labelId}
          htmlFor={triggerId}
          className={hideLabel ? 'st-sr-only' : 'st-model-picker__label'}
        >
          {label}
        </label>
        <Select
          ref={ref}
          id={triggerId}
          options={options}
          {...(value !== undefined && { value })}
          {...(defaultValue !== undefined && { defaultValue })}
          {...(onValueChange && { onValueChange })}
          size={size}
          placeholder={placeholder}
          aria-label={label}
          aria-labelledby={labelId}
          className="st-model-picker__trigger"
          contentClassName={cx('st-model-picker__list', contentClassName)}
          renderOption={(option) => {
            const model = byId.get(option.value);
            return (
              <span className="st-model-picker__option">
                <span className="st-model-picker__name-row">
                  <span className="st-model-picker__name">{option.label}</span>
                  {model?.badges?.map((badge) => (
                    <Badge key={badge} size="sm" tone="neutral" variant="outline">
                      {badge}
                    </Badge>
                  ))}
                </span>
                {option.description && (
                  <span className="st-model-picker__description">{option.description}</span>
                )}
              </span>
            );
          }}
          {...props}
        />
      </span>
    );
  },
);
