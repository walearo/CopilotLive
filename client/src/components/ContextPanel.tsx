import React, { useRef, useState } from 'react';
import {
  Upload, FileText, Briefcase, StickyNote,
  CheckCircle2, Loader2, X, ChevronDown, AlertCircle,
} from 'lucide-react';
import { InterviewContext } from '../types';

interface Props {
  context: InterviewContext;
  onChange: (ctx: InterviewContext) => void;
}

// ── Section accordion ────────────────────────────────────────────────────────

interface SectionProps {
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  filled: boolean;
  summary?: string;
  children: React.ReactNode;
}

function Section({ label, icon, accentColor, filled, summary, children }: SectionProps) {
  const [open, setOpen] = useState(!filled);

  // Auto-open when cleared
  React.useEffect(() => {
    if (!filled) setOpen(true);
  }, [filled]);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors ${
      filled ? 'border-slate-700/50 bg-slate-900' : 'border-slate-700/80 bg-slate-900'
    }`}>
      {/* Section header — always visible */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-800/50 transition-colors"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          filled ? `${accentColor} bg-opacity-15` : 'bg-slate-800'
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-200">{label}</p>
          {filled && summary && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{summary}</p>
          )}
        </div>
        {filled && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
        <ChevronDown
          size={16}
          className={`text-slate-600 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable body */}
      {open && (
        <div className="border-t border-slate-800">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Upload drop zone + textarea ───────────────────────────────────────────────

interface FieldProps {
  value: string;
  filename?: string;
  placeholder: string;
  uploading: boolean;
  onFileUpload: (file: File) => Promise<void>;
  onTextChange: (text: string) => void;
  onClear: () => void;
}

function FieldBody({
  value, filename, placeholder, uploading,
  onFileUpload, onTextChange, onClear,
}: FieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const hasContent = value.trim().length > 0;

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await onFileUpload(file);
  };

  return (
    <div className="p-3 flex flex-col gap-2">
      {/* Hidden input — always present so Replace button can trigger it */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileUpload(f);
          e.target.value = '';
        }}
      />

      {/* File upload zone (only show when empty) */}
      {!hasContent && (
        <div
          className={`rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            dragOver
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-1.5 py-4">
            {uploading
              ? <Loader2 size={20} className="text-indigo-400 animate-spin" />
              : <Upload size={20} className="text-slate-600" />
            }
            <span className="text-xs text-slate-500 font-medium">
              {uploading ? 'Parsing file…' : 'Drop file or tap to upload'}
            </span>
            <span className="text-xs text-slate-700">PDF · DOCX · TXT</span>
          </div>
        </div>
      )}

      {/* Loaded file badge */}
      {hasContent && filename && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <FileText size={13} className="text-emerald-400 shrink-0" />
          <span className="text-xs text-emerald-300 truncate flex-1">{filename}</span>
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs text-slate-500 hover:text-indigo-400 px-1.5 py-0.5 rounded hover:bg-indigo-500/10 transition-colors shrink-0"
            title="Replace file"
          >
            Replace
          </button>
          <button
            onClick={onClear}
            className="text-slate-500 hover:text-red-400 transition-colors shrink-0 p-0.5"
            title="Remove"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Text area */}
      <textarea
        className="w-full bg-slate-800/50 rounded-xl px-3 py-2.5 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/40 leading-relaxed"
        rows={hasContent ? 5 : 3}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onTextChange(e.target.value)}
      />

      {/* Clear text button (only when no filename — filename has its own clear) */}
      {hasContent && !filename && (
        <button
          onClick={onClear}
          className="self-end flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 transition-colors"
        >
          <X size={11} />
          Clear
        </button>
      )}
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────

function SetupProgress({ score }: { score: number }) {
  const labels = ['Resume', 'Job Description', 'Notes'];
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="flex-1 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < score ? 'bg-indigo-500' : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium shrink-0 ${
        score === 3 ? 'text-emerald-400' : score > 0 ? 'text-amber-400' : 'text-slate-600'
      }`}>
        {score === 0 ? 'Not set up' : score === 3 ? 'Ready' : `${labels[score - 1]} added`}
      </span>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ContextPanel({ context, onChange }: Props) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [filenames, setFilenames] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (field: keyof InterviewContext, file: File) => {
    setUploading((p) => ({ ...p, [field]: true }));
    setUploadError(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      onChange({ ...context, [field]: data.text });
      setFilenames((p) => ({ ...p, [field]: data.filename }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading((p) => ({ ...p, [field]: false }));
    }
  };

  const clear = (field: keyof InterviewContext) => {
    onChange({ ...context, [field]: '' });
    setFilenames((p) => ({ ...p, [field]: '' }));
  };

  const score = [context.resume, context.jobDescription, context.notes].filter(
    (v) => v.trim().length > 0
  ).length;

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-1">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">Interview Setup</h2>
        <SetupProgress score={score} />
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle size={14} className="shrink-0" />
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="ml-auto shrink-0">
            <X size={13} />
          </button>
        </div>
      )}

      <Section
        label="Resume"
        icon={<FileText size={16} className="text-indigo-400" />}
        accentColor="bg-indigo-500"
        filled={context.resume.trim().length > 0}
        summary={filenames.resume || `${wordCount(context.resume)} words`}
      >
        <FieldBody
          value={context.resume}
          filename={filenames.resume}
          placeholder="Paste your resume text here, or upload a file…"
          uploading={!!uploading.resume}
          onFileUpload={(f) => handleUpload('resume', f)}
          onTextChange={(t) => onChange({ ...context, resume: t })}
          onClear={() => clear('resume')}
        />
      </Section>

      <Section
        label="Job Description"
        icon={<Briefcase size={16} className="text-violet-400" />}
        accentColor="bg-violet-500"
        filled={context.jobDescription.trim().length > 0}
        summary={filenames.jobDescription || `${wordCount(context.jobDescription)} words`}
      >
        <FieldBody
          value={context.jobDescription}
          filename={filenames.jobDescription}
          placeholder="Paste the job description or upload a file…"
          uploading={!!uploading.jobDescription}
          onFileUpload={(f) => handleUpload('jobDescription', f)}
          onTextChange={(t) => onChange({ ...context, jobDescription: t })}
          onClear={() => clear('jobDescription')}
        />
      </Section>

      <Section
        label="Notes & Talking Points"
        icon={<StickyNote size={16} className="text-amber-400" />}
        accentColor="bg-amber-500"
        filled={context.notes.trim().length > 0}
        summary={`${wordCount(context.notes)} words`}
      >
        <FieldBody
          value={context.notes}
          filename={filenames.notes}
          placeholder="Key achievements, specific stories, numbers to mention, things to emphasize…"
          uploading={!!uploading.notes}
          onFileUpload={(f) => handleUpload('notes', f)}
          onTextChange={(t) => onChange({ ...context, notes: t })}
          onClear={() => clear('notes')}
        />
      </Section>

      {score >= 2 && (
        <p className="text-xs text-center text-slate-600 pt-1">
          Switch to the Interview tab when ready →
        </p>
      )}
    </div>
  );
}
