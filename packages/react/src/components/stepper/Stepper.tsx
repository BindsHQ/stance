'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';

export type StepStatus = 'complete' | 'current' | 'upcoming' | 'error';

interface StepperContextValue {
  activeStep: number;
  orientation: 'horizontal' | 'vertical';
  onStepClick?: ((index: number) => void) | undefined;
  allowFutureSteps: boolean;
  count: number;
  labels: StepperLabels;
}

const StepperContext = React.createContext<StepperContextValue | null>(null);
const IndexContext = React.createContext(0);

export interface StepperLabels {
  complete: string;
  current: string;
  upcoming: string;
  error: string;
  /** e.g. "Step 2 of 4". */
  position: (step: number, count: number) => string;
}

const defaultLabels: StepperLabels = {
  complete: 'Completed',
  current: 'Current step',
  upcoming: 'Not started',
  error: 'Has errors',
  position: (s, c) => `Step ${s} of ${c}`,
};

export interface StepperProps extends React.OlHTMLAttributes<HTMLOListElement> {
  /** Zero-based index of the current step. Steps before it are complete. */
  activeStep: number;
  /** Default `horizontal`. Horizontal steppers stack vertically below 640px. */
  orientation?: 'horizontal' | 'vertical';
  /** Makes completed steps clickable (and future steps if `allowFutureSteps`). */
  onStepClick?: (index: number) => void;
  /** Allow clicking upcoming steps too. Default false. */
  allowFutureSteps?: boolean;
  /** Accessible name. Default "Progress". */
  'aria-label'?: string;
  labels?: Partial<StepperLabels>;
}

/** Shows progress through a multi-step flow such as template setup or onboarding. */
export const Stepper = React.forwardRef<HTMLOListElement, StepperProps>(function Stepper(
  {
    activeStep,
    orientation = 'horizontal',
    onStepClick,
    allowFutureSteps = false,
    labels,
    className,
    children,
    ...props
  },
  ref,
) {
  const steps = React.Children.toArray(children).filter(React.isValidElement);
  const ctx: StepperContextValue = {
    activeStep,
    orientation,
    onStepClick,
    allowFutureSteps,
    count: steps.length,
    labels: { ...defaultLabels, ...labels },
  };
  return (
    <StepperContext.Provider value={ctx}>
      <ol
        ref={ref}
        aria-label={props['aria-label'] ?? 'Progress'}
        className={cx('st-stepper', className)}
        data-orientation={orientation}
        {...props}
      >
        {steps.map((child, i) => (
          <IndexContext.Provider key={child.key ?? i} value={i}>
            {child}
          </IndexContext.Provider>
        ))}
      </ol>
    </StepperContext.Provider>
  );
});

export interface StepProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Override the derived status, e.g. `error`. */
  status?: StepStatus;
  /** Custom indicator content instead of the number. */
  icon?: React.ReactNode;
  /** Prevent clicking this step. */
  disabled?: boolean;
}

export const Step = React.forwardRef<HTMLLIElement, StepProps>(function Step(
  { title, description, status: statusProp, icon, disabled, className, ...props },
  ref,
) {
  const ctx = React.useContext(StepperContext);
  const index = React.useContext(IndexContext);
  if (!ctx) throw new Error('<Step> must be used within <Stepper>.');
  const derived: StepStatus =
    index < ctx.activeStep ? 'complete' : index === ctx.activeStep ? 'current' : 'upcoming';
  const status = statusProp ?? derived;
  const clickable =
    !!ctx.onStepClick &&
    !disabled &&
    index !== ctx.activeStep &&
    (index < ctx.activeStep || ctx.allowFutureSteps);
  const indicator =
    icon ??
    (status === 'complete' ? (
      <Icon name="check" size={14} strokeWidth={2.5} />
    ) : status === 'error' ? (
      <Icon name="alert-triangle" size={14} strokeWidth={2} />
    ) : (
      index + 1
    ));
  const body = (
    <>
      <span className="st-stepper__indicator" aria-hidden="true">
        {indicator}
      </span>
      <span className="st-stepper__text">
        <span className="st-stepper__title">{title}</span>
        {description && <span className="st-stepper__description">{description}</span>}
        <span className="st-sr-only">
          {`, ${ctx.labels.position(index + 1, ctx.count)}, ${ctx.labels[status]}`}
        </span>
      </span>
    </>
  );
  return (
    <li
      ref={ref}
      className={cx('st-stepper__step', className)}
      data-status={status}
      aria-current={status === 'current' || index === ctx.activeStep ? 'step' : undefined}
      {...props}
    >
      {clickable ? (
        <button
          type="button"
          className="st-stepper__trigger"
          onClick={() => ctx.onStepClick?.(index)}
        >
          {body}
        </button>
      ) : (
        <div className="st-stepper__trigger" data-static="">
          {body}
        </div>
      )}
      {index < ctx.count - 1 && <span className="st-stepper__connector" aria-hidden="true" />}
    </li>
  );
});
