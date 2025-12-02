import OpenAI from 'openai';
import type { LLMAdapter } from './adapter';
import type { MeetingAnalysis } from '@ambr/shared';
import { LLMAdapterError } from './adapter';

export class OpenAIAdapter implements LLMAdapter {
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, model: string = 'gpt-3.5-turbo') {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OPENAI_API_KEY is required');
    }
    this.client = new OpenAI({ apiKey: key });
    this.model = model;
  }

  async analyzeTranscript(transcript: string): Promise<MeetingAnalysis> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert meeting analyst. Analyze meeting transcripts and extract:
1. Action items with owners and deadlines (if mentioned)
2. Key decisions made during the meeting
3. Overall sentiment (positive, neutral, negative, or mixed)
4. A brief summary (optional)

Return a JSON object with this structure:
{
  "actionItems": [{"id": "1", "description": "...", "owner": "name or null", "deadline": "date or null"}],
  "keyDecisions": [{"id": "1", "decision": "...", "context": "..."}],
  "sentiment": "positive|neutral|negative|mixed",
  "summary": "brief summary"
}

Be thorough and extract all action items and decisions mentioned.`,
          },
          {
            role: 'user',
            content: `Analyze this meeting transcript:\n\n${transcript}`,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent, structured output
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const analysis = JSON.parse(content) as MeetingAnalysis;
      
      // Validate that we got the expected structure
      if (!analysis.actionItems || !analysis.keyDecisions || !analysis.sentiment) {
        throw new Error('Invalid response structure from OpenAI');
      }

      return analysis;
    } catch (error) {
      if (error instanceof Error) {
        throw new LLMAdapterError(`OpenAI analysis failed: ${error.message}`, error);
      }
      throw new LLMAdapterError('OpenAI analysis failed with unknown error', error);
    }
  }
}

