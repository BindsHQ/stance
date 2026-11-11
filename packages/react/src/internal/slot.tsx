import * as React from 'react';
import { cx } from './cx.js';
import { composeRefs } from './refs.js';

type AnyProps = Record<string, unknown>;

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps, ...childProps };
  for (const key of Object.keys(slotProps)) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];
    if (/^on[A-Z]/.test(key) && typeof slotValue === 'function') {
      merged[key] =
        typeof childValue === 'function'
          ? (...args: unknown[]) => {
              (childValue as (...a: unknown[]) => void)(...args);
              (slotValue as (...a: unknown[]) => void)(...args);
            }
          : slotValue;
    } else if (key === 'style') {
      merged[key] = { ...(slotValue as object), ...(childValue as object) };
    } else if (key === 'className') {
      merged[key] = cx(slotValue as string, childValue as string);
    }
  }
  return merged;
}

function getElementRef(element: React.ReactElement): React.Ref<unknown> | undefined {
  // React 19 exposes ref as a prop; React 18 keeps it on the element.
  const props = element.props as { ref?: React.Ref<unknown> };
  return props.ref ?? (element as unknown as { ref?: React.Ref<unknown> }).ref;
}

/**
 * Renders its single child, merging props, class names, styles, handlers and refs.
 * Powers the `asChild` prop across Stance.
 */
export const Slot = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }
>(function Slot({ children, ...props }, forwardedRef) {
  if (!React.isValidElement(children)) {
    return React.Children.count(children) > 1 ? React.Children.only(null) : null;
  }
  const childRef = getElementRef(children);
  return React.cloneElement(children, {
    ...mergeProps(props as AnyProps, children.props as AnyProps),
    ref: forwardedRef ? composeRefs(forwardedRef, childRef as React.Ref<HTMLElement>) : childRef,
  } as AnyProps);
});
