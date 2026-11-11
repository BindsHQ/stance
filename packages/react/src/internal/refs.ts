import * as React from 'react';

type PossibleRef<T> = React.Ref<T> | undefined;

export function setRef<T>(ref: PossibleRef<T>, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as React.MutableRefObject<T | null>).current = value;
}

export function composeRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) setRef(ref, node);
  };
}

export function useComposedRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(composeRefs(...refs), refs);
}
