import Anthropic from '@anthropic-ai/sdk';

jest.mock('@anthropic-ai/sdk');

const mockCreate = jest.fn();
(Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
  messages: { create: mockCreate },
}) as unknown as Anthropic);

import { classify } from '../../stages/classify';

beforeEach(() => jest.clearAllMocks());

test('parses JSON response into ClassifyResult', async () => {
  const classification = { category: 'xray', priority: 'high', action: 'Urgent review', confidence: 0.95 };
  mockCreate.mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(classification) }],
    stop_reason: 'end_turn',
  });

  const emit = jest.fn();
  const result = await classify('X-ray summary here', 'xray.jpg', emit);

  expect(result.category).toBe('xray');
  expect(result.priority).toBe('high');
  expect(result.action).toBe('Urgent review');
  expect(result.confidence).toBeCloseTo(0.95);
});

test('falls back gracefully when JSON is invalid', async () => {
  mockCreate.mockResolvedValue({
    content: [{ type: 'text', text: 'not valid json' }],
    stop_reason: 'end_turn',
  });

  const emit = jest.fn();
  const result = await classify('Some summary', 'doc.txt', emit);

  expect(result.category).toBe('other');
  expect(result.priority).toBe('normal');
});

test('stage_complete payload has required fields', async () => {
  mockCreate.mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify({ category: 'invoice', priority: 'low', action: 'Archive', confidence: 0.8 }) }],
    stop_reason: 'end_turn',
  });

  const events: { type: string; message?: string }[] = [];
  const emit = (e: { type: string; message?: string }) => events.push(e);

  await classify('Invoice summary', 'invoice.pdf', emit as never);

  const logEvent = events.find((e) => e.type === 'stage_log');
  expect(logEvent?.message).toContain('invoice');
});
