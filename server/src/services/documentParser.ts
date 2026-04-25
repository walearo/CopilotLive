import mammoth from 'mammoth';

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOC_MIME = 'application/msword';

export async function parseDocument(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === PDF_MIME) {
    // Dynamic import avoids module declaration issues with pdf-parse
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    return data.text.trim();
  }

  if (mimetype === DOCX_MIME || mimetype === DOC_MIME) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (mimetype === 'text/plain' || mimetype === 'text/markdown') {
    return buffer.toString('utf-8').trim();
  }

  throw new Error(`Unsupported file type: ${mimetype}. Please upload PDF, DOCX, or TXT.`);
}
