import type { AIProvider } from './interface.js';
import { AnthropicProvider } from './anthropic.js';
import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';

export type { AIProvider } from './interface.js';

export type ProviderName = 'openai' | 'gemini' | 'anthropic';

function detectProviderName(): ProviderName {
  if (process.env.OPENAI_API_KEY?.trim()) return 'openai';
  if (process.env.GOOGLE_API_KEY?.trim()) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY?.trim()) return 'anthropic';
  throw new Error(
    'No AI provider configured. Set OPENAI_API_KEY, GOOGLE_API_KEY, or ANTHROPIC_API_KEY.',
  );
}

let _provider: AIProvider | null = null;

export function getProvider(): AIProvider {
  if (_provider) return _provider;

  const name = detectProviderName();
  switch (name) {
    case 'openai':    _provider = new OpenAIProvider();    break;
    case 'gemini':    _provider = new GeminiProvider();    break;
    case 'anthropic': _provider = new AnthropicProvider(); break;
  }

  console.log(`[AI] Using provider: ${_provider!.name}`);
  return _provider!;
}
