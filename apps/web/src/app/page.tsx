'use client';

import { useState } from 'react';
import { TranscriptForm } from '../components/TranscriptForm';
import { AnalysisResults } from '../components/AnalysisResults';
import { AnalysisHistory } from '../components/AnalysisHistory';
import type { MeetingAnalysis } from '@ambr/shared';

export default function Home() {
  const [analysis, setAnalysis] = useState<
    (MeetingAnalysis & { id: string; transcriptId: string; createdAt: string }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (transcript: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: transcript }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze transcript');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">
          Meeting Transcript Analyzer
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <TranscriptForm
              onSubmit={handleAnalyze}
              isLoading={isLoading}
              error={error}
            />
            {analysis && <AnalysisResults analysis={analysis} />}
          </div>
          <div className="lg:col-span-1">
            <AnalysisHistory />
          </div>
        </div>
      </div>
    </main>
  );
}

