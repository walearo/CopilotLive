import { Router, Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import { parseDocument } from '../services/documentParser.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are supported.'));
    }
  },
});

// Use inline multer call so fileFilter errors are returned as JSON,
// not swallowed by Express's default HTML error handler
router.post('/', (req: Request, res: Response) => {
  upload.single('file')(req, res, async (err) => {
    if (err instanceof MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'File exceeds the 10 MB size limit.'
        : err.message;
      res.status(400).json({ error: message });
      return;
    }
    if (err) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file received. Please attach a file.' });
      return;
    }

    try {
      const text = await parseDocument(req.file.buffer, req.file.mimetype);
      if (!text) {
        res.status(422).json({ error: 'The file appears to be empty or unreadable.' });
        return;
      }
      res.json({ text, filename: req.file.originalname, charCount: text.length });
    } catch (parseErr) {
      const message = parseErr instanceof Error ? parseErr.message : 'Failed to parse document.';
      res.status(422).json({ error: message });
    }
  });
});

export default router;
