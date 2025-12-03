'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TranscriptForm } from '../components/TranscriptForm';
import { AnalysisResults } from '../components/AnalysisResults';
import { AnalysisHistory } from '../components/AnalysisHistory';
import type { MeetingAnalysis } from '@ambr/shared';

interface ApiError {
  error: string;
  errorCode?: string;
  canRetry?: boolean;
}

export default function Home() {
  const queryClient = useQueryClient();
  const [analysis, setAnalysis] = useState<
    (MeetingAnalysis & { id: string; transcriptId: string; createdAt: string; transcriptText?: string }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');

  const handleAnalyze = async (transcript: string) => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setCanRetry(false);
    setCurrentTranscript(transcript);

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
        const errorData: ApiError = await response.json().catch(() => ({ error: 'Failed to analyze transcript' }));
        setError(errorData.error || 'Failed to analyze transcript');
        setErrorCode(errorData.errorCode || null);
        setCanRetry(errorData.canRetry ?? true);
        return; // Don't throw, error state is set
      }

      const data = await response.json();
      setAnalysis(data);
      
      // Invalidate and refetch the analyses query to update the history
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    } catch (err) {
      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
        setErrorCode('NETWORK_ERROR');
        setCanRetry(true);
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
        setErrorCode('UNKNOWN_ERROR');
        setCanRetry(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setAnalysis(null);
    setError(null);
    setErrorCode(null);
    setCanRetry(false);
  };

  const handleSelectAnalysis = async (id: string) => {
    try {
      setError(null);
      setErrorCode(null);
      setCanRetry(false);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/analysis/${id}`
      );
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({ error: 'Failed to fetch analysis' }));
        setError(errorData.error || 'Failed to fetch analysis');
        setErrorCode(errorData.errorCode || null);
        setCanRetry(errorData.canRetry ?? false);
        return;
      }
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
        setErrorCode('NETWORK_ERROR');
        setCanRetry(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load analysis');
        setErrorCode('UNKNOWN_ERROR');
        setCanRetry(true);
      }
    }
  };

  const handleDeleteAnalysis = async (id: string) => {
    try {
      setError(null);
      setErrorCode(null);
      setCanRetry(false);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/analysis/${id}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({ error: 'Failed to delete analysis' }));
        setError(errorData.error || 'Failed to delete analysis');
        setErrorCode(errorData.errorCode || null);
        setCanRetry(errorData.canRetry ?? false);
        return;
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
        setError('Unable to connect to the server. Please check your internet connection and try again.');
        setErrorCode('NETWORK_ERROR');
        setCanRetry(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete analysis');
        setErrorCode('UNKNOWN_ERROR');
        setCanRetry(true);
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
              errorCode={errorCode}
              canRetry={canRetry}
              onRetry={() => currentTranscript && handleAnalyze(currentTranscript)}
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

