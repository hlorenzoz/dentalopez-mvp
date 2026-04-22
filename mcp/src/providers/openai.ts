import OpenAI from 'openai';
import type { AIProvider, EmitFn } from './interface.js';
import type { ParseResult, ClassifyResult } from '../types.js';
import { parseClassification } from './anthropic.js';

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

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async analyze(parsed: ParseResult, fileName: string, emit: EmitFn): Promise<string> {
    const model = 'gpt-4o';
    const userContent: OpenAI.ChatCompletionUserMessageParam['content'] = [];

    if (parsed.imageBase64) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${parsed.mimeType};base64,${parsed.imageBase64}`, detail: 'high' },
      });
    } else {
      userContent.push({ type: 'text', text: `File content:\n\n${parsed.text}` });
    }
    userContent.push({ type: 'text', text: ANALYZE_PROMPT(fileName) });

    emit({ type: 'stage_api_request', stage: 'analyze', payload: { provider: this.name, model } });

    const response = await this.client.chat.completions.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: userContent }],
    });

    emit({ type: 'stage_api_response', stage: 'analyze', payload: { finish_reason: response.choices[0]?.finish_reason, usage: response.usage } });

    const summary = response.choices[0]?.message?.content ?? '';
    emit({ type: 'stage_log', stage: 'analyze', message: summary });
    return summary;
  }

  async classify(summary: string, emit: EmitFn): Promise<ClassifyResult> {
    const model = 'gpt-4o-mini';
    emit({ type: 'stage_api_request', stage: 'classify', payload: { provider: this.name, model } });

    const response = await this.client.chat.completions.create({
      model,
      max_tokens: 512,
      messages: [{ role: 'user', content: CLASSIFY_PROMPT(summary) }],
    });

    emit({ type: 'stage_api_response', stage: 'classify', payload: { finish_reason: response.choices[0]?.finish_reason } });

    const text = response.choices[0]?.message?.content ?? '{}';
    return parseClassification(text);
  }
}
