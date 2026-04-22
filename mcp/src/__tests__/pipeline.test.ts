jest.mock('../stages/parse');
jest.mock('../stages/analyze');
jest.mock('../stages/classify');
jest.mock('../stages/email');
jest.mock('../store');

import { runPipeline } from '../pipeline';
import * as parse from '../stages/parse';
import * as analyze from '../stages/analyze';
import * as classify from '../stages/classify';
import * as email from '../stages/email';
import * as store from '../store';

const mockParse = parse.parse as jest.MockedFunction<typeof parse.parse>;
const mockAnalyze = analyze.analyze as jest.MockedFunction<typeof analyze.analyze>;
const mockClassify = classify.classify as jest.MockedFunction<typeof classify.classify>;
const mockEmail = email.sendEmail as jest.MockedFunction<typeof email.sendEmail>;
const mockPushEvent = store.pushEvent as jest.MockedFunction<typeof store.pushEvent>;
const mockMarkDone = store.markDone as jest.MockedFunction<typeof store.markDone>;

global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);

beforeEach(() => {
  jest.clearAllMocks();
  mockParse.mockResolvedValue({ text: 'parsed text', mimeType: 'text/plain' });
  mockAnalyze.mockResolvedValue('AI summary');
  mockClassify.mockResolvedValue({
    category: 'clinical_notes',
    priority: 'normal',
    action: 'Review',
    confidence: 0.9,
  });
  mockEmail.mockResolvedValue(undefined);
});

test('emits stage_start and stage_complete for all four stages', async () => {
  await runPipeline('job1', '/uploads/job1/file.txt', 'file.txt', 'text/plain');

  const types = (mockPushEvent.mock.calls as Array<[string, { type: string }]>).map(([, e]) => e.type);
  const stages = (mockPushEvent.mock.calls as Array<[string, { stage?: string }]>)
    .filter(([, e]) => e.stage)
    .map(([, e]) => e.stage);

  expect(types).toContain('stage_start');
  expect(types).toContain('stage_complete');
  expect(types).toContain('done');

  expect(stages).toContain('parse');
  expect(stages).toContain('analyze');
  expect(stages).toContain('classify');
  expect(stages).toContain('email');
});

test('calls email exactly once', async () => {
  await runPipeline('job2', '/uploads/job2/file.txt', 'file.txt', 'text/plain');
  expect(mockEmail).toHaveBeenCalledTimes(1);
});

test('marks job done', async () => {
  await runPipeline('job3', '/uploads/job3/file.txt', 'file.txt', 'text/plain');
  expect(mockMarkDone).toHaveBeenCalledWith('job3');
});

test('emits error event and still marks done when a stage throws', async () => {
  mockAnalyze.mockRejectedValue(new Error('API error'));

  await runPipeline('job4', '/uploads/job4/file.txt', 'file.txt', 'text/plain');

  const types = (mockPushEvent.mock.calls as Array<[string, { type: string }]>).map(([, e]) => e.type);
  expect(types).toContain('stage_error');
  expect(types).toContain('done');
  expect(mockMarkDone).toHaveBeenCalledWith('job4');
});
