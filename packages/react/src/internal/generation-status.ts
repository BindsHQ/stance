/**
 * The shared generation status of the AI components contract.
 * `submitted` means the request was sent and nothing has arrived yet.
 */
export type GenerationStatus =
  'idle' | 'submitted' | 'streaming' | 'complete' | 'stopped' | 'error';
