import * as React from 'react';

/** Creates a context whose hook throws a helpful error when used outside its provider. */
export function createStrictContext<T>(component: string, part?: string) {
  const Context = React.createContext<T | null>(null);
  Context.displayName = `${component}Context`;
  function useStrictContext(consumer: string): T {
    const ctx = React.useContext(Context);
    if (ctx === null) {
      throw new Error(`<${consumer}> must be used within <${part ?? component}>.`);
    }
    return ctx;
  }
  return [Context.Provider, useStrictContext, Context] as const;
}
