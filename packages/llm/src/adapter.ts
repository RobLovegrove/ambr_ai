import type { MeetingAnalysis } from '@ambr/shared';

/**
 * Interface for LLM adapters
 * Allows easy switching between different LLM providers
 */
export interface LLMAdapter {
  analyzeTranscript(transcript: string): Promise<MeetingAnalysis>;
}

/**
 * Custom error class for LLM adapter errors
 */
export class LLMAdapterError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'LLMAdapterError';
  }
}

