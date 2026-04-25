import { useEffect, useRef, useState, useMemo } from 'react';
import { Copy, CheckCheck, AlertCircle, MessageSquare } from 'lucide-react';

interface Props {
  answer: string;
  isStreaming: boolean;
  error: string | null;
}

export function AnswerDisplay({ answer, isStreaming, error }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const scrollRafRef = useRef<number | null>(null);

  // One scroll per animation frame — avoids forced reflows on every token
  useEffect(() => {
    if (!isStreaming) return;
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      const el = containerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
      scrollRafRef.current = null;
    });
  }, [answer, isStreaming]);

  // Only compute stats when streaming finishes
  const stats = useMemo(() => {
    if (isStreaming || !answer) return null;
    const words = answer.split(/\s+/).filter(Boolean).length;
    const secs = Math.round((words / 130) * 60);
    const time = secs >= 60 ? `~${Math.floor(secs / 60)}m ${secs % 60}s` : `~${secs}s`;
    return { words, time };
  }, [answer, isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <span className="leading-relaxed">{error}</span>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!answer && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-700 rounded-2xl border border-slate-800/60">
        <MessageSquare size={32} strokeWidth={1.5} />
        <p className="text-sm">Your answer will stream here</p>
      </div>
    );
  }

  // ── Answer ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2 flex-1 min-h-0">

      {/* Meta bar */}
      <div className="flex items-center justify-between shrink-0 px-0.5">
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
              {/* Three-dot typing indicator */}
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
              Writing answer…
            </span>
          ) : stats ? (
            <span className="text-xs text-slate-400">
              {stats.words} words · {stats.time} to speak
            </span>
          ) : null}
        </div>

        {answer && !isStreaming && (
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors border min-h-[32px] active:scale-95 ${
              copied
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-slate-500 hover:text-slate-200 bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
            }`}
          >
            {copied
              ? <><CheckCheck size={13} /> Copied</>
              : <><Copy size={13} /> Copy</>
            }
          </button>
        )}
      </div>

      {/* Answer text container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-5"
      >
        <p className="text-base leading-7 text-slate-100 whitespace-pre-wrap">
          {answer}
          {isStreaming && <span className="typing-cursor" />}
        </p>
      </div>
    </div>
  );
}
