import { Router, Request, Response } from 'express';
import { streamInterviewAnswer } from '../services/claudeService.js';
import { AnswerRequest } from '../types.js';

const router = Router();

const FIRST_TOKEN_TIMEOUT_MS = 20_000;

// The Anthropic SDK wraps native AbortError into APIUserAbortError.
// Both names must be treated as benign client-cancellation, not real errors.
function isAbortError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.name === 'AbortError' ||
    err.name === 'APIUserAbortError' ||
    err.message === 'Request was aborted.'
  );
}

router.post('/', async (req: Request, res: Response) => {
  const { question, context } = req.body as AnswerRequest;

  if (!question?.trim()) {
    res.status(400).json({ error: 'Question is required.' });
    return;
  }

  if (question.length > 500) {
    res.status(400).json({ error: 'Question must be 500 characters or fewer.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);

  const sendEvent = (data: string) => {
    // Guard against writing to a socket that already closed
    if (!res.destroyed) res.write(`data: ${data}\n\n`);
  };

  const keepAlive = setInterval(() => {
    if (!res.destroyed) res.write(': ping\n\n');
  }, 15_000);

  const ac = new AbortController();

  // res.on('close') fires when the client disconnects (not when req body is received).
  // req.on('close') fires as soon as the request body stream finishes — too early.
  res.on('close', () => {
    if (!res.writableEnded) ac.abort();
  });

  let firstToken = false;
  const firstTokenTimer = setTimeout(() => {
    if (!firstToken) {
      ac.abort();
      sendEvent(JSON.stringify({ error: 'No response from AI within 20 seconds. Please try again.' }));
      res.end();
    }
  }, FIRST_TOKEN_TIMEOUT_MS);

  try {
    const stream = streamInterviewAnswer(question, context ?? {}, ac.signal);

    for await (const token of stream) {
      if (!firstToken) {
        firstToken = true;
        clearTimeout(firstTokenTimer);
      }
      sendEvent(JSON.stringify({ token }));
    }

    sendEvent('[DONE]');
  } catch (err) {
    clearTimeout(firstTokenTimer);
    if (!isAbortError(err)) {
      const message = err instanceof Error ? err.message : 'Failed to generate answer.';
      sendEvent(JSON.stringify({ error: message }));
    }
  } finally {
    clearInterval(keepAlive);
    clearTimeout(firstTokenTimer);
    if (!res.destroyed) res.end();
  }
});

export default router;
