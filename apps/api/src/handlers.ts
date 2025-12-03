import { prisma } from '@ambr/db';
import { OpenAIAdapter, AnthropicAdapter, type LLMAdapter } from '@ambr/llm';
import { LLMAdapterError } from '@ambr/llm/src/adapter';
import { Prisma } from '@prisma/client';
import { translateError } from './errorTranslator';

/**
 * Get the primary LLM adapter based on available API keys
 * Priority: OpenAI > Anthropic
 */
function getPrimaryAdapter(): LLMAdapter | null {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIAdapter();
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return new AnthropicAdapter();
  }
  return null;
}

/**
 * Get the fallback LLM adapter (different from primary)
 */
function getFallbackAdapter(primaryAdapter: LLMAdapter): LLMAdapter | null {
  // If primary is OpenAI, try Anthropic as fallback
  if (primaryAdapter instanceof OpenAIAdapter && process.env.ANTHROPIC_API_KEY) {
    return new AnthropicAdapter();
  }
  // If primary is Anthropic, try OpenAI as fallback
  if (primaryAdapter instanceof AnthropicAdapter && process.env.OPENAI_API_KEY) {
    return new OpenAIAdapter();
  }
  return null;
}

/**
 * Validate that the transcript looks like actual meeting content
 * This is a basic check to catch obvious non-transcripts (URLs, code, etc.)
 */
function isValidTranscript(text: string): { valid: boolean; reason?: string } {
  const trimmed = text.trim();
  
  // Too short to be a meaningful transcript
  if (trimmed.length < 10) {
    return { valid: false, reason: 'Transcript is too short to analyze' };
  }
  
  // Looks like a URL (starts with http:// or https://)
  if (/^https?:\/\//i.test(trimmed)) {
    return { valid: false, reason: 'The input appears to be a URL, not a meeting transcript' };
  }
  
  // Single line that's just a URL pattern
  if (trimmed.split('\n').length === 1 && /^(www\.|http|https|localhost|\.com|\.org)/i.test(trimmed)) {
    return { valid: false, reason: 'The input appears to be a URL or web address, not a meeting transcript' };
  }
  
  // Looks like JSON (starts with { or [)
  if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.length < 200) {
    return { valid: false, reason: 'The input appears to be JSON or code, not a meeting transcript' };
  }
  
  // Otherwise, assume it's valid and let the LLM handle it
  // The improved prompts will prevent hallucination
  return { valid: true };
}

/**
 * Analyze a transcript and store the results
 * Automatically falls back to alternative LLM if primary fails
 */
