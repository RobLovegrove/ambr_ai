'use client';

import type { MeetingAnalysis } from '@ambr/shared';

interface AnalysisResultsProps {
  analysis: MeetingAnalysis & { id: string; transcriptId: string; createdAt: string };
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'mixed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900">Analysis Results</h2>

      {analysis.summary && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium mb-2 text-gray-900">Summary</h3>
          <p className="text-gray-700">{analysis.summary}</p>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2 text-gray-900">Sentiment</h3>
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getSentimentColor(
            analysis.sentiment
          )}`}
        >
          {analysis.sentiment}
        </span>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 text-gray-900">
          Action Items ({analysis.actionItems.length})
        </h3>
        {analysis.actionItems.length > 0 ? (
          <div className="space-y-3">
            {analysis.actionItems.map((item, idx) => (
              <div
                key={idx}
                className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded"
              >
                <p className="font-medium text-gray-900">{item.description}</p>
                <div className="text-sm text-gray-600 mt-1">
                  {item.owner && <span>Owner: {item.owner}</span>}
                  {item.owner && item.deadline && <span> • </span>}
                  {item.deadline && <span>Deadline: {item.deadline}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No action items found</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3 text-gray-900">
          Key Decisions ({analysis.keyDecisions.length})
        </h3>
        {analysis.keyDecisions.length > 0 ? (
          <div className="space-y-3">
            {analysis.keyDecisions.map((decision, idx) => (
              <div
                key={idx}
                className="border-l-4 border-purple-500 pl-4 py-2 bg-gray-50 rounded"
              >
                <p className="font-medium text-gray-900">{decision.decision}</p>
                {decision.context && (
                  <p className="text-sm text-gray-600 mt-1">{decision.context}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No key decisions found</p>
        )}
      </div>
    </div>
  );
}

