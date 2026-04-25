import { useState } from 'react';
import { ChevronDown, Clock, Download, FileText, FileJson, AlignLeft } from 'lucide-react';
import { HistoryEntry } from '../types';
import { downloadAsMarkdown, downloadAsJSON, downloadAsText } from '../utils/downloadHistory';

interface Props {
  entries: HistoryEntry[];
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function EntryCard({ entry, index }: { entry: HistoryEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const words = entry.answer.split(/\s+/).filter(Boolean).length;

  return (
    <div className="relative pl-5">
      {/* Timeline dot */}
      <span className="absolute left-0 top-3.5 w-2 h-2 rounded-full bg-slate-700 ring-2 ring-slate-950" />

      <div className={`rounded-xl border overflow-hidden transition-colors ${
        expanded ? 'border-slate-700 bg-slate-900' : 'border-slate-800 bg-slate-900/60'
      }`}>
        <button
          onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-start gap-3 px-3.5 py-3 text-left active:bg-slate-800/40 transition-colors"
        >
          <span className="text-xs font-bold text-indigo-500/70 mt-0.5 shrink-0">Q{index + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 leading-snug line-clamp-2">{entry.question}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-xs text-slate-600">
                <Clock size={10} />
                {formatTime(entry.timestamp)}
              </span>
              <span className="text-slate-700 text-xs">·</span>
              <span className="text-xs text-slate-600">{words} words</span>
            </div>
          </div>
          <ChevronDown
            size={15}
            className={`text-slate-600 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>

        {expanded && (
          <div className="px-3.5 pb-3.5 border-t border-slate-800">
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap pt-3">
              {entry.answer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function HistorySection({ entries }: Props) {
  const [open, setOpen] = useState(true);
  const [showFormats, setShowFormats] = useState(false);

  if (entries.length === 0) return null;

  const formats = [
    { label: 'Markdown (.md)', icon: <FileText size={12} />, fn: () => downloadAsMarkdown(entries) },
    { label: 'Plain text (.txt)', icon: <AlignLeft size={12} />, fn: () => downloadAsText(entries) },
    { label: 'JSON (.json)',      icon: <FileJson size={12} />, fn: () => downloadAsJSON(entries) },
  ];

  return (
    <div className="border-t border-slate-800/80 pt-3 mt-1 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-200 transition-colors uppercase tracking-wider"
        >
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          History
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 normal-case tracking-normal font-medium">
            {entries.length}
          </span>
        </button>

        {/* Download menu */}
        <div className="relative">
          <button
            onClick={() => setShowFormats((p) => !p)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 min-h-[32px]"
          >
            <Download size={12} />
            Download
          </button>

          {showFormats && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setShowFormats(false)} />
              <div className="absolute bottom-full right-0 mb-1.5 z-20 w-44 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
                {formats.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => { f.fn(); setShowFormats(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors active:bg-slate-700"
                  >
                    <span className="text-slate-500">{f.icon}</span>
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {open && (
        <div className="relative flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {/* Timeline track */}
          <div className="absolute left-[3px] top-3 bottom-3 w-px bg-slate-800" />
          {entries.map((entry, i) => (
            <EntryCard key={entry.id} entry={entry} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