export async function analyzeTranscript(transcriptText: string) {
  // Validate transcript before processing
  const validation = isValidTranscript(transcriptText);
  if (!validation.valid) {
    return {
      status: 400,
      body: {
        error: validation.reason || 'The input does not appear to be a valid meeting transcript. Please provide a meeting transcript with dialogue or discussion content.',
        errorCode: 'VALIDATION_ERROR',
        canRetry: false,
      },
    };
  }
  const primaryAdapter = getPrimaryAdapter();
  
  if (!primaryAdapter) {
    const error = translateError(new Error('No LLM API key found'));
    return {
      status: 500,
      body: {
        error: error.userMessage,
        errorCode: error.errorCode,
        canRetry: error.canRetry,
      },
    };
  }

  try {
    // Try primary adapter first
    const analysis = await primaryAdapter.analyzeTranscript(transcriptText);

    // Store transcript in database
    const transcript = await prisma.transcript.create({
      data: {
        text: transcriptText,
      },
    });

    // Store analysis with related action items and decisions
    const dbAnalysis = await prisma.analysis.create({
      data: {
        transcriptId: transcript.id,
        title: analysis.title || null,
        sentiment: analysis.sentiment,
        summary: analysis.summary || null,
        actionItems: {
          create: analysis.actionItems.map((item) => ({
            description: item.description,
            owner: item.owner,
            deadline: item.deadline,
          })),
        },
        keyDecisions: {
          create: analysis.keyDecisions.map((decision) => ({
            decision: decision.decision,
            context: decision.context,
          })),
        },
      },
      include: {
        actionItems: true,
        keyDecisions: true,
      },
    });

    return {
      status: 200,
      body: {
        id: dbAnalysis.id,
        transcriptId: dbAnalysis.transcriptId,
        title: dbAnalysis.title || undefined,
        actionItems: dbAnalysis.actionItems.map((item) => ({
          id: item.id,
          description: item.description,
          owner: item.owner,
          deadline: item.deadline,
        })),
        keyDecisions: dbAnalysis.keyDecisions.map((decision) => ({
          id: decision.id,
          decision: decision.decision,
          context: decision.context,
        })),
        sentiment: dbAnalysis.sentiment as 'positive' | 'neutral' | 'negative' | 'mixed',
        summary: dbAnalysis.summary || undefined,
        createdAt: dbAnalysis.createdAt.toISOString(),
      },
    };
  } catch (error) {
    // If primary adapter fails, try fallback
    if (error instanceof LLMAdapterError) {
      const fallbackAdapter = getFallbackAdapter(primaryAdapter);
      
      if (fallbackAdapter) {
        try {
          console.log(`Primary LLM failed, attempting fallback...`);
          const analysis = await fallbackAdapter.analyzeTranscript(transcriptText);
          
          // Continue with fallback analysis (store in DB, etc.)
          const transcript = await prisma.transcript.create({
            data: {
              text: transcriptText,
            },
          });

          const dbAnalysis = await prisma.analysis.create({
            data: {
              transcriptId: transcript.id,
              title: analysis.title || null,
              sentiment: analysis.sentiment,
              summary: analysis.summary || null,
              actionItems: {
                create: analysis.actionItems.map((item) => ({
                  description: item.description,
                  owner: item.owner,
                  deadline: item.deadline,
                })),
              },
              keyDecisions: {
                create: analysis.keyDecisions.map((decision) => ({
                  decision: decision.decision,
                  context: decision.context,
                })),
              },
            },
            include: {
              actionItems: true,
              keyDecisions: true,
            },
          });

          return {
            status: 200,
            body: {
              id: dbAnalysis.id,
              transcriptId: dbAnalysis.transcriptId,
              title: dbAnalysis.title || undefined,
              actionItems: dbAnalysis.actionItems.map((item) => ({
                id: item.id,
                description: item.description,
                owner: item.owner,
                deadline: item.deadline,
              })),
              keyDecisions: dbAnalysis.keyDecisions.map((decision) => ({
                id: decision.id,
                decision: decision.decision,
                context: decision.context,
              })),
              sentiment: dbAnalysis.sentiment as 'positive' | 'neutral' | 'negative' | 'mixed',
              summary: dbAnalysis.summary || undefined,
              createdAt: dbAnalysis.createdAt.toISOString(),
            },
          };
        } catch (fallbackError) {
          // Both adapters failed
          const translatedError = translateError(
            new Error(`Both adapters failed. Primary: ${error.message}. Fallback: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`)
          );
          // Log technical details server-side
          console.error('Both LLM adapters failed:', {
            primary: error.message,
            fallback: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
          });
          return {
            status: 500,
            body: {
              error: translatedError.userMessage,
              errorCode: translatedError.errorCode,
              canRetry: translatedError.canRetry,
            },
          };
        }
      }
      
      // No fallback available, return translated primary error
      const translatedError = translateError(error);
      // Log technical details server-side
      console.error('LLM analysis failed:', translatedError.technicalDetails);
      return {
        status: 500,
        body: {
          error: translatedError.userMessage,
          errorCode: translatedError.errorCode,
          canRetry: translatedError.canRetry,
        },
      };
    }
    
    // Handle Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      const translatedError = translateError(error);
      return {
        status: 400,
        body: {
          error: translatedError.userMessage,
          errorCode: translatedError.errorCode,
          canRetry: translatedError.canRetry,
        },
      };
    }
    
    // Handle Prisma client errors (connection, etc.)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const translatedError = translateError(error);
      console.error('Database error:', translatedError.technicalDetails);
      return {
        status: 500,
        body: {
          error: translatedError.userMessage,
          errorCode: translatedError.errorCode,
          canRetry: translatedError.canRetry,
        },
      };
    }
    
    // Handle generic errors
    const translatedError = translateError(error);
    console.error('Unexpected error:', translatedError.technicalDetails);
    return {
      status: 500,
      body: {
        error: translatedError.userMessage,
        errorCode: translatedError.errorCode,
        canRetry: translatedError.canRetry,
      },
    };
  }
}

