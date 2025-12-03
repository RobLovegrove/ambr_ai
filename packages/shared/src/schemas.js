"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meetingAnalysisSchema = exports.sentimentSchema = exports.keyDecisionSchema = exports.actionItemSchema = exports.transcriptSchema = void 0;
const zod_1 = require("zod");
// Schema for transcript input
exports.transcriptSchema = zod_1.z.object({
    text: zod_1.z.string().min(1, 'Transcript cannot be empty').max(50000, 'Transcript is too long'),
});
// Schema for action items
exports.actionItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    description: zod_1.z.string(),
    owner: zod_1.z.string().nullable(),
    deadline: zod_1.z.string().nullable(),
});
// Schema for key decisions
exports.keyDecisionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    decision: zod_1.z.string(),
    context: zod_1.z.string().nullable(),
});
// Schema for sentiment
exports.sentimentSchema = zod_1.z.enum(['positive', 'neutral', 'negative', 'mixed']);
// Schema for the complete meeting analysis
exports.meetingAnalysisSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    actionItems: zod_1.z.array(exports.actionItemSchema),
    keyDecisions: zod_1.z.array(exports.keyDecisionSchema),
    sentiment: exports.sentimentSchema,
    summary: zod_1.z.string().optional(),
});
//# sourceMappingURL=schemas.js.map