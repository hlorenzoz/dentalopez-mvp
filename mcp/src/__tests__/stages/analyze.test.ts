import Anthropic from '@anthropic-ai/sdk';

jest.mock('@anthropic-ai/sdk');

const mockCreate = jest.fn();
(Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
  messages: { create: mockCreate },
}) as unknown as Anthropic);

import { analyze } from '../../stages/analyze';

beforeEach(() => jest.clearAllMocks());

test('emits stage_thinking for thinking blocks', async () => {
  mockCreate.mockResolvedValue({
    content: [
      { type: 'thinking', thinking: 'Let me think about this...' },
      { type: 'text', text: 'This is a dental X-ray showing...' },
    ],
    stop_reason: 'end_turn',
    usage: { input_tokens: 100, output_tokens: 50 },
  });

  const events: { type: string; payload?: unknown }[] = [];
  const emit = (e: { type: string; payload?: unknown }) => events.push(e);

  const summary = await analyze({ text: 'test', mimeType: 'text/plain' }, 'xray.jpg', emit as never);

  expect(summary).toBe('This is a dental X-ray showing...');
  const thinkingEvent = events.find((e) => e.type === 'stage_thinking');
  expect(thinkingEvent).toBeDefined();
  expect(thinkingEvent?.payload).toBe('Let me think about this...');
});

test('captures summary from text block', async () => {
  mockCreate.mockResolvedValue({
    content: [{ type: 'text', text: 'Summary of document' }],
    stop_reason: 'end_turn',
    usage: {},
  });

  const emit = jest.fn();
  const result = await analyze({ text: 'content', mimeType: 'text/plain' }, 'doc.txt', emit);
  expect(result).toBe('Summary of document');
});
