import { prisma } from '@ambr/db';
import { OpenAIAdapter, type LLMAdapter } from '@ambr/llm';
import { LLMAdapterError } from '@ambr/llm/src/adapter';
import { Prisma } from '@prisma/client';

/**
 * Get the LLM adapter based on available API keys
 */
function getLLMAdapter(): LLMAdapter {
  // Priority: OpenAI > (Anthropic can be added later)
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIAdapter();
  }
  throw new Error('No LLM API key found. Please set OPENAI_API_KEY in your .env file');
}

/**
 * Analyze a transcript and store the results
 */
export async function analyzeTranscript(transcriptText: string) {
  try {
    const adapter = getLLMAdapter();

    // Analyze transcript using LLM
    const analysis = await adapter.analyzeTranscript(transcriptText);

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
    // Handle LLM-specific errors
    if (error instanceof LLMAdapterError) {
      return {
        status: 500,
        body: {
          error: `LLM analysis failed: ${error.message}`,
        },
      };
    }
    
    // Handle Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      return {
        status: 400,
        body: {
          error: `Invalid data: ${error.message}`,
        },
      };
    }
    
    // Handle Prisma client errors (connection, etc.)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        status: 500,
        body: {
          error: 'Database error occurred',
        },
      };
    }
    
    // Handle generic errors
    if (error instanceof Error) {
      return {
        status: 500,
        body: {
          error: error.message,
        },
      };
    }
    
    // Fallback for unknown errors
    return {
      status: 500,
      body: {
        error: 'Unknown error occurred',
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        status: 500,
        body: {
          error: 'Database error occurred',
        },
      };
    }
    return {
      status: 500,
      body: {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
        },
      };
    }
    if (offset < 0) {
      return {
        status: 400,
        body: {
          error: 'Offset must be non-negative',
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        status: 500,
        body: {
          error: 'Database error occurred',
        },
      };
    }
    return {
      status: 500,
      body: {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        status: 500,
        body: {
          error: 'Database error occurred',
        },
      };
    }
    return {
      status: 500,
      body: {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

