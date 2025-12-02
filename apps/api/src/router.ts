import { analyzeTranscript, getAnalysisById, listAnalyses, deleteAnalysisById } from './handlers';

export const router = {
  analyze: async ({ body }) => {
    const result = await analyzeTranscript(body.text);
    // Handlers already return { status, body }, so just pass through
    return result;
  },

  getAnalysis: async ({ params }) => {
    const result = await getAnalysisById(params.id);
    // Handlers already return { status, body }, so just pass through
    return result;
  },

  listAnalyses: async ({ query }) => {
    const result = await listAnalyses({
      limit: query.limit ? parseInt(query.limit) : undefined,
      offset: query.offset ? parseInt(query.offset) : undefined,
    });
    // Handlers already return { status, body }, so just pass through
    return result;
  },

  deleteAnalysis: async ({ params }) => {
    const result = await deleteAnalysisById(params.id);
    // Handlers already return { status, body }, so just pass through
    return result;
  },
};