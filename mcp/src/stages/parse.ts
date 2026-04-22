import fs from 'fs';
import type { ParseResult } from '../types.js';

export async function parse(filePath: string, mimeType: string): Promise<ParseResult> {
  const fileBuffer = fs.readFileSync(filePath);

  if (mimeType === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(fileBuffer);
    return { text: data.text, mimeType };
  }

  if (mimeType.startsWith('image/')) {
    const imageBase64 = fileBuffer.toString('base64');
    return { text: '', mimeType, imageBase64 };
  }

  return { text: fileBuffer.toString('utf-8'), mimeType };
}
