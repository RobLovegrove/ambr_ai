import { z } from 'zod';
export declare const transcriptSchema: z.ZodObject<{
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    text: string;
}, {
    text: string;
}>;
export declare const actionItemSchema: z.ZodObject<{
    id: z.ZodString;
    description: z.ZodString;
    owner: z.ZodNullable<z.ZodString>;
    deadline: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    description: string;
    owner: string | null;
    deadline: string | null;
}, {
    id: string;
    description: string;
    owner: string | null;
    deadline: string | null;
}>;
export declare const keyDecisionSchema: z.ZodObject<{
    id: z.ZodString;
    decision: z.ZodString;
    context: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    decision: string;
    context: string | null;
}, {
    id: string;
    decision: string;
    context: string | null;
}>;
export declare const sentimentSchema: z.ZodEnum<["positive", "neutral", "negative", "mixed"]>;
export declare const meetingAnalysisSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    actionItems: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        description: z.ZodString;
        owner: z.ZodNullable<z.ZodString>;
        deadline: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        description: string;
        owner: string | null;
        deadline: string | null;
    }, {
        id: string;
        description: string;
        owner: string | null;
        deadline: string | null;
    }>, "many">;
    keyDecisions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        decision: z.ZodString;
        context: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        decision: string;
        context: string | null;
    }, {
        id: string;
        decision: string;
        context: string | null;
    }>, "many">;
    sentiment: z.ZodEnum<["positive", "neutral", "negative", "mixed"]>;
    summary: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    actionItems: {
        id: string;
        description: string;
        owner: string | null;
        deadline: string | null;
    }[];
    keyDecisions: {
        id: string;
        decision: string;
        context: string | null;
    }[];
    sentiment: "positive" | "neutral" | "negative" | "mixed";
    title?: string | undefined;
    summary?: string | undefined;
}, {
    actionItems: {
        id: string;
        description: string;
        owner: string | null;
        deadline: string | null;
    }[];
    keyDecisions: {
        id: string;
        decision: string;
        context: string | null;
    }[];
    sentiment: "positive" | "neutral" | "negative" | "mixed";
    title?: string | undefined;
    summary?: string | undefined;
}>;
export type TranscriptInput = z.infer<typeof transcriptSchema>;
export type ActionItem = z.infer<typeof actionItemSchema>;
export type KeyDecision = z.infer<typeof keyDecisionSchema>;
export type MeetingAnalysis = z.infer<typeof meetingAnalysisSchema>;
//# sourceMappingURL=schemas.d.ts.map