'use client';

import { useQuery } from '@tanstack/react-query';

interface Analysis {
  id: string;
  transcriptId: string;
  sentiment: string;
  summary: string | null;
  createdAt: string;
}

export function AnalysisHistory() {
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
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
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
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {analysis.sentiment}
                </span>
              </div>
              {analysis.summary && (
                <p className="text-sm text-gray-700 line-clamp-2">{analysis.summary}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No analyses yet</p>
      )}
    </div>
  );
}

