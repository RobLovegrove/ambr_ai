import Anthropic from '@anthropic-ai/sdk';
import type { LLMAdapter } from './adapter';
import type { MeetingAnalysis } from '@ambr/shared';
import { LLMAdapterError } from './adapter';

export class AnthropicAdapter implements LLMAdapter {
  private client: Anthropic;
  private model: string;

  // Default to Claude Sonnet 4 (latest model)
  // Model names can vary by account/region, adjust if needed
  constructor(apiKey?: string, model: string = 'claude-sonnet-4-20250514') {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    this.client = new Anthropic({ apiKey: key });
    this.model = model;
  }

  async analyzeTranscript(transcript: string): Promise<MeetingAnalysis> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: `You are an expert meeting analyst. Analyze meeting transcripts and extract:
1. A short, descriptive title for the meeting (3-8 words, concise)
2. Action items with owners and deadlines (if mentioned)
3. Key decisions made during the meeting
4. Overall sentiment (positive, neutral, negative, or mixed)
5. A brief summary (optional)

CRITICAL INSTRUCTIONS:
- ONLY extract information that is explicitly stated in the transcript
- If the input is not a meeting transcript (e.g., a URL, code, or unrelated text), return empty arrays for actionItems and keyDecisions, set sentiment to "neutral", and use a generic title
- DO NOT invent or make up action items, decisions, or details that are not present in the transcript
- If no action items are mentioned, return an empty array
- If no decisions are mentioned, return an empty array
- Only extract information that is actually discussed in the meeting

IMPORTANT - Sentiment classification guidelines:
- "positive": Meeting shows enthusiasm, celebration, success, praise, or optimistic outlook
- "neutral": Routine updates, status reports, standard business discussions without strong emotional tone, or non-transcript content
- "negative": Concerns, problems, complaints, criticism, or pessimistic outlook
- "mixed": Combination of positive and negative elements

Most routine status update meetings should be classified as "neutral" unless there are clear positive or negative emotional indicators.

Return a JSON object with this structure:
{
  "title": "Short meeting title (3-8 words)",
  "actionItems": [{"id": "1", "description": "...", "owner": "name or null", "deadline": "date or null"}],
  "keyDecisions": [{"id": "1", "decision": "...", "context": "..."}],
  "sentiment": "positive|neutral|negative|mixed",
  "summary": "brief summary"
}

Be thorough but ONLY extract information that is actually present in the transcript. Do not invent or infer details.`,
        messages: [
          {
            role: 'user',
            content: `Analyze this meeting transcript:\n\n${transcript}`,
          },
        ],
        temperature: 0.3,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      const text = content.text;
      
      // Anthropic doesn't have built-in JSON mode, so we need to extract JSON from the response
      // Try to find JSON in the response (it might be wrapped in markdown code blocks)
      let jsonText = text;
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else {
        // Try to find JSON object directly
        const directJsonMatch = text.match(/\{[\s\S]*\}/);
        if (directJsonMatch) {
          jsonText = directJsonMatch[0];
        }
      }

      const analysis = JSON.parse(jsonText) as MeetingAnalysis;
      
      // Validate that we got the expected structure
      if (!analysis.actionItems || !analysis.keyDecisions || !analysis.sentiment) {
        throw new Error('Invalid response structure from Anthropic');
      }
      
      // Ensure title exists (generate a default if missing)
      if (!analysis.title) {
        analysis.title = 'Meeting Analysis';
      }

      return analysis;
    } catch (error) {
      if (error instanceof Error) {
        throw new LLMAdapterError(`Anthropic analysis failed: ${error.message}`, error);
      }
      throw new LLMAdapterError('Anthropic analysis failed with unknown error', error);
    }
  }
}

