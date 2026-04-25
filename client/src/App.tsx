import { useState, useCallback } from 'react';
import { Target, Settings, Mic } from 'lucide-react';
import { ContextPanel } from './components/ContextPanel';
import { InterviewPanel } from './components/InterviewPanel';
import { InterviewContext, HistoryEntry } from './types';

const DEFAULT_CONTEXT: InterviewContext = { resume: '', jobDescription: '', notes: '' };

type Tab = 'context' | 'interview';

export default function App() {
  const [context, setContext] = useState<InterviewContext>(DEFAULT_CONTEXT);
  const [activeTab, setActiveTab] = useState<Tab>('context');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleAnswerComplete = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => [...prev, entry]);
  }, []);

  const contextScore = [context.resume, context.jobDescription, context.notes].filter(
    (v) => v.trim().length > 0
  ).length;
  const contextReady = contextScore >= 1;

  return (
    /* h-dvh uses 100dvh which tracks the visible viewport on mobile browsers,
       preventing the iOS Safari address-bar overlap issue with 100vh */
    <div className="h-dvh flex flex-col overflow-hidden bg-slate-950">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center gap-3 px-4 h-14 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-sm z-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
            <Target size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-slate-100 tracking-tight">CopilotLive</span>
            <span className="hidden sm:inline text-slate-600 text-xs ml-2">Interview Assistant</span>
          </div>
        </div>

        {/* Desktop status pills */}
        <div className="hidden lg:flex items-center gap-3 text-xs shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
            contextReady
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-slate-600 bg-slate-800/50 border-slate-700/50'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${contextReady ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            {contextReady ? `${contextScore}/3 context` : 'No context'}
          </div>
          {history.length > 0 && (
            <div className="text-slate-400 px-2 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
              {history.length} answered
            </div>
          )}
          <div className="text-slate-500 hidden xl:block">claude-sonnet-4-6</div>
        </div>

        {/* Mobile tab switcher */}
        <div className="lg:hidden flex items-center bg-slate-900 rounded-xl border border-slate-800 p-1 shrink-0">
          <TabButton active={activeTab === 'context'} onClick={() => setActiveTab('context')}>
            <Settings size={14} />
            <span>Setup</span>
            {contextScore === 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            )}
          </TabButton>
          <TabButton active={activeTab === 'interview'} onClick={() => setActiveTab('interview')}>
            <Mic size={14} />
            <span>Interview</span>
          </TabButton>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0">

        {/* Desktop two-panel */}
        <div className="hidden lg:grid lg:grid-cols-[360px_1fr] h-full">
          <aside className="border-r border-slate-800/80 overflow-y-auto">
            <div className="p-5">
              <ContextPanel context={context} onChange={setContext} />
            </div>
          </aside>
          <section className="overflow-y-auto flex flex-col p-5">
            <InterviewPanel
              context={context}
              history={history}
              onAnswerComplete={handleAnswerComplete}
            />
          </section>
        </div>

        {/* Mobile: context tab — scrolls freely */}
        {activeTab === 'context' && (
          <div className="lg:hidden h-full overflow-y-auto">
            <div className="p-4 pb-safe">
              <ContextPanel context={context} onChange={setContext} />
            </div>
          </div>
        )}

        {/* Mobile: interview tab — fixed height so answer area fills correctly */}
        {activeTab === 'interview' && (
          <div className="lg:hidden h-full overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 p-4 pb-safe flex flex-col">
              <InterviewPanel
                context={context}
                history={history}
                onAnswerComplete={handleAnswerComplete}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
        active
          ? 'bg-slate-700 text-slate-100 shadow-sm'
          : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  );
}
