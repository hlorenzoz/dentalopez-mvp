jest.mock('resend');
jest.mock('fs');

import { Resend } from 'resend';
import fs from 'fs';
import { sendEmail } from '../../stages/email';

const MockResend = Resend as jest.MockedClass<typeof Resend>;
const mockSend = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  MockResend.mockImplementation(() => ({ emails: { send: mockSend } }) as unknown as Resend);
  (fs.existsSync as jest.Mock).mockReturnValue(false);
  (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('file content'));
  mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });
});

const classification = { category: 'xray', priority: 'urgent', action: 'Review immediately', confidence: 0.98 };

test('sends to RESEND_TO', async () => {
  process.env.RESEND_TO = 'doctor@clinic.com';
  delete process.env.RESEND_CC;
  process.env.RESEND_DRY_RUN = 'false';

  const emit = jest.fn();
  await sendEmail('job1', 'xray.jpg', '/uploads/job1/xray.jpg', 'Summary', classification, emit);

  expect(mockSend).toHaveBeenCalledTimes(1);
  const payload = mockSend.mock.calls[0][0] as { to: string[]; cc?: string[] };
  expect(payload.to).toContain('doctor@clinic.com');
});

test('omits CC when RESEND_CC is empty', async () => {
  process.env.RESEND_TO = 'doctor@clinic.com';
  process.env.RESEND_CC = '';
  process.env.RESEND_DRY_RUN = 'false';

  const emit = jest.fn();
  await sendEmail('job2', 'file.jpg', '/uploads/job2/file.jpg', 'Summary', classification, emit);

  const payload = mockSend.mock.calls[0][0] as { cc?: string[] };
  expect(payload.cc).toBeUndefined();
});

test('includes CC when RESEND_CC is set', async () => {
  process.env.RESEND_TO = 'doctor@clinic.com';
  process.env.RESEND_CC = 'assistant@clinic.com';
  process.env.RESEND_DRY_RUN = 'false';

  const emit = jest.fn();
  await sendEmail('job3', 'file.jpg', '/uploads/job3/file.jpg', 'Summary', classification, emit);

  const payload = mockSend.mock.calls[0][0] as { cc?: string[] };
  expect(payload.cc).toContain('assistant@clinic.com');
});

test('skips send when RESEND_DRY_RUN=true', async () => {
  process.env.RESEND_TO = 'doctor@clinic.com';
  process.env.RESEND_DRY_RUN = 'true';

  const emit = jest.fn();
  await sendEmail('job4', 'file.jpg', '/uploads/job4/file.jpg', 'Summary', classification, emit);

  expect(mockSend).not.toHaveBeenCalled();
  const calls = (emit as jest.Mock).mock.calls as Array<[{ message?: string }]>;
  expect(calls.some(([e]) => e.message?.includes('DRY RUN'))).toBe(true);
});

test('skips email entirely when RESEND_TO is not set', async () => {
  delete process.env.RESEND_TO;
  process.env.RESEND_DRY_RUN = 'false';

  const emit = jest.fn();
  await sendEmail('job5', 'file.jpg', '/uploads/job5/file.jpg', 'Summary', classification, emit);

  expect(mockSend).not.toHaveBeenCalled();
});