/**
 * Get a specific analysis by ID
 */
export async function getAnalysisById(id: string) {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        actionItems: true,
        keyDecisions: true,
        transcript: true,
      },
    });

    if (!analysis) {
      return {
        status: 404,
        body: {
          error: 'Analysis not found',
          errorCode: 'NOT_FOUND',
          canRetry: false,
        },
      };
    }

    return {
      status: 200,
      body: {
        id: analysis.id,
        transcriptId: analysis.transcriptId,
        transcriptText: analysis.transcript.text,
        title: analysis.title || undefined,
        sentiment: analysis.sentiment as 'positive' | 'neutral' | 'negative' | 'mixed',
        summary: analysis.summary || undefined,
        actionItems: analysis.actionItems.map((item) => ({
          id: item.id,
          description: item.description,
          owner: item.owner,
          deadline: item.deadline,
          createdAt: item.createdAt.toISOString(),
        })),
        keyDecisions: analysis.keyDecisions.map((decision) => ({
          id: decision.id,
          decision: decision.decision,
          context: decision.context,
          createdAt: decision.createdAt.toISOString(),
        })),
        createdAt: analysis.createdAt.toISOString(),
      },
    };
  } catch (error) {
    const translatedError = translateError(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Database error:', translatedError.technicalDetails);
    }
    return {
      status: 500,
      body: {
        error: translatedError.userMessage,
        errorCode: translatedError.errorCode,
        canRetry: translatedError.canRetry,
      },
    };
  }
}

/**
 * List all analyses with pagination
 */
export async function listAnalyses(options?: { limit?: number; offset?: number }) {
  try {
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return {
        status: 400,
        body: {
          error: 'Limit must be between 1 and 100',
          errorCode: 'VALIDATION_ERROR',
          canRetry: false,
        },
      };
    }
    if (offset < 0) {
      return {
        status: 400,
        body: {
          error: 'Offset must be non-negative',
          errorCode: 'VALIDATION_ERROR',
          canRetry: false,
        },
      };
    }

    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        transcriptId: true,
        title: true,
        sentiment: true,
        summary: true,
        createdAt: true,
      },
      }),
      prisma.analysis.count(),
    ]);

    return {
      status: 200,
      body: {
        analyses: analyses.map((analysis) => ({
          id: analysis.id,
          transcriptId: analysis.transcriptId,
          title: analysis.title,
          sentiment: analysis.sentiment,
          summary: analysis.summary,
          createdAt: analysis.createdAt.toISOString(),
        })),
        total,
      },
    };
  } catch (error) {
    const translatedError = translateError(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Database error:', translatedError.technicalDetails);
    }
    return {
      status: 500,
      body: {
        error: translatedError.userMessage,
        errorCode: translatedError.errorCode,
        canRetry: translatedError.canRetry,
      },
    };
  }
}

/**
 * Delete an analysis by ID (cascade deletes related records)
 */
export async function deleteAnalysisById(id: string) {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id },
    });

    if (!analysis) {
      return {
        status: 404,
        body: {
          error: 'Analysis not found',
          errorCode: 'NOT_FOUND',
          canRetry: false,
        },
      };
    }

    // Delete the analysis (cascade will delete action items, key decisions, and transcript)
    await prisma.analysis.delete({
      where: { id },
    });

    return {
      status: 200,
      body: {
        success: true,
        message: 'Analysis deleted successfully',
      },
    };
  } catch (error) {
    const translatedError = translateError(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Database error:', translatedError.technicalDetails);
    }
    return {
      status: 500,
      body: {
        error: translatedError.userMessage,
        errorCode: translatedError.errorCode,
        canRetry: translatedError.canRetry,
      },
    };
  }
}

