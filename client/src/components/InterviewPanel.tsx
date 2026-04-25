import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, RotateCcw, WifiOff, Sparkles } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useStreamingAnswer } from '../hooks/useStreamingAnswer';
import { AnswerDisplay } from './AnswerDisplay';
import { HistorySection } from './HistorySection';
import { InterviewContext, HistoryEntry } from '../types';

interface Props {
  context: InterviewContext;
  history: HistoryEntry[];
  onAnswerComplete: (entry: HistoryEntry) => void;
}

const CHIPS = [
  'Tell me about yourself',
  'Why do you want this role?',
  "What's your greatest strength?",
  'Describe a challenge you overcame',
  'Where do you see yourself in 5 years?',
  'Why are you leaving your current role?',
  'Tell me about a project you led',
  'How do you handle conflict?',
];

export function InterviewPanel({ context, history, onAnswerComplete }: Props) {
  const {
    transcript, interimTranscript, isListening, isSupported,
    error: speechError, startListening, stopListening, resetTranscript,
  } = useSpeechRecognition();

  const { answer, isStreaming, error: answerError, getAnswer, clearAnswer, cancelStream } = useStreamingAnswer();

  const [manualQuestion, setManualQuestion] = useState('');
  const [activeQuestion, setActiveQuestion] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevStreamingRef = useRef(false);

  const liveQuestion = isSupported && isListening
    ? transcript + (interimTranscript ? ` ${interimTranscript}` : '')
    : manualQuestion;

  const canSubmit = liveQuestion.trim().length > 0 && !isStreaming;

  const handleSubmit = async () => {
    const q = liveQuestion.trim();
    if (!q || isStreaming) return;
    setActiveQuestion(q);
    clearAnswer();
    if (isListening) stopListening();
    resetTranscript();
    setManualQuestion('');
    await getAnswer(q, context);
  };

  const handleReset = () => {
    // Save partial answer when resetting mid-stream
    if (isStreaming && activeQuestion && answer) {
      onAnswerComplete({
        id: crypto.randomUUID(),
        question: activeQuestion,
        answer,
        timestamp: new Date(),
      });
      cancelStream();
    }
    setActiveQuestion('');
    clearAnswer();
    resetTranscript();
    setManualQuestion('');
  };

  // Auto-save completed answers to history without requiring manual reset
  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    prevStreamingRef.current = isStreaming;
    if (wasStreaming && !isStreaming && activeQuestion && answer && !answerError) {
      onAnswerComplete({
        id: crypto.randomUUID(),
        question: activeQuestion,
        answer,
        timestamp: new Date(),
      });
    }
  }, [isStreaming]); // eslint-disable-line react-hooks/exhaustive-deps

  // Space key toggles mic when no text input is focused
  const handleSpaceKey = useCallback((e: KeyboardEvent) => {
    if (e.code !== 'Space') return;
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
    if (activeQuestion) return; // don't interfere while answer is showing
    e.preventDefault();
    if (isListening) stopListening();
    else if (isSupported) startListening();
  }, [isListening, isSupported, activeQuestion, startListening, stopListening]);

  useEffect(() => {
    window.addEventListener('keydown', handleSpaceKey);
    return () => window.removeEventListener('keydown', handleSpaceKey);
  }, [handleSpaceKey]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, [manualQuestion]);

  const hasActiveSession = !!(activeQuestion || answer);

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Live Interview
        </h2>
        {hasActiveSession && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 transition-colors py-1 px-2 rounded-lg hover:bg-slate-800"
          >
            <RotateCcw size={12} />
            New question
          </button>
        )}
      </div>

      {/* ── Input area (hidden while answering) ─────────────────────── */}
      {!activeQuestion && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shrink-0">

          {/* Mic row */}
          {isSupported && (
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              {/* Large mic button */}
              <div className="relative shrink-0">
                {isListening && (
                  <span className="absolute inset-0 rounded-full bg-red-500/25 mic-pulse" />
                )}
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isListening
                      ? 'bg-red-500 shadow-red-500/30 scale-105'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25 hover:scale-105'
                  }`}
                  aria-label={isListening ? 'Stop listening' : 'Start listening'}
                >
                  {isListening
                    ? <MicOff size={20} className="text-white" />
                    : <Mic size={20} className="text-white" />
                  }
                </button>
              </div>

              <div className="flex-1 min-w-0">
                {isListening ? (
                  <p className="text-xs text-red-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    Listening — speak the question
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Tap to capture question by voice
                  </p>
                )}
                {speechError && (
                  <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                    <WifiOff size={10} />
                    {speechError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Live transcript display */}
          {isListening && (
            <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl bg-slate-800/60 min-h-[48px] border border-slate-700/50">
              <p className="text-sm text-slate-200 leading-relaxed">
                {transcript}
                {interimTranscript && (
                  <span className="text-slate-500"> {interimTranscript}</span>
                )}
                {!transcript && !interimTranscript && (
                  <span className="text-slate-600 italic text-sm">Waiting for speech…</span>
                )}
              </p>
            </div>
          )}

          {/* Manual text input */}
          {!isListening && (
            <div className="px-4 pb-3">
              <textarea
                ref={textareaRef}
                rows={2}
                className="w-full bg-slate-800/60 rounded-xl px-3.5 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed border border-slate-700/50 focus:border-indigo-500/30 transition-colors"
                placeholder="Type the interview question here…"
                value={manualQuestion}
                onChange={(e) => setManualQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
                }}
              />
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-slate-800 mx-4" />

          {/* Suggestion chips — wrap to fit any screen width */}
          <div className="px-4 py-2.5 flex flex-wrap gap-2">
            {CHIPS.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setManualQuestion(q);
                  textareaRef.current?.focus();
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/50 transition-colors whitespace-nowrap active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Submit row */}
          <div className="px-4 pb-4 flex items-center justify-end gap-2">
            <span className="text-xs text-slate-700 hidden sm:block">⌘↵ to submit</span>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                canSubmit
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Sparkles size={15} />
              Get Answer
              {canSubmit && <Send size={13} />}
            </button>
          </div>
        </div>
      )}

      {/* ── Active question pill ─────────────────────────────────────── */}
      {activeQuestion && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
          <span className="text-xs font-bold text-indigo-400 mt-0.5 shrink-0 bg-indigo-500/20 px-1.5 py-0.5 rounded-md">Q</span>
          <p className="text-sm text-slate-100 leading-relaxed flex-1">{activeQuestion}</p>
        </div>
      )}

      {/* ── Answer — fills remaining vertical space ──────────────────── */}
      <div className="flex-1 flex flex-col min-h-0">
        <AnswerDisplay answer={answer} isStreaming={isStreaming} error={answerError} />
      </div>

      {/* ── History — hidden during streaming to give answer max space ── */}
      {!isStreaming && <HistorySection entries={history} />}
    </div>
  );
}
