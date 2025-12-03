'use client';

import { useState, useEffect } from 'react';

interface TranscriptFormProps {
  onSubmit: (transcript: string) => void;
  isLoading: boolean;
  error: string | null;
  onNewAnalysis?: () => void;
  hasAnalysis?: boolean;
  initialTranscript?: string;
}

export function TranscriptForm({
  onSubmit,
  isLoading,
  error,
  onNewAnalysis,
  hasAnalysis = false,
  initialTranscript = '',
}: TranscriptFormProps) {
  const [transcript, setTranscript] = useState(initialTranscript);

  // Update transcript when initialTranscript changes (e.g., when selecting from history)
  useEffect(() => {
    if (initialTranscript) {
      setTranscript(initialTranscript);
    }
  }, [initialTranscript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasAnalysis) {
      // If there's already an analysis, this is "New Analysis" - clear everything
      setTranscript('');
      onNewAnalysis?.();
    } else if (transcript.trim()) {
      // Otherwise, analyze the transcript
      onSubmit(transcript);
      // Don't clear the transcript - keep it visible
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900">Submit Transcript</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste your meeting transcript here..."
          className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          disabled={isLoading || hasAnalysis}
        />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {transcript.length} characters
          </span>
          <button
            type="submit"
            disabled={isLoading || (!hasAnalysis && !transcript.trim())}
            className={`px-6 py-2 rounded-lg transition-colors font-medium ${
              hasAnalysis
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Analyzing...' : hasAnalysis ? 'New Analysis' : 'Analyze'}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

