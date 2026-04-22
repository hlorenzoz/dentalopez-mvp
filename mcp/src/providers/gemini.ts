import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
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

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '');

  async analyze(parsed: ParseResult, fileName: string, emit: EmitFn): Promise<string> {
    const model = 'gemini-1.5-pro';
    const genModel = this.genai.getGenerativeModel({ model });

    const parts: Part[] = [];

    if (parsed.imageBase64) {
      parts.push({
        inlineData: { data: parsed.imageBase64, mimeType: parsed.mimeType },
      });
    } else {
      parts.push({ text: `File content:\n\n${parsed.text}` });
    }
    parts.push({ text: ANALYZE_PROMPT(fileName) });

    emit({ type: 'stage_api_request', stage: 'analyze', payload: { provider: this.name, model } });

    const result = await genModel.generateContent({ contents: [{ role: 'user', parts }] });
    const response = result.response;

    emit({ type: 'stage_api_response', stage: 'analyze', payload: { finish_reason: response.candidates?.[0]?.finishReason, usage: response.usageMetadata } });

    const summary = response.text();
    emit({ type: 'stage_log', stage: 'analyze', message: summary });
    return summary;
  }

  async classify(summary: string, emit: EmitFn): Promise<ClassifyResult> {
    const model = 'gemini-1.5-flash';
    const genModel = this.genai.getGenerativeModel({ model });

    emit({ type: 'stage_api_request', stage: 'classify', payload: { provider: this.name, model } });

    const result = await genModel.generateContent(CLASSIFY_PROMPT(summary));
    const response = result.response;

    emit({ type: 'stage_api_response', stage: 'classify', payload: { finish_reason: response.candidates?.[0]?.finishReason } });

    return parseClassification(response.text());
  }
}
