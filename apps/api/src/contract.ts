import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { transcriptSchema, meetingAnalysisSchema } from '@ambr/shared';

const c = initContract();

export const contract = c.router({
  analyze: {
    method: 'POST',
    path: '/analyze',
    body: transcriptSchema,
    responses: {
      200: meetingAnalysisSchema.extend({
        id: z.string(),
        transcriptId: z.string(),
        createdAt: z.string(),
      }),
      400: z.object({
        error: z.string(),
      }),
      500: z.object({
        error: z.string(),
      }),
    },
  },
  getAnalysis: {
    method: 'GET',
    path: '/analysis/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    responses: {
      200: meetingAnalysisSchema.extend({
        id: z.string(),
        transcriptId: z.string(),
        createdAt: z.string(),
        actionItems: z.array(
          meetingAnalysisSchema.shape.actionItems.element.extend({
            id: z.string(),
            createdAt: z.string(),
          })
        ),
        keyDecisions: z.array(
          meetingAnalysisSchema.shape.keyDecisions.element.extend({
            id: z.string(),
            createdAt: z.string(),
          })
        ),
      }),
      404: z.object({
        error: z.string(),
      }),
    },
  },
  listAnalyses: {
    method: 'GET',
    path: '/analyses',
    query: z.object({
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
    responses: {
      200: z.object({
        analyses: z.array(
          z.object({
            id: z.string(),
            transcriptId: z.string(),
            sentiment: z.string(),
            summary: z.string().nullable(),
            createdAt: z.string(),
          })
        ),
        total: z.number(),
      }),
    },
  },
});

