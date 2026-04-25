import { HistoryEntry } from '../types';

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAsMarkdown(entries: HistoryEntry[]) {
  if (entries.length === 0) return;

  const sessionDate = formatDate(entries[0].timestamp);
  const lines: string[] = [
    `# Interview Session — ${sessionDate}`,
    `*${entries.length} question${entries.length !== 1 ? 's' : ''}*`,
    '',
  ];

  entries.forEach((entry, i) => {
    lines.push(`---`, '');
    lines.push(`## Q${i + 1} — ${formatTime(entry.timestamp)}`, '');
    lines.push(`**Question:** ${entry.question}`, '');
    lines.push(`**Answer:**`, '');
    lines.push(entry.answer, '');
  });

  const filename = `interview-${entries[0].timestamp.toISOString().slice(0, 10)}.md`;
  triggerDownload(lines.join('\n'), filename, 'text/markdown;charset=utf-8');
}

export function downloadAsJSON(entries: HistoryEntry[]) {
  if (entries.length === 0) return;

  const data = entries.map((e, i) => ({
    index: i + 1,
    timestamp: e.timestamp.toISOString(),
    question: e.question,
    answer: e.answer,
  }));

  const filename = `interview-${entries[0].timestamp.toISOString().slice(0, 10)}.json`;
  triggerDownload(JSON.stringify(data, null, 2), filename, 'application/json');
}

export function downloadAsText(entries: HistoryEntry[]) {
  if (entries.length === 0) return;

  const sessionDate = formatDate(entries[0].timestamp);
  const lines: string[] = [
    `INTERVIEW SESSION — ${sessionDate.toUpperCase()}`,
    '='.repeat(60),
    '',
  ];

  entries.forEach((entry, i) => {
    lines.push(`Q${i + 1} [${formatTime(entry.timestamp)}]`);
    lines.push('-'.repeat(40));
    lines.push(`QUESTION: ${entry.question}`);
    lines.push('');
    lines.push(`ANSWER:`);
    lines.push(entry.answer);
    lines.push('');
  });

  const filename = `interview-${entries[0].timestamp.toISOString().slice(0, 10)}.txt`;
  triggerDownload(lines.join('\n'), filename, 'text/plain;charset=utf-8');
}
