'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TranscriptForm } from '../components/TranscriptForm';
import { AnalysisResults } from '../components/AnalysisResults';
import { AnalysisHistory } from '../components/AnalysisHistory';
import type { MeetingAnalysis } from '@ambr/shared';

export default function Home() {
  const queryClient = useQueryClient();
  const [analysis, setAnalysis] = useState<
    (MeetingAnalysis & { id: string; transcriptId: string; createdAt: string; transcriptText?: string }) | null
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
        const errorData = await response.json().catch(() => ({ error: 'Failed to analyze transcript' }));
        throw new Error(errorData.error || `Failed to analyze transcript (${response.status})`);
      }

      const data = await response.json();
      setAnalysis(data);
      
      // Invalidate and refetch the analyses query to update the history
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    } catch (err) {
      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error: Could not connect to the API server. Please check if the server is running.');
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setAnalysis(null);
    setError(null);
  };

  const handleSelectAnalysis = async (id: string) => {
    try {
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/analysis/${id}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch analysis' }));
        throw new Error(errorData.error || `Failed to fetch analysis (${response.status})`);
      }
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error: Could not connect to the API server.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load analysis');
      }
    }
  };

  const handleDeleteAnalysis = async (id: string) => {
    try {
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/analysis/${id}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete analysis' }));
        throw new Error(errorData.error || `Failed to delete analysis (${response.status})`);
      }
      
      // If the deleted analysis is currently displayed, clear it
      if (analysis?.id === id) {
        setAnalysis(null);
      }
      
      // Invalidate and refetch the analyses query to update the history
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    } catch (err) {
      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error: Could not connect to the API server.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete analysis');
      }
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
              onNewAnalysis={handleNewAnalysis}
              hasAnalysis={!!analysis}
              initialTranscript={analysis?.transcriptText || ''}
            />
            {analysis && <AnalysisResults analysis={analysis} />}
          </div>
          <div className="lg:col-span-1">
            <AnalysisHistory
              onSelectAnalysis={handleSelectAnalysis}
              onDeleteAnalysis={handleDeleteAnalysis}
              selectedAnalysisId={analysis?.id}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

