import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, EmitFn } from './interface.js';
import type { ParseResult, ClassifyResult } from '../types.js';

const ANALYZE_PROMPT = (fileName: string) =>
  `You are analyzing a dental document or image named "${fileName}". Provide a thorough summary of the content, identifying any clinical findings, patient information (if present), treatment plans, or relevant dental observations.`;

const CLASSIFY_PROMPT = (summary: string) => `Based on this dental document summary, classify the document.

Summary:
${summary}

Respond with a JSON object only (no markdown, no extra text):
{
  "category": "one of: xray, clinical_notes, treatment_plan, invoice, prescription, referral, other",
  "priority": "one of: urgent, high, normal, low",
  "action": "brief description of recommended action",
  "confidence": 0.0 to 1.0
}`;

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async analyze(parsed: ParseResult, fileName: string, emit: EmitFn): Promise<string> {
    const userContent: Anthropic.MessageParam['content'] = [];

    if (parsed.imageBase64) {
      userContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: parsed.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: parsed.imageBase64,
        },
      });
    } else {
      userContent.push({ type: 'text', text: `File content:\n\n${parsed.text}` });
    }
    userContent.push({ type: 'text', text: ANALYZE_PROMPT(fileName) });

    const model = 'claude-sonnet-4-6';
    emit({ type: 'stage_api_request', stage: 'analyze', payload: { provider: this.name, model } });

    const response = await this.client.messages.create({
      model,
      max_tokens: 16000,
      thinking: { type: 'enabled', budget_tokens: 8000 },
      messages: [{ role: 'user', content: userContent }],
    });

    emit({ type: 'stage_api_response', stage: 'analyze', payload: { stop_reason: response.stop_reason, usage: response.usage } });

    let summary = '';
    for (const block of response.content) {
      if (block.type === 'thinking') {
        emit({ type: 'stage_thinking', stage: 'analyze', payload: block.thinking });
      } else if (block.type === 'text') {
        summary = block.text;
        emit({ type: 'stage_log', stage: 'analyze', message: summary });
      }
    }
    return summary;
  }

  async classify(summary: string, emit: EmitFn): Promise<ClassifyResult> {
    const model = 'claude-sonnet-4-6';
    emit({ type: 'stage_api_request', stage: 'classify', payload: { provider: this.name, model } });

    const response = await this.client.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: CLASSIFY_PROMPT(summary) }],
    });

    emit({ type: 'stage_api_response', stage: 'classify', payload: { stop_reason: response.stop_reason } });

    const text = response.content.find((b) => b.type === 'text')?.text ?? '{}';
    return parseClassification(text);
  }
}

export function parseClassification(text: string): ClassifyResult {
  try {
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleaned) as ClassifyResult;
  } catch {
    return { category: 'other', priority: 'normal', action: 'Manual review required', confidence: 0.5 };
  }
}
