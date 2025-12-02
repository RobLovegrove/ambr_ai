'use client';

import { useState } from 'react';

interface TranscriptFormProps {
  onSubmit: (transcript: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function TranscriptForm({
  onSubmit,
  isLoading,
  error,
}: TranscriptFormProps) {
  const [transcript, setTranscript] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transcript.trim()) {
      onSubmit(transcript);
      setTranscript('');
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
          className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {transcript.length} characters
          </span>
          <button
            type="submit"
            disabled={isLoading || !transcript.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
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

