import { Resend } from 'resend';
import fs from 'fs';
import type { ClassifyResult, LogEvent } from '../types.js';

export async function sendEmail(
  jobId: string,
  fileName: string,
  filePath: string,
  summary: string,
  classification: ClassifyResult,
  emit: (event: Omit<LogEvent, 'timestamp'>) => void,
): Promise<void> {
  const to = process.env.RESEND_TO;
  if (!to) {
    emit({ type: 'stage_log', stage: 'email', message: 'RESEND_TO not set — skipping email' });
    return;
  }

  const cc = process.env.RESEND_CC?.trim();
  const isDryRun = process.env.RESEND_DRY_RUN === 'true';

  const subject = `[DentaLopez] ${classification.priority.toUpperCase()} — ${classification.category}: ${fileName}`;

  const priorityColor: Record<string, string> = {
    urgent: '#dc2626',
    high: '#d97706',
    normal: '#2563eb',
    low: '#6b7280',
  };
  const color = priorityColor[classification.priority] ?? '#6b7280';
  const summaryHtml = summary.replace(/\n/g, '<br>');

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:ui-sans-serif,system-ui,sans-serif;background:#f9fafb;margin:0;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#0f172a;padding:20px 24px;">
      <h1 style="margin:0;font-size:18px;color:#f8fafc;">DentaLopez — Document Processed</h1>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;">
        <tr><td style="padding:6px 0;color:#6b7280;width:120px;">File</td><td style="padding:6px 0;font-weight:600;">${fileName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Category</td><td style="padding:6px 0;text-transform:capitalize;">${classification.category.replace(/_/g, ' ')}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Priority</td><td style="padding:6px 0;"><span style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;text-transform:uppercase;">${classification.priority}</span></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Action</td><td style="padding:6px 0;">${classification.action}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Confidence</td><td style="padding:6px 0;">${(classification.confidence * 100).toFixed(0)}%</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Job ID</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${jobId}</td></tr>
      </table>
      <h2 style="font-size:14px;font-weight:600;color:#374151;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:0;">Summary</h2>
      <p style="font-size:14px;color:#374151;line-height:1.6;margin:0;">${summaryHtml}</p>
    </div>
    <div style="padding:12px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">
      Sent by DentaLopez AI Processing Pipeline
    </div>
  </div>
</body>
</html>`;

  const fileContent = fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;

  const payload = {
    from: 'DentaLopez <onboarding@resend.dev>',
    to: [to],
    ...(cc ? { cc: [cc] } : {}),
    subject,
    html,
    ...(fileContent ? { attachments: [{ filename: fileName, content: fileContent.toString('base64') }] } : {}),
  };

  if (isDryRun) {
    emit({ type: 'stage_log', stage: 'email', message: `DRY RUN — would send to: ${to}${cc ? `, cc: ${cc}` : ''}` });
    emit({ type: 'stage_log', stage: 'email', payload, message: 'Email payload logged (dry run)' });
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send(payload);
    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emit({ type: 'stage_log', stage: 'email', message: `Email delivery failed: ${message}` });
    throw err;
  }

  emit({ type: 'stage_log', stage: 'email', message: `Email sent to ${to}${cc ? ` (cc: ${cc})` : ''}` });
}
