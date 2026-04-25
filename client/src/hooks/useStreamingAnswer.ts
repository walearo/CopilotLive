import { useState, useCallback, useRef } from 'react';
import { InterviewContext } from '../types';

interface StreamingState {
  answer: string;
  isStreaming: boolean;
  error: string | null;
}

interface StreamingControls {
  getAnswer: (question: string, context: InterviewContext) => Promise<void>;
  clearAnswer: () => void;
  cancelStream: () => void;
}

export function useStreamingAnswer(): StreamingState & StreamingControls {
  const [answer, setAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proper ref for cancellation — plain objects are recreated on every render
  const abortControllerRef = useRef<AbortController | null>(null);

  // Accumulate tokens between RAF frames so React re-renders at ~60fps max
  // instead of once per token (200–300 renders per answer)
  const pendingRef = useRef('');
  const accumulatedRef = useRef('');
  const rafRef = useRef<number | null>(null);

  const flushPending = useCallback(() => {
    accumulatedRef.current += pendingRef.current;
    pendingRef.current = '';
    rafRef.current = null;
    setAnswer(accumulatedRef.current);
  }, []);

  const resetRefs = useCallback(() => {
    pendingRef.current = '';
    accumulatedRef.current = '';
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const getAnswer = useCallback(
    async (question: string, context: InterviewContext) => {
      // Cancel any in-flight request before starting a new one
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      resetRefs();
      setAnswer('');
      setError(null);
      setIsStreaming(true);

      try {
        const response = await fetch('/api/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, context }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Request failed' }));
          throw new Error((err as { error?: string }).error ?? 'Request failed');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let lineBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            if (data === '') continue;

            let parsed: { token?: string; error?: string };
            try {
              parsed = JSON.parse(data);
            } catch {
              continue; // skip malformed frame
            }

            if (parsed.error) throw new Error(parsed.error);

            if (parsed.token) {
              pendingRef.current += parsed.token;
              // Schedule a single RAF flush if one isn't already queued
              if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(flushPending);
              }
            }
          }
        }

        // Flush any remaining tokens that didn't make it into a RAF frame
        if (pendingRef.current) {
          if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
          flushPending();
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unknown error occurred.');
      } finally {
        setIsStreaming(false);
      }
    },
    [flushPending, resetRefs]
  );

  const clearAnswer = useCallback(() => {
    resetRefs();
    setAnswer('');
    setError(null);
  }, [resetRefs]);

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { answer, isStreaming, error, getAnswer, clearAnswer, cancelStream };
}
