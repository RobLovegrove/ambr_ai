import { prisma } from '@ambr/db';
import { OpenAIAdapter, type LLMAdapter } from '@ambr/llm';
import { LLMAdapterError } from '@ambr/llm/src/adapter';

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
    if (error instanceof LLMAdapterError) {
      return {
        status: 500,
        body: {
          error: `LLM analysis failed: ${error.message}`,
        },
      };
    }
    if (error instanceof Error) {
      return {
        status: 500,
        body: {
          error: error.message,
        },
      };
    }
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
}

/**
 * List all analyses with pagination
 */
export async function listAnalyses(options?: { limit?: number; offset?: number }) {
  const limit = options?.limit || 10;
  const offset = options?.offset || 0;

  const [analyses, total] = await Promise.all([
    prisma.analysis.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        transcriptId: true,
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
        sentiment: analysis.sentiment,
        summary: analysis.summary,
        createdAt: analysis.createdAt.toISOString(),
      })),
      total,
    },
  };
}

