import { contract } from './contract';
import { analyzeTranscript, getAnalysisById, listAnalyses } from './handlers';

export const router = {
  analyze: async ({ body }: { body: { text: string } }) => {
    return analyzeTranscript(body.text);
  },
  getAnalysis: async ({ params }: { params: { id: string } }) => {
    return getAnalysisById(params.id);
  },
  listAnalyses: async ({ query }: { query: { limit?: string; offset?: string } }) => {
    return listAnalyses({
      limit: query.limit ? parseInt(query.limit) : undefined,
      offset: query.offset ? parseInt(query.offset) : undefined,
    });
  },
};

