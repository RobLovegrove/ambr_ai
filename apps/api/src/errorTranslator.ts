/**
 * User-friendly error messages and error categorization
 */

export interface UserFriendlyError {
  userMessage: string;
  errorCode: string;
  canRetry: boolean;
  technicalDetails?: string; // For logging, not shown to users
}

/**
 * Translate technical errors into user-friendly messages
 */
export function translateError(error: unknown): UserFriendlyError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Network/Connection errors
  if (
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection')
  ) {
    return {
      userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
      errorCode: 'NETWORK_ERROR',
      canRetry: true,
      technicalDetails: errorMessage,
    };
  }

  // Rate limiting errors
  if (
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('too many requests') ||
    lowerMessage.includes('429')
  ) {
    return {
      userMessage: 'The analysis service is temporarily busy. Please try again in a moment.',
      errorCode: 'SERVICE_BUSY',
      canRetry: true,
      technicalDetails: errorMessage,
    };
  }

  // Authentication/API key errors
  if (
    lowerMessage.includes('api key') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('401') ||
    lowerMessage.includes('authentication') ||
    lowerMessage.includes('invalid key')
  ) {
    return {
      userMessage: 'There\'s an issue with the analysis service configuration. Please contact support.',
      errorCode: 'CONFIGURATION_ERROR',
      canRetry: false,
      technicalDetails: errorMessage,
    };
  }

  // Timeout errors
  if (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('timed out') ||
    lowerMessage.includes('504')
  ) {
    return {
      userMessage: 'The analysis took too long to complete. Please try with a shorter transcript or try again later.',
      errorCode: 'TIMEOUT_ERROR',
      canRetry: true,
      technicalDetails: errorMessage,
    };
  }

  // Service unavailable / Both adapters failed
  if (
    lowerMessage.includes('service unavailable') ||
    lowerMessage.includes('503') ||
    lowerMessage.includes('both primary and fallback') ||
    lowerMessage.includes('no llm api key')
  ) {
    return {
      userMessage: 'The analysis service is currently unavailable. Please try again later.',
      errorCode: 'SERVICE_UNAVAILABLE',
      canRetry: true,
      technicalDetails: errorMessage,
    };
  }

  // LLM-specific errors (model not found, etc.)
  if (
    lowerMessage.includes('model') ||
    lowerMessage.includes('404') ||
    lowerMessage.includes('not found')
  ) {
    return {
      userMessage: 'There\'s an issue with the analysis service configuration. Please contact support.',
      errorCode: 'CONFIGURATION_ERROR',
      canRetry: false,
      technicalDetails: errorMessage,
    };
  }

  // Database errors
  if (
    lowerMessage.includes('database') ||
    lowerMessage.includes('prisma') ||
    lowerMessage.includes('connection pool')
  ) {
    return {
      userMessage: 'Unable to save the analysis. Please try again.',
      errorCode: 'DATABASE_ERROR',
      canRetry: true,
      technicalDetails: errorMessage,
    };
  }

  // Validation errors (keep these more specific since user can fix them)
  if (
    lowerMessage.includes('transcript') &&
    (lowerMessage.includes('too long') || lowerMessage.includes('empty') || lowerMessage.includes('invalid'))
  ) {
    return {
      userMessage: errorMessage, // Keep validation messages as-is
      errorCode: 'VALIDATION_ERROR',
      canRetry: false,
      technicalDetails: errorMessage,
    };
  }

  // Generic LLM errors
  if (
    lowerMessage.includes('llm') ||
    lowerMessage.includes('openai') ||
    lowerMessage.includes('anthropic') ||
    lowerMessage.includes('analysis failed')
  ) {
    return {
      userMessage: 'The analysis service encountered an error. Please try again.',
      errorCode: 'ANALYSIS_ERROR',
      canRetry: true,
      technicalDetails: errorMessage,
    };
  }

  // Unknown errors - generic fallback
  return {
    userMessage: 'An unexpected error occurred. Please try again. If the problem persists, contact support.',
    errorCode: 'UNKNOWN_ERROR',
    canRetry: true,
    technicalDetails: errorMessage,
  };
}

