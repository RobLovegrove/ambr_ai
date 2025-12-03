import { z } from 'zod';

// Schema for transcript input
export const transcriptSchema = z.object({
  text: z.string().min(1, 'Transcript cannot be empty').max(50000, 'Transcript is too long'),
});

// Schema for action items
export const actionItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  owner: z.string().nullable(),
  deadline: z.string().nullable(),
});

// Schema for key decisions
export const keyDecisionSchema = z.object({
  id: z.string(),
  decision: z.string(),
  context: z.string().nullable(),
});

// Schema for sentiment
export const sentimentSchema = z.enum(['positive', 'neutral', 'negative', 'mixed']);

// Schema for the complete meeting analysis
export const meetingAnalysisSchema = z.object({
  title: z.string().optional(),
  actionItems: z.array(actionItemSchema),
  keyDecisions: z.array(keyDecisionSchema),
  sentiment: sentimentSchema,
  summary: z.string().optional(),
});

// Export TypeScript types inferred from schemas
export type TranscriptInput = z.infer<typeof transcriptSchema>;
export type ActionItem = z.infer<typeof actionItemSchema>;
export type KeyDecision = z.infer<typeof keyDecisionSchema>;
export type MeetingAnalysis = z.infer<typeof meetingAnalysisSchema>;

