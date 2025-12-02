'use client';

import { useQuery } from '@tanstack/react-query';

interface Analysis {
  id: string;
  transcriptId: string;
  sentiment: string;
  summary: string | null;
  createdAt: string;
}

interface AnalysisHistoryProps {
  onSelectAnalysis?: (id: string) => void;
  onDeleteAnalysis?: (id: string) => void;
}

export function AnalysisHistory({ onSelectAnalysis, onDeleteAnalysis }: AnalysisHistoryProps) {
  const { data, isLoading, error } = useQuery<{
    analyses: Analysis[];
    total: number;
  }>({
    queryKey: ['analyses'],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/analyses`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch analyses');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Analysis History</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Analysis History</h2>
        <p className="text-red-500">Error loading history</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900">Analysis History</h2>
      {data && data.analyses.length > 0 ? (
        <ul className="space-y-3">
          {data.analyses.map((analysis) => (
            <li
              key={analysis.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectAnalysis?.(analysis.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      {new Date(analysis.createdAt).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        analysis.sentiment === 'positive'
                          ? 'bg-green-100 text-green-800'
                          : analysis.sentiment === 'negative'
                          ? 'bg-red-100 text-red-800'
                          : analysis.sentiment === 'mixed'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {analysis.sentiment}
                    </span>
                  </div>
                  {analysis.summary && (
                    <p className="text-sm text-gray-700 line-clamp-2">{analysis.summary}</p>
                  )}
                </div>
                {onDeleteAnalysis && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this analysis?')) {
                        onDeleteAnalysis(analysis.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    title="Delete analysis"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No analyses yet</p>
      )}
    </div>
  );
}

